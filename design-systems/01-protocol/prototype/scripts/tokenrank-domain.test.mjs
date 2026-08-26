import assert from 'node:assert/strict';
import test from 'node:test';

import { emptyTier, turnRecord } from './helpers/codex-fixtures.mjs';
import { normalizeModelId, priceUsage } from '../src/lib/token-pricing.mjs';
import {
  aggregateCanonicalTurns,
  metricValue,
  reconcileDeviceTurns,
  sortRankRows,
  validateTurnRecord,
} from '../src/lib/tokenrank-domain.mjs';

test('GPT-5.6 Sol prices cache as a subset of input', () => {
  const result = priceUsage('CodexManager/gpt-5.6-sol', {
    base: { net_new_input: 40, cache_read: 60, cache_write: 0, output: 10 },
    long: emptyTier(),
  });
  assert.equal(result.usd, 0.000384);
  assert.equal(result.estimated, false);
});

test('long context applies 2x input and 1.5x output', () => {
  const result = priceUsage('gpt-5.6-sol', {
    base: emptyTier(),
    long: { net_new_input: 50_000, cache_read: 250_000, cache_write: 0, output: 10_000 },
  });
  assert.equal(result.usd, 0.9);
});

test('Claude Fable 5 retains its normal price in the long bucket', () => {
  const result = priceUsage('claude-fable-5', {
    base: emptyTier(),
    long: { net_new_input: 50_000, cache_read: 250_000, cache_write: 0, output: 10_000 },
  });
  assert.equal(result.usd, 1.25);
  assert.equal(result.estimated, false);
});

test('unknown and legacy aliases retain usable estimated model pricing', () => {
  assert.deepEqual(normalizeModelId('gemini-2.5-pro'), { id: 'gemini-2.5-pro', estimated: true });
  assert.deepEqual(normalizeModelId('vendor/not-a-real-model'), { id: 'gpt-5.6-sol', estimated: true });
});

test('inherited model keys remain estimated, finite, and cannot mutate Object.prototype', () => {
  for (const model of ['__proto__', 'constructor']) {
    assert.equal(normalizeModelId(model).estimated, true);
    const price = priceUsage(model, { base: { net_new_input: 100, cache_read: 0, cache_write: 0, output: 0 }, long: emptyTier() });
    assert.equal(Number.isFinite(price.usd), true);
    assert.equal(price.estimated, true);
  }

  const record = turnRecord('prototype-model', 100, { model: '__proto__' });
  const turns = reconcileDeviceTurns({}, 'mac', [record]);
  aggregateCanonicalTurns(turns);
  assert.equal(Object.hasOwn(Object.prototype, 'input_total'), false);
  assert.equal(Object.hasOwn(Object.prototype, 'cost'), false);
});

test('same turn on two devices counts once', () => {
  const shared = turnRecord('same', 110);
  const windowsOnly = turnRecord('windows-only', 220);
  let turns = reconcileDeviceTurns({}, 'mac', [shared]);
  turns = reconcileDeviceTurns(turns, 'windows', [shared, windowsOnly]);
  const sum = aggregateCanonicalTurns(turns);
  assert.equal(sum.lifetime.total, 330);
  assert.deepEqual(turns[shared.turn_key].source_devices.sort(), ['mac', 'windows']);
});

test('removing the best device version downgrades to the remaining valid version', () => {
  const key = turnRecord('shared', 100).turn_key;
  let turns = reconcileDeviceTurns({}, 'mac', [turnRecord('shared', 100)]);
  turns = reconcileDeviceTurns(turns, 'windows', [turnRecord('shared', 300)]);
  turns = reconcileDeviceTurns(turns, 'windows', []);
  assert.equal(turns[key].record.total, 100);
  assert.deepEqual(turns[key].source_devices, ['mac']);
});

