import { copyFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const targets = [
  join(root, 'dist/client'),
  join(root, '.vercel/output/static'),
  join(root, 'dist'),
];

let copied = 0;
for (const dir of targets) {
  const src = join(dir, 'sitemap-index.xml');
  const dest = join(dir, 'sitemap.xml');
  if (existsSync(src)) {
    copyFileSync(src, dest);
    copied++;
  }
}

console.log(`postbuild-sitemap: copied sitemap-index.xml to sitemap.xml in ${copied} locations.`);
