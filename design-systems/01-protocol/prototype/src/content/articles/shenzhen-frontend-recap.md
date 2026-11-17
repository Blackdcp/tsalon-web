---
title: 大前端时代的挑战与机遇（深圳场）：五位嘉宾的技术分享与现场回顾
summary: 2022 年 5 月，T Salon 深圳活动汇集五位一线研发从业者的分享，其中卢依宁远程参与，议题覆盖前端监控、Flutter、小程序、工程化与 Webpack 性能。
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
cover: /images/news/shenzhen-frontend-recap-01.jpg
coverAlt: 大前端时代的挑战与机遇深圳场活动现场观众交流
citations:
  - label: 微信公众号原文
    url: https://mp.weixin.qq.com/s/f3ayHlx2JFlxVYXa7ZfR2w
  - label: MPFlutter 项目官网
    url: https://mpflutter.com/zh/
  - label: 郭树煜 Flutter Web 分享文字稿（2022 年 5 月）
    url: https://juejin.cn/post/7095294020900880420
featured: true
draft: false
tldr:
  - "一场关于“大前端”的线下交流：这是 T Salon 2022 年的第二场线下活动。"
  - "郭树煜：Flutter Web 的构建与渲染：《Flutter 开发实战详解》作者郭树煜从 Flutter 的诞生和跨平台框架演进讲起，逐步深入 Flutter Web 的构建、优化与渲染机制。"
  - "技术交流之外的现场：五场分享另有按完整录播整理的专题回顾，可继续阅读：卢依宁谈前端监控、崔明辉谈 MPFlutter、张泽亚谈工程化、郭树煜谈 Flutter Web、范文杰谈 webpack 性能。"
seo:
  title: 大前端时代的挑战与机遇｜T Salon 深圳活动回顾
  description: 回顾 T Salon 深圳场的五场技术分享，内容覆盖前端监控、Flutter 小程序、前端工程化、Flutter Web 与 Webpack 性能优化。
  noindex: false
---

2022 年 5 月 8 日，T Salon联合货拉拉开发者社区与智联猎头，在深圳举办「大前端时代的挑战与机遇」。五位来自一线研发团队与开源社区的嘉宾分享了前端监控、跨端开发、工程化建设和构建性能方面的实践，其中卢依宁从上海远程参与。下文保留的是 2022 年 5 月的技术讨论语境。

## 一场关于“大前端”的线下交流

这是 T Salon 2022 年的第二场线下活动。活动受深圳疫情影响，从原定的 4 月 16 日延期至 5 月 8 日，但线上仍有 300 多位开发者报名，现场到场近 100 人。

当天下着小雨，也恰逢单休周末。活动从下午 1:30 开始，分享之外，现场讨论和提问持续不断。我们把五场演讲中最值得继续讨论的部分整理在这里。

## 五位嘉宾，五种一线实践

### 卢依宁：前端监控如何影响业务

卢依宁是货拉拉司机平台前端负责人。受疫情影响，卢依宁从上海远程分享，从业务视角解释了为什么需要前端监控，并比较 Sentry、阿里云 ARMS、岳鹰和自研方案，进一步介绍货拉拉前端监控体系的建设路径。

分享涉及三个关键层次：数据采集、日志上报和日志查询；SDK 的使用方式与上报设计；以及接口、JavaScript 报错、页面 PV 和资源加载等监控项的采集原理。最后，她通过真实案例说明监控系统如何参与问题定位和业务决策。

卢依宁开场就问听众：你大致知道项目 PV、UV，Android 与 iOS 用户比例，以及用户高峰时段吗？监控在这里不只是报错工具，而是前端工程师理解业务的入口。现场案例从司机反馈白屏、某渠道数据突然下滑，到城市定位异常和接口请求突增，都按“先找时间与人，再看页面、请求和业务上下文”的顺序分析；整体曲线和单条日志要配合使用。

![卢依宁分享前端监控实践](/images/news/shenzhen-frontend-recap-02.jpg)

### 崔明辉：使用 Flutter 开发微信小程序