test('removing a local turn keeps another device source intact', () => {
  const shared = turnRecord('shared', 110);
  let turns = reconcileDeviceTurns({}, 'mac', [shared]);
  turns = reconcileDeviceTurns(turns, 'windows', [shared]);
  turns = reconcileDeviceTurns(turns, 'mac', []);
  assert.equal(aggregateCanonicalTurns(turns).lifetime.total, 110);
  assert.deepEqual(turns[shared.turn_key].source_devices, ['windows']);
});

test('a repeated full sync is idempotent', () => {
  const incoming = [turnRecord('same', 110), turnRecord('other', 220)];
  const once = reconcileDeviceTurns({}, 'mac', incoming);
  const twice = reconcileDeviceTurns(once, 'mac', incoming);
  assert.deepEqual(twice, once);
});

test('a same-device full sync authoritatively replaces corrected lower usage', () => {
  const key = turnRecord('corrected', 300).turn_key;
  let turns = reconcileDeviceTurns({}, 'mac', [turnRecord('corrected', 300)]);
  turns = reconcileDeviceTurns(turns, 'mac', [turnRecord('corrected', 100)]);
  assert.equal(turns[key].device_versions.mac.total, 100);
  assert.equal(turns[key].record.total, 100);
});

test('record validation rejects forged keys, inconsistent counters, and invalid days', () => {
  assert.equal(validateTurnRecord({ ...turnRecord('bad-key', 10), turn_key: 'bad' }), null);
  assert.equal(validateTurnRecord({ ...turnRecord('bad-total', 10), total: 11 }), null);
  assert.equal(validateTurnRecord({ ...turnRecord('bad-day', 10), daily: { invalid: turnRecord('day', 10) } }), null);
});

test('aggregate lifetime equals daily totals and bills only via pricing tiers', () => {
  const first = turnRecord('first', 100, {
    daily: {
      '2026-08-18': { input_total: 100, net_new_input: 100, output: 0, cache_read: 0, cache_write: 0, total: 100, norm: 100 },
    },
  });
  const second = turnRecord('second', 50, {
    model: 'claude-fable-5',
    daily: {
      '2026-08-19': { input_total: 50, net_new_input: 50, output: 0, cache_read: 0, cache_write: 0, total: 50, norm: 50 },
    },
  });
  let turns = reconcileDeviceTurns({}, 'mac', [first, second]);
  const aggregate = aggregateCanonicalTurns(turns);
  assert.equal(aggregate.lifetime.total, 150);
  assert.equal(Object.values(aggregate.daily).reduce((sum, day) => sum + day.total, 0), 150);
  assert.equal(aggregate.models['gpt-5.6-sol'].total, 100);
  assert.equal(aggregate.models['claude-fable-5'].total, 50);
  assert.equal(metricValue(aggregate, 'total'), 150);
  assert.equal(metricValue(aggregate, 'norm'), 150);
  assert.equal(metricValue(aggregate, 'cost'), 0.0009);
});

test('rank sorting uses user id ascending to resolve equal metrics', () => {
  const sorted = sortRankRows([
    { userId: 'z', aggregate: { lifetime: { total: 10, norm: 9, cost: 1 } } },
    { userId: 'a', aggregate: { lifetime: { total: 10, norm: 8, cost: 2 } } },
    { userId: 'm', aggregate: { lifetime: { total: 20, norm: 1, cost: 0 } } },
  ], 'total');
  assert.deepEqual(sorted.map((row) => row.userId), ['m', 'a', 'z']);
});

test('rank sorting uses exact code-unit user ID order when locale comparison ties', () => {
  const composed = 'é';
  const decomposed = 'e\u0301';
  const sorted = sortRankRows([
    { userId: composed, aggregate: { lifetime: { total: 10 } } },
    { userId: decomposed, aggregate: { lifetime: { total: 10 } } },
  ], 'total');
  assert.deepEqual(sorted.map((row) => row.userId), [decomposed, composed]);
});
