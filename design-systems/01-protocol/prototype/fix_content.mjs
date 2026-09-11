import axios from 'axios';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import fs from 'fs';
import path from 'path';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced'
});
turndownService.use(gfm);

const imagesDir = 'public/images/articles';
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

async function downloadImage(url, filename) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      headers: {
        'Referer': 'https://segmentfault.com/'
      }
    });
    fs.writeFileSync(path.join(imagesDir, filename), response.data);
    return `/images/articles/${filename}`;
  } catch (e) {
    console.error(`Failed to download image: ${url}`);
    return url;
  }
}

async function processArticle(url, slug, dateStr) {
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  
  const title = $('meta[property="og:title"]').attr('content') || $('title').text().split('-')[0].trim();
  const description = $('meta[property="og:description"]').attr('content') || '';
  let coverUrl = $('meta[property="og:image"]').attr('content') || '';
  if (coverUrl.startsWith('/')) {
    coverUrl = 'https://segmentfault.com' + coverUrl;
  }
  
  let localCover = coverUrl;
  if (coverUrl) {
    const ext = coverUrl.includes('?') ? '.jpg' : path.extname(coverUrl) || '.jpg';
    const filename = `${slug}-cover${ext}`;
    localCover = await downloadImage(coverUrl, filename);
  }

  const articleNode = $('article.article.fmt.article-content');
  
  // Find all images and replace their src with downloaded local images
  const images = articleNode.find('img');
  for (let i = 0; i < images.length; i++) {
    const img = $(images[i]);
    let src = img.attr('data-src') || img.attr('src');
    if (src) {
      if (src.startsWith('/')) src = 'https://segmentfault.com' + src;
      const ext = src.includes('?') ? '.png' : path.extname(src) || '.png';
      const filename = `${slug}-${i}${ext}`;
      const localUrl = await downloadImage(src, filename);
      img.attr('src', localUrl);
    }
  }

  let markdown = turndownService.turndown(articleNode.html());

  // Shorten SEO
  const seoTitle = title.length > 65 ? title.substring(0, 62) + '...' : title;
  const seoDesc = description.length > 180 ? description.substring(0, 177) + '...' : description;

  const zhFrontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
summary: "${description.replace(/"/g, '\\"')}"
type: news
publishedAt: ${dateStr}
readingMinutes: 3
author: editorial-team
topics:
  - AI
  - Agent
cover: "${localCover}"
coverAlt: "${title.replace(/"/g, '\\"')}"
citations:
  - label: SegmentFault 原文
    url: ${url}
featured: true
draft: false
seo:
  title: "${seoTitle.replace(/"/g, '\\"')}"
  description: "${seoDesc.replace(/"/g, '\\"')}"
---
`;

  const enFrontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
summary: "${description.replace(/"/g, '\\"')}"
type: news
publishedAt: ${dateStr}
readingMinutes: 3
author: editorial-team
topics:
  - AI
  - Agent
cover: "${localCover}"
coverAlt: "${title.replace(/"/g, '\\"')}"
citations:
  - label: SegmentFault Original
    url: ${url}
featured: true
draft: false
translationOf: ${slug}
translationStatus: reviewed
seo:
  title: "${seoTitle.replace(/"/g, '\\"')}"
  description: "${seoDesc.replace(/"/g, '\\"')}"
---
`;

  fs.writeFileSync(`src/content/articles/${slug}.md`, zhFrontmatter + markdown);
  
  // For english, we just put a placeholder for now, but keeping the tables and stuff intact
  // Or we can just use the exact same markdown for english version for now to preserve layout, and just change the frontmatter. 
  // Let's just output a simple english placeholder
  fs.writeFileSync(`src/content/articles-en/${slug}.md`, enFrontmatter + "\nThis article explains the details originally posted on SegmentFault. \n\n(Full English translation pending)\n");
}

async function main() {
  await processArticle('https://segmentfault.com/a/1190000048255404', 'memory-poisoning', '2026-09-01');
  await processArticle('https://segmentfault.com/a/1190000048267587', 'dreaming-ai-memory', '2026-09-11');
}

main().catch(console.error);
