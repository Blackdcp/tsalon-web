import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { T as createAstro, _ as defineScriptVars, g as addAttribute, i as renderComponent, m as maybeRenderHead, u as renderTemplate } from "./server_BYoeFzmQ.mjs";
import { t as createComponent } from "./compiler_T6xVSnf5.mjs";
import { n as renderScript, t as $$BaseLayout } from "./BaseLayout_CEcTJqZU.mjs";
import { i as getUserAnalytics, o as kv } from "./kv_XNbTWQ3x.mjs";
//#region src/pages/tokenrank/user/[id].astro
var _id__exports = /* @__PURE__ */ __exportAll({
	default: () => $$Id,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://www.tsalon.tech");
var $$Id = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Id;
	const { id } = Astro.params;
	const days = Number(Astro.url.searchParams.get("days") || "30");
	const userDataStr = await kv?.get(`user:${id}:data`);
	if (!userDataStr) return Astro.redirect("/tokenrank");
	const userData = JSON.parse(userDataStr);
	const events = await getUserAnalytics(id, days);
	const todayDateStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
	const periodTokens = events.reduce((acc, e) => acc + e.tokens, 0);
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
	const getEventCost = (e) => {
		const p = PRICING[e.model] || PRICING["default"];
		const millions = e.tokens / 1e6;
		return e.cacheHit ? millions * p.cache : millions * (.9 * p.in + .1 * p.out);
	};
	const getEventNoCacheCost = (e) => {
		const p = PRICING[e.model] || PRICING["default"];
		return e.tokens / 1e6 * (.9 * p.in + .1 * p.out);
	};
	let periodCost = 0;
	let periodNoCacheCost = 0;
	events.forEach((e) => {
		periodCost += getEventCost(e);
		periodNoCacheCost += getEventNoCacheCost(e);
	});
	const cacheSavings = periodNoCacheCost - periodCost;
	const cacheHitTokens = events.filter((e) => e.cacheHit).reduce((acc, e) => acc + e.tokens, 0);
	const cacheHitRate = periodTokens > 0 ? (cacheHitTokens / periodTokens * 100).toFixed(1) : "0.0";
	const freshTokens = periodTokens - cacheHitTokens;
	const toolsUsed = new Set(events.map((e) => e.tool)).size;
	const avgTokens = days > 0 ? Math.floor(periodTokens / days) : 0;
	const dailyMap = {};
	events.forEach((e) => {
		const d = new Date(e.timestamp).toISOString().split("T")[0];
		if (!dailyMap[d]) dailyMap[d] = {
			tokens: 0,
			cost: 0,
			cache: 0,
			sessions: Math.floor(Math.random() * 20) + 1,
			codex: 0,
			antigravity: 0
		};
		dailyMap[d].tokens += e.tokens;
		dailyMap[d].cost += getEventCost(e);
		if (e.cacheHit) dailyMap[d].cache += e.tokens;
		if (e.tool === "codex" || e.tool === "codex_proxy") dailyMap[d].codex += e.tokens;
		if (e.tool === "antigravity") dailyMap[d].antigravity += e.tokens;
	});
	let maxDayTokens = 0;
	let maxDayStr = "-";
	for (const [date, data] of Object.entries(dailyMap)) if (data.tokens > maxDayTokens) {
		maxDayTokens = data.tokens;
		maxDayStr = date;
	}
	let activeStreak = 0;
	for (let i = 0; i < days; i++) {
		const d = /* @__PURE__ */ new Date();
		d.setDate(d.getDate() - i);
		const dStr = d.toISOString().split("T")[0];
		if (dailyMap[dStr] && dailyMap[dStr].tokens > 0) activeStreak++;
		else break;
	}
	const activeDaysHistory = Object.keys(dailyMap).length;
	const formatAmountObj = (num) => {
		if (num >= 1e8) return {
			val: (num / 1e8).toFixed(2),
			unit: "亿"
		};
		if (num >= 1e4) return {
			val: (num / 1e4).toFixed(1),
			unit: "万"
		};
		return {
			val: num.toString(),
			unit: ""
		};
	};
	const formatAmountStr = (num) => {
		if (num >= 1e8) return (num / 1e8).toFixed(2) + "亿";
		if (num >= 1e4) return (num / 1e4).toFixed(1) + "万";
		return num.toString();
	};
	const periodTokensObj = formatAmountObj(periodTokens);
	const freshTokensObj = formatAmountObj(freshTokens);
	const lastXDays = [];
	for (let i = days - 1; i >= 0; i--) {
		const d = /* @__PURE__ */ new Date();
		d.setDate(d.getDate() - i);
		lastXDays.push(d.toISOString().split("T")[0]);
	}
	const dailyUsage = lastXDays.map((date) => dailyMap[date]?.tokens || 0);
	const dailyCost = lastXDays.map((date) => dailyMap[date]?.cost || 0);
	const toolBreakdown = {};
	const modelBreakdown = {};
	events.forEach((e) => {
		toolBreakdown[e.tool] = (toolBreakdown[e.tool] || 0) + e.tokens;
		modelBreakdown[e.model] = (modelBreakdown[e.model] || 0) + e.tokens;
	});
	const toolKeys = Object.keys(toolBreakdown).sort((a, b) => toolBreakdown[b] - toolBreakdown[a]);
	const toolValues = toolKeys.map((k) => toolBreakdown[k]);
	const modelKeys = Object.keys(modelBreakdown).sort((a, b) => modelBreakdown[b] - modelBreakdown[a]);
	const modelValues = modelKeys.map((k) => modelBreakdown[k]);
	const chartData = {
		lastXDays: lastXDays.map((d) => days > 90 ? d.substring(0, 7) : d.substring(5)),
		dailyUsage,
		dailyCost
	};
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"title": `${userData.name} 的数据看板 - T Salon`,
		"description": `查看 ${userData.name} 的详细 Token 消耗趋势和 AI 数据看板。`,
		"data-astro-cid-rmjnvcfc": true
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="dashboard-container" data-astro-cid-rmjnvcfc><header class="dashboard-header" data-astro-cid-rmjnvcfc><div class="user-info" data-astro-cid-rmjnvcfc><img${addAttribute(userData.image, "src")}${addAttribute(userData.name, "alt")} class="avatar" data-astro-cid-rmjnvcfc><div data-astro-cid-rmjnvcfc><h1 data-astro-cid-rmjnvcfc>${userData.name}</h1><span class="location" data-astro-cid-rmjnvcfc>🌍 远程协作节点</span></div></div><div class="header-actions" data-astro-cid-rmjnvcfc><a href="/tokenrank" class="back-link" data-astro-cid-rmjnvcfc>Token 排行榜 ↗</a></div></header><div class="tabs" data-astro-cid-rmjnvcfc><a href="?days=1"${addAttribute(days === 1 ? "active" : "", "class")} data-astro-cid-rmjnvcfc>今天</a><a href="?days=3"${addAttribute(days === 3 ? "active" : "", "class")} data-astro-cid-rmjnvcfc>近3天</a><a href="?days=7"${addAttribute(days === 7 ? "active" : "", "class")} data-astro-cid-rmjnvcfc>近7天</a><a href="?days=30"${addAttribute(days === 30 ? "active" : "", "class")} data-astro-cid-rmjnvcfc>近30天</a><a href="?days=90"${addAttribute(days === 90 ? "active" : "", "class")} data-astro-cid-rmjnvcfc>近90天</a><a href="?days=365"${addAttribute(days === 365 ? "active" : "", "class")} data-astro-cid-rmjnvcfc>全部</a><span class="current-date" data-astro-cid-rmjnvcfc>${todayDateStr}</span></div><!-- 8 Cards Grid --><div class="stats-grid" data-astro-cid-rmjnvcfc><div class="stat-card" data-astro-cid-rmjnvcfc><div class="stat-top" data-astro-cid-rmjnvcfc><span class="label" data-astro-cid-rmjnvcfc>${days === 1 ? "当日消耗" : `近${days}天消耗`} ❔</span><span class="trend positive" data-astro-cid-rmjnvcfc>+558%</span></div><div class="value" data-astro-cid-rmjnvcfc>${periodTokensObj.val}<span class="unit" data-astro-cid-rmjnvcfc>${periodTokensObj.unit}</span></div><div class="subtext" data-astro-cid-rmjnvcfc>日均约 1.1倍</div></div><div class="stat-card" data-astro-cid-rmjnvcfc><div class="stat-top" data-astro-cid-rmjnvcfc><span class="label" data-astro-cid-rmjnvcfc>预估成本 ❔</span></div><div class="value" data-astro-cid-rmjnvcfc><span class="unit" data-astro-cid-rmjnvcfc>$</span>${periodCost.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div><div class="subtext" data-astro-cid-rmjnvcfc>缓存节省 $${cacheSavings.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div></div><div class="stat-card" data-astro-cid-rmjnvcfc><div class="stat-top" data-astro-cid-rmjnvcfc><span class="label" data-astro-cid-rmjnvcfc>有效 token ❔</span><span class="trend positive" data-astro-cid-rmjnvcfc>+473%</span></div><div class="value" data-astro-cid-rmjnvcfc>${freshTokensObj.val}<span class="unit" data-astro-cid-rmjnvcfc>${freshTokensObj.unit}</span></div><div class="subtext" data-astro-cid-rmjnvcfc>占 ${periodTokens > 0 ? (freshTokens / periodTokens * 100).toFixed(1) : 0}%</div></div><div class="stat-card" data-astro-cid-rmjnvcfc><div class="stat-top" data-astro-cid-rmjnvcfc><span class="label" data-astro-cid-rmjnvcfc>对话次数 ❔</span><span class="trend positive" data-astro-cid-rmjnvcfc>+67%</span></div><div class="value" data-astro-cid-rmjnvcfc>${activeDaysHistory * 15} <span class="unit" data-astro-cid-rmjnvcfc>次</span></div><div class="subtext" data-astro-cid-rmjnvcfc>次均 888.4万</div></div><div class="stat-card" data-astro-cid-rmjnvcfc><div class="stat-top" data-astro-cid-rmjnvcfc><span class="label" data-astro-cid-rmjnvcfc>使用工具 ❔</span></div><div class="value" data-astro-cid-rmjnvcfc>${toolsUsed} <span class="unit" data-astro-cid-rmjnvcfc>个</span></div><div class="subtext" data-astro-cid-rmjnvcfc>主力 ${toolKeys[0] || "无"}</div></div><div class="stat-card" data-astro-cid-rmjnvcfc><div class="stat-top" data-astro-cid-rmjnvcfc><span class="label" data-astro-cid-rmjnvcfc>AI 耗时 ❔</span><span class="trend positive" data-astro-cid-rmjnvcfc>+785%</span></div><div class="value" data-astro-cid-rmjnvcfc>18.9 <span class="unit" data-astro-cid-rmjnvcfc>小时</span></div><div class="subtext" data-astro-cid-rmjnvcfc>日均 18.9 小时</div></div><div class="stat-card" data-astro-cid-rmjnvcfc><div class="stat-top" data-astro-cid-rmjnvcfc><span class="label" data-astro-cid-rmjnvcfc>缓存命中 ❔</span></div><div class="value" data-astro-cid-rmjnvcfc>${cacheHitRate}<span class="unit" data-astro-cid-rmjnvcfc>%</span></div><div class="subtext" data-astro-cid-rmjnvcfc>缓存读 ${formatAmountStr(cacheHitTokens)}</div></div><div class="stat-card" data-astro-cid-rmjnvcfc><div class="stat-top" data-astro-cid-rmjnvcfc><span class="label" data-astro-cid-rmjnvcfc>连续活跃 ❔</span></div><div class="value" data-astro-cid-rmjnvcfc>${activeStreak} <span class="unit" data-astro-cid-rmjnvcfc>天</span></div><div class="subtext" data-astro-cid-rmjnvcfc>接入以来 45 天</div></div></div><!-- Key Facts Banner --><div class="key-facts-banner" data-astro-cid-rmjnvcfc><div class="fact-col" data-astro-cid-rmjnvcfc><span class="fact-label" data-astro-cid-rmjnvcfc>当日在全史排位</span><span class="fact-value" data-astro-cid-rmjnvcfc>第 14 / 45 个活跃日</span></div><div class="fact-col" data-astro-cid-rmjnvcfc><span class="fact-label" data-astro-cid-rmjnvcfc>单日纪录</span><span class="fact-value" data-astro-cid-rmjnvcfc>${formatAmountStr(maxDayTokens)} · ${maxDayStr}</span></div><div class="fact-col" data-astro-cid-rmjnvcfc><span class="fact-label" data-astro-cid-rmjnvcfc>连续活跃</span><span class="fact-value" data-astro-cid-rmjnvcfc>${activeStreak} 天</span></div><div class="fact-col" data-astro-cid-rmjnvcfc><span class="fact-label" data-astro-cid-rmjnvcfc>接入以来</span><span class="fact-value" data-astro-cid-rmjnvcfc>2026-06-12 起 · 45 个活跃日</span></div><div class="fact-col" data-astro-cid-rmjnvcfc><span class="fact-label" data-astro-cid-rmjnvcfc>近 30 天日均</span><span class="fact-value" data-astro-cid-rmjnvcfc>${formatAmountStr(avgTokens)}</span></div></div><!-- Charts --><div class="charts-row" data-astro-cid-rmjnvcfc><div class="chart-box" data-astro-cid-rmjnvcfc><h3 data-astro-cid-rmjnvcfc>近 ${days} 天每天用量</h3><div id="usageChart" style="height: 250px; width: 100%;" data-astro-cid-rmjnvcfc></div></div><div class="chart-box" data-astro-cid-rmjnvcfc><h3 data-astro-cid-rmjnvcfc>近 ${days} 天每日成本</h3><div id="costChart" style="height: 250px; width: 100%;" data-astro-cid-rmjnvcfc></div></div></div><!-- Progress Bars --><div class="charts-row" data-astro-cid-rmjnvcfc><div class="chart-box" data-astro-cid-rmjnvcfc><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;" data-astro-cid-rmjnvcfc><h3 data-astro-cid-rmjnvcfc>按工具</h3></div><div class="progress-list" data-astro-cid-rmjnvcfc>${toolKeys.map((k, i) => renderTemplate`<div class="progress-item" data-astro-cid-rmjnvcfc><span class="p-label" data-astro-cid-rmjnvcfc>${k === "codex" ? "Codex" : k === "antigravity" ? "Antigravity" : k}</span><div class="p-bar-wrapper" data-astro-cid-rmjnvcfc><div class="p-bar"${addAttribute(`width: ${periodTokens > 0 ? toolValues[i] / periodTokens * 100 : 0}%; background-color: ${i === 0 ? "#2563EB" : "#93C5FD"};`, "style")} data-astro-cid-rmjnvcfc></div></div><div class="p-values" data-astro-cid-rmjnvcfc><span class="p-val-amount" data-astro-cid-rmjnvcfc>${formatAmountStr(toolValues[i])}</span><span class="p-val-pct" data-astro-cid-rmjnvcfc>${(periodTokens > 0 ? toolValues[i] / periodTokens * 100 : 0).toFixed(1)}%</span></div></div>`)}</div></div><div class="chart-box" data-astro-cid-rmjnvcfc><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;" data-astro-cid-rmjnvcfc><h3 data-astro-cid-rmjnvcfc>按模型</h3><span style="font-size:0.75rem; color:var(--text-secondary);" data-astro-cid-rmjnvcfc>Top 8</span></div><div class="progress-list" data-astro-cid-rmjnvcfc>${modelKeys.map((k, i) => renderTemplate`<div class="progress-item" data-astro-cid-rmjnvcfc><span class="p-label" data-astro-cid-rmjnvcfc>${k}</span><div class="p-bar-wrapper" data-astro-cid-rmjnvcfc><div class="p-bar"${addAttribute(`width: ${periodTokens > 0 ? modelValues[i] / periodTokens * 100 : 0}%; background-color: ${i === 0 ? "#2563EB" : "#93C5FD"};`, "style")} data-astro-cid-rmjnvcfc></div></div><div class="p-values" data-astro-cid-rmjnvcfc><span class="p-val-amount" data-astro-cid-rmjnvcfc>${formatAmountStr(modelValues[i])}</span><span class="p-val-pct" data-astro-cid-rmjnvcfc>${(periodTokens > 0 ? modelValues[i] / periodTokens * 100 : 0).toFixed(1)}%</span></div></div>`)}</div></div></div><!-- Token Composition --><div class="chart-box" style="margin-bottom: 1.5rem;" data-astro-cid-rmjnvcfc><h3 data-astro-cid-rmjnvcfc>Token 构成</h3><div class="composition-bar" data-astro-cid-rmjnvcfc><div class="comp-input"${addAttribute(`width: 6.4%;`, "style")} data-astro-cid-rmjnvcfc></div><div class="comp-output"${addAttribute(`width: 0.7%;`, "style")} data-astro-cid-rmjnvcfc></div><div class="comp-cache-read"${addAttribute(`width: 92.8%;`, "style")} data-astro-cid-rmjnvcfc></div></div><div class="comp-legend" data-astro-cid-rmjnvcfc><span data-astro-cid-rmjnvcfc><div class="dot" style="background:#2563EB;" data-astro-cid-rmjnvcfc></div> 输入 6.4%</span><span data-astro-cid-rmjnvcfc><div class="dot" style="background:#93C5FD;" data-astro-cid-rmjnvcfc></div> 输出 0.7%</span><span data-astro-cid-rmjnvcfc><div class="dot" style="background:#E5E7EB;" data-astro-cid-rmjnvcfc></div> 缓存读 92.8%</span><span data-astro-cid-rmjnvcfc><div class="dot" style="background:#D1D5DB;" data-astro-cid-rmjnvcfc></div> 缓存写 0.0%</span></div><div class="subtext" style="margin-top:0.5rem;" data-astro-cid-rmjnvcfc>缓存节省 ≈$${cacheSavings.toLocaleString("en-US", { maximumFractionDigits: 0 })} (按各模型官方 API 价目折算)</div></div><!-- Data Table --><div class="chart-box" data-astro-cid-rmjnvcfc><h3 data-astro-cid-rmjnvcfc>按天明细</h3><div class="table-responsive" data-astro-cid-rmjnvcfc><table class="data-table" data-astro-cid-rmjnvcfc><thead data-astro-cid-rmjnvcfc><tr data-astro-cid-rmjnvcfc><th data-astro-cid-rmjnvcfc>日期</th><th data-astro-cid-rmjnvcfc>Codex</th><th data-astro-cid-rmjnvcfc>Antigravity</th><th data-astro-cid-rmjnvcfc>合计</th><th data-astro-cid-rmjnvcfc>成本</th><th data-astro-cid-rmjnvcfc>会话</th><th data-astro-cid-rmjnvcfc>命中率</th></tr></thead><tbody data-astro-cid-rmjnvcfc>${lastXDays.map((date) => {
		const dData = dailyMap[date];
		if (!dData || dData.tokens === 0) return null;
		return renderTemplate`<tr data-astro-cid-rmjnvcfc><td data-astro-cid-rmjnvcfc>${date}</td><td data-astro-cid-rmjnvcfc>${dData.codex > 0 ? formatAmountStr(dData.codex) : "—"}</td><td data-astro-cid-rmjnvcfc>${dData.antigravity > 0 ? formatAmountStr(dData.antigravity) : "—"}</td><td class="td-total" data-astro-cid-rmjnvcfc>${formatAmountStr(dData.tokens)}</td><td data-astro-cid-rmjnvcfc>$${dData.cost.toFixed(2)}</td><td data-astro-cid-rmjnvcfc>${dData.sessions}</td><td data-astro-cid-rmjnvcfc><div class="hit-rate-cell" data-astro-cid-rmjnvcfc><span data-astro-cid-rmjnvcfc>${(dData.cache / dData.tokens * 100).toFixed(1)}%</span><div class="tiny-bar" data-astro-cid-rmjnvcfc><div class="tiny-fill"${addAttribute(`width: ${dData.cache / dData.tokens * 100}%;`, "style")} data-astro-cid-rmjnvcfc></div></div></div></td></tr>`;
	})}</tbody></table></div></div></div>` })}${renderScript($$result, "/Users/black/Documents/T Salon/design-systems/01-protocol/prototype/src/pages/tokenrank/user/[id].astro?astro&type=script&index=0&lang.ts")}<script>(function(){${defineScriptVars({ chartData })}
  document.addEventListener('DOMContentLoaded', () => {
    // Usage Chart
    const usageChart = echarts.init(document.getElementById('usageChart'));
    usageChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: chartData.lastXDays, axisLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { color: '#6b7280' } },
      yAxis: { type: 'value', splitLine: { show: false }, axisLabel: { color: '#6b7280', formatter: (val) => (val/100000000) > 1 ? (val/100000000).toFixed(1) + '亿' : (val/10000) + '万' } },
      series: [{ data: chartData.dailyUsage, type: 'bar', itemStyle: { color: '#93C5FD', borderRadius: [2,2,0,0] }, barWidth: '40%' }]
    });

    // Cost Chart
    const costChart = echarts.init(document.getElementById('costChart'));
    costChart.setOption({
      tooltip: { trigger: 'axis', formatter: '\${c}' },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: chartData.lastXDays, axisLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { color: '#6b7280' } },
      yAxis: { type: 'value', splitLine: { show: false }, axisLabel: { color: '#6b7280', formatter: '\${value}' } },
      series: [{ data: chartData.dailyCost, type: 'bar', itemStyle: { color: '#93C5FD', borderRadius: [2,2,0,0] }, barWidth: '40%' }]
    });

    window.addEventListener('resize', () => {
      usageChart.resize();
      costChart.resize();
    });
  });
})();<\/script>`;
}, "/Users/black/Documents/T Salon/design-systems/01-protocol/prototype/src/pages/tokenrank/user/[id].astro", void 0);
var $$file = "/Users/black/Documents/T Salon/design-systems/01-protocol/prototype/src/pages/tokenrank/user/[id].astro";
var $$url = "/tokenrank/user/[id]";
//#endregion
//#region \0virtual:astro:page:src/pages/tokenrank/user/[id]@_@astro
var page = () => _id__exports;
//#endregion
export { page };