开源项目 SVGA 作者崔明辉现场介绍了 [MPFlutter](https://mpflutter.com/zh/) 的整体架构，演示 Flutter 如何用于微信小程序开发。

除了方案本身，他也回应了 Flutter for Web 常见的工程问题，包括 JavaScript 包体积、滑动性能和异步渲染。对现场不少开发者而言，这是第一次系统看到 Flutter 与小程序结合的实现路径。

崔明辉的核心思路，是利用 Flutter 框架已经算好的布局，把可复用节点的位置、尺寸和文本、图片等必要内容序列化，再由目标端恢复显示结构。节点变化可以比较后增量更新，小程序则需要自己的宿主适配层。这使一套 Dart/Flutter 逻辑有机会服务 iOS、Android、Web 和小程序；他也承认，小程序端的原生体验仍有差距，代码复用不能单独决定方案是否合适。

![崔明辉介绍 MPFlutter 小程序开发方案](/images/news/shenzhen-frontend-recap-03.jpg)

### 张泽亚：前端工程化建设

字节跳动飞书前端工程师张泽亚从两个问题展开：Web 应用复杂度持续提升，以及前端业务团队在协作中不断产生的“熵增”。

他强调，工程化并不存在适用于所有团队的银弹。好的实践需要与团队所处阶段、主要矛盾和投入能力相匹配；建设工具和平台之前，首先要判断真正需要解决的问题。

张泽亚拿飞书文档的现实约束作例子：本地热更新慢，单个版本有大量跨团队改动，付费客户又要求稳定。他讨论依赖复用、构建缓存和微前端拆分，也直说庞大基座与业务耦合不会因为拆分自动消失。测试包、集成测试、内部灰度、私有 source map 和发布流水线，是把质量检查放到不同阶段；性能上则要分清页面已经可见与文档真正可用。

![张泽亚分享前端工程化建设方法](/images/news/shenzhen-frontend-recap-04.jpg)

### 郭树煜：Flutter Web 的构建与渲染

《Flutter 开发实战详解》作者郭树煜从 Flutter 的诞生和跨平台框架演进讲起，逐步深入 Flutter Web 的构建、优化与渲染机制。

分享讨论了不同平台 Engine 的实现方式、Canvas 文本绘制、BitmapCanvas 与 DomCanvas 的区别，以及 `hasArbitraryPaint` 等更具体的判断逻辑，为现场开发者提供了理解 Flutter Web 内部机制的入口。他在 2022 年 5 月 8 日发布的[分享文字稿](https://juejin.cn/post/7095294020900880420)保留了具体实现分析，其中涉及 Flutter 2.10 时期的行为。

他先拆开构建产物：脚本、渲染器资源和图标字体各占多少，分别怎样通过指定渲染器、图标裁剪、延迟加载和传输压缩处理。后半场用一组连续例子追踪同一段文字的输出：只有文字、加红底、再加阴影或滤镜时，HTML 渲染器会在 Canvas 与浏览器元素之间切换。对浏览器里看到的 `flt-` 标签和文字清晰度问题，这比简单说“Flutter Web 用 Canvas”更有解释力。

![郭树煜关于 Flutter Web 构建与优化的分享](/images/news/shenzhen-frontend-recap-05.jpg)

### 范文杰：Webpack 性能优化指南

字节跳动游戏团队前端工程师范文杰结合基于 Webpack 4 的小程序预编译框架，以及旧项目交接后常见的性能遗留问题，拆解构建性能的分析与优化方法。

内容覆盖 Webpack 核心工作流程、构建性能分析、常见优化路径、Webpack 5 的性能变化，以及 Vite 速度优势背后的原因。相比只给出配置清单，这场分享更关注如何找到真正的性能瓶颈。

范文杰先把一次构建分成初始化、递归处理模块和生成产物，再用 Stats 看 asset、chunk、module 之间的关系。包体可视化、插件和 loader 耗时、生命周期 hooks，各自回答不同问题。找到耗时之后，再考虑文件系统缓存、合适任务的并行、缩小 loader 范围、把类型检查移到独立环节，或把尚未使用的模块延迟编译。热缓存与冷启动、体积与时间都要分开比较。

![范文杰分享 Webpack 核心工作流程与性能优化](/images/news/shenzhen-frontend-recap-06.jpg)

## 技术交流之外的现场

五场分享另有按完整录播整理的专题回顾，可继续阅读：[卢依宁谈前端监控](/articles/shenzhen-lu-yining-frontend-monitoring-recap/)、[崔明辉谈 MPFlutter](/articles/shenzhen-cui-minghui-mpflutter-recap/)、[张泽亚谈工程化](/articles/shenzhen-zhang-zeya-engineering-recap/)、[郭树煜谈 Flutter Web](/articles/shenzhen-guo-shuyu-flutter-web-recap/)、[范文杰谈 webpack 性能](/articles/shenzhen-fan-wenjie-webpack-performance-recap/)。[B 站完整原片](https://www.bilibili.com/video/BV1HY4y1r7rJ?p=1)保留全部五个分段。

五场讲述的侧重点不同，却反复回到相近的判断：监控先弄清业务发生了什么，跨端先界定宿主真正提供什么，工程化先找到团队最贵的等待与协作环节，性能优化先测出成本落在哪里。没有一个框架、平台或构建选项能跳过这些具体问题；嘉宾们更有价值的部分，是把做出判断的步骤摊开给听众看。

一场社区活动的价值不只发生在舞台上。签到、茶歇、提问和活动结束后的交流，让不同团队的开发者有机会交换各自正在面对的问题。

![深圳场活动签到区与茶歇现场](/images/news/shenzhen-frontend-recap-07.png)

![深圳场茶歇、晚餐与社区交流](/images/news/shenzhen-frontend-recap-08.png)

## 写在最后

活动举办时，深圳仍受到疫情影响。我们希望通过持续的技术交流，让开发者在不确定的环境里仍然能够见面、交换经验，并找到可以带回团队继续实践的内容。

这也是 T Salon 整理活动内容的原因：活动会结束，但嘉宾的判断、方法和现场提出的问题，仍然值得被继续搜索、引用和讨论。

## 延伸阅读与讲师资料

- [2022 年 5 月 10 日公众号活动回顾](https://mp.weixin.qq.com/s/f3ayHlx2JFlxVYXa7ZfR2w)：活动背景、讲师介绍与现场照片。
- [MPFlutter 项目官网](https://mpflutter.com/zh/)：崔明辉分享的项目入口；当前站点介绍的是后续版本。
- [郭树煜 Flutter Web 分享文字稿（2022 年 5 月 8 日）](https://juejin.cn/post/7095294020900880420)：对应本次演讲的技术内容。
- [卢依宁：前端监控如何影响前端](https://www.bilibili.com/video/BV1HY4y1r7rJ?p=1)、[崔明辉：使用 Flutter 开发微信小程序](https://www.bilibili.com/video/BV1HY4y1r7rJ?p=2)、[张泽亚：前端工程化建设](https://www.bilibili.com/video/BV1HY4y1r7rJ?p=3)、[郭树煜：Flutter Web](https://www.bilibili.com/video/BV1HY4y1r7rJ?p=4)、[范文杰：webpack 性能优化](https://www.bilibili.com/video/BV1HY4y1r7rJ?p=5)：五段完整录播。
