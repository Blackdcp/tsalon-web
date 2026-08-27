import assert from 'node:assert/strict';
import test from 'node:test';
import { gunzipSync, gzipSync } from 'node:zlib';

import {
  readCodexLedgerTimeseries,
  readCodexLedgerView,
  replaceRedisList,
  storeAccountAudit,
  storeAccountAuditWithTimeout,
  syncCodexLedger,
} from '../src/lib/codex-ledger.ts';
import * as kvModule from '../src/lib/kv.ts';
import { ledgerPayload, turnRecord } from './helpers/codex-fixtures.mjs';
import { FakeRedis } from './helpers/fake-redis.mjs';

async function seedLegacyHashGeneration(redis, generation, record) {
  const prefix = `user:u1:codex:generation:${generation}`;
  const envelope = {
    record,
    device_versions: { mac: record },
    source_devices: ['mac'],
  };
  await redis.set('user:u1:codex:active-generation', generation);
  redis.seedHash(`${prefix}:turns`, [[record.turn_key, JSON.stringify(envelope)]]);
  await redis.set(`${prefix}:summary`, JSON.stringify({ lifetime: { total: record.total }, daily: {}, models: {} }));
  await redis.set(`${prefix}:state`, JSON.stringify({
    devices: {
      mac: {
        version: 5,
        manifest: {
          manifest_hash: ledgerPayload([record]).manifest_hash,
          turn_keys: [record.turn_key],
        },
      },
    },
    dates: ['2026-08-18'],
  }));
  return { prefix, envelope };
}

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
  const events = await readCodexLedgerTimeseries(redis, 'u1', '2026-08-18');
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
  const dayOne = JSON.parse((await readCodexLedgerTimeseries(redis, 'u1', '2026-08-18'))[0]);
  const dayTwo = JSON.parse((await readCodexLedgerTimeseries(redis, 'u1', '2026-08-19'))[0]);
  assert.equal(dayOne.costUsd, 0.4);
  assert.equal(dayTwo.costUsd, 20);
});

test('canonical hashes retain device versions and a sorted device manifest', async () => {
  const redis = new FakeRedis();
  const beta = turnRecord('beta', 200);
  const alpha = turnRecord('alpha', 100);

  await syncCodexLedger(redis, 'u1', 'windows', ledgerPayload([beta, alpha]));
  await syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([turnRecord('alpha', 100)]));

  const view = await readCodexLedgerView(redis, 'u1');
  const turns = Object.fromEntries(Object.entries(view.turns).map(([key, value]) => [key, JSON.stringify(value)]));
  assert.deepEqual(Object.keys(turns), [alpha.turn_key, beta.turn_key].sort());
  assert.deepEqual(JSON.parse(turns[alpha.turn_key]).source_devices, ['mac', 'windows']);
  assert.deepEqual(Object.keys(JSON.parse(turns[alpha.turn_key]).device_versions), ['mac', 'windows']);
  assert.deepEqual(JSON.parse(turns[beta.turn_key]).source_devices, ['windows']);
  assert.deepEqual(view.state.devices.windows.manifest, {
    manifest_hash: ledgerPayload([beta, alpha]).manifest_hash,
    turn_keys: [alpha.turn_key, beta.turn_key].sort(),
  });
  assert.equal(view.state.devices.windows.version, 5);
});

test('generation turns blob round-trips canonical envelopes with the versioned gzip schema', async () => {
  const redis = new FakeRedis();
  const beta = turnRecord('blob-beta', 200);
  const alpha = turnRecord('blob-alpha', 100);

  await syncCodexLedger(redis, 'u1', 'windows', ledgerPayload([beta, alpha]));

  const view = await readCodexLedgerView(redis, 'u1');
  const rawBlob = await redis.get(`${view.prefix}:turns:gzip-base64-v1`);
  assert.equal(typeof rawBlob, 'string');
  const decoded = JSON.parse(gunzipSync(Buffer.from(rawBlob, 'base64')).toString('utf8'));
  assert.equal(decoded.schema, 'codex-ledger-turns-v1');
  assert.deepEqual(Object.keys(decoded.turns), [alpha.turn_key, beta.turn_key].sort());
  assert.deepEqual(Object.keys(view.turns), [alpha.turn_key, beta.turn_key].sort());
  assert.deepEqual(view.turns[alpha.turn_key].source_devices, ['windows']);
});

