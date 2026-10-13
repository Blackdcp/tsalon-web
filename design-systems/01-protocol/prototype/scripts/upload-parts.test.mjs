import assert from 'node:assert/strict';
import { before, after, beforeEach, test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as parts from '../src/lib/upload-parts.ts';
import * as cadence from '../src/lib/upload-cadence.ts';
import * as uploadBody from '../src/lib/upload-body.ts';
import * as uploadError from '../src/lib/upload-error.ts';
import { syncCodexLedger, readCodexLedgerView } from '../src/lib/codex-ledger.ts';
import { startLocalRedis } from './helpers/local-redis.mjs';
import { turnRecord, ledgerPayload } from './helpers/codex-fixtures.mjs';
let server, redis;
before(async () => { server = await startLocalRedis(); redis = server.redis; });
after(async () => { await server?.stop(); });
beforeEach(async () => { await redis.flushdb(); });
const batch = 'a'.repeat(32);
const stage = (index, records, id = batch) => ({ id, index, count: 2, records });

function route(updateTokenUsage) {
  const code = ts.transpileModule(readFileSync(new URL('../src/pages/api/rank/upload.ts', import.meta.url), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, Response, console: { error() {} }, require(name) {
    if (name.endsWith('/kv')) return { kv: redis, getUserIdByToken: async () => 'u1', updateTokenUsage };
    if (name.endsWith('/codex-ledger.ts')) return { storeAccountAuditWithTimeout: async () => null };
    if (name.endsWith('/upload-parts.ts')) return parts;
    if (name.endsWith('/upload-cadence.ts')) return cadence;
    if (name.endsWith('/upload-body.ts')) return uploadBody;
    if (name.endsWith('/upload-error.ts')) return uploadError;
    throw new Error(name);
  } });
  return async body => {
    const response = await exports.POST({ request: new Request('https://test/upload/', { method: 'POST',
      body: JSON.stringify({ token: 'test', device_id: 'd1', data: {}, ...body }) }) });
    return { status: response.status, body: await response.json() };
  };
}

test('parts publish only after complete commit; replay does not consume another allowance', async () => {
  let commits = 0;
  const post = route(async (user, name, image, data, device, options) => {
    commits++;
    const result = await syncCodexLedger(redis, user, device, options.codexLedger);
    return { codex: { total: result.lifetime.total, turns: options.codexLedger.records.length } };
  });
  const records = [turnRecord('a', 10), turnRecord('b', 20)];
  const commit = id => ({ codex_ledger: { ...ledgerPayload(records), records: undefined, upload_id: id } });
  assert.equal((await post({ upload_part: stage(0, [records[0]]) })).body.staged, true);
  assert.equal((await readCodexLedgerView(redis, 'u1')).generation, null);
  assert.equal((await post(commit(batch))).status, 400, 'incomplete commit must release its lease');
  assert.equal((await post({ upload_part: stage(1, [records[1]]) })).body.staged, true);
  assert.equal((await post(commit(batch))).body.codex.total, 30);
  assert.equal((await post(commit(batch))).body.codex.total, 30);
  assert.equal(commits, 1);
  const originalGet = redis.get.bind(redis);
  let missed = false;
  redis.get = async key => {
    if (!missed && key === parts.uploadReceiptKey('u1', 'd1', batch)) { missed = true; return null; }
    return originalGet(key);
  };
  try { assert.equal((await post(commit(batch))).body.codex.total, 30, 'recheck a receipt written between initial read and claim'); }
  finally { redis.get = originalGet; }
  assert.equal(commits, 1);
  const second = 'b'.repeat(32);
  await post({ upload_part: stage(0, [records[0]], second) });
  await post({ upload_part: stage(1, [records[1]], second) });
  assert.equal((await post(commit(second))).body.codex.total, 30);
  assert.equal(commits, 2);
  assert.equal((await post(commit(batch))).body.codex.total, 30, 'new batch must not erase old success receipts');
  missed = false;
  redis.get = async key => {
    if (!missed && key === parts.uploadReceiptKey('u1', 'd1', second)) { missed = true; return null; }
    return originalGet(key);
  };
  try { assert.equal((await post(commit(second))).body.codex.total, 30, 'receipt wins a race with the last daily allowance'); }
  finally { redis.get = originalGet; }
  assert.equal((await post({ codex_ledger: ledgerPayload(records) })).body.code, 'daily_upload_limit');
});

test('a frozen commit rejects batch replacement and only its owner can unfreeze it', async () => {
  const records = [turnRecord('frozen-a', 10), turnRecord('frozen-b', 20)];
  await parts.stageUploadPart(redis, 'u1', 'd1', stage(0, [records[0]]));
  await parts.stageUploadPart(redis, 'u1', 'd1', stage(1, [records[1]]));
  const frozen = await parts.readUploadParts(redis, 'u1', 'd1', batch, 'owner');
  assert.equal(frozen.length, 2);
  const next = 'c'.repeat(32);
  await assert.rejects(parts.stageUploadPart(redis, 'u1', 'd1', stage(0, [records[0]], next)), /Invalid Codex ledger/);
  await parts.releaseUploadParts(redis, 'u1', 'd1', batch, 'wrong-owner');
  await assert.rejects(parts.stageUploadPart(redis, 'u1', 'd1', stage(0, [records[0]], next)), /Invalid Codex ledger/);
  await parts.releaseUploadParts(redis, 'u1', 'd1', batch, 'owner');
  await parts.stageUploadPart(redis, 'u1', 'd1', stage(0, [records[0]], next));
});

test('staging is isolated, bounded, idempotent and rejects conflicting parts', async () => {
  const record = turnRecord('x', 1);
  await parts.stageUploadPart(redis, 'u1', 'd1', stage(0, [record]));
  await parts.stageUploadPart(redis, 'u1', 'd1', stage(0, [record]));
  await assert.rejects(parts.stageUploadPart(redis, 'u1', 'd1', stage(0, [turnRecord('x', 2)])), /Invalid Codex ledger/);
  await assert.rejects(parts.readUploadParts(redis, 'u1', 'd2', batch), /Invalid Codex ledger/);
  await assert.rejects(parts.readUploadParts(redis, 'u2', 'd1', batch), /Invalid Codex ledger/);
  await assert.rejects(parts.stageUploadPart(redis, 'u1', 'd1', { ...stage(0, [record]), count: 65 }), /Invalid Codex ledger/);
  // Starting over replaces unpublished staging, never a published generation.
  const next = 'c'.repeat(32);
  await parts.stageUploadPart(redis, 'u1', 'd1', stage(0, [record], next));
  await assert.rejects(parts.stageUploadPart(redis, 'u1', 'd1', stage(1, [record])), /Invalid Codex ledger/);
});

test('frozen parts are read in bounded Redis responses', async () => {
  const records = Array.from({ length: 200 }, (_, i) => turnRecord(`bounded-${i}`, i + 1));
  await parts.stageUploadPart(redis, 'u1', 'd1', stage(0, records.slice(0, 100)));
  await parts.stageUploadPart(redis, 'u1', 'd1', stage(1, records.slice(100)));
  const first = await redis.hget(parts.uploadPartsKey('u1', 'd1'), 'part:0');
  const second = await redis.hget(parts.uploadPartsKey('u1', 'd1'), 'part:1');
  const limit = Math.max(first.length, second.length) + 256;
  const bounded = new Proxy(redis, { get(target, name) {
    const method = target[name];
    if (typeof method !== 'function') return method;
    return async (...args) => {
      const result = await method.apply(target, args);
      assert.ok(Buffer.byteLength(JSON.stringify(result)) <= limit, 'Redis response exceeded one part');
      return result;
    };
  } });
  const restored = await parts.readUploadParts(bounded, 'u1', 'd1', batch, 'bounded-owner');
  assert.deepEqual(restored.map(r => r.turn_key), records.map(r => r.turn_key));
});
