import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const pairs = [
  ['articles', 'articles-en'],
  ['events', 'events-en'],
];
const errors = [];
const markdown = (directory) => existsSync(directory)
  ? readdirSync(directory).filter((name) => /\.mdx?$/.test(name))
  : [];
const published = (source) => /\ndraft:\s*false\s*(?:\n|$)/.test(source);

for (const [zhName, enName] of pairs) {
  const zhDir = resolve('src/content', zhName);
  const enDir = resolve('src/content', enName);
  const zhFiles = markdown(zhDir);
  const enFiles = markdown(enDir);

  for (const file of zhFiles) {
    const zhSource = readFileSync(join(zhDir, file), 'utf8');
    if (!published(zhSource)) continue;
    const enPath = join(enDir, file);
    const slug = basename(file).replace(/\.mdx?$/, '');
    if (!existsSync(enPath)) {
      errors.push(`${zhName}/${file}: published Chinese content has no English companion`);
      continue;
    }
    const enSource = readFileSync(enPath, 'utf8');
    if (!published(enSource)) errors.push(`${enName}/${file}: English companion is still a draft`);
    if (!new RegExp(`\\ntranslationOf:\\s*${slug}\\s*(?:\\n|$)`).test(enSource)) errors.push(`${enName}/${file}: translationOf must be ${slug}`);
    if (!/\ntranslationStatus:\s*reviewed\s*(?:\n|$)/.test(enSource)) errors.push(`${enName}/${file}: translation must be reviewed before publication`);
    if (/\p{Script=Han}/u.test(enSource)) errors.push(`${enName}/${file}: English page still contains Chinese characters`);
  }

  for (const file of enFiles) {
    const enSource = readFileSync(join(enDir, file), 'utf8');
    if (published(enSource) && !existsSync(join(zhDir, file))) errors.push(`${enName}/${file}: published translation has no Chinese source`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Bilingual content check passed.');
