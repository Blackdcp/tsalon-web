import Redis from 'ioredis';
import {
  replaceRedisList,
  syncCodexLedger,
  type CodexLedgerPayload,
  type RedisCommitOperations,
} from './codex-ledger.ts';
import { beijingDateString, beijingDateNDaysAgo } from './date.ts';
import { PRICING_SNAPSHOT_DATE } from './token-pricing.mjs';
import {
  aggregateRankEvents,
  normalizeDeviceUpload,
  normalizeToolTokens,
  rankMetricsFromTokens,
  sortRankRows,
} from './tokenrank-domain.mjs';

// Fallback for development if no REDIS_URL is provided, or throw
const redisUrl = process.env.REDIS_URL || '';
export const kv = redisUrl ? new Redis(redisUrl) : null;

export interface UserRankData {
  userId: string;
  name: string;
  image: string;
  tokens: Record<string, any>;
  metrics: Record<RankMetric, number>;
  updatedAt: string;
  createdAt?: string;
}

export type RankMetric = 'total' | 'norm' | 'cost';

export interface TimeseriesEvent {
  timestamp: number;
  tool: string;
  model: string;
  tokens: number;
  rawTokens?: number;
  inTokens?: number;
  outTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  cacheHit: boolean;
  deviceId?: string;
  source?: string;
  normTokens?: number;
  costUsd?: number;
  pricingEstimated?: boolean;
  pricingSnapshotDate?: string;
}

export type CodexAccountAudit = Record<string, unknown>;

export interface TokenUpdateOptions {
  historyData?: Record<string, Record<string, any>> | null;
  historyCompleteTools?: string[];
  codexLedger?: CodexLedgerPayload | null;
  accountAudit?: CodexAccountAudit | null;
}

export interface TokenUpdateResult {
  codex: { total: number; norm: number; cost: number; turns: number } | null;
  pricing_snapshot_date: string;
}


export async function getOrCreateUploadToken(userId: string): Promise<string> {
  if (!kv) return 'mock-token-' + crypto.randomUUID();
  const existingToken = await kv.get(`user:${userId}:token`);
  if (existingToken) {
    return existingToken;
  }
  const newToken = crypto.randomUUID();
  await kv.set(`user:${userId}:token`, newToken);
  await kv.set(`token:${newToken}:userId`, userId);
  return newToken;
}

export async function getUserIdByToken(token: string): Promise<string | null> {
  if (!kv) return 'mock-user-123';
  return kv.get(`token:${token}:userId`);
}

// Non-blocking key discovery (replaces kv.keys, which is O(N) and blocks Redis
// on large datasets). Iterates with SCAN and collects every matching key.
export async function scanKeys(pattern: string): Promise<string[]> {
  if (!kv) return [];
  return scanRedisKeys(kv, pattern);
}

async function scanRedisKeys(redis: any, pattern: string): Promise<string[]> {
  const found: string[] = [];
  let cursor = '0';
  do {
    const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 500);
    cursor = next;
    found.push(...keys);
  } while (cursor !== '0');
  return found;
}

const RENEW_UPDATE_LOCK_SCRIPT = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('pexpire', KEYS[1], ARGV[2]) else return 0 end";
const RELEASE_UPDATE_LOCK_SCRIPT = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
const COMMIT_UPDATE_SCRIPT = `
if redis.call('get', KEYS[1]) ~= ARGV[1] then return 0 end
local operations = cjson.decode(ARGV[2])
for _, pair in ipairs(operations.renames or {}) do redis.call('rename', pair[1], pair[2]) end
for _, key in ipairs(operations.deletes or {}) do redis.call('del', key) end
for _, pair in ipairs(operations.sets or {}) do redis.call('set', pair[1], pair[2]) end
for _, item in ipairs(operations.zadds or {}) do redis.call('zadd', item[1], item[2], item[3]) end
for _, item in ipairs(operations.rpushes or {}) do
  for _, value in ipairs(item[2]) do redis.call('rpush', item[1], value) end
end
return 1
`;

export interface UserUpdateLeaseOptions {
  leaseMs?: number;
  attempts?: number;
  retryMs?: number;
}

