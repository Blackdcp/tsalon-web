import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.origin ?? 'https://www.tsalon.tech';
  const series = (await getCollection('eventSeries')).sort((a, b) => a.data.order - b.data.order);
  const events = (await getCollection('events', ({ data }) => !data.draft)).sort((a, b) => b.data.startDate.getTime() - a.data.startDate.getTime());
  const archiveEvents = (await getCollection('activityArchive')).sort((a, b) => a.data.order - b.data.order);
  const articles = await getCollection('articles', ({ data }) => !data.draft);
  const talks = (await getCollection('talks')).sort((a, b) => b.data.order - a.data.order);
  const lines = [
    '# T Salon / T 技术沙龙',
    '',
    '> T Salon 是面向开发者的线上与线下技术交流平台，成立于 2016 年 3 月，最早由 iOS 开发者发起。',
    '',
    '## Official pages',
    `- [Home](${origin}/): 社区定位、活动系列与最新内容`,
    `- [Events](${origin}/events/): 正在报名的合作活动、活动详情、历史回顾与筹备主题`,
    `- [Content](${origin}/articles/): 活动实录、行业观察、人物访谈与社区新闻`,
    `- [About](${origin}/about/): 社区介绍、核心团队与合作伙伴`,
    `- [Community archive](${origin}/history/): 2016 年以来的活动现场与社区历史`,
    `- [Join & Collaborate](${origin}/about/#join): 参加活动、成为嘉宾、联合主办与内容共创`,
    '',
    '## Activities',
    ...events.map((entry) => `- [${entry.data.title}](${origin}/events/${entry.id}/): ${entry.data.summary} Date: ${entry.data.startDate.toISOString()}. Mode: ${entry.data.attendanceMode}.`),
    '',
    '## Archived event series',
    ...series.map((entry) => `- [${entry.data.englishName}](${origin}/events/series/${entry.id}/): ${entry.data.description} Format: ${entry.data.format}. Status: ${entry.data.status}.`),
    '',
    '## Historical activities',
    ...archiveEvents.map((entry) => `- [${entry.data.title}](${origin}/events/archive/${entry.id}/): ${entry.data.summary} Date: ${entry.data.startDate.toISOString()}. Location: ${entry.data.province}${entry.data.city}. Original source: ${entry.data.sourceUrl}`),
    '',
    '## Published articles',
    ...articles.map((entry) => `- [${entry.data.title}](${origin}/articles/${entry.id}/): ${entry.data.summary}`),
    '',
    '## T Chat video interviews',
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
