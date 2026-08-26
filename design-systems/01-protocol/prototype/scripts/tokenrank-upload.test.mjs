import assert from 'node:assert/strict';
import test from 'node:test';

import * as kvModule from '../src/lib/kv.ts';
import { normalizeDeviceUpload, normalizeToolTokens } from '../src/lib/tokenrank-domain.mjs';
import { ledgerPayload, turnRecord } from './helpers/codex-fixtures.mjs';
import { FakeRedis } from './helpers/fake-redis.mjs';

test('legacy Codex raw_total becomes main total instead of cache-subtracted total', () => {
  const normalized = normalizeToolTokens('codex', {
    total: 6_089_897,
    raw_total: 185_053_353,
    in: 184_486_751,
    out: 566_602,
    cache_read: 178_963_456,
    cache_write: 0,
  });

  assert.equal(normalized.total, 185_053_353);
  assert.equal(normalized.norm, 6_089_897);
});

test('v5 device data removes legacy Codex snapshot but preserves Claude', () => {
  const input = {
    codex: { total: 100, raw_total: 100 },
    codex_proxy: { total: 50, raw_total: 50 },
    claude: { total: 20, raw_total: 20 },
  };

  const normalized = normalizeDeviceUpload(input, { hasCodexLedger: true });

  assert.equal(normalized.codex, undefined);
  assert.equal(normalized.codex_proxy, undefined);
  assert.ok(normalized.claude);
});

test('v4 upload stores raw_total as the main Codex total and derived norm', async () => {
  const redis = new FakeRedis();

  await kvModule.updateTokenUsageWithRedis(redis, 'u1', 'User', '', {
    codex: {
      total: 6_089_897,
      raw_total: 185_053_353,
      in: 184_486_751,
      out: 566_602,
      cache_read: 178_963_456,
      cache_write: 0,
    },
  }, 'legacy-mac');

  const device = JSON.parse(await redis.get('user:u1:device:legacy-mac:data'));
  const profile = JSON.parse(await redis.get('user:u1:data'));
  assert.equal(device.tokens.codex.total, 185_053_353);
  assert.equal(device.tokens.codex.norm, 6_089_897);
  assert.equal(profile.tokens.codex.total, 185_053_353);
  assert.equal(profile.tokens.codex.norm, 6_089_897);
});

test('v5 migration removes only the uploading device legacy Codex and injects canonical totals once', async () => {
  const redis = new FakeRedis();
  await redis.set('user:u1:device:mac:data', JSON.stringify({ tokens: {
    codex: { total: 100, raw_total: 100 },
    codex_proxy: { total: 50, raw_total: 50 },
    claude: { total: 10, raw_total: 10 },
  } }));
  await redis.set('user:u1:device:windows:data', JSON.stringify({ tokens: {
    codex: { total: 40, raw_total: 40 },
  } }));
  const payload = ledgerPayload([turnRecord('canonical', 110)]);

  const first = await kvModule.updateTokenUsageWithRedis(redis, 'u1', 'User', '', {
    codex: { total: 200, raw_total: 200 },
    codex_proxy: { total: 80, raw_total: 80 },
    claude: { total: 20, raw_total: 20 },
  }, 'mac', { codexLedger: payload });
  const firstDevice = JSON.parse(await redis.get('user:u1:device:mac:data'));
  const firstProfile = JSON.parse(await redis.get('user:u1:data'));

  assert.equal(firstDevice.tokens.codex, undefined);
  assert.equal(firstDevice.tokens.codex_proxy, undefined);
  assert.equal(firstDevice.tokens.claude.total, 20);
  assert.equal(firstProfile.tokens.codex.total, 150);
  assert.equal(firstProfile.tokens.codex.norm, 150);
  assert.equal(firstProfile.tokens.codex.turns, 1);
  assert.equal(firstProfile.tokens.total, 170);
  assert.deepEqual(first, {
    codex: { total: 110, norm: 110, cost: 0.00044, turns: 1 },
    pricing_snapshot_date: '2026-08-26',
  });

  const second = await kvModule.updateTokenUsageWithRedis(redis, 'u1', 'User', '', {
    claude: { total: 20, raw_total: 20 },
  }, 'mac', { codexLedger: payload });
  const secondProfile = JSON.parse(await redis.get('user:u1:data'));
  assert.equal(secondProfile.tokens.codex.total, 150);
  assert.equal(secondProfile.tokens.codex.turns, 1);
  assert.deepEqual(second, first);
  assert.equal(redis.sortedSets.get('leaderboard:total').get('u1'), 170);

  await kvModule.updateTokenUsageWithRedis(redis, 'u1', 'User', '', {
    codex: { total: 50, raw_total: 50 },
  }, 'windows');
  const legacyProfile = JSON.parse(await redis.get('user:u1:data'));
  assert.equal(legacyProfile.tokens.codex.total, 160);
  assert.equal(legacyProfile.tokens.codex.turns, 1);
  assert.equal(redis.sortedSets.get('leaderboard:total').get('u1'), 180);
});

