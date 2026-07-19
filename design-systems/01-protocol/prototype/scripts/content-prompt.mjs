import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const briefIndex = process.argv.indexOf('--brief');
const briefPath = briefIndex >= 0 ? process.argv[briefIndex + 1] : undefined;
if (!briefPath) {
  console.error('Usage: npm run content:prompt -- --brief content-ops/briefs/example-article.json');
  process.exit(1);
}

const guide = readFileSync(resolve('content-ops/EDITORIAL-PROMPT.md'), 'utf8');
const brief = JSON.parse(readFileSync(resolve(briefPath), 'utf8'));
process.stdout.write(`${guide}\n\n## 本次内容 Brief\n\n\`\`\`json\n${JSON.stringify(brief, null, 2)}\n\`\`\`\n`);
