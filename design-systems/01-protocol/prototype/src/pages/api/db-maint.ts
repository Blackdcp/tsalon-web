import type { APIRoute } from 'astro';
import { kv, scanKeys } from '../../lib/kv';

// Temporary maintenance endpoint to dedupe profiles belonging to the same
// GitHub person (stale orphan builds left under a UUID instead of the GitHub
// id). Safe-by-default: DRY-RUN unless ?confirm=1. Only deletes an orphan that
// is a PROVABLE SUBSET of the canonical profile (every tool total and every
// date×tool timeseries total is <= the canonical's), so no real usage is lost.

export const GET: APIRoute = async ({ request }) => {
  if (!kv) return new Response('No KV', { status: 500 });

  const url = new URL(request.url);
  const confirm = url.searchParams.get('confirm') === '1';

  // Gather every timeseries key + its events.
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

  const merges: any[] = [];
  const warnings: string[] = [];

  for (const [gh, ps] of Object.entries(groups)) {
    if (ps.length < 2) continue;
    let canonical = ps.find(p => String(p.userId) === gh);
    if (!canonical) {
      canonical = ps.slice().sort((a, b) => (b.tokens?.total || 0) - (a.tokens?.total || 0))[0];
    }

    for (const orphan of ps) {
      if (orphan === canonical) continue;

      const oTokens = (orphan.tokens || {}) as Record<string, any>;
      const cTokens = (canonical.tokens || {}) as Record<string, any>;
      let isSubset = true;
      for (const [tool, v] of Object.entries(oTokens)) {
        if (tool === 'total' || tool === 'history') continue;
        const oVal = typeof v === 'number' ? v : (v?.total || 0);
        const cVal = typeof cTokens[tool] === 'number' ? cTokens[tool] : (cTokens[tool]?.total || 0);
        if (oVal > cVal) { isSubset = false; break; }
      }

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
    merges,
    warnings
  }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
};
