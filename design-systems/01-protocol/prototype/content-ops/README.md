# Content operations — no CMS, no backend

The publishing unit is a reviewed Markdown file in Git. The workflow is intentionally manual-triggered and AI-assisted rather than fully autonomous.

1. Create a brief in `content-ops/briefs/` using the example JSON.
2. Produce the full AI prompt:
   `npm run content:prompt -- --brief content-ops/briefs/example-article.json`
3. Give that prompt to Codex or the team's chosen AI tool and save the returned Markdown under `src/content/articles/` or `src/content/events/`.
4. Keep `draft: true` and `seo.noindex: true` during review.
5. A human verifies facts, quotes, image rights, links and the page summary.
6. Run `npm run content:validate` and `npm run build`.
7. Change to `draft: false`, set `seo.noindex: false`, and merge through Git. Static deployment publishes the page.

`npm run content:new -- --type article --slug example-slug` creates a safe manual scaffold when AI is not needed.

The pipeline never needs a database or admin application. Event registration remains an external URL stored in event frontmatter.