export async function acquireUserUpdateLease(
  redis: any,
  userId: string,
  { leaseMs = 30_000, attempts = 40, retryMs = 100 }: UserUpdateLeaseOptions = {},
) {
  if (!Number.isSafeInteger(leaseMs) || leaseMs < 15
    || !Number.isSafeInteger(attempts) || attempts < 1
    || !Number.isSafeInteger(retryMs) || retryMs < 0) {
    throw new Error('Invalid token update lease options');
  }
  const lockKey = `user:${userId}:update-lock`;
  const ownerId = crypto.randomUUID();
  let locked = false;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const ok = await redis.set(lockKey, ownerId, 'PX', leaseMs, 'NX');
    if (ok === 'OK') { locked = true; break; }
    if (attempt + 1 < attempts && retryMs > 0) {
      await new Promise(resolve => setTimeout(resolve, retryMs));
    }
  }
  if (!locked) throw new Error('Token update is busy; retry on the next agent run');

  let stopped = false;
  let lost = false;
  let released = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let inFlight: Promise<any> = Promise.resolve();
  const intervalMs = Math.max(5, Math.floor(leaseMs / 3));
  const schedule = () => {
    if (stopped) return;
    timer = setTimeout(() => {
      if (stopped) return;
      inFlight = Promise.resolve(redis.eval(RENEW_UPDATE_LOCK_SCRIPT, 1, lockKey, ownerId, leaseMs));
      void inFlight.then((renewed) => {
        if (renewed !== 1) { lost = true; stopped = true; }
      }).catch(() => {
        lost = true;
        stopped = true;
      }).finally(schedule);
    }, intervalMs);
  };
  schedule();

  return {
    lockKey,
    ownerId,
    async commit(operations: RedisCommitOperations) {
      if (lost) throw new Error('Token update lease lost');
      const committed = await redis.eval(
        COMMIT_UPDATE_SCRIPT,
        1,
        lockKey,
        ownerId,
        JSON.stringify(operations),
      );
      if (committed !== 1) {
        lost = true;
        stopped = true;
        if (timer) clearTimeout(timer);
        throw new Error('Token update lease lost');
      }
    },
    async release() {
      if (released) return;
      released = true;
      stopped = true;
      if (timer) clearTimeout(timer);
      try { await inFlight; } catch { /* release still checks the owner */ }
      await redis.eval(RELEASE_UPDATE_LOCK_SCRIPT, 1, lockKey, ownerId);
    },
  };
}

export async function updateTokenUsage(
  userId: string,
  name: string,
  image: string,
  tokens: Record<string, any>,
  deviceId: string = 'default_device',
  optionsOrHistory: TokenUpdateOptions | Record<string, Record<string, any>> | null = {},
  legacyHistoryCompleteTools: string[] = [],
) {
  return updateTokenUsageWithRedis(
    kv, userId, name, image, tokens, deviceId, optionsOrHistory, legacyHistoryCompleteTools,
  );
}

