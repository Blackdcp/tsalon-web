# 每日内容：本地运行

这套流程不使用 CMS、后台、OpenAI API Key 或 GitHub 审核机器人。GitHub 只负责保存和发布最终文件。

## 每天使用

在本地 Codex 中说：

> 更新今天内容

Codex 会：

1. 运行 `npm run content:daily`，通过 AIHot 的公开只读 API 获取过去 24 小时的精选动态。
2. 按 `editorial.config.json` 中的 T Salon 标准重新评分，而不是直接采用 AIHot 分数。
3. 向你展示最多 5 条候选，等待你确认，不联系或提醒其他人。
4. 选题确认后，生成中文主稿和英文同步稿。
5. 将两份文件保存到 `src/content/articles/` 与 `src/content/articles-en/`，默认均为草稿且禁止索引。

也可以自己先在终端运行：

```powershell
npm run content:daily
```

候选原始数据保存在本地 `.editorial/latest.json`，该目录不会提交 GitHub。

## 发布前

- 回到原始来源核对事实、数字、名称和时间。
- 修改标题、正文、图片及图片说明，删除或解决所有 `TODO_VERIFY`。
- 确认英文稿与最终中文稿一致。
- 将两份文件的 `draft` 改为 `false`，将 `seo.noindex` 改为 `false`，并把英文 `translationStatus` 改为 `reviewed`。
- 运行 `npm run content:validate` 和 `npm run build`，通过后再提交 GitHub。

AIHot 的摘要只用于发现选题。文章必须保留原始来源和 AIHot 选题页链接，不复制第三方全文。
