import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = resolve('dist');
const htmlFiles = [];
const walk = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name.endsWith('.html')) htmlFiles.push(path);
  }
};
walk(root);

const errors = [];
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const hrefs = [...html.matchAll(/\shref="([^"]+)"/g)].map((match) => match[1]);
  for (const href of hrefs) {
    if (/^(?:https?:|mailto:|tel:|javascript:)/.test(href)) continue;
    const [rawPath, hash] = href.split('#');
    if (!rawPath && hash) {
      if (!new RegExp(`\\bid=["']${hash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(html)) errors.push(`${file}: missing local anchor #${hash}`);
      continue;
    }
    const relativeUrl = rawPath.startsWith('/') ? rawPath.slice(1) : join(dirname(file.slice(root.length + 1)), rawPath).replaceAll('\\', '/');
    const target = relativeUrl.endsWith('/') || !/\.[a-z0-9]+$/i.test(relativeUrl)
      ? join(root, relativeUrl, 'index.html')
      : join(root, relativeUrl);
    if (!existsSync(target)) {
      errors.push(`${file}: broken link ${href}`);
      continue;
    }
    if (hash && target.endsWith('.html')) {
      const targetHtml = readFileSync(target, 'utf8');
      if (!new RegExp(`\\bid=["']${hash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(targetHtml)) errors.push(`${file}: missing anchor ${href}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Link check passed for ${htmlFiles.length} HTML pages.`);
