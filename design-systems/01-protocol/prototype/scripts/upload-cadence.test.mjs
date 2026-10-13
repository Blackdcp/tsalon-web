import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as cadence from '../src/lib/upload-cadence.ts';
import * as uploadBody from '../src/lib/upload-body.ts';
import * as uploadError from '../src/lib/upload-error.ts';
import * as uploadParts from '../src/lib/upload-parts.ts';
import {
  claimDeviceUploadWindow as claimWithReason, completeDeviceUploadWindow, releaseDeviceUploadWindow,
  deviceUploadWindowKey, normalizeUploadDeviceId,
} from '../src/lib/upload-cadence.ts';
import { startLocalRedis } from './helpers/local-redis.mjs';

let server;
let redis;
const morning = Date.parse('2026-10-13T09:17:00+08:00');
before(async () => { server = await startLocalRedis(); redis = server.redis; });
after(async () => { await server?.stop(); });
beforeEach(async () => { await redis.flushdb(); });

async function claimDeviceUploadWindow(...args) {
  const result = await claimWithReason(...args);
  return 'owner' in result ? result : null;
}

async function upload(now = morning, user = 'u1', device = 'd1') {
  const lease = await claimDeviceUploadWindow(redis, user, device, now);
  assert.ok(lease, 'upload should be allowed');
  await completeDeviceUploadWindow(redis, user, device, lease, now);
  return lease;
}

test('morning automatic upload plus one manual upload succeed; third is skipped', async () => {
  await upload();
  await upload(morning + 1000);
  assert.equal(await claimDeviceUploadWindow(redis, 'u1', 'd1', morning + 2000), null);
});

test('concurrent claims allow only one upload, and completion cannot count twice', async () => {
  const claims = await Promise.all(Array.from({ length: 20 }, () =>
    claimDeviceUploadWindow(redis, 'u1', 'd1', morning)));
  const accepted = claims.filter(Boolean);
  assert.equal(accepted.length, 1);
  await completeDeviceUploadWindow(redis, 'u1', 'd1', accepted[0], morning);
  await completeDeviceUploadWindow(redis, 'u1', 'd1', accepted[0], morning);
  await upload();
  assert.equal(await claimDeviceUploadWindow(redis, 'u1', 'd1', morning), null);
});

test('the quota resets at Beijing midnight, not UTC midnight or 23 hours later', async () => {
  const late = Date.parse('2026-10-13T23:59:59+08:00');
  await upload(morning);
  await upload(late);
  assert.equal(await claimDeviceUploadWindow(redis, 'u1', 'd1', late), null);
  await upload(late + 1000);
  await upload(late + 2000);
  assert.equal(await claimDeviceUploadWindow(redis, 'u1', 'd1', late + 3000), null);
});

test('a request crossing midnight counts on the day it successfully completes', async () => {
  const beforeMidnight = Date.parse('2026-10-13T23:59:59+08:00');
  await upload(beforeMidnight - 1000);
  const lease = await claimDeviceUploadWindow(redis, 'u1', 'd1', beforeMidnight);
  assert.ok(lease);
  assert.equal(await claimDeviceUploadWindow(redis, 'u1', 'd1', beforeMidnight + 1000), null);
  await completeDeviceUploadWindow(redis, 'u1', 'd1', lease, beforeMidnight + 1000);
  await upload(beforeMidnight + 2000);
  assert.equal(await claimDeviceUploadWindow(redis, 'u1', 'd1', beforeMidnight + 3000), null);
});

test('an abandoned worker keeps the crash cooldown but consumes no success allowance', async () => {
  const abandoned = await claimDeviceUploadWindow(redis, 'u1', 'd1', morning);
  assert.ok(abandoned);
  assert.equal(await claimDeviceUploadWindow(redis, 'u1', 'd1', morning), null);
  // Expire only this isolated test server's lock, simulating the 30-minute cooldown.
  const [lock] = await redis.keys('upload-in-flight:*');
  assert.ok(lock);
  assert.ok(await redis.ttl(lock) <= 1800);
  await redis.pexpire(lock, 1);
  await new Promise((resolve) => setTimeout(resolve, 10));
  const retry = await claimDeviceUploadWindow(redis, 'u1', 'd1', morning + 1800000);
  assert.ok(retry);
  // An old worker must not release or complete the newer worker's lease.
  await completeDeviceUploadWindow(redis, 'u1', 'd1', abandoned, morning + 1800000);
  await releaseDeviceUploadWindow(redis, 'u1', 'd1', abandoned);
  assert.equal(await claimDeviceUploadWindow(redis, 'u1', 'd1', morning + 1800000), null);
  await completeDeviceUploadWindow(redis, 'u1', 'd1', retry, morning + 1800000);
  await upload(morning + 1801000);
  assert.equal(await claimDeviceUploadWindow(redis, 'u1', 'd1', morning + 1802000), null);
});

