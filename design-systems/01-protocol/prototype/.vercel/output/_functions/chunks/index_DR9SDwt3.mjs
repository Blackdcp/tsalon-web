import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { g as addAttribute, i as renderComponent, m as maybeRenderHead, u as renderTemplate } from "./server_BYoeFzmQ.mjs";
import { t as createComponent } from "./compiler_T6xVSnf5.mjs";
import { t as $$BaseLayout } from "./BaseLayout_B_vOzTTr.mjs";
import { n as getLeaderboard, t as getGlobalStats } from "./kv_BX9X-ot-.mjs";
//#region src/pages/tokenrank/index.astro
var tokenrank_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Index = createComponent(async ($$result, $$props, $$slots) => {
	let leaderboard = [];
	let stats = {
		totalUsers: 0,
		totalTokens: 0
	};
	try {
		leaderboard = await getLeaderboard(100);
		stats = await getGlobalStats();
	} catch (e) {
		console.error("Failed to fetch leaderboard data:", e);
	}
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"alternatePath": "/tokenrank/",
		"title": "Token 排行榜 — T Salon",
		"description": "全网 AI 开发者 Token 消耗风云榜，实时统计各路大神的本地 AI 代码生成量。",
		"image": "/images/home-community-group.webp",
		"jsonLd": {
			"@context": "https://schema.org",
			"@type": "WebPage",
			name: "T Salon Token 排行榜",
			description: "全网 AI 开发者 Token 消耗风云榜，实时统计各路大神的本地 AI 代码生成量。"
		},
		"data-astro-cid-dtwkktsq": true
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<main data-astro-cid-dtwkktsq><header class="container page-title" data-astro-cid-dtwkktsq><div class="page-title-main" data-astro-cid-dtwkktsq><div class="event-page-status is-open" data-astro-cid-dtwkktsq><span aria-hidden="true" data-astro-cid-dtwkktsq>●</span>活跃中</div><h1 data-astro-cid-dtwkktsq>Token 排行榜</h1><p class="lead" data-astro-cid-dtwkktsq>开发者本地 AI 编码能耗大比拼</p></div><div class="page-title-side" data-astro-cid-dtwkktsq><span class="mono" data-astro-cid-dtwkktsq>STATS / TOKEN RANK</span></div><div class="page-title-main event-quickfacts" data-astro-cid-dtwkktsq><div class="quickfact" data-astro-cid-dtwkktsq><span class="mono" data-astro-cid-dtwkktsq>参与总人数</span><strong data-astro-cid-dtwkktsq>${stats.totalUsers} 人</strong></div><div class="quickfact" data-astro-cid-dtwkktsq><span class="mono" data-astro-cid-dtwkktsq>全员总消耗</span><strong data-astro-cid-dtwkktsq>${(stats.totalTokens / 1e8).toFixed(2)} 亿 Tokens</strong></div><div class="quickfact" data-astro-cid-dtwkktsq><span class="mono" data-astro-cid-dtwkktsq>预计总花费</span><strong data-astro-cid-dtwkktsq>≈ $${(stats.totalTokens / 1e6 * 3).toFixed(0)}</strong></div></div></header><div class="container content-container" data-astro-cid-dtwkktsq><aside class="registration-panel tokenrank-sidebar" data-astro-cid-dtwkktsq><h3 data-astro-cid-dtwkktsq>如何上榜？</h3><p data-astro-cid-dtwkktsq>上榜需要将你的 GitHub 账号与本地环境绑定，运行专属提取脚本。</p><a class="btn btn-blue btn-block" href="/tokenrank/connect/" data-astro-cid-dtwkktsq>生成专属接入命令 <span data-astro-cid-dtwkktsq>↗</span></a><div class="tokenrank-note" style="margin-top: 2rem;" data-astro-cid-dtwkktsq><h4 data-astro-cid-dtwkktsq>支持统计的工具</h4><ul data-astro-cid-dtwkktsq><li data-astro-cid-dtwkktsq>Cursor (解析 state.vscdb)</li><li data-astro-cid-dtwkktsq>Claude Code (解析本地配置)</li></ul><p style="font-size: 0.8rem; margin-top: 1rem; color: var(--color-gray);" data-astro-cid-dtwkktsq>*我们致力于保护隐私，提取脚本开源且仅计算使用量，绝不上报代码内容。</p></div></aside><div class="event-main" data-astro-cid-dtwkktsq>${leaderboard.length === 0 ? renderTemplate`<div class="content-section" data-astro-cid-dtwkktsq><p data-astro-cid-dtwkktsq>暂时还没有人上榜，快去抢首发吧！</p></div>` : renderTemplate`<table class="tokenrank-table" data-astro-cid-dtwkktsq><thead data-astro-cid-dtwkktsq><tr data-astro-cid-dtwkktsq><th data-astro-cid-dtwkktsq>排名</th><th data-astro-cid-dtwkktsq>开发者</th><th data-astro-cid-dtwkktsq>消耗详情 (Cursor/Claude)</th><th data-astro-cid-dtwkktsq>总 Tokens</th></tr></thead><tbody data-astro-cid-dtwkktsq>${leaderboard.map((user, idx) => renderTemplate`<tr data-astro-cid-dtwkktsq><td class="rank-num" data-astro-cid-dtwkktsq>${idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}</td><td data-astro-cid-dtwkktsq><div class="rank-user" data-astro-cid-dtwkktsq><img${addAttribute(user.image, "src")}${addAttribute(user.name, "alt")} class="rank-avatar" data-astro-cid-dtwkktsq><strong data-astro-cid-dtwkktsq>${user.name}</strong></div></td><td class="rank-details" data-astro-cid-dtwkktsq><span class="badge cursor" data-astro-cid-dtwkktsq>Cursor ${(user.tokens.cursor / 1e4).toFixed(0)}w</span><span class="badge claude" data-astro-cid-dtwkktsq>Claude ${(user.tokens.claude / 1e4).toFixed(0)}w</span></td><td class="rank-total" data-astro-cid-dtwkktsq><strong data-astro-cid-dtwkktsq>${(user.tokens.total / 1e8).toFixed(2)} 亿</strong></td></tr>`)}</tbody></table>`}</div></div></main>` })}`;
}, "/Users/black/Documents/T Salon/design-systems/01-protocol/prototype/src/pages/tokenrank/index.astro", void 0);
var $$file = "/Users/black/Documents/T Salon/design-systems/01-protocol/prototype/src/pages/tokenrank/index.astro";
var $$url = "/tokenrank";
//#endregion
//#region \0virtual:astro:page:src/pages/tokenrank/index@_@astro
var page = () => tokenrank_exports;
//#endregion
export { page };
