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
