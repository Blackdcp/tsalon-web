---
title: Modern Frontend Engineering in Shenzhen — Five Practical Lessons
summary: In May 2022, five engineers joined T Salon in Shenzhen to share practical work on frontend observability, Flutter, mini programs, engineering systems and Webpack performance.
type: field-note
publishedAt: 2022-05-10
readingMinutes: 8
author: editorial-team
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
featured: true
draft: false
translationOf: shenzhen-frontend-recap
translationStatus: reviewed
tldr:
  - "A recap of the May 8, 2022 Shenzhen 'Challenges and Opportunities in Modern Frontend Engineering' event with five talks from frontline engineers."
  - "Yining Lu on how frontend observability affects the business (Sentry / ARMS / in-house comparison and system building)."
  - "Minghui Cui demoed building WeChat mini programs with Flutter (MPFlutter) and Flutter for Web engineering trade-offs."
  - "Zeya Zhang on engineering systems fitting the team; Shuyu Guo on Flutter Web build / render; Wenjie Fan on finding the real Webpack bottleneck."
faq:
  - question: "What topics were covered at the Shenzhen frontend event?"
    answer: "Five: how frontend observability affects the business, building WeChat mini programs with Flutter, frontend engineering systems, Flutter Web build and render, and Webpack performance."
  - question: "What is MPFlutter?"
    answer: "An open-source architecture by Minghui Cui (creator of SVGA) that lets Flutter build WeChat mini programs and addresses bundle size, scrolling performance, and async rendering in Flutter for Web."
  - question: "Is there a universal frontend engineering solution?"
    answer: "Zeya Zhang stressed there is no silver bullet for every team; tools and platforms must fit the team's stage, main conflict, and capacity—judge the real problem first."
  - question: "How should you optimize Webpack performance?"
    answer: "Wenjie Fan advised starting from the core workflow and performance analysis, noting Webpack 5 changes and why Vite is faster; the point is to locate the real bottleneck, not copy a config list."
seo:
  title: Modern Frontend Engineering in Shenzhen — T Salon
  description: A field report from five talks on frontend observability, Flutter mini programs, engineering systems, Flutter Web and Webpack performance.
  noindex: false
---

On 8 May 2022, T Salon worked with the Lalamove developer community and Zhaopin Executive Search to host “Challenges and Opportunities in Modern Frontend Engineering” in Shenzhen. Five speakers from engineering teams and open-source communities shared what they had learned from building observability systems, cross-platform products, developer tooling and faster build pipelines.

## A face-to-face conversation about modern frontend work

The event had been postponed because of the COVID-19 situation in Shenzhen. More than 300 developers registered online and close to 100 joined us in person on a rainy weekend afternoon. The talks mattered, but so did the questions and conversations between them.

## Five speakers, five kinds of practice

### Yining Lu: observability as a product decision

Yining Lu, who led frontend engineering for Lalamove’s driver platform, explained why frontend monitoring matters to the business. She compared Sentry, Alibaba Cloud ARMS, Yueying and an in-house system, then described how data collection, log reporting and querying fit together.

![Yining Lu sharing frontend observability practices](/images/news/shenzhen-frontend-recap-02.jpg)

### Minghui Cui: building WeChat mini programs with Flutter

SVGA creator Minghui Cui introduced MPFlutter and demonstrated how Flutter can be used to build WeChat mini programs. He also addressed bundle size, scrolling performance and asynchronous rendering in Flutter for Web.

![Minghui Cui introducing the MPFlutter architecture](/images/news/shenzhen-frontend-recap-03.jpg)

### Zeya Zhang: engineering systems must fit the team

Zeya Zhang, a frontend engineer on ByteDance’s Feishu team, started with two pressures: growing application complexity and increasing coordination costs. His central point was that engineering systems have no universal silver bullet. Tools and platforms must fit a team’s stage, constraints and most important problem.

![Zeya Zhang discussing frontend engineering systems](/images/news/shenzhen-frontend-recap-04.jpg)

### Shuyu Guo: how Flutter Web builds and renders

Shuyu Guo, author of *Flutter Development in Practice*, traced the evolution of cross-platform frameworks before examining Flutter Web’s build and rendering mechanisms, including platform engines, canvas text drawing and rendering choices.

![Shuyu Guo speaking remotely about Flutter Web](/images/news/shenzhen-frontend-recap-05.jpg)

### Wenjie Fan: finding the real Webpack bottleneck

Wenjie Fan from ByteDance’s games team broke down Webpack’s workflow, performance analysis and common optimization paths. Instead of offering a configuration checklist, he focused on how engineers can locate the bottleneck that actually matters.

![Wenjie Fan explaining Webpack performance analysis](/images/news/shenzhen-frontend-recap-06.jpg)

## Beyond the stage

A community event is also made in the spaces between talks: registration, coffee breaks, questions and the discussions that continue after the formal program ends.

![Registration and refreshments at the Shenzhen event](/images/news/shenzhen-frontend-recap-07.png)

![Dinner and community conversations after the talks](/images/news/shenzhen-frontend-recap-08.png)

## Why we keep the record

Events end, but the speakers’ decisions, methods and open questions remain useful. Publishing a durable record lets that work be found, cited and discussed beyond the room in which it first appeared.
