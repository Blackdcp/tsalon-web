import assert from 'node:assert/strict';
import test from 'node:test';

import { replaceRedisList, storeAccountAudit, storeAccountAuditWithTimeout, syncCodexLedger } from '../src/lib/codex-ledger.ts';
import * as kvModule from '../src/lib/kv.ts';
import { ledgerPayload, turnRecord } from './helpers/codex-fixtures.mjs';
import { FakeRedis } from './helpers/fake-redis.mjs';

test('account audit storage keeps only a sanitized latest snapshot outside canonical ranking data', async () => {
  const redis = new FakeRedis();
  const summaryKey = 'user:u1:codex:summary';
  const auditKey = 'a'.repeat(64);
  await redis.set(summaryKey, JSON.stringify({ lifetime: { total: 110 } }));
  const before = await redis.get(summaryKey);

  await storeAccountAudit(redis, 'u1', {
    account_audit_key: auditKey,
    lifetime_tokens: 14_096_012_943,
    daily_buckets: [{ date: '2026-08-22', tokens: 1_715_126_863 }],
    observed_at: '2026-08-26T00:00:00.000Z',
  });

  assert.equal(await redis.get(summaryKey), before);
  assert.deepEqual(JSON.parse(await redis.get(`user:u1:codex:audit:${auditKey}`)), {
    account_audit_key: auditKey,
    lifetime_tokens: 14_096_012_943,
    daily_buckets: [{ date: '2026-08-22', tokens: 1_715_126_863 }],
    observed_at: '2026-08-26T00:00:00.000Z',
  });
  const serialized = await redis.get(`user:u1:codex:audit:${auditKey}`);
  assert.equal(serialized.includes('@'), false);
  assert.equal(serialized.includes('upload-secret'), false);
});

test('account audit storage rejects email, malformed keys, and invalid daily buckets', async () => {
  const redis = new FakeRedis();
  const valid = {
    account_audit_key: 'a'.repeat(64),
    lifetime_tokens: 7,
    daily_buckets: [],
    observed_at: '2026-08-26T00:00:00.000Z',
  };

  await assert.rejects(storeAccountAudit(redis, 'u1', { ...valid, email: 'black@example.com' }), /Invalid Codex account audit/);
  await assert.rejects(storeAccountAudit(redis, 'u1', { ...valid, account_audit_key: 'bad' }), /Invalid Codex account audit/);
  await assert.rejects(storeAccountAudit(redis, 'u1', {
    ...valid,
    daily_buckets: [{ date: 'not-a-date', tokens: -1 }],
  }), /Invalid Codex account audit/);
  await assert.rejects(storeAccountAudit(redis, { user: 'u1' }, valid), /Invalid Codex account audit/);
  await assert.rejects(storeAccountAudit(redis, 'u1', { ...valid, account_audit_key: new String('a'.repeat(64)) }), /Invalid Codex account audit/);
  await assert.rejects(storeAccountAudit(redis, 'u1', { ...valid, observed_at: '0' }), /Invalid Codex account audit/);
  await assert.rejects(storeAccountAudit(redis, 'u1', { ...valid, observed_at: '2026-08-26' }), /Invalid Codex account audit/);
});

test('account audit timeout does not delay the normal upload path or leak a later Redis rejection', async () => {
  let rejectWrite;
  const redis = {
    set: () => new Promise((_resolve, reject) => { rejectWrite = reject; }),
  };
  const valid = {
    account_audit_key: 'a'.repeat(64),
    lifetime_tokens: 7,
    daily_buckets: [],
    observed_at: '2026-08-26T00:00:00.000Z',
  };
  let unhandled = null;
  const onUnhandled = (error) => { unhandled = error; };
  process.once('unhandledRejection', onUnhandled);

  assert.equal(await storeAccountAuditWithTimeout(redis, 'u1', valid, 1), null);
  rejectWrite(new Error('late Redis write failure'));
  await new Promise((resolve) => setTimeout(resolve, 10));
  process.removeListener('unhandledRejection', onUnhandled);
  assert.equal(unhandled, null);
});

test('full sync is idempotent and rebuilds one canonical daily event', async () => {
  const redis = new FakeRedis();
  await syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([turnRecord('same', 110)]));
  await syncCodexLedger(redis, 'u1', 'windows', ledgerPayload([turnRecord('same', 110)]));
  const summary = await syncCodexLedger(redis, 'u1', 'windows', ledgerPayload([turnRecord('same', 110)]));

  assert.equal(summary.lifetime.total, 110);
  const events = await redis.lrange('user:u1:timeseries:2026-08-18', 0, -1);
  assert.equal(events.filter((raw) => JSON.parse(raw).source === 'codex-ledger-v5').length, 1);
});

