import type { APIRoute } from 'astro';
import { getUserRankData, getLeaderboard } from '../../../lib/kv';
import { rankMetricsFromTokens } from '../../../lib/tokenrank-domain.mjs';
import { renderTokenRankOgPng } from '../../../lib/og-png';

export const prerender = false;

const formatShortUnits = (num: number): string => {
  if (!num || num <= 0) return '0';
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(Math.round(num));
};

export const GET: APIRoute = async ({ params }) => {
  const id = String(params.id || '');
  let name = `DEV #${id}`;
  let rank: number | null = null;
  let totalTokens = 0;
  let normTokens = 0;
  let cost = 0;
  let cacheRead = 0;
  let topTool = 'AI CODING';

  try {
    const userData = await getUserRankData(id);
    if (userData) {
      name = userData.name || name;
      const metrics = userData.metrics || rankMetricsFromTokens(userData.tokens);
      totalTokens = Number(metrics?.total) || 0;
      normTokens = Number(metrics?.norm) || 0;
      cost = Number(metrics?.cost) || 0;

      let topToolVal = 0;
      for (const [tool, raw] of Object.entries(userData.tokens || {})) {
        if (tool === 'total' || tool === 'history') continue;
        const o = typeof raw === 'object' && raw !== null ? (raw as any) : null;
        cacheRead += Number(o?.cache_read) || 0;
        const tot = o ? Number(o.total) || 0 : Number(raw) || 0;
        if (tot > topToolVal) {
          topToolVal = tot;
          topTool = tool.toUpperCase();
        }
      }
    }
    const rows = await getLeaderboard(200, 'all', 'total');
    const idx = rows.findIndex((r: any) => String(r.userId) === id);
    if (idx >= 0) rank = idx + 1;
  } catch {}

  const cacheHitRate = totalTokens > 0 ? ((cacheRead / totalTokens) * 100).toFixed(1) : '0.0';
  const pngBuffer = renderTokenRankOgPng({
    userId: id,
    name,
    rank,
    totalTokensText: formatShortUnits(totalTokens),
    normTokensText: formatShortUnits(normTokens),
    costText: `$${Math.round(cost).toLocaleString('en-US')}`,
    cacheHitRate,
    topTool,
  });

  return new Response(new Uint8Array(pngBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400',
    },
  });
};
