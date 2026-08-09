import { kv } from '@vercel/kv';
export { kv };

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

// Generate or retrieve a unique upload token for a user
export async function getOrCreateUploadToken(userId: string): Promise<string> {
  const existingToken = await kv.get<string>(`user:${userId}:token`);
  if (existingToken) {
    return existingToken;
  }
  const newToken = crypto.randomUUID();
  await kv.set(`user:${userId}:token`, newToken);
  await kv.set(`token:${newToken}:userId`, userId);
  return newToken;
}

export async function getUserIdByToken(token: string): Promise<string | null> {
  return kv.get<string>(`token:${token}:userId`);
}

export async function updateTokenUsage(userId: string, name: string, image: string, cursor: number, claude: number) {
  const total = cursor + claude;
  const data: UserRankData = {
    userId,
    name,
    image,
    tokens: { cursor, claude, total },
    updatedAt: new Date().toISOString()
  };
  
  // Store detailed user data
  await kv.hset(`user:${userId}:data`, data);
  
  // Add to Sorted Set for ranking (score = total tokens)
  await kv.zadd('leaderboard:total', { score: total, member: userId });
}

export async function getLeaderboard(limit = 100): Promise<UserRankData[]> {
  // Get top users from sorted set (highest score first)
  const userIds = await kv.zrange('leaderboard:total', 0, limit - 1, { rev: true });
  if (!userIds || userIds.length === 0) return [];
  
  // Fetch detailed data for each user
  const pipeline = kv.pipeline();
  for (const id of userIds) {
    pipeline.hgetall(`user:${id}:data`);
  }
  const results = await pipeline.exec<UserRankData[]>();
  return results.filter(Boolean);
}

export async function getGlobalStats() {
  const totalUsers = await kv.zcard('leaderboard:total');
  
  // To get global tokens, we can sum them up (or maintain a global counter)
  // For simplicity, we just fetch all scores and sum
  const allScores = await kv.zrange('leaderboard:total', 0, -1, { withScores: true });
  let totalTokens = 0;
  // allScores returns [member, score, member, score...] or [{member, score}...] depending on ioredis wrapper.
  // @vercel/kv zrange withScores returns an array of objects: [{ member: '...', score: 100 }]
  for (const item of allScores as any[]) {
     totalTokens += Number(item.score) || 0;
  }
  
  return { totalUsers, totalTokens };
}
