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
  const articles = (await getCollection('articlesEn', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime(),
  );

  const items = articles
    .map((entry) => {
      const url = `${origin}/en/articles/${entry.id}/`;
      return [
        '    <item>',
        `      <title>${escapeXml(entry.data.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${entry.data.publishedAt.toUTCString()}</pubDate>`,
        `      <description>${escapeXml(entry.data.summary)}</description>`,
        `      <category>${escapeXml(entry.data.topics.join(', '))}</category>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>T Salon</title>',
    `    <link>${origin}/en/</link>`,
    `    <atom:link href="${origin}/en/rss.xml" rel="self" type="application/rss+xml" />`,
    '    <description>T Salon is an online and offline technology community for developers, covering the Apple developer ecosystem, AI technology and business, embodied intelligence, and software engineering practice. All content is original.</description>',
    '    <language>en</language>',
    '    <managingEditor>editorial@tsalon.tech (T Salon Editorial Team)</managingEditor>',
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
