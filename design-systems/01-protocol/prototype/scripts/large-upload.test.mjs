import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import * as agent from '../public/scripts/codex-ledger.mjs';
import { readUploadJson } from '../src/lib/upload-body.ts';
import { validateTurnRecord } from '../src/lib/tokenrank-domain.mjs';
import { syncCodexLedger, readCodexLedgerView } from '../src/lib/codex-ledger.ts';
import { startLocalRedis } from './helpers/local-redis.mjs';
import { tempHome, writeSession, sessionMeta, turnContext, tokenCount, turnRecord, ledgerPayload } from './helpers/codex-fixtures.mjs';

for (const [kind, exitCode] of [['rejected', 1], ['network', 1], ['success', 0], ['skipped', 0]]) {
  test(`agent exit-code reports ${kind} uploads to the scheduler`, t => {
    const home = tempHome(t);
    const preload = `import cp from 'node:child_process';
      import { syncBuiltinESMExports } from 'node:module';
      cp.spawn = () => { throw new Error('Test disables subprocesses'); };
      syncBuiltinESMExports();
      globalThis.fetch = async () => {
        if (${JSON.stringify(kind)} === 'network') throw new Error('Test network failure');
        return Response.json(${JSON.stringify(kind === 'rejected' ? { success: false, message: 'Test rejection' } : { success: true, skipped: kind === 'skipped' })});
      };`;
    const result = spawnSync(process.execPath, ['--import', `data:text/javascript,${encodeURIComponent(preload)}`,
      fileURLToPath(new URL('../public/scripts/agent.mjs', import.meta.url)), '--token=test-only'], {
      env: { ...process.env, HOME: home, USERPROFILE: home, APPDATA: home, LOCALAPPDATA: home },
      encoding: 'utf8', windowsHide: true, timeout: 15000,
    });
    assert.equal(result.status, exitCode, result.stdout + result.stderr);
    if (exitCode === 1) assert.doesNotMatch(result.stdout, /Successfully uploaded/);
  });
}

test('component counter corrections produce consistent turn and daily totals', async t => {
  const home = tempHome(t);
  writeSession(home, 'correction.jsonl', [sessionMeta('s'), turnContext('t1', 'gpt-5.6-sol'),
    tokenCount('2026-10-13T01:00:00Z', { input_tokens: 1000, output_tokens: 15 }),
    turnContext('t2', 'gpt-5.6-sol'),
    tokenCount('2026-10-13T01:01:00Z', { input_tokens: 2465, output_tokens: 0 }),
  ]);
  const result = await agent.scanCodexLedger(home);
  assert.equal(result.records.length, 2);
  assert.ok(result.records.every(validateTurnRecord));
  assert.equal(result.summary.total, 2480, 'sum non-negative component deltas; never clamp derived total separately');
});

test('session scans stream JSONL instead of loading an entire multi-GB file', async t => {
  const home = tempHome(t);
  writeSession(home, 'streamed.jsonl', [sessionMeta('streamed'), turnContext('t', 'gpt-5.6-sol'),
    { type: 'response_item', payload: { text: '中文'.repeat(40000) } },
    tokenCount('2026-10-13T01:00:00Z', { input_tokens: 1465, output_tokens: 15 }),
  ]);
  const readFileSync = fs.readFileSync;
  fs.readFileSync = function (target, ...args) {
    if (String(target).endsWith('.jsonl')) throw new Error('Whole-file reads are disabled');
    return readFileSync.call(this, target, ...args);
  };
  try {
    const result = await agent.scanCodexLedger(home);
    assert.equal(result.files.parsed, 1);
    assert.equal(result.records.length, 1);
    assert.equal(result.summary.total, 1480);
    assert.ok(result.records.every(validateTurnRecord));
  } finally { fs.readFileSync = readFileSync; }
});