test('generation reader remains compatible with legacy turns hashes', async () => {
  const redis = new FakeRedis();
  const generation = 'legacy-hash-generation';
  const prefix = `user:u1:codex:generation:${generation}`;
  const record = turnRecord('legacy-hash-turn', 42);
  const envelope = {
    record,
    device_versions: { mac: record },
    source_devices: ['mac'],
  };
  await redis.set('user:u1:codex:active-generation', generation);
  redis.seedHash(`${prefix}:turns`, [[record.turn_key, JSON.stringify(envelope)]]);
  await redis.set(`${prefix}:summary`, JSON.stringify({ lifetime: { total: 42 }, daily: {}, models: {} }));
  await redis.set(`${prefix}:state`, JSON.stringify({ devices: {}, dates: [] }));

  const view = await readCodexLedgerView(redis, 'u1');

  assert.equal(view.turns[record.turn_key].record.total, 42);
  assert.deepEqual(view.turns[record.turn_key].source_devices, ['mac']);
});

test('active legacy generation compacts before new staging without changing its visible view', async () => {
  class FailNewGenerationBlobRedis extends FakeRedis {
    activePrefix = '';
    compactedBeforeNewStaging = false;

    async set(key, ...args) {
      if (key.endsWith(':turns:gzip-base64-v1')
        && key !== `${this.activePrefix}:turns:gzip-base64-v1`) {
        this.compactedBeforeNewStaging = !this.hashes.has(`${this.activePrefix}:turns`)
          && typeof await this.get(`${this.activePrefix}:turns:gzip-base64-v1`) === 'string';
        throw new Error('Injected new generation staging failure');
      }
      return super.set(key, ...args);
    }
  }
  const redis = new FailNewGenerationBlobRedis();
  const generation = 'legacy-hash-compaction';
  const record = turnRecord('legacy-hash-compaction-turn', 42);
  const { prefix } = await seedLegacyHashGeneration(redis, generation, record);
  redis.activePrefix = prefix;
  const before = await readCodexLedgerView(redis, 'u1');

  await assert.rejects(
    syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([record])),
    /Injected new generation staging failure/,
  );

  assert.equal(redis.compactedBeforeNewStaging, true);
  assert.deepEqual(await redis.hgetall(`${prefix}:turns`), {});
  assert.equal(typeof await redis.get(`${prefix}:turns:gzip-base64-v1`), 'string');
  assert.equal(redis.expirations.has(`${prefix}:turns:gzip-base64-v1`), false);
  assert.deepEqual(await readCodexLedgerView(redis, 'u1'), before);
});

test('generation reader recovers when compaction deletes the hash after its first blob read', async () => {
  class CompactionDuringHashReadRedis extends FakeRedis {
    activeHashKey = '';
    activeBlobKey = '';
    compactionBlob = '';
    interleave = false;

    async hgetall(key) {
      if (this.interleave && key === this.activeHashKey) {
        this.interleave = false;
        await super.set(this.activeBlobKey, this.compactionBlob, 'EX', 86_400);
        await super.persist(this.activeBlobKey);
        await super.del(this.activeHashKey);
      }
      return super.hgetall(key);
    }
  }
  const redis = new CompactionDuringHashReadRedis();
  const generation = 'reader-compaction-race';
  const record = turnRecord('reader-compaction-race-turn', 42);
  const { prefix, envelope } = await seedLegacyHashGeneration(redis, generation, record);
  redis.activeHashKey = `${prefix}:turns`;
  redis.activeBlobKey = `${prefix}:turns:gzip-base64-v1`;
  redis.compactionBlob = gzipSync(JSON.stringify({
    schema: 'codex-ledger-turns-v1',
    turns: { [record.turn_key]: envelope },
  }), { level: 1 }).toString('base64');
  redis.interleave = true;

  const view = await readCodexLedgerView(redis, 'u1');

  assert.equal(view.turns[record.turn_key].record.total, 42);
  assert.deepEqual(view.turns[record.turn_key].source_devices, ['mac']);
});

