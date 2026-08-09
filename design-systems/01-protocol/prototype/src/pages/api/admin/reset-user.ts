import type { APIRoute } from 'astro';
import { kv } from '../../../lib/kv';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!kv) return new Response('No KV', { status: 500 });
  const userId = '154967851';
  
  const tsKeys = await kv.keys(`user:${userId}:timeseries:*`);
  if (tsKeys.length > 0) await kv.del(...tsKeys);
  
  const deviceKeys = await kv.keys(`user:${userId}:device:*`);
  if (deviceKeys.length > 0) await kv.del(...deviceKeys);
  
  return new Response('User reset successfully');
};
