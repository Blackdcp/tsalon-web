import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { T as createAstro, g as addAttribute, i as renderComponent, m as maybeRenderHead, u as renderTemplate } from "./server_BYoeFzmQ.mjs";
import { t as createComponent } from "./compiler_T6xVSnf5.mjs";
import { n as renderScript, t as $$BaseLayout } from "./BaseLayout_CEcTJqZU.mjs";
import { n as getSession } from "./server_B2Y7iMCN.mjs";
import { n as getLeaderboard, t as getGlobalStats } from "./kv_XNbTWQ3x.mjs";
//#region src/components/ShareModal.astro
createAstro("https://www.tsalon.tech");
var $$ShareModal = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$ShareModal;
	const { leaderboard, currentUserRank, currentUser } = Astro.props;
	const top10 = leaderboard.slice(0, 10);
	const todayDateStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
	return renderTemplate`${maybeRenderHead($$result)}<div id="share-modal-overlay" class="share-modal-hidden" data-astro-cid-c37q63lr><div class="share-modal-container" data-astro-cid-c37q63lr><!-- The Card to be captured --><div id="share-card" class="share-card" data-astro-cid-c37q63lr><div class="share-card-header" data-astro-cid-c37q63lr><img src="/images/logo-dark.png" alt="T Salon" class="share-logo-primary" crossorigin="anonymous" data-astro-cid-c37q63lr><h2 data-astro-cid-c37q63lr>Token 消耗排行榜</h2><p class="share-subtitle" data-astro-cid-c37q63lr>AI 编程 token 消耗榜 · 北京时间</p><div class="share-tag-pill" data-astro-cid-c37q63lr>总榜·上海·前天</div></div>${currentUser && renderTemplate`<div class="share-current-user" data-astro-cid-c37q63lr><img${addAttribute(currentUser.image, "src")}${addAttribute(currentUser.name, "alt")} class="share-avatar-large" crossorigin="anonymous" data-astro-cid-c37q63lr><div class="share-user-info" data-astro-cid-c37q63lr><div class="share-user-name" data-astro-cid-c37q63lr><strong data-astro-cid-c37q63lr>${currentUser.name}</strong><span class="share-tool-dot" data-astro-cid-c37q63lr>●</span><span class="share-tool-name" data-astro-cid-c37q63lr>${Object.keys(currentUser.tokens).filter((k) => k !== "total")[0] || "Tool"}</span></div><div class="share-user-rank-box" data-astro-cid-c37q63lr><span class="rank-label" data-astro-cid-c37q63lr>我的排名</span><span class="rank-number" data-astro-cid-c37q63lr>#${currentUserRank}</span></div></div><div class="share-user-stats" data-astro-cid-c37q63lr><strong data-astro-cid-c37q63lr>${(currentUser.tokens.total / 1e8).toFixed(2)}</strong> <span class="unit" data-astro-cid-c37q63lr>亿 tokens</span><span class="cost" data-astro-cid-c37q63lr>~$${(currentUser.tokens.total / 1e6 * 3).toFixed(0)}</span></div></div>`}<div class="share-top10" data-astro-cid-c37q63lr><div class="share-list-header" data-astro-cid-c37q63lr><span class="share-list-bar" data-astro-cid-c37q63lr></span> TOP 10 榜单</div><ul class="share-list" data-astro-cid-c37q63lr>${top10.map((user, idx) => renderTemplate`<li data-astro-cid-c37q63lr><div class="share-list-left" data-astro-cid-c37q63lr><span${addAttribute(`share-rank-badge rank-${idx + 1}`, "class")} data-astro-cid-c37q63lr>${idx + 1}</span><img${addAttribute(user.image, "src")}${addAttribute(user.name, "alt")} class="share-avatar-small" crossorigin="anonymous" data-astro-cid-c37q63lr><span class="share-list-name" data-astro-cid-c37q63lr>${user.name}</span></div><div class="share-list-right" data-astro-cid-c37q63lr><strong class="share-list-tokens" data-astro-cid-c37q63lr>${(user.tokens.total / 1e8).toFixed(2)} 亿</strong><span class="share-list-cost" data-astro-cid-c37q63lr>~$${(user.tokens.total / 1e6 * 3).toFixed(0)}</span></div></li>`)}</ul></div><div class="share-footer" data-astro-cid-c37q63lr><div class="share-qr-section" data-astro-cid-c37q63lr><img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://www.tsalon.tech/tokenrank" alt="QR Code" class="share-qr" crossorigin="anonymous" data-astro-cid-c37q63lr><div class="share-qr-text" data-astro-cid-c37q63lr><strong data-astro-cid-c37q63lr>扫码看完整排行榜</strong><p data-astro-cid-c37q63lr>Top 10 之外还有更多排名</p><span class="share-link" data-astro-cid-c37q63lr>www.tsalon.tech</span><p class="share-update-note" data-astro-cid-c37q63lr>数据每 30 分钟更新</p></div></div><div class="share-bottom-branding" data-astro-cid-c37q63lr>T Salon · Token 消耗排行榜 · ${todayDateStr} 生成</div></div></div><!-- Actions --><div class="share-actions" data-astro-cid-c37q63lr><button id="btn-save-image" class="share-action-btn primary" data-astro-cid-c37q63lr>保存图片</button><button id="btn-close-share" class="share-action-btn secondary" data-astro-cid-c37q63lr>关闭</button></div><div class="share-instruction" data-astro-cid-c37q63lr>手机端可长按图片保存或转发好友</div></div></div>${renderScript($$result, "/Users/black/Documents/T Salon/design-systems/01-protocol/prototype/src/components/ShareModal.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/black/Documents/T Salon/design-systems/01-protocol/prototype/src/components/ShareModal.astro", void 0);