test('failed active legacy blob write retains the hash and active pointer', async () => {
  class FailActiveBlobRedis extends FakeRedis {
    activeBlobKey = '';
    failActiveBlobWrite = false;

    async set(key, ...args) {
      if (this.failActiveBlobWrite && key === this.activeBlobKey) {
        throw new Error('Injected active legacy blob write failure');
      }
      return super.set(key, ...args);
    }
  }
  const redis = new FailActiveBlobRedis();
  const generation = 'failed-legacy-hash-compaction';
  const record = turnRecord('failed-legacy-hash-compaction-turn', 42);
  const { prefix } = await seedLegacyHashGeneration(redis, generation, record);
  const hashBefore = await redis.hgetall(`${prefix}:turns`);
  redis.activeBlobKey = `${prefix}:turns:gzip-base64-v1`;
  redis.failActiveBlobWrite = true;

  await assert.rejects(
    syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([record])),
    /Injected active legacy blob write failure/,
  );

  assert.equal(await redis.get('user:u1:codex:active-generation'), generation);
  assert.equal(await redis.get(redis.activeBlobKey), null);
  assert.deepEqual(await redis.hgetall(`${prefix}:turns`), hashBefore);
});

test('active generation with an existing valid blob is not compacted again', async () => {
  class FailNewGenerationBlobRedis extends FakeRedis {
    activeBlobKey = '';
    activeBlobWrites = 0;

    async set(key, ...args) {
      if (key === this.activeBlobKey) this.activeBlobWrites += 1;
      else if (this.activeBlobKey && key.endsWith(':turns:gzip-base64-v1')) {
        throw new Error('Injected new generation staging failure');
      }
      return super.set(key, ...args);
    }
  }
  const redis = new FailNewGenerationBlobRedis();
  const generation = 'already-compacted-generation';
  const record = turnRecord('already-compacted-turn', 42);
  const { prefix, envelope } = await seedLegacyHashGeneration(redis, generation, record);
  const blobKey = `${prefix}:turns:gzip-base64-v1`;
  const rawBlob = gzipSync(JSON.stringify({
    schema: 'codex-ledger-turns-v1',
    turns: { [record.turn_key]: envelope },
  }), { level: 1 }).toString('base64');
  await redis.set(blobKey, rawBlob);
  redis.activeBlobKey = blobKey;

  await assert.rejects(
    syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([record])),
    /Injected new generation staging failure/,
  );

  assert.equal(redis.activeBlobWrites, 0);
  assert.equal(await redis.get(blobKey), rawBlob);
  assert.equal(Object.keys(await redis.hgetall(`${prefix}:turns`)).length, 1);
  assert.equal(await redis.get('user:u1:codex:active-generation'), generation);
});

test('concurrent valid active blob wins compaction without being overwritten', async () => {
  class ConcurrentActiveBlobRedis extends FakeRedis {
    activeBlobKey = '';
    concurrentBlob = '';
    injectConcurrentBlob = false;

    async set(key, ...args) {
      if (this.injectConcurrentBlob && key === this.activeBlobKey) {
        this.injectConcurrentBlob = false;
        await super.set(key, this.concurrentBlob);
      } else if (this.activeBlobKey && key.endsWith(':turns:gzip-base64-v1') && key !== this.activeBlobKey) {
        throw new Error('Injected new generation staging failure');
      }
      return super.set(key, ...args);
    }
  }
  const redis = new ConcurrentActiveBlobRedis();
  const generation = 'concurrent-valid-blob-generation';
  const record = turnRecord('concurrent-valid-blob-turn', 42);
  const { prefix, envelope } = await seedLegacyHashGeneration(redis, generation, record);
  redis.activeBlobKey = `${prefix}:turns:gzip-base64-v1`;
  redis.concurrentBlob = gzipSync(JSON.stringify({
    schema: 'codex-ledger-turns-v1',
    turns: { [record.turn_key]: envelope },
  }), { level: 9 }).toString('base64');
  redis.injectConcurrentBlob = true;

  await assert.rejects(
    syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([record])),
    /Injected new generation staging failure/,
  );

  assert.equal(await redis.get(redis.activeBlobKey), redis.concurrentBlob);
  assert.equal(Object.keys(await redis.hgetall(`${prefix}:turns`)).length, 1);
  assert.equal(await redis.get('user:u1:codex:active-generation'), generation);
});

