import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://www.tsalon.tech';
const TOKEN = process.env.BAIDU_TOKEN || 'tkYrFQnL7fxarwKB';
const BAIDU_API = `http://data.zz.baidu.com/urls?site=${SITE}&token=${TOKEN}`;

export function extractLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].replaceAll('&amp;', '&'));
}

export function loadLocalSitemapUrls() {
  const localPaths = [
    new URL('../dist/client/sitemap-0.xml', import.meta.url),
    new URL('../../../.vercel/output/static/sitemap-0.xml', import.meta.url),
  ];
  for (const path of localPaths) {
    if (existsSync(path)) {
      const xml = readFileSync(path, 'utf8');
      return extractLocs(xml);
    }
  }
  return [];
}

export async function fetchLiveSitemapUrls() {
  const res = await fetch(`${SITE}/sitemap-0.xml`, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Failed to fetch sitemap: HTTP ${res.status}`);
  const xml = await res.text();
  return extractLocs(xml);
}

export async function getPublishedUrls() {
  try {
    const live = await fetchLiveSitemapUrls();
    if (live.length > 0) return live;
  } catch {
    // fallback to local sitemap
  }
  return loadLocalSitemapUrls();
}

export async function submitToBaidu(urls) {
  if (!urls || urls.length === 0) {
    return { success: 0, remain: 0, message: 'No URLs to submit' };
  }
  const body = urls.join('\n');
  const res = await fetch(BAIDU_API, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body,
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json();
  return data;
}

async function main() {
  const allUrls = await getPublishedUrls();
  console.log(`Found ${allUrls.length} total published URLs.`);

  // If specific URLs are passed as arguments, use them
  const args = process.argv.slice(2);
  const targetUrls = args.length > 0 ? args : allUrls;

  console.log(`Submitting ${targetUrls.length} URLs to Baidu Link Submit API...`);
  const result = await submitToBaidu(targetUrls);
  console.log('Baidu API response:', JSON.stringify(result));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Baidu submission failed:', err);
    process.exitCode = 1;
  });
}
