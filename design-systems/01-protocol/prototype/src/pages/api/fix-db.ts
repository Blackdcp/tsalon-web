import type { APIRoute } from 'astro';
import { kv, scanKeys } from '../../lib/kv';

// CRITICAL: with `output: 'static'` (astro.config.mjs) every route is
// prerendered to a static file unless it opts out. Without this, the GET
// handler runs at BUILD time and ignores the ?merge/?confirm/?persist query
// string entirely (the frozen build output is always returned). This broke the
// merge/clean/persist jobs silently until they were called with the right flag.
export const prerender = false;

// Maintenance endpoint for the timeseries store.
//
// Three jobs, all safe-by-default (DRY-RUN unless ?confirm=1):
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
//
//  3. MERGE    — dedupe profiles that belong to the SAME GitHub person but were
//     created under different userIds (e.g. a stale orphan left by an old agent
//     build that used a UUID instead of the GitHub id). Only an orphan that is a
//     PROVABLE SUBSET of the canonical profile (every tool total and every
//     date×tool timeseries total is <= the canonical's) is deleted — if it holds
//     any data the canonical lacks, it is reported as a warning and left alone,
//     so no real usage is ever lost.

const ABSOLUTE_FLOOR = 1_000_000_000;   // 1B: only pollution historically exceeded this
const MULTIPLE_OF_MEDIAN = 10;          // a day >10x the user's own median is suspect

export const GET: APIRoute = async ({ request }) => {
  if (!kv) return new Response('No KV', { status: 500 });

  const url = new URL(request.url);
  const confirm = url.searchParams.get('confirm') === '1';
  const persistOnly = url.searchParams.get('persist') === '1';
  const mergeOnly = url.searchParams.get('merge') === '1';

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
    }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
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

  // 4. Merge: dedupe profiles of the same GitHub person (stale orphan builds).
  if (mergeOnly) {
    const profileKeys = await scanKeys('user:*:data');
    const profiles: any[] = [];
    if (profileKeys.length) {
      const raws = await kv.mget(profileKeys);
      raws.forEach((r, i) => {
        if (r) {
          try {
            const p = JSON.parse(r as string);
            p.__key = profileKeys[i];
            profiles.push(p);
          } catch {}
        }
      });
    }

    const ghOf = (img: string): string | null => {
      const m = /avatars\.githubusercontent\.com\/u\/(\d+)/.exec(img || '');
      return m ? m[1] : null;
    };

    // Group GitHub-sourced profiles by their numeric GitHub id (reliable key).
    const groups: Record<string, any[]> = {};
    for (const p of profiles) {
      const gh = ghOf(p.image);
      if (!gh) continue; // only dedupe profiles with a real GitHub avatar
      if (!groups[gh]) groups[gh] = [];
      groups[gh].push(p);
    }

    const merges: any[] = [];
    const warnings: string[] = [];

    for (const [gh, ps] of Object.entries(groups)) {
      if (ps.length < 2) continue;
      // Canonical = the profile whose userId equals the GitHub id, else the
      // highest-total one (the most complete / current upload).
      let canonical = ps.find(p => String(p.userId) === gh);
      if (!canonical) {
        canonical = ps.slice().sort((a, b) => (b.tokens?.total || 0) - (a.tokens?.total || 0))[0];
      }

      for (const orphan of ps) {
        if (orphan === canonical) continue;

        // (a) aggregated-token subset check
        const oTokens: Record<string, any> = (orphan.tokens || {}) as Record<string, any>;
        const cTokens: Record<string, any> = (canonical.tokens || {}) as Record<string, any>;
        let isSubset = true;
        for (const [tool, v] of Object.entries(oTokens)) {
          if (tool === 'total' || tool === 'history') continue;
          const oVal = typeof v === 'number' ? v : (v?.total || 0);
          const cVal = typeof cTokens[tool] === 'number' ? cTokens[tool] : (cTokens[tool]?.total || 0);
          if (oVal > cVal) { isSubset = false; break; }
        }

        // (b) timeseries subset check — every orphan date×tool must be present in
        // the canonical with a >= total.
        if (isSubset) {
          const canonTs: Record<string, number> = {};
          for (const [k, evs] of Object.entries(keyEvents)) {
            const parts = k.split(':');
            if (parts.slice(1, parts.length - 2).join(':') !== String(canonical.userId)) continue;
            const date = parts[parts.length - 1];
            for (const e of evs as any[]) {
              const kt = `${date}:${e.tool}`;
              canonTs[kt] = (canonTs[kt] || 0) + (Number(e.tokens) || 0);
            }
          }
          const orphanTs: Record<string, number> = {};
          for (const [k, evs] of Object.entries(keyEvents)) {
            const parts = k.split(':');
            if (parts.slice(1, parts.length - 2).join(':') !== String(orphan.userId)) continue;
            const date = parts[parts.length - 1];
            for (const e of evs as any[]) {
              const kt = `${date}:${e.tool}`;
              orphanTs[kt] = (orphanTs[kt] || 0) + (Number(e.tokens) || 0);
            }
          }
          for (const [kt, val] of Object.entries(orphanTs)) {
            if ((canonTs[kt] || 0) < val) { isSubset = false; break; }
          }
        }

        if (isSubset) {
          merges.push({
            githubId: gh,
            canonicalUserId: String(canonical.userId),
            orphanUserId: String(orphan.userId),
            orphanTotal: orphan.tokens?.total || 0
          });
          if (confirm) {
            const devKeys = await scanKeys(`user:${orphan.userId}:device:*`);
            const tsKeys = await scanKeys(`user:${orphan.userId}:timeseries:*`);
            const delKeys = [
              `user:${orphan.userId}:data`,
              `user:${orphan.userId}:token`,
              `user:${orphan.userId}:info`,
              ...devKeys,
              ...tsKeys
            ];
            if (delKeys.length) await kv.del(...delKeys);
            await kv.zrem('leaderboard:total', orphan.userId);
          }
        } else {
          warnings.push(
            `SKIP gh:${gh}: orphan ${orphan.userId} (total ${orphan.tokens?.total || 0}) is NOT a subset of canonical ${canonical.userId} (total ${canonical.tokens?.total || 0}) — manual review needed`
          );
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      mode: confirm ? 'CONFIRM (applied)' : 'DRY-RUN (preview — pass ?confirm=1 to apply)',
      job: 'merge',
      duplicatesFound: merges.length,
      merges,
      warnings
    }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }

  return new Response(JSON.stringify({
    success: true,
    mode: confirm ? 'CONFIRM (applied)' : 'DRY-RUN (preview — pass ?confirm=1 to apply)',
    job: 'clean',
    keysScanned: Object.keys(keyEvents).length,
    keysPersisted: persistedKeys,
    anomaliesFound: removedCount,
    log,
    _debug: {
      url: request.url,
      merge: url.searchParams.get('merge'),
      persist: url.searchParams.get('persist'),
      confirm: url.searchParams.get('confirm'),
      mergeOnly,
      persistOnly
    }
  }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
};
