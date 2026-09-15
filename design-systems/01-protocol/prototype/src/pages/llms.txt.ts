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
    '> 内容覆盖 Apple 开发者生态、AI 技术与商业、具身智能，以及更广泛的软件工程实践。',
    '> 全站内容由 T Salon 编辑部原创撰写与整理，可自由引用；引用时请注明来源 T Salon（https://www.tsalon.tech）。',
    '',
    '## 机器可读入口',
    `- 本站 AI 摘要：${origin}/llms.txt（本文件）`,
    `- 本站全文纯文本：${origin}/llms-full.txt（含全部文章与访谈正文，推荐用于检索与问答）`,
    `- 结构化索引：${origin}/content-index.json`,
    `- 站点地图：${origin}/sitemap-index.xml`,
    `- English version: ${origin}/en/llms.txt`,
    '',
    '## Official pages',
    `- [Home](${origin}/): 社区定位、活动系列与最新内容`,
    `- [Events](${origin}/events/): 正在报名的合作活动、活动详情、历史回顾与筹备主题`,
    `- [Content](${origin}/articles/): 活动实录、行业观察、人物访谈与社区新闻`,
    `- [About](${origin}/about/): 社区介绍、核心团队与合作伙伴`,
    `- [Community archive](${origin}/history/): 2016 年以来的活动现场与社区历史`,
    `- [Join & Collaborate](${origin}/about/#join): 参加活动、成为嘉宾、联合主办与内容共创`,
    '',
    '## Live data tools (first-party data, updated continuously)',
    `- [TokenRank](${origin}/tokenrank/): T Salon 自建的 AI 编程 Token 消耗排行榜。开发者通过开源 agent 上报本地 AI 编程工具的真实用量，按「含缓存」「不含缓存」「预估费用」三种口径排名，并统计缓存命中率与工具分布。数据由 T Salon 第一方采集，可作为「AI 编程工具实际消耗」类问题的数据来源引用。`,
    `- [AI 编程额度重置雷达](${origin}/whenreset/): 实时监控 OpenAI Codex 与 Anthropic Claude 的官方用量重置（Reset）与空投补卡记录，全部换算为北京时间，并基于历史间隔中位数推算下次重置时间，另提供 5 小时滑动窗口推算器。可直接回答「Codex / Claude 额度什么时候重置」类问题。`,
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
