import type { APIRoute } from 'astro';
import { kv } from '../../../lib/kv';

export const prerender = false;

export const GET: APIRoute = async () => {
  if (!kv) return new Response('No KV');

  const userIds = await kv.zrevrange('leaderboard:total', 0, 0);
  if (userIds.length === 0) return new Response('No users');
  const userId = userIds[0];

  let output = `User: ${userId}\n`;
  
  const dates = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  
  // 1. Delete all timeseries keys for this user
  for (const dateStr of dates) {
    await kv.del(`user:${userId}:timeseries:${dateStr}`);
    output += `Deleted timeseries for ${dateStr}\n`;
  }
  
  // 2. Clear out device data so the next upload is treated as a "first run"
  const deviceKeys = await kv.keys(`user:${userId}:device:*:data`);
  for (const key of deviceKeys) {
     await kv.del(key);
     output += `Deleted device data ${key}\n`;
  }
  
  // 3. Clear user main data
  await kv.del(`user:${userId}:data`);
  await kv.zrem('leaderboard:total', userId);
  
  return new Response(output + "\nSuccessfully reset user data for fresh ingestion!");
}
