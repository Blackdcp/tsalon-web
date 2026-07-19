import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve('src/content');
const markdownFiles = [];
const walk = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.mdx?$/.test(entry.name)) markdownFiles.push(path);
  }
};
walk(root);

const errors = [];
for (const file of markdownFiles) {
  const source = readFileSync(file, 'utf8');
  const isPublished = /\ndraft:\s*false\s*(?:\n|$)/.test(source);
  if (isPublished && /\bTODO\b/.test(source)) errors.push(`${file}: published content contains TODO`);
  if (isPublished && /\nseo:\s*\n(?![\s\S]*?description:)/.test(source)) errors.push(`${file}: published content is missing SEO description`);
  if (isPublished && /cover:\s*\/images\/TODO/.test(source)) errors.push(`${file}: published content uses placeholder cover`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Content preflight passed for ${markdownFiles.length} Markdown files.`);
