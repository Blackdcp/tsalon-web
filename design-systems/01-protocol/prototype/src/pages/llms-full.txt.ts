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
  const recordings = await getCollection('recordings');

  const lines: string[] = [
    '# T Salon — 全文内容（llms-full.txt）',
    '',
    '> T Salon / T 技术沙龙：面向开发者的线上与线下技术交流平台，成立于 2016 年 3 月，最早由 iOS 开发者发起。',
    '> 覆盖 Apple 开发者生态、AI 技术与商业、具身智能，以及更广泛的软件工程实践。',
    '> 内容包括社区记录与技术资料解读。引用时请保留文章署名及其列明的原始来源；使用范围见网站许可说明。',
    '',
    `本文件汇集 T Salon 已发布文章正文及访谈视频目录。摘要版见 ${origin}/llms.txt。`,
    '',
    '---',
    '',
    '## 已发布文章',
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
      ...(entry.data.tldr.length > 0
        ? ['- TL;DR：', ...entry.data.tldr.map((point) => `  - ${point}`), '']
        : []),
      stripImages(entry.body ?? ''),
      ...entry.data.citations.map((source) => `- 参考来源：[${source.label}](${source.url})`),
      '',
      ...(entry.data.faq.length > 0
        ? [
            '### 常见问题（FAQ）',
            ...entry.data.faq.flatMap((item) => [`**Q：${item.question}**`, item.answer, '']),
            '',
          ]
        : []),
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
      ...talk.data.videoParts.map((part) => `- 视频分段：[${part.title}](${part.url}) · 上传于 ${part.uploadedAt.slice(0, 10)} · ${part.durationSeconds} 秒`),
      `- 摘要：${talk.data.summary}`,
      '',
      ...(talk.data.takeaways && talk.data.takeaways.length > 0
        ? ['- 核心看点（Key Takeaways）：', ...talk.data.takeaways.map((point) => `  - ${point}`), '']
        : []),
      ...(talk.data.faq && talk.data.faq.length > 0
        ? [
            '#### 常见问答（FAQ）',
            ...talk.data.faq.flatMap((item) => [`**Q：${item.question}**`, item.answer, '']),
            '',
          ]
        : []),
      '---',
      '',
    );
  }

  lines.push('## 录播档案', '');
  for (const recording of recordings) {
    lines.push(
      `### ${recording.data.title}`, '', `- 网址：${origin}/recordings/${recording.id}/`,
      `- 摘要：${recording.data.summary}`,
      ...recording.data.videoParts.map(part => `- 原片：[${part.title}](${part.url}) · 稿件发布于 ${part.uploadedAt.slice(0, 10)} · ${part.durationSeconds} 秒 · 原发布账号：${part.owner.name}`),
      ...articles.filter(article => !article.data.seo.noindex && article.data.relatedRecordings.some(ref => ref.id === recording.id)).map(article => `- 文字回顾：[${article.data.title}](${origin}/articles/${article.id}/)`),
      '', '---', '',
    );
  }

  lines.push(
    '## 社区工具',
    '',
    `- TokenRank：${origin}/tokenrank/ — 社区参与者上报的 AI 编程用量。统计口径与局限：${origin}/tokenrank/methodology/。机器可读聚合接口：${origin}/tokenrank/stats.json。`,
    `- WhenReset：${origin}/whenreset/ — 汇集 Codex、Claude 与 Grok 的额度重置安排、公告与时间估算；个人额度状态以产品内显示为准。`,
    `  - OpenAI Codex 额度重置雷达：${origin}/whenreset/codex/`,
    `  - Anthropic Claude 额度重置雷达：${origin}/whenreset/claude/`,
    `  - xAI Grok 额度重置雷达：${origin}/whenreset/grok/`,
    '',
  );

  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
