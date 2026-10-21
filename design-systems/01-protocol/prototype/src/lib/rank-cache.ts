import { beijingDateString } from './date.ts';
import { PRICING_SNAPSHOT_DATE } from './token-pricing.mjs';
import type { UserRankData } from './kv.ts';

export const RANK_DATA_REVISION_KEY = 'tokenrank:rank-revision:v1';
const CACHE_SECONDS = 300;
const pendingByRedis = new WeakMap<object, Map<string, Promise<string>>>();

function parseRows(raw: string | null): UserRankData[] | null {
  if (!raw) return null;
  try {
    const rows = JSON.parse(raw);
    return Array.isArray(rows) && rows.every(row => row && typeof row.userId === 'string'
      && row.tokens && typeof row.tokens === 'object'
      && ['total', 'norm', 'cost'].every(metric => Number.isFinite(row.metrics?.[metric]))) ? rows : null;
  } catch { return null; }
}

// Shared by HTML, stats.json and the public API. Cache all candidates and all
// metrics together; sorting/limiting happens afterwards, so a different metric
// cannot accidentally rank just another metric's Top-N. No session is cached.
export async function cachedRankRows(
  redis: any, time: string, date: Date, load: () => Promise<UserRankData[]>,
): Promise<UserRankData[]> {
  let revision: string;
  try { revision = await redis.get(RANK_DATA_REVISION_KEY) ?? 'initial'; }
  catch { return load(); }
  const key = `tokenrank:cache:v1:${PRICING_SNAPSHOT_DATE}:${beijingDateString(date)}:${time}:${revision}`;
  try {
    const cached = parseRows(await redis.get(key));
    if (cached) return cached;
  } catch { /* Caching is optional; authoritative reads still surface errors. */ }

  let pending = pendingByRedis.get(redis);
  if (!pending) { pending = new Map(); pendingByRedis.set(redis, pending); }
  let result = pending.get(key);
  if (!result) {
    result = (async () => {
      const raw = JSON.stringify(await load());
      try {
        // A concurrent upload changes the revision. Never install its mixed or
        // superseded read under the current cache version. Old keys expire.
        if ((await redis.get(RANK_DATA_REVISION_KEY) ?? 'initial') === revision) {
          await redis.set(key, raw, 'EX', CACHE_SECONDS);
        }
      } catch { /* A cache write must not fail an otherwise valid ranking. */ }
      return raw;
    })();
    pending.set(key, result);
  }
  try { return JSON.parse(await result); }
  finally { if (pending.get(key) === result) pending.delete(key); }
}
