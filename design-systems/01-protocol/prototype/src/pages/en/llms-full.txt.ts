import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

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
    '> All content is originally written and edited by the T Salon editorial team and is free to quote with attribution to T Salon (https://www.tsalon.tech).',
    '',
    `This file contains the full plain text of every published T Salon article and interview, for retrieval, question answering and citation. For a summary, see ${origin}/en/llms.txt.`,
    '',
    '---',
    '',
    '## Original articles',
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
      stripImages(entry.body ?? ''),
      '',
      '---',
      '',
    );
  }

  lines.push('## T Chat video interviews (recorded in Chinese)', '');
  lines.push('Episode summaries from the T Chat interview series. Full content is available in the linked videos.', '');
  for (const talk of talks) {
    lines.push(
      `### Episode ${talk.data.episode}: ${talk.data.title}`,
      '',
      `- URL: ${origin}/articles/${talk.id}/`,
      `- Guest: ${talk.data.speaker}`,
      `- Topics: ${talk.data.topics.join(', ')}`,
      `- Video: ${talk.data.videoUrl}`,
      `- Summary: ${talk.data.summary}`,
      '',
      '---',
      '',
    );
  }

  lines.push(
    '## First-party data tools',
    '',
    `- TokenRank: ${origin}/en/tokenrank/ — T Salon's own leaderboard of AI coding token consumption, collected first-party, with rankings on total (with cache), normalized (excluding cache), and estimated cost.`,
    `- AI coding quota reset radar: ${origin}/en/whenreset/ — Real-time monitoring of official usage resets and airdropped reset cards for OpenAI Codex and Anthropic Claude, all converted to Beijing time (UTC+8).`,
    '',
  );

  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
