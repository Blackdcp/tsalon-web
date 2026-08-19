import type { APIRoute } from 'astro';
import { getLeaderboard, getGlobalStats } from '../../../lib/kv';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const requestedTime = new URL(request.url).searchParams.get('time') || 'all';
    const time = ['today', 'yesterday', '3d', '7d', '30d', '90d', 'all'].includes(requestedTime)
      ? requestedTime
      : 'all';
    const leaderboard = await getLeaderboard(100, time);
    const stats = time === 'all'
      ? await getGlobalStats()
      : await getGlobalStats(leaderboard);

    return new Response(JSON.stringify({
      success: true,
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
