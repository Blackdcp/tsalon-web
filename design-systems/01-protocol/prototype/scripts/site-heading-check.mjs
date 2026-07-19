import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

const decode = (value) => value
  .replace(/<[^>]+>/g, '')
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .replaceAll('&amp;', '&')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'")
  .replace(/\s+/g, ' ')
  .trim();

const failures = [];
const files = await walk(root);
for (const file of files) {
  const html = await readFile(file, 'utf8');
  for (const match of html.matchAll(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const text = decode(match[2]);
    if (/[。.\uFF0E]$/.test(text)) failures.push(`${relative(root, file)}: h${match[1]} “${text}”`);
    if (/[，。！？：；,.!?:;]\s*(?:<br\s*\/?\s*>|<\/span>\s*<span>)/i.test(match[2])) {
      failures.push(`${relative(root, file)}: h${match[1]} has punctuation at a visual line break — “${text}”`);
    }
  }
}

if (failures.length) {
  console.error(`Heading punctuation check failed:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`Heading punctuation check passed for ${files.length} HTML pages.`);
