import Redis from 'ioredis';

// Fallback for development if no REDIS_URL is provided, or throw
const redisUrl = process.env.REDIS_URL || '';
export const kv = redisUrl ? new Redis(redisUrl) : null;

export interface UserRankData {
  userId: string;
  name: string;
  image: string;
  tokens: Record<string, any>;
  updatedAt: string;
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
  
  // 1.5 Generate Timeseries Deltas
  const now = Date.now();
  const todayStr = new Date().toISOString().split('T')[0];
  
  const pipe = kv.pipeline();
  let hasTimeseriesEvents = false;
  
  // If exact history is provided, we can sync it directly!
  if (historyData && Object.keys(historyData).length > 0) {
    // 1. Wipe old timeseries data ONLY for tools present in historyData to avoid duplicates
    const keysToFilter = await kv.keys(`user:${userId}:timeseries:*`);
    const toolsInHistory = new Set<string>();
    for (const toolsObj of Object.values(historyData)) {
      Object.keys(toolsObj).forEach(t => toolsInHistory.add(t));
    }
    
    for (const key of keysToFilter) {
      const rawEvents = await kv.lrange(key, 0, -1);
      const events: TimeseriesEvent[] = rawEvents.map((str: any) => typeof str === 'string' ? JSON.parse(str) : str);
      const filteredEvents = events.filter(e => !(toolsInHistory.has(e.tool) && e.deviceId === deviceId));
      await kv.del(key);
      if (filteredEvents.length > 0) {
        const pipeline = kv.pipeline();
        filteredEvents.forEach(e => pipeline.rpush(key, JSON.stringify(e)));
        pipeline.expire(key, 60 * 60 * 24 * 31);
        await pipeline.exec();
      }
    }
  }

  // Delta logic
  for (const [tool, valObj] of Object.entries(normalizedTokens)) {
    if (tool === 'total' || tool === 'history') continue;
    const oldToolData = oldDeviceTokens[tool];
    const oldTotal = oldToolData ? (Number(oldToolData.total) || 0) : 0;
    const valTotal = Number(valObj.total) || 0;
    const delta = valTotal - oldTotal;
    
    let model = 'unknown';
    let cacheRate = 0.5;
    if (tool === 'cursor' || tool === 'codex' || tool === 'codex_proxy') {
      model = 'gpt-5.6-sol';
      cacheRate = 0.93;
    } else if (tool === 'antigravity') {
      model = 'gemini-2.5-pro';
      cacheRate = 0.1;
    } else if (tool === 'claude') {
      model = 'claude-3-5-sonnet';
      cacheRate = 0.8;
    }

    let toolHasHistory = false;
    if (historyData) {
      for (const toolsObj of Object.values(historyData)) {
        if (toolsObj[tool]) {
          toolHasHistory = true;
          break;
        }
      }
    }

    if (toolHasHistory) {
      for (const [dateStr, toolsObj] of Object.entries(historyData!)) {
        const rawVal = toolsObj[tool];
        if (!rawVal) continue;
        const hVal = typeof rawVal === 'object' && rawVal !== null ? (Number(rawVal.total) || 0) : (Number(rawVal) || 0);
        if (hVal > 0) {
          const inTokens = typeof rawVal === 'object' ? Number(rawVal.in || 0) : Math.floor(hVal * 0.9);
          const outTokens = typeof rawVal === 'object' ? Number(rawVal.out || 0) : Math.floor(hVal * 0.1);
          const cacheReadTokens = typeof rawVal === 'object' ? Number(rawVal.cache_read || 0) : 0;
          const cacheWriteTokens = typeof rawVal === 'object' ? Number(rawVal.cache_write || 0) : 0;

          const event: TimeseriesEvent = {
            timestamp: new Date(dateStr).getTime(),
            tool,
            model,
            tokens: hVal,
            inTokens,
            outTokens,
            cacheReadTokens,
            cacheWriteTokens,
            cacheHit: cacheReadTokens > 0 ? true : Math.random() < cacheRate,
            deviceId: deviceId
          };
          pipe.rpush(`user:${userId}:timeseries:${dateStr}`, JSON.stringify(event));
          pipe.expire(`user:${userId}:timeseries:${dateStr}`, 60 * 60 * 24 * 31);
        }
      }
      hasTimeseriesEvents = true;
    } else if (delta > 0 || (valTotal > 0 && oldTotal === 0)) {
      const isFirstRun = (oldTotal === 0 && valTotal > 0) || delta > 100_000_000;
      
      const inTokens = Math.max(0, (Number(valObj.in) || 0) - (oldToolData ? (Number(oldToolData.in) || 0) : 0));
      const outTokens = Math.max(0, (Number(valObj.out) || 0) - (oldToolData ? (Number(oldToolData.out) || 0) : 0));
      const cacheReadTokens = Math.max(0, (Number(valObj.cache_read) || 0) - (oldToolData ? (Number(oldToolData.cache_read) || 0) : 0));
      const cacheWriteTokens = Math.max(0, (Number(valObj.cache_write) || 0) - (oldToolData ? (Number(oldToolData.cache_write) || 0) : 0));
      
      if (isFirstRun && valTotal > 1000) {
        // Distribute historically over 30 days (Fallback for tools without exact history)
        const days = 30;
        const dailyAvg = Math.floor(valTotal / days);
        const dailyIn = Math.floor(inTokens / days);
        const dailyOut = Math.floor(outTokens / days);
        const dailyCacheRead = Math.floor(cacheReadTokens / days);
        
        for (let i = 0; i < days; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const historyDateStr = d.toISOString().split('T')[0];
          
          const event: TimeseriesEvent = {
            timestamp: d.getTime(),
            tool,
            model,
            tokens: i === 0 ? dailyAvg + (valTotal % days) : dailyAvg,
            inTokens: i === 0 ? dailyIn + (inTokens % days) : dailyIn,
            outTokens: i === 0 ? dailyOut + (outTokens % days) : dailyOut,
            cacheReadTokens: i === 0 ? dailyCacheRead + (cacheReadTokens % days) : dailyCacheRead,
            cacheHit: cacheReadTokens > 0 ? true : Math.random() < cacheRate,
            deviceId: deviceId
          };
          pipe.rpush(`user:${userId}:timeseries:${historyDateStr}`, JSON.stringify(event));
          pipe.expire(`user:${userId}:timeseries:${historyDateStr}`, 60 * 60 * 24 * 31);
        }
        hasTimeseriesEvents = true;
      } else {
        // Log to today
        const event: TimeseriesEvent = {
          timestamp: now,
          tool,
          model,
          tokens: delta > 0 ? delta : valTotal,
          inTokens: delta > 0 ? inTokens : (Number(valObj.in) || 0),
          outTokens: delta > 0 ? outTokens : (Number(valObj.out) || 0),
          cacheReadTokens: delta > 0 ? cacheReadTokens : (Number(valObj.cache_read) || 0),
          cacheHit: cacheReadTokens > 0 ? true : Math.random() < cacheRate,
          deviceId: deviceId
        };
        pipe.rpush(`user:${userId}:timeseries:${todayStr}`, JSON.stringify(event));
        pipe.expire(`user:${userId}:timeseries:${todayStr}`, 60 * 60 * 24 * 31);
        hasTimeseriesEvents = true;
      }
    }
  }
  
