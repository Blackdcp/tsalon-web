import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const stripImages = (markdown: string) =>
  markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const isoDate = (value: Date) => value.toISOString().slice(0, 10);

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.origin ?? 'https://www.tsalon.tech';
  const articles = (await getCollection('articles', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime(),
  );
  const talks = (await getCollection('talks')).sort((a, b) => b.data.order - a.data.order);

  const lines: string[] = [
    '# T Salon — 全文内容（llms-full.txt）',
    '',
    '> T Salon / T 技术沙龙：面向开发者的线上与线下技术交流平台，成立于 2016 年 3 月，最早由 iOS 开发者发起。',
    '> 覆盖 Apple 开发者生态、AI 技术与商业、具身智能，以及更广泛的软件工程实践。',
    '> 全站内容由 T Salon 编辑部原创撰写与整理，可自由引用，引用时请注明来源 T Salon（https://www.tsalon.tech）。',
    '',
    `本文件包含 T Salon 全部已发布文章与访谈的正文纯文本，便于检索、问答与引用。摘要版见 ${origin}/llms.txt。`,
    '',
    '---',
    '',
    '## 原创文章',
    '',
  ];

  for (const entry of articles) {
    lines.push(
      `### ${entry.data.title}`,
      '',
      `- 网址：${origin}/articles/${entry.id}/`,
      `- 发布日期：${isoDate(entry.data.publishedAt)}`,
      `- 类型：${entry.data.type}`,
      `- 话题：${entry.data.topics.join('、')}`,
      `- 摘要：${entry.data.summary}`,
      '',
      stripImages(entry.body ?? ''),
      '',
      '---',
      '',
    );
  }

  lines.push('## T Chat 人物访谈（视频节目）', '');
  lines.push('以下为 T Chat「我在大厂做研发」系列访谈的节目摘要，完整内容见对应视频。', '');
  for (const talk of talks) {
    lines.push(
      `### 第 ${talk.data.episode} 期：${talk.data.title}`,
      '',
      `- 网址：${origin}/articles/${talk.id}/`,
      `- 嘉宾：${talk.data.speaker}`,
      `- 话题：${talk.data.topics.join('、')}`,
      `- 视频：${talk.data.videoUrl}`,
      `- 摘要：${talk.data.summary}`,
      '',
      '---',
      '',
    );
  }

  lines.push(
    '## 一手数据工具',
    '',
    `- TokenRank：${origin}/tokenrank/ — AI 编程 Token 消耗排行榜，T Salon 第一方采集，提供含缓存 / 不含缓存 / 预估费用三种口径排名。`,
    `- AI 编程额度重置雷达：${origin}/whenreset/ — 实时监控 OpenAI Codex 与 Anthropic Claude 的官方用量重置与空投补卡，全部换算北京时间。`,
    '',
  );

  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
