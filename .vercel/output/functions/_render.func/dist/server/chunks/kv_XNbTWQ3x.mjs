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
async function updateTokenUsage(userId, name, image, tokens, deviceId = "default_device", historyData = null) {
	if (!kv) return;
	const oldDeviceDataStr = await kv.get(`user:${userId}:device:${deviceId}:data`);
	const oldDeviceTokens = {};
	if (oldDeviceDataStr) try {
		const parsed = JSON.parse(oldDeviceDataStr);
		if (parsed.tokens) for (const [k, v] of Object.entries(parsed.tokens)) oldDeviceTokens[k] = Number(v) || 0;
	} catch (e) {}
	tokens["total"] = Object.values(tokens).reduce((acc, val) => acc + val, 0);
	const deviceData = {
		userId,
		name,
		image,
		tokens,
		updatedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
	await kv.set(`user:${userId}:device:${deviceId}:data`, JSON.stringify(deviceData));
	const now = Date.now();
	const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
	const pipe = kv.pipeline();
	let hasTimeseriesEvents = false;
	if (historyData && Object.keys(historyData).length > 0) {
		const keysToFilter = await kv.keys(`user:${userId}:timeseries:*`);
		const toolsInHistory = /* @__PURE__ */ new Set();
		for (const toolsObj of Object.values(historyData)) Object.keys(toolsObj).forEach((t) => toolsInHistory.add(t));
		for (const key of keysToFilter) {
			const filteredEvents = (await kv.lrange(key, 0, -1)).map((str) => typeof str === "string" ? JSON.parse(str) : str).filter((e) => !(toolsInHistory.has(e.tool) && e.deviceId === deviceId));
			await kv.del(key);
			if (filteredEvents.length > 0) {
				const pipeline = kv.pipeline();
				filteredEvents.forEach((e) => pipeline.rpush(key, JSON.stringify(e)));
				pipeline.expire(key, 2678400);
				await pipeline.exec();
			}
		}
		for (const [dateStr, toolsObj] of Object.entries(historyData)) for (const [tool, val] of Object.entries(toolsObj)) {
			if (val <= 0) continue;
			if (tool === "cursor" || tool === "codex" || tool === "codex_proxy") {} else if (tool === "antigravity") {} else if (tool === "claude") {}
		}
	}
	for (const [tool, val] of Object.entries(tokens)) {
		if (tool === "total" || tool === "history") continue;
		const oldVal = oldDeviceTokens[tool] || 0;
		const delta = val - oldVal;
		let model = "unknown";
		let cacheRate = .5;
		if (tool === "cursor" || tool === "codex" || tool === "codex_proxy") {
			model = "gpt-5.6-sol";
			cacheRate = .93;
		} else if (tool === "antigravity") {
			model = "gemini-2.5-pro";
			cacheRate = .1;
		} else if (tool === "claude") {
			model = "claude-3-5-sonnet";
			cacheRate = .8;
		}
		let toolHasHistory = false;
		if (historyData) {
			for (const toolsObj of Object.values(historyData)) if (toolsObj[tool]) {
				toolHasHistory = true;
				break;
			}
		}
		if (toolHasHistory) {
			for (const [dateStr, toolsObj] of Object.entries(historyData)) if (toolsObj[tool] && toolsObj[tool] > 0) {
				const hVal = toolsObj[tool];
				const event = {
					timestamp: new Date(dateStr).getTime(),
					tool,
					model,
					tokens: hVal,
					cacheHit: Math.random() < cacheRate,
					deviceId
				};
				pipe.rpush(`user:${userId}:timeseries:${dateStr}`, JSON.stringify(event));
				pipe.expire(`user:${userId}:timeseries:${dateStr}`, 2678400);
			}
			hasTimeseriesEvents = true;
		} else if (delta > 0 || val > 0 && oldVal === 0) {
			if ((oldVal === 0 && val > 0 || delta > 1e8) && val > 1e3) {
				const days = 30;
				const dailyAvg = Math.floor(val / days);
				for (let i = 0; i < days; i++) {
					const d = /* @__PURE__ */ new Date();
					d.setDate(d.getDate() - i);
					const historyDateStr = d.toISOString().split("T")[0];
					const tokensToLog = i === 0 ? dailyAvg + val % days : dailyAvg;
					const event = {
						timestamp: d.getTime(),
						tool,
						model,
						tokens: tokensToLog,
						cacheHit: Math.random() < cacheRate,
						deviceId
					};
					pipe.rpush(`user:${userId}:timeseries:${historyDateStr}`, JSON.stringify(event));
					pipe.expire(`user:${userId}:timeseries:${historyDateStr}`, 2678400);
				}
				hasTimeseriesEvents = true;
			} else {
				const event = {
					timestamp: now,
					tool,
					model,
					tokens: delta > 0 ? delta : val,
					cacheHit: Math.random() < cacheRate,
					deviceId
				};
				pipe.rpush(`user:${userId}:timeseries:${todayStr}`, JSON.stringify(event));
				pipe.expire(`user:${userId}:timeseries:${todayStr}`, 2678400);
				hasTimeseriesEvents = true;
			}
		}
	}
	if (hasTimeseriesEvents) await pipe.exec();
	const deviceKeys = await kv.keys(`user:${userId}:device:*:data`);
	const aggregatedTokens = {};
	if (deviceKeys.length > 0) {
		const allDeviceData = await kv.mget(deviceKeys);
		for (const dataStr of allDeviceData) if (dataStr) try {
			const parsed = JSON.parse(dataStr);
			if (parsed && parsed.tokens) {
				for (const [key, val] of Object.entries(parsed.tokens)) if (key !== "total") aggregatedTokens[key] = (aggregatedTokens[key] || 0) + (Number(val) || 0);
			}
		} catch (e) {}
	}
	const finalTotal = Object.values(aggregatedTokens).reduce((acc, val) => acc + val, 0);
	aggregatedTokens["total"] = finalTotal;
	const aggregatedData = {
		userId,
		name,
		image,
		tokens: aggregatedTokens,
		updatedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
	await kv.set(`user:${userId}:data`, JSON.stringify(aggregatedData));
	await kv.zadd("leaderboard:total", finalTotal, userId);
}
async function getLeaderboard(limit = 100, time = "all") {
	if (!kv) return [];
	if (time === "all") {
		const userIds = await kv.zrevrange("leaderboard:total", 0, limit - 1);
		if (!userIds || userIds.length === 0) return [];
		const keys = userIds.map((id) => `user:${id}:data`);
		return (await kv.mget(keys)).filter(Boolean).map((res) => JSON.parse(res));
	}
	const userIds = await kv.zrevrange("leaderboard:total", 0, limit > 0 ? limit - 1 : 99);
	if (!userIds || userIds.length === 0) return [];
	let days = 1;
	if (time === "today") days = 1;
	else if (time === "yesterday") days = 2;
	else if (time === "3d") days = 3;
	else if (time === "7d") days = 7;
	else if (time === "30d") days = 30;
	else if (time === "90d") days = 90;
	const datesToFetch = [];
	for (let i = 0; i < days; i++) {
		const d = /* @__PURE__ */ new Date();
		d.setDate(d.getDate() - i);
		datesToFetch.push(d.toISOString().split("T")[0]);
	}
	let targetDates = datesToFetch;
	if (time === "yesterday") targetDates = [datesToFetch[1]];
	const baseDataKeys = userIds.map((id) => `user:${id}:data`);
	const baseDataResults = await kv.mget(baseDataKeys);
	const userMap = {};
	userIds.forEach((id, idx) => {
		if (baseDataResults[idx]) userMap[id] = JSON.parse(baseDataResults[idx]);
	});
	const pipe = kv.pipeline();
	for (const id of userIds) for (const dateStr of targetDates) pipe.lrange(`user:${id}:timeseries:${dateStr}`, 0, -1);
	const tsResults = await pipe.exec();
	const aggregatedList = [];
	let resultIdx = 0;
	for (const id of userIds) {
		const baseData = userMap[id];
		if (!baseData) {
			resultIdx += targetDates.length;
			continue;
		}
		let userTotal = 0;
		const tokens = {};
		for (let i = 0; i < targetDates.length; i++) {
			const [err, events] = tsResults[resultIdx++];
			if (!err && events && events.length > 0) for (const evStr of events) try {
				const ev = JSON.parse(evStr);
				tokens[ev.tool] = (tokens[ev.tool] || 0) + ev.tokens;
				userTotal += ev.tokens;
			} catch (e) {}
		}
		if (userTotal > 0) {
			tokens["total"] = userTotal;
			aggregatedList.push({
				...baseData,
				tokens
			});
		}
	}
	aggregatedList.sort((a, b) => b.tokens.total - a.tokens.total);
	return aggregatedList.slice(0, limit);
}
async function getGlobalStats(leaderboardData = null) {
	if (!kv) return {
		totalUsers: 0,
		totalTokens: 0
	};
	if (leaderboardData) return {
		totalUsers: leaderboardData.length,
		totalTokens: leaderboardData.reduce((acc, user) => acc + (user.tokens.total || 0), 0)
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
async function getUserAnalytics(userId, days = 30) {
	if (!kv) return [];
	const dates = [];
	for (let i = 0; i < days; i++) {
		const d = /* @__PURE__ */ new Date();
		d.setDate(d.getDate() - i);
		dates.push(d.toISOString().split("T")[0]);
	}
	let allEvents = [];
	const pipe = kv.pipeline();
	dates.forEach((dateStr) => {
		pipe.lrange(`user:${userId}:timeseries:${dateStr}`, 0, -1);
	});
	const results = await pipe.exec();
	if (results) results.forEach(([err, res]) => {
		if (!err && Array.isArray(res)) res.forEach((item) => {
			try {
				allEvents.push(JSON.parse(item));
			} catch (e) {}
		});
	});
	return allEvents;
}
//#endregion
export { getUserIdByToken as a, getUserAnalytics as i, getLeaderboard as n, kv as o, getOrCreateUploadToken as r, updateTokenUsage as s, getGlobalStats as t };
