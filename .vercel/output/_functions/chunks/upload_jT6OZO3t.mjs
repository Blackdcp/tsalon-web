import { n as __exportAll } from "./rolldown-runtime_Bl3dcgcQ.mjs";
import { t as require_kv } from "./kv_BST5rHsr.mjs";
//#region src/pages/api/rank/upload.ts
var upload_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var import_kv = require_kv();
var POST = async ({ request }) => {
	try {
		const { token, data, device_id, reset } = await request.json();
		if (!token) return new Response(JSON.stringify({
			success: false,
			message: "Missing token"
		}), { status: 400 });
		const actualDeviceId = device_id || "default_device";
		const userId = await (0, import_kv.getUserIdByToken)(token);
		if (!userId) return new Response(JSON.stringify({
			success: false,
			message: "Invalid token"
		}), { status: 401 });
		if (!import_kv.kv) return new Response(JSON.stringify({
			success: false,
			message: "KV Database not configured"
		}), { status: 500 });
		if (reset) {
			const tsKeys = await import_kv.kv.keys(`user:${userId}:timeseries:*`);
			if (tsKeys.length > 0) await import_kv.kv.del(...tsKeys);
			const devKeys = await import_kv.kv.keys(`user:${userId}:device:*`);
			if (devKeys.length > 0) await import_kv.kv.del(...devKeys);
			return new Response(JSON.stringify({
				success: true,
				message: "User data reset"
			}), { status: 200 });
		}
		const rawInfo = await import_kv.kv.get(`user:${userId}:info`);
		const userInfo = rawInfo ? JSON.parse(rawInfo) : null;
		const name = userInfo?.name || "Anonymous Developer";
		const image = userInfo?.image || "/icon-512x512.png";
		const dynamicTokens = {};
		const historyData = data.history || null;
		for (const [key, val] of Object.entries(data)) if (key !== "total" && key !== "history") dynamicTokens[key] = Number(val) || 0;
		await (0, import_kv.updateTokenUsage)(userId, name, image, dynamicTokens, actualDeviceId, historyData);
		return new Response(JSON.stringify({
			success: true,
			message: "Tokens updated"
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		console.error(error);
		return new Response(JSON.stringify({
			success: false,
			message: "Server error"
		}), { status: 500 });
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/rank/upload@_@ts
var page = () => upload_exports;
//#endregion
export { page };