function uploadEndpoint(updateTokenUsage) {
  const source = readFileSync(new URL('../src/pages/api/rank/upload.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports, Response, console: { error() {} },
    require(name) {
      if (name.endsWith('/kv')) return { kv: redis, getUserIdByToken: async () => 'u1', updateTokenUsage };
      if (name.endsWith('/codex-ledger.ts')) return { storeAccountAuditWithTimeout: async () => null };
      if (name.endsWith('/upload-cadence.ts')) return cadence;
      if (name.endsWith('/upload-body.ts')) return uploadBody;
      if (name.endsWith('/upload-error.ts')) return uploadError;
      if (name.endsWith('/upload-parts.ts')) return uploadParts;
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return () => exports.POST({ request: new Request('https://local.test/api/rank/upload/', {
    method: 'POST', body: JSON.stringify({ token: 'test-only', device_id: 'd1', data: { cherry: 1 } }),
  }) });
}

test('an explicit upload failure releases its lock and allows immediate corrected retry', async () => {
  let calls = 0;
  const post = uploadEndpoint(async () => {
    if (++calls === 1) throw new Error('Invalid Codex ledger record');
    return {};
  });
  assert.equal((await post()).status, 400);
  const corrected = await (await post()).json();
  assert.equal(corrected.skipped, undefined, '400 must not leave a 30-minute lock');
  assert.equal(corrected.message, 'Tokens updated');
  assert.equal((await (await post()).json()).message, 'Tokens updated');
  const limited = await (await post()).json();
  assert.equal(limited.code, 'daily_upload_limit');
  assert.equal(limited.retryable, false);
  assert.equal(calls, 3, 'failed attempt must not consume either success allowance');
});

test('a simultaneous request reports in-flight explicitly and cannot run the update', async () => {
  const started = Promise.withResolvers();
  const finish = Promise.withResolvers();
  let calls = 0;
  const post = uploadEndpoint(async () => { calls++; started.resolve(); await finish.promise; return {}; });
  const first = post();
  await started.promise;
  try {
    const blocked = await (await post()).json();
    assert.equal(blocked.code, 'upload_in_flight');
    assert.equal(blocked.retryable, true);
    assert.ok(blocked.retry_after_seconds > 0);
    assert.equal(calls, 1);
  } finally { finish.resolve(); await first; }
});

test('a successful legacy upload today leaves one allowance, even if just completed', async () => {
  await redis.set(deviceUploadWindowKey('u1', 'd1'), String(morning - 1000), 'EX', 23 * 3600);
  await upload();
  assert.equal(await claimDeviceUploadWindow(redis, 'u1', 'd1', morning), null);
});

test("yesterday's legacy upload does not block either allowance today", async () => {
  await redis.set(deviceUploadWindowKey('u1', 'd1'), String(morning - 12 * 3600000), 'EX', 11 * 3600);
  await upload();
  await upload();
  assert.equal(await claimDeviceUploadWindow(redis, 'u1', 'd1', morning), null);
});

test('a legacy upload started yesterday but completed today leaves only one allowance', async () => {
  const started = Date.parse('2026-10-12T23:59:59+08:00');
  const completed = Date.parse('2026-10-13T00:00:02+08:00');
  const remaining = 23 * 3600 - (morning - completed) / 1000;
  await redis.set(deviceUploadWindowKey('u1', 'd1'), String(started), 'EX', remaining);
  await upload();
  assert.equal(await claimDeviceUploadWindow(redis, 'u1', 'd1', morning), null);
});

test('a legacy request still in flight retains its short cooldown', async () => {
  await redis.set(deviceUploadWindowKey('u1', 'd1'), String(morning - 1000), 'EX', 1799);
  assert.equal(await claimDeviceUploadWindow(redis, 'u1', 'd1', morning), null);
});

test('daily allowances are isolated by user and device', async () => {
  await upload();
  await upload();
  await upload(morning, 'u1', 'd2');
  await upload(morning, 'u1', 'd2');
  await upload(morning, 'u2', 'd1');
  await upload(morning, 'u2', 'd1');
});

test('device-controlled identifiers are bounded and never appear in Redis keys', () => {
  const hostile = 'device:' + 'x'.repeat(100000);
  const key = deviceUploadWindowKey('u1', hostile);
  assert.equal(key.length, 'upload-window:u1:'.length + 64);
  assert.equal(key.includes(hostile), false);
  assert.equal(normalizeUploadDeviceId('dev_abc-123'), 'dev_abc-123');
  assert.match(normalizeUploadDeviceId(hostile), /^device_[a-f0-9]{32}$/);
  assert.equal(normalizeUploadDeviceId(''), 'default_device');
});
