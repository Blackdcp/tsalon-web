import assert from 'node:assert/strict';
import test from 'node:test';
import { startLocalRedis } from './helpers/local-redis.mjs';
import { ledgerPayload, turnRecord } from './helpers/codex-fixtures.mjs';
import { getLeaderboardWithRedis, updateTokenUsageWithRedis } from '../src/lib/kv.ts';
import { readCodexLedgerView, readCodexRankView } from '../src/lib/codex-ledger.ts';
import { RANK_DATA_REVISION_KEY } from '../src/lib/rank-cache.ts';

test('real Redis shares public cache across clients and invalidates it with the upload transaction', async (t) => {
  const { redis, stop } = await startLocalRedis();
  const other = redis.duplicate();
  t.after(async () => { other.disconnect(); await stop(); });
  const upload = (total) => updateTokenUsageWithRedis(redis, 'u1', 'Test User', '', {}, 'desktop', {
    codexLedger: ledgerPayload([turnRecord('shared-turn', total)]),
  });
  await upload(100);
  const generation = await redis.get('user:u1:codex:active-generation');
  const projection = `user:u1:codex:generation:${generation}:rank-state:v1`;
  assert.equal(await redis.ttl(projection), -1, 'published projection is persistent');
  const before = await redis.get(RANK_DATA_REVISION_KEY);
  assert.ok(before);
  const first = await getLeaderboardWithRedis(redis, 100, 'all');
  assert.equal(first[0].metrics.total, 100);

  const reads = [];
  const get = other.get.bind(other);
  other.get = async (key) => { reads.push(key); return get(key); };
  assert.deepEqual(await getLeaderboardWithRedis(other, 100, 'all'), first);
  assert.equal(reads.some(key => key.startsWith('user:')), false, 'second client reuses Redis cache');
  const cacheKey = reads.find(key => key.startsWith('tokenrank:cache:'));
  const ttl = await redis.ttl(cacheKey);
  assert.ok(ttl > 0 && ttl <= 300);

  await upload(250);
  assert.notEqual(await redis.get(RANK_DATA_REVISION_KEY), before);
  assert.equal((await getLeaderboardWithRedis(other, 100, 'all'))[0].metrics.total, 250);
  assert.equal((await readCodexLedgerView(redis, 'u1')).state.devices.desktop.manifest.turn_keys.length, 1);
  assert.equal('manifest' in (await readCodexRankView(redis, 'u1')).state.devices.desktop, false);
  assert.ok(await redis.ttl(projection) > 0, 'retired generation has bounded cleanup lifetime');
});