  if (hasTimeseriesEvents) {
    await pipe.exec();
  }
  
  // 2. Fetch all devices for this user
  const deviceKeys = await kv.keys(`user:${userId}:device:*:data`);
  
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
  
  // 4. Save to the main user profile
  const aggregatedData: UserRankData = {
    userId,
    name,
    image,
    tokens: aggregatedTokens,
    updatedAt: new Date().toISOString()
  };
  
  await kv.set(`user:${userId}:data`, JSON.stringify(aggregatedData));
  await kv.zadd('leaderboard:total', finalTotal, userId);
}

export async function getLeaderboard(limit = 100, time = 'all'): Promise<UserRankData[]> {
  if (!kv) return [];
  
  if (time === 'all') {
    // ioredis zrevrange returns highest score first
    const userIds = await kv.zrevrange('leaderboard:total', 0, limit - 1);
    if (!userIds || userIds.length === 0) return [];
    
    const keys = userIds.map(id => `user:${id}:data`);
    const results = await kv.mget(keys);
    const rawList = results.filter(Boolean).map(res => JSON.parse(res as string));

    const seenNames = new Map<string, UserRankData>();
    for (const item of rawList) {
      const key = (item.name || '').toLowerCase().trim().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
      if (!seenNames.has(key)) {
        seenNames.set(key, { ...item, tokens: { ...item.tokens } });
      } else {
        const existing = seenNames.get(key)!;
        // Merge tokens
        for (const [t, v] of Object.entries(item.tokens)) {
          if (t === 'total' || t === 'history') continue;
          if (!existing.tokens[t]) {
            existing.tokens[t] = typeof v === 'object' ? { ...v } : v;
          } else if (typeof v === 'object' && typeof existing.tokens[t] === 'object') {
            const ext = existing.tokens[t] as any;
            const vv = v as any;
            ext.total = (ext.total || 0) + (vv.total || 0);
            ext.in = (ext.in || 0) + (vv.in || 0);
            ext.out = (ext.out || 0) + (vv.out || 0);
            ext.cache_read = (ext.cache_read || 0) + (vv.cache_read || 0);
            ext.cache_write = (ext.cache_write || 0) + (vv.cache_write || 0);
          } else if (typeof v === 'number' && typeof existing.tokens[t] === 'number') {
            existing.tokens[t] += v;
          }
        }
        existing.tokens.total += (item.tokens?.total || 0);
        
        if ((/^\d+$/.test(item.userId) && !/^\d+$/.test(existing.userId))) {
          existing.userId = item.userId;
          existing.name = item.name;
          existing.image = item.image;
        } else if ((item.tokens?.total || 0) > (existing.tokens?.total || 0) && !/^\d+$/.test(existing.userId)) {
          existing.name = item.name;
          existing.image = item.image;
        }
        seenNames.set(key, existing);
      }
    }
    const finalLeaderboard = Array.from(seenNames.values());
    finalLeaderboard.sort((a, b) => (b.tokens?.total || 0) - (a.tokens?.total || 0));
    return finalLeaderboard.slice(0, limit);
  }
  
  // Dynamic aggregation for time windows
  // Only query timeseries for the requested limit (e.g., top 100) to avoid 15000+ pipeline commands
  const userIds = await kv.zrevrange('leaderboard:total', 0, limit > 0 ? limit - 1 : 99);
  if (!userIds || userIds.length === 0) return [];

  let days = 1;
  if (time === 'today') days = 1;
  else if (time === 'yesterday') days = 2;
  else if (time === '3d') days = 3;
  else if (time === '7d') days = 7;
  else if (time === '30d') days = 30;
  else if (time === '90d') days = 90;

  const datesToFetch: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    datesToFetch.push(d.toISOString().split('T')[0]);
  }
  
  let targetDates = datesToFetch;
  if (time === 'yesterday') {
    targetDates = [datesToFetch[1]];
  }

  const baseDataKeys = userIds.map(id => `user:${id}:data`);
  const baseDataResults = await kv.mget(baseDataKeys);
  const userMap: Record<string, UserRankData> = {};
  userIds.forEach((id, idx) => {
    if (baseDataResults[idx]) {
      userMap[id] = JSON.parse(baseDataResults[idx] as string);
    }
  });

  const pipe = kv.pipeline();
  for (const id of userIds) {
    for (const dateStr of targetDates) {
      pipe.lrange(`user:${id}:timeseries:${dateStr}`, 0, -1);
    }
  }
  
  const tsResults = await pipe.exec();
  
  const aggregatedList: UserRankData[] = [];
  let resultIdx = 0;
  
  for (const id of userIds) {
    const baseData = userMap[id];
    if (!baseData) {
      resultIdx += targetDates.length;
      continue;
    }
    
    let userTotal = 0;
    const tokens: Record<string, any> = {};
    
    for (let i = 0; i < targetDates.length; i++) {
      const [err, events] = tsResults![resultIdx++] as [Error | null, string[]];
      if (!err && events && events.length > 0) {
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
          } catch(e) {}
        }
      }
    }
    
    if (userTotal > 0) {
      tokens['total'] = userTotal;
      aggregatedList.push({
        ...baseData,
        tokens
      });
    }
  }
  
  // Deduplicate by name and keep the one with the highest tokens or GitHub ID
  const seenNames = new Map<string, UserRankData>();
  for (const item of aggregatedList) {
    const key = (item.name || '').toLowerCase().trim().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
    if (!seenNames.has(key)) {
      seenNames.set(key, { ...item, tokens: { ...item.tokens } });
    } else {
      const existing = seenNames.get(key)!;
      // Merge tokens
      for (const [t, v] of Object.entries(item.tokens)) {
        if (t === 'total' || t === 'history') continue;
        if (!existing.tokens[t]) {
          existing.tokens[t] = typeof v === 'object' ? { ...v } : v;
        } else if (typeof v === 'object' && typeof existing.tokens[t] === 'object') {
          const ext = existing.tokens[t] as any;
          const vv = v as any;
          ext.total = (ext.total || 0) + (vv.total || 0);
          ext.in = (ext.in || 0) + (vv.in || 0);
          ext.out = (ext.out || 0) + (vv.out || 0);
          ext.cache_read = (ext.cache_read || 0) + (vv.cache_read || 0);
          ext.cache_write = (ext.cache_write || 0) + (vv.cache_write || 0);
        } else if (typeof v === 'number' && typeof existing.tokens[t] === 'number') {
          existing.tokens[t] += v;
        }
      }
      existing.tokens.total += item.tokens.total;
      
      // Keep the GitHub ID if one has it
      if (/^\d+$/.test(item.userId) && !/^\d+$/.test(existing.userId)) {
        existing.userId = item.userId;
        existing.image = item.image;
        existing.name = item.name;
      } else if (item.tokens.total > existing.tokens.total && !/^\d+$/.test(existing.userId)) {
        existing.name = item.name;
        existing.image = item.image;
      }
      seenNames.set(key, existing);
    }
  }

  const finalLeaderboard = Array.from(seenNames.values());
  finalLeaderboard.sort((a, b) => b.tokens.total - a.tokens.total);
  return finalLeaderboard.slice(0, limit);
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
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
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
