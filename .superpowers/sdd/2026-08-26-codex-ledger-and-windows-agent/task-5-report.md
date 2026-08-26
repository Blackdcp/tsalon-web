# Task 5 Report: total / norm / cost rankings

## Commit

- `Add total norm and cost rankings` (this task's single commit)

## Delivered

- Added lifetime `leaderboard:total`, `leaderboard:norm`, and `leaderboard:cost` writes.
- Added metric-aware lifetime and canonical-event window rankings while preserving `tokens.total` as total tokens and returning all three row metrics.
- Added API defaults (`today` + `total`), `mode=cost` compatibility, and top-level `metric` / `pricing_snapshot_date` metadata.
- Unified Chinese and English leaderboard and personal pages around the selected canonical metric, including parameter-preserving pills, daily/trend/peak/average values, `cache_read / total` cache rate, and central pricing snapshot disclosure.
- Removed page-local pricing tables and updated the share poster to use canonical row metrics.

## Tests

- `node --test scripts/tokenrank-metrics.test.mjs scripts/tokenrank-domain.test.mjs scripts/tokenrank-upload.test.mjs scripts/codex-ledger-store.test.mjs` — 41/41 passed.
- `npx astro check` — 0 errors, 0 warnings; 15 pre-existing hints in generated/public scripts.
- `git diff --check` — passed.

## Concerns

- Existing lifetime profiles join the new `norm` and `cost` sorted sets on their next agent upload; rolling window rankings are immediately computed from canonical events.
