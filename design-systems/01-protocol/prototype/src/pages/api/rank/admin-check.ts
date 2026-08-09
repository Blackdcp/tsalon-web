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
  
  const pipe = kv.pipeline();
  dates.forEach(dateStr => {
    pipe.lrange(`user:${userId}:timeseries:${dateStr}`, 0, -1);
  });
  
  const results = await pipe.exec();
  
  if (results) {
    results.forEach(([err, res], index) => {
      if (!err && Array.isArray(res) && res.length > 0) {
        let dailyTokens = 0;
        res.forEach(item => {
          try {
            const parsed = JSON.parse(item);
            dailyTokens += parsed.tokens;
          } catch(e) {}
        });
        output += `Date: ${dates[index]} - Events: ${res.length}, Total Tokens: ${dailyTokens}\n`;
      }
    });
  }
  
  return new Response(output);
}
