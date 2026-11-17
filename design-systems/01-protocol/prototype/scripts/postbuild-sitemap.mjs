import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://www.tsalon.tech';
const root = fileURLToPath(new URL('../', import.meta.url));
const targets = [
  join(root, 'dist/client'),
  join(root, '.vercel/output/static'),
  join(root, 'dist'),
];

function enrichHreflang(xml) {
  const locs = new Set([...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim()));
  return xml.replace(/<url><loc>([^<]+)<\/loc>((?:<lastmod>[^<]+<\/lastmod>)?)<\/url>/g, (full, loc, lastmod) => {
    try {
      const parsed = new URL(loc);
      const pathname = parsed.pathname;
      const isEn = pathname === '/en/' || pathname.startsWith('/en/');
      const zhPath = isEn ? (pathname === '/en/' ? '/' : pathname.slice(3)) : pathname;
      const enPath = isEn ? pathname : (pathname === '/' ? '/en/' : `/en${pathname}`);
      const zhUrl = `${ORIGIN}${zhPath}`;
      const enUrl = `${ORIGIN}${enPath}`;
      if (locs.has(zhUrl) && locs.has(enUrl)) {
        const links = [
          `<xhtml:link rel="alternate" hreflang="zh-Hans" href="${zhUrl}"/>`,
          `<xhtml:link rel="alternate" hreflang="en" href="${enUrl}"/>`,
          `<xhtml:link rel="alternate" hreflang="x-default" href="${zhUrl}"/>`,
        ].join('');
        return `<url><loc>${loc}</loc>${lastmod}${links}</url>`;
      }
    } catch {}
    return full;
  });
}

let copied = 0;
for (const dir of targets) {
  const urlsetSrc = join(dir, 'sitemap-0.xml');
  const indexSrc = join(dir, 'sitemap-index.xml');
  const dest = join(dir, 'sitemap.xml');
  if (existsSync(urlsetSrc)) {
    const enriched = enrichHreflang(readFileSync(urlsetSrc, 'utf8'));
    writeFileSync(urlsetSrc, enriched, 'utf8');
  }
  const src = existsSync(urlsetSrc) ? urlsetSrc : indexSrc;
  if (existsSync(src)) {
    copyFileSync(src, dest);
    copied++;
  }
}

console.log(`postbuild-sitemap: enriched hreflang and copied sitemap to sitemap.xml in ${copied} locations.`);
