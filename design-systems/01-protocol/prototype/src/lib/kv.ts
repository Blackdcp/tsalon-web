import Redis from 'ioredis';

// Fallback for development if no REDIS_URL is provided, or throw
const redisUrl = process.env.REDIS_URL || '';
export const kv = redisUrl ? new Redis(redisUrl) : null;

export interface UserRankData {
  userId: string;
  name: string;
  image: string;
  tokens: {
    cursor: number;
    claude: number;
    total: number;
  };
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

export async function updateTokenUsage(userId: string, name: string, image: string, cursor: number, claude: number) {
  if (!kv) return;
  const total = cursor + claude;
  const data: UserRankData = {
    userId,
    name,
    image,
    tokens: { cursor, claude, total },
    updatedAt: new Date().toISOString()
  };
  
  await kv.set(`user:${userId}:data`, JSON.stringify(data));
  await kv.zadd('leaderboard:total', total, userId);
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
