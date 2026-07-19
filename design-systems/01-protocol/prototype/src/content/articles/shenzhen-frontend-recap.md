---
title: 大前端时代的挑战与机遇（深圳场）：五位嘉宾的技术分享与现场回顾
summary: 2022 年 5 月，T 技术沙龙在深圳邀请五位一线研发从业者，围绕前端监控、Flutter、小程序、工程化与 Webpack 性能展开分享。
type: field-note
publishedAt: 2022-05-10
readingMinutes: 9
author: editorial-team
topics:
  - 前端工程
  - Flutter
  - 工程化
  - Webpack
cover: /images/news/shenzhen-frontend-recap-01.jpg
coverAlt: 大前端时代的挑战与机遇深圳场活动现场观众交流
citations:
  - label: 微信公众号原文
    url: https://mp.weixin.qq.com/s/f3ayHlx2JFlxVYXa7ZfR2w
featured: true
draft: false
seo:
  title: 大前端时代的挑战与机遇｜T Salon 深圳活动回顾
  description: 回顾 T 技术沙龙深圳场的五场技术分享，内容覆盖前端监控、Flutter 小程序、前端工程化、Flutter Web 与 Webpack 性能优化。
  noindex: false
---

2022 年 5 月 8 日，T 技术沙龙联合货拉拉开发者社区与智联猎头，在深圳举办「大前端时代的挑战与机遇」。五位来自一线研发团队与开源社区的嘉宾，分享了他们在前端监控、跨端开发、工程化建设和构建性能方面的真实实践。

## 一场关于“大前端”的线下交流

这是 T 技术沙龙 2022 年的第二场线下活动。活动受深圳疫情影响，从原定的 4 月 16 日延期至 5 月 8 日，但线上仍有 300 多位开发者报名，现场到场近 100 人。

当天下着小雨，也恰逢单休周末。活动从下午 1:30 开始，分享之外，现场讨论和提问持续不断。我们把五场演讲中最值得继续讨论的部分整理在这里。

## 五位嘉宾，五种一线实践

### 卢依宁：前端监控如何影响业务

卢依宁是货拉拉司机平台前端负责人。她从业务视角解释了为什么需要前端监控，并比较 Sentry、阿里云 ARMS、岳鹰和自研方案，进一步介绍货拉拉前端监控体系的建设路径。

分享涉及三个关键层次：数据采集、日志上报和日志查询；SDK 的使用方式与上报设计；以及接口、JavaScript 报错、页面 PV 和资源加载等监控项的采集原理。最后，她通过真实案例说明监控系统如何参与问题定位和业务决策。

![卢依宁分享前端监控实践](/images/news/shenzhen-frontend-recap-02.jpg)

### 崔明辉：使用 Flutter 开发微信小程序

开源项目 SVGA 作者崔明辉现场介绍了 MPFlutter 的整体架构，演示 Flutter 如何用于微信小程序开发。

除了方案本身，他也回应了 Flutter for Web 常见的工程问题，包括 JavaScript 包体积、滑动性能和异步渲染。对现场不少开发者而言，这是第一次系统看到 Flutter 与小程序结合的实现路径。

![崔明辉介绍 MPFlutter 小程序开发方案](/images/news/shenzhen-frontend-recap-03.jpg)

### 张泽亚：前端工程化建设

字节跳动飞书前端工程师张泽亚从两个问题展开：Web 应用复杂度持续提升，以及前端业务团队在协作中不断产生的“熵增”。

他强调，工程化并不存在适用于所有团队的银弹。好的实践需要与团队所处阶段、主要矛盾和投入能力相匹配；建设工具和平台之前，首先要判断真正需要解决的问题。

![张泽亚分享前端工程化建设方法](/images/news/shenzhen-frontend-recap-04.jpg)

### 郭树煜：Flutter Web 的构建与渲染

《Flutter 开发实战详解》作者郭树煜从 Flutter 的诞生和跨平台框架演进讲起，逐步深入 Flutter Web 的构建、优化与渲染机制。

分享讨论了不同平台 Engine 的实现方式、Canvas 文本绘制、BitmapCanvas 与 DomCanvas 的区别，以及 `hasArbitraryPaint` 等更具体的判断逻辑，为现场开发者提供了理解 Flutter Web 内部机制的入口。

![郭树煜远程分享 Flutter Web 构建与优化](/images/news/shenzhen-frontend-recap-05.jpg)

### 范文杰：Webpack 性能优化指南

字节跳动游戏团队前端工程师范文杰结合基于 Webpack 4 的小程序预编译框架，以及旧项目交接后常见的性能遗留问题，拆解构建性能的分析与优化方法。

内容覆盖 Webpack 核心工作流程、构建性能分析、常见优化路径、Webpack 5 的性能变化，以及 Vite 速度优势背后的原因。相比只给出配置清单，这场分享更关注如何找到真正的性能瓶颈。

![范文杰分享 Webpack 核心工作流程与性能优化](/images/news/shenzhen-frontend-recap-06.jpg)

## 技术交流之外的现场

一场社区活动的价值不只发生在舞台上。签到、茶歇、提问和活动结束后的交流，让不同团队的开发者有机会交换各自正在面对的问题。

![深圳场活动签到区与茶歇现场](/images/news/shenzhen-frontend-recap-07.png)

![深圳场茶歇、晚餐与社区交流](/images/news/shenzhen-frontend-recap-08.png)

## 写在最后

活动举办时，深圳仍受到疫情影响。我们希望通过持续的技术交流，让开发者在不确定的环境里仍然能够见面、交换经验，并找到可以带回团队继续实践的内容。

这也是 T Salon 整理活动内容的原因：活动会结束，但嘉宾的判断、方法和现场提出的问题，仍然值得被继续搜索、引用和讨论。
