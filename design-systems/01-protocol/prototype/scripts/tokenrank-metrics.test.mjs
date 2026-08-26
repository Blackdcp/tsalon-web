import assert from 'node:assert/strict';
import test from 'node:test';

import * as domain from '../src/lib/tokenrank-domain.mjs';

test('metric selector ranks the same rows by the selected value', () => {
  const rows = [
    { userId: 'cache-heavy', metrics: { total: 1_000, norm: 100, cost: 1 } },
    { userId: 'fresh-heavy', metrics: { total: 500, norm: 400, cost: 2 } },
  ];

  assert.deepEqual(domain.sortRankRows(rows, 'total').map((row) => row.userId), ['cache-heavy', 'fresh-heavy']);
  assert.deepEqual(domain.sortRankRows(rows, 'norm').map((row) => row.userId), ['fresh-heavy', 'cache-heavy']);
  assert.deepEqual(domain.sortRankRows(rows, 'cost').map((row) => row.userId), ['fresh-heavy', 'cache-heavy']);
});

test('canonical events aggregate total norm and cost from the same rows', () => {
  const aggregate = domain.aggregateRankEvents([
    { tool: 'codex', tokens: 60, rawTokens: 100, normTokens: 40, costUsd: 0.25 },
    { tool: 'claude', tokens: 50, normTokens: 45, costUsd: 0.75 },
  ]);

  assert.deepEqual(aggregate.metrics, { total: 150, norm: 85, cost: 1 });
  assert.equal(aggregate.tokens.total, 150);
  assert.equal(aggregate.tokens.codex.total, 100);
  assert.equal(aggregate.tokens.codex.norm, 40);
  assert.equal(aggregate.tokens.codex.cost, 0.25);
  assert.equal(aggregate.tokens.claude.total, 50);
  assert.equal(aggregate.tokens.claude.norm, 45);
  assert.equal(aggregate.tokens.claude.cost, 0.75);
});

test('rank query defaults to today total and preserves legacy cost mode', () => {
  assert.deepEqual(domain.resolveRankQuery(new URLSearchParams()), { time: 'today', metric: 'total' });
  assert.deepEqual(domain.resolveRankQuery(new URLSearchParams('time=7d&metric=norm')), { time: '7d', metric: 'norm' });
  assert.deepEqual(domain.resolveRankQuery(new URLSearchParams('time=invalid&metric=invalid&mode=cost')), { time: 'today', metric: 'cost' });
});

test('lifetime profile metrics preserve total tokens and sum norm and cost by tool', () => {
  const metrics = domain.rankMetricsFromTokens({
    total: 300,
    codex: { total: 200, norm: 80, cost: 1.25 },
    claude: { total: 100, norm: 90, cost: 2.5 },
  });

  assert.deepEqual(metrics, { total: 300, norm: 170, cost: 3.75 });
});
