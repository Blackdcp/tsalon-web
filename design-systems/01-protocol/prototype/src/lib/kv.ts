import Redis from 'ioredis';
import { beijingDateString, beijingDateNDaysAgo } from './date';

// Fallback for development if no REDIS_URL is provided, or throw
const redisUrl = process.env.REDIS_URL || '';
export const kv = redisUrl ? new Redis(redisUrl) : null;

export interface UserRankData {
  userId: string;
  name: string;
  image: string;
  tokens: Record<string, any>;
  updatedAt: string;
  createdAt?: string;
}

export interface TimeseriesEvent {
  timestamp: number;
  tool: string;
  model: string;
  tokens: number;
  inTokens?: number;
  outTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  cacheHit: boolean;
  deviceId?: string;
  source?: string;
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
  const found: string[] = [];
  let cursor = '0';
  do {
    const [next, keys] = await kv.scan(cursor, 'MATCH', pattern, 'COUNT', 500);
    cursor = next;
    found.push(...keys);
  } while (cursor !== '0');
  return found;
}

export async function updateTokenUsage(userId: string, name: string, image: string, tokens: Record<string, any>, deviceId: string = 'default_device', historyData: Record<string, Record<string, any>> | null = null) {
  if (!kv) return;
  
  // Normalize incoming tokens to always be {total, in, out, cache_read, cache_write}
  const normalizedTokens: Record<string, any> = {};
  for (const [k, v] of Object.entries(tokens)) {
    if (k === 'total' || k === 'history') continue;
    if (typeof v === 'number') {
      normalizedTokens[k] = { total: v, in: v * 0.9, out: v * 0.1, cache_read: 0, cache_write: 0 };
    } else if (v && typeof v === 'object') {
      normalizedTokens[k] = v;
    }
  }

  // 0. Fetch previous device data to calculate deltas
  const oldDeviceDataStr = await kv.get(`user:${userId}:device:${deviceId}:data`);
  const oldDeviceTokens: Record<string, any> = {};
  if (oldDeviceDataStr) {
    try {
      const parsed = JSON.parse(oldDeviceDataStr);
      if (parsed.tokens) {
        for (const [k, v] of Object.entries(parsed.tokens)) {
          if (k === 'total' || k === 'history') continue;
          if (typeof v === 'number') {
            oldDeviceTokens[k] = { total: v, in: v * 0.9, out: v * 0.1, cache_read: 0, cache_write: 0 };
          } else if (v && typeof v === 'object') {
            oldDeviceTokens[k] = v;
          }
        }
      }
    } catch(e) {}
  }
  
  // 1. Save data for THIS device
  const deviceTotal = Object.values(normalizedTokens).reduce((acc, val) => acc + (val.total || 0), 0);
  normalizedTokens['total'] = deviceTotal;
  
  const deviceData = {
    userId,
    name,
    image,
    tokens: normalizedTokens,
    updatedAt: new Date().toISOString()
  };
  
  await kv.set(`user:${userId}:device:${deviceId}:data`, JSON.stringify(deviceData));

  const todayStr = beijingDateString();

  // 1.4 Record a daily cumulative SNAPSHOT for this device. Cumulative snapshots
  // are reliable (the agent's "today" delta of 275M verified accurate); per-day
  // historyData is NOT. Daily usage is later derived from the delta between
  // consecutive snapshots — immune to the agent reporting its lifetime total as
  // a single day. Retain ~120 days per device.
  {
    const snapKey = `user:${userId}:device:${deviceId}:snap:${todayStr}`;
    await kv.set(snapKey, JSON.stringify({ date: todayStr, total: deviceTotal, updatedAt: new Date().toISOString() }));
    const snaps = await scanKeys(`user:${userId}:device:${deviceId}:snap:*`);
    if (snaps.length > 120) {
      snaps.sort();
      const toDel = snaps.slice(0, snaps.length - 120);
      if (toDel.length) await kv.del(...toDel);
    }
  }

  // 1.5 Generate Timeseries Deltas
  const now = Date.now();

  const pipe = kv.pipeline();
  let hasTimeseriesEvents = false;
  
  // ---------------------------------------------------------------------------
  // Daily timeseries strategy (hybrid, hardened against BOTH inflation modes):
  //
  //  • PAST days  -> trust the agent's `history` (its local per-day tracking),
  //    BUT sanitize: drop any single event above ABSOLUTE_FLOOR, and cap any day
  //    whose total exceeds 3x the median daily total (computed from the history
  //    itself) by dropping the largest events. This restores the 7d/30d/90d
  //    history and neutralizes the old context-resend inflation.
  //  • TODAY       -> use the DELTA vs the previous device snapshot (the true
  //    daily usage, immune to the agent reporting its lifetime total as "today").
  //    If we have no baseline for this device (oldTotal === 0, e.g. after a
  //    snapshot reset), we must NOT record the full cumulative as "today" —
  //    that produced the 1.3B phantom. We fall back to a *sane* history[today]
  //    value if present, else skip and let the next upload (now baselined)
  //    record the real delta.
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
      for (const v of Object.values(toolsObj as Record<string, any>)) {
        const hv = typeof v === 'object' && v !== null ? (Number((v as any).total) || 0) : (Number(v) || 0);
        day += hv;
      }
      if (day > 0) histDayTotals.push(day);
    }
  }
  histDayTotals.sort((a, b) => a - b);
  const histMedian = histDayTotals.length ? histDayTotals[Math.floor(histDayTotals.length / 2)] : 0;
  const DAY_CAP = histMedian > 0 ? Math.max(3 * histMedian, DAY_FLOOR) : DAY_FLOOR;

  // --- PAST days from history (write only if this device hasn't ingested them) ---
  if (historyData) {
    for (const [dateStr, toolsObj] of Object.entries(historyData)) {
      if (dateStr >= todayStr) continue; // today is handled by delta below
      const rawKey = `user:${userId}:timeseries:${dateStr}`;
      const existing = await kv.lrange(rawKey, 0, -1);
      const existingEvents = existing
        .map((s: any) => { try { return JSON.parse(s); } catch { return null; } })
        .filter(Boolean);
      if (existingEvents.some((e: any) => e.deviceId === deviceId)) continue; // already ingested

      // wipe this device's stale events, keep other devices', then re-add cleaned
      const kept = existingEvents.filter((e: any) => e.deviceId !== deviceId);
      await kv.del(rawKey);
      if (kept.length) {
        const rp = kv.pipeline();
        kept.forEach((e: any) => rp.rpush(rawKey, JSON.stringify(e)));
        await rp.exec();
      }

      const outEvents: { tool: string; tokens: number }[] = [];
      for (const [tool, rawVal] of Object.entries(toolsObj as Record<string, any>)) {
        if (tool === 'total' || tool === 'history') continue;
        const isObj = typeof rawVal === 'object' && rawVal !== null;
        const hVal = isObj ? (Number((rawVal as any).total) || 0) : (Number(rawVal) || 0);
        // Drop zeros only. The ONLY safe rejection for a past-day history entry is
        // a CUMULATIVE-DUMP misreport (agent sent its lifetime total as a day:
        // hVal ≈ deviceTotal). We must NOT drop legitimately large days just for
        // exceeding a median-derived cap — that silently zeroed out busy days
        // (e.g. 2026-08-10 reported 2.33B but 3×median was only 1.34B, so the
        // whole day was discarded and the personal page showed 0).
        const isCumulativeDump = deviceTotal > 0 && hVal > 0.5 * deviceTotal;
        if (hVal <= 0 || isCumulativeDump) continue;
        outEvents.push({ tool, tokens: hVal });
      }
      // Write every event for the day. No DAY_CAP truncation: a real busy day can
      // legitimately exceed any statistical cap, and the cumulative-dump guard
      // above is the sole protective filter.
      for (const e of outEvents) {
        const isObj = typeof (toolsObj as Record<string, any>)[e.tool] === 'object';
        const rv: any = (toolsObj as Record<string, any>)[e.tool];
        const inT = isObj && rv.in ? Number(rv.in) || 0 : e.tokens * 0.9;
        const outT = isObj && rv.out ? Number(rv.out) || 0 : e.tokens * 0.1;
        const crT = isObj && rv.cache_read ? Number(rv.cache_read) || 0 : 0;
        const cwT = isObj && rv.cache_write ? Number(rv.cache_write) || 0 : 0;
        const ev: TimeseriesEvent = {
          timestamp: new Date(dateStr).getTime(),
          tool: e.tool,
          model: modelFor(e.tool),
          tokens: e.tokens,
          inTokens: inT,
          outTokens: outT,
          cacheReadTokens: crT,
          cacheWriteTokens: cwT,
          cacheHit: crT > 0,
          deviceId
        };
        pipe.rpush(rawKey, JSON.stringify(ev));
        hasTimeseriesEvents = true;
      }
    }
  }

  // 1.6 Heal MISSING past days from cumulative SNAPSHOT DELTAS (robust path).
  // Each device upload stores `snap:DATE = cumulative total`. The delta between
  // consecutive snapshots is the true daily usage for the later date — immune to
  // the agent's flaky per-day history. Runs every upload, so gaps self-heal as
  // snapshots accumulate across days. `today` is handled by the delta loop below,
  // so it is skipped here. We only fill days that have NO timeseries yet, never
  // overwriting good data.
  {
    const snapKeysAll = await scanKeys(`user:${userId}:device:*:snap:*`);
    const perDevice: Record<string, { date: string; total: number }[]> = {};
    for (const sk of snapKeysAll) {
      const raw = await kv.get(sk);
      if (!raw) continue;
      try {
        const o = JSON.parse(raw);
        const did = sk.split(':')[3];
        (perDevice[did] ||= []).push({ date: o.date, total: o.total });
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

    const snapPipe = kv.pipeline();
    let snapHasEvents = false;
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
          inTokens: delta * 0.9,
          outTokens: delta * 0.1,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
          cacheHit: false,
          deviceId: did,
          source: 'snapshot-delta'
        };
        snapPipe.rpush(dayKey, JSON.stringify(ev));
        snapHasEvents = true;
      }
    }
    if (snapHasEvents) await snapPipe.exec();
  }

  // --- TODAY from delta ---
  for (const [tool, valObj] of Object.entries(normalizedTokens)) {
    if (tool === 'total' || tool === 'history') continue;
    const vobj = valObj as any;
    const oldToolData = oldDeviceTokens[tool];
    const oldTotal = oldToolData ? (Number(oldToolData.total) || 0) : 0;
    const valTotal = Number(vobj.total) || 0;
    const delta = valTotal - oldTotal;

    // No baseline for this device: never record the full cumulative as "today"
    // (that created the 1.3B phantom). Fall back to a *sane* history[today]
    // value, else skip.
    let eventTokens = 0;
    let inTokens = 0, outTokens = 0, cacheReadTokens = 0, cacheWriteTokens = 0;
    if (delta > 0) {
      eventTokens = delta;
      inTokens = Math.max(0, (Number(vobj.in) || 0) - (oldToolData ? Number(oldToolData.in) || 0 : 0));
      outTokens = Math.max(0, (Number(vobj.out) || 0) - (oldToolData ? Number(oldToolData.out) || 0 : 0));
      cacheReadTokens = Math.max(0, (Number(vobj.cache_read) || 0) - (oldToolData ? Number(oldToolData.cache_read) || 0 : 0));
      cacheWriteTokens = Math.max(0, (Number(vobj.cache_write) || 0) - (oldToolData ? Number(oldToolData.cache_write) || 0 : 0));
    } else if (oldTotal === 0 && valTotal > 0) {
      const ht = historyData && (historyData[todayStr] as Record<string, any> | undefined)?.[tool];
      const hv = ht ? (typeof ht === 'object' ? (Number(ht.total) || 0) : (Number(ht) || 0)) : 0;
      if (hv > 0 && hv <= DAY_CAP) {
        eventTokens = hv;
        inTokens = hv * 0.9; outTokens = hv * 0.1;
      }
    }
    if (eventTokens <= 0 || eventTokens > DAY_CAP) continue;

    const event: TimeseriesEvent = {
      timestamp: now,
      tool,
      model: modelFor(tool),
      tokens: eventTokens,
      inTokens,
      outTokens,
      cacheReadTokens,
      cacheWriteTokens,
      cacheHit: cacheReadTokens > 0,
      deviceId
    };
    pipe.rpush(`user:${userId}:timeseries:${todayStr}`, JSON.stringify(event));
    hasTimeseriesEvents = true;
  }
  
  if (hasTimeseriesEvents) {
    await pipe.exec();
  }
  
  // 2. Fetch all devices for this user
  const deviceKeys = await scanKeys(`user:${userId}:device:*:data`);
  
  const aggregatedTokens: Record<string, any> = {};
  
  if (deviceKeys.length > 0) {
    const allDeviceData = await kv.mget(deviceKeys);
    for (const dataStr of allDeviceData) {
      if (dataStr) {
        try {
          const parsed = JSON.parse(dataStr as string);
          if (parsed && parsed.tokens) {
            for (const [t, v] of Object.entries(parsed.tokens)) {
              if (t === 'total' || t === 'history') continue;
              if (typeof v === 'number') {
                if (!aggregatedTokens[t]) aggregatedTokens[t] = { total: 0, in: 0, out: 0, cache_read: 0, cache_write: 0 };
                aggregatedTokens[t].total += v;
                aggregatedTokens[t].in += v * 0.9;
                aggregatedTokens[t].out += v * 0.1;
              } else if (v && typeof v === 'object') {
                if (!aggregatedTokens[t]) aggregatedTokens[t] = { total: 0, in: 0, out: 0, cache_read: 0, cache_write: 0 };
                const objV = v as any;
                aggregatedTokens[t].total += objV.total || 0;
                aggregatedTokens[t].in += objV.in || 0;
                aggregatedTokens[t].out += objV.out || 0;
                aggregatedTokens[t].cache_read += objV.cache_read || 0;
                aggregatedTokens[t].cache_write += objV.cache_write || 0;
              }
            }
          }
        } catch (e) {}
      }
    }
  }
  
  // 3. Calculate final total
  const finalTotal = Object.values(aggregatedTokens).reduce((acc, val) => acc + val.total, 0);
  aggregatedTokens['total'] = finalTotal;
  
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
    updatedAt: new Date().toISOString(),
    createdAt
  };
  
  await kv.set(`user:${userId}:data`, JSON.stringify(aggregatedData));
  await kv.zadd('leaderboard:total', finalTotal, userId);
}