test('old cached derived totals are repaired without changing keys or component counters', async t => {
  const home = tempHome(t);
  writeSession(home, 'cached.jsonl', [sessionMeta('cached'), turnContext('t', 'gpt-5.6-sol'),
    tokenCount('2026-10-13T01:00:00Z', { input_tokens: 1465, output_tokens: 0 }),
  ]);
  const original = await agent.scanCodexLedger(home);
  const cachePath = path.join(home, '.tsalon/codex-session-cache-v5.json');
  const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  const record = Object.values(cache.files)[0].records[0];
  record.total = record.norm = 1450;
  for (const daily of Object.values(record.daily)) daily.total = daily.norm = 1450;
  fs.writeFileSync(cachePath, JSON.stringify(cache));
  const next = await agent.scanCodexLedger(home);
  assert.equal(next.files.parsed, 1);
  assert.deepEqual(next.records, original.records);
});

test('repairing old cached counters reparses pricing tiers from source events', async t => {
  const home = tempHome(t);
  writeSession(home, 'tier-correction.jsonl', [sessionMeta('tier'), turnContext('t1', 'gpt-5.6-sol'),
    tokenCount('2026-10-13T01:00:00Z', { input_tokens: 500000, cached_input_tokens: 100000 }),
    turnContext('t2', 'gpt-5.6-sol'),
    tokenCount('2026-10-13T01:01:00Z', { input_tokens: 700000, cached_input_tokens: 373000 }),
  ]);
  const original = await agent.scanCodexLedger(home);
  const cachePath = path.join(home, '.tsalon/codex-session-cache-v5.json');
  const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  const record = Object.values(cache.files)[0].records.find(r => r.cache_read === 273000);
  assert.ok(record);
  for (const usage of [record, ...Object.values(record.daily)]) {
    usage.input_total = usage.total = 200000;
    usage.pricing_tiers.base = usage.pricing_tiers.long;
    usage.pricing_tiers.long = { net_new_input: 0, cache_read: 0, cache_write: 0, output: 0 };
  }
  fs.writeFileSync(cachePath, JSON.stringify(cache));
  const next = await agent.scanCodexLedger(home);
  assert.equal(next.files.parsed, 1);
  assert.deepEqual(next.records, original.records);
  const again = await agent.scanCodexLedger(home);
  assert.equal(again.files.cached, 1);
  assert.deepEqual(again.records, original.records);
});

test('a 61,317-turn full sync survives transport and Redis with every turn key retained', async t => {
  assert.equal(typeof agent.encodeUploadPayload, 'function');
  const records = Array.from({ length: 61317 }, (_, i) => turnRecord(`large-${i}`, i + 1));
  const source = { token: 'test-only', device_id: 'large-device', data: {}, codex_ledger: ledgerPayload(records) };
  const encoded = agent.encodeUploadPayload(source);
  assert.ok(encoded.body.length <= 4 * 1024 * 1024);
  const decoded = await readUploadJson(new Request('https://example.test/upload', {
    method: 'POST', headers: { 'Content-Encoding': encoded.encoding }, body: encoded.body,
  }));
  assert.deepEqual(decoded, JSON.parse(JSON.stringify(source)));
  const server = await startLocalRedis();
  t.after(() => server.stop());
  const summary = await syncCodexLedger(server.redis, 'u1', 'large-device', decoded.codex_ledger);
  const view = await readCodexLedgerView(server.redis, 'u1');
  assert.equal(Object.keys(view.turns).length, records.length);
  assert.equal(summary.lifetime.total, records.length * (records.length + 1) / 2);
  assert.deepEqual(Object.keys(view.turns).sort(), records.map(r => r.turn_key).sort());
  // Another device replaying one original turn must not double-count it.
  const replay = await syncCodexLedger(server.redis, 'u1', 'other-device', ledgerPayload([records[0]]));
  assert.equal(replay.lifetime.total, summary.lifetime.total);
});

test('ledger record limits still reject unbounded manifests', async () => {
  const payload = ledgerPayload([]);
  payload.records = Array(100001).fill({});
  await assert.rejects(syncCodexLedger(null, 'u1', 'd1', payload), /Invalid Codex ledger payload/);
});
