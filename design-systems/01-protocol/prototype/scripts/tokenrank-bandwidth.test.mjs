import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { FakeRedis } from './helpers/fake-redis.mjs';
import { ledgerPayload, turnRecord } from './helpers/codex-fixtures.mjs';
import { readCodexLedgerTimeseries, readCodexRankView, syncCodexLedger } from '../src/lib/codex-ledger.ts';
import { getLeaderboardWithRedis, updateTokenUsageWithRedis } from '../src/lib/kv.ts';
import { beijingDateString } from '../src/lib/date.ts';
import { cachedRankRows, RANK_DATA_REVISION_KEY } from '../src/lib/rank-cache.ts';

class MeteredRedis extends FakeRedis {
  reads = [];
  bytes = 0;
  async get(key) {
    const value = await super.get(key);
    this.reads.push(key);
    this.bytes += value === null ? 0 : Buffer.byteLength(value);
    return value;
  }
  async zrevrange(key, start, end) {
    const ids = [...(this.sortedSets.get(key) || [])].sort((a, b) => b[1] - a[1]).map(([id]) => id);
    return ids.slice(start, end === -1 ? undefined : end + 1);
  }
  resetMeter() { this.reads = []; this.bytes = 0; }
}

function recordOn(id, total, date = beijingDateString()) {
  const record = turnRecord(id, total);
  record.daily = { [date]: Object.values(record.daily)[0] };
  return record;
}

async function seed(redis, user = 'u1', total = 100, date) {
  await syncCodexLedger(redis, user, 'desktop', ledgerPayload([recordOn(user, total, date)]));
  await redis.set(`user:${user}:data`, JSON.stringify({
    userId: user, name: user, image: '', updatedAt: '2026-10-21T00:00:00Z',
    tokens: { total: total + 20, codex: { total }, claude: { total: 20, norm: 20, cost: 0.01 } },
  }));
  await redis.zadd('leaderboard:total', total + 20, user);
  return `user:${user}:codex:generation:${await redis.get(`user:${user}:codex:active-generation`)}`;
}

test('cold lifetime ranking stays under 50 KB with large retained audit manifests', async () => {
  const redis = new MeteredRedis();
  const prefix = await seed(redis);
  await seed(redis, 'u2', 40);
  const state = JSON.parse(await redis.get(prefix + ':state'));
  state.devices.desktop.manifest.turn_keys = Array.from({ length: 33168 }, (_, i) => createHash('sha256').update(String(i)).digest('hex'));
  const original = JSON.stringify(state);
  await redis.set(prefix + ':state', original);
  redis.resetMeter();
  const rows = await getLeaderboardWithRedis(redis, 100, 'all', 'total');
  assert.deepEqual(rows.map(row => [row.userId, row.metrics.total]), [['u1', 120], ['u2', 60]]);
  assert.ok(redis.bytes < 50_000, `rank read ${redis.bytes} bytes`);
  assert.equal(redis.reads.includes(prefix + ':state'), false, 'rank readers must use the projection');
  assert.equal(await FakeRedis.prototype.get.call(redis, prefix + ':state'), original, 'audit manifest is retained');
});

test('period discovery and aggregation resolve each user generation only once', async () => {
  const redis = new MeteredRedis();
  await seed(redis);
  redis.resetMeter();
  const rows = await getLeaderboardWithRedis(redis, 100, 'today', 'total');
  assert.equal(rows[0].metrics.total, 100);
  assert.equal(redis.reads.filter(key => key === 'user:u1:codex:active-generation').length, 1);
});

test('pre-projection generations are read compatibly and reuse the derived projection', async () => {
  const redis = new MeteredRedis();
  const prefix = await seed(redis);
  await redis.del(prefix + ':rank-state:v1');
  const original = await redis.get(prefix + ':state');
  const first = await readCodexRankView(redis, 'u1');
  redis.resetMeter();
  const second = await readCodexRankView(redis, 'u1');
  assert.deepEqual(second, first);
  assert.equal(redis.reads.includes(prefix + ':state'), false);
  assert.equal(second.state.devices.desktop.version, 5);
  assert.equal('manifest' in second.state.devices.desktop, false);
  assert.equal(await FakeRedis.prototype.get.call(redis, prefix + ':state'), original);
  assert.ok(await redis.ttl(prefix + ':rank-state:v1') > 0, 'derived keys have bounded lifetime');
});

