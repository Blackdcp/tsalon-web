---
title: Frontend Engineering in Shenzhen — Five Talks from May 2022
summary: A record of five talks for T Salon’s May 2022 Shenzhen event, including a remote presentation, on frontend observability, Flutter, mini programs, engineering systems and Webpack performance.
type: field-note
publishedAt: 2022-05-10
updatedAt: 2026-09-27
readingMinutes: 13
author: editorial-team
relatedRecordings:
  - shenzhen-frontend-challenges
topics:
  - Frontend
  - Flutter
  - Webpack
relatedEvents: []
cover: /images/news/shenzhen-frontend-recap-01.jpg
coverAlt: Developers in the audience at the T Salon frontend engineering event in Shenzhen
citations:
  - label: Original WeChat article in Chinese
    url: https://mp.weixin.qq.com/s/f3ayHlx2JFlxVYXa7ZfR2w
  - label: MPFlutter official project website
    url: https://mpflutter.com/zh/
  - label: Shuyu Guo — Flutter Web talk notes, May 2022 (Chinese)
    url: https://juejin.cn/post/7095294020900880420
featured: true
draft: false
translationOf: shenzhen-frontend-recap
translationStatus: reviewed
tldr:
  - "A face-to-face conversation about modern frontend work: This was T Salon's second in-person event of 2022."
  - "Shuyu Guo: how Flutter Web builds and renders: Shuyu Guo, author of a book on Flutter development, traced the evolution of cross-platform frameworks before examining Flutter Web’s build and rendering mechanisms, including platform engines, canvas text drawing and rendering choices."
  - "Why we keep the record: Shenzhen was still affected by the pandemic when the event took place."
seo:
  title: Modern Frontend Engineering in Shenzhen — T Salon
  description: A field report from five talks on frontend observability, Flutter mini programs, engineering systems, Flutter Web and Webpack performance.
  noindex: false
---

On 8 May 2022, T Salon worked with the Lalamove developer community and Zhaopin Executive Search to host “Challenges and Opportunities in Modern Frontend Engineering” in Shenzhen. Five speakers contributed talks on observability systems, cross-platform products, developer tooling and build performance; Yining Lu joined remotely from Shanghai. This record describes the technologies as discussed in May 2022.

## A face-to-face conversation about modern frontend work

This was T Salon's second in-person event of 2022. It had been scheduled for April 16 but moved to May 8 because of the COVID-19 situation in Shenzhen. More than 300 developers registered online and close to 100 joined us in person on a rainy weekend afternoon. The program began at 1:30 p.m.; questions and conversations continued around the five talks.

## Five speakers, five kinds of practice

### Yining Lu: observability as a product decision

Yining Lu, who led frontend engineering for Lalamove’s driver platform, presented remotely from Shanghai because of the pandemic. Lu explained why frontend monitoring matters to the business, compared Sentry, Alibaba Cloud ARMS, Yueying and an in-house system, and described how data collection, log reporting and querying fit together.

Lu began by asking whether developers knew their page's approximate PV and UV, the Android-versus-iOS mix, and the busiest hours. Monitoring, in this view, helps frontend engineers understand the product as well as collect errors. The talk separated collection, reporting, and querying; discussed request, JavaScript error, page-view, and resource entries in the SDK; and showed why detailed logs and aggregate curves serve different questions.

Four investigations made the method concrete: blank content after a banner click, a sudden fall in one acquisition channel, a city-location fallback that produced invalid driver registrations, and a surge of API requests. Each started with a person or a change in a curve, then narrowed by time, page, request, and business context. An alert has to understand a system's normal working hours, not simply fire whenever traffic rises or falls.

![Yining Lu sharing frontend observability practices](/images/news/shenzhen-frontend-recap-02.jpg)

### Minghui Cui: building WeChat mini programs with Flutter

