import type { APIRoute } from 'astro';
import { kv } from '../../lib/kv';

// Anomaly threshold for the NEW output-based metric: legit per-day events are
// well under 100M (heaviest observed ~24M). Anything above is legacy pollution
// from the old total_tokens metric (context-resend inflation => billions/day)
// or the old first-run 30-day backfill of a billion-scale total (~144M/day).
// 100M sits safely between legit data and that pollution.
const ANOMALY_THRESHOLD = 100_000_000;

export const GET: APIRoute = async ({ request }) => {
  if (!kv) return new Response('No KV', { status: 500 });

  // Safe by default: dry-run preview. Pass ?confirm=1 to actually delete.
  const url = new URL(request.url);
  const confirm = url.searchParams.get('confirm') === '1';

  const userIds = await kv.zrevrange('leaderboard:total', 0, 100);
  let removedCount = 0;
  let daysAffected = 0;
  const log: string[] = [];

  for (const uid of userIds) {
    const dates: string[] = [];
    for (let i = 0; i < 90; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    for (const d of dates) {
      const key = `user:${uid}:timeseries:${d}`;
      const events = await kv.lrange(key, 0, -1);
      let changed = false;
      const newEvents: any[] = [];

      for (const evStr of events) {
        try {
          const ev = typeof evStr === 'string' ? JSON.parse(evStr) : evStr;
          if (ev.tokens > ANOMALY_THRESHOLD) {
            changed = true;
            removedCount++;
            log.push(`Removed anomaly for ${uid} on ${d}: ${ev.tokens} tokens`);
          } else {
            newEvents.push(ev);
          }
        } catch (e) {}
      }

      if (changed) {
        if (confirm) {
          await kv.del(key);
          if (newEvents.length > 0) {
            const pipe = kv.pipeline();
            newEvents.forEach(e => pipe.rpush(key, JSON.stringify(e)));
            pipe.expire(key, 60 * 60 * 24 * 31);
            await pipe.exec();
          }
        }
        daysAffected++;
      }
    }
  }

  return new Response(JSON.stringify({
    success: true,
    mode: confirm ? 'CONFIRM (applied)' : 'DRY-RUN (preview — pass ?confirm=1 to apply)',
    anomaliesFound: removedCount,
    daysAffected,
    log
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
