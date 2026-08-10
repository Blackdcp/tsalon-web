import type { APIRoute } from 'astro';
import { kv, scanKeys } from '../../lib/kv';

// Temporary maintenance endpoint to dedupe profiles belonging to the same
// GitHub person (stale orphan builds left under a UUID instead of the GitHub
// id). Safe-by-default: action "dryrun" / "report" never delete; only
// action "confirm" deletes an orphan that is a PROVABLE SUBSET of the
// canonical profile (every tool total and every date×tool timeseries total is
// <= the canonical's), so no real usage is lost.
//
// Uses POST (not GET) on purpose: Vercel never caches POST responses, which
// sidesteps the sticky path-based CDN cache that was swallowing query-param
// modes on the GET variant.
//
//   curl -X POST https://www.tsalon.tech/api/db-maint -H 'content-type: application/json' -d '{"action":"report"}'

async function loadData() {
  const keyEvents: Record<string, any[]> = {};
  const profiles: any[] = [];
  if (!kv) return { keyEvents, profiles };
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
  return { keyEvents, profiles };
}

function groupByGithub(profiles: any[]) {
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
  return groups;
}

export const POST: APIRoute = async ({ request }) => {
  if (!kv) return new Response('No KV', { status: 500 });

  let action = 'dryrun';
  let body: any = {};
  try {
    body = await request.json();
    if (body && typeof body.action === 'string') action = body.action;
  } catch {}
  const targetGh = body && typeof body.gh === 'string' ? body.gh : null;

  const { keyEvents, profiles } = await loadData();
  const groups = groupByGithub(profiles);

  if (action === 'inspect') {
    const inspectOut: any[] = [];
    for (const [gh, ps] of Object.entries(groups)) {
      if (targetGh && gh !== targetGh) continue;
      if (ps.length === 0) continue;
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
      const recomputedTotal = Object.values(recompute).reduce((s, v) => s + v, 0);
      const dates = Object.keys(byDate).sort().reverse().slice(0, 25);
      inspectOut.push({
        githubId: gh,
        canonicalUserId: String(canonical.userId),
        profileCount: ps.length,
        storedTotal: canonical.tokens?.total || 0,
        storedTokens: canonical.tokens || {},
        recomputedTotal,
        recomputedByTool: recompute,
        recentDates: dates.map(d => ({ date: d, total: byDate[d] }))
      });
    }
    return new Response(JSON.stringify({ success: true, mode: 'INSPECT (read-only)', inspect: inspectOut }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }

  const merges: any[] = [];
  const warnings: string[] = [];
  const reports: any[] = [];

  for (const [gh, ps] of Object.entries(groups)) {
    if (ps.length < 2) continue;

    // Canonical = the most complete (highest-total) profile for this GitHub id.
    const canonical = ps.slice().sort((a, b) => (b.tokens?.total || 0) - (a.tokens?.total || 0))[0];

    for (const orphan of ps) {
      if (orphan === canonical) continue;

      const oTokens = (orphan.tokens || {}) as Record<string, any>;
      const cTokens = (canonical.tokens || {}) as Record<string, any>;
      let isSubset = true;
      const tokenDiff: any[] = [];
      for (const [tool, v] of Object.entries(oTokens)) {
        if (tool === 'total' || tool === 'history') continue;
        const oVal = typeof v === 'number' ? v : (v?.total || 0);
        const cVal = typeof cTokens[tool] === 'number' ? cTokens[tool] : (cTokens[tool]?.total || 0);
        if (oVal > cVal) {
          isSubset = false;
          tokenDiff.push({ tool, orphan: oVal, canonical: cVal });
        }
      }

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
      const tsDiff: any[] = [];
      for (const [kt, val] of Object.entries(orphanTs)) {
        if ((canonTs[kt] || 0) < val) {
          isSubset = false;
          tsDiff.push({ key: kt, orphan: val, canonical: canonTs[kt] || 0 });
        }
      }

      if (action === 'report') {
        reports.push({
          githubId: gh,
          canonicalUserId: String(canonical.userId),
          canonicalTotal: canonical.tokens?.total || 0,
          orphanUserId: String(orphan.userId),
          orphanTotal: orphan.tokens?.total || 0,
          isSubset,
          tokenDiff,
          tsDiff
        });
        continue;
      }

      if (isSubset) {
        merges.push({
          githubId: gh,
          canonicalUserId: String(canonical.userId),
          orphanUserId: String(orphan.userId),
          orphanTotal: orphan.tokens?.total || 0
        });
        if (action === 'confirm') {
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
          `SKIP gh:${gh}: orphan ${orphan.userId} (total ${orphan.tokens?.total || 0}) is NOT a subset of canonical ${canonical.userId} (total ${canonical.tokens?.total || 0})`
        );
      }
    }
  }

  if (action === 'report') {
    return new Response(JSON.stringify({ success: true, mode: 'REPORT (read-only)', groups: Object.keys(groups).length, reports }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }

  return new Response(JSON.stringify({ success: true, mode: action === 'confirm' ? 'CONFIRM (applied)' : 'DRY-RUN', merges, warnings }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
};

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({ success: false, message: 'Use POST with {"action":"report"|"dryrun"|"confirm"}' }),
    { status: 405, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
  );
};
