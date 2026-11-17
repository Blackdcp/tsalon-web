import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { talkSpeakerEn, talkTitleEn } from '../../data/en';

const stripImages = (markdown: string) =>
  markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const isoDate = (value: Date) => value.toISOString().slice(0, 10);

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.origin ?? 'https://www.tsalon.tech';
  const articles = (await getCollection('articlesEn', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime(),
  );
  const talks = (await getCollection('talks')).sort((a, b) => b.data.order - a.data.order);

  const lines: string[] = [
    '# T Salon — full content (llms-full.txt)',
    '',
    '> T Salon is an online and offline technology community founded by iOS developers in March 2016.',
    '> It covers the Apple developer ecosystem, AI technology and business, embodied intelligence, and broader software engineering practice.',
    '> This collection includes community records and analysis of published technical material. Preserve the attribution and original sources listed in each article; see the site terms for reuse.',
    '',
    `This file contains published T Salon articles and an interview video directory. For a summary, see ${origin}/en/llms.txt.`,
    '',
    '---',
    '',
    '## Published articles',
    '',
  ];

  for (const entry of articles) {
    lines.push(
      `### ${entry.data.title}`,
      '',
      `- URL: ${origin}/en/articles/${entry.id}/`,
      `- Published: ${isoDate(entry.data.publishedAt)}`,
      `- Type: ${entry.data.type}`,
      `- Topics: ${entry.data.topics.join(', ')}`,
      `- Summary: ${entry.data.summary}`,
      '',
      ...(entry.data.tldr.length > 0
        ? ['- TL;DR:', ...entry.data.tldr.map((point) => `  - ${point}`), '']
        : []),
      stripImages(entry.body ?? ''),
      ...entry.data.citations.map((source) => `- Source: [${source.label}](${source.url})`),
      '',
      ...(entry.data.faq.length > 0
        ? [
            '### Frequently Asked Questions',
            ...entry.data.faq.flatMap((item) => [`**Q: ${item.question}**`, item.answer, '']),
            '',
          ]
        : []),
      '---',
      '',
    );
  }

  lines.push('## T Chat video interviews (recorded in Chinese)', '');
  lines.push('Episode summaries from the T Chat interview series. Full content is available in the linked videos.', '');
  for (const talk of talks) {
    lines.push(
      `### Episode ${talk.data.episode}: ${talkTitleEn[talk.id]}`,
      '',
      `- URL: ${origin}/articles/${talk.id}/`,
      `- Guest: ${talkSpeakerEn[talk.id]}`,
      `- Video: ${talk.data.videoUrl}`,
      ...talk.data.videoParts.map((part, index) => `- [Video part ${index + 1} (Chinese)](${part.url}) · Uploaded ${part.uploadedAt.slice(0, 10)} · ${part.durationSeconds} seconds`),
      '',
      '---',
      '',
    );
  }

  lines.push(
    '## Community tools',
    '',
    `- TokenRank: ${origin}/en/tokenrank/ — AI coding usage reported by community contributors. Methodology and limitations: ${origin}/en/tokenrank/methodology/. Machine-readable stats: ${origin}/tokenrank/stats.json.`,
    `- WhenReset: ${origin}/en/whenreset/ — Collected Codex, Claude, and Grok quota reset schedules, notices and time estimates; check the product for your account's quota status.`,
    `  - OpenAI Codex Quota Reset Radar: ${origin}/en/whenreset/codex/`,
    `  - Anthropic Claude Quota Reset Radar: ${origin}/en/whenreset/claude/`,
    `  - xAI Grok Quota Reset Radar: ${origin}/en/whenreset/grok/`,
    '',
  );

  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