//#endregion
//#region src/pages/tokenrank/index.astro
var tokenrank_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://www.tsalon.tech");
var $$Index = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Index;
	const timeFilter = Astro.url.searchParams.get("time") || "30d";
	const modeFilter = Astro.url.searchParams.get("mode") || "withcache";
	let leaderboard = [];
	let stats = {
		totalUsers: 0,
		totalTokens: 0
	};
	try {
		leaderboard = await getLeaderboard(100, timeFilter);
		stats = await getGlobalStats(leaderboard);
	} catch (e) {
		console.error("Failed to fetch leaderboard data:", e);
	}
	let session = null;
	let currentUser = null;
	let currentUserRank = 0;
	try {
		session = await getSession(Astro.request);
		if (session?.user) {
			const userIndex = leaderboard.findIndex((u) => u.name === session.user.name);
			if (userIndex !== -1) {
				currentUser = leaderboard[userIndex];
				currentUserRank = userIndex + 1;
			} else {
				currentUser = {
					name: session.user.name,
					image: session.user.image,
					tokens: { total: 0 }
				};
				currentUserRank = 0;
			}
		}
	} catch (e) {}
	const seoJsonLd = {
		"@context": "https://schema.org",
		"@type": "WebPage",
		name: "T Salon Token 排行榜",
		description: "全网 AI 开发者 Token 消耗风云榜，实时统计各路大神的本地 AI 代码生成量。"
	};
	const PRICING = {
		"gpt-5.6-sol": {
			in: 5,
			out: 30,
			cache: .5
		},
		"gemini-2.5-pro": {
			in: 2,
			out: 12,
			cache: .2
		},
		"claude-3-5-sonnet": {
			in: 2,
			out: 10,
			cache: .2
		},
		"default": {
			in: .5,
			out: 2,
			cache: .075
		}
	};
	const getToolEstimatedCost = (tool, tokens) => {
		let model = "default";
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
		const p = PRICING[model] || PRICING["default"];
		const millions = tokens / 1e6;
		const cacheHitTokens = millions * cacheRate;
		const freshTokens = millions * (1 - cacheRate);
		return cacheHitTokens * p.cache + freshTokens * (.9 * p.in + .1 * p.out);
	};
	const getToolNoCache = (tool, tokens) => {
		let cacheRate = .5;
		if (tool === "cursor" || tool === "codex" || tool === "codex_proxy") cacheRate = .93;
		else if (tool === "antigravity") cacheRate = .1;
		else if (tool === "claude") cacheRate = .8;
		return tokens * (1 - cacheRate);
	};
	const formatDisplayAmount = (num, mode) => {
		if (num === 0) return "暂无消耗";
		if (mode === "cost") return "$" + num.toFixed(2);
		if (num >= 1e8) return (num / 1e8).toFixed(2) + "亿";
		if (num >= 1e4) return (num / 1e4).toFixed(1) + "万";
		return num.toFixed(0);
	};
	const formatAmountStr = (num) => {
		if (num === 0) return "0";
		if (num >= 1e8) return (num / 1e8).toFixed(2) + "亿";
		if (num >= 1e4) return (num / 1e4).toFixed(1) + "万";
		return num.toString();
	};
	let globalTokens = 0;
	let globalCost = 0;
	let globalNoCacheCost = 0;
	let globalCacheHitTokens = 0;
	const toolCounts = {};
	leaderboard.forEach((user) => {
		Object.entries(user.tokens).forEach(([tool, amount]) => {
			if (tool === "total") return;
			toolCounts[tool] = (toolCounts[tool] || 0) + 1;
			const cost = getToolEstimatedCost(tool, amount);
			globalCost += cost;
			let cacheRate = .5;
			if (tool === "cursor" || tool === "codex" || tool === "codex_proxy") cacheRate = .93;
			else if (tool === "antigravity") cacheRate = .1;
			else if (tool === "claude") cacheRate = .8;
			const cacheTokens = amount * cacheRate;
			globalCacheHitTokens += cacheTokens;
			let model = "default";
			if (tool === "cursor" || tool === "codex" || tool === "codex_proxy") model = "gpt-5.6-sol";
			else if (tool === "antigravity") model = "gemini-2.5-pro";
			else if (tool === "claude") model = "claude-3-5-sonnet";
			const p = PRICING[model] || PRICING["default"];
			const noCacheCost = amount / 1e6 * (.9 * p.in + .1 * p.out);
			globalNoCacheCost += noCacheCost;
		});
		globalTokens += user.tokens.total;
	});
	const cacheSavings = globalNoCacheCost - globalCost;
	const globalCacheHitRate = globalTokens > 0 ? (globalCacheHitTokens / globalTokens * 100).toFixed(1) : "0.0";
	const activeToolsCount = Object.keys(toolCounts).length;
	const conversations = Math.floor(globalTokens / 4e3);
	const effectiveTokens = globalTokens - globalCacheHitTokens;
	let topTool = "codex";
	let maxCount = 0;
	Object.entries(toolCounts).forEach(([tool, count]) => {
		if (count > maxCount) {
			maxCount = count;
			topTool = tool;
		}
	});
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"alternatePath": "/tokenrank/",
		"title": "Token 排行榜 — T Salon",
		"description": "全网 AI 开发者 Token 消耗风云榜，实时统计各路大神的本地 AI 代码生成量。",
		"image": "/images/home-community-group.webp",
		"jsonLd": seoJsonLd,
		"data-astro-cid-dtwkktsq": true
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<main class="container page-content" data-astro-cid-dtwkktsq><header class="page-title" style="margin-bottom: 1.5rem; border-bottom: none; padding-bottom: 0;" data-astro-cid-dtwkktsq><div class="page-title-main" data-astro-cid-dtwkktsq><h1 data-astro-cid-dtwkktsq>Token 排行榜</h1><p class="page-subtitle" data-astro-cid-dtwkktsq>开发者本地 AI 编码能耗大比拼</p></div><div class="page-title-side" data-astro-cid-dtwkktsq><span class="mono" data-astro-cid-dtwkktsq>STATS / TOKEN RANK</span></div></header><!-- Bento Grid Dashboard --><div class="bento-grid" data-astro-cid-dtwkktsq><!-- Card 1 --><div class="bento-card" data-astro-cid-dtwkktsq><div class="bc-header" data-astro-cid-dtwkktsq><span class="bc-title" data-astro-cid-dtwkktsq>${timeFilter === "all" ? "历史" : `近${timeFilter.replace("d", "天")}`}消耗 (Top 100) <span class="help-icon" data-astro-cid-dtwkktsq>?</span></span>${timeFilter !== "today" && renderTemplate`<span class="bc-trend positive" data-astro-cid-dtwkktsq>+558%</span>`}</div><div class="bc-value" data-astro-cid-dtwkktsq>${formatDisplayAmount(globalTokens, modeFilter).replace("亿", "").replace("万", "")}${formatDisplayAmount(globalTokens, modeFilter).includes("亿") ? renderTemplate`<span class="bc-unit" data-astro-cid-dtwkktsq>亿</span>` : formatDisplayAmount(globalTokens, modeFilter).includes("万") ? renderTemplate`<span class="bc-unit" data-astro-cid-dtwkktsq>万</span>` : ""}</div><div class="bc-subtext" data-astro-cid-dtwkktsq>日均约 ${(globalTokens / 1e8 / 30).toFixed(1)} 亿</div></div><!-- Card 2 --><div class="bento-card" data-astro-cid-dtwkktsq><div class="bc-header" data-astro-cid-dtwkktsq><span class="bc-title" data-astro-cid-dtwkktsq>预估成本 <span class="help-icon" data-astro-cid-dtwkktsq>?</span></span></div><div class="bc-value" data-astro-cid-dtwkktsq><span class="bc-unit-prefix" data-astro-cid-dtwkktsq>$</span>${globalCost.toLocaleString(void 0, { maximumFractionDigits: 0 })}</div><div class="bc-subtext" data-astro-cid-dtwkktsq>缓存节省 $${cacheSavings.toLocaleString(void 0, { maximumFractionDigits: 0 })}</div></div><!-- Card 3 --><div class="bento-card" data-astro-cid-dtwkktsq><div class="bc-header" data-astro-cid-dtwkktsq><span class="bc-title" data-astro-cid-dtwkktsq>有效 token <span class="help-icon" data-astro-cid-dtwkktsq>?</span></span><span class="bc-trend positive" data-astro-cid-dtwkktsq>+473%</span></div><div class="bc-value" data-astro-cid-dtwkktsq>${(effectiveTokens / 1e8).toFixed(2)} <span class="bc-unit" data-astro-cid-dtwkktsq>亿</span></div><div class="bc-subtext" data-astro-cid-dtwkktsq>占 ${(globalTokens > 0 ? effectiveTokens / globalTokens * 100 : 0).toFixed(1)}%</div></div><!-- Card 4 --><div class="bento-card" data-astro-cid-dtwkktsq><div class="bc-header" data-astro-cid-dtwkktsq><span class="bc-title" data-astro-cid-dtwkktsq>对话次数 <span class="help-icon" data-astro-cid-dtwkktsq>?</span></span><span class="bc-trend positive" data-astro-cid-dtwkktsq>+67%</span></div><div class="bc-value" data-astro-cid-dtwkktsq>${conversations.toLocaleString()} <span class="bc-unit" data-astro-cid-dtwkktsq>次</span></div><div class="bc-subtext" data-astro-cid-dtwkktsq>次均 4,000 tokens</div></div><!-- Card 5 --><div class="bento-card" data-astro-cid-dtwkktsq><div class="bc-header" data-astro-cid-dtwkktsq><span class="bc-title" data-astro-cid-dtwkktsq>使用工具 <span class="help-icon" data-astro-cid-dtwkktsq>?</span></span></div><div class="bc-value" data-astro-cid-dtwkktsq>${activeToolsCount} <span class="bc-unit" data-astro-cid-dtwkktsq>个</span></div><div class="bc-subtext" data-astro-cid-dtwkktsq>主力 ${topTool}</div></div><!-- Card 6 --><div class="bento-card" data-astro-cid-dtwkktsq><div class="bc-header" data-astro-cid-dtwkktsq><span class="bc-title" data-astro-cid-dtwkktsq>AI 耗时 <span class="help-icon" data-astro-cid-dtwkktsq>?</span></span><span class="bc-trend positive" data-astro-cid-dtwkktsq>+785%</span></div><div class="bc-value" data-astro-cid-dtwkktsq>${(globalTokens / 1e7).toFixed(1)} <span class="bc-unit" data-astro-cid-dtwkktsq>小时</span></div><div class="bc-subtext" data-astro-cid-dtwkktsq>日均 ${(globalTokens / 1e7 / 30).toFixed(1)} 小时</div></div><!-- Card 7 --><div class="bento-card" data-astro-cid-dtwkktsq><div class="bc-header" data-astro-cid-dtwkktsq><span class="bc-title" data-astro-cid-dtwkktsq>缓存命中 <span class="help-icon" data-astro-cid-dtwkktsq>?</span></span></div><div class="bc-value" data-astro-cid-dtwkktsq>${globalCacheHitRate} <span class="bc-unit" data-astro-cid-dtwkktsq>%</span></div><div class="bc-subtext" data-astro-cid-dtwkktsq>缓存读 ${formatAmountStr(globalCacheHitTokens)}</div></div><!-- Card 8 --><div class="bento-card" data-astro-cid-dtwkktsq><div class="bc-header" data-astro-cid-dtwkktsq><span class="bc-title" data-astro-cid-dtwkktsq>连续活跃 <span class="help-icon" data-astro-cid-dtwkktsq>?</span></span></div><div class="bc-value" data-astro-cid-dtwkktsq>${stats.totalUsers} <span class="bc-unit" data-astro-cid-dtwkktsq>人</span></div><div class="bc-subtext" data-astro-cid-dtwkktsq>接入以来 45 天</div></div></div><!-- Time Filters moved below the Bento Grid --><div class="filter-panel-premium" data-astro-cid-dtwkktsq><div class="time-filter-pills" data-astro-cid-dtwkktsq><a${addAttribute(`?time=today&mode=${modeFilter}`, "href")}${addAttribute(`pill-item ${timeFilter === "today" ? "active" : ""}`, "class")} data-astro-cid-dtwkktsq>今天</a><a${addAttribute(`?time=yesterday&mode=${modeFilter}`, "href")}${addAttribute(`pill-item ${timeFilter === "yesterday" ? "active" : ""}`, "class")} data-astro-cid-dtwkktsq>昨天</a><a${addAttribute(`?time=3d&mode=${modeFilter}`, "href")}${addAttribute(`pill-item ${timeFilter === "3d" ? "active" : ""}`, "class")} data-astro-cid-dtwkktsq>近3天</a><a${addAttribute(`?time=7d&mode=${modeFilter}`, "href")}${addAttribute(`pill-item ${timeFilter === "7d" ? "active" : ""}`, "class")} data-astro-cid-dtwkktsq>近7天</a><a${addAttribute(`?time=30d&mode=${modeFilter}`, "href")}${addAttribute(`pill-item ${timeFilter === "30d" ? "active" : ""}`, "class")} data-astro-cid-dtwkktsq>近30天</a><a${addAttribute(`?time=90d&mode=${modeFilter}`, "href")}${addAttribute(`pill-item ${timeFilter === "90d" ? "active" : ""}`, "class")} data-astro-cid-dtwkktsq>近90天</a><a${addAttribute(`?time=all&mode=${modeFilter}`, "href")}${addAttribute(`pill-item ${timeFilter === "all" ? "active" : ""}`, "class")} data-astro-cid-dtwkktsq>全部</a></div><div class="date-display" data-astro-cid-dtwkktsq>${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}</div></div><!-- Table Headers (Desktop Only) --><div class="lb-header-row" data-astro-cid-dtwkktsq><div class="lb-h-left" data-astro-cid-dtwkktsq><div class="lb-h-rank" data-astro-cid-dtwkktsq>排名</div><div class="lb-h-name" data-astro-cid-dtwkktsq>T友</div><div class="lb-h-details" data-astro-cid-dtwkktsq>消耗详情 (多端工具)</div></div><div class="lb-h-right" data-astro-cid-dtwkktsq>总 ${modeFilter === "cost" ? "花费" : "Tokens"}</div></div><div class="leaderboard-list-container" data-astro-cid-dtwkktsq><!-- Current User Section (Integrated Highlight) -->${currentUser ? renderTemplate`<div class="list-row list-row-highlight" data-astro-cid-dtwkktsq><div class="lb-card-left" data-astro-cid-dtwkktsq><div class="lb-rank" data-astro-cid-dtwkktsq><div class="rank-text highlight" data-astro-cid-dtwkktsq>${currentUserRank > 0 ? `#${currentUserRank}` : "-"}</div></div><div class="lb-name-col" data-astro-cid-dtwkktsq><div class="lb-avatar-wrapper" data-astro-cid-dtwkktsq><img${addAttribute(currentUser.image, "src")}${addAttribute(currentUser.name, "alt")} class="lb-avatar" crossorigin="anonymous" data-astro-cid-dtwkktsq></div><div class="lb-name-text" data-astro-cid-dtwkktsq><strong data-astro-cid-dtwkktsq>${currentUser.name}</strong> <span class="tag-me" data-astro-cid-dtwkktsq>我</span></div></div><div class="lb-details-col" data-astro-cid-dtwkktsq><span class="user-highlight-desc" data-astro-cid-dtwkktsq>感谢您的数据贡献</span></div></div><div class="lb-card-right" data-astro-cid-dtwkktsq><div class="lb-totals" style="display: flex; align-items: center; gap: 1rem; justify-content: flex-end; width: 100%;" data-astro-cid-dtwkktsq><div class="lb-total-tokens" data-astro-cid-dtwkktsq>${formatDisplayAmount(currentUser.tokens.total || 0, modeFilter)}</div><button class="btn-share-mini" onclick="openShareModal()" data-astro-cid-dtwkktsq>分享</button></div></div></div>` : renderTemplate`<div class="list-row list-row-onboard" data-astro-cid-dtwkktsq><div class="lb-card-left" data-astro-cid-dtwkktsq><div class="lb-rank" data-astro-cid-dtwkktsq><div class="rank-text normal" data-astro-cid-dtwkktsq>-</div></div><div class="lb-name-col" data-astro-cid-dtwkktsq><div class="lb-name-text" data-astro-cid-dtwkktsq><strong data-astro-cid-dtwkktsq>尚未登榜</strong></div></div><div class="lb-details-col" data-astro-cid-dtwkktsq><span class="user-highlight-desc" data-astro-cid-dtwkktsq>将 GitHub 账号与本地环境绑定，运行专属提取脚本即可快速上榜。</span></div></div><div class="lb-card-right" data-astro-cid-dtwkktsq><a href="/tokenrank/connect/" class="btn-onboard-mini" data-astro-cid-dtwkktsq>绑定 GitHub 上榜 ↗</a></div></div>`}<!-- Main Leaderboard -->${leaderboard.length === 0 ? renderTemplate`<div class="content-section" style="margin-top: 1rem;" data-astro-cid-dtwkktsq><p data-astro-cid-dtwkktsq>该时间段内暂无数据，快去抢首发吧！</p></div>` : leaderboard.map((user, idx) => {
		let userTotalEstimatedCost = 0;
		let userTotalDisplay = 0;
		const toolsBreakdown = Object.entries(user.tokens).filter(([k]) => k !== "total").map(([tool, amount]) => {
			const cost = getToolEstimatedCost(tool, amount);
			const noCacheTokens = getToolNoCache(tool, amount);
			userTotalEstimatedCost += cost;
			let displayAmount = amount;
			if (modeFilter === "nocache") displayAmount = noCacheTokens;
			else if (modeFilter === "cost") displayAmount = cost;
			userTotalDisplay += displayAmount;
			return {
				tool,
				amount: displayAmount
			};
		});
		return renderTemplate`<div class="list-row"${addAttribute(`window.location.href='/tokenrank/user/${user.userId}'`, "onclick")} data-astro-cid-dtwkktsq><div class="lb-card-left" data-astro-cid-dtwkktsq><div class="lb-rank" data-astro-cid-dtwkktsq>${idx === 0 ? renderTemplate`<div class="rank-text rank-1" data-astro-cid-dtwkktsq>#1</div>` : idx === 1 ? renderTemplate`<div class="rank-text rank-2" data-astro-cid-dtwkktsq>#2</div>` : idx === 2 ? renderTemplate`<div class="rank-text rank-3" data-astro-cid-dtwkktsq>#3</div>` : renderTemplate`<div class="rank-text normal" data-astro-cid-dtwkktsq>${idx + 1}</div>`}</div><div class="lb-name-col" data-astro-cid-dtwkktsq><div class="lb-avatar-wrapper" data-astro-cid-dtwkktsq><img${addAttribute(user.image, "src")}${addAttribute(user.name, "alt")} class="lb-avatar" crossorigin="anonymous" data-astro-cid-dtwkktsq></div><div class="lb-name-text" data-astro-cid-dtwkktsq><strong data-astro-cid-dtwkktsq>${user.name}</strong></div></div><div class="lb-details-col" data-astro-cid-dtwkktsq>${toolsBreakdown.map(({ tool, amount }) => {
			const toolName = tool.charAt(0).toUpperCase() + tool.slice(1);
			let tagClass = "tag-default";
			const t = tool.toLowerCase();
			if (t.includes("codex")) tagClass = "tag-codex";
			else if (t.includes("antigravity")) tagClass = "tag-antigravity";
			else if (t.includes("cherry")) tagClass = "tag-cherry";
			else if (t.includes("claude")) tagClass = "tag-claude";
			return renderTemplate`<span${addAttribute(`tool-tag ${tagClass}`, "class")} data-astro-cid-dtwkktsq>${toolName} ${formatDisplayAmount(amount, modeFilter)}</span>`;
		})}</div></div><div class="lb-card-right" data-astro-cid-dtwkktsq><div class="lb-totals" data-astro-cid-dtwkktsq><div class="lb-total-tokens" data-astro-cid-dtwkktsq>${formatDisplayAmount(userTotalDisplay, modeFilter)}</div>${modeFilter !== "cost" && renderTemplate`<div class="lb-total-cost" data-astro-cid-dtwkktsq>≈$${userTotalEstimatedCost.toFixed(0)}</div>`}</div></div></div>`;
	})}</div><!-- Floating Onboarding Widget (Bottom Pill) --><a href="/tokenrank/connect/" class="floating-pill-widget" data-astro-cid-dtwkktsq><span class="fp-icon" data-astro-cid-dtwkktsq>🚀</span><span class="fp-text" data-astro-cid-dtwkktsq>尚未登榜？</span><span class="fp-cta" data-astro-cid-dtwkktsq>立即接入统计 &rarr;</span></a></main>${renderComponent($$result, "ShareModal", $$ShareModal, {
		"leaderboard": leaderboard,
		"currentUser": currentUser,
		"currentUserRank": currentUserRank,
		"data-astro-cid-dtwkktsq": true
	})}` })}`;
}, "/Users/black/Documents/T Salon/design-systems/01-protocol/prototype/src/pages/tokenrank/index.astro", void 0);
var $$file = "/Users/black/Documents/T Salon/design-systems/01-protocol/prototype/src/pages/tokenrank/index.astro";
var $$url = "/tokenrank";
//#endregion
//#region \0virtual:astro:page:src/pages/tokenrank/index@_@astro
var page = () => tokenrank_exports;
//#endregion
export { page };
