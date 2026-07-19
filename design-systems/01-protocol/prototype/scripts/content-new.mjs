import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, all) => {
  if (value.startsWith('--')) pairs.push([value.slice(2), all[index + 1]]);
  return pairs;
}, []));

const type = args.type;
const slug = args.slug;
if (!['article', 'event'].includes(type) || !slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error('Usage: npm run content:new -- --type article|event --slug kebab-case-slug');
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const zhDirectory = resolve(`src/content/${type === 'article' ? 'articles' : 'events'}`);
const enDirectory = resolve(`src/content/${type === 'article' ? 'articles-en' : 'events-en'}`);
const zhTarget = resolve(zhDirectory, `${slug}.md`);
const enTarget = resolve(enDirectory, `${slug}.md`);
if (existsSync(zhTarget) || existsSync(enTarget)) {
  console.error(`Refusing to overwrite an existing Chinese or English draft for: ${slug}`);
  process.exit(1);
}

const articleZh = `---
title: TODO
summary: TODO：用 40—220 字直接说明读者将获得什么，不使用宣传口号，发布前替换本句。
type: field-note
publishedAt: ${today}
readingMinutes: 8
author: editorial-team
topics:
  - TODO
relatedEvents: []
cover: /images/TODO.jpg
coverAlt: TODO：准确描述图片中的人物、场景和活动，发布前替换本句
citations: []
featured: false
draft: true
seo:
  title: TODO
  description: TODO：用 50—180 字说明页面主题、事实和价值，发布前替换本句。
  noindex: true
---

## 这个内容回答什么问题

TODO

## 核心结论

TODO

## 证据、案例与适用范围

TODO
`;

const articleEn = `---
title: TODO
summary: TODO — Write a 40–300 character summary that states what the reader will learn before publication.
type: field-note
publishedAt: ${today}
readingMinutes: 8
author: editorial-team
topics:
  - TODO
relatedEvents: []
cover: /images/TODO.jpg
coverAlt: TODO — Describe the people, setting and activity in the image before publication
citations: []
featured: false
draft: true
translationOf: ${slug}
translationStatus: draft
seo:
  title: TODO
  description: TODO — Write a 50–180 character description covering the subject, evidence and page value.
  noindex: true
---

## What question does this answer?

TODO

## Key conclusions

TODO

## Evidence, examples and limits

TODO
`;

const eventZh = `---
title: TODO
summary: TODO：用 40—220 字说明主题、讨论边界和参与者价值，发布前替换本句。
number: 1
series: community-event
startDate: ${today}T14:00:00+08:00
endDate: ${today}T18:00:00+08:00
timezone: Asia/Shanghai
city: 上海
venue: TODO
address: TODO
attendanceMode: offline
format: salon
capacity: 100
topics:
  - TODO
formats:
  - 主题分享
cover: /images/TODO.jpg
coverAlt: TODO：准确描述活动封面或现场图片，发布前替换本句
speakers: []
registration:
  status: closed
agenda: []
faq: []
featured: false
draft: true
seo:
  title: TODO
  description: TODO：用 50—180 字包含时间、城市、主题和形式，发布前替换本句。
  noindex: true
---

## 我们想讨论什么

TODO
`;

const eventEn = `---
title: TODO
summary: TODO — Write a 40–300 character summary covering the subject, scope and value before publication.
number: 1
series: community-event
startDate: ${today}T14:00:00+08:00
endDate: ${today}T18:00:00+08:00
timezone: Asia/Shanghai
city: Shanghai
venue: TODO
address: TODO
attendanceMode: offline
format: salon
capacity: 100
topics:
  - TODO
formats:
  - Focused talks
cover: /images/TODO.jpg
coverAlt: TODO — Describe the event cover or documentary photograph before publication
speakers: []
registration:
  status: closed
agenda: []
faq: []
featured: false
draft: true
translationOf: ${slug}
translationStatus: draft
seo:
  title: TODO
  description: TODO — Write a 50–180 character description covering date, city, subject and format.
  noindex: true
---

## What we want to discuss

TODO
`;

mkdirSync(zhDirectory, { recursive: true });
mkdirSync(enDirectory, { recursive: true });
writeFileSync(zhTarget, type === 'article' ? articleZh : eventZh, 'utf8');
writeFileSync(enTarget, type === 'article' ? articleEn : eventEn, 'utf8');
console.log(`Created bilingual drafts:\n- ${zhTarget}\n- ${enTarget}`);
