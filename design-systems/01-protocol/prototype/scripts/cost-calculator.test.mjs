import test from 'node:test';
import assert from 'node:assert/strict';
import { computeMonthlyBreakdown, clampCalculatorInput } from '../src/lib/cost-calculator.mjs';

test('clamps invalid or extreme inputs safely', () => {
  const clamped = clampCalculatorInput({
    dailyMillions: -10,
    cacheRatePct: 95,
    outputRatePct: 20,
    activeDays: 99,
  });
  assert.equal(clamped.daily, 0.1);
  assert.equal(clamped.cachePct, 95);
  assert.equal(clamped.outPct, 5);
  assert.equal(clamped.inPct, 0);
  assert.equal(clamped.days, 31);
});

test('85% prompt cache hit rate cuts Claude 3.5 Sonnet cost dramatically vs 0% cache', () => {
  const cached = computeMonthlyBreakdown({ dailyMillions: 25, cacheRatePct: 85, outputRatePct: 2, activeDays: 22 });
  const uncached = computeMonthlyBreakdown({ dailyMillions: 25, cacheRatePct: 0, outputRatePct: 2, activeDays: 22 });
  assert.equal(cached.monthlyRawM, 550);
  assert.ok(Math.abs(cached.monthlyNetM - 82.5) < 1e-6);
  // 85% cached should be well below uncached
  assert.ok(cached.sonnetCost * 3 < uncached.sonnetCost);
  assert.ok(cached.sonnetCost > 200, '25M/day at 85% cache should exceed $200/mo API equivalent');
});

test('cost components sum accurately to totalCost for every model', () => {
  const result = computeMonthlyBreakdown({ dailyMillions: 10, cacheRatePct: 80, outputRatePct: 4, activeDays: 20 });
  for (const m of result.models) {
    assert.ok(Math.abs((m.inputCost + m.cacheCost + m.outputCost) - m.totalCost) < 1e-9);
    assert.ok(m.totalCost > 0);
  }
});