export async function getLeaderboard(limit = 100, time = 'all'): Promise<UserRankData[]> {
  if (!kv) return [];

  // 'all' = lifetime ranking straight from the persistent ZSET.
  if (time === 'all') {
    const userIds = await kv.zrevrange('leaderboard:total', 0, limit - 1);
    if (!userIds || userIds.length === 0) return [];
    const keys = userIds.map(id => `user:${id}:data`);
    const results = await kv.mget(keys);
    const list = results.filter(Boolean).map(res => JSON.parse(res as string));
    list.sort((a, b) => (b.tokens?.total || 0) - (a.tokens?.total || 0));
    return list.slice(0, limit);
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

    let userTotal = 0;
    const tokens: Record<string, any> = {};
    for (let i = 0; i < targetDates.length; i++) {
      const [err, events] = tsResults![resultIdx++] as [Error | null, string[]];
      if (err || !events || events.length === 0) continue;
      for (const evStr of events) {
        try {
          const ev = JSON.parse(evStr);
          if (!tokens[ev.tool]) tokens[ev.tool] = { total: 0, in: 0, out: 0, cache_read: 0, cache_write: 0 };
          tokens[ev.tool].total += ev.tokens;

          if (ev.cacheReadTokens !== undefined) {
            tokens[ev.tool].in += ev.inTokens || 0;
            tokens[ev.tool].out += ev.outTokens || 0;
            tokens[ev.tool].cache_read += ev.cacheReadTokens || 0;
            tokens[ev.tool].cache_write += ev.cacheWriteTokens || 0;
          } else {
            // Legacy events stored without a cache breakdown: derive a
            // deterministic cache estimate from the tool's known rate.
            let fallbackCache = ev.tokens * 0.5;
            if (ev.tool === 'cursor' || ev.tool === 'codex' || ev.tool === 'codex_proxy') fallbackCache = ev.tokens * 0.93;
            else if (ev.tool === 'claude') fallbackCache = ev.tokens * 0.8;
            else if (ev.tool === 'antigravity') fallbackCache = ev.tokens * 0.1;

            const freshTokens = Math.max(0, ev.tokens - fallbackCache);
            tokens[ev.tool].in += freshTokens * 0.9;
            tokens[ev.tool].out += freshTokens * 0.1;
            tokens[ev.tool].cache_read += fallbackCache;
          }
          userTotal += ev.tokens;
        } catch (e) {}
      }
    }

    if (userTotal > 0) {
      tokens['total'] = userTotal;
      aggregatedList.push({ ...baseData, tokens });
    }
  }

  // Keyed by userId (never by display name) — two people sharing a name stay
  // separate, and a single user's multi-device data is already merged upstream
  // in updateTokenUsage.
  aggregatedList.sort((a, b) => b.tokens.total - a.tokens.total);
  return aggregatedList.slice(0, limit);
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

export async function getGlobalStats(leaderboardData: UserRankData[] | null = null) {
  if (!kv) return { totalUsers: 0, totalTokens: 0 };
  
  if (leaderboardData) {
    const totalUsers = leaderboardData.length;
    const totalTokens = leaderboardData.reduce((acc, user) => acc + (user.tokens.total || 0), 0);
    return { totalUsers, totalTokens };
  }
  
  const totalUsers = await kv.zcard('leaderboard:total');
  const allScores = await kv.zrange('leaderboard:total', 0, -1, 'WITHSCORES');
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
            allEvents.push(JSON.parse(item));
          } catch(e) {}
        });
      }
    });
  }
  
  // If no events found, maybe they have total tokens but no timeseries? 
  // We can return empty array and frontend handles it.
  
  return allEvents;
}
