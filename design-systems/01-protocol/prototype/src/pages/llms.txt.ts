import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import topics from '../data/topics.json';
import { topicSlugFor } from '../lib/topics';

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.origin ?? 'https://www.tsalon.tech';
  const series = (await getCollection('eventSeries')).sort((a, b) => a.data.order - b.data.order);
  const events = (await getCollection('events', ({ data }) => !data.draft)).sort((a, b) => b.data.startDate.getTime() - a.data.startDate.getTime());
  const archiveEvents = (await getCollection('activityArchive')).sort((a, b) => a.data.order - b.data.order);
  const articles = await getCollection('articles', ({ data }) => !data.draft);
  const talks = (await getCollection('talks')).sort((a, b) => b.data.order - a.data.order);
  const recordings = await getCollection('recordings');
  const lines = [
    '# T Salon / T 技术沙龙',
    '',
    '> T Salon 是面向开发者的线上与线下技术交流平台，成立于 2016 年 3 月，最早由 iOS 开发者发起。',
    '> 内容覆盖 Apple 开发者生态、AI 技术与商业、具身智能，以及更广泛的软件工程实践。',
    '> 内容包括社区记录与技术资料解读。引用时请保留文章署名及其列明的原始来源；使用范围见网站许可说明。',
    '',
    '## 机器可读入口',
    `- 本站 AI 摘要：${origin}/llms.txt（本文件）`,
    `- 本站文章纯文本：${origin}/llms-full.txt（已发布文章正文与视频目录）`,
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
    '## 社区工具',
    `- [TokenRank](${origin}/tokenrank/): 展示社区参与者通过开源客户端上报的 AI 编程用量，提供含缓存、不含缓存与预估费用等统计口径。引用数据时请同时查看[统计口径与局限](${origin}/tokenrank/methodology/)，机器可读聚合接口：${origin}/tokenrank/stats.json。`,
    `- [WhenReset](${origin}/whenreset/): 汇集 Codex、Claude 与 Grok 的额度重置安排和公告，提供北京时间换算及基于历史记录的时间估算。估算不代表官方承诺，个人额度状态以产品内显示为准。`,
    `  - [OpenAI Codex 额度重置雷达](${origin}/whenreset/codex/): Codex 全局重置与发卡记录、历史间隔参考与 5 小时窗口计算。`,
    `  - [Anthropic Claude 额度重置雷达](${origin}/whenreset/claude/): Claude / Claude Code 5 小时滑动窗口计算、周度限额规划与重置记录。`,
    `  - [xAI Grok 额度重置雷达](${origin}/whenreset/grok/): Grok / SuperGrok 配额重置记录与窗口计算。`,
    `- [AI 编程成本与订阅盈亏计算器](${origin}/calculator/): 根据每日 Token 量与 Prompt 缓存命中率对比 Claude、Codex、Gemini 月度 API 账单与 $20/$100/$200 订阅制盈亏。`,
    `- [AI 编程限流与报错速查库](${origin}/errors/): Claude 5 小时限流、周度配额耗尽、Codex 重置卡、缓存失效及 Cursor 500 次请求耗尽的一站式排查指南。`,
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
    '## Topic collections',
    ...topics
      .filter((topic) => articles.filter((entry) => entry.data.topics.some((tag) => topicSlugFor(tag) === topic.slug)).length >= 2)
      .map((topic) => {
        const count = articles.filter((entry) => entry.data.topics.some((tag) => topicSlugFor(tag) === topic.slug)).length;
        return `- [${topic.nameZh}](${origin}/topics/${topic.slug}/): ${topic.descriptionZh}（${count} 篇）`;
      }),
    '',
    '## T Chat video interviews',
    ...talks.flatMap((entry) => [
      `- [第 ${entry.data.episode} 期：${entry.data.title}](${origin}/articles/${entry.id}/) — 嘉宾：${entry.data.speaker}。`,
      ...entry.data.videoParts.map((part) => `  - [${part.title}](${part.url}) · 上传于 ${part.uploadedAt.slice(0, 10)} · ${part.durationSeconds} 秒`),
    ]),
    '',
    '## 录播档案',
    `- [全部录播](${origin}/recordings/): 技术分享、社区活动与合作录播的原片和已发布文字回顾。`,
    ...recordings.flatMap(entry => [
      `- [${entry.data.title}](${origin}/recordings/${entry.id}/): ${entry.data.summary}`,
      ...entry.data.videoParts.map(part => `  - [${part.title}](${part.url}) · 稿件发布于 ${part.uploadedAt.slice(0, 10)} · ${part.durationSeconds} 秒 · 原发布账号：${part.owner.name}`),
      ...articles.filter(article => !article.data.seo.noindex && article.data.relatedRecordings.some(ref => ref.id === entry.id)).map(article => `  - 文字回顾：[${article.data.title}](${origin}/articles/${article.id}/)`),
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
