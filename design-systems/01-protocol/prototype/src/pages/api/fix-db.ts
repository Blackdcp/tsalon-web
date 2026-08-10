import type { APIRoute } from 'astro';
import { kv } from '../../lib/kv';

// Maintenance endpoint for the timeseries store.
//
// Two jobs, both safe-by-default (DRY-RUN unless ?confirm=1):
//
//  1. PERSIST  — remove the TTL on every timeseries key so historical daily
//     data survives past the previous 31-day cap (this is what made the 90d /
//     "all" views look empty). Run this once after deploying the TTL-cap fix.
//
//  2. CLEAN    — remove true anomalies. The old threshold was a hard 100M
//     absolute, which now false-positives on legit heavy users (real per-day
//     totals reach 100M–770M under the total_tokens metric). Instead we flag a
//     day only when it is BOTH wildly above that user's own median daily volume
//     AND above an absolute floor — i.e. genuine billion-scale pollution from
//     the old context-resend inflation, not a busy real user.

const ABSOLUTE_FLOOR = 1_000_000_000;   // 1B: only pollution historically exceeded this
const MULTIPLE_OF_MEDIAN = 10;          // a day >10x the user's own median is suspect

export const GET: APIRoute = async ({ request }) => {
  if (!kv) return new Response('No KV', { status: 500 });

  const url = new URL(request.url);
  const confirm = url.searchParams.get('confirm') === '1';
  const persistOnly = url.searchParams.get('persist') === '1';

  // 1. Collect every timeseries key + its events.
  const keyEvents: Record<string, any[]> = {};
  let cursor = '0';
  do {
    const [next, keys] = await kv.scan(cursor, 'MATCH', 'user:*:timeseries:*', 'COUNT', 500);
    cursor = next;
    if (keys.length) {
      const pipe = kv.pipeline();
      keys.forEach(k => pipe.lrange(k, 0, -1));
      const res = await pipe.exec();
      keys.forEach((k, i) => {
        const [, raw] = res![i] as [Error | null, string[]];
        keyEvents[k] = (raw || []).map(s => {
          try { return JSON.parse(s); } catch { return null; }
        }).filter(Boolean);
      });
    }
  } while (cursor !== '0');

  // 2. Persist: drop TTL on all timeseries keys so history is kept.
  let persistedKeys = 0;
  if (confirm) {
    for (const k of Object.keys(keyEvents)) {
      await kv.persist(k);
      persistedKeys++;
    }
  } else {
    persistedKeys = Object.keys(keyEvents).length;
  }

  if (persistOnly) {
    return new Response(JSON.stringify({
      success: true,
      mode: confirm ? 'CONFIRM (applied)' : 'DRY-RUN',
      job: 'persist',
      keysTouched: persistedKeys
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  // 3. Clean: compute per-user median daily total, flag anomalies.
  const userDailyTotals: Record<string, number[]> = {};
  for (const [key, events] of Object.entries(keyEvents)) {
    const parts = key.split(':');
    const userId = parts.slice(1, parts.length - 2).join(':');
    const dayTotal = events.reduce((s, e) => s + (Number(e.tokens) || 0), 0);
    if (dayTotal > 0) {
      if (!userDailyTotals[userId]) userDailyTotals[userId] = [];
      userDailyTotals[userId].push(dayTotal);
    }
  }

  const medianOf = (arr: number[]): number => {
    if (arr.length === 0) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  };

  const anomalies: { key: string; dayTotal: number; median: number }[] = [];
  for (const [userId, totals] of Object.entries(userDailyTotals)) {
    const median = medianOf(totals);
    for (const t of totals) {
      if (t > ABSOLUTE_FLOOR && t > MULTIPLE_OF_MEDIAN * (median || 1)) {
        anomalies.push({ key: userId, dayTotal: t, median });
      }
    }
  }

  // Map anomalies back to the actual events/keys to delete.
  let removedCount = 0;
  const log: string[] = [];
  for (const [key, events] of Object.entries(keyEvents)) {
    const parts = key.split(':');
    const userId = parts.slice(1, parts.length - 2).join(':');
    const date = parts[parts.length - 1];
    const dayTotal = events.reduce((s, e) => s + (Number(e.tokens) || 0), 0);
    const flagged = anomalies.some(a => a.key === userId && a.dayTotal === dayTotal);
    if (!flagged) continue;

    const newEvents = events.filter(e => {
      const t = Number(e.tokens) || 0;
      // drop only the specific offending event(s) on that day
      return !(t > ABSOLUTE_FLOOR && t > MULTIPLE_OF_MEDIAN * (medianOf(userDailyTotals[userId] || [1])));
    });
    const dropped = events.length - newEvents.length;
    if (dropped > 0) {
      removedCount += dropped;
      log.push(`Removed ${dropped} anomaly event(s) for ${userId} on ${date} (dayTotal ${dayTotal})`);
      if (confirm) {
        await kv.del(key);
        if (newEvents.length > 0) {
          const pipe = kv.pipeline();
          newEvents.forEach(e => pipe.rpush(key, JSON.stringify(e)));
          await pipe.exec();
        }
      }
    }
  }

  return new Response(JSON.stringify({
    success: true,
    mode: confirm ? 'CONFIRM (applied)' : 'DRY-RUN (preview — pass ?confirm=1 to apply)',
    job: 'clean',
    keysScanned: Object.keys(keyEvents).length,
    keysPersisted: persistedKeys,
    anomaliesFound: removedCount,
    log
  }), { headers: { 'Content-Type': 'application/json' } });
};
