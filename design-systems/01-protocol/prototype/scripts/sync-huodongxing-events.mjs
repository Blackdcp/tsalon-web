import { access, mkdir, readFile, writeFile } from 'node:fs/promises';

const dataFile = new URL('../src/data/activity-archive.json', import.meta.url);
const eventAssetDir = new URL('../public/images/events/content/', import.meta.url);
const allowedSourceIds = new Set([
  '7732324341700',
  '3711187585200',
  '6704677921900',
  '1703870201300',
  '4704118639500',
  '8699104705200',
]);
const blockedTerms = ['区块链'];
const summaryOverrides = {
  '7732324341700': '货拉拉质量保障部年度 Open Day，聚焦录制回放在 Java、C++、App 与小程序中的实践，并邀请得物、携程测试专家共同分享。',
  '3711187585200': '货拉拉移动团队与行业嘉宾围绕 Android 功耗、云真机、动态路由、AI 与出海开发，分享移动技术的一线实践。',
  '6704677921900': 'T 技术沙龙在深圳发起的 ChatGPT 开发者实践日，邀请 GPT 领域专家、开发者与跨界实践者讨论大模型应用的机遇与挑战。',
  '1703870201300': 'T 技术沙龙在北京发起的 WWDC 之夜，与本地开发者一起关注 Apple 开发者大会并交流新技术带来的变化。',
  '4704118639500': 'T 技术沙龙在深圳发起的 WWDC 之夜，与本地开发者一起关注 Apple 开发者大会并交流新技术带来的变化。',
  '8699104705200': 'T 技术沙龙在上海发起的 Prompt Engineering 实践日，围绕大模型应用、开源项目与提示工程的真实实践展开分享。',
};
const allowedTags = new Set([
  'a', 'b', 'blockquote', 'br', 'em', 'figcaption', 'figure', 'h2', 'h3', 'h4',
  'img', 'li', 'ol', 'p', 'section', 'strong', 'table', 'tbody', 'td', 'th',
  'thead', 'tr', 'ul',
]);

const decodeEntities = (value) => value
  .replaceAll('&nbsp;', ' ')
  .replaceAll('&amp;', '&')
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));

const escapeAttribute = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const escapeText = (value) => escapeAttribute(value).replaceAll('&quot;', '"');

const textFromHtml = (value) => decodeEntities(value
  .replace(/<br \/?>/gi, ' ')
  .replace(/<[^>]+>/g, ' '))
  .replace(/\s+/g, ' ')
  .trim();

const getAttribute = (source, name) => {
  const match = source.match(new RegExp(`\\s${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match?.[2]?.trim() ?? '';
};

const safeUrl = (value) => {
  if (!value) return '';
  const normalized = value
    .replace(/^\/\//, 'https://')
    .replace(/^http:\/\//, 'https://');
  return /^https:\/\//i.test(normalized) ? normalized : '';
};

function sanitizeContent(source) {
  const withoutUnsafeBlocks = source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed|form)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(input|button|textarea|select)\b[^>]*\/?\s*>/gi, '');

  const sanitized = withoutUnsafeBlocks.replace(/<\/?([a-z0-9-]+)\b([^>]*)>/gi, (full, rawTag, attributes) => {
    const tag = rawTag.toLowerCase();
    if (!allowedTags.has(tag)) return '';
    if (full.startsWith('</')) return tag === 'br' || tag === 'img' ? '' : `</${tag}>`;
    if (tag === 'br') return '<br />';
    if (tag === 'img') {
      const src = safeUrl(getAttribute(attributes, 'src') || getAttribute(attributes, 'data-src'));
      if (!src) return '';
      const alt = getAttribute(attributes, 'alt') || getAttribute(attributes, 'title') || '活动现场资料';
      return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}" loading="lazy" />`;
    }
    if (tag === 'a') {
      const href = safeUrl(getAttribute(attributes, 'href'));
      return href
        ? `<a href="${escapeAttribute(href)}" target="_blank" rel="noreferrer">`
        : '<a>';
    }
    return `<${tag}>`;
  });

  return sanitized
    .replace(/<p>\s*(?:<br \/?>)?\s*<\/p>/gi, '')
    .replace(/(?:<br \/?>\s*){3,}/gi, '<br /><br />')
    .trim();
}

