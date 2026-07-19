import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.origin ?? 'https://www.tsalon.tech';
  const series = await getCollection('eventSeries');
  const events = await getCollection('events', ({ data }) => !data.draft);
  const archiveEvents = await getCollection('activityArchive');
  const talks = await getCollection('talks');
  const articles = await getCollection('articles', ({ data }) => !data.draft);
  const body = {
    name: 'T Salon',
    description: '面向开发者的线上与线下技术交流平台',
    language: 'zh-CN',
    updated: '2026-07-18',
    pages: { events: `${origin}/events/`, content: `${origin}/articles/`, about: `${origin}/about/`, history: `${origin}/history/`, join: `${origin}/about/#join` },
    preparationTopics: [
      { id: 'ai', name: 'AI', collaboration: ['guest', 'content'] },
      { id: 'embodied-intelligence', name: '具身智能', collaboration: ['guest', 'content'] },
    ],
    events: events.map((entry) => ({
      id: entry.id,
      title: entry.data.title,
      summary: entry.data.summary,
      startDate: entry.data.startDate.toISOString(),
      endDate: entry.data.endDate.toISOString(),
      attendanceMode: entry.data.attendanceMode,
      registrationStatus: entry.data.registration.status,
      url: `${origin}/events/${entry.id}/`,
      registrationUrl: entry.data.registration.url,
    })),
    historicalEvents: archiveEvents.map((entry) => ({
      id: entry.id,
      title: entry.data.title,
      summary: entry.data.summary,
      startDate: entry.data.startDate.toISOString(),
      endDate: entry.data.endDate.toISOString(),
      mode: entry.data.mode,
      province: entry.data.province,
      city: entry.data.city,
      address: entry.data.address,
      status: entry.data.status,
      url: `${origin}/events/archive/${entry.id}/`,
      sourceUrl: entry.data.sourceUrl,
      sourceName: entry.data.sourceName,
    })),
    eventSeries: series.map((entry) => ({ id: entry.id, name: entry.data.name, englishName: entry.data.englishName, status: entry.data.status, modes: entry.data.modes, topics: entry.data.topics, url: `${origin}/events/series/${entry.id}/` })),
    content: articles.map((entry) => ({ id: entry.id, type: entry.data.type, title: entry.data.title, summary: entry.data.summary, topics: entry.data.topics, publishedAt: entry.data.publishedAt.toISOString(), url: `${origin}/articles/${entry.id}/` })),
    videoArchive: talks.map((entry) => ({ id: entry.id, type: 'video-interview', title: entry.data.title, summary: entry.data.summary, guest: entry.data.speaker, series: entry.data.series, episode: entry.data.episode, topics: entry.data.topics, url: `${origin}/articles/${entry.id}/`, sourceUrl: entry.data.videoUrl })),
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
