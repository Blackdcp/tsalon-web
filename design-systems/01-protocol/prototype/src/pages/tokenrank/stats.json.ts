import type { APIRoute } from 'astro';
import { getLeaderboard } from '../../lib/kv';
import { resolveRankQuery } from '../../lib/tokenrank-domain.mjs';
import { PRICING_SNAPSHOT_DATE } from '../../lib/token-pricing.mjs';

export const prerender = false;

const beijingNow = () => {
  const shifted = new Date(Date.now() + 8 * 60 * 60 * 1000);
  return shifted.toISOString().replace('Z', '+08:00');
};

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.origin ?? 'https://www.tsalon.tech';
  const { time: timeFilter, metric: metricFilter } = resolveRankQuery(new URLSearchParams());

  let leaderboard: any[] = [];
  try {
    leaderboard = await getLeaderboard(100, timeFilter, metricFilter);
  } catch {
    return new Response(
      JSON.stringify({ name: 'T Salon TokenRank', error: 'Rank data is temporarily unavailable' }, null, 2),
      { status: 503, headers: { 'Content-Type': 'application/json; charset=utf-8' } },
    );
  }

  let tokensTotal = 0;
  let tokensNormalized = 0;
  let estimatedCostUsd = 0;
  let rawTokens = 0;
  let cacheReadTokens = 0;
  const toolCounts: Record<string, number> = {};
  const toolTokens: Record<string, number> = {};

  for (const user of leaderboard) {
    for (const [tool, amount] of Object.entries(user.tokens ?? {}) as [string, any][]) {
      if (tool === 'total') continue;
      toolCounts[tool] = (toolCounts[tool] || 0) + 1;
      const value = typeof amount === 'number' ? amount : Number(amount?.raw_total ?? amount?.total) || 0;
      const norm = typeof amount === 'number' ? amount : Number(amount?.norm ?? amount?.total) || 0;
      const cacheRead = typeof amount === 'number' ? 0 : Number(amount?.cache_read) || 0;
      rawTokens += value;
      cacheReadTokens += cacheRead;
      tokensNormalized += norm;
      toolTokens[tool] = (toolTokens[tool] || 0) + norm;
    }
    tokensTotal += Number(user.metrics?.total) || 0;
    estimatedCostUsd += Number(user.metrics?.cost) || 0;
  }

  const body = {
    name: 'T Salon TokenRank',
    description:
      'First-party dataset of real AI coding token consumption, collected by T Salon from developers who voluntarily run the reporting agent.',
    source: `${origin}/tokenrank/`,
    methodology: `${origin}/tokenrank/methodology/`,
    timezone: 'Asia/Shanghai (UTC+8)',
    pricingSnapshotDate: PRICING_SNAPSHOT_DATE,
    updatedAtBeijing: beijingNow(),
    scope: { timeWindow: timeFilter, rankingMetric: metricFilter, sampleLimit: 100 },
    countingBases: {
      total: 'All token consumption including cache hits.',
      normalized: 'Net token consumption after removing cache reads.',
      estimatedCostUsd: 'Derived from the model pricing snapshot; an estimate, not a billed amount.',
    },
    totals: {
      developers: leaderboard.length,
      tokensTotal,
      tokensNormalized,
      estimatedCostUsd: Number(estimatedCostUsd.toFixed(2)),
      cacheHitRate: rawTokens > 0 ? Number(((cacheReadTokens / rawTokens) * 100).toFixed(1)) : 0,
    },
    tools: Object.entries(toolCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tool, developers]) => ({
        tool,
        developers,
        tokensNormalized: Number(toolTokens[tool] || 0),
      })),
    topDevelopers: leaderboard.slice(0, 10).map((user, index) => ({
      rank: index + 1,
      name: user.name,
      tokensTotal: Number(user.metrics?.total) || 0,
      tokensNormalized: Number(user.metrics?.norm) || 0,
      estimatedCostUsd: Number(Number(user.metrics?.cost) || 0).toFixed(2),
      profileUrl: `${origin}/tokenrank/user/${user.userId}/`,
    })),
    license: 'Free to quote with attribution to T Salon (https://www.tsalon.tech).',
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
