import Redis from "ioredis";
//#region src/lib/kv.ts
var redisUrl = process.env.REDIS_URL || "";
var kv = redisUrl ? new Redis(redisUrl) : null;
async function getOrCreateUploadToken(userId) {
	if (!kv) return "mock-token-" + crypto.randomUUID();
	const existingToken = await kv.get(`user:${userId}:token`);
	if (existingToken) return existingToken;
	const newToken = crypto.randomUUID();
	await kv.set(`user:${userId}:token`, newToken);
	await kv.set(`token:${newToken}:userId`, userId);
	return newToken;
}
async function getUserIdByToken(token) {
	if (!kv) return "mock-user-123";
	return kv.get(`token:${token}:userId`);
}
async function updateTokenUsage(userId, name, image, cursor, claude) {
	if (!kv) return;
	const total = cursor + claude;
	const data = {
		userId,
		name,
		image,
		tokens: {
			cursor,
			claude,
			total
		},
		updatedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
	await kv.set(`user:${userId}:data`, JSON.stringify(data));
	await kv.zadd("leaderboard:total", total, userId);
}
async function getLeaderboard(limit = 100) {
	if (!kv) return [];
	const userIds = await kv.zrevrange("leaderboard:total", 0, limit - 1);
	if (!userIds || userIds.length === 0) return [];
	if (userIds.length > 0) {
		const keys = userIds.map((id) => `user:${id}:data`);
		return (await kv.mget(keys)).filter(Boolean).map((res) => JSON.parse(res));
	}
	return [];
}
async function getGlobalStats() {
	if (!kv) return {
		totalUsers: 0,
		totalTokens: 0
	};
	const totalUsers = await kv.zcard("leaderboard:total");
	const allScores = await kv.zrange("leaderboard:total", 0, -1, "WITHSCORES");
	let totalTokens = 0;
	for (let i = 1; i < allScores.length; i += 2) totalTokens += Number(allScores[i]) || 0;
	return {
		totalUsers,
		totalTokens
	};
}
//#endregion
export { kv as a, getUserIdByToken as i, getLeaderboard as n, updateTokenUsage as o, getOrCreateUploadToken as r, getGlobalStats as t };
