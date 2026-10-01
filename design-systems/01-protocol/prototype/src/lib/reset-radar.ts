export interface ResetSource {
  role: string;
  postId?: string;
  account?: string;
  at?: string;
  url: string;
}

export interface RawResetEvent {
  id: string;
  provider: 'codex' | 'claude' | 'grok';
  type: 'reset' | 'card';
  scope: string;
  scopeNote?: { 'zh-CN'?: string; 'en'?: string };
  reason: string;
  reasonNote?: { 'zh-CN'?: string; 'en'?: string };
  landedAt: string;
  sources: ResetSource[];
}

export interface FormattedResetEvent {
  id: string;
  provider: 'codex' | 'claude' | 'grok';
  type: 'reset' | 'card';
  typeLabelZh: string;
  typeLabelEn: string;
  scopeZh: string;
  scopeEn: string;
  reasonZh: string;
  reasonEn: string;
  landedAtBeijing: string;
  timeAgoZh: string;
  timeAgoEn: string;
  postUrl?: string;
}

export interface WatchNotice {
  isOpen: boolean;
  scheduledAtBeijing?: string;
  tweetUrl?: string;
  titleZh?: string;
  titleEn?: string;
  text?: string;
}

export interface ProviderStats {
  provider: 'codex' | 'claude' | 'grok';
  name: string;
  sourceAccount: string;
  latestEvent: FormattedResetEvent | null;
  sinceLastReset: {
    days: number;
    hours: number;
    textZh: string;
    textEn: string;
  };
  lastReset: {
    dateBeijing: string;
    timeBeijing: string;
    scopeZh: string;
    scopeEn: string;
    reasonZh: string;
    reasonEn: string;
    postUrl?: string;
  };
  resets30d: number;
  cards30d: number;
  typicalGapDays: number | null;
  cadenceIntervalCount: number;
  nextEstimated: {
    dateBeijing: string;
    timeBeijing: string;
    relativeTextZh: string;
    relativeTextEn: string;
    isOverdue: boolean;
  };
  watchNotice?: WatchNotice;
  events: FormattedResetEvent[];
}

export interface ResetRadarData {
  status: 'ready' | 'empty' | 'unavailable';
  updatedAtBeijing: string | null;
  updatedAtIso: string | null;
  codex: ProviderStats;
  claude: ProviderStats;
  grok: ProviderStats;
}

// In-memory cache with 5-minute TTL
let cacheData: { data: ResetRadarData; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

function toBeijingParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    displayDate: `${get('year')}-${get('month')}-${get('day')}`,
    displayTime: `${get('hour')}:${get('minute')}`,
    full: `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`
  };
}

