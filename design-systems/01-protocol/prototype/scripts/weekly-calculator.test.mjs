import test from 'node:test';
import assert from 'node:assert/strict';

const moduleUrl = new URL('../src/lib/weekly-calculator.ts', import.meta.url);
const { calculateWeeklyPace } = await import(moduleUrl.href);

test('invalid inputs return invalid result with safe defaults', () => {
  for (const [used, reset] of [
    [-5, '2026-10-05T20:00'],
    [105, '2026-10-05T20:00'],
    [50, 'bad-date'],
    [50, '2026-02-30T20:00'],
    [NaN, '2026-10-05T20:00'],
  ]) {
    const res = calculateWeeklyPace(used, reset);
    assert.equal(res.isValid, false);
    assert.equal(res.tier, 'invalid');
  }
});

test('past or due reset time returns isResetDue: true', () => {
  const fakeNow = Date.parse('2026-10-05T12:00:00+08:00');
  const pastReset = '2026-10-05T10:00';
  const res = calculateWeeklyPace(60, pastReset, 7, fakeNow);
  assert.equal(res.isValid, true);
  assert.equal(res.isResetDue, true);
  assert.equal(res.tier, 'due');
});

test('low usage with ample time left yields comfortable tier', () => {
  // 5 days remaining in a 7-day cycle, only 10% used
  const fakeNow = Date.parse('2026-10-01T12:00:00+08:00');
  const futureReset = '2026-10-06T12:00';
  const res = calculateWeeklyPace(10, futureReset, 7, fakeNow);
  assert.equal(res.isValid, true);
  assert.equal(res.isResetDue, false);
  assert.equal(res.tier, 'comfortable');
  assert.ok(res.dailyBudgetPercent > 0);
  assert.ok(res.projectedTotalPercent < 70);
});

test('heavy usage with lots of time remaining projects early exhaustion', () => {
  // 5 days remaining in a 7-day cycle, already 80% used in 2 days (40%/day)
  const fakeNow = Date.parse('2026-10-01T12:00:00+08:00');
  const futureReset = '2026-10-06T12:00';
  const res = calculateWeeklyPace(80, futureReset, 7, fakeNow);
  assert.equal(res.isValid, true);
  assert.equal(res.tier, 'exhausted');
  assert.ok(res.projectedTotalPercent >= 100);
  assert.ok(res.depletionTimeBeijing);
  assert.ok(res.depletionTimeIso);
});

test('custom cycle days like 30-day billing works smoothly', () => {
  const fakeNow = Date.parse('2026-10-01T12:00:00+08:00');
  const futureReset = '2026-10-20T12:00';
  const res = calculateWeeklyPace(30, futureReset, 30, fakeNow);
  assert.equal(res.isValid, true);
  assert.ok(res.remainingDays > 10);
});
