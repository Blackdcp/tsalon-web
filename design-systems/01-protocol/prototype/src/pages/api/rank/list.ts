import type { APIRoute } from 'astro';
import { getLeaderboard, getGlobalStats } from '../../../lib/kv';
import { PRICING_SNAPSHOT_DATE } from '../../../lib/token-pricing.mjs';
import { resolveRankQuery } from '../../../lib/tokenrank-domain.mjs';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const { time, metric } = resolveRankQuery(new URL(request.url).searchParams);
    const leaderboard = await getLeaderboard(100, time, metric);
    const stats = time === 'all'
      ? await getGlobalStats(null, metric)
      : await getGlobalStats(leaderboard, metric);

    return new Response(JSON.stringify({
      success: true,
      metric,
      pricing_snapshot_date: PRICING_SNAPSHOT_DATE,
      data: {
        leaderboard,
        stats
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=60'
      }
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ success: false, message: 'Server error' }), { status: 500 });
  }
};
