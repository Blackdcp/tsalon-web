import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { T as createAstro, g as addAttribute, i as renderComponent, m as maybeRenderHead, u as renderTemplate } from "./server_BYoeFzmQ.mjs";
import { t as createComponent } from "./compiler_T6xVSnf5.mjs";
import { n as renderScript, t as $$BaseLayout } from "./BaseLayout_B_vOzTTr.mjs";
import { n as getSession } from "./server_CXM1A82Q.mjs";
import { a as kv, r as getOrCreateUploadToken } from "./kv_BX9X-ot-.mjs";
//#region src/pages/tokenrank/connect.astro
var connect_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Connect,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://www.tsalon.tech");
var $$Connect = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Connect;
	const session = await getSession(Astro.request);
	let uploadToken = null;
	if (session?.user?.id) {
		uploadToken = await getOrCreateUploadToken(session.user.id);
		const name = session.user?.name || "Anonymous";
		const image = session.user?.image || "/icon-512x512.png";
		if (kv) await kv.set(`user:${session.user.id}:info`, JSON.stringify({
			name,
			image
		}));
	}
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {
		"alternatePath": "/tokenrank/connect/",
		"title": "生成专属接入命令 — T Salon",
		"description": "绑定 GitHub，生成你的专属 Token 提取命令，加入排行榜。",
		"image": "/images/home-community-group.webp"
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<main><header class="container page-title"><div class="page-title-main"><h1>如何上榜</h1><p class="lead">绑定账号并生成接入命令</p></div><div class="page-title-side"><a class="btn btn-outline" href="/tokenrank/">← 返回排行榜</a></div></header><section class="container content-container"><div class="event-main"><div class="content-section" style="max-width: 600px; margin: 0 auto; text-align: center; padding: 3rem 1rem; border: 1px solid var(--color-border); border-radius: 8px;">${!session ? renderTemplate`<div><p style="margin-bottom: 2rem;">上榜命令与你的 GitHub 账号绑定，需登录后才能查看。</p><button id="login" class="btn btn-dark btn-block" style="font-size: 1.2rem; padding: 1rem;"><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem; vertical-align: middle;"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>使用 GitHub 登录</button></div>` : renderTemplate`<div><img${addAttribute(session.user?.image, "src")}${addAttribute(session.user?.name, "alt")} style="width: 64px; height: 64px; border-radius: 50%; margin-bottom: 1rem;"><h3>已登录为 ${session.user?.name}</h3><p style="margin-bottom: 2rem; color: var(--color-gray);">这是你的专属接入命令，请勿泄露给他人。</p><div style="background: var(--color-bg); border: 1px solid var(--color-border); padding: 1.5rem; border-radius: 8px; text-align: left; overflow-x: auto;"><code style="word-break: break-all; color: var(--color-primary); font-family: monospace;">bash -c "$(curl -fsSL https://tsalon.tech/scripts/token-agent.sh)" -- --token="${uploadToken}"</code></div><p style="margin-top: 1.5rem; font-size: 0.9rem;">在 Mac 或 Linux 的终端 (Terminal) 中粘贴并运行此命令。<br>完成后刷新 <a href="/tokenrank/" style="color: var(--color-primary); text-decoration: underline;">排行榜页面</a> 即可看到数据。</p><button id="logout" class="btn btn-outline" style="margin-top: 2rem;">退出登录</button></div>`}</div></div></section></main>` })}${renderScript($$result, "/Users/black/Documents/T Salon/design-systems/01-protocol/prototype/src/pages/tokenrank/connect.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/black/Documents/T Salon/design-systems/01-protocol/prototype/src/pages/tokenrank/connect.astro", void 0);
var $$file = "/Users/black/Documents/T Salon/design-systems/01-protocol/prototype/src/pages/tokenrank/connect.astro";
var $$url = "/tokenrank/connect";
//#endregion
//#region \0virtual:astro:page:src/pages/tokenrank/connect@_@astro
var page = () => connect_exports;
//#endregion
export { page };