export async function updateTokenUsageWithRedis(
  redis: any,
  userId: string,
  name: string,
  image: string,
  tokens: Record<string, any>,
  deviceId: string = 'default_device',
  optionsOrHistory: TokenUpdateOptions | Record<string, Record<string, any>> | null = {},
  legacyHistoryCompleteTools: string[] = [],
) {
  const kv = redis;
  if (!kv) return;

  const isOptions = optionsOrHistory !== null && typeof optionsOrHistory === 'object'
    && ['historyData', 'historyCompleteTools', 'codexLedger', 'accountAudit']
      .some((key) => Object.prototype.hasOwnProperty.call(optionsOrHistory, key));
  const options: TokenUpdateOptions = isOptions
    ? optionsOrHistory as TokenUpdateOptions
    : { historyData: optionsOrHistory as Record<string, Record<string, any>> | null, historyCompleteTools: legacyHistoryCompleteTools };
  const historyData = options.historyData ?? null;
  const historyCompleteTools = options.historyCompleteTools ?? [];
  const isLegacyCodexTool = (tool: string) => tool === 'codex' || tool === 'codex_proxy';
  const scanKeys = (pattern: string) => scanRedisKeys(kv, pattern);

  // Mac and Windows commonly upload on the same half-hour boundary. Serialize
  // per-user rebuilds so one device cannot overwrite the other device's list
  // rewrite. A crashed invocation self-recovers when the short TTL expires.
  const updateLease = await acquireUserUpdateLease(kv, userId);

  try {
    let codexSummary: Record<string, any> | null = null;
    if (options.codexLedger) {
      codexSummary = await syncCodexLedger(kv, userId, deviceId, options.codexLedger, {
        commit: updateLease.commit,
      });
    } else {
      const storedSummary = await kv.get(`user:${userId}:codex:summary`);
      if (storedSummary) {
        try { codexSummary = JSON.parse(storedSummary); } catch { /* rebuild on a later v5 upload */ }
      }
    }
    const excludesLegacyCodex = Boolean(options.codexLedger)
      || await kv.get(`user:${userId}:device:${deviceId}:codex-ledger-version`) === '5';
    const canonicalTurnCount = codexSummary
      ? Object.keys(await kv.hgetall(`user:${userId}:codex:turns`)).length
      : 0;

  const completeHistoryTools = new Set(
    historyCompleteTools.filter(t => /^[a-z0-9_+-]+$/i.test(t)
      && !(excludesLegacyCodex && isLegacyCodexTool(t))),
  );
  
  // Normalize incoming tokens to always be {total, in, out, cache_read, cache_write}
  const normalizedTokens: Record<string, any> = normalizeDeviceUpload(tokens, {
    hasCodexLedger: excludesLegacyCodex,
  });

  // 0. Fetch previous device data to calculate deltas
  const oldDeviceDataStr = await kv.get(`user:${userId}:device:${deviceId}:data`);
  const oldDeviceTokens: Record<string, any> = {};
  if (oldDeviceDataStr) {
    try {
      const parsed = JSON.parse(oldDeviceDataStr);
      if (parsed.tokens) {
        Object.assign(oldDeviceTokens, normalizeDeviceUpload(parsed.tokens));
      }
    } catch(e) {}
  }
  
  // 1. Save data for THIS device
  const deviceTotal = Object.values(normalizedTokens)
    .reduce((acc, val) => acc + (Number((val as any).total) || 0), 0);
  normalizedTokens['total'] = deviceTotal;
  
  const deviceData = {
    userId,
    name,
    image,
    tokens: normalizedTokens,
    updatedAt: new Date().toISOString()
  };
  
  await updateLease.commit({
    sets: [[`user:${userId}:device:${deviceId}:data`, JSON.stringify(deviceData)]],
  });

  const todayStr = beijingDateString();

  // A v2 agent declares which per-day histories are complete. Remove every old
  // event for those tool/device pairs before writing the current source of truth.
  // This repairs stale, session-start-bucketed, capped, and duplicated history
  // automatically on the next upload without touching another device.
  if (completeHistoryTools.size > 0 || excludesLegacyCodex) {
    const tsKeys = await scanKeys(`user:${userId}:timeseries:*`);
    for (const key of tsKeys) {
      const raw = await kv.lrange(key, 0, -1);
      const events = raw
        .map((s: any) => { try { return JSON.parse(s); } catch { return null; } })
        .filter(Boolean);
      const kept = events.filter((e: any) => {
        const tool = String(e.tool || '');
        return !(e.deviceId === deviceId && (
          completeHistoryTools.has(tool) || (excludesLegacyCodex && isLegacyCodexTool(tool))
        ));
      });
      if (kept.length === events.length) continue;
      await replaceRedisList(kv, key, kept.map((event: any) => JSON.stringify(event)), updateLease.commit);
    }
  }

  // 1.4 Keep a daily cumulative snapshot for diagnostics and as a compatibility
  // fallback for pre-v2 agents. V2 daily history comes from timestamped events.
  if (!excludesLegacyCodex) {
    const snapKey = `user:${userId}:device:${deviceId}:snap:${todayStr}`;
    await updateLease.commit({
      sets: [[snapKey, JSON.stringify({ date: todayStr, total: deviceTotal, updatedAt: new Date().toISOString() })]],
    });
  }

  // A snapshot belongs to its source device, so migration filtering must also
  // be per-device. Resolve all source markers in one batch, permanently remove
  // marked-device compatibility snapshots, and clean only the snapshot-derived
  // Codex events that those snapshots could have reintroduced.
  const snapshotPrefix = `user:${userId}:device:`;
  const snapshotKeyParts = (key: string): { deviceId: string; date: string } | null => {
    if (!key.startsWith(snapshotPrefix)) return null;
    const remainder = key.slice(snapshotPrefix.length);
    const separator = remainder.lastIndexOf(':snap:');
    if (separator <= 0) return null;
    const date = remainder.slice(separator + ':snap:'.length);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    return { deviceId: remainder.slice(0, separator), date };
  };
  const snapKeysAll = (await scanKeys(`user:${userId}:device:*:snap:????-??-??`))
    .filter((key) => snapshotKeyParts(key) !== null);
  const snapshotDeviceId = (key: string) => snapshotKeyParts(key)?.deviceId || '';

  if (!excludesLegacyCodex) {
    const currentDeviceSnaps = snapKeysAll
      .filter((key) => snapshotDeviceId(key) === deviceId)
      .sort();
    const toDel = currentDeviceSnaps.slice(0, Math.max(0, currentDeviceSnaps.length - 120));
    if (toDel.length) {
      await updateLease.commit({ deletes: toDel });
    }
  }

  const snapshotDeviceIds = [...new Set(snapKeysAll.map(snapshotDeviceId).filter(Boolean))];
  const snapshotLedgerVersions = snapshotDeviceIds.length
    ? await kv.mget(snapshotDeviceIds.map((id) => `user:${userId}:device:${id}:codex-ledger-version`))
    : [];
  const migratedSnapshotDevices = new Set(snapshotDeviceIds.filter((_, index) => snapshotLedgerVersions[index] === '5'));
  const migratedSnapshotKeys = snapKeysAll.filter((key) => migratedSnapshotDevices.has(snapshotDeviceId(key)));

  if (migratedSnapshotDevices.size) {
    const tsKeys = await scanKeys(`user:${userId}:timeseries:*`);
    for (const key of tsKeys) {
      const raw = await kv.lrange(key, 0, -1);
      const events = raw
        .map((value: any) => { try { return JSON.parse(value); } catch { return null; } })
        .filter(Boolean);
      const kept = events.filter((event: any) => !(
        migratedSnapshotDevices.has(String(event.deviceId || ''))
        && isLegacyCodexTool(String(event.tool || ''))
        && event.source === 'snapshot-delta'
      ));
      if (kept.length === events.length) continue;
      await replaceRedisList(kv, key, kept.map((event: any) => JSON.stringify(event)), updateLease.commit);
    }
  }
  // Delete snapshots only after event cleanup succeeds. If either operation
  // fails, remaining snapshots retain the device IDs needed for a safe retry.
  if (migratedSnapshotKeys.length) {
    await updateLease.commit({ deletes: migratedSnapshotKeys });
  }
  const legacySnapshotKeys = snapKeysAll.filter((key) => !migratedSnapshotDevices.has(snapshotDeviceId(key)));

  // 1.5 Generate Timeseries Deltas
  const now = Date.now();

  const pendingRpushes: Array<[string, string[]]> = [];
  
  // ---------------------------------------------------------------------------
  // Daily timeseries strategy:
  //
  //  • V2 complete tools -> replace their entire device history with exact
  //    timestamp-derived daily values, including today. No statistical cap.
  //  • Legacy/history-less tools -> retain the cumulative-delta fallback so old
  //    clients keep working while they migrate.
  // ---------------------------------------------------------------------------
  const DAY_FLOOR = 850_000_000;

  const modelFor = (tool: string): string => {
    if (tool === 'cursor' || tool === 'codex' || tool === 'codex_proxy') return 'gpt-5.6-sol';
    if (tool === 'antigravity') return 'gemini-2.5-pro';
    if (tool === 'claude') return 'claude-3-5-sonnet';
    return 'unknown';
  };

  // median daily total across history (for the per-day cap); excludes today.
  const histDayTotals: number[] = [];
  if (historyData) {
    for (const toolsObj of Object.values(historyData)) {
      let day = 0;
      for (const [tool, v] of Object.entries(toolsObj as Record<string, any>)) {
        if (excludesLegacyCodex && isLegacyCodexTool(tool)) continue;
        const hv = typeof v === 'object' && v !== null ? (Number((v as any).total) || 0) : (Number(v) || 0);
        day += hv;
      }
      if (day > 0) histDayTotals.push(day);
    }
  }
  histDayTotals.sort((a, b) => a - b);
  const histMedian = histDayTotals.length ? histDayTotals[Math.floor(histDayTotals.length / 2)] : 0;
  // Complete v2 histories are authoritative raw-token readings. Statistical
  // caps silently discarded real cached-context usage, so caps remain only for
  // legacy agents that cannot rebuild their own history.
  const DAY_CAP = completeHistoryTools.size > 0
    ? Number.POSITIVE_INFINITY
    : (histMedian > 0 ? Math.max(3 * histMedian, DAY_FLOOR) : DAY_FLOOR);

  // --- Exact history (v2) or write-once past history (legacy) ---
  if (historyData) {
    for (const [dateStr, toolsObj] of Object.entries(historyData)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;
      if (completeHistoryTools.size === 0 && dateStr >= todayStr) continue;
      const rawKey = `user:${userId}:timeseries:${dateStr}`;
      const existing = await kv.lrange(rawKey, 0, -1);
      const existingEvents = existing
        .map((s: any) => { try { return JSON.parse(s); } catch { return null; } })
        .filter(Boolean);
      if (completeHistoryTools.size === 0 && existingEvents.some((e: any) => e.deviceId === deviceId)) continue;

      const incomingTools = new Set(Object.keys(toolsObj)
        .filter((tool) => !(excludesLegacyCodex && isLegacyCodexTool(tool))));
      // Replace only the incoming tools for this device; preserve other devices
      // and unrelated tools on the same date.
      const kept = existingEvents.filter((e: any) => !(
        e.deviceId === deviceId && incomingTools.has(String(e.tool || ''))
      ));
      const replacementValues = kept.map((event: any) => JSON.stringify(event));

      const outEvents: Array<{
        tool: string; tokens: number; rawTokens: number; normTokens: number;
        inTokens: number; outTokens: number; cacheReadTokens: number; cacheWriteTokens: number;
        costUsd: number; model: string; pricingEstimated: boolean;
      }> = [];
      for (const [tool, rawVal] of Object.entries(toolsObj as Record<string, any>)) {
        if (tool === 'total' || tool === 'history') continue;
        if (excludesLegacyCodex && isLegacyCodexTool(tool)) continue;
        if (completeHistoryTools.size > 0 && !completeHistoryTools.has(tool)) continue;
        const normalized = normalizeToolTokens(tool, rawVal);
        const hVal = Number(normalized.total) || 0;
        const rawTokens = Number(normalized.raw_total ?? normalized.total) || 0;
        const normTokens = Number.isFinite(Number(normalized.norm))
          ? Number(normalized.norm)
          : hVal;
        // Drop zeros only. The ONLY safe rejection for a past-day history entry is
        // a CUMULATIVE-DUMP misreport (agent sent its lifetime total as a day:
        // hVal ≈ deviceTotal). We must NOT drop legitimately large days just for
        // exceeding a median-derived cap — that silently zeroed out busy days
        // (e.g. 2026-08-10 reported 2.33B but 3×median was only 1.34B, so the
        // whole day was discarded and the personal page showed 0).
        const isCumulativeDump = completeHistoryTools.size === 0 && deviceTotal > 0 && hVal > 0.5 * deviceTotal;
        if (hVal <= 0 || isCumulativeDump) continue;
        outEvents.push({
          tool,
          tokens: hVal,
          rawTokens,
          normTokens,
          inTokens: Number(normalized.in) || 0,
          outTokens: Number(normalized.out) || 0,
          cacheReadTokens: Number(normalized.cache_read) || 0,
          cacheWriteTokens: Number(normalized.cache_write) || 0,
          costUsd: Number(normalized.cost) || 0,
          model: normalized.model || modelFor(tool),
          pricingEstimated: Boolean(normalized.pricing_estimated),
        });
      }
      // Write every event for the day. No DAY_CAP truncation: a real busy day can
      // legitimately exceed any statistical cap, and the cumulative-dump guard
      // above is the sole protective filter.
      for (const e of outEvents) {
        const ev: TimeseriesEvent = {
          timestamp: new Date(dateStr).getTime(),
          tool: e.tool,
          model: e.model,
          tokens: e.tokens,
          rawTokens: e.rawTokens,
          normTokens: e.normTokens,
          inTokens: e.inTokens,
          outTokens: e.outTokens,
          cacheReadTokens: e.cacheReadTokens,
          cacheWriteTokens: e.cacheWriteTokens,
          costUsd: e.costUsd,
          pricingEstimated: e.pricingEstimated,
          pricingSnapshotDate: PRICING_SNAPSHOT_DATE,
          cacheHit: e.cacheReadTokens > 0,
          deviceId,
          source: completeHistoryTools.size > 0 ? 'agent-history-v2' : 'agent-history-legacy',
        };
        replacementValues.push(JSON.stringify(ev));
      }
      await replaceRedisList(kv, rawKey, replacementValues, updateLease.commit);
    }
  }

  // 1.6 Heal MISSING past days from cumulative SNAPSHOT DELTAS (robust path).
  // Each device upload stores `snap:DATE = cumulative total`. The delta between
  // consecutive snapshots is the true daily usage for the later date — immune to
  // the agent's flaky per-day history. Runs every upload, so gaps self-heal as
  // snapshots accumulate across days. `today` is handled by the delta loop below,
  // so it is skipped here. We only fill days that have NO timeseries yet, never
  // overwriting good data.
  if (completeHistoryTools.size === 0 && !excludesLegacyCodex) {
    const perDevice: Record<string, { date: string; total: number }[]> = {};
    for (const sk of legacySnapshotKeys) {
      const raw = await kv.get(sk);
      if (!raw) continue;
      try {
        const o = JSON.parse(raw);
        const parts = snapshotKeyParts(sk);
        if (!parts) continue;
        (perDevice[parts.deviceId] ||= []).push({ date: parts.date, total: o.total });
      } catch { /* ignore */ }
    }
    // Derive a sane cap from the distribution of snapshot deltas so a context-
    // resend phantom (~full lifetime in one jump) is rejected, but legit big days pass.
    const allDeltas: number[] = [];
    for (const did of Object.keys(perDevice)) {
      const arr = perDevice[did].sort((a, b) => (a.date < b.date ? -1 : 1));
      for (let i = 1; i < arr.length; i++) {
        const d = arr[i].total - arr[i - 1].total;
        if (d > 0) allDeltas.push(d);
      }
    }
    allDeltas.sort((a, b) => a - b);
    const snapMedian = allDeltas.length ? allDeltas[Math.floor(allDeltas.length / 2)] : 0;
    const SNAP_DAY_CAP = snapMedian > 0 ? Math.max(10 * snapMedian, 2_000_000_000) : 2_000_000_000;

    for (const did of Object.keys(perDevice)) {
      const arr = perDevice[did].sort((a, b) => (a.date < b.date ? -1 : 1));
      for (let i = 1; i < arr.length; i++) {
        const prev = arr[i - 1];
        const cur = arr[i];
        if (cur.date >= todayStr) continue; // today handled by delta loop
        const dayKey = `user:${userId}:timeseries:${cur.date}`;
        const existing = await kv.lrange(dayKey, 0, -1);
        if (existing.length) continue; // already attributed — never overwrite good data
        const delta = cur.total - prev.total;
        if (delta <= 0 || delta > SNAP_DAY_CAP) continue;
        const ev: TimeseriesEvent = {
          timestamp: new Date(cur.date).getTime(),
          tool: 'codex',
          model: 'gpt-5.6-sol',
          tokens: delta,
          rawTokens: delta,
          inTokens: delta * 0.9,
          outTokens: delta * 0.1,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
          cacheHit: false,
          costUsd: Number(normalizeToolTokens('codex', {
            total: delta, raw_total: delta, in: delta * 0.9, out: delta * 0.1,
            cache_read: 0, cache_write: 0,
          }).cost) || 0,
          pricingEstimated: true,
          pricingSnapshotDate: PRICING_SNAPSHOT_DATE,
          deviceId: did,
          source: 'snapshot-delta'
        };
        pendingRpushes.push([dayKey, [JSON.stringify(ev)]]);
      }
    }
  }

  // --- TODAY from cumulative high-water deltas for history-less tools ---
  // A separate high-water mark prevents a local database cleanup/reset followed
  // by a rebound from counting the same lifetime tokens a second time.
  const watermarkKey = `user:${userId}:device:${deviceId}:watermarks`;
  let watermarks: Record<string, any> = {};
  try {
    const raw = await kv.get(watermarkKey);
    if (raw) watermarks = JSON.parse(raw);
  } catch { watermarks = {}; }

  for (const [tool, valObj] of Object.entries(normalizedTokens)) {
    if (tool === 'total' || tool === 'history') continue;
    if (excludesLegacyCodex && isLegacyCodexTool(tool)) continue;
    if (completeHistoryTools.has(tool)) continue;
    const vobj = valObj as any;
    const oldToolData = watermarks[tool] || oldDeviceTokens[tool];
    const hasBaseline = !!oldToolData;
    const oldTotal = oldToolData ? (Number(oldToolData.total) || 0) : 0;
    const valTotal = Number(vobj.total) || 0;
    const delta = valTotal - oldTotal;

    // No baseline for this device: never record the full cumulative as "today"
    // (that created the 1.3B phantom). Fall back to a *sane* history[today]
    // value, else skip.
    let eventTokens = 0, rawTokens = 0, normTokens = 0;
    let inTokens = 0, outTokens = 0, cacheReadTokens = 0, cacheWriteTokens = 0;
    if (hasBaseline && delta > 0) {
      eventTokens = delta;
      rawTokens = Math.max(0, (Number(vobj.raw_total) || valTotal) - (oldToolData ? Number(oldToolData.raw_total) || oldTotal : 0));
      normTokens = Math.max(0, (Number(vobj.norm) || valTotal) - (oldToolData ? Number(oldToolData.norm) || oldTotal : 0));
      inTokens = Math.max(0, (Number(vobj.in) || 0) - (oldToolData ? Number(oldToolData.in) || 0 : 0));
      outTokens = Math.max(0, (Number(vobj.out) || 0) - (oldToolData ? Number(oldToolData.out) || 0 : 0));
      cacheReadTokens = Math.max(0, (Number(vobj.cache_read) || 0) - (oldToolData ? Number(oldToolData.cache_read) || 0 : 0));
      cacheWriteTokens = Math.max(0, (Number(vobj.cache_write) || 0) - (oldToolData ? Number(oldToolData.cache_write) || 0 : 0));
    } else if (!hasBaseline && valTotal > 0) {
      const ht = historyData && (historyData[todayStr] as Record<string, any> | undefined)?.[tool];
      const hv = ht ? (typeof ht === 'object' ? (Number(ht.total) || 0) : (Number(ht) || 0)) : 0;
      if (hv > 0 && hv <= DAY_CAP) {
        eventTokens = hv;
        rawTokens = ht && typeof ht === 'object' ? (Number(ht.raw_total) || hv) : hv;
        const normalizedHistory = normalizeToolTokens(tool, ht);
        normTokens = Number(normalizedHistory.norm) || 0;
        inTokens = Number(normalizedHistory.in) || 0;
        outTokens = Number(normalizedHistory.out) || 0;
        cacheReadTokens = Number(normalizedHistory.cache_read) || 0;
        cacheWriteTokens = Number(normalizedHistory.cache_write) || 0;
      }
    }
    const nextWatermark: Record<string, number> = {};
    for (const counter of ['total', 'raw_total', 'norm', 'in', 'out', 'cache_read', 'cache_write']) {
      nextWatermark[counter] = Math.max(
        Number(oldToolData?.[counter]) || 0,
        Number(vobj[counter]) || 0,
      );
    }
    watermarks[tool] = nextWatermark;

    if (eventTokens <= 0 || eventTokens > DAY_CAP) continue;

    const pricedEvent = normalizeToolTokens(tool, {
      total: rawTokens || eventTokens,
      raw_total: rawTokens || eventTokens,
      in: inTokens,
      out: outTokens,
      cache_read: cacheReadTokens,
      cache_write: cacheWriteTokens,
    });
    const event: TimeseriesEvent = {
      timestamp: now,
      tool,
      model: pricedEvent.model || modelFor(tool),
      tokens: eventTokens,
      rawTokens: rawTokens || eventTokens,
      normTokens: Number(pricedEvent.norm) || normTokens,
      inTokens,
      outTokens,
      cacheReadTokens,
      cacheWriteTokens,
      costUsd: Number(pricedEvent.cost) || 0,
      pricingEstimated: Boolean(pricedEvent.pricing_estimated),
      pricingSnapshotDate: PRICING_SNAPSHOT_DATE,
      cacheHit: cacheReadTokens > 0,
      deviceId,
      source: 'cumulative-delta-v2',
    };
    pendingRpushes.push([`user:${userId}:timeseries:${todayStr}`, [JSON.stringify(event)]]);
  }
  await updateLease.commit({
    sets: [[watermarkKey, JSON.stringify(watermarks)]],
    rpushes: pendingRpushes,
  });
  
  // 2. Fetch all devices for this user
  const deviceKeys = await scanKeys(`user:${userId}:device:*:data`);
  
  const aggregatedTokens: Record<string, any> = {};

  const addToolTokens = (tool: string, raw: any) => {
    const value = normalizeToolTokens(tool, raw);
    if (!aggregatedTokens[tool]) {
      aggregatedTokens[tool] = {
        total: 0, raw_total: 0, norm: 0, in: 0, out: 0,
        cache_read: 0, cache_write: 0, cost: 0, turns: 0,
      };
    }
    const target = aggregatedTokens[tool];
    const total = Number(value.total) || 0;
    target.total += total;
    target.raw_total += Number(value.raw_total ?? value.total) || 0;
    target.norm += Number.isFinite(Number(value.norm)) ? Number(value.norm) : total;
    target.in += Number(value.in) || 0;
    target.out += Number(value.out) || 0;
    target.cache_read += Number(value.cache_read) || 0;
    target.cache_write += Number(value.cache_write) || 0;
    target.cost += Number(value.cost) || 0;
    target.turns += Number(value.turns) || 0;
  };
  
  if (deviceKeys.length > 0) {
    const devicePrefix = `user:${userId}:device:`;
    const deviceIds = deviceKeys.map((key) => key.slice(devicePrefix.length, -':data'.length));
    const [allDeviceData, ledgerVersions] = await Promise.all([
      kv.mget(deviceKeys),
      kv.mget(deviceIds.map((id) => `user:${userId}:device:${id}:codex-ledger-version`)),
    ]);
    for (let index = 0; index < allDeviceData.length; index++) {
      const dataStr = allDeviceData[index];
      if (dataStr) {
        try {
          const parsed = JSON.parse(dataStr as string);
          if (parsed && parsed.tokens) {
            const normalizedDevice = normalizeDeviceUpload(parsed.tokens, {
              hasCodexLedger: ledgerVersions[index] === '5',
            });
            for (const [tool, value] of Object.entries(normalizedDevice)) addToolTokens(tool, value);
          }
        } catch (e) {}
      }
    }
  }

  if (codexSummary?.lifetime) {
    const lifetime = codexSummary.lifetime;
    addToolTokens('codex', {
      total: Number(lifetime.total) || 0,
      raw_total: Number(lifetime.total) || 0,
      norm: Number(lifetime.norm) || 0,
      in: Number(lifetime.input_total) || 0,
      out: Number(lifetime.output) || 0,
      cache_read: Number(lifetime.cache_read) || 0,
      cache_write: Number(lifetime.cache_write) || 0,
      cost: Number(lifetime.cost) || 0,
      model: 'gpt-5.6-sol',
      pricing_estimated: Boolean(lifetime.estimated),
      pricing_snapshot_date: PRICING_SNAPSHOT_DATE,
      turns: canonicalTurnCount,
    });
  }
  
  // 3. Calculate final total
  const finalTotal = Object.values(aggregatedTokens).reduce((acc, val) => acc + val.total, 0);
  aggregatedTokens['total'] = finalTotal;
  const metrics = rankMetricsFromTokens(aggregatedTokens);
  
  // 4. Save to the main user profile (preserve the original createdAt so the
  // "since when" stat is real, not hardcoded).
  let createdAt = new Date().toISOString();
  const prevDataStr = await kv.get(`user:${userId}:data`);
  if (prevDataStr) {
    try {
      const prev = JSON.parse(prevDataStr);
      if (prev.createdAt) createdAt = prev.createdAt;
    } catch (e) {}
  }
  const aggregatedData: UserRankData = {
    userId,
    name,
    image,
    tokens: aggregatedTokens,
    metrics,
    updatedAt: new Date().toISOString(),
    createdAt
  };
  
  await updateLease.commit({
    sets: [[`user:${userId}:data`, JSON.stringify(aggregatedData)]],
    zadds: [
      ['leaderboard:total', metrics.total, userId],
      ['leaderboard:norm', metrics.norm, userId],
      ['leaderboard:cost', metrics.cost, userId],
    ],
  });

  return {
    codex: codexSummary?.lifetime ? {
      total: Number(codexSummary.lifetime.total) || 0,
      norm: Number(codexSummary.lifetime.norm) || 0,
      cost: Number(codexSummary.lifetime.cost) || 0,
      turns: canonicalTurnCount,
    } : null,
    pricing_snapshot_date: PRICING_SNAPSHOT_DATE,
  } satisfies TokenUpdateResult;

  } finally {
    await updateLease.release();
  }
}

