import type { APIRoute } from 'astro';
import { kv } from '../../lib/kv';

export const GET: APIRoute = async () => {
  if (!kv) return new Response('No KV', { status: 500 });

  const userIds = await kv.zrevrange('leaderboard:total', 0, 100);
  let fixedCount = 0;
  let log = [];

  for (const uid of userIds) {
    const dates = [];
    for (let i = 0; i < 90; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    
    for (const d of dates) {
      const key = `user:${uid}:timeseries:${d}`;
      const events = await kv.lrange(key, 0, -1);
      let changed = false;
      const newEvents = [];
      
      for (const evStr of events) {
        try {
          const ev = typeof evStr === 'string' ? JSON.parse(evStr) : evStr;
          // 超过 2000 万的单条日志属于增量计算 Bug 导致的污染数据
          if (ev.tokens > 20_000_000) {
            changed = true;
            log.push(`Removed anomaly for ${uid} on ${d}: ${ev.tokens} tokens`);
          } else {
            newEvents.push(ev);
          }
        } catch(e) {}
      }
      
      if (changed) {
        await kv.del(key);
        if (newEvents.length > 0) {
          const pipe = kv.pipeline();
          newEvents.forEach(e => pipe.rpush(key, JSON.stringify(e)));
          pipe.expire(key, 60 * 60 * 24 * 31);
          await pipe.exec();
        }
        fixedCount++;
      }
    }
  }

  return new Response(JSON.stringify({ success: true, fixedCount, log }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
