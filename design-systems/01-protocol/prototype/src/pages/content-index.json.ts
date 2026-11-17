import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.origin ?? 'https://www.tsalon.tech';
  const series = await getCollection('eventSeries');
  const events = await getCollection('events', ({ data }) => !data.draft);
  const archiveEvents = await getCollection('activityArchive');
  const talks = await getCollection('talks');
  const recordings = await getCollection('recordings');
  const articles = await getCollection('articles', ({ data }) => !data.draft);
  const latestUpdate = [
    ...articles.map((entry) => entry.data.updatedAt ?? entry.data.publishedAt),
    ...archiveEvents.map((entry) => entry.data.startDate),
    ...events.map((entry) => entry.data.startDate),
  ].reduce((latest, current) => (current.getTime() > latest.getTime() ? current : latest), new Date(0));
  const body = {
    name: 'T Salon',
    description: '面向开发者的线上与线下技术交流平台',
    language: 'zh-CN',
    updated: latestUpdate.toISOString().slice(0, 10),
    pages: {
      events: `${origin}/events/`,
      content: `${origin}/articles/`,
      recordings: `${origin}/recordings/`,
      about: `${origin}/about/`,
      history: `${origin}/history/`,
      join: `${origin}/about/#join`,
      tokenrank: `${origin}/tokenrank/`,
      tokenrankMethodology: `${origin}/tokenrank/methodology/`,
      tokenrankStatsJson: `${origin}/tokenrank/stats.json`,
      whenreset: `${origin}/whenreset/`,
      whenresetCodex: `${origin}/whenreset/codex/`,
      whenresetClaude: `${origin}/whenreset/claude/`,
      whenresetGrok: `${origin}/whenreset/grok/`,
      calculator: `${origin}/calculator/`,
      errors: `${origin}/errors/`,
    },
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
    content: articles.map((entry) => ({ id: entry.id, type: entry.data.type, title: entry.data.title, summary: entry.data.summary, topics: entry.data.topics, publishedAt: entry.data.publishedAt.toISOString(), updatedAt: (entry.data.updatedAt ?? entry.data.publishedAt).toISOString(), url: `${origin}/articles/${entry.id}/`, relatedRecordings: entry.data.relatedRecordings.map(ref => `${origin}/recordings/${ref.id}/`) })),
    recordings: recordings.map(entry => ({
      id: entry.id, type: 'video-archive', title: entry.data.title, summary: entry.data.summary,
      series: entry.data.series, guests: entry.data.guests, topics: entry.data.topics, eventDate: entry.data.eventDate,
      archivePublishedAt: entry.data.uploadedAt, durationSeconds: entry.data.durationSeconds,
      url: `${origin}/recordings/${entry.id}/`, videoParts: entry.data.videoParts,
      relatedArticles: articles.filter(article => !article.data.seo.noindex && article.data.relatedRecordings.some(ref => ref.id === entry.id)).map(article => `${origin}/articles/${article.id}/`),
    })),
    videoArchive: talks.map((entry) => ({ id: entry.id, type: 'video-interview', title: entry.data.title, summary: entry.data.summary, guest: entry.data.speaker, series: entry.data.series, episode: entry.data.episode, topics: entry.data.topics, url: `${origin}/articles/${entry.id}/`, sourceUrl: entry.data.videoUrl, uploadedAt: entry.data.uploadedAt, videoParts: entry.data.videoParts })),
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
