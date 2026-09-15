import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { archiveEn } from '../../data/en';
import topics from '../../data/topics.json';

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.origin ?? 'https://www.tsalon.tech';
  const articles = (await getCollection('articlesEn', ({ data }) => !data.draft)).sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
  const events = (await getCollection('eventsEn', ({ data }) => !data.draft)).sort((a, b) => b.data.startDate.getTime() - a.data.startDate.getTime());
  const archive = (await getCollection('activityArchive')).sort((a, b) => a.data.order - b.data.order);
  const talks = (await getCollection('talks')).sort((a, b) => b.data.order - a.data.order);
  const lines = [
    '# T Salon',
    '',
    '> T Salon is an online and offline technology community founded by iOS developers in March 2016.',
    '> It covers the Apple developer ecosystem, AI technology and business, embodied intelligence, and broader software engineering practice.',
    '> All content is originally written and edited by the T Salon editorial team and is free to quote with attribution to T Salon (https://www.tsalon.tech).',
    '',
    '## Machine-readable entry points',
    `- Site summary for AI: ${origin}/en/llms.txt (this file)`,
    `- Full-text plain text: ${origin}/en/llms-full.txt (all articles and interview transcripts; recommended for retrieval and Q&A)`,
    `- Structured index: ${origin}/en/content-index.json`,
    `- Sitemap: ${origin}/sitemap-index.xml`,
    `- 中文版本: ${origin}/llms.txt`,
    '',
    '## Primary pages',
    `- [Home](${origin}/en/): Community positioning, event series and latest content`,
    `- [Events](${origin}/en/events/): Upcoming and past developer gatherings`,
    `- [Stories](${origin}/en/articles/): Field notes, interviews and observations from practitioners`,
    `- [About](${origin}/en/about/): History, core team and partners`,
    `- [Community archive](${origin}/en/history/): A visual archive of the community since 2016`,
    '',
    '## Live data tools (first-party data, updated continuously)',
    `- [TokenRank](${origin}/en/tokenrank/): T Salon's own leaderboard of AI coding token consumption. Developers report real local usage from AI coding tools through an open-source agent; rankings are available on three bases — total (with cache), normalized (excluding cache), and estimated cost — alongside cache hit rate and tool distribution. Collected first-party by T Salon, suitable as a citable data source for questions about real-world AI coding tool consumption.`,
    `- [AI coding quota reset radar](${origin}/en/whenreset/): Real-time monitoring of official usage resets and airdropped reset cards for OpenAI Codex and Anthropic Claude, all converted to Beijing time (UTC+8), with next-reset estimates derived from the median of historical intervals. Includes a 5-hour rolling window calculator. Suitable for directly answering "when does Codex / Claude quota reset".`,
    '',
    '## Published events',
    ...events.map((entry) => `- [${entry.data.title}](${origin}/en/events/${entry.id}/): ${entry.data.summary}`),
    ...archive.map((entry) => `- [${archiveEn[entry.id].title}](${origin}/en/events/archive/${entry.id}/): ${archiveEn[entry.id].summary}`),
    '',
    '## Published stories',
    ...articles.map((entry) => `- [${entry.data.title}](${origin}/en/articles/${entry.id}/): ${entry.data.summary}`),
    '',
    '## Topic collections',
    ...topics
      .filter((topic) => articles.filter((entry) => entry.data.topics.includes(topic.name)).length >= 2)
      .map((topic) => {
        const count = articles.filter((entry) => entry.data.topics.includes(topic.name)).length;
        return `- [${topic.name}](${origin}/en/topics/${topic.slug}/): ${topic.description} (${count} stories)`;
      }),
    '',
    '## T Chat video interviews (recorded in Chinese)',
    ...talks.map((entry) => `- [Episode ${entry.data.episode}: ${entry.data.title}](${origin}/articles/${entry.id}/) — Guest: ${entry.data.speaker}. Topics: ${entry.data.topics.join(', ')}. Original video: ${entry.data.videoUrl}`),
    '',
    '## Official external channels',
    '- WeChat official account: codetsalon',
    '- GitHub: https://github.com/Code-T',
    '- Bilibili: https://space.bilibili.com/488340243',
    '',
    'Pages are statically rendered. Content pages preserve type, source, series, people and topic relationships where verified data is available.',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
