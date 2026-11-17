import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { archiveEn } from '../../data/en';

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.origin ?? 'https://www.tsalon.tech';
  const articles = await getCollection('articlesEn', ({ data }) => !data.draft);
  const events = await getCollection('eventsEn', ({ data }) => !data.draft);
  const archive = await getCollection('activityArchive');
  const body = {
    language: 'en',
    generatedAt: new Date().toISOString(),
    organization: { name: 'T Salon', founded: '2016-03', url: `${origin}/en/` },
    tools: {
      tokenrank: `${origin}/en/tokenrank/`,
      tokenrankMethodology: `${origin}/en/tokenrank/methodology/`,
      tokenrankStatsJson: `${origin}/tokenrank/stats.json`,
      whenreset: `${origin}/en/whenreset/`,
      whenresetCodex: `${origin}/en/whenreset/codex/`,
      whenresetClaude: `${origin}/en/whenreset/claude/`,
      whenresetGrok: `${origin}/en/whenreset/grok/`,
      calculator: `${origin}/en/calculator/`,
      errors: `${origin}/en/errors/`,
    },
    events: [
      ...events.map((entry) => ({ id: entry.id, title: entry.data.title, summary: entry.data.summary, startDate: entry.data.startDate.toISOString(), url: `${origin}/en/events/${entry.id}/`, alternateLanguageUrl: `${origin}/events/${entry.data.translationOf}/` })),
      ...archive.map((entry) => ({ id: entry.id, title: archiveEn[entry.id].title, summary: archiveEn[entry.id].summary, startDate: entry.data.startDate.toISOString(), url: `${origin}/en/events/archive/${entry.id}/`, alternateLanguageUrl: `${origin}/events/archive/${entry.id}/` })),
    ],
    stories: articles.map((entry) => ({ id: entry.id, type: entry.data.type, title: entry.data.title, summary: entry.data.summary, topics: entry.data.topics, publishedAt: entry.data.publishedAt.toISOString(), updatedAt: (entry.data.updatedAt ?? entry.data.publishedAt).toISOString(), url: `${origin}/en/articles/${entry.id}/`, alternateLanguageUrl: entry.data.translationOf ? `${origin}/articles/${entry.data.translationOf}/` : undefined })),
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