export async function getLeaderboard(limit = 100, time = 'all', metric: RankMetric = 'total'): Promise<UserRankData[]> {
  if (!kv) return [];

  // 'all' = lifetime ranking straight from the persistent ZSET.
  if (time === 'all') {
    const userIds = await kv.zrevrange(`leaderboard:${metric}`, 0, limit - 1);
    if (!userIds || userIds.length === 0) return [];
    const keys = userIds.map(id => `user:${id}:data`);
    const results = await kv.mget(keys);
    const list = results.filter(Boolean).map((res) => {
      const row = JSON.parse(res as string);
      return { ...row, metrics: row.metrics || rankMetricsFromTokens(row.tokens) };
    });
    return sortRankRows(list, metric).slice(0, limit);
  }

  // Period views must rank by REAL activity inside the window — not by lifetime
  // Top-N. A user who is #1 this week but low lifetime would otherwise never
  // appear. So we discover every user who has timeseries data in the window,
  // aggregate their period totals, then sort.
  let days = 1;
  if (time === 'today') days = 1;
  else if (time === 'yesterday') days = 2;
  else if (time === '3d') days = 3;
  else if (time === '7d') days = 7;
  else if (time === '30d') days = 30;
  else if (time === '90d') days = 90;

  const datesToFetch: string[] = [];
  for (let i = 0; i < days; i++) {
    datesToFetch.push(beijingDateNDaysAgo(i));
  }

  let targetDates = datesToFetch;
  if (time === 'yesterday') {
    targetDates = [datesToFetch[1]];
  }
  const window = new Set(targetDates);

  const activeUserIds = await discoverActiveUserIds(window);
  if (activeUserIds.length === 0) return [];

  const baseDataResults = await kv.mget(activeUserIds.map(id => `user:${id}:data`));
  const userMap: Record<string, UserRankData> = {};
  activeUserIds.forEach((id, idx) => {
    if (baseDataResults[idx]) {
      try { userMap[id] = JSON.parse(baseDataResults[idx] as string); } catch (e) {}
    }
  });

  const pipe = kv.pipeline();
  for (const id of activeUserIds) {
    for (const dateStr of targetDates) {
      pipe.lrange(`user:${id}:timeseries:${dateStr}`, 0, -1);
    }
  }
  const tsResults = await pipe.exec();

  const aggregatedList: UserRankData[] = [];
  let resultIdx = 0;
  for (const id of activeUserIds) {
    const baseData = userMap[id];
    if (!baseData) {
      resultIdx += targetDates.length;
      continue;
    }

    const userEvents: TimeseriesEvent[] = [];
    for (let i = 0; i < targetDates.length; i++) {
      const [err, events] = tsResults![resultIdx++] as [Error | null, string[]];
      if (err || !events || events.length === 0) continue;
      for (const evStr of events) {
        try {
          const ev = JSON.parse(evStr);
          userEvents.push(ev);
        } catch (e) {}
      }
    }

    const aggregate = aggregateRankEvents(userEvents);
    if (aggregate.metrics.total > 0) {
      aggregatedList.push({ ...baseData, tokens: aggregate.tokens, metrics: aggregate.metrics });
    }
  }

  // Keyed by userId (never by display name) — two people sharing a name stay
  // separate, and a single user's multi-device data is already merged upstream
  // in updateTokenUsage.
  return sortRankRows(aggregatedList, metric).slice(0, limit);
}

