import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import auth from 'auth-astro';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

// Build a slug -> date map from content frontmatter and data files so the
// sitemap emits accurate <lastmod> values across all indexable routes.
const contentRoot = fileURLToPath(new URL('./src/content/', import.meta.url));
const dataRoot = fileURLToPath(new URL('./src/data/', import.meta.url));

const readFrontmatterDate = (file) => {
  try {
    const raw = readFileSync(file, 'utf8');
    const match = /^updatedAt:\s*['"]?([^\n'"]+?)['"]?\s*$/m.exec(raw)
      ?? /^(?:publishedAt|startDate):\s*['"]?([^\n'"]+?)['"]?\s*$/m.exec(raw);
    const value = match ? new Date(match[1]) : undefined;
    return value && !Number.isNaN(value.getTime()) ? value : undefined;
  } catch {
    return undefined;
  }
};

const lastmodBySlug = new Map();
let latestZhArticleDate = new Date('2026-09-26T00:00:00.000Z');
let latestEnArticleDate = new Date('2026-09-26T00:00:00.000Z');

for (const dir of ['articles', 'events', 'articles-en', 'events-en']) {
  const target = join(contentRoot, dir);
  if (!existsSync(target)) continue;
  for (const file of readdirSync(target)) {
    if (!file.endsWith('.md')) continue;
    const date = readFrontmatterDate(join(target, file));
    const prefix = dir.endsWith('-en') ? '/en' : '';
    const kind = dir.startsWith('articles') ? 'articles' : 'events';
    if (date) {
      lastmodBySlug.set(`${prefix}/${kind}/${file.replace(/\.md$/, '')}/`, date);
      if (dir === 'articles' && date > latestZhArticleDate) latestZhArticleDate = date;
      if (dir === 'articles-en' && date > latestEnArticleDate) latestEnArticleDate = date;
    }
  }
}

try {
  const talks = JSON.parse(readFileSync(join(dataRoot, 'talks.json'), 'utf8'));
  for (const talk of talks) {
    const d = talk.uploadedAt ? new Date(talk.uploadedAt) : latestZhArticleDate;
    if (!Number.isNaN(d.getTime())) lastmodBySlug.set(`/articles/${talk.id}/`, d);
  }
} catch {}

try {
  const recordings = JSON.parse(readFileSync(join(dataRoot, 'recordings.json'), 'utf8'));
  let latestRecDate = new Date('2023-06-15T00:00:00.000Z');
  for (const rec of recordings) {
    const d = rec.uploadedAt ? new Date(rec.uploadedAt) : latestRecDate;
    if (!Number.isNaN(d.getTime())) {
      lastmodBySlug.set(`/recordings/${rec.id}/`, d);
      if (d > latestRecDate) latestRecDate = d;
    }
  }
  lastmodBySlug.set('/recordings/', latestRecDate);
} catch {}

try {
  const archives = JSON.parse(readFileSync(join(dataRoot, 'activity-archive.json'), 'utf8'));
  for (const ev of archives) {
    const d = ev.startDate ? new Date(ev.startDate) : undefined;
    if (d && !Number.isNaN(d.getTime())) {
      lastmodBySlug.set(`/events/archive/${ev.id}/`, d);
      lastmodBySlug.set(`/en/events/archive/${ev.id}/`, d);
    }
  }
} catch {}

try {
  const topics = JSON.parse(readFileSync(join(dataRoot, 'topics.json'), 'utf8'));
  for (const topic of topics) {
    lastmodBySlug.set(`/topics/${topic.slug}/`, latestZhArticleDate);
    lastmodBySlug.set(`/en/topics/${topic.slug}/`, latestEnArticleDate);
  }
} catch {}