test('malformed v5 fails before device and profile mutation and releases the update lock', async () => {
  const redis = new FakeRedis();
  await redis.set('user:u1:device:mac:codex-ledger-version', '5');
  const malformed = { ...ledgerPayload([turnRecord('bad', 10)]), manifest_hash: '0'.repeat(64) };

  await assert.rejects(
    kvModule.updateTokenUsageWithRedis(redis, 'u1', 'User', '', {
      claude: { total: 20, raw_total: 20 },
    }, 'mac', { codexLedger: malformed }),
    /Invalid Codex ledger payload/,
  );

  assert.equal(await redis.get('user:u1:device:mac:data'), null);
  assert.equal(await redis.get('user:u1:data'), null);
  assert.equal(await redis.get('user:u1:update-lock'), null);
  assert.equal(await redis.get('user:u1:device:mac:codex-ledger-version'), '5');
  assert.equal(redis.sortedSets.has('leaderboard:total'), false);
});

test('persisted v5 marker prevents the same device from reintroducing legacy Codex', async () => {
  const redis = new FakeRedis();
  const payload = ledgerPayload([turnRecord('durable-migration', 110)]);

  await kvModule.updateTokenUsageWithRedis(redis, 'u1', 'User', '', {
    codex: { total: 200, raw_total: 200 },
    claude: { total: 10, raw_total: 10 },
  }, 'mac', { codexLedger: payload });

  await kvModule.updateTokenUsageWithRedis(redis, 'u1', 'User', '', {
    codex: { total: 200, raw_total: 200 },
    codex_proxy: { total: 80, raw_total: 80 },
    claude: { total: 20, raw_total: 20 },
  }, 'mac', {
    historyData: {
      '2026-08-18': {
        codex: { total: 100, raw_total: 100 },
        codex_proxy: { total: 40, raw_total: 40 },
        claude: { total: 7, raw_total: 7 },
      },
    },
    historyCompleteTools: ['codex', 'codex_proxy', 'claude'],
  });

  const device = JSON.parse(await redis.get('user:u1:device:mac:data'));
  const profile = JSON.parse(await redis.get('user:u1:data'));
  const keys = (await redis.scan('0', 'MATCH', 'user:u1:timeseries:*'))[1];
  const events = (await Promise.all(keys.map((key) => redis.lrange(key, 0, -1))))
    .flat().map(JSON.parse);

  assert.equal(device.tokens.codex, undefined);
  assert.equal(device.tokens.codex_proxy, undefined);
  assert.equal(device.tokens.claude.total, 20);
  assert.equal(profile.tokens.codex.total, 110);
  assert.equal(profile.tokens.claude.total, 20);
  assert.equal(profile.tokens.total, 130);
  assert.equal(redis.sortedSets.get('leaderboard:total').get('u1'), 130);
  assert.equal(events.filter((event) => ['codex', 'codex_proxy'].includes(event.tool)
    && event.source !== 'codex-ledger-v5').length, 0);
  assert.equal(await redis.get('user:u1:device:mac:codex-ledger-version'), '5');
  assert.equal(await redis.get('user:u1:update-lock'), null);
});

test('aggregation ignores stale legacy Codex snapshots from every marked v5 device', async () => {
  const redis = new FakeRedis();
  const payload = ledgerPayload([turnRecord('canonical-before-stale-snapshot', 110)]);
  await kvModule.updateTokenUsageWithRedis(redis, 'u1', 'User', '', {
    claude: { total: 10, raw_total: 10 },
  }, 'mac', { codexLedger: payload });

  await redis.set('user:u1:device:mac:data', JSON.stringify({ tokens: {
    codex: { total: 200, raw_total: 200 },
    codex_proxy: { total: 80, raw_total: 80 },
    claude: { total: 10, raw_total: 10 },
  } }));

  await kvModule.updateTokenUsageWithRedis(redis, 'u1', 'User', '', {
    codex: { total: 40, raw_total: 40 },
  }, 'windows');

  const profile = JSON.parse(await redis.get('user:u1:data'));
  assert.equal(profile.tokens.codex.total, 150);
  assert.equal(profile.tokens.codex_proxy, undefined);
  assert.equal(profile.tokens.claude.total, 10);
  assert.equal(profile.tokens.total, 160);
  assert.equal(redis.sortedSets.get('leaderboard:total').get('u1'), 160);
});

test('persisted marker read errors release the update lock before mutation', async () => {
  class MarkerReadFailureRedis extends FakeRedis {
    async get(key) {
      if (key === 'user:u1:device:mac:codex-ledger-version') {
        throw new Error('Injected marker read failure');
      }
      return super.get(key);
    }
  }
  const redis = new MarkerReadFailureRedis();

  await assert.rejects(
    kvModule.updateTokenUsageWithRedis(redis, 'u1', 'User', '', {
      claude: { total: 20, raw_total: 20 },
    }, 'mac'),
    /Injected marker read failure/,
  );

  assert.equal(await redis.get('user:u1:device:mac:data'), null);
  assert.equal(await redis.get('user:u1:data'), null);
  assert.equal(await redis.get('user:u1:update-lock'), null);
});
