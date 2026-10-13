import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://www.tsalon.tech';
const TOKEN = process.env.BAIDU_TOKEN || 'tkYrFQnL7fxarwKB';
const BAIDU_API = `http://data.zz.baidu.com/urls?site=${SITE}&token=${TOKEN}`;
const STATE_PATH = new URL('./baidu-submitted.json', import.meta.url);

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
  const local = loadLocalSitemapUrls();
  if (local.length > 0) return local;
  return fetchLiveSitemapUrls();
}

const PRIORITY_ORDER = [
  'https://www.tsalon.tech/articles/openai-agents-api-long-task-memory/',
  'https://www.tsalon.tech/articles/wardogs-wiki-verifiable-content-engineering/',
  'https://www.tsalon.tech/articles/agent-swarm-sqlite/',
  'https://www.tsalon.tech/articles/dreaming-ai-memory/',
  'https://www.tsalon.tech/articles/memory-poisoning/',
  'https://www.tsalon.tech/articles/nvidia-cosmos-edge/',
  'https://www.tsalon.tech/articles/hf-ai-hack/',
  'https://www.tsalon.tech/articles/ai-demo-to-production-recap/',
  'https://www.tsalon.tech/history/',
  'https://www.tsalon.tech/recordings/',
  'https://www.tsalon.tech/topics/ai/',
  'https://www.tsalon.tech/topics/agent/',
  'https://www.tsalon.tech/topics/engineering/',
  'https://www.tsalon.tech/topics/security/',
  'https://www.tsalon.tech/tokenrank/methodology/',
  'https://www.tsalon.tech/tokenrank/connect/',
  'https://www.tsalon.tech/contact/',
];

export function prioritizeUrls(urls) {
  const priorityMap = new Map(PRIORITY_ORDER.map((u, idx) => [u, idx]));
  return [...urls].sort((a, b) => {
    const pa = priorityMap.has(a) ? priorityMap.get(a) : 9999;
    const pb = priorityMap.has(b) ? priorityMap.get(b) : 9999;
    if (pa !== pb) return pa - pb;

    const aEn = a.includes('/en/');
    const bEn = b.includes('/en/');
    if (aEn !== bEn) return aEn ? 1 : -1;

    return a.localeCompare(b);
  });
}

function loadState() {
  if (existsSync(STATE_PATH)) {
    try {
      return JSON.parse(readFileSync(STATE_PATH, 'utf8'));
    } catch {
      // ignore
    }
  }
  return { submitted: [], history: [] };
}

function saveState(state) {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

export async function submitBatch(urls) {
  const body = urls.join('\n');
  const res = await fetch(BAIDU_API, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body,
    signal: AbortSignal.timeout(15000),
  });
  return res.json();
}

async function main() {
  const allUrls = await getPublishedUrls();
  const state = loadState();
  const submittedSet = new Set(state.submitted || []);

  const unsubmitted = prioritizeUrls(allUrls.filter((u) => !submittedSet.has(u)));
  console.log(`Total site URLs: ${allUrls.length} | Already submitted: ${submittedSet.size} | Remaining: ${unsubmitted.length}`);

  if (unsubmitted.length === 0) {
    console.log('All site URLs have already been submitted to Baidu!');
    return;
  }

  // Step 1: Probe with the first unsubmitted URL to check today's remaining quota
  const firstUrl = unsubmitted[0];
  console.log(`Probing Baidu API quota with: ${firstUrl}`);
  const firstRes = await submitBatch([firstUrl]);
  console.log('Probe response:', JSON.stringify(firstRes));

  if (firstRes.error) {
    console.log(`Cannot submit right now: ${firstRes.message} (code ${firstRes.error})`);
    return;
  }

  const newlySubmitted = [firstUrl];
  let remain = typeof firstRes.remain === 'number' ? firstRes.remain : 0;

  // Step 2: If there is remaining quota today, submit the next `remain` URLs
  if (remain > 0 && unsubmitted.length > 1) {
    const nextBatch = unsubmitted.slice(1, 1 + Math.min(remain, 2000));
    console.log(`Remaining daily quota is ${remain}. Submitting next ${nextBatch.length} URLs...`);
    const batchRes = await submitBatch(nextBatch);
    console.log('Batch response:', JSON.stringify(batchRes));

    if (!batchRes.error && batchRes.success > 0) {
      newlySubmitted.push(...nextBatch.slice(0, batchRes.success));
      remain = batchRes.remain ?? 0;
    }
  }

  // Update state
  for (const u of newlySubmitted) {
    submittedSet.add(u);
  }
  state.submitted = [...submittedSet];
  const today = new Date().toISOString().slice(0, 10);
  state.history = state.history || [];
  state.history.push({
    date: today,
    count: newlySubmitted.length,
    remainAfter: remain,
    urls: newlySubmitted,
  });
  saveState(state);

  console.log(`\nSuccessfully submitted ${newlySubmitted.length} URLs today (${today}).`);
  console.log(`Remaining quota today: ${remain}`);
  console.log(`Total progress: ${state.submitted.length} / ${allUrls.length} URLs submitted.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Baidu submission failed:', err);
    process.exitCode = 1;
  });
}
