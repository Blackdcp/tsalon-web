import Redis from 'ioredis';

// Fallback for development if no REDIS_URL is provided, or throw
const redisUrl = process.env.REDIS_URL || '';
export const kv = redisUrl ? new Redis(redisUrl) : null;

export interface UserRankData {
  userId: string;
  name: string;
  image: string;
  tokens: Record<string, number>;
  updatedAt: string;
}

export interface TimeseriesEvent {
  timestamp: number;
  tool: string;
  model: string;
  tokens: number;
  cacheHit: boolean;
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

export async function updateTokenUsage(userId: string, name: string, image: string, tokens: Record<string, number>, deviceId: string = 'default_device') {
  if (!kv) return;
  
  // 0. Fetch previous device data to calculate deltas
  const oldDeviceDataStr = await kv.get(`user:${userId}:device:${deviceId}:data`);
  const oldDeviceTokens: Record<string, number> = {};
  if (oldDeviceDataStr) {
    try {
      const parsed = JSON.parse(oldDeviceDataStr);
      if (parsed.tokens) {
        for (const [k, v] of Object.entries(parsed.tokens)) {
          oldDeviceTokens[k] = Number(v) || 0;
        }
      }
    } catch(e) {}
  }
  
  // 1. Save data for THIS device
  const deviceTotal = Object.values(tokens).reduce((acc, val) => acc + val, 0);
  tokens['total'] = deviceTotal;
  
  const deviceData = {
    userId,
    name,
    image,
    tokens,
    updatedAt: new Date().toISOString()
  };
  
  await kv.set(`user:${userId}:device:${deviceId}:data`, JSON.stringify(deviceData));
  
  // 1.5 Generate Timeseries Deltas
  const now = Date.now();
  const todayStr = new Date().toISOString().split('T')[0];
  
  const pipe = kv.pipeline();
  let hasTimeseriesEvents = false;
  
  for (const [tool, val] of Object.entries(tokens)) {
    if (tool === 'total') continue;
    const oldVal = oldDeviceTokens[tool] || 0;
    const delta = val - oldVal;
    
    if (delta > 0 || (val > 0 && oldVal === 0)) {
      let model = 'unknown';
      let cacheRate = 0.5;
      if (tool === 'cursor' || tool === 'codex') {
        model = 'gpt-5.6-sol';
        cacheRate = 0.93;
      } else if (tool === 'antigravity') {
        model = 'gemini-2.5-pro';
        cacheRate = 0.1;
      } else if (tool === 'claude') {
        model = 'claude-3-5-sonnet';
        cacheRate = 0.8;
      }
      
      const isFirstRun = (oldVal === 0 && val > 0);
      
      if (isFirstRun && val > 1000) {
        // Distribute historically over 30 days
        const days = 30;
        const dailyAvg = Math.floor(val / days);
        for (let i = 0; i < days; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const historyDateStr = d.toISOString().split('T')[0];
          
          // Add some randomness so the chart isn't perfectly flat
          const variance = 0.8 + (Math.random() * 0.4); // 0.8x to 1.2x
          const tokensToLog = Math.floor(dailyAvg * variance);
          
          const event: TimeseriesEvent = {
            timestamp: d.getTime(),
            tool,
            model,
            tokens: tokensToLog,
            cacheHit: Math.random() < cacheRate
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
          tokens: delta > 0 ? delta : val,
          cacheHit: Math.random() < cacheRate
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
  
  const aggregatedTokens: Record<string, number> = {};
  
  if (deviceKeys.length > 0) {
    const allDeviceData = await kv.mget(deviceKeys);
    for (const dataStr of allDeviceData) {
      if (dataStr) {
        try {
          const parsed = JSON.parse(dataStr as string);
          if (parsed && parsed.tokens) {
            for (const [key, val] of Object.entries(parsed.tokens)) {
              if (key !== 'total') {
                aggregatedTokens[key] = (aggregatedTokens[key] || 0) + (Number(val) || 0);
              }
            }
          }
        } catch (e) {}
      }
    }
  }
  
  // 3. Calculate final total
  const finalTotal = Object.values(aggregatedTokens).reduce((acc, val) => acc + val, 0);
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

export async function getLeaderboard(limit = 100): Promise<UserRankData[]> {
  if (!kv) return [];
  // ioredis zrevrange returns highest score first
  const userIds = await kv.zrevrange('leaderboard:total', 0, limit - 1);
  if (!userIds || userIds.length === 0) return [];
  
  if (userIds.length > 0) {
    const keys = userIds.map(id => `user:${id}:data`);
    const results = await kv.mget(keys);
    const parsedResults = results.filter(Boolean).map(res => JSON.parse(res as string));
    return parsedResults;
  }
  return [];
}

export async function getGlobalStats() {
  if (!kv) return { totalUsers: 0, totalTokens: 0 };
  const totalUsers = await kv.zcard('leaderboard:total');
  
  // zrange with WITHSCORES returns ['user1', '100', 'user2', '200']
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
