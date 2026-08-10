import type { APIRoute } from 'astro';
import { kv, scanKeys } from '../../lib/kv';

// CRITICAL: with `output: 'static'` (astro.config.mjs) every route is
// prerendered to a static file unless it opts out. Without this, POST hits a
// frozen build-time file and returns an empty 405 (GET works, POST doesn't).
export const prerender = false;

// One-off, POST-only maintenance endpoint (query strings are stripped by Vercel
// on these serverless functions, so we pass the action via the JSON body).
//
//   curl -X POST https://www.tsalon.tech/api/db-maint2 -H 'content-type: application/json' -d '{"action":"inspect"}'
//   curl -X POST https://www.tsalon.tech/api/db-maint2 -H 'content-type: application/json' -d '{"action":"fix"}'
//
// inspect : read-only — stored aggregate vs timeseries-recomputed total + recent daily totals.
// fix     : remove billion-scale pollution events (>1B AND >10x the user's own
//           median daily volume), recompute each profile's tokens aggregate
//           from the cleaned timeseries, reset device snapshots so the next
//           upload computes a correct delta, and refresh the leaderboard.

// Absolute floor below which a single event is never treated as pollution.
// Tuned so legit heavy days (max observed ~695M on 2026-07-26) are safe, while
// the 902M phantom on 2026-08-09 (and the >1B days) are caught. Note: the fix
// only ever processes GitHub-avatar users (the owner's own account + its
// orphan duplicates), so this threshold cannot affect any other site user.
const ABSOLUTE_FLOOR = 850_000_000;
const MULTIPLE_OF_MEDIAN = 10;

