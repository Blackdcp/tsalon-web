# T Salon project instructions

## Daily editorial workflow

Only start this workflow when the user explicitly asks to update today's content, review daily AI news, or run the daily editorial process.

1. Read `content-ops/DAILY-EDITORIAL.md`, `content-ops/editorial.config.json`, and `content-ops/EDITORIAL-PROMPT.md` completely.
2. Run `npm run content:daily` from this directory.
3. Read `.editorial/latest.json`. Treat AIHot as discovery input, not as the factual source.
4. Score candidates using the configured weights. Require an original source, real developer relevance, technical substance, a distinct T Salon angle, and durable search value. Reject pure promotion, duplicates, and unverifiable claims.
5. Show no more than five candidates to the user and wait for their explicit selection. Do not create GitHub Issues, send notifications, commit, push, or publish.
6. After selection, verify important facts against original or primary sources. Create paired Chinese and English Markdown drafts with the same slug. Keep `draft: true`, `seo.noindex: true`, and English `translationStatus: draft` until the user completes review.
7. Run `npm run content:validate` and `npm run build` after editing. The user owns the final Git commit and push unless they explicitly request otherwise.
