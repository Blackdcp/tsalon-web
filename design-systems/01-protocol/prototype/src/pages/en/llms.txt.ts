import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { archiveEn } from '../../data/en';

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.origin ?? 'https://www.tsalon.tech';
  const articles = (await getCollection('articlesEn', ({ data }) => !data.draft)).sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
  const events = (await getCollection('eventsEn', ({ data }) => !data.draft)).sort((a, b) => b.data.startDate.getTime() - a.data.startDate.getTime());
  const archive = (await getCollection('activityArchive')).sort((a, b) => a.data.order - b.data.order);
  const lines = [
    '# T Salon',
    '',
    '> T Salon is an online and offline technology community founded by iOS developers in 2016.',
    '',
    '## Primary pages',
    `- [Home](${origin}/en/)`,
    `- [Events](${origin}/en/events/)`,
    `- [Stories](${origin}/en/articles/)`,
    `- [About](${origin}/en/about/)`,
    `- [Community archive](${origin}/en/history/)`,
    '',
    '## Published events',
    ...events.map((entry) => `- [${entry.data.title}](${origin}/en/events/${entry.id}/): ${entry.data.summary}`),
    ...archive.map((entry) => `- [${archiveEn[entry.id].title}](${origin}/en/events/archive/${entry.id}/): ${archiveEn[entry.id].summary}`),
    '',
    '## Published stories',
    ...articles.map((entry) => `- [${entry.data.title}](${origin}/en/articles/${entry.id}/): ${entry.data.summary}`),
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
