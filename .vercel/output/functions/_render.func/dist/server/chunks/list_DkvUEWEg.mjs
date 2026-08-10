import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { n as getLeaderboard, t as getGlobalStats } from "./kv_XNbTWQ3x.mjs";
//#region src/pages/api/rank/list.ts
var list_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async () => {
	try {
		const leaderboard = await getLeaderboard(100);
		const stats = await getGlobalStats();
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