// Scan timeseries keys and return the set of userIds that have data on any date
// inside `window`. Uses SCAN (non-blocking). Key format: user:{userId}:timeseries:{date}.
async function discoverActiveUserIds(window: Set<string>): Promise<string[]> {
  if (!kv) return [];
  const ids = new Set<string>();
  let cursor = '0';
  do {
    const [next, keys] = await kv.scan(cursor, 'MATCH', 'user:*:timeseries:*', 'COUNT', 500);
    cursor = next;
    for (const k of keys) {
      const parts = k.split(':');
      const date = parts[parts.length - 1];
      if (window.has(date)) {
        ids.add(parts.slice(1, parts.length - 2).join(':'));
      }
    }
  } while (cursor !== '0');
  return [...ids];
}

export async function getGlobalStats(leaderboardData: UserRankData[] | null = null, metric: RankMetric = 'total') {
  if (!kv) return { totalUsers: 0, totalTokens: 0 };
  
  if (leaderboardData) {
    const totalUsers = leaderboardData.length;
    const totalTokens = leaderboardData.reduce((acc, user) => acc + (user.metrics?.[metric] || 0), 0);
    return { totalUsers, totalTokens };
  }
  
  const totalUsers = await kv.zcard(`leaderboard:${metric}`);
  const allScores = await kv.zrange(`leaderboard:${metric}`, 0, -1, 'WITHSCORES');
  let totalTokens = 0;
  for (let i = 1; i < allScores.length; i += 2) {
     totalTokens += Number(allScores[i]) || 0;
  }
  
  return { totalUsers, totalTokens };
}