test('concurrent corrupt active blob is retained and stops compaction', async () => {
  class ConcurrentCorruptBlobRedis extends FakeRedis {
    activeBlobKey = '';
    injectConcurrentBlob = false;

    async set(key, ...args) {
      if (this.injectConcurrentBlob && key === this.activeBlobKey) {
        this.injectConcurrentBlob = false;
        await super.set(key, 'concurrent-corrupt-blob');
      }
      return super.set(key, ...args);
    }
  }
  const redis = new ConcurrentCorruptBlobRedis();
  const generation = 'concurrent-corrupt-blob-generation';
  const record = turnRecord('concurrent-corrupt-blob-turn', 42);
  const { prefix } = await seedLegacyHashGeneration(redis, generation, record);
  redis.activeBlobKey = `${prefix}:turns:gzip-base64-v1`;
  redis.injectConcurrentBlob = true;

  await assert.rejects(
    syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([record])),
    /Invalid Codex ledger turns blob/,
  );

  assert.equal(await redis.get(redis.activeBlobKey), 'concurrent-corrupt-blob');
  assert.equal(Object.keys(await redis.hgetall(`${prefix}:turns`)).length, 1);
  assert.equal(await redis.get('user:u1:codex:active-generation'), generation);
});

test('pointer change during compaction keeps the old hash and aborts new staging', async () => {
  class PointerChangeRedis extends FakeRedis {
    activeBlobKey = '';
    changePointer = false;

    async set(key, ...args) {
      const result = await super.set(key, ...args);
      if (this.changePointer && key === this.activeBlobKey) {
        this.changePointer = false;
        await super.set('user:u1:codex:active-generation', 'concurrent-generation');
      }
      return result;
    }
  }
  const redis = new PointerChangeRedis();
  const generation = 'pointer-race-generation';
  const record = turnRecord('pointer-race-turn', 42);
  const { prefix } = await seedLegacyHashGeneration(redis, generation, record);
  redis.activeBlobKey = `${prefix}:turns:gzip-base64-v1`;
  redis.changePointer = true;

  await assert.rejects(
    syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([record])),
    /active generation changed during compaction/,
  );

  assert.equal(await redis.get('user:u1:codex:active-generation'), 'concurrent-generation');
  assert.equal(Object.keys(await redis.hgetall(`${prefix}:turns`)).length, 1);
  assert.equal(typeof await redis.get(redis.activeBlobKey), 'string');
  assert.equal(redis.expirations.has(redis.activeBlobKey), true);
});

test('sync never overwrites a corrupt active blob or deletes its legacy hash', async () => {
  const redis = new FakeRedis();
  const generation = 'corrupt-active-blob-generation';
  const record = turnRecord('corrupt-active-blob-turn', 42);
  const { prefix } = await seedLegacyHashGeneration(redis, generation, record);
  const blobKey = `${prefix}:turns:gzip-base64-v1`;
  await redis.set(blobKey, 'corrupt-blob');
  const hashBefore = await redis.hgetall(`${prefix}:turns`);

  await assert.rejects(
    syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([record])),
    /Invalid Codex ledger turns blob/,
  );

  assert.equal(await redis.get(blobKey), 'corrupt-blob');
  assert.deepEqual(await redis.hgetall(`${prefix}:turns`), hashBefore);
  assert.equal(await redis.get('user:u1:codex:active-generation'), generation);
});