test('daily costs price each day token type and tier instead of prorating the turn total', async () => {
  const redis = new FakeRedis();
  const split = turnRecord('daily-cost-split', 2_000_000, {
    input_total: 1_000_000,
    net_new_input: 0,
    output: 1_000_000,
    cache_read: 1_000_000,
    cache_write: 0,
    total: 2_000_000,
    norm: 1_000_000,
    pricing_tiers: {
      base: { net_new_input: 0, cache_read: 1_000_000, cache_write: 0, output: 1_000_000 },
      long: { net_new_input: 0, cache_read: 0, cache_write: 0, output: 0 },
    },
    daily: {
      '2026-08-18': {
        input_total: 1_000_000, net_new_input: 0, output: 0,
        cache_read: 1_000_000, cache_write: 0, total: 1_000_000, norm: 0,
        pricing_tiers: {
          base: { net_new_input: 0, cache_read: 1_000_000, cache_write: 0, output: 0 },
          long: { net_new_input: 0, cache_read: 0, cache_write: 0, output: 0 },
        },
      },
      '2026-08-19': {
        input_total: 0, net_new_input: 0, output: 1_000_000,
        cache_read: 0, cache_write: 0, total: 1_000_000, norm: 1_000_000,
        pricing_tiers: {
          base: { net_new_input: 0, cache_read: 0, cache_write: 0, output: 1_000_000 },
          long: { net_new_input: 0, cache_read: 0, cache_write: 0, output: 0 },
        },
      },
    },
  });

  const summary = await syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([split]));

  assert.equal(summary.daily['2026-08-18'].cost, 0.4);
  assert.equal(summary.daily['2026-08-19'].cost, 20);
  assert.equal(summary.lifetime.cost, 20.4);
  const dayOne = JSON.parse((await redis.lrange('user:u1:timeseries:2026-08-18', 0, -1))[0]);
  const dayTwo = JSON.parse((await redis.lrange('user:u1:timeseries:2026-08-19', 0, -1))[0]);
  assert.equal(dayOne.costUsd, 0.4);
  assert.equal(dayTwo.costUsd, 20);
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

test('server canonical storage drops every unrecognized privacy field before Redis persistence', async () => {
  const redis = new FakeRedis();
  const record = turnRecord('privacy-boundary', 10);
  record.prompt = 'TOP-LEVEL-SECRET';
  record.file_path = '/secret/project/file.ts';
  record.pricing_tiers.base.prompt = 'TIER-SECRET';
  record.daily['2026-08-18'].file_path = '/secret/daily.ts';
  record.daily['2026-08-18'].pricing_tiers.base.prompt = 'DAILY-TIER-SECRET';

  await syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([record]));

  const serialized = JSON.stringify(await redis.hgetall('user:u1:codex:turns'));
  for (const secret of ['TOP-LEVEL-SECRET', '/secret/project', 'TIER-SECRET', '/secret/daily']) {
    assert.equal(serialized.includes(secret), false);
  }
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

test('sync rejects non-canonical and duplicate manifest turn keys before Redis mutation', async () => {
  for (const records of [
    [{ ...turnRecord('uppercase', 10), turn_key: turnRecord('uppercase', 10).turn_key.toUpperCase() }],
    [turnRecord('duplicate', 10), turnRecord('duplicate', 10)],
  ]) {
    const redis = new FakeRedis();
    await assert.rejects(syncCodexLedger(redis, 'u1', 'mac', ledgerPayload(records)), /Invalid Codex ledger payload/);
    assert.deepEqual(await redis.hgetall('user:u1:codex:turns'), {});
    assert.equal(await redis.get('user:u1:device:mac:codex-manifest'), null);
  }
});

test('a failed second temp-list chunk leaves the live list intact and cleans the temp key', async () => {
  const redis = new FakeRedis();
  const key = 'user:u1:timeseries:2026-08-18';
  await syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([turnRecord('original', 7)]));
  const original = Array.from({ length: 501 }, (_, index) => JSON.stringify({
    tool: 'claude', tokens: index + 1, source: 'manual',
  }));
  original.push(JSON.stringify({ tool: 'codex', tokens: 9, source: 'codex-ledger-v5' }));
  await redis.del(key);
  await redis.rpush(key, ...original);
  const before = {
    turns: await redis.hgetall('user:u1:codex:turns'),
    summary: await redis.get('user:u1:codex:summary'),
    manifest: await redis.get('user:u1:device:mac:codex-manifest'),
    version: await redis.get('user:u1:device:mac:codex-ledger-version'),
    timeseries: await redis.lrange(key, 0, -1),
  };
  redis.failPipelineAfter('replace-list', 1);

  await assert.rejects(
    syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([turnRecord('replacement', 110)])),
    /Injected replace-list pipeline failure/,
  );
  assert.deepEqual(await redis.hgetall('user:u1:codex:turns'), before.turns);
  assert.equal(await redis.get('user:u1:codex:summary'), before.summary);
  assert.equal(await redis.get('user:u1:device:mac:codex-manifest'), before.manifest);
  assert.equal(await redis.get('user:u1:device:mac:codex-ledger-version'), before.version);
  assert.deepEqual(await redis.lrange(key, 0, -1), before.timeseries);
  assert.deepEqual((await redis.scan('0', 'MATCH', `${key}:tmp:*`))[1], []);
  assert.deepEqual((await redis.scan('0', 'MATCH', 'user:u1:codex:turns:tmp:*'))[1], []);
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

test('a long-running update heartbeat prevents a second request from stealing the expired lease', async () => {
  const redis = new FakeRedis();
  const first = await kvModule.acquireUserUpdateLease(redis, 'u1', {
    leaseMs: 30,
    attempts: 1,
    retryMs: 1,
  });

  await new Promise((resolve) => setTimeout(resolve, 75));
  await assert.rejects(
    kvModule.acquireUserUpdateLease(redis, 'u1', { leaseMs: 30, attempts: 1, retryMs: 1 }),
    /Token update is busy/,
  );

  await first.release();
  const second = await kvModule.acquireUserUpdateLease(redis, 'u1', {
    leaseMs: 30,
    attempts: 1,
    retryMs: 1,
  });
  await second.release();
  assert.equal(await redis.get('user:u1:update-lock'), null);
});

test('a stale lease owner is fenced from publishing after another request acquires the lock', async (t) => {
  const redis = new FakeRedis();
  let stale;
  let current;
  t.after(async () => {
    await stale?.release();
    await current?.release();
  });
  stale = await kvModule.acquireUserUpdateLease(redis, 'u1', {
    leaseMs: 30,
    attempts: 1,
    retryMs: 1,
  });
  await redis.del(stale.lockKey);
  current = await kvModule.acquireUserUpdateLease(redis, 'u1', {
    leaseMs: 30,
    attempts: 1,
    retryMs: 1,
  });

  await assert.rejects(
    syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([turnRecord('stale-publish', 10)]), {
      commit: stale.commit,
    }),
    /Token update lease lost/,
  );
  assert.deepEqual(await redis.hgetall('user:u1:codex:turns'), {});
  assert.equal(await redis.get('user:u1:codex:summary'), null);

  await stale.release();
  await current.release();
});

test('a list replacement is fenced when ownership changes after temp staging', async (t) => {
  const liveKey = 'user:u1:timeseries:2026-08-18';
  const lockKey = 'user:u1:update-lock';
  class StealAfterListStageRedis extends FakeRedis {
    pipeline() {
      const pipeline = super.pipeline();
      const exec = pipeline.exec;
      pipeline.exec = async () => {
        const replies = await exec();
        const tempKeys = (await this.scan('0', 'MATCH', `${liveKey}:tmp:*`))[1];
        if (tempKeys.length && !this.stolen) {
          this.stolen = true;
          await this.set(lockKey, 'new-owner', 'PX', 30);
        }
        return replies;
      };
      return pipeline;
    }
  }

  const redis = new StealAfterListStageRedis();
  await redis.rpush(liveKey, 'old-generation');
  const stale = await kvModule.acquireUserUpdateLease(redis, 'u1', {
    leaseMs: 30,
    attempts: 1,
    retryMs: 1,
  });
  t.after(() => stale.release());

  await assert.rejects(
    replaceRedisList(redis, liveKey, ['stale-generation'], stale.commit),
    /Token update lease lost/,
  );
  assert.deepEqual(await redis.lrange(liveKey, 0, -1), ['old-generation']);
  assert.deepEqual((await redis.scan('0', 'MATCH', `${liveKey}:tmp:*`))[1], []);
});
