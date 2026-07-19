import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const seoFields = z.object({
  title: z.string().max(65),
  description: z.string().min(50).max(180),
  noindex: z.boolean().default(false),
});

const people = defineCollection({
  loader: glob({ base: './src/content/people', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    organization: z.string().optional(),
    bio: z.string().min(30),
    avatar: z.string(),
    links: z.object({
      website: z.url().optional(),
      github: z.url().optional(),
    }).optional(),
  }),
});

const events = defineCollection({
  loader: glob({ base: './src/content/events', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().min(40).max(220),
    number: z.number().int().positive().optional(),
    series: z.string(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    timezone: z.string().default('Asia/Shanghai'),
    city: z.string().optional(),
    venue: z.string().optional(),
    address: z.string().optional(),
    attendanceMode: z.enum(['offline', 'online', 'hybrid']),
    format: z.enum(['salon', 'conference', 'livestream', 'workshop', 'roundtable']),
    capacity: z.number().int().positive().optional(),
    topics: z.array(z.string()).min(1),
    formats: z.array(z.string()).min(1),
    cover: z.string(),
    coverAlt: z.string().min(10),
    speakers: z.array(reference('people')).default([]),
    registration: z.object({
      status: z.enum(['open', 'waitlist', 'closed', 'archived']),
      url: z.url().optional(),
      deadline: z.coerce.date().optional(),
      seatsLeft: z.number().int().nonnegative().optional(),
    }),
    agenda: z.array(z.object({
      time: z.string(),
      title: z.string(),
      description: z.string(),
    })).default([]),
    faq: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(true),
    seo: seoFields,
  }),
});

const eventsEn = defineCollection({
  loader: glob({ base: './src/content/events-en', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(), summary: z.string().min(40).max(300), number: z.number().int().positive().optional(), series: z.string(),
    startDate: z.coerce.date(), endDate: z.coerce.date(), timezone: z.string().default('Asia/Shanghai'), city: z.string().optional(),
    venue: z.string().optional(), address: z.string().optional(), attendanceMode: z.enum(['offline', 'online', 'hybrid']),
    format: z.enum(['salon', 'conference', 'livestream', 'workshop', 'roundtable']), capacity: z.number().int().positive().optional(),
    topics: z.array(z.string()).min(1), formats: z.array(z.string()).min(1), cover: z.string(), coverAlt: z.string().min(10),
    speakers: z.array(reference('people')).default([]),
    registration: z.object({ status: z.enum(['open', 'waitlist', 'closed', 'archived']), url: z.url().optional(), deadline: z.coerce.date().optional(), seatsLeft: z.number().int().nonnegative().optional() }),
    agenda: z.array(z.object({ time: z.string(), title: z.string(), description: z.string() })).default([]),
    faq: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
    featured: z.boolean().default(false), draft: z.boolean().default(true), translationOf: z.string(),
    translationStatus: z.enum(['draft', 'reviewed']).default('draft'), seo: seoFields,
  }),
});

const articles = defineCollection({
  loader: glob({ base: './src/content/articles', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().min(40).max(220),
    type: z.enum(['field-note', 'interview', 'guide', 'archive', 'news']),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    readingMinutes: z.number().int().positive(),
    author: reference('people'),
    topics: z.array(z.string()).min(1),
    relatedEvents: z.array(reference('events')).default([]),
    cover: z.string(),
    coverAlt: z.string().min(10),
    citations: z.array(z.object({
      label: z.string(),
      url: z.url(),
    })).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(true),
    seo: seoFields,
  }),
});

const articlesEn = defineCollection({
  loader: glob({ base: './src/content/articles-en', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().min(40).max(300),
    type: z.enum(['field-note', 'interview', 'guide', 'archive', 'news']),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    readingMinutes: z.number().int().positive(),
    author: reference('people'),
    topics: z.array(z.string()).min(1),
    relatedEvents: z.array(z.string()).default([]),
    cover: z.string(),
    coverAlt: z.string().min(10),
    citations: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(true),
    translationOf: z.string(),
    translationStatus: z.enum(['draft', 'reviewed']).default('draft'),
    seo: seoFields,
  }),
});

const talks = defineCollection({
  loader: file('./src/data/talks.json'),
  schema: z.object({
    episode: z.number().int().positive(),
    series: z.string(),
    title: z.string(),
    speaker: z.string(),
    summary: z.string(),
    cover: z.string(),
    coverAlt: z.string(),
    videoUrl: z.url(),
    topics: z.array(z.string()),
    contentType: z.literal('interview').default('interview'),
    mode: z.literal('online').default('online'),
    seriesId: z.literal('t-chat').default('t-chat'),
    featured: z.boolean().default(false),
    order: z.number().int(),
  }),
});

const eventSeries = defineCollection({
  loader: file('./src/data/series.json'),
  schema: z.object({
    number: z.string(),
    name: z.string(),
    englishName: z.string(),
    shortDescription: z.string(),
    description: z.string(),
    status: z.enum(['active', 'archive']),
    modes: z.array(z.enum(['offline', 'online', 'hybrid'])),
    format: z.string(),
    cadence: z.string(),
    topics: z.array(z.string()),
    accent: z.string(),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    order: z.number().int(),
  }),
});

const activityArchive = defineCollection({
  loader: file('./src/data/activity-archive.json'),
  schema: z.object({
    sourceId: z.string(),
    title: z.string(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    province: z.string(),
    city: z.string(),
    address: z.string(),
    cover: z.string(),
    coverAlt: z.string(),
    sourceUrl: z.url(),
    sourceName: z.string(),
    organizer: z.string(),
    status: z.literal('ended'),
    mode: z.enum(['offline', 'online']),
    order: z.number().int(),
    summary: z.string().min(20),
    contentHtml: z.string().min(20),
  }),
});

const team = defineCollection({
  loader: file('./src/data/team.json'),
  schema: z.object({
    name: z.string(),
    handle: z.string().optional(),
    role: z.string(),
    bio: z.string(),
    avatar: z.string(),
    avatarAlt: z.string(),
    order: z.number().int(),
  }),
});

const partners = defineCollection({
  loader: file('./src/data/partners.json'),
  schema: z.object({
    name: z.string(),
    logo: z.string(),
    logoAlt: z.string(),
    type: z.enum(['company', 'community', 'publisher', 'media']),
    order: z.number().int(),
  }),
});

const gallery = defineCollection({
  loader: file('./src/data/gallery.json'),
  schema: z.object({
    title: z.string(),
    caption: z.string(),
    cover: z.string(),
    coverAlt: z.string(),
    year: z.number().int(),
    month: z.number().int().min(1).max(12).optional(),
    city: z.string().optional(),
    sourceUrl: z.url().optional(),
    order: z.number().int(),
  }),
});

export const collections = { people, events, eventsEn, activityArchive, articles, articlesEn, talks, gallery, eventSeries, team, partners };