test('sync does not compact unpointed legacy ledger storage', async () => {
  class FailNewGenerationBlobRedis extends FakeRedis {
    async set(key, ...args) {
      if (key.endsWith(':turns:gzip-base64-v1')) throw new Error('Injected new generation staging failure');
      return super.set(key, ...args);
    }
  }
  const redis = new FailNewGenerationBlobRedis();
  const record = turnRecord('unpointed-legacy-turn', 42);
  const legacyKey = 'user:u1:codex:turns';
  redis.seedHash(legacyKey, [[record.turn_key, JSON.stringify({
    record,
    device_versions: { mac: record },
    source_devices: ['mac'],
  })]]);
  const hashBefore = await redis.hgetall(legacyKey);

  await assert.rejects(
    syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([record])),
    /Injected new generation staging failure/,
  );

  assert.deepEqual(await redis.hgetall(legacyKey), hashBefore);
  assert.equal(await redis.get('user:u1:codex:active-generation'), null);
});

test('generation reader rejects malformed turns blobs without falling back to a legacy hash', async () => {
  const record = turnRecord('malformed-blob-fallback', 42);
  const legacyEnvelope = JSON.stringify({
    record,
    device_versions: { mac: record },
    source_devices: ['mac'],
  });
  const malformedBlobs = [
    'not-valid-base64!',
    gzipSync('not-json', { level: 1 }).toString('base64'),
    gzipSync(JSON.stringify({ schema: 'wrong-schema', turns: {} }), { level: 1 }).toString('base64'),
    gzipSync(JSON.stringify({ schema: 'codex-ledger-turns-v1', turns: [] }), { level: 1 }).toString('base64'),
  ];

  for (const blob of malformedBlobs) {
    const redis = new FakeRedis();
    const generation = 'malformed-blob-generation';
    const prefix = `user:u1:codex:generation:${generation}`;
    await redis.set('user:u1:codex:active-generation', generation);
    await redis.set(`${prefix}:turns:gzip-base64-v1`, blob);
    redis.seedHash(`${prefix}:turns`, [[record.turn_key, legacyEnvelope]]);

    await assert.rejects(readCodexLedgerView(redis, 'u1'), /Invalid Codex ledger turns blob/);
  }
});

test('new generations write the turns blob without creating a turns hash', async () => {
  const redis = new FakeRedis();

  await syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([turnRecord('blob-only-generation', 10)]));

  const generation = await redis.get('user:u1:codex:active-generation');
  const prefix = `user:u1:codex:generation:${generation}`;
  assert.equal(typeof await redis.get(`${prefix}:turns:gzip-base64-v1`), 'string');
  assert.deepEqual(await redis.hgetall(`${prefix}:turns`), {});
});

test('large generations store one compressed timeseries blob without generation list pushes', async () => {
  class GenerationListTrackingRedis extends FakeRedis {
    generationListPushes = 0;
    timeseriesBlobGets = 0;

    async get(key) {
      if (key.endsWith(':timeseries:gzip-base64-v1')) this.timeseriesBlobGets += 1;
      return super.get(key);
    }

    async rpush(key, ...values) {
      if (/^user:u1:codex:generation:[^:]+:timeseries:/.test(key)) {
        this.generationListPushes += values.length;
      }
      return super.rpush(key, ...values);
    }
  }

  const redis = new GenerationListTrackingRedis();
  const fixtures = Array.from({ length: 800 }, (_, index) => {
    const date = new Date(Date.UTC(2023, 0, index + 1)).toISOString().slice(0, 10);
    const tokens = (index % 9) + 1;
    const record = turnRecord(`large-timeseries-${index}`, tokens);
    record.daily = { [date]: record.daily['2026-08-18'] };
    return { date, tokens, record };
  });

  await syncCodexLedger(redis, 'u1', 'mac', ledgerPayload(fixtures.map(({ record }) => record)));

  const generation = await redis.get('user:u1:codex:active-generation');
  const prefix = `user:u1:codex:generation:${generation}`;
  const blob = await redis.get(`${prefix}:timeseries:gzip-base64-v1`);
  assert.equal(redis.generationListPushes, 0);
  assert.equal(typeof blob, 'string');
  const compressed = Buffer.from(blob, 'base64');
  const decoded = gunzipSync(compressed);
  assert.ok(compressed.byteLength * 5 < decoded.byteLength,
    `expected compressed ${compressed.byteLength} bytes to be less than one fifth of ${decoded.byteLength}`);
  assert.deepEqual((await redis.scan('0', 'MATCH', `${prefix}:timeseries:????-??-??`))[1], []);

  redis.timeseriesBlobGets = 0;
  const view = await readCodexLedgerView(redis, 'u1');
  const visible = await Promise.all(fixtures.map(({ date }) => readCodexLedgerTimeseries(redis, 'u1', date, view)));
  assert.equal(redis.timeseriesBlobGets, 1);
  assert.equal(visible.every((events) => events.length === 1), true);
  assert.deepEqual(visible.map(([raw]) => {
    const event = JSON.parse(raw);
    return { timestamp: event.timestamp, tokens: event.tokens, source: event.source };
  }), fixtures.map(({ date, tokens }) => ({
    timestamp: new Date(`${date}T00:00:00.000Z`).getTime(),
    tokens,
    source: 'codex-ledger-v5',
  })));
});

