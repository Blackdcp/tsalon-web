import type { APIRoute } from 'astro';
import { getLeaderboard, getGlobalStats } from '../../../lib/kv';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const leaderboard = await getLeaderboard(100);
    const stats = await getGlobalStats();

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
