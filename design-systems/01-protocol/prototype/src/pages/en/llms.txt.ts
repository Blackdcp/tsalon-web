import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { archiveEn, talkSpeakerEn, talkTitleEn } from '../../data/en';
import topics from '../../data/topics.json';
import { topicSlugFor } from '../../lib/topics';

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
    '> This collection includes community records and analysis of published technical material. Preserve the attribution and original sources listed in each article; see the site terms for reuse.',
    '',
    '## Machine-readable entry points',
    `- Site summary for AI: ${origin}/en/llms.txt (this file)`,
    `- Article plain text: ${origin}/en/llms-full.txt (published articles and a video directory)`,
    `- Structured index: ${origin}/en/content-index.json`,
    `- Sitemap: ${origin}/sitemap-index.xml`,
    `- Chinese version: ${origin}/llms.txt`,
    '',
    '## Primary pages',
    `- [Home](${origin}/en/): Community positioning, event series and latest content`,
    `- [Events](${origin}/en/events/): Upcoming and past developer gatherings`,
    `- [Stories](${origin}/en/articles/): Field notes, interviews and observations from practitioners`,
    `- [About](${origin}/en/about/): History, core team and partners`,
    `- [Community archive](${origin}/en/history/): A visual archive of the community since 2016`,
    '',
    '## Community tools',
    `- [TokenRank](${origin}/en/tokenrank/): AI coding usage reported by community contributors through an open-source client, with rankings by total tokens, tokens excluding cache, and estimated cost. Read the [methodology and limitations](${origin}/en/tokenrank/methodology/) when citing the data; machine-readable aggregate stats: ${origin}/tokenrank/stats.json.`,
    `- [WhenReset](${origin}/en/whenreset/): Collected Codex, Claude, and Grok quota reset schedules and notices, with Beijing time conversion and estimates based on historical records. Estimates are not official commitments; check the product for your account's quota status.`,
    `  - [OpenAI Codex Quota Reset Radar](${origin}/en/whenreset/codex/): Codex global reset and bonus card records, cadence reference, and 5-hour window calculator.`,
    `  - [Anthropic Claude Quota Reset Radar](${origin}/en/whenreset/claude/): Claude and Claude Code 5-hour rolling window recovery calculator, weekly pacing planner, and event records.`,
    `  - [xAI Grok Quota Reset Radar](${origin}/en/whenreset/grok/): Grok and SuperGrok reset event tracker and window calculator.`,
    `  - [Google Gemini & Antigravity Quota Reset Radar](${origin}/en/whenreset/google/): Google AI Studio and Gemini CLI daily Midnight PT (15:00 PDT / 16:00 PST UTC+8) RPD reset countdown, Antigravity per-model pool rules, and 5-hour window calculator.`,
    `  - [Claude 5-Hour Rolling Window Calculator](${origin}/en/whenreset/claude-5-hour-calculator/): Single-purpose recovery time calculator for Claude Pro, Max, and Claude Code.`,
    `  - [Cursor 500 Fast Requests Calculator](${origin}/en/whenreset/cursor-fast-requests/): Daily burn-rate and pacing calculator for Cursor 30-day Fast Requests.`,
    `  - [2026 AI Coding Subscription Quotas & Reset Master Cheat Sheet](${origin}/en/whenreset/quotas/): Unified reference table of 5-hour rolling windows, 7-day caps, Midnight PT daily resets, and API rate tiers across Claude, OpenAI Codex, Google Gemini & Antigravity, and Cursor.`,
    `- [AI Coding Tools, Quotas & Subscription Comparison Hub](${origin}/en/compare/): Side-by-side comparison matrices for Claude Code vs Codex vs Cursor vs Antigravity, Claude Pro vs Max, and ChatGPT Plus vs Pro.`,
    `- [Token-Saving & High-Cache-Hit AI Coding Config Templates](${origin}/en/templates/): Copy-ready CLAUDE.md, AGENTS.md, .cursorrules, and WhenReset .mcp.json templates engineered for 85%+ prompt cache stability.`,
    `- [AI Coding Cost & Subscription Calculator](${origin}/en/calculator/): Estimate monthly API-equivalent bills across Claude, Codex, Cursor, DeepSeek, and Gemini from daily token volume and cache hit rate vs $20/$100/$200 flat-rate plans.`,
    `- [2026 AI Coding Token & Cache Benchmark Report](${origin}/en/reports/): First-party telemetry and 8-model standardized cost benchmark report from T Salon TokenRank.`,
    `- [AI Coding Rate-Limit & Cost Error Wiki](${origin}/en/errors/): Troubleshooting guides for Claude 5-hour limits, weekly caps, Codex reset cards, cache misses, and Cursor fast requests.`,
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
      .filter((topic) => articles.filter((entry) => entry.data.topics.some((tag) => topicSlugFor(tag) === topic.slug)).length >= 2)
      .map((topic) => {
        const count = articles.filter((entry) => entry.data.topics.some((tag) => topicSlugFor(tag) === topic.slug)).length;
        return `- [${topic.name}](${origin}/en/topics/${topic.slug}/): ${topic.description} (${count} stories)`;
      }),
    '',
    '## T Chat video interviews (recorded in Chinese)',
    ...talks.flatMap((entry) => [
      `- [Episode ${entry.data.episode}: ${talkTitleEn[entry.id]}](${origin}/articles/${entry.id}/) — Guest: ${talkSpeakerEn[entry.id]}.`,
      ...entry.data.videoParts.map((part, index) => `  - [Video part ${index + 1} (Chinese)](${part.url}) · Uploaded ${part.uploadedAt.slice(0, 10)} · ${part.durationSeconds} seconds`),
    ]),
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