test('generation timeseries reader remains compatible with pre-compression lists', async () => {
  const redis = new FakeRedis();
  const record = turnRecord('legacy-generation-timeseries', 42);
  const { prefix } = await seedLegacyHashGeneration(redis, 'legacy-timeseries-list', record);
  const oldEvent = JSON.stringify({
    timestamp: 1_787_011_200_000,
    tool: 'codex',
    tokens: 42,
    source: 'codex-ledger-v5',
  });
  await redis.rpush(`${prefix}:timeseries:2026-08-18`, oldEvent);

  assert.deepEqual(await readCodexLedgerTimeseries(redis, 'u1', '2026-08-18'), [oldEvent]);
});

test('generation state safely retains prototype-shaped device ids', async () => {
  const redis = new FakeRedis();
  await syncCodexLedger(redis, 'u1', '__proto__', ledgerPayload([turnRecord('prototype-device', 10)]));

  const view = await readCodexLedgerView(redis, 'u1');
  assert.equal(Object.hasOwn(view.state.devices, '__proto__'), true);
  assert.equal(view.state.devices.__proto__.version, 5);
  assert.deepEqual(view.turns[turnRecord('prototype-device', 10).turn_key].source_devices, ['__proto__']);
});

test('successful publication expires older generations but never the active generation', async () => {
  const redis = new FakeRedis();
  await syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([turnRecord('generation-one', 10)]));
  const first = await readCodexLedgerView(redis, 'u1');
  const firstKeys = (await redis.scan('0', 'MATCH', `${first.prefix}:*`))[1];

  await syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([turnRecord('generation-two', 20)]));
  const second = await readCodexLedgerView(redis, 'u1');
  const secondKeys = (await redis.scan('0', 'MATCH', `${second.prefix}:*`))[1];

  assert.equal(firstKeys.length > 0, true);
  assert.equal(firstKeys.every((key) => redis.expirations.has(key)), true);
  assert.equal(secondKeys.every((key) => !redis.expirations.has(key)), true);

  const firstDeadlines = firstKeys.map((key) => redis.expirations.get(key));
  await new Promise((resolve) => setTimeout(resolve, 2));
  await syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([turnRecord('generation-three', 30)]));
  assert.deepEqual(firstKeys.map((key) => redis.expirations.get(key)), firstDeadlines);
});

test('an ambiguous successful pointer response never deletes the active generation', async () => {
  const redis = new FakeRedis();
  await syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([turnRecord('before-ambiguous', 7)]));

  await assert.rejects(
    syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([turnRecord('after-ambiguous', 110)]), {
      commit: async (operations) => {
        for (const [key, value] of operations.sets || []) await redis.set(key, value);
        throw new Error('Injected lost publication reply');
      },
    }),
    /Injected lost publication reply/,
  );

  const view = await readCodexLedgerView(redis, 'u1');
  assert.equal(view.summary.lifetime.total, 110);
  assert.equal(Object.keys(view.turns).length, 1);
});

