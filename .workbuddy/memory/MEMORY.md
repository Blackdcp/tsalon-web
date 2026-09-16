# T Salon — 长期项目笔记

## 部署约定（最易踩坑，务必记住）
- 仓库 `Blackdcp/tsalon-web`，前端在 `design-systems/01-protocol/prototype/`（Astro + @astrojs/vercel）。
- **2026-09-16 实测：push 到 main 后约 45 秒线上自定义域名已自动更新**（无需手动 promote）。
  与下面这条旧结论冲突，可能项目设置已变更 → **每次部署先 curl 验证，未更新才走手动 promote**。
- （旧结论，暂留作兜底）Vercel 曾不会把 Production 部署自动 promote 到自定义域名，
  `git push` 只触发 build（状态 Ready），线上仍是旧别名，除非手动 promote。
- 本机**未安装 vercel CLI**（`vercel` 命令不存在，node_modules/.bin 下也没有），需用 `npx vercel`。
- 流程：`git push` → `vercel ls`（找最新 Ready 部署 dpl_* / tsalon-xxxx.vercel.app）→
  `vercel inspect https://www.tsalon.tech`（确认当前别名指向哪个 dpl）→
  `vercel promote <新Ready的部署URL>` 切生产别名。**仅 re-point 别名，不从本地 `vercel --prod` 部署**，符合"只走 git push→webhook"。
- 验证：`vercel inspect https://www.tsalon.tech` 别名指向新 dpl，再 curl 页面关键数值核对。
- 构建门槛：`npm run build` = `astro check` + content-i18n-check（已发布中文内容**必须**有英文 companion 且 `translationStatus: reviewed`、无中文字符）+ site-locale-check + site-heading-check；任一失败 → 部署中止、线上保持旧版。本地先 `npx astro check` 与 `npm run build` 自检。

## 静态资源坑（2026-09-16 发现，已踩两次）
- **`public/` 下的静态文件会覆盖 `src/pages/` 下的同名动态路由**，且构建不报错、无警告。
- `public/llms.txt` 覆盖了 `src/pages/llms.txt.ts`，导致线上长期只返回 16 行精简英文版，
  动态生成的全量中文版从未生效（970B vs 12403B）。`public/robots.txt` 同样中招。
- **规则**：新增任何 txt/xml 动态路由前，先确认 `public/` 无同名文件；两者内容若恰好相同则
  完全无法察觉，务必用字节数或内容特征验证。

## GEO 资产现状（2026-09-16 建立）
- AI 入口：`/llms.txt` `/llms-full.txt` `/en/llms.txt` `/en/llms-full.txt` `/rss.xml` `/en/rss.xml`
  `/content-index.json` `/en/content-index.json`，全部由 `src/pages/` 动态路由生成。
- robots.txt 显式 Allow 14 个 AI 爬虫并 `Disallow: /api/`（屏蔽 db-maint 等运维端点）。
- 结构化数据：Organization / Article / BreadcrumbList / FAQPage / WebApplication / Dataset /
  VideoObject / CreativeWorkSeries。TokenRank 有 Dataset（4 指标），/whenreset/ 有 FAQPage（4 条），
  **8 篇中文 + 8 篇英文文章页均带 FAQPage（每篇 4 条 Q&A）**。
- **文章与访谈规范（2026-09-16 起）**：
  - `articles` / `articlesEn` 的 frontmatter 必须含 `tldr`（要点数组）与 `faq`（问答数组）；文章页渲染 TL;DR 区块 + FAQ 区块，并下发 FAQPage JSON-LD；`llms-full.txt`（中/英）注入每篇 TL;DR 与 FAQ。8 篇英文文章均已完成完整正文翻译。
  - **17 期 T Chat 访谈页面已全部丰富化（2026-09-16 完成）**：`src/data/talks.json` 为全部 17 期补充了 `takeaways`（3 条核心看点）与 `faq`（3 组高密度技术问答）；文章页支持 Bilibili 响应式视频内嵌播放、看点卡片、FAQ 问答与 `FAQPage` + `VideoObject` 结构化数据；`llms-full.txt` 注入全部 17 期 Takeaways 与 FAQ（文档扩大至 89KB+）。
  - 文章页标签升级为点击即可直达对应 `/topics/[slug]/` 主题聚合页的语义化链接。
  - `BaseLayout.astro` 声明 `<link rel="alternate">` / `<link rel="help">` 指向 `llms.txt` / `llms-full.txt`，并补齐 Twitter Card 标签。

## 产品/数据约定
- TokenRank 显示名用 **GitHub display name**（不用 login）。owner=Black.（login Blackdcp）。
- 聚合口径：`user:{uid}:data`(tokens total+createdAt) / `:device:*:data`(每设备累计) / `:device:*:snap:{date}`(每日累计快照) / `:timeseries:{date}`(每日事件列表) / `leaderboard:total`(ZSET) / `token:{tok}:userId`(反向映射)。
- 北京时间分桶（`beijingDateString`/`beijingDateNDaysAgo`，UTC+8）。
- 每日用量 = delta(本次累计 − 上次设备快照)；historyData 的逐日值**现在可信**（过去因 DAY_CAP 误杀，见下）。
- **历史回填过滤 bug（已修，2026-08-11）**：`kv.ts` 的 PAST-day 历史回填原先用 `DAY_CAP = max(3×中位数, 850M)` 整日丢弃任何超过该上限的历史日 → 把正常的繁忙日（08-10=23亿、08-05≈25.7亿、08-06≈70亿、08-07≈35.7亿）整日当垃圾丢掉、页面显示 0。修复后只保留两种拒绝：**累计dump**（`hVal > 0.5 × deviceTotal`，即 agent 误把终身量当单日值）和 零值。繁忙日不再被误杀。修复 commit ≈ `df227f6`，已 promote。
- 诊断手法（已移除）：临时在 `upload.ts` 加探针把 agent 上报的 `history` 日期/数值记到 `user:154967851:debug:lastUpload`，再用 `db-maint2` 的 `debugread` 读出——确认 agent **确实发了** 08-10(23.4亿) 才定位到是服务端过滤误杀，而非 agent 没发。探针 + debugread 已清理（commit ≈ `a9dae25`）。
- 注意：缺的天要由 agent **重新上传**才会写回（服务端不凭空造数据）。数据只在 `updateTokenUsage` 上传时写入；历史回填有"已写入则跳过"守卫，所以缺失天初次上传即用新逻辑补回。双设备时各自 history 独立，需两台都上传过新代码才能合并完整。

## Redis 清理安全边界
- 只动**非数字 userId**（UUID 孤儿）的整套键；数字 GitHub id 真实档案永不碰。
- db-maint2 动作：`staleinfo`(删 orphan :info)、`stalekeys`(删整套 UUID 命名空间+反向 token 映射)、`listprofiles`(区分真实 profile vs device 键)、`snapcheck`、`clearday`、`cleartimeseries`、`backfilllogin`。均 dry-run 默认，仅 `confirm:true` 才写。