export async function getUserAnalytics(userId: string, days: number = 30) {
  if (!kv) return [];
  
  const dates = [];
  for (let i = 0; i < days; i++) {
    dates.push(beijingDateNDaysAgo(i));
  }
  
  let allEvents: TimeseriesEvent[] = [];
  
  // Because mget doesn't work for lists, we need to pipeline lrange
  const pipe = kv.pipeline();
  dates.forEach(dateStr => {
    pipe.lrange(`user:${userId}:timeseries:${dateStr}`, 0, -1);
  });
  
  const results = await pipe.exec();
  
  if (results) {
    results.forEach(([err, res]) => {
      if (!err && Array.isArray(res)) {
        res.forEach(item => {
          try {
            const event = JSON.parse(item);
            if (event.tool === 'codex' || event.tool === 'codex_proxy') {
              const originalTokens = Number(event.tokens) || 0;
              const hadRawTokens = event.rawTokens !== undefined;
              const total = Number(event.rawTokens ?? originalTokens) || 0;
              event.rawTokens = total;
              event.normTokens = Number.isFinite(Number(event.normTokens))
                ? Number(event.normTokens)
                : (hadRawTokens
                  ? originalTokens
                  : Math.max(0, total - (Number(event.cacheReadTokens) || 0) - (Number(event.cacheWriteTokens) || 0)));
              event.tokens = total;
            }
            allEvents.push(event);
          } catch(e) {}
        });
      }
    });
  }
  
  // If no events found, maybe they have total tokens but no timeseries? 
  // We can return empty array and frontend handles it.
  
  return allEvents;
}