test('server canonical storage drops every unrecognized privacy field before Redis persistence', async () => {
  const redis = new FakeRedis();
  const record = turnRecord('privacy-boundary', 10);
  record.model = '/Users/black@example.com/secret-project/private-model';
  record.prompt = 'TOP-LEVEL-SECRET';
  record.file_path = '/secret/project/file.ts';
  record.pricing_tiers.base.prompt = 'TIER-SECRET';
  record.daily['2026-08-18'].file_path = '/secret/daily.ts';
  record.daily['2026-08-18'].pricing_tiers.base.prompt = 'DAILY-TIER-SECRET';

  await syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([record]));

  const serialized = JSON.stringify((await readCodexLedgerView(redis, 'u1')).turns);
  for (const secret of ['TOP-LEVEL-SECRET', '/secret/project', 'TIER-SECRET', '/secret/daily', 'black@example.com', 'secret-project']) {
    assert.equal(serialized.includes(secret), false);
  }
  assert.equal(Object.values((await readCodexLedgerView(redis, 'u1')).turns)[0].record.model, 'unknown');
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

  const events = (await readCodexLedgerTimeseries(redis, 'u1', '2026-08-18')).map(JSON.parse);
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
  assert.deepEqual((await readCodexLedgerTimeseries(redis, 'u1', '2026-08-18')).map(JSON.parse), [
    { tool: 'claude', tokens: 7, source: 'manual' },
  ]);
});

test('a later authoritative empty upload clears a previously non-empty live ledger', async () => {
  const redis = new FakeRedis();
  const first = await kvModule.updateTokenUsageWithRedis(redis, 'u1', 'User', '', {}, 'mac', {
    codexLedger: ledgerPayload([turnRecord('authoritative-before-empty', 10)]),
  });
  assert.equal(first.codex.total, 10);
  assert.equal(first.codex.turns, 1);

  const cleared = await kvModule.updateTokenUsageWithRedis(redis, 'u1', 'User', '', {}, 'mac', {
    codexLedger: ledgerPayload([]),
  });
  const view = await readCodexLedgerView(redis, 'u1');
  assert.equal(cleared.codex.total, 0);
  assert.equal(cleared.codex.turns, 0);
  assert.deepEqual(view.turns, Object.create(null));
  assert.deepEqual(view.state.devices.mac.manifest.turn_keys, []);
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

test('a failed generation timeseries blob write leaves the active generation and legacy list intact', async () => {
  class FailingTimeseriesBlobRedis extends FakeRedis {
    failTimeseriesBlobWrite = false;

    async set(key, ...args) {
      if (this.failTimeseriesBlobWrite && key.endsWith(':timeseries:gzip-base64-v1')) {
        this.failTimeseriesBlobWrite = false;
        throw new Error('Injected generation timeseries blob write failure');
      }
      return super.set(key, ...args);
    }
  }
  const redis = new FailingTimeseriesBlobRedis();
  const key = 'user:u1:timeseries:2026-08-18';
  await syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([turnRecord('original', 7)]));
  const original = Array.from({ length: 501 }, (_, index) => JSON.stringify({
    tool: 'claude', tokens: index + 1, source: 'manual',
  }));
  original.push(JSON.stringify({ tool: 'codex', tokens: 9, source: 'codex-ledger-v5' }));
  await redis.del(key);
  await redis.rpush(key, ...original);
  const before = await readCodexLedgerView(redis, 'u1');
  const legacyBefore = await redis.lrange(key, 0, -1);
  const generationKeysBefore = (await redis.scan('0', 'MATCH', 'user:u1:codex:generation:*'))[1];
  redis.failTimeseriesBlobWrite = true;

  await assert.rejects(
    syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([turnRecord('replacement', 110)])),
    /Injected generation timeseries blob write failure/,
  );
  assert.deepEqual(await readCodexLedgerView(redis, 'u1'), before);
  assert.deepEqual(await redis.lrange(key, 0, -1), legacyBefore);
  assert.deepEqual((await redis.scan('0', 'MATCH', 'user:u1:codex:generation:*'))[1], generationKeysBefore);
});

