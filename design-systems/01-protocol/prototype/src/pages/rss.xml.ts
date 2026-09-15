import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.origin ?? 'https://www.tsalon.tech';
  const articles = (await getCollection('articles', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime(),
  );

  const items = articles
    .map((entry) => {
      const url = `${origin}/articles/${entry.id}/`;
      return [
        '    <item>',
        `      <title>${escapeXml(entry.data.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${entry.data.publishedAt.toUTCString()}</pubDate>`,
        `      <description>${escapeXml(entry.data.summary)}</description>`,
        `      <category>${escapeXml(entry.data.topics.join('、'))}</category>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>T Salon</title>',
    `    <link>${origin}/</link>`,
    `    <atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml" />`,
    '    <description>T Salon 面向开发者的线上与线下技术交流平台，覆盖 Apple 开发者生态、AI 技术与商业、具身智能与软件工程实践。全站内容原创。</description>',
    '    <language>zh-CN</language>',
    '    <managingEditor>editorial@tsalon.tech (T Salon Editorial Team)</managingEditor>',
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