function formatTimeDiff(diffMs: number) {
  const isNegative = diffMs < 0;
  const absMs = Math.abs(diffMs);
  const totalHours = Math.floor(absMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  return {
    days,
    hours,
    isNegative,
    textZh: `${days} 天 ${hours} 小时`,
    textEn: `${days}d ${hours}h`
  };
}


function nonEmptyText(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

function localizedText(value: unknown, locale: 'zh-CN' | 'en') {
  return value && typeof value === 'object'
    ? nonEmptyText((value as Record<string, unknown>)[locale]) : undefined;
}

function eventPostUrl(event: RawResetEvent): string | undefined {
  const sources = Array.isArray(event.sources)
    ? event.sources.filter((source) => source && typeof source === 'object' && nonEmptyText(source.url)) : [];
  return nonEmptyText(sources.find((source) => source.role === 'landed')?.url) || nonEmptyText(sources[0]?.url);
}

function eventScope(event: RawResetEvent, locale: 'zh-CN' | 'en') {
  const labels: Record<string, [string, string]> = {
    all: ['全部用户', 'All users'],
    paid: ['付费用户', 'Paid users'],
    affected: ['受影响用户', 'Affected users'],
    max: ['Max 方案', 'Max plans'],
  };
  const scope = nonEmptyText(event.scope);
  return localizedText(event.scopeNote, locale) || (scope ? labels[scope]?.[locale === 'en' ? 1 : 0] : undefined)
    || (locale === 'en' ? 'Not specified' : '未说明');
}

function eventReason(event: RawResetEvent, locale: 'zh-CN' | 'en') {
  const note = localizedText(event.reasonNote, locale);
  const reason = nonEmptyText(event.reason);
  return note || (reason && !['unstated', 'unknown'].includes(reason.toLowerCase()) ? reason : undefined)
    || (locale === 'en' ? 'Not specified in this record' : '该记录未说明');
}

function formatEvent(event: RawResetEvent, now: number): FormattedResetEvent {
  const parts = toBeijingParts(new Date(event.landedAt));
  const diff = formatTimeDiff(now - Date.parse(event.landedAt));
  const globalReset = event.type === 'reset' && event.scope === 'all';
  const scopedReset = ['paid', 'affected', 'max'].includes(event.scope);
  return {
    id: event.id,
    provider: event.provider,
    type: event.type,
    typeLabelZh: event.type === 'card' ? '重置卡' : globalReset ? '全局重置' : scopedReset ? '指定范围重置' : '重置（范围未说明）',
    typeLabelEn: event.type === 'card' ? 'Reset card' : globalReset ? 'Global reset' : scopedReset ? 'Scoped reset' : 'Reset (scope unspecified)',
    scopeZh: eventScope(event, 'zh-CN'),
    scopeEn: eventScope(event, 'en'),
    reasonZh: eventReason(event, 'zh-CN'),
    reasonEn: eventReason(event, 'en'),
    landedAtBeijing: parts.full,
    timeAgoZh: diff.textZh + ' 前',
    timeAgoEn: diff.textEn + ' ago',
    postUrl: eventPostUrl(event),
  };
}

function computeProviderStats(
  provider: 'codex' | 'claude' | 'grok',
  allEvents: RawResetEvent[],
  remoteWatch?: any
): ProviderStats {
  const now = Date.now();
  // Aggregate timestamps do not identify an event. All display fields are
  // derived from actual records; future notices belong in watch, not history.
  const events = allEvents
    .filter((event) => event && event.provider === provider
      && ['reset', 'card'].includes(event.type)
      && typeof event.landedAt === 'string'
      && Number.isFinite(Date.parse(event.landedAt))
      && Date.parse(event.landedAt) <= now)
    .sort((a, b) => Date.parse(b.landedAt) - Date.parse(a.landedAt));
  const resetEvents = events.filter((event) => event.type === 'reset');
  const lastResetEvent = resetEvents[0];
  const formattedEvents = events.slice(0, 30).map((event) => formatEvent(event, now));

  let sinceLastReset = { days: 0, hours: 0, textZh: '暂无数据', textEn: 'No data' };
  let lastResetObj = {
    dateBeijing: '--',
    timeBeijing: '--',
    scopeZh: '未说明',
    scopeEn: 'Not specified',
    reasonZh: '该记录未说明',
    reasonEn: 'Not specified in this record',
    postUrl: undefined as string | undefined,
  };
  if (lastResetEvent) {
    const event = formatEvent(lastResetEvent, now);
    const diff = formatTimeDiff(now - Date.parse(lastResetEvent.landedAt));
    const parts = toBeijingParts(new Date(lastResetEvent.landedAt));
    sinceLastReset = { days: diff.days, hours: diff.hours, textZh: diff.textZh, textEn: diff.textEn };
    lastResetObj = {
      dateBeijing: parts.displayDate,
      timeBeijing: parts.displayTime,
      scopeZh: event.scopeZh,
      scopeEn: event.scopeEn,
      reasonZh: event.reasonZh,
      reasonEn: event.reasonEn,
      postUrl: event.postUrl,
    };
  }

  const resets30d = resetEvents.filter((event) => Date.parse(event.landedAt) >= now - 30 * 86400000).length;
  const cards30d = events.filter((event) => event.type === 'card' && Date.parse(event.landedAt) >= now - 30 * 86400000).length;

  // Use up to 10 distinct, explicitly global resets, excluding cards and
  // targeted resets. Missing history never falls back to a made-up cadence.
  const globalTimes = [...new Set(resetEvents.filter((event) => event.scope === 'all')
    .map((event) => Date.parse(event.landedAt)))].slice(0, 10);
  const gaps = globalTimes.slice(1).map((time, index) => globalTimes[index] - time).sort((a, b) => a - b);
  const middle = Math.floor(gaps.length / 2);
  const medianGap = gaps.length ? (gaps.length % 2 ? gaps[middle] : (gaps[middle - 1] + gaps[middle]) / 2) : null;
  const typicalGapDays = medianGap === null ? null : Number((medianGap / 86400000).toFixed(1));
  let nextEstimated = {
    dateBeijing: '--', timeBeijing: '--',
    relativeTextZh: '全局重置记录不足', relativeTextEn: 'Not enough global reset records',
    isOverdue: false,
  };
  if (medianGap !== null) {
    const estimatedTime = globalTimes[0] + medianGap;
    const parts = toBeijingParts(new Date(estimatedTime));
    const remaining = estimatedTime - now;
    const diff = formatTimeDiff(remaining);
    nextEstimated = {
      dateBeijing: parts.displayDate,
      timeBeijing: parts.displayTime,
      relativeTextZh: remaining > 0 ? '距参考点约 ' + diff.textZh : '参考点已过 ' + diff.textZh,
      relativeTextEn: remaining > 0 ? 'Reference point in ' + diff.textEn : 'Reference point passed ' + diff.textEn + ' ago',
      isOverdue: remaining <= 0,
    };
  }

  let watchNotice: WatchNotice | undefined;
  if (remoteWatch) {
    const scheduledTime = Date.parse(remoteWatch.scheduledAt);
    watchNotice = {
      isOpen: !!remoteWatch.open,
      scheduledAtBeijing: Number.isFinite(scheduledTime) ? toBeijingParts(new Date(scheduledTime)).full : undefined,
      tweetUrl: remoteWatch.url,
      titleZh: remoteWatch.title?.['zh-CN'],
      titleEn: remoteWatch.title?.en,
      text: remoteWatch.text,
    };
  }

  return {
    provider,
    name: provider === 'codex' ? 'OpenAI Codex' : provider === 'claude' ? 'Anthropic Claude' : 'xAI Grok',
    sourceAccount: 'WhenReset.dev',
    latestEvent: formattedEvents[0] || null,
    sinceLastReset,
    lastReset: lastResetObj,
    resets30d,
    cards30d,
    typicalGapDays,
    cadenceIntervalCount: gaps.length,
    nextEstimated,
    watchNotice,
    events: formattedEvents,
  };
}

export async function getResetRadarData(): Promise<ResetRadarData> {
  const now = Date.now();
  if (cacheData && cacheData.expiresAt > now) {
    return cacheData.data;
  }

  let events: RawResetEvent[] = [];
  let watchRemote: any = null;
  let fetchedAt: Date | null = null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const res = await fetch('https://whenreset.dev/api/resets', {
      headers: { 'User-Agent': 'TSalon-ResetRadar/1.0 (+https://tsalon.tech)' },
      signal: controller.signal
    });
    if (res.ok) {
      const json = await res.json();
      if (json && typeof json === 'object' && Array.isArray(json.events)) {
        events = json.events;
        fetchedAt = new Date();
        if (json.watch) watchRemote = json.watch;
      }
    }
  } catch (err) {
    console.warn('[reset-radar] Failed to fetch records from whenreset.dev:', err);
  } finally {
    clearTimeout(timeout);
  }

  const codex = computeProviderStats('codex', events, watchRemote?.codex);
  const claude = computeProviderStats('claude', events, watchRemote?.claude);
  const grok = computeProviderStats('grok', events, watchRemote?.grok);

  const data: ResetRadarData = {
    status: !fetchedAt ? 'unavailable' : codex.events.length || claude.events.length || grok.events.length ? 'ready' : 'empty',
    updatedAtBeijing: fetchedAt ? toBeijingParts(fetchedAt).full : null,
    updatedAtIso: fetchedAt?.toISOString() || null,
    codex,
    claude,
    grok,
  };

  cacheData = {
    data,
    expiresAt: now + CACHE_TTL_MS
  };

  return data;
}
