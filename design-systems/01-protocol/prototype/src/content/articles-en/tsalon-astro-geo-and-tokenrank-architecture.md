---
title: "T Salon Engineering Retrospective: Building a Hybrid GEO & Real-Time Community Site with Astro and Vercel"
summary: "How T Salon combines Astro static pre-rendering for SEO/GEO speed with targeted Vercel SSR routes for TokenRank leaderboards, dynamic GitHub README SVG badges, and automated bilingual build gates."
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
coverAlt: T Salon Astro and Vercel hybrid architecture and GEO engineering retrospective
featured: false
draft: false
translationStatus: reviewed
translationOf: tsalon-astro-geo-and-tokenrank-architecture
tldr:
  - "T Salon uses Astro hybrid rendering: articles, topic clusters, the cost calculator, and the error wiki are statically pre-rendered (SSG), while TokenRank dashboards and SVG/PNG badges run on Vercel SSR (`prerender = false`)."
  - "Every build automatically enriches `sitemap-0.xml` with per-route `<lastmod>` and `hreflang` pairs while emitting bilingual `/llms.txt` and `/content-index.json` feeds for AI search engines."
  - "Five automated pre-deploy gates validate bilingual pairing, zero Chinese characters in English HTML, heading punctuation, clean Markdown rendering, and zero broken internal links across 240+ pages."
faq:
  - question: "Why mix static generation and SSR instead of making every route dynamic?"
    answer: "Guides, error troubleshooting pages, and topic hubs benefit from edge-cached static HTML and minimal TTFB, whereas TokenRank leaderboards and live quota radars require fresh state and CDN-cached SSR."
  - question: "How do `/llms.txt` and `/content-index.json` help with GEO?"
    answer: "They give AI crawlers and research agents a clean, low-noise index of tools, guides, and canonical URLs without forcing them to parse navigation chrome."
  - question: "Why generate GitHub README badges as pure strings in SVG instead of headless screenshots?"
    answer: "Zero-dependency string SVG generation executes in milliseconds with minimal cold-start overhead, strict XML escaping against XSS, and clean CDN `s-maxage` caching."
seo:
  title: "T Salon Engineering: Hybrid Astro + Vercel Architecture for GEO"
  description: "A technical look at how T Salon runs static SEO/GEO pages alongside real-time TokenRank dashboards, dynamic SVG badges, and automated bilingual quality gates."
  noindex: false
citations:
  - label: "T Salon TokenRank Leaderboard"
    url: https://www.tsalon.tech/en/tokenrank/
  - label: "T Salon English llms.txt"
    url: https://www.tsalon.tech/en/llms.txt
  - label: "T Salon AI Quota Reset Radar"
    url: https://www.tsalon.tech/en/whenreset/
---

**A developer community platform has to serve two very different workloads at the same time:** evergreen tutorials, calculators, and error wikis that must rank reliably in Google and AI search, alongside real-time community leaderboards and dynamic shareable cards.

Here is how T Salon (`www.tsalon.tech`) structures its `Astro + Vercel` stack and automated build gates to keep both fast and reliable.

## 1. Clear Boundary Between SSG and Targeted SSR

Astro keeps static generation as the default, while routes that depend on live state explicitly opt into server rendering with `export const prerender = false;`:

1. **Static Edge Layer (SSG)**: The homepage, 130+ bilingual articles and event archives, 9 topic hubs (`/en/topics/*`), the [AI Cost Calculator](/en/calculator/), and the [Error Troubleshooting Wiki](/en/errors/).
2. **Targeted Serverless Layer (SSR)**:
   - [TokenRank](/en/tokenrank/) leaderboards and personal dashboards (`/en/tokenrank/user/[id]`);
   - [WhenReset Radar](/en/whenreset/) provider pages that parse live reset event streams with explicit unavailable fallbacks;
   - **Dynamic asset endpoints**: `/tokenrank/og/[id].png` for social previews and zero-dependency `/tokenrank/badge/[id].svg` for GitHub README embeds (`Cache-Control: public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400`).

## 2. Build-Time SEO & GEO Enrichment

To help both traditional crawlers and generative AI engines discover new tools quickly, three artifacts are maintained automatically in the build pipeline:

- **Per-route Sitemap enrichment**: `astro.config.mjs` maintains `lastmodBySlug` for core tools and error guides, while a post-build script injects bidirectional `hreflang` links and excludes `.png`/`.svg` endpoints from the sitemap.
- **Machine-readable AI indexes**: `/llms.txt`, `/en/llms.txt`, and `/content-index.json` expose canonical URLs and concise tool summaries.
- **Page-level JSON-LD**: Calculator, error wiki, and profile routes emit structured `SoftwareApplication`, `FAQPage`, `BreadcrumbList`, and `ProfilePage` schemas.

## 3. Five Automated Gates Before Any Deploy

Once a bilingual site crosses 240 HTML pages, manual QA stops scaling. Every local build enforces five automated checks:

1. `content:validate`: Verifies Markdown frontmatter, cover asset existence, and bilingual `translationOf` / `translationStatus` pairing.
2. `site:locale`: Scans the entire `dist/client/en/` output directory to ensure zero Chinese characters leak into English copy or inline scripts.
3. `site:headings` & `site:markdown`: Catches trailing periods on headings and unclosed raw `**`/`__` markers in rendered HTML.
4. `site:links`: Crawls every generated HTML file to block broken internal links before shipping.
5. `node --test`: Runs unit tests covering cost math, 5-hour and weekly quota calculators, reset radar edge cases, and SVG XML escaping.
