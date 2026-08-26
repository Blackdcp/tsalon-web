import assert from 'node:assert/strict';
import test from 'node:test';

import { syncCodexLedger } from '../src/lib/codex-ledger.ts';
import { ledgerPayload, turnRecord } from './helpers/codex-fixtures.mjs';
import { FakeRedis } from './helpers/fake-redis.mjs';

test('full sync is idempotent and rebuilds one canonical daily event', async () => {
  const redis = new FakeRedis();
  await syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([turnRecord('same', 110)]));
  await syncCodexLedger(redis, 'u1', 'windows', ledgerPayload([turnRecord('same', 110)]));
  const summary = await syncCodexLedger(redis, 'u1', 'windows', ledgerPayload([turnRecord('same', 110)]));

  assert.equal(summary.lifetime.total, 110);
  const events = await redis.lrange('user:u1:timeseries:2026-08-18', 0, -1);
  assert.equal(events.filter((raw) => JSON.parse(raw).source === 'codex-ledger-v5').length, 1);
});

test('canonical hashes retain device versions and a sorted device manifest', async () => {
  const redis = new FakeRedis();
  const beta = turnRecord('beta', 200);
  const alpha = turnRecord('alpha', 100);

  await syncCodexLedger(redis, 'u1', 'windows', ledgerPayload([beta, alpha]));
  await syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([turnRecord('alpha', 100)]));

  const turns = await redis.hgetall('user:u1:codex:turns');
  assert.deepEqual(Object.keys(turns), [alpha.turn_key, beta.turn_key].sort());
  assert.deepEqual(JSON.parse(turns[alpha.turn_key]).source_devices, ['mac', 'windows']);
  assert.deepEqual(Object.keys(JSON.parse(turns[alpha.turn_key]).device_versions), ['mac', 'windows']);
  assert.deepEqual(JSON.parse(turns[beta.turn_key]).source_devices, ['windows']);
  assert.deepEqual(JSON.parse(await redis.get('user:u1:device:windows:codex-manifest')), {
    version: 5,
    manifest_hash: ledgerPayload([beta, alpha]).manifest_hash,
    turn_hashes: [alpha.turn_key, beta.turn_key].sort(),
  });
  assert.equal(await redis.get('user:u1:device:windows:codex-ledger-version'), '5');
});

test('first v5 sync removes only that device legacy Codex events and preserves Claude', async () => {
  const redis = new FakeRedis();
  const key = 'user:u1:timeseries:2026-08-18';
  await redis.rpush(key,
    JSON.stringify({ tool: 'codex', deviceId: 'windows', tokens: 999, source: 'agent-history-v2' }),
    JSON.stringify({ tool: 'codex_proxy', deviceId: 'mac', tokens: 888, source: 'cumulative-delta-v2' }),
    JSON.stringify({ tool: 'claude', deviceId: 'windows', tokens: 77, source: 'agent-history-v2' }),
  );

  await syncCodexLedger(redis, 'u1', 'windows', ledgerPayload([turnRecord('same', 110)]));

  const events = (await redis.lrange(key, 0, -1)).map(JSON.parse);
  assert.deepEqual(events.filter((event) => event.source !== 'codex-ledger-v5'), [
    { tool: 'codex_proxy', deviceId: 'mac', tokens: 888, source: 'cumulative-delta-v2' },
    { tool: 'claude', deviceId: 'windows', tokens: 77, source: 'agent-history-v2' },
  ]);
  assert.deepEqual(events.find((event) => event.source === 'codex-ledger-v5'), {
    timestamp: 1_787_011_200_000,
    tool: 'codex',
    model: 'gpt-5.6-sol',
    tokens: 110,
    rawTokens: 110,
    normTokens: 110,
    inTokens: 110,
    outTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    cacheHit: false,
    source: 'codex-ledger-v5',
    costUsd: 0.00044,
    pricingEstimated: false,
    pricingSnapshotDate: '2026-08-26',
  });
});

test('an empty corrected manifest removes stale canonical days but keeps unrelated events', async () => {
  const redis = new FakeRedis();
  const key = 'user:u1:timeseries:2026-08-18';
  await syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([turnRecord('old', 42)]));
  await redis.rpush(key, JSON.stringify({ tool: 'claude', tokens: 7, source: 'manual' }));

  const summary = await syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([]));

  assert.equal(summary.lifetime.total, 0);
  assert.deepEqual((await redis.lrange(key, 0, -1)).map(JSON.parse), [
    { tool: 'claude', tokens: 7, source: 'manual' },
  ]);
});

test('sync rejects payloads outside the full v5 protocol before changing Redis', async () => {
  const redis = new FakeRedis();
  const payload = { ...ledgerPayload([turnRecord('same', 110)]), version: 4 };

  await assert.rejects(
    syncCodexLedger(redis, 'u1', 'mac', payload),
    /Invalid Codex ledger payload/,
  );
  assert.deepEqual(await redis.hgetall('user:u1:codex:turns'), {});
  assert.equal(await redis.get('user:u1:device:mac:codex-ledger-version'), null);
});
