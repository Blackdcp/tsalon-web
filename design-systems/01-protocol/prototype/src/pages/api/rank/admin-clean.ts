import type { APIRoute } from 'astro';
import { kv } from '../../../lib/kv';

export const prerender = false;

export const GET: APIRoute = async () => {
  if (!kv) return new Response('No KV');

  const userIds = await kv.zrevrange('leaderboard:total', 0, -1);
  let output = 'Inspecting users:\n';
  let deleted = 0;
  
  for (const id of userIds) {
    const dataStr = await kv.get(`user:${id}:data`);
    if (dataStr) {
      const parsed = JSON.parse(dataStr);
      
      output += `- ID: ${id} | Name: ${parsed.name} | Total: ${parsed.tokens?.total}\n`;
      
      if (id.includes('-')) {
        await kv.zrem('leaderboard:total', id);
        await kv.del(`user:${id}:data`);
        output += `  -> DELETED duplicate (old UUID format)!\n`;
        deleted++;
      }
    }
  }
  
  return new Response(output + `\nTotal deleted: ${deleted}`);
}
