import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import auth from 'auth-astro';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

// Build a slug -> date map from content frontmatter so the sitemap can emit
// accurate <lastmod> values. AI crawlers and search engines rely on lastmod to
// decide whether a page is fresh enough to re-fetch.
const contentRoot = fileURLToPath(new URL('./src/content/', import.meta.url));

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
for (const dir of ['articles', 'events', 'articles-en', 'events-en']) {
  const target = join(contentRoot, dir);
  if (!existsSync(target)) continue;
  for (const file of readdirSync(target)) {
    if (!file.endsWith('.md')) continue;
    const date = readFrontmatterDate(join(target, file));
    const prefix = dir.endsWith('-en') ? '/en' : '';
    const kind = dir.startsWith('articles') ? 'articles' : 'events';
    if (date) lastmodBySlug.set(`${prefix}/${kind}/${file.replace(/\.md$/, '')}/`, date);
  }
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
      filter: (page) => !['/gallery/', '/join/', '/reset/', '/whenrest/'].some((suffix) => page.endsWith(suffix)),
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
