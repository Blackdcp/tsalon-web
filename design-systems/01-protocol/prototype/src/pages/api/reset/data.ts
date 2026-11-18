import type { APIRoute } from 'astro';
import { getResetRadarData } from '../../../lib/reset-radar';

export const prerender = false;

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { status: 204, headers: HEADERS });
};

export const GET: APIRoute = async () => {
  try {
    const data = await getResetRadarData();
    return new Response(
      JSON.stringify({
        ...data,
        source: 'https://www.tsalon.tech/whenreset/',
        mcpEndpoint: 'https://www.tsalon.tech/api/reset/mcp',
      }),
      {
        status: 200,
        headers: HEADERS,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve reset radar data', message: error?.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
};
