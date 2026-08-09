import type { APIRoute } from 'astro';
import { kv } from '../../../lib/kv';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!kv) return new Response('No KV');

  const userIds = await kv.zrevrange('leaderboard:total', 0, -1);
  let output = 'Inspecting users:\n';
  let deleted = 0;
  
  for (const id of userIds) {
    const dataStr = await kv.get(`user:${id}:data`);
    if (dataStr) {
      const parsed = JSON.parse(dataStr);
      // Let's delete any ID that is NOT a clean GitHub ID.
      // GitHub IDs are usually purely numbers, e.g., '12345678'.
      // Auth.js generates uuids with hyphens, e.g. '86b07256-ddd0-454f-bb09-362f9caa8c64'.
      // If it contains a hyphen, it's an old UUID!
      
      output += `- ID: ${id} | Name: ${parsed.name} | Total: ${parsed.tokens?.total}\n`;
      
      if (id.includes('-')) {
        await kv.zrem('leaderboard:total', id);
        // Also clean up data
        await kv.del(`user:${id}:data`);
        output += `  -> DELETED duplicate (old UUID format)!\n`;
        deleted++;
      }
    }
  }
  
  return new Response(output + `\nTotal deleted: ${deleted}`);
}
