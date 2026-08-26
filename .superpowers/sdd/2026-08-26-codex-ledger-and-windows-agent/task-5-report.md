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

## Fix Round 1

### Commit

- `Fix TokenRank pricing and metric windows` (this fix round's commit)

### Reviewer issues resolved

- Non-Codex uploads now derive `norm` from cache read/write and derive `cost` through the central pricing module, retaining normalized model IDs, estimated flags, and the pricing snapshot. New history, cumulative, and snapshot events persist the same pricing metadata; legacy window events derive missing norm/cost at read time.
- List and poster secondary metrics now follow the product contract: `total → cost`, `norm → total`, and `cost → total` in both languages.
- Personal `all` pages separate profile lifetime headlines from the explicitly labeled available event window used by average, peak, trend, sessions, and streak. Empty windows no longer fabricate today or a one-day streak; all-time cache rate uses profile cache read divided by profile lifetime total.
- Language alternates and share QR links retain both `time` and `metric`; posters display the selected window.

### Verification

- `node --test scripts/tokenrank-metrics.test.mjs scripts/tokenrank-domain.test.mjs scripts/tokenrank-upload.test.mjs scripts/codex-ledger-store.test.mjs` — 46/46 passed.
- `npx astro check` — 0 errors, 0 warnings; 15 pre-existing hints in generated/public scripts.
- `git diff --check` — passed.

## Fix Round 2

### Commit

- `Keep empty TokenRank windows empty` (this fix round's commit)

### Reviewer issue resolved

- Added a page-level presentation helper shared by both personal pages. Non-`all` windows now derive tool count and input/output/cache composition exclusively from canonical events, so empty today/yesterday/N-day windows show zero tools, zero AI time, and empty composition. Only `all` may use lifetime profile counters.
- Added a regression test that exercises the same helper consumed by the Astro pages and verifies empty-period versus all-time behavior.

### Verification

- `node --test scripts/tokenrank-metrics.test.mjs scripts/tokenrank-domain.test.mjs scripts/tokenrank-upload.test.mjs scripts/codex-ledger-store.test.mjs` — 47/47 passed.
- `npx astro check` — 0 errors, 0 warnings; 15 pre-existing hints in generated/public scripts.
- `git diff --check` — passed.