SVGA creator Minghui Cui introduced [MPFlutter](https://mpflutter.com/zh/) and demonstrated how Flutter can be used to build WeChat mini programs. He also addressed bundle size, scrolling performance and asynchronous rendering in Flutter for Web.

His central proposal was to reuse layout Flutter had already calculated. MPFlutter serialized reusable nodes' positions, dimensions, and content such as text and images, then let another host reconstruct the display. Node identities allowed incremental updates, while a mini program needed an adapter for its own component model. In Cui's example, one Dart/Flutter codebase could support iOS, Android, Web, and a mini program. He also said that the mini-program experience still lagged behind a native implementation. Reuse alone could not decide the engineering tradeoff.

![Minghui Cui introducing the MPFlutter architecture](/images/news/shenzhen-frontend-recap-03.jpg)

### Zeya Zhang: engineering systems must fit the team

Zeya Zhang, a frontend engineer on ByteDance’s Feishu team, started with two pressures: growing application complexity and increasing coordination costs. His central point was that engineering systems have no universal silver bullet. Tools and platforms must fit a team’s stage, constraints and most important problem.

Feishu Docs offered tangible constraints: slow local hot updates, many cross-team changes in a weekly version, and paying customers who expected stability. Zhang described dependency reuse, build caching, and micro-frontend separation, while admitting a heavy shared base and business coupling did not disappear through separation. Developer test packages, integration testing, internal gradual release, private source maps, and a deployment pipeline put quality checks at different stages. On performance, he separated content becoming visible from a document actually becoming usable.

![Zeya Zhang discussing frontend engineering systems](/images/news/shenzhen-frontend-recap-04.jpg)

### Shuyu Guo: how Flutter Web builds and renders

Shuyu Guo, author of a book on Flutter development, traced the evolution of cross-platform frameworks before examining Flutter Web’s build and rendering mechanisms, including platform engines, canvas text drawing and rendering choices. His [written version of the talk](https://juejin.cn/post/7095294020900880420), published on May 8, 2022, preserves the technical detail and discusses Flutter 2.10-era behavior.

First he split the build into script, renderer resources, and icon fonts, then considered renderer selection, font trimming, deferred loading, and transfer compression separately. He spent the second half tracing a sequence of drawing examples. Plain text, text with a red background, and then added shadow or filters could lead the HTML renderer to switch between Canvas and browser elements. That analysis explains `flt-` tags seen in browser tools and why text can look different under particular conditions. It is more precise than saying “Flutter Web uses Canvas.”

![Shuyu Guo’s presentation on Flutter Web](/images/news/shenzhen-frontend-recap-05.jpg)

### Wenjie Fan: finding the real Webpack bottleneck

Wenjie Fan from ByteDance’s games team broke down Webpack’s workflow, performance analysis and common optimization paths. The talk covered a Webpack 4-based mini-program build system, Webpack 5 performance changes and the reasons behind Vite’s speed. It focused on locating the relevant bottleneck rather than copying a configuration checklist.

Fan divided a build into initialization, recursive module processing, and output generation. Stats links assets, chunks, and modules; package visualizations, plugin and loader timing, and lifecycle hooks answer other questions. Once a costly stage is located, possible responses include a filesystem cache, parallelizing suitable work, narrowing loader scope, moving type checking to another process, or compiling a module only when first needed. Cold starts and warm-cache runs, like bundle size and elapsed time, need to be compared separately.

![Wenjie Fan explaining Webpack performance analysis](/images/news/shenzhen-frontend-recap-06.jpg)

## Beyond the stage

A deeper account of each complete recording is available in English: [Lu on monitoring](/en/articles/shenzhen-lu-yining-frontend-monitoring-recap/), [Cui on MPFlutter](/en/articles/shenzhen-cui-minghui-mpflutter-recap/), [Zhang on engineering](/en/articles/shenzhen-zhang-zeya-engineering-recap/), [Guo on Flutter Web](/en/articles/shenzhen-guo-shuyu-flutter-web-recap/), and [Fan on webpack performance](/en/articles/shenzhen-fan-wenjie-webpack-performance-recap/). The [Bilibili recording](https://www.bilibili.com/video/BV1HY4y1r7rJ?p=1) has all five parts.

The speakers' subjects differ, but a shared method runs through them: monitoring first asks what happened in the business, cross-platform work asks what the host actually provides, engineering asks which waiting and coordination costs a team faces, and performance work measures where time is spent. No framework, platform, or build switch bypasses those questions. What remains useful is how the speakers made their decisions visible.

A community event is also made in the spaces between talks: registration, coffee breaks, questions and the discussions that continue after the formal program ends.

![Registration and refreshments at the Shenzhen event](/images/news/shenzhen-frontend-recap-07.png)

![Dinner and community conversations after the talks](/images/news/shenzhen-frontend-recap-08.png)

## Why we keep the record

Shenzhen was still affected by the pandemic when the event took place. We wanted technical conversation to remain possible amid that uncertainty, giving developers a chance to meet, exchange experience, and take a useful question back to their own teams.

Events end, but the speakers’ decisions, methods and open questions remain useful. Publishing a durable record lets that work be found, cited and discussed beyond the room in which it first appeared.

## Sources and speaker materials

- [Original May 10, 2022 event report in Chinese](https://mp.weixin.qq.com/s/f3ayHlx2JFlxVYXa7ZfR2w): event context, speaker summaries and photographs.
- [MPFlutter project website](https://mpflutter.com/zh/): the project introduced by Minghui Cui; the current site describes later versions.
- [Shuyu Guo’s Flutter Web talk notes, May 8, 2022](https://juejin.cn/post/7095294020900880420): the written companion to his presentation.
- Complete recordings: [Lu Yining, monitoring](https://www.bilibili.com/video/BV1HY4y1r7rJ?p=1); [Cui Minghui, MPFlutter](https://www.bilibili.com/video/BV1HY4y1r7rJ?p=2); [Zhang Zeya, engineering](https://www.bilibili.com/video/BV1HY4y1r7rJ?p=3); [Guo Shuyu, Flutter Web](https://www.bilibili.com/video/BV1HY4y1r7rJ?p=4); [Fan Wenjie, webpack performance](https://www.bilibili.com/video/BV1HY4y1r7rJ?p=5).
