import { C as unescapeHTML, T as createAstro, _ as defineScriptVars, g as addAttribute, h as renderHead, i as renderComponent, m as maybeRenderHead, s as renderSlot, u as renderTemplate, v as createRenderInstruction } from "./server_BYoeFzmQ.mjs";
import { t as createComponent } from "./compiler_T6xVSnf5.mjs";
//#region node_modules/astro/dist/runtime/server/render/script.js
async function renderScript(result, id) {
	const inlined = result.inlinedScripts.get(id);
	let content = "";
	if (inlined != null) {
		if (inlined) content = `<script type="module">${inlined}<\/script>`;
	} else {
		const resolved = await result.resolve(id);
		content = `<script type="module" src="${result.userAssetsBase ? (result.base === "/" ? "" : result.base) + result.userAssetsBase : ""}${resolved}"><\/script>`;
	}
	return createRenderInstruction({
		type: "script",
		id,
		content
	});
}
//#endregion
//#region src/lib/i18n.ts
var localeFromPath = (pathname) => pathname === "/en" || pathname.startsWith("/en/") ? "en" : "zh";
var withoutLocale = (pathname) => {
	if (pathname === "/en" || pathname === "/en/") return "/";
	return pathname.startsWith("/en/") ? pathname.slice(3) : pathname;
};
var localizedPath = (pathname, locale) => {
	const base = withoutLocale(pathname);
	return locale === "en" ? base === "/" ? "/en/" : `/en${base}` : base;
};
//#endregion
//#region src/components/Header.astro
createAstro("https://www.tsalon.tech");
var $$Header = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Header;
	const { locale, alternatePath, hasTranslation = false } = Astro.props;
	const pathname = Astro.url.pathname;
	const route = (path) => localizedPath(path, locale);
	const isActive = (path) => pathname === route(path) || pathname.startsWith(route(path));
	const copy = locale === "zh" ? {
		home: "T Salon 首页",
		nav: "主导航",
		events: "活动与现场",
		articles: "内容与观点",
		about: "关于 T Salon",
		join: "一起做点事情",
		open: "打开导航",
		close: "关闭导航",
		language: "English",
		languageTitle: hasTranslation ? "查看英文版" : "前往英文首页"
	} : {
		home: "T Salon home",
		nav: "Main navigation",
		events: "Events",
		articles: "Stories & Ideas",
		about: "About T Salon",
		join: "Take part",
		open: "Open navigation",
		close: "Close navigation",
		language: "中文",
		languageTitle: hasTranslation ? "View in Chinese" : "Go to the Chinese homepage"
	};
	const languageHref = hasTranslation ? alternatePath : locale === "zh" ? "/en/" : "/";
	return renderTemplate`${maybeRenderHead($$result)}<header class="site-header"><div class="container header-inner"><a class="site-logo"${addAttribute(route("/"), "href")}${addAttribute(copy.home, "aria-label")}><img src="/images/logo-dark.png" alt="T Salon"></a><nav class="desktop-nav"${addAttribute(copy.nav, "aria-label")}><a${addAttribute(route("/events/"), "href")}${addAttribute(isActive("/events/") ? "page" : void 0, "aria-current")}>${copy.events}</a><a${addAttribute(route("/articles/"), "href")}${addAttribute(isActive("/articles/") ? "page" : void 0, "aria-current")}>${copy.articles}</a><a${addAttribute(route("/about/"), "href")}${addAttribute(isActive("/about/") ? "page" : void 0, "aria-current")}>${copy.about}</a><a${addAttribute(route("/tokenrank/"), "href")}${addAttribute(isActive("/tokenrank/") ? "page" : void 0, "aria-current")}>${locale === "zh" ? "Token 排行榜" : "Token Rank"}</a></nav><a class="btn btn-dark header-action"${addAttribute(`${route("/about/")}#join`, "href")}>${copy.join} <span>↗</span></a><a class="language-switch"${addAttribute(languageHref, "href")}${addAttribute(locale === "zh" ? "en" : "zh-Hans", "hreflang")}${addAttribute(locale === "zh" ? "en" : "zh-CN", "lang")}${addAttribute(copy.languageTitle, "title")}${addAttribute(copy.languageTitle, "aria-label")}${addAttribute(locale === "zh" ? "en" : "zh", "data-locale-choice")}>${copy.language}</a><details class="mobile-nav"><summary${addAttribute(copy.open, "aria-label")}${addAttribute(copy.open, "data-open-label")}${addAttribute(copy.close, "data-close-label")}><i></i></summary><nav class="mobile-menu"${addAttribute(copy.nav, "aria-label")}><a${addAttribute(route("/events/"), "href")}>${copy.events} <span>→</span></a><a${addAttribute(route("/articles/"), "href")}>${copy.articles} <span>→</span></a><a${addAttribute(route("/about/"), "href")}>${copy.about} <span>→</span></a><a${addAttribute(route("/tokenrank/"), "href")}>${locale === "zh" ? "Token 排行榜" : "Token Rank"} <span>→</span></a><a class="mobile-menu-action"${addAttribute(`${route("/about/")}#join`, "href")}>${copy.join} <span>↗</span></a><a class="mobile-menu-language"${addAttribute(languageHref, "href")}${addAttribute(locale === "zh" ? "en" : "zh-Hans", "hreflang")}${addAttribute(locale === "zh" ? "en" : "zh-CN", "lang")}${addAttribute(copy.languageTitle, "aria-label")}${addAttribute(locale === "zh" ? "en" : "zh", "data-locale-choice")}>${copy.language} <span>→</span></a></nav></details></div></header>${renderScript($$result, "/Users/black/Documents/T Salon/design-systems/01-protocol/prototype/src/components/Header.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/black/Documents/T Salon/design-systems/01-protocol/prototype/src/components/Header.astro", void 0);