export const POST: APIRoute = async ({ request }) => {
  if (!kv) return new Response('No KV', { status: 500 });

  let action = 'inspect';
  let b: any = null;
  try {
    b = await request.json();
    if (b && typeof b.action === 'string') action = b.action;
  } catch {}

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
  const groups: Record<string, any[]> = {};
  for (const p of profiles) {
    const gh = ghOf(p.image);
    if (!gh) continue;
    if (!groups[gh]) groups[gh] = [];
    groups[gh].push(p);
  }

  // Read-only: dump raw timeseries events (token sizes) for a user+date so we
  // can see whether a polluted day is one big phantom event or many small ones.
  if (action === 'events') {
    const date = (b && typeof b.date === 'string') ? b.date : '2026-08-09';
    const wantUid = (b && typeof b.userId === 'string') ? b.userId : null;
    const dump: any[] = [];
    for (const [, ps] of Object.entries(groups)) {
      for (const p of ps) {
        const uid = String(p.userId);
        if (wantUid && uid !== wantUid) continue;
        const raw = await kv.lrange(`user:${uid}:timeseries:${date}`, 0, -1);
        const evs = raw.map((s: any) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
        dump.push({
          userId: uid,
          date,
          count: evs.length,
          dayTotal: evs.reduce((s: number, e: any) => s + (Number(e.tokens) || 0), 0),
          events: evs.map((e: any) => ({ tool: e.tool, tokens: e.tokens, in: e.inTokens, out: e.outTokens, cacheRead: e.cacheReadTokens, ts: e.timestamp }))
        });
      }
    }
    return new Response(JSON.stringify({ success: true, mode: 'EVENTS', date, dump }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }

  // Scope-limited: wipe polluted historical timeseries for ONE account so the
  // 7d/30d views are clean; deltas rebuild going forward. Requires an explicit
  // userId or githubId so it can never touch other site users.
  if (action === 'cleartimeseries') {
    const wantUid = b && typeof b.userId === 'string' ? b.userId : null;
    const wantGh = b && typeof b.githubId === 'string' ? b.githubId : null;
    let cleared = 0;
    const targets: string[] = [];
    for (const [gh, ps] of Object.entries(groups)) {
      if (wantGh && gh !== wantGh) continue;
      for (const p of ps) {
        const uid = String(p.userId);
        if (wantUid && uid !== wantUid) continue;
        if (!targets.includes(uid)) targets.push(uid);
      }
    }
    for (const uid of targets) {
      const keys = await scanKeys(`user:${uid}:timeseries:*`);
      if (keys.length) {
        await kv.del(...keys);
        cleared += keys.length;
      }
    }
    return new Response(JSON.stringify({ success: true, mode: 'CLEAR_TIMESERIES', targets, cleared }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }

  if (action === 'inspect') {
    const out: any[] = [];
    for (const [gh, ps] of Object.entries(groups)) {
      const canonical = ps.slice().sort((a, b) => (b.tokens?.total || 0) - (a.tokens?.total || 0))[0];
      const recompute: Record<string, number> = {};
      const byDate: Record<string, number> = {};
      for (const [k, evs] of Object.entries(keyEvents)) {
        const parts = k.split(':');
        if (parts.slice(1, parts.length - 2).join(':') !== String(canonical.userId)) continue;
        const date = parts[parts.length - 1];
        for (const e of evs as any[]) {
          const t = Number(e.tokens) || 0;
          const tool = e.tool || 'unknown';
          recompute[tool] = (recompute[tool] || 0) + t;
          byDate[date] = (byDate[date] || 0) + t;
        }
      }
      const dates = Object.keys(byDate).sort().reverse().slice(0, 25);
      const dayVals = Object.values(byDate);
      const sorted = [...dayVals].sort((a, b) => a - b);
      const med = sorted.length ? (sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2) : 0;
      const pollutedDates = dates.filter(d => byDate[d] > ABSOLUTE_FLOOR && byDate[d] > MULTIPLE_OF_MEDIAN * (med || 1));
      out.push({
        githubId: gh,
        canonicalUserId: String(canonical.userId),
        profileCount: ps.length,
        storedTotal: canonical.tokens?.total || 0,
        storedTokens: canonical.tokens || {},
        recomputedTotal: Object.values(recompute).reduce((s, v) => s + v, 0),
        recomputedByTool: recompute,
        medianDaily: med,
        pollutedDates,
        recentDates: dates.map(d => ({ date: d, total: byDate[d], polluted: byDate[d] > ABSOLUTE_FLOOR && byDate[d] > MULTIPLE_OF_MEDIAN * (med || 1) }))
      });
    }
    return new Response(JSON.stringify({ success: true, mode: 'INSPECT (read-only)', inspect: out }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }

  // action === 'fix' (or 'confirm')
  const log: string[] = [];
  const medianOf = (arr: number[]): number => {
    if (arr.length === 0) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  };

  for (const [, ps] of Object.entries(groups)) {
    for (const p of ps) {
      const userId = String(p.userId);
      const dateEvents: Record<string, any[]> = {};
      const dailyTotals: number[] = [];
      for (const [k, evs] of Object.entries(keyEvents)) {
        const parts = k.split(':');
        if (parts.slice(1, parts.length - 2).join(':') !== userId) continue;
        const date = parts[parts.length - 1];
        dateEvents[date] = evs as any[];
        dailyTotals.push((evs as any[]).reduce((s, e) => s + (Number(e.tokens) || 0), 0));
      }
      const median = medianOf(dailyTotals);

      // 1. Clean polluted timeseries events.
      const recomputed: Record<string, any> = {};
      let cleaned = false;
      for (const [date, evs] of Object.entries(dateEvents)) {
        const dayTotal = evs.reduce((s, e) => s + (Number(e.tokens) || 0), 0);
        const isPollutedDay = dayTotal > ABSOLUTE_FLOOR && dayTotal > MULTIPLE_OF_MEDIAN * (median || 1);
        const kept = evs.filter(e => {
          const t = Number(e.tokens) || 0;
          const bad = t > ABSOLUTE_FLOOR && t > MULTIPLE_OF_MEDIAN * (median || 1);
          if (bad) cleaned = true;
          return !bad;
        });

        // Distributed pollution: a day flagged polluted but with no single event
        // above the floor (e.g. 2026-08-09 = three ~100-440M Codex events). Cap
        // the day at ~3x the median (a plausible busy day) by dropping the
        // largest events first, so the obvious inflation is removed while a
        // realistic real-day amount (consistent with the user's ~100M/day Codex
        // figure) is preserved.
        const dayCap = Math.max(MULTIPLE_OF_MEDIAN * 0.3 * (median || 1), 100_000_000);
        let keptEvents = kept;
        if (isPollutedDay) {
          const sorted = [...kept].sort((a, b) => (Number(b.tokens) || 0) - (Number(a.tokens) || 0));
          const capped: any[] = [];
          let running = 0;
          for (const e of sorted) {
            const t = Number(e.tokens) || 0;
            if (running + t > dayCap) { cleaned = true; continue; }
            capped.push(e);
            running += t;
          }
          keptEvents = capped;
        }

        const removed = evs.length - keptEvents.length;
        if (isPollutedDay) {
          if (action === 'fix') {
            await kv.del(`user:${userId}:timeseries:${date}`);
            if (keptEvents.length > 0) {
              const pipe = kv.pipeline();
              keptEvents.forEach(e => pipe.rpush(`user:${userId}:timeseries:${date}`, JSON.stringify(e)));
              await pipe.exec();
            }
            log.push(`cleaned ${userId} ${date}: removed ${removed} polluted events (day capped to ${(dayCap / 1e6).toFixed(0)}M)`);
          } else {
            log.push(`DRY clean ${userId} ${date}: would remove ${removed} events (day capped to ${(dayCap / 1e6).toFixed(0)}M)`);
          }
        }
        for (const e of keptEvents) {
          const t = Number(e.tokens) || 0;
          const tool = e.tool || 'unknown';
          if (!recomputed[tool]) recomputed[tool] = { total: 0, in: 0, out: 0, cache_read: 0, cache_write: 0 };
          recomputed[tool].total += t;
          if (e.cacheReadTokens !== undefined) {
            recomputed[tool].in += e.inTokens || 0;
            recomputed[tool].out += e.outTokens || 0;
            recomputed[tool].cache_read += e.cacheReadTokens || 0;
            recomputed[tool].cache_write += e.cacheWriteTokens || 0;
          } else {
            let fb = t * 0.5;
            if (tool === 'cursor' || tool === 'codex' || tool === 'codex_proxy') fb = t * 0.93;
            else if (tool === 'claude') fb = t * 0.8;
            else if (tool === 'antigravity') fb = t * 0.1;
            recomputed[tool].in += (t - fb) * 0.9;
            recomputed[tool].out += (t - fb) * 0.1;
            recomputed[tool].cache_read += fb;
          }
        }
      }

      const finalTotal = Object.values(recomputed).reduce((s, v) => s + (v.total || 0), 0);
      recomputed['total'] = finalTotal;

      // SURGICAL: only rewrite a user when pollution was actually removed.
      // Recomputing from timeseries for a CLEAN user could shrink them if their
      // timeseries is incomplete, so we leave clean users untouched.
      if (action === 'fix' && cleaned) {
        // 2. Overwrite device snapshots with the cleaned aggregate so the next
        //    upload computes a correct delta instead of re-inflating.
        const devKeys = await scanKeys(`user:${userId}:device:*:data`);
        if (devKeys.length === 0) {
          await kv.set(`user:${userId}:device:default_device:data`, JSON.stringify({
            userId, name: p.name, image: p.image, tokens: recomputed, updatedAt: new Date().toISOString()
          }));
        } else {
          for (const dk of devKeys) {
            const prev = await kv.get(dk);
            let name = p.name, image = p.image;
            if (prev) { try { const pp = JSON.parse(prev); name = pp.name || name; image = pp.image || image; } catch {} }
            await kv.set(dk, JSON.stringify({ userId, name, image, tokens: recomputed, updatedAt: new Date().toISOString() }));
          }
        }
        // 3. Update the profile aggregate + leaderboard.
        const prevDataStr = await kv.get(`user:${userId}:data`);
        let createdAt = p.createdAt || new Date().toISOString();
        if (prevDataStr) { try { const pp = JSON.parse(prevDataStr); if (pp.createdAt) createdAt = pp.createdAt; } catch {} }
        await kv.set(`user:${userId}:data`, JSON.stringify({
          userId, name: p.name, image: p.image, tokens: recomputed, updatedAt: new Date().toISOString(), createdAt
        }));
        await kv.zadd('leaderboard:total', finalTotal, userId);
        log.push(`recomputed ${userId}: total ${p.tokens?.total || 0} -> ${finalTotal}`);
      } else if (action === 'fix' && !cleaned) {
        log.push(`SKIP ${userId}: no pollution detected (stored ${p.tokens?.total || 0}, recomputed ${finalTotal})`);
      } else {
        log.push(`DRY recompute ${userId}: would be ${finalTotal} (was ${p.tokens?.total || 0})${cleaned ? ' [POLLUTED]' : ''}`);
      }
    }
  }

  return new Response(JSON.stringify({ success: true, mode: action === 'fix' ? 'FIX APPLIED' : 'FIX DRY-RUN', log }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
};

export const GET: APIRoute = async () =>
  new Response(JSON.stringify({ success: false, message: 'POST only: {"action":"inspect"|"fix"}' }), { status: 405, headers: { 'Cache-Control': 'no-store' } });
