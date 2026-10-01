import type { APIRoute } from 'astro';
import { getResetRadarData } from '../../../lib/reset-radar';

export const prerender = false;

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.origin ?? 'https://www.tsalon.tech';
  const radarData = await getResetRadarData();

  const allEvents = [
    ...radarData.codex.events,
    ...radarData.claude.events,
    ...radarData.grok.events,
  ].sort((a, b) => Date.parse(b.landedAtBeijing) - Date.parse(a.landedAtBeijing));

  const items = allEvents
    .map((e) => {
      const providerName = e.provider === 'codex' ? 'Codex' : e.provider === 'claude' ? 'Claude' : 'Grok';
      const title = `[${providerName}] ${e.typeLabelEn} - ${e.scopeEn}`;
      const url = e.postUrl || `${origin}/en/whenreset/`;
      const pubDate = new Date(e.landedAtBeijing + '+08:00').toUTCString();
      const desc = `Type: ${e.typeLabelEn} | Scope: ${e.scopeEn} | Reason: ${e.reasonEn} | Time: ${e.landedAtBeijing} (UTC+8)`;

      return [
        '    <item>',
        `      <title>${escapeXml(title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="false">${escapeXml(e.id)}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        `      <description>${escapeXml(desc)}</description>`,
        `      <category>${escapeXml(providerName)}</category>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>AI Quota Reset Radar - T Salon</title>',
    `    <link>${origin}/en/whenreset/</link>`,
    `    <atom:link href="${origin}/en/whenreset/rss.xml" rel="self" type="application/rss+xml" />`,
    '    <description>Live updates and records of global quota resets and reset cards for OpenAI Codex, Anthropic Claude, and xAI Grok.</description>',
    '    <language>en-US</language>',
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
};
