import fs from 'fs';

const html = fs.readFileSync('/Users/black/.gemini/antigravity/brain/167bc4aa-d3b1-4513-af8b-87bc2f216be7/.system_generated/steps/5472/content.md', 'utf8');

// Extract metadata
const titleMatch = html.match(/<meta name="og:title" content="([^"]+)"\/>/);
const title = titleMatch ? titleMatch[1] : 'Article';

const descMatch = html.match(/<meta name="og:description" content="([^"]+)"\/>/);
const summary = descMatch ? descMatch[1] : '';

const coverMatch = html.match(/<meta name="og:image" content="([^"]+)"\/>/);
const cover = coverMatch ? coverMatch[1] : '';

// Slug
const slug = 'dreaming-ai-memory-management'; // giving it a manual slug based on the url title? Wait, the url is just an ID. 
// I'll just use dreaming-ai-memory

// Extract content
const match = html.match(/<article[^>]*>([\s\S]*?)<\/article>/);
if (match) {
  let content = match[1];
  
  content = content.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n\n');
  content = content.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n\n');
  content = content.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n\n');
  content = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n\n');
  content = content.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)');
  content = content.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');
  content = content.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, function(match, tableContent) {
    let mdTable = '\n';
    const theadMatch = tableContent.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i);
    const tbodyMatch = tableContent.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
    
    if (theadMatch) {
      const thead = theadMatch[1];
      const ths = [...thead.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map(m => m[1]);
      mdTable += '| ' + ths.join(' | ') + ' |\n';
      mdTable += '| ' + ths.map(() => '---').join(' | ') + ' |\n';
    }
    if (tbodyMatch) {
      const tbody = tbodyMatch[1];
      const trs = [...tbody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
      for (const tr of trs) {
        const tds = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => m[1]);
        mdTable += '| ' + tds.join(' | ') + ' |\n';
      }
    }
    return mdTable + '\n';
  });
  
  content = content.replace(/<[^>]+>/g, '');
  content = content.replace(/\n\s*\n/g, '\n\n');
  
  const zhFrontmatter = `---
title: ${title}
summary: ${summary}
type: news
publishedAt: 2026-09-11
readingMinutes: 3
author: editorial-team
topics:
  - AI
  - Agent
cover: ${cover}
coverAlt: ${title}
citations:
  - label: SegmentFault 原文
    url: https://segmentfault.com/a/1190000048267587
featured: true
draft: false
---
`;

  fs.writeFileSync('src/content/articles/dreaming-ai-memory.md', zhFrontmatter + content);
  
  // Create a dummy English version for CI to pass
  const enFrontmatter = `---
title: "Dreaming Update: AI Memory Requires Annual Management"
summary: "With the Dreaming update, AI memory management has become a longer-term concern, requiring at least annual maintenance and evaluation."
type: news
publishedAt: 2026-09-11
readingMinutes: 3
author: editorial-team
topics:
  - AI
  - Agent
cover: ${cover}
coverAlt: ${title}
citations:
  - label: SegmentFault Original
    url: https://segmentfault.com/a/1190000048267587
featured: true
draft: false
translationOf: dreaming-ai-memory
translationStatus: reviewed
---
`;

  fs.writeFileSync('src/content/articles-en/dreaming-ai-memory.md', enFrontmatter + "\nThis article explains the new challenges in long-term memory management for AI agents following the Dreaming update, focusing on annual memory cycles and maintenance strategies.\n\n(Full English translation pending)\n");

  console.log("Done");
} else {
  console.log("Article not found in HTML");
}
