import type { APIRoute } from 'astro';
import { getResetRadarData } from '../../../lib/reset-radar';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const data = await getResetRadarData();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve reset radar data', message: error?.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