test('a projection write failure cannot publish an incomplete new generation', async () => {
  const redis = new MeteredRedis();
  await seed(redis);
  const before = await redis.get('user:u1:codex:active-generation');
  const set = redis.set.bind(redis);
  redis.set = async (key, ...args) => {
    if (key.endsWith(':rank-state:v1')) throw new Error('projection write failed');
    return set(key, ...args);
  };
  await assert.rejects(syncCodexLedger(redis, 'u1', 'desktop', ledgerPayload([recordOn('u1', 200)])), /projection write failed/);
  assert.equal(await redis.get('user:u1:codex:active-generation'), before);
  assert.equal((await readCodexRankView(redis, 'u1')).summary.lifetime.total, 100);
});

test('a pinned rank view never mixes the next generation timeseries into the old one', async () => {
  const redis = new MeteredRedis();
  await seed(redis);
  const old = await readCodexRankView(redis, 'u1');
  await syncCodexLedger(redis, 'u1', 'desktop', ledgerPayload([recordOn('u1', 200)]));
  const oldEvents = (await readCodexLedgerTimeseries(redis, 'u1', beijingDateString(), old)).map(JSON.parse);
  const nextEvents = (await readCodexLedgerTimeseries(redis, 'u1', beijingDateString())).map(JSON.parse);
  assert.equal(oldEvents.reduce((sum, event) => sum + event.rawTokens, 0), 100);
  assert.equal(nextEvents.reduce((sum, event) => sum + event.rawTokens, 0), 200);
});

test('rank results share a cache across metrics and limits without truncating candidates', async () => {
  const redis = new MeteredRedis();
  await seed(redis);
  await seed(redis, 'u2', 200);
  const first = await getLeaderboardWithRedis(redis, 1, 'all', 'total');
  assert.equal(first[0].userId, 'u2');
  first[0].tokens.codex.total = -1;
  redis.resetMeter();
  const second = await getLeaderboardWithRedis(redis, 100, 'all', 'cost');
  assert.equal(second.length, 2);
  assert.equal(second[0].tokens.codex.total, 200);
  assert.equal(redis.reads.some(key => key.startsWith('user:')), false, 'cache hits must not reread user ledgers');
});

test('a successful non-Codex upload invalidates every cached public time window', async () => {
  const redis = new MeteredRedis();
  await updateTokenUsageWithRedis(redis, 'u1', 'One', '', { claude: { total: 10 } }, 'desktop');
  assert.equal((await getLeaderboardWithRedis(redis, 100, 'all'))[0].metrics.total, 10);
  await updateTokenUsageWithRedis(redis, 'u1', 'One', '', { claude: { total: 25 } }, 'desktop');
  assert.equal((await getLeaderboardWithRedis(redis, 100, 'all'))[0].metrics.total, 25);
});

test('a corrected Codex generation invalidates cached ranking even before another profile upload', async () => {
  const redis = new MeteredRedis();
  await seed(redis);
  assert.equal((await getLeaderboardWithRedis(redis, 100, 'all'))[0].metrics.total, 120);
  await syncCodexLedger(redis, 'u1', 'desktop', ledgerPayload([recordOn('u1', 30)]));
  assert.equal((await getLeaderboardWithRedis(redis, 100, 'all'))[0].metrics.total, 50);
});

test('public ranking expires after five minutes even when changed by legacy maintenance', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-10-21T01:00:00Z') });
  const redis = new MeteredRedis();
  await redis.set('user:u1:data', JSON.stringify({ userId: 'u1', tokens: { total: 10, claude: { total: 10 } } }));
  await redis.zadd('leaderboard:total', 10, 'u1');
  assert.equal((await getLeaderboardWithRedis(redis, 100, 'all'))[0].metrics.total, 10);
  await redis.set('user:u1:data', JSON.stringify({ userId: 'u1', tokens: { total: 20, claude: { total: 20 } } }));
  t.mock.timers.tick(299_000);
  assert.equal((await getLeaderboardWithRedis(redis, 100, 'all'))[0].metrics.total, 10);
  t.mock.timers.tick(2_000);
  assert.equal((await getLeaderboardWithRedis(redis, 100, 'all'))[0].metrics.total, 20);
});

test('Beijing midnight changes the cached today and yesterday windows immediately', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-10-21T15:59:59Z') });
  const redis = new MeteredRedis();
  await seed(redis, 'u1', 100, '2026-10-21');
  assert.equal((await getLeaderboardWithRedis(redis, 100, 'today'))[0].metrics.total, 100);
  assert.deepEqual(await getLeaderboardWithRedis(redis, 100, 'yesterday'), []);
  t.mock.timers.tick(2_000);
  assert.deepEqual(await getLeaderboardWithRedis(redis, 100, 'today'), []);
  assert.equal((await getLeaderboardWithRedis(redis, 100, 'yesterday'))[0].metrics.total, 100);
});

