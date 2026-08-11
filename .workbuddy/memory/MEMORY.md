# T Salon — 长期项目笔记

## 部署约定（最易踩坑，务必记住）
- 仓库 `Blackdcp/tsalon-web`，前端在 `design-systems/01-protocol/prototype/`（Astro + @astrojs/vercel）。
- **Vercel 不会把 Production 部署自动 promote 到自定义域名**（www.tsalon.tech / tsalon.tech）。
  `git push` 只触发 build（状态 Ready），但线上仍是旧别名，除非手动 promote。
- 流程：`git push` → `vercel ls`（找最新 Ready 部署 dpl_* / tsalon-xxxx.vercel.app）→
  `vercel inspect https://www.tsalon.tech`（确认当前别名指向哪个 dpl）→
  `vercel promote <新Ready的部署URL>` 切生产别名。**仅 re-point 别名，不从本地 `vercel --prod` 部署**，符合"只走 git push→webhook"。
- 验证：`vercel inspect https://www.tsalon.tech` 别名指向新 dpl，再 curl 页面关键数值核对。
- 构建门槛：`npm run build` = `astro check` + content-i18n-check（已发布中文内容**必须**有英文 companion 且 `translationStatus: reviewed`、无中文字符）+ site-locale-check + site-heading-check；任一失败 → 部署中止、线上保持旧版。本地先 `npx astro check` 与 `npm run build` 自检。

## 产品/数据约定
- TokenRank 显示名用 **GitHub display name**（不用 login）。owner=Black.（login Blackdcp）。
- 聚合口径：`user:{uid}:data`(tokens total+createdAt) / `:device:*:data`(每设备累计) / `:device:*:snap:{date}`(每日累计快照) / `:timeseries:{date}`(每日事件列表) / `leaderboard:total`(ZSET) / `token:{tok}:userId`(反向映射)。
- 北京时间分桶（`beijingDateString`/`beijingDateNDaysAgo`，UTC+8）。
- 每日用量 = delta(本次累计 − 上次设备快照)；historyData 的绝对日值不可信（agent 曾把终身累计当日值上报）。
- agent 端偶发把"终身累计"当单日值上报 → 某些过去天(如 2026-08-10)被净化丢弃成 0，服务端无快照可反推，属永久缺口。

## Redis 清理安全边界
- 只动**非数字 userId**（UUID 孤儿）的整套键；数字 GitHub id 真实档案永不碰。
- db-maint2 动作：`staleinfo`(删 orphan :info)、`stalekeys`(删整套 UUID 命名空间+反向 token 映射)、`listprofiles`(区分真实 profile vs device 键)、`snapcheck`、`clearday`、`cleartimeseries`、`backfilllogin`。均 dry-run 默认，仅 `confirm:true` 才写。
