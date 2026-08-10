import { n as __exportAll } from "./rolldown-runtime_Bl3dcgcQ.mjs";
import { t as require_kv } from "./kv_BST5rHsr.mjs";
//#region src/pages/api/rank/list.ts
var list_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var import_kv = require_kv();
var GET = async () => {
	try {
		const leaderboard = await (0, import_kv.getLeaderboard)(100);
		const stats = await (0, import_kv.getGlobalStats)();
		return new Response(JSON.stringify({
			success: true,
			data: {
				leaderboard,
				stats
			}
		}), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=60, s-maxage=60"
			}
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
//#region \0virtual:astro:page:src/pages/api/rank/list@_@ts
var page = () => list_exports;
//#endregion
export { page };
