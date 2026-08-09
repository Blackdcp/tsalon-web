import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { a as kv, i as getUserIdByToken, o as updateTokenUsage } from "./kv_BX9X-ot-.mjs";
//#region src/pages/api/rank/upload.ts
var upload_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	try {
		const { token, data } = await request.json();
		if (!token) return new Response(JSON.stringify({
			success: false,
			message: "Missing token"
		}), { status: 400 });
		const userId = await getUserIdByToken(token);
		if (!userId) return new Response(JSON.stringify({
			success: false,
			message: "Invalid token"
		}), { status: 401 });
		if (!kv) return new Response(JSON.stringify({
			success: false,
			message: "KV Database not configured"
		}), { status: 500 });
		const rawInfo = await kv.get(`user:${userId}:info`);
		const userInfo = rawInfo ? JSON.parse(rawInfo) : null;
		const name = userInfo?.name || "Anonymous Developer";
		const image = userInfo?.image || "/icon-512x512.png";
		const cursor = Number(data.cursor) || 0;
		const claude = Number(data.claude) || 0;
		await updateTokenUsage(userId, name, image, cursor, claude);
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
