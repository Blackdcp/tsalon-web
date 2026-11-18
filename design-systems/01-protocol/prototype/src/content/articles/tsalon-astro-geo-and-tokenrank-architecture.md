---
title: T Salon 工程复盘：如何用 Astro + Vercel 搭建兼具 GEO 与实时动态能力的社区技术站
summary: 拆解 T Salon 官网在混合渲染架构下的工程实践：如何用 Astro 静态构建保证 SEO/GEO 极速收录，同时结合 Vercel SSR 动态路由支撑 TokenRank 实时榜单、OG 图片与 GitHub README SVG 徽章，并用自动化门禁守住双语质量。
type: guide
publishedAt: 2026-11-17
updatedAt: 2026-11-17
readingMinutes: 5
author: editorial-team
topics:
  - Engineering
  - AI
  - Open Source
cover: /images/articles/agent-security-runtime-governance.png
coverAlt: T Salon Astro 与 Vercel 混合架构与 GEO 工程复盘
featured: false
draft: false
tldr:
  - T Salon 采用 Astro 混合输出模式：文章、主题集群与报错百科在构建期静态预渲染（SSG），TokenRank 榜单、个人看板与 SVG/PNG 徽章走 Vercel Serverless SSR（`prerender = false`）。
  - 为同时满足传统搜索引擎与大模型检索（GEO），站点在构建期自动生成带完整 `<lastmod>` 与 `hreflang` 的 Sitemap、双语 `/llms.txt` 与结构化 `/content-index.json`。
  - 每次构建前强制运行内容预检、英文路由零中文泄漏校验、标题标点校验与全站死链扫描，从工程机制上消灭跨语言污染与断链。
faq:
  - question: "为什么不全部做成纯静态，也不全部做成 SSR？"
    answer: "文档、报错排查页与主题页追求极致的 TTFB 和稳定的 HTML 结构，最适合静态预渲染；而 TokenRank 排行榜、个人数据看板和实时配额雷达需要读取最新状态，适合按路由开启 SSR 并配合 CDN 缓存头。"
  - question: "`/llms.txt` 和 `content-index.json` 对 GEO 有什么实际作用？"
    answer: "它们为 AI 爬虫和研究型 Agent 提供结构化的站点地图与核心页面摘要，减少模型抓取无关导航 HTML 的噪声，提高工具页与实操指南被准确引用的概率。"
  - question: "动态生成 GitHub README SVG 徽章为什么选择零依赖拼接而不是浏览器截图？"
    answer: "零依赖纯字符串生成 SVG 能在毫秒级完成响应，无需启动无头浏览器，冷启动极低，并配合严格的 XML 转义与 CDN `s-maxage` 缓存头保证高并发可用性。"
seo:
  title: T Salon 工程复盘：Astro + Vercel 混合架构与 GEO 实战
  description: 深度复盘 T Salon 如何基于 Astro、Vercel SSR、自动化 SEO/GEO 校验门禁与零依赖 SVG 徽章系统构建开发者社区技术站。
  noindex: false
citations:
  - label: T Salon TokenRank 排行榜
    url: https://www.tsalon.tech/tokenrank/
  - label: T Salon llms.txt 索引
    url: https://www.tsalon.tech/llms.txt
  - label: T Salon AI 配额重置雷达
    url: https://www.tsalon.tech/whenreset/
---

**一个开发者技术社区网站，同时面对两类截然不同的需求：** 一类是高度静态、需要长期承接 Google/百度与 AI 引擎检索的文章、工具计算器和报错百科；另一类则是需要实时读写状态、响应个人链接与动态卡片的社区榜单。

本文复盘 T Salon（`www.tsalon.tech`）在 `Astro + Vercel` 技术栈上的架构取舍与自动化质量门禁实践。

## 一、SSG + 按需 SSR 混合渲染边界

我们在 Astro 配置中保留静态预渲染为默认行为，只对明确依赖实时数据的路由声明 `export const prerender = false;`：

1. **静态预渲染层（SSG）**：首页、130+ 篇双语技术文章与活动档案、9 大主题集群页（`/topics/*`）、[AI 成本计算器](/calculator/) 与 [报错速查库](/errors/)。构建产物直接托管在 Vercel 边缘节点，确保首字节时间最小化。
2. **Serverless 动态层（SSR）**：
   - [TokenRank 排行榜](/tokenrank/) 与个人数据看板（`/tokenrank/user/[id]`），按请求时间窗口读取汇总指标；
   - [WhenReset 配额雷达](/whenreset/)，实时拉取并解析外部重置事件流，同时在数据不可用时降级展示明确状态提示；
   - **动态资产端点**：用于社交分享的 `/tokenrank/og/[id].png` 与用于嵌入 GitHub README 的零依赖 SVG 端点 `/tokenrank/badge/[id].svg`（设置 `Cache-Control: public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400`）。

## 二、面向搜索引擎与 AI 引擎（GEO）的构建期增强

为了让新增的工具页与排错词条快速被传统搜索引擎与生成式引擎理解，我们在构建管线里固化了三项自动化输出：

- **精确到路由的 Sitemap 注入**：在 `astro.config.mjs` 中为工具落地页、报错词条与主题集群维护 `lastmodBySlug` 映射，在 `postbuild-sitemap` 阶段自动补全双语 `hreflang` 互指关系，并过滤 `.png`、`.svg` 等二进制/动态资产端点，避免污染索引预算。
- **结构化 AI 索引入口**：通过动态路由生成 `/llms.txt`、`/en/llms.txt` 与 `/content-index.json`，直接向爬虫暴露工具能力描述、最新文章列表与规范 URL。
- **页面级 JSON-LD 闭环**：计算器、报错词条与个人看板均内嵌规范的 `SoftwareApplication`、`FAQPage`、`BreadcrumbList` 或 `ProfilePage` 结构化数据。

## 三、用自动化构建门禁消灭“隐性退化”

随着双语页面突破 240 个，人工检查很容易遗漏细节。我们在 `package.json` 的构建与测试链路里设置了 5 道硬性门禁：

1. `content:validate`：校验 Markdown Frontmatter 必填字段、封面图路径真实存在，以及双语文章的 `translationOf` / `translationStatus` 配对关系。
2. `site:locale`：扫描整个 `dist/client/en/` 输出目录，确保英文站点的可见正文与前端内联脚本中**零中文字符泄漏**。
3. `site:headings` 与 `site:markdown`：扫描 240+ 份渲染后的 HTML，拦截标题末尾误带句号及未闭合 `**`/`__` 标记的排版缺陷。
4. `site:links`：遍历全部构建产物的站内链接，在上线前拦截任何 404 断链。
5. `node --test` 核心单测：覆盖成本计算模型、5 小时/每周配额计算器、Reset Radar 数据边界及 SVG 徽章 XML XSS 转义测试。

这套组合拳让我们可以在本地一次性完成重构、校验并确认无误后再推向生产环境，把线上回归风险压到最低。
