import assert from 'node:assert/strict';
import test from 'node:test';

import { syncCodexLedger } from '../src/lib/codex-ledger.ts';
import * as kvModule from '../src/lib/kv.ts';
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
    manifest_hash: ledgerPayload([beta, alpha]).manifest_hash,
    turn_keys: [alpha.turn_key, beta.turn_key].sort(),
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

test('a failed second temp-list chunk leaves the live list intact and cleans the temp key', async () => {
  const redis = new FakeRedis();
  const key = 'user:u1:timeseries:2026-08-18';
  const original = Array.from({ length: 501 }, (_, index) => JSON.stringify({
    tool: 'claude', tokens: index + 1, source: 'manual',
  }));
  original.push(JSON.stringify({ tool: 'codex', tokens: 9, source: 'codex-ledger-v5' }));
  await redis.rpush(key, ...original);
  redis.failPipelineAfter('replace-list', 1);

  await assert.rejects(
    syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([turnRecord('same', 110)])),
    /Injected replace-list pipeline failure/,
  );
  assert.deepEqual(await redis.lrange(key, 0, -1), original);
  assert.deepEqual((await redis.scan('0', 'MATCH', `${key}:tmp:*`))[1], []);
  assert.equal(await redis.get('user:u1:device:mac:codex-ledger-version'), null);
});

test('a failed second temp-hash chunk leaves the live hash intact and cleans the temp key', async () => {
  const redis = new FakeRedis();
  await syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([turnRecord('original', 7)]));
  const key = 'user:u1:codex:turns';
  const original = await redis.hgetall(key);
  const records = Array.from({ length: 501 }, (_, index) => turnRecord(`replacement-${index}`, 1));
  redis.failPipelineAfter('replace-hash', 1);

  await assert.rejects(
    syncCodexLedger(redis, 'u1', 'mac', ledgerPayload(records)),
    /Injected replace-hash pipeline failure/,
  );
  assert.deepEqual(await redis.hgetall(key), original);
  assert.deepEqual((await redis.scan('0', 'MATCH', `${key}:tmp:*`))[1], []);
});

test('a 50,001-record payload is rejected before any Redis mutation', async () => {
  const redis = new FakeRedis();
  const payload = ledgerPayload(Array(50_001).fill(turnRecord('same', 1)));

  await assert.rejects(syncCodexLedger(redis, 'u1', 'mac', payload), /Invalid Codex ledger payload/);
  assert.deepEqual(await redis.hgetall('user:u1:codex:turns'), {});
  assert.equal(await redis.get('user:u1:device:mac:codex-manifest'), null);
  assert.equal(await redis.get('user:u1:device:mac:codex-ledger-version'), null);
});

test('a 70,001-turn reconciled ledger rebuilds without spread limits', async () => {
  const redis = new FakeRedis();
  const key = 'user:u1:codex:turns';
  function* existingTurns() {
    for (let index = 0; index < 50_001; index += 1) {
      const record = turnRecord(`existing-${index}`, 1);
      yield [record.turn_key, JSON.stringify({
        record,
        device_versions: { windows: record },
        source_devices: ['windows'],
      })];
    }
  }
  redis.seedHash(key, existingTurns());
  const incoming = Array.from({ length: 20_000 }, (_, index) => turnRecord(`incoming-${index}`, 1));

  const summary = await syncCodexLedger(redis, 'u1', 'mac', ledgerPayload(incoming));

  assert.equal(summary.lifetime.total, 70_001);
  assert.equal(Object.keys(await redis.hgetall(key)).length, 70_001);
  assert.equal(await redis.get('user:u1:device:mac:codex-ledger-version'), '5');
});

test('ledger update writes one canonical Codex event and continues non-Codex history', async () => {
  const redis = new FakeRedis();
  await redis.set('user:u1:device:mac:data', JSON.stringify({
    tokens: {
      codex: { total: 100, raw_total: 100 },
      codex_proxy: { total: 50, raw_total: 50 },
      claude: { total: 10, raw_total: 10 },
    },
  }));

  await kvModule.updateTokenUsageWithRedis(redis, 'u1', 'User', '', {
    codex: { total: 200, raw_total: 200 },
    codex_proxy: { total: 80, raw_total: 80 },
    claude: { total: 20, raw_total: 20 },
  }, 'mac', {
    historyData: {
      '2026-08-18': {
        codex: { total: 110, raw_total: 110 },
        claude: { total: 7, raw_total: 7 },
      },
    },
    historyCompleteTools: ['codex', 'claude'],
    codexLedger: ledgerPayload([turnRecord('same', 110)]),
  });

  const keys = (await redis.scan('0', 'MATCH', 'user:u1:timeseries:*'))[1];
  const events = (await Promise.all(keys.map((key) => redis.lrange(key, 0, -1))))
    .flat().map(JSON.parse);
  assert.equal(events.filter((event) => event.source === 'codex-ledger-v5').length, 1);
  assert.equal(events.filter((event) => ['codex', 'codex_proxy'].includes(event.tool)
    && ['agent-history-v2', 'agent-history-legacy', 'cumulative-delta-v2', 'snapshot-delta'].includes(event.source)).length, 0);
  assert.equal(events.filter((event) => event.tool === 'claude' && event.source === 'agent-history-v2').length, 1);
  assert.equal(await redis.get('user:u1:update-lock'), null);
});

test('empty positional history still honors the seventh complete-tools argument', async () => {
  const redis = new FakeRedis();
  const key = 'user:u1:timeseries:2026-08-18';
  await redis.rpush(key, JSON.stringify({
    tool: 'claude', deviceId: 'mac', tokens: 7, source: 'agent-history-v2',
  }));

  await kvModule.updateTokenUsageWithRedis(redis, 'u1', 'User', '', {}, 'mac', {}, ['claude']);

  assert.deepEqual(await redis.lrange(key, 0, -1), []);
  assert.equal(await redis.get('user:u1:update-lock'), null);
});