test('a failed generation blob write leaves the active generation intact', async () => {
  class FailingBlobRedis extends FakeRedis {
    failBlobWrite = false;

    async set(key, ...args) {
      if (this.failBlobWrite && key.endsWith(':turns:gzip-base64-v1')) {
        this.failBlobWrite = false;
        throw new Error('Injected generation blob write failure');
      }
      return super.set(key, ...args);
    }
  }
  const redis = new FailingBlobRedis();
  await syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([turnRecord('original', 7)]));
  const original = await readCodexLedgerView(redis, 'u1');
  const generationKeysBefore = (await redis.scan('0', 'MATCH', 'user:u1:codex:generation:*'))[1];
  const records = Array.from({ length: 501 }, (_, index) => turnRecord(`replacement-${index}`, 1));
  redis.failBlobWrite = true;

  await assert.rejects(
    syncCodexLedger(redis, 'u1', 'mac', ledgerPayload(records)),
    /Injected generation blob write failure/,
  );
  assert.deepEqual(await readCodexLedgerView(redis, 'u1'), original);
  assert.deepEqual((await redis.scan('0', 'MATCH', 'user:u1:codex:generation:*'))[1], generationKeysBefore);
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
  const view = await readCodexLedgerView(redis, 'u1');
  assert.equal(Object.keys(view.turns).length, 70_001);
  assert.equal(view.state.devices.mac.version, 5);
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

  const events = (await readCodexLedgerTimeseries(redis, 'u1', '2026-08-18')).map(JSON.parse);
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

test('list replacement stages have a bounded expiry before they are published', async () => {
  const liveKey = 'user:u1:timeseries:2026-08-18';
  class ObserveStagingExpiryRedis extends FakeRedis {
    pipeline() {
      const pipeline = super.pipeline();
      const exec = pipeline.exec;
      pipeline.exec = async () => {
        const replies = await exec();
        const tempKey = (await this.scan('0', 'MATCH', `${liveKey}:tmp:*`))[1][0];
        if (tempKey && this.stagingTtl === undefined) this.stagingTtl = await this.ttl(tempKey);
        return replies;
      };
      return pipeline;
    }
  }
  const redis = new ObserveStagingExpiryRedis();
  await replaceRedisList(redis, liveKey, ['next-generation']);
  assert.ok(redis.stagingTtl > 0);
  assert.deepEqual(await redis.lrange(liveKey, 0, -1), ['next-generation']);
  assert.equal(await redis.ttl(liveKey), -1);
});

test('successful generation publication removes only equivalent pre-generation Codex copies', async () => {
  const redis = new FakeRedis();
  const record = turnRecord('old-layout', 42);
  const turnsKey = 'user:u1:codex:turns';
  redis.seedHash(turnsKey, [[record.turn_key, JSON.stringify({
    record, device_versions: { mac: record }, source_devices: ['mac'],
  })]]);
  await redis.set('user:u1:codex:summary', JSON.stringify({ lifetime: { total: 42 } }));
  await redis.set('user:u1:device:mac:codex-ledger-version', '5');
  await redis.set('user:u1:device:mac:codex-manifest', JSON.stringify({
    manifest_hash: ledgerPayload([record]).manifest_hash,
    turn_keys: [record.turn_key],
  }));
  await redis.set('user:u1:device:bad:codex-ledger-version', 'not-v5');
  await redis.set('user:u1:device:bad:codex-manifest', '{bad-json');

  await syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([record]));

  assert.deepEqual(await redis.hgetall(turnsKey), {});
  // The legacy summary had a different shape, so it is retained rather than
  // being deleted on an assumption.
  assert.notEqual(await redis.get('user:u1:codex:summary'), null);
  assert.equal(await redis.get('user:u1:device:mac:codex-ledger-version'), null);
  assert.equal(await redis.get('user:u1:device:mac:codex-manifest'), null);
  assert.equal(await redis.get('user:u1:device:bad:codex-ledger-version'), 'not-v5');
  assert.equal(await redis.get('user:u1:device:bad:codex-manifest'), '{bad-json');
});