test('a failed cache write never turns a valid public ranking into an error', async () => {
  const redis = new MeteredRedis();
  await seed(redis);
  const set = redis.set.bind(redis);
  redis.set = async (key, ...args) => {
    if (key.startsWith('tokenrank:cache:')) throw new Error('cache write denied');
    return set(key, ...args);
  };
  assert.equal((await getLeaderboardWithRedis(redis, 100, 'all'))[0].metrics.total, 120);
});

const cacheRow = (total) => ({ userId: 'u1', tokens: { total }, metrics: { total, norm: total, cost: 0 } });

test('concurrent cache misses share one computation and return independent rows', async () => {
  const redis = new MeteredRedis();
  let calls = 0;
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const load = async () => { calls++; await gate; return [cacheRow(10)]; };
  const requests = Array.from({ length: 12 }, () => cachedRankRows(redis, 'all', new Date(), load));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1);
  release();
  const results = await Promise.all(requests);
  assert.equal(results.length, 12);
  results[0][0].tokens.total = -1;
  assert.equal(results[1][0].tokens.total, 10);
});

test('failed computations and malformed cache entries are retried, never cached as empty ranks', async () => {
  const redis = new MeteredRedis();
  const now = new Date();
  await assert.rejects(cachedRankRows(redis, 'all', now, async () => { throw new Error('ledger unavailable'); }), /ledger unavailable/);
  const load = async () => [cacheRow(10)];
  assert.equal((await cachedRankRows(redis, 'all', now, load))[0].metrics.total, 10);
  const cacheKey = redis.reads.find(key => key.startsWith('tokenrank:cache:'));
  await redis.set(cacheKey, '{invalid JSON');
  assert.equal((await cachedRankRows(redis, 'all', now, load))[0].metrics.total, 10);
});

test('an in-flight old ranking cannot populate the cache after upload invalidation', async () => {
  const redis = new MeteredRedis();
  await redis.set(RANK_DATA_REVISION_KEY, 'before');
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const now = new Date();
  const old = cachedRankRows(redis, 'today', now, async () => { await gate; return [cacheRow(10)]; });
  await new Promise(resolve => setImmediate(resolve));
  await redis.set(RANK_DATA_REVISION_KEY, 'after');
  assert.equal((await cachedRankRows(redis, 'today', now, async () => [cacheRow(20)]))[0].metrics.total, 20);
  release();
  assert.equal((await old)[0].metrics.total, 10);
  const oldKey = redis.reads.find(key => key.startsWith('tokenrank:cache:') && key.endsWith(':before'));
  assert.equal(await redis.get(oldKey), null);
  assert.equal((await cachedRankRows(redis, 'today', now, async () => { throw new Error('must hit new cache'); }))[0].metrics.total, 20);
});

test('all seven windows preserve totals, normalized tokens and costs on cold and warm reads', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-10-21T01:00:00Z') });
  const redis = new MeteredRedis();
  await seed(redis);
  const dates = ['2026-10-21', '2026-10-20', '2026-10-19', '2026-10-15', '2026-09-22', '2026-07-24', '2026-07-23'];
  await syncCodexLedger(redis, 'u1', 'desktop', ledgerPayload(dates.map((date, index) => recordOn(String(index), 100, date))));
  const totals = { today: 100, yesterday: 100, '3d': 300, '7d': 400, '30d': 500, '90d': 600, all: 720 };
  for (const [time, total] of Object.entries(totals)) {
    for (const metric of ['total', 'norm', 'cost']) {
      const rows = await getLeaderboardWithRedis(redis, 100, time, metric);
      assert.equal(rows.length, 1, `${time}/${metric}`);
      assert.equal(rows[0].metrics.total, total, `${time}/${metric} total`);
      assert.equal(rows[0].metrics.norm, total, `${time}/${metric} norm`);
      const cost = time === 'all' ? 700 * 4 / 1_000_000 + 0.01 : total * 4 / 1_000_000;
      assert.ok(Math.abs(rows[0].metrics.cost - cost) < 1e-9, `${time}/${metric} cost`);
      assert.deepEqual(await getLeaderboardWithRedis(redis, 100, time, metric), rows);
    }
  }
});
