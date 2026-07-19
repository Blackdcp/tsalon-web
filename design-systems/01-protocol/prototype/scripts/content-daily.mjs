import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(resolve(projectRoot, 'content-ops/editorial.config.json'), 'utf8'));

const since = new Date(Date.now() - config.aiHot.lookbackHours * 60 * 60 * 1000);
const url = new URL('https://aihot.virxact.com/api/public/items');
url.searchParams.set('mode', 'selected');
url.searchParams.set('take', String(config.aiHot.take));
url.searchParams.set('since', since.toISOString());

const response = await fetch(url, {
  headers: {
    Accept: 'application/json',
    'User-Agent': 'tsalon-editorial/1.0 (+https://www.tsalon.tech)',
  },
});
if (!response.ok) throw new Error(`AIHot 请求失败：HTTP ${response.status}`);

const data = await response.json();
const items = (Array.isArray(data.items) ? data.items : [])
  .filter((item) => (
    typeof item.id === 'string'
    && typeof item.title === 'string'
    && typeof item.summary === 'string'
    && typeof item.url === 'string'
    && Number(item.score || 0) >= config.aiHot.minimumSourceScore
  ))
  .sort((left, right) => Number(right.score || 0) - Number(left.score || 0));

const outputDirectory = resolve(projectRoot, '.editorial');
const outputPath = resolve(outputDirectory, 'latest.json');
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(outputPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  lookbackHours: config.aiHot.lookbackHours,
  scoring: config.scoring,
  minimumEditorialScore: config.review.minimumScore,
  items,
}, null, 2), 'utf8');

if (!items.length) {
  console.log('过去 24 小时没有符合基础条件的 AIHot 内容。');
  process.exit(0);
}

console.log(`已获取 ${items.length} 条候选，完整数据保存到 ${outputPath}\n`);
for (const [index, item] of items.slice(0, 10).entries()) {
  console.log(`[${index + 1}] AIHot ${item.score || '-'} 分  ${item.title}`);
  console.log(`    ${item.source || '未知来源'}  ·  ${item.url}\n`);
}
console.log('下一步：由 Codex 按 content-ops/editorial.config.json 重新评分，并等待你确认选题。');