//#endregion
//#region src/components/Footer.astro
createAstro("https://www.tsalon.tech");
var $$Footer = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Footer;
	const { locale } = Astro.props;
	const route = (path) => localizedPath(path, locale);
	const friendLinks = [
		{
			zh: "老司机技术",
			en: "SwiftOldDriver",
			href: "https://github.com/SwiftOldDriver"
		},
		{
			zh: "小红花",
			en: "Xiaohonghua",
			href: "https://xhh.club/"
		},
		{
			zh: "GitWork",
			en: "GitWork",
			href: "https://gitwork.cn/"
		}
	];
	const copy = locale === "zh" ? {
		nav: "站内导航",
		events: "活动与现场",
		articles: "内容与观点",
		history: "社区年鉴",
		about: "关于 T Salon",
		official: "关注公众号",
		participate: "一起做点事情",
		collaborate: "嘉宾与合作",
		friends: "友情链接",
		tagline: ["技术发生在实践里", "社区让经验流动起来"],
		home: "返回 T Salon 首页"
	} : {
		nav: "Explore",
		events: "Events",
		articles: "Stories & Ideas",
		history: "Community Archive",
		about: "About T Salon",
		official: "Follow on WeChat",
		participate: "Do something together",
		collaborate: "Speak or collaborate",
		friends: "Friends of T Salon",
		tagline: ["Technology is made in practice", "Community lets experience travel"],
		home: "T Salon home"
	};
	return renderTemplate`${maybeRenderHead($$result)}<footer class="site-footer"><div class="container"><div class="footer-main"><div class="footer-brand"><a${addAttribute(route("/"), "href")}${addAttribute(copy.home, "aria-label")}><img src="/images/logo-dark.png" alt="T Salon"></a><p>${copy.tagline.map((line) => renderTemplate`<span>${line}</span>`)}</p></div><nav class="footer-nav"${addAttribute(locale === "zh" ? "页脚导航" : "Footer navigation", "aria-label")}><div class="footer-col"><strong>${copy.nav}</strong><a${addAttribute(route("/events/"), "href")}>${copy.events}</a><a${addAttribute(route("/articles/"), "href")}>${copy.articles}</a><a${addAttribute(route("/history/"), "href")}>${copy.history}</a><a${addAttribute(route("/about/"), "href")}>${copy.about}</a></div><div class="footer-col"><strong>${copy.participate}</strong><a${addAttribute(`${route("/about/")}#official`, "href")}>${copy.official}</a><a${addAttribute(`${route("/about/")}#cooperate`, "href")}>${copy.collaborate}</a><a href="https://github.com/Code-T" target="_blank" rel="noopener noreferrer">GitHub</a><a href="https://space.bilibili.com/488340243" target="_blank" rel="noopener noreferrer">bilibili</a></div><div class="footer-col"><strong>${copy.friends}</strong>${friendLinks.map((link) => renderTemplate`<a${addAttribute(link.href, "href")} target="_blank" rel="noopener noreferrer">${locale === "zh" ? link.zh : link.en}</a>`)}</div></nav></div><div class="footer-legal mono"><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">苏ICP备15023694号-3</a></div></div></footer>`;
}, "/Users/black/Documents/T Salon/design-systems/01-protocol/prototype/src/components/Footer.astro", void 0);
//#endregion
//#region node_modules/astro/components/ClientRouter.astro
createAstro("https://www.tsalon.tech");
var $$ClientRouter = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$ClientRouter;
	const { fallback = "animate" } = Astro.props;
	return renderTemplate`<meta name="astro-view-transitions-enabled" content="true"><meta name="astro-view-transitions-fallback"${addAttribute(fallback, "content")}>${renderScript($$result, "/Users/black/Documents/T Salon/design-systems/01-protocol/prototype/node_modules/astro/components/ClientRouter.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/black/Documents/T Salon/design-systems/01-protocol/prototype/node_modules/astro/components/ClientRouter.astro", void 0);
//#endregion
//#region src/layouts/BaseLayout.astro
createAstro("https://www.tsalon.tech");
var $$BaseLayout = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$BaseLayout;
	const { title, description, image = "/icon-512x512.png", noindex = false, jsonLd, locale = localeFromPath(Astro.url.pathname), alternatePath, autoDetectLocale = Astro.url.pathname === "/" } = Astro.props;
	const canonical = new URL(Astro.url.pathname, Astro.site);
	const socialImage = new URL(image, Astro.site);
	const resolvedAlternatePath = alternatePath ?? localizedPath(Astro.url.pathname, locale === "zh" ? "en" : "zh");
	const alternate = resolvedAlternatePath ? new URL(resolvedAlternatePath, Astro.site) : void 0;
	const zhUrl = locale === "zh" ? canonical : alternate;
	const enUrl = locale === "en" ? canonical : alternate;
	return renderTemplate`<html${addAttribute(locale === "zh" ? "zh-CN" : "en", "lang")}${addAttribute(locale, "data-locale")}><head><meta charset="utf-8"><meta name="baidu-site-verification" content="codeva-V09RTo12fc"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" type="image/x-icon" href="/favicon.ico"><link rel="icon" type="image/png" href="/favicon.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><title>${title}</title><meta name="description"${addAttribute(description, "content")}><link rel="canonical"${addAttribute(canonical, "href")}>${alternate && zhUrl && renderTemplate`<link rel="alternate" hreflang="zh-Hans"${addAttribute(zhUrl, "href")}>`}${alternate && enUrl && renderTemplate`<link rel="alternate" hreflang="en"${addAttribute(enUrl, "href")}>`}${alternate && zhUrl && renderTemplate`<link rel="alternate" hreflang="x-default"${addAttribute(zhUrl, "href")}>`}${noindex && renderTemplate`<meta name="robots" content="noindex,nofollow">`}<meta property="og:type" content="website"><meta property="og:title"${addAttribute(title, "content")}><meta property="og:description"${addAttribute(description, "content")}><meta property="og:url"${addAttribute(canonical, "content")}><meta property="og:image"${addAttribute(socialImage, "content")}><meta property="og:locale"${addAttribute(locale === "zh" ? "zh_CN" : "en_US", "content")}><meta property="og:locale:alternate"${addAttribute(locale === "zh" ? "en_US" : "zh_CN", "content")}><meta name="twitter:card" content="summary_large_image">${jsonLd && renderTemplate`<script type="application/ld+json">${unescapeHTML(JSON.stringify(jsonLd))}<\/script>`}${renderComponent($$result, "ClientRouter", $$ClientRouter, {})}${renderHead($$result)}</head><body><a class="skip-link" href="#main-content">${locale === "zh" ? "跳到主要内容" : "Skip to main content"}</a>${renderComponent($$result, "Header", $$Header, {
		"locale": locale,
		"alternatePath": resolvedAlternatePath,
		"hasTranslation": Boolean(alternatePath)
	})}<div id="main-content" tabindex="-1">${renderSlot($$result, $$slots["default"])}</div>${renderComponent($$result, "Footer", $$Footer, { "locale": locale })}<script>(function(){${defineScriptVars({
		autoDetectLocale,
		locale
	})}
      (() => {
        const preferenceKey = 'tsalon-locale';
        document.querySelectorAll('[data-locale-choice]').forEach((link) => {
          link.addEventListener('click', () => localStorage.setItem(preferenceKey, link.dataset.localeChoice));
        });
        if (!autoDetectLocale || locale !== 'zh' || localStorage.getItem(preferenceKey)) return;
        const preferred = (navigator.languages?.[0] || navigator.language || '').toLowerCase();
        if (preferred.startsWith('en')) location.replace('/en/');
      })();
    })();<\/script></body></html>`;
}, "/Users/black/Documents/T Salon/design-systems/01-protocol/prototype/src/layouts/BaseLayout.astro", void 0);
//#endregion
export { renderScript as n, $$BaseLayout as t };
