// Site-wide calendar-date bucketing uses Beijing time (UTC+8).
//
// Why: the Codex token agent reports its daily history using the user's local
// timezone (GMT+8). If the site buckets "today"/period windows in UTC (as it
// did before), the user's late-day activity (after 16:00 Beijing) lands in
// "tomorrow", so the leaderboard and user page permanently under-count the
// current day. Aligning both sides on Beijing time fixes the split.
export const SITE_TZ_OFFSET_HOURS = 8;

const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

/** Beijing-time calendar date (YYYY-MM-DD) for a given instant (defaults to now). */
export function beijingDateString(d: Date = new Date()): string {
  // toISOString() is always UTC; shifting the epoch by +offset yields the
  // Beijing calendar date regardless of the server's own timezone.
  return new Date(d.getTime() + SITE_TZ_OFFSET_HOURS * MS_PER_HOUR).toISOString().split('T')[0];
}

/** Beijing-time date N days before `base` (N=0 => today). */
export function beijingDateNDaysAgo(n: number, base: Date = new Date()): string {
  return new Date(base.getTime() + SITE_TZ_OFFSET_HOURS * MS_PER_HOUR - n * MS_PER_DAY).toISOString().split('T')[0];
}