function makeSummary(contentHtml, fallback) {
  const plainText = decodeEntities(contentHtml
    .replace(/<img\b[^>]*>/gi, ' ')
    .replace(/<br \/?>/gi, '。')
    .replace(/<\/p>/gi, '。')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .replace(/。{2,}/g, '。')
    .trim();
  if (!plainText) return fallback;
  const withoutRepeatedTitle = plainText.startsWith(fallback) ? plainText.slice(fallback.length).trim() : plainText;
  return (withoutRepeatedTitle || plainText).slice(0, 180).replace(/[，、；：\s]+$/, '') + '。';
}

function addImageClass(contentHtml, className, matchesAlt) {
  return contentHtml.replace(/<img\b([^>]*?)\s*\/>/gi, (full, attributes) => {
    const alt = getAttribute(attributes, 'alt');
    if (!matchesAlt(alt) || /\sclass\s*=/i.test(attributes)) return full;
    return `<img${attributes} class="${className}" />`;
  });
}

function removeStandaloneImages(contentHtml, matchesAlt) {
  return contentHtml.replace(/<p>\s*(?:<strong>\s*)?(<img\b[^>]*\/>)(?:\s*<\/strong>)?\s*<\/p>/gi, (full, image) => {
    const alt = getAttribute(image, 'alt');
    return matchesAlt(alt) ? '' : full;
  });
}

function normalizeImportedMarkup(contentHtml) {
  const majorHeading = /^[一二三四五六七八九十]+、/;
  const sectionHeading = /^(活动流程|日程安排|活动亮点|关于主办方|时间地点|温馨提示)$/;
  const partnerHeading = /^(主办方|联合主办方|场地合作方|合作社区|特别鸣谢：?)$/;

  return contentHtml
    .replace(/<\/?section>/gi, '')
    .replace(/<strong>\s*<\/strong>/gi, '')
    .replace(/<p>\s*(?:<strong>\s*)?(?:(?:<br \/?>)|\s|&nbsp;)*(?:<\/strong>\s*)?<\/p>/gi, '')
    .replace(/<p>\s*(?:<br \/?>\s*)+/gi, '<p>')
    .replace(/(?:<br \/?>\s*)+<\/p>/gi, '</p>')
    .replace(/<p>([\s\S]*?)<\/p>/gi, (_, inner) => {
      if (/<img\b/i.test(inner)) return `<p>${inner.trim()}</p>`;
      const text = textFromHtml(inner);
      if (!text) return '';
      if (majorHeading.test(text) || sectionHeading.test(text)) return `<h2>${escapeText(text)}</h2>`;
      if (partnerHeading.test(text)) return `<h3 class="event-partner-heading">${escapeText(text)}</h3>`;
      if (/^\d{2}$/.test(text)) return `<p class="event-section-number mono">${escapeText(text)} /</p>`;
      if (/^亮点\d+[：:]/.test(text)) return `<h3 class="event-highlight-heading">${escapeText(text)}</h3>`;
      if (/^(上海会场报名已满|受台风)/.test(text)) return `<p class="event-notice">${escapeText(text)}</p>`;

      const fact = text.match(/^(会议时间|会议形式|会议费用|会议地点)[：:]\s*(.+)$/);
      if (fact) {
        return `<p class="event-fact-line"><strong>${escapeText(fact[1])}</strong><span>${escapeText(fact[2])}</span></p>`;
      }
      return `<p>${inner.trim()}</p>`;
    })
    .replace(/(?:<br \/?>\s*){2,}/gi, '<br />')
    .trim();
}

function buildSpeakerGrid(contentHtml) {
  const heading = contentHtml.match(/<h2>三、本场嘉宾[^<]*<\/h2>/i);
  if (!heading || heading.index === undefined) return contentHtml;
  const bodyStart = heading.index + heading[0].length;
  const closingHeading = contentHtml.slice(bodyStart).match(/<h2>五、[^<]*<\/h2>/i);
  const bodyEnd = closingHeading?.index === undefined ? contentHtml.length : bodyStart + closingHeading.index;
  const body = contentHtml.slice(bodyStart, bodyEnd);
  const avatarPattern = /<p>\s*(?:<strong>\s*)?(<img\b[^>]*class="event-speaker-avatar"[^>]*\/>)(?:\s*<\/strong>)?\s*<\/p>/gi;
  const avatars = [...body.matchAll(avatarPattern)];
  if (avatars.length < 2) return contentHtml;

  const cards = avatars.map((avatar, index) => {
    const start = (avatar.index ?? 0) + avatar[0].length;
    const end = index + 1 < avatars.length ? (avatars[index + 1].index ?? body.length) : body.length;
    const details = [...body.slice(start, end).matchAll(/<p>([\s\S]*?)<\/p>/gi)]
      .map((match) => textFromHtml(match[1]))
      .filter(Boolean);
    const topicLabelIndex = details.findIndex((item) => item === '分享主题');
    const name = details[0] ?? '分享嘉宾';
    const role = details[1] ?? '';
    const topic = topicLabelIndex >= 0 ? details[topicLabelIndex + 1] ?? '' : '';
    const bioStart = topicLabelIndex >= 0 ? topicLabelIndex + 2 : 2;
    const bio = details.slice(bioStart).join(' ').replace(/^(?:嘉宾)?简介[：:]\s*/, '');

    return `<article class="event-speaker-card">
      <figure>${avatar[1]}</figure>
      <div class="event-speaker-copy">
        <span class="mono">GUEST SPEAKER</span>
        <h3>${escapeText(name)}</h3>
        ${role ? `<p class="event-speaker-role">${escapeText(role)}</p>` : ''}
        ${topic ? `<div class="event-speaker-topic"><span>分享主题</span><h4>${escapeText(topic)}</h4></div>` : ''}
        ${bio ? `<p class="event-speaker-bio">${escapeText(bio)}</p>` : ''}
      </div>
    </article>`;
  });

  return `${contentHtml.slice(0, bodyStart)}<section class="event-speaker-grid" aria-label="活动嘉宾">${cards.join('')}</section>${contentHtml.slice(bodyEnd)}`;
}

function buildAgenda(contentHtml) {
  const agendaHeading = '<h2>日程安排</h2>';
  const start = contentHtml.indexOf(agendaHeading);
  if (start < 0) return contentHtml;
  const bodyStart = start + agendaHeading.length;
  const nextHeading = contentHtml.slice(bodyStart).match(/<h2>活动亮点<\/h2>/i);
  if (!nextHeading || nextHeading.index === undefined) return contentHtml;
  const bodyEnd = bodyStart + nextHeading.index;
  const entries = [...contentHtml.slice(bodyStart, bodyEnd).matchAll(/<p>([\s\S]*?)<\/p>/gi)]
    .map((match) => textFromHtml(match[1]))
    .filter(Boolean);
  if (entries.length < 3) return contentHtml;

  const rows = entries.map((entry) => {
    const timed = entry.match(/^(\d{1,2}[：:]\d{2}(?:\s*[-—~]\s*\d{1,2}[：:]\d{2})?)\s*(.*)$/);
    if (!timed) return `<li class="is-break"><span></span><strong>${escapeText(entry)}</strong></li>`;
    const time = timed[1].replaceAll('：', ':').replace(/\s+/g, ' ');
    const detail = timed[2].trim();
    const speaker = detail.match(/^(.*?)(?:\s*-{2,}\s*)(.+)$/);
    const title = speaker ? speaker[1].trim() : detail;
    return `<li><time>${escapeText(time)}</time><div><strong>${escapeText(title)}</strong>${speaker ? `<span>${escapeText(speaker[2].trim())}</span>` : ''}</div></li>`;
  });

  return `${contentHtml.slice(0, bodyStart)}<ol class="event-agenda-list">${rows.join('')}</ol>${contentHtml.slice(bodyEnd)}`
    .replace('<h2>活动流程</h2>', '');
}

async function cacheRemoteImages(event) {
  const remoteUrls = [...new Set(
    [...event.contentHtml.matchAll(/src="(https:\/\/[^\"]+)"/gi)].map((match) => match[1]),
  )];
  if (!remoteUrls.length) return;
  await mkdir(eventAssetDir, { recursive: true });

  const replacements = await Promise.all(remoteUrls.map(async (remoteUrl) => {
    const originalName = new URL(remoteUrl).pathname.split('/').pop() || 'image.jpg';
    const safeName = originalName.replace(/[^a-z0-9._-]/gi, '-');
    const filename = `${event.sourceId}-${safeName}`;
    const fileUrl = new URL(filename, eventAssetDir);
    const publicUrl = `/images/events/content/${filename}`;
    try {
      await access(fileUrl);
      return [remoteUrl, publicUrl];
    } catch {
      // Download below when the image has not been cached yet.
    }
    try {
      const response = await fetch(remoteUrl, {
        headers: { 'user-agent': 'Mozilla/5.0 TSalonStaticContentSync/1.0' },
      });
      if (!response.ok) return [remoteUrl, remoteUrl];
      await writeFile(fileUrl, Buffer.from(await response.arrayBuffer()));
      return [remoteUrl, publicUrl];
    } catch {
      return [remoteUrl, remoteUrl];
    }
  }));

  for (const [remoteUrl, publicUrl] of replacements) {
    event.contentHtml = event.contentHtml.replaceAll(remoteUrl, publicUrl);
  }
}

function transformEventContent(event, contentHtml) {
  let transformed = contentHtml;
  if (transformed.includes('class="event-')) {
    if (event.sourceId === '3711187585200') {
      transformed = removeStandaloneImages(transformed, (alt) => alt === '20230721-102558.jpeg');
    }
    if (event.sourceId === '7732324341700') {
      transformed = removeStandaloneImages(transformed, (alt) => alt === '活动行-封面.jpeg');
    }
    return transformed;
  }
  if (event.sourceId === '6704677921900' || event.sourceId === '8699104705200') {
    transformed = transformed.replace(
      /<p>(?:<strong>)?四、合作方式(?:<\/strong>)?(?:<br \/>)?<\/p>[\s\S]*?(?=<p>(?:<strong>)?五、历届回顾)/i,
      '',
    );
  }
  if (event.sourceId === '6704677921900') {
    const speakerImages = new Set(['华哥2.jpg', '财2.jpg', '匡3.jpg', '杨帆.jpg']);
    transformed = addImageClass(transformed, 'event-speaker-avatar', (alt) => speakerImages.has(alt));
  }
  if (event.sourceId === '8699104705200') {
    transformed = addImageClass(transformed, 'event-speaker-avatar', (alt) => /^图片 [12]\.jpg$/.test(alt));
  }
  if (event.sourceId === '3711187585200') {
    transformed = addImageClass(transformed, 'event-gift-image', (alt) => alt !== '20230721-102558.jpeg');
    transformed = transformed.replace(/<p>([\s\S]*?)<\/p>/gi, (full, inner) => {
      if (!inner.includes('event-gift-image')) return full;
      const images = [...inner.matchAll(/<img\b[^>]*event-gift-image[^>]*\/>/gi)].map((match) => match[0]);
      return images.length ? `<figure class="event-gift-gallery">${images.join('')}</figure>` : full;
    });
  }
  if (event.sourceId === '3711187585200') {
    transformed = removeStandaloneImages(transformed, (alt) => alt === '20230721-102558.jpeg');
  }
  if (event.sourceId === '7732324341700') {
    transformed = removeStandaloneImages(transformed, (alt) => alt === '活动行-封面.jpeg');
  }
  transformed = addImageClass(transformed, 'event-long-poster', (alt) => /线下观影活动长图/i.test(alt));
  transformed = addImageClass(transformed, 'event-agenda-image', (alt) => /议程/i.test(alt));
  transformed = addImageClass(transformed, 'event-partner-image', (alt) => /主办方|场地|hezuofang|合作/i.test(alt));
  transformed = addImageClass(transformed, 'event-content-image', () => true);
  transformed = normalizeImportedMarkup(transformed);
  if (event.sourceId === '6704677921900' || event.sourceId === '8699104705200') {
    transformed = buildSpeakerGrid(transformed);
  }
  if (event.sourceId === '3711187585200') transformed = buildAgenda(transformed);
  return transformed;
}

const current = JSON.parse(await readFile(dataFile, 'utf8'));
const retained = current
  .filter((event) => allowedSourceIds.has(event.sourceId))
  .filter((event) => !blockedTerms.some((term) => `${event.title} ${event.address}`.includes(term)))
  .sort((a, b) => a.order - b.order);

for (const event of retained) {
  let match;
  for (const suffix of ['?layout=CN', '?qd=961165319323', '?layout=EN']) {
    let response;
    try {
      response = await fetch(`${event.sourceUrl}${suffix}`, {
        headers: { 'user-agent': 'Mozilla/5.0 TSalonStaticContentSync/1.0' },
      });
    } catch {
      continue;
    }
    if (!response.ok) continue;
    const page = await response.text();
    match = page.match(/<script[^>]*id=['"]tpContent['"][^>]*>([\s\S]*?)<\/script>/i);
    if (match) break;
  }
  if (!match && !event.contentHtml) throw new Error(`${event.title}: 未找到活动正文 tpContent`);
  if (match) event.contentHtml = sanitizeContent(match[1]);
  event.contentHtml = transformEventContent(event, event.contentHtml);
  await cacheRemoteImages(event);
  event.summary = summaryOverrides[event.sourceId] ?? makeSummary(event.contentHtml, event.title);
}

await writeFile(dataFile, `${JSON.stringify(retained, null, 2)}\n`, 'utf8');
console.log(`已同步 ${retained.length} 场非区块链活动的站内详情正文。`);
