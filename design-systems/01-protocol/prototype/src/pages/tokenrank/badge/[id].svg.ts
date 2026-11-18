import type { APIRoute } from 'astro';
import { getUserRankData, getLeaderboard } from '../../../lib/kv';
import { rankMetricsFromTokens } from '../../../lib/tokenrank-domain.mjs';
import { renderTokenRankBadgeSvg } from '../../../lib/badge-svg.mjs';

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
  const id = String(params.id || '');
  const theme = url.searchParams.get('theme') === 'light' ? 'light' : 'dark';
  const rawStyle = url.searchParams.get('style') || 'card';
  const style = (['compact', 'card', 'receipt', 'terminal'].includes(rawStyle) ? rawStyle : 'card') as
    | 'compact'
    | 'card'
    | 'receipt'
    | 'terminal';

  if (id === 'demo') {
    const svg = renderTokenRankBadgeSvg({
      name: 'T Salon Demo',
      rank: 12,
      tokens: 48_500_000,
      estimatedUsd: 184.2,
      cacheHitRate: 85,
      topTool: 'Claude Code',
      theme,
      style,
    });
    return new Response(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400',
      },
    });
  }

  let name = `DEV #${id}`;
  let rank: number | null = null;
  let totalTokens = 0;
  let estimatedUsd = 0;
  let cacheRead = 0;
  let topTool = 'AI Coding';

  try {
    const userData = await getUserRankData(id);
    if (userData) {
      name = userData.name || name;
      const metrics = userData.metrics || rankMetricsFromTokens(userData.tokens);
      totalTokens = Number(metrics?.total) || 0;
      estimatedUsd = Number(metrics?.cost) || 0;

      let topToolVal = 0;
      for (const [tool, raw] of Object.entries(userData.tokens || {})) {
        if (tool === 'total' || tool === 'history') continue;
        const obj = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : null;
        cacheRead += Number(obj?.cache_read) || 0;
        const tot = obj ? Number(obj.total) || 0 : Number(raw) || 0;
        if (tot > topToolVal) {
          topToolVal = tot;
          topTool = tool;
        }
      }
    }

    const rows = await getLeaderboard(200, 'all', 'total');
    const idx = rows.findIndex((r: { userId?: string | number }) => String(r.userId) === id);
    if (idx >= 0) rank = idx + 1;
  } catch {
    // Serve a graceful fallback badge even if KV is temporarily unavailable.
  }

  const cacheHitRate = totalTokens > 0 ? Math.round((cacheRead / totalTokens) * 100) : 0;

  const svg = renderTokenRankBadgeSvg({
    name,
    rank,
    tokens: totalTokens,
    estimatedUsd,
    cacheHitRate,
    topTool,
    theme,
    style,
  });

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400',
    },
  });
};