const todayUtc = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z');
for (const p of ['/', '/articles/', '/events/', '/events/series/t-chat/', '/history/', '/about/', '/contact/', '/privacy/', '/terms/']) {
  lastmodBySlug.set(p, latestZhArticleDate);
}
for (const p of ['/en/', '/en/articles/', '/en/events/', '/en/events/series/t-chat/', '/en/history/', '/en/about/', '/en/contact/', '/en/privacy/', '/en/terms/']) {
  lastmodBySlug.set(p, latestEnArticleDate);
}
for (const p of [
  '/whenreset/', '/whenreset/codex/', '/whenreset/claude/', '/whenreset/grok/', '/whenreset/google/',
  '/whenreset/claude-5-hour-calculator/', '/whenreset/cursor-fast-requests/', '/whenreset/quotas/',
  '/en/whenreset/', '/en/whenreset/codex/', '/en/whenreset/claude/', '/en/whenreset/grok/', '/en/whenreset/google/',
  '/en/whenreset/claude-5-hour-calculator/', '/en/whenreset/cursor-fast-requests/', '/en/whenreset/quotas/',
  '/compare/', '/en/compare/',
  '/compare/claude-code-vs-codex-vs-cursor-vs-antigravity/', '/en/compare/claude-code-vs-codex-vs-cursor-vs-antigravity/',
  '/compare/claude-pro-vs-claude-max-vs-api/', '/en/compare/claude-pro-vs-claude-max-vs-api/',
  '/compare/chatgpt-plus-vs-pro-for-codex/', '/en/compare/chatgpt-plus-vs-pro-for-codex/',
  '/compare/sonnet-vs-codex-vs-deepseek-vs-gemini-coding-cost/', '/en/compare/sonnet-vs-codex-vs-deepseek-vs-gemini-coding-cost/',
  '/compare/cursor-500-fast-requests-vs-claude-5-hour-window/', '/en/compare/cursor-500-fast-requests-vs-claude-5-hour-window/',
  '/templates/', '/en/templates/',
  '/calculator/', '/en/calculator/',
  '/reports/', '/en/reports/',
  '/errors/', '/en/errors/',
  '/errors/claude-5-hour-limit-reached/', '/en/errors/claude-5-hour-limit-reached/',
  '/errors/claude-weekly-limit-exhausted/', '/en/errors/claude-weekly-limit-exhausted/',
  '/errors/codex-usage-limit-and-reset-card/', '/en/errors/codex-usage-limit-and-reset-card/',
  '/errors/prompt-cache-miss-high-cost/', '/en/errors/prompt-cache-miss-high-cost/',
  '/errors/cursor-fast-requests-exhausted/', '/en/errors/cursor-fast-requests-exhausted/',
  '/errors/grok-supergrok-rate-limit/', '/en/errors/grok-supergrok-rate-limit/',
  '/errors/claude-code-context-window-full/', '/en/errors/claude-code-context-window-full/',
  '/errors/openai-codex-sandbox-limit/', '/en/errors/openai-codex-sandbox-limit/',
  '/errors/gemini-cli-quota-exceeded-429/', '/en/errors/gemini-cli-quota-exceeded-429/',
  '/tokenrank/', '/tokenrank/methodology/', '/tokenrank/connect/',
  '/en/tokenrank/', '/en/tokenrank/methodology/', '/en/tokenrank/connect/',
]) {
  lastmodBySlug.set(p, todayUtc);
}

const lastmodFor = (url) => {
  try {
    const pathname = new URL(url).pathname;
    return lastmodBySlug.get(pathname);
  } catch {
    /* Ignore unparsable URLs and fall through without a lastmod. */
  }
  return undefined;
};

export default defineConfig({
  site: 'https://www.tsalon.tech',
  output: 'static',
  adapter: vercel(),
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    smartypants: false,
  },
  integrations: [
    auth(),
    sitemap({
      filter: (page) => !['/gallery/', '/join/', '/reset/', '/whenrest/', '.png', '.svg'].some((suffix) => page.endsWith(suffix)),
      serialize: (item) => {
        const lastmod = lastmodFor(item.url);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
  build: {
    format: 'directory',
  },
});
