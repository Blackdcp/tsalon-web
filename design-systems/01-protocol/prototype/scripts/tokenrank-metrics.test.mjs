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

test('legacy non-Codex window events derive missing norm and cost centrally', () => {
  const aggregate = domain.aggregateRankEvents([
    {
      tool: 'claude', model: 'claude', tokens: 1_000_000, rawTokens: 1_000_000,
      cacheReadTokens: 400_000, cacheWriteTokens: 0,
    },
  ]);

  assert.deepEqual(aggregate.metrics, { total: 1_000_000, norm: 600_000, cost: 3.12 });
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

test('non-Codex tools derive norm and estimated cost from central pricing', () => {
  const claude = domain.normalizeToolTokens('claude', {
    total: 1_000_000,
    cache_read: 400_000,
    cache_write: 0,
  });

  assert.equal(claude.norm, 600_000);
  assert.equal(claude.cost, 3.12);
  assert.equal(claude.pricing_estimated, true);
  assert.equal(claude.model, 'claude-3-5-sonnet');
});

test('secondary leaderboard metric follows the product contract', () => {
  assert.equal(domain.secondaryRankMetric('total'), 'cost');
  assert.equal(domain.secondaryRankMetric('norm'), 'total');
  assert.equal(domain.secondaryRankMetric('cost'), 'total');
});

test('an empty event window reports no activity instead of fabricating a day', () => {
  assert.deepEqual(domain.summarizeRankWindow([], 'total'), {
    metrics: { total: 0, norm: 0, cost: 0 },
    selected: 0,
    cacheRead: 0,
    cacheRate: 0,
    hasEvents: false,
  });
});

test('personal page presentation never leaks lifetime tools or composition into an empty period', () => {
  const profileTokens = {
    total: 1_000,
    claude: { total: 1_000, in: 900, out: 100, cache_read: 400, cache_write: 0 },
  };

  assert.deepEqual(domain.personalRankPresentation('today', [], profileTokens), {
    toolsUsed: 0,
    inTokens: 0,
    outTokens: 0,
    cacheRead: 0,
    cacheWrite: 0,
  });
  assert.deepEqual(domain.personalRankPresentation('all', [], profileTokens), {
    toolsUsed: 1,
    inTokens: 900,
    outTokens: 100,
    cacheRead: 400,
    cacheWrite: 0,
  });
});
