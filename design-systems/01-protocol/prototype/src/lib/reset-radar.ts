export interface ResetSource {
  role: string;
  postId?: string;
  account?: string;
  at?: string;
  url: string;
}

export interface RawResetEvent {
  id: string;
  provider: 'codex' | 'claude';
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
  provider: 'codex' | 'claude';
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
  provider: 'codex' | 'claude';
  name: string;
  sourceAccount: string;
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
  typicalGapDays: number;
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
  updatedAtBeijing: string;
  updatedAtIso: string;
  codex: ProviderStats;
  claude: ProviderStats;
}

// In-memory cache with 5-minute TTL
let cacheData: { data: ResetRadarData; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

function toBeijingParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  return {
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    displayDate: `${get('month')}-${get('day')}`,
    displayTime: `${get('hour')}:${get('minute')}`,
    full: `${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`
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

function computeProviderStats(
  provider: 'codex' | 'claude',
  allEvents: RawResetEvent[],
  remoteStats?: any,
  remoteWatch?: any
): ProviderStats {
  const events = allEvents
    .filter((e) => e.provider === provider)
    .sort((a, b) => new Date(b.landedAt).getTime() - new Date(a.landedAt).getTime());

  const now = Date.now();
  const resetEvents = events.filter((e) => e.type === 'reset');
  const lastResetEvent = resetEvents[0] || events[0];

  // Since last reset
  let sinceLastReset = { days: 0, hours: 0, textZh: '暂无数据', textEn: 'No data' };
  let lastResetObj = {
    dateBeijing: '--',
    timeBeijing: '--',
    scopeZh: '全部用户',
    scopeEn: 'All users',
    reasonZh: '常规重置',
    reasonEn: 'Regular reset',
    postUrl: undefined as string | undefined
  };

  const lastResetAtIso = remoteStats?.lastResetAt || lastResetEvent?.landedAt;
  if (lastResetAtIso) {
    const lastTime = new Date(lastResetAtIso).getTime();
    const diff = formatTimeDiff(now - lastTime);
    sinceLastReset = {
      days: diff.days,
      hours: diff.hours,
      textZh: diff.textZh,
      textEn: diff.textEn
    };

    const bParts = toBeijingParts(new Date(lastTime));
    lastResetObj = {
      dateBeijing: bParts.displayDate,
      timeBeijing: bParts.displayTime,
      scopeZh: lastResetEvent?.scopeNote?.['zh-CN'] || (lastResetEvent?.scope === 'all' ? '全部用户' : lastResetEvent?.scope === 'paid' ? '付费用户' : '部分受影响用户'),
      scopeEn: lastResetEvent?.scopeNote?.en || (lastResetEvent?.scope === 'all' ? 'All users' : lastResetEvent?.scope === 'paid' ? 'Paid plans' : 'Affected users'),
      reasonZh: lastResetEvent?.reasonNote?.['zh-CN'] || lastResetEvent?.reason || '官方重置',
      reasonEn: lastResetEvent?.reasonNote?.en || lastResetEvent?.reason || 'Usage reset',
      postUrl: lastResetEvent?.sources?.find((s) => s.role === 'landed')?.url || lastResetEvent?.sources?.[0]?.url
    };
  }

  // 30 days stats
  const resets30d = remoteStats?.resetsLast30Days ?? events.filter((e) => e.type === 'reset' && new Date(e.landedAt).getTime() >= now - 30 * 86400000).length;
  const cards30d = remoteStats?.cardsLast30Days ?? events.filter((e) => e.type === 'card' && new Date(e.landedAt).getTime() >= now - 30 * 86400000).length;
  const typicalGapDays = remoteStats?.medianGapHours ? Number((remoteStats.medianGapHours / 24).toFixed(1)) : (provider === 'codex' ? 3.3 : 7.1);

  // Next estimated reset
  let nextEstimated = {
    dateBeijing: '--',
    timeBeijing: '--',
    relativeTextZh: '--',
    relativeTextEn: '--',
    isOverdue: false
  };

  const estimatedNextIso = remoteStats?.estimatedNextAt || (lastResetAtIso ? new Date(new Date(lastResetAtIso).getTime() + typicalGapDays * 86400000).toISOString() : null);
  if (estimatedNextIso) {
    const estTime = new Date(estimatedNextIso).getTime();
    const estParts = toBeijingParts(new Date(estTime));
    const remainingMs = estTime - now;

    if (remainingMs > 0) {
      const rem = formatTimeDiff(remainingMs);
      nextEstimated = {
        dateBeijing: estParts.displayDate,
        timeBeijing: estParts.displayTime,
        relativeTextZh: `约 ${rem.textZh} 后`,
        relativeTextEn: `About ${rem.textEn} to go`,
        isOverdue: false
      };
    } else {
      const over = formatTimeDiff(Math.abs(remainingMs));
      nextEstimated = {
        dateBeijing: estParts.displayDate,
        timeBeijing: estParts.displayTime,
        relativeTextZh: `已逾期 ${over.textZh}`,
        relativeTextEn: `Overdue by ${over.textEn}`,
        isOverdue: true
      };
    }
  }

  // Watch notice (Heads up from official announcement)
  let watchNotice: WatchNotice | undefined = undefined;
  if (remoteWatch) {
    watchNotice = {
      isOpen: !!remoteWatch.open,
      scheduledAtBeijing: remoteWatch.scheduledAt ? toBeijingParts(new Date(remoteWatch.scheduledAt)).full : undefined,
      tweetUrl: remoteWatch.url,
      titleZh: remoteWatch.title?.['zh-CN'],
      titleEn: remoteWatch.title?.en,
      text: remoteWatch.text
    };
  }

  // Format events list for display
  const formattedEvents: FormattedResetEvent[] = events.slice(0, 30).map((e) => {
    const eDate = new Date(e.landedAt);
    const bParts = toBeijingParts(eDate);
    const diff = formatTimeDiff(now - eDate.getTime());

    let scopeZh = '全部用户';
    let scopeEn = 'All users';
    if (e.scopeNote?.['zh-CN']) scopeZh = e.scopeNote['zh-CN'];
    else if (e.scope === 'paid') scopeZh = '付费用户';
    else if (e.scope === 'affected') scopeZh = '受影响用户';
    else if (e.scope === 'max') scopeZh = 'Max 方案';

    if (e.scopeNote?.en) scopeEn = e.scopeNote.en;
    else if (e.scope === 'paid') scopeEn = 'Paid users';
    else if (e.scope === 'affected') scopeEn = 'Affected users';
    else if (e.scope === 'max') scopeEn = 'Max plans';

    return {
      id: e.id,
      provider: e.provider,
      type: e.type,
      typeLabelZh: e.type === 'reset' ? '全局重置' : '重置卡',
      typeLabelEn: e.type === 'reset' ? 'Usage reset' : 'Reset card',
      scopeZh,
      scopeEn,
      reasonZh: e.reasonNote?.['zh-CN'] || e.reason,
      reasonEn: e.reasonNote?.en || e.reason,
      landedAtBeijing: bParts.full,
      timeAgoZh: `${diff.textZh} 前`,
      timeAgoEn: `${diff.textEn} ago`,
      postUrl: e.sources?.find((s) => s.role === 'landed')?.url || e.sources?.[0]?.url
    };
  });

  return {
    provider,
    name: provider === 'codex' ? 'OpenAI Codex' : 'Anthropic Claude',
    sourceAccount: provider === 'codex' ? '@thsottiaux · Tibo' : '@ClaudeDevs · Claude Developers',
    sinceLastReset,
    lastReset: lastResetObj,
    resets30d,
    cards30d,
    typicalGapDays,
    nextEstimated,
    watchNotice,
    events: formattedEvents
  };
}

export async function getResetRadarData(): Promise<ResetRadarData> {
  const now = Date.now();
  if (cacheData && cacheData.expiresAt > now) {
    return cacheData.data;
  }

  let events: RawResetEvent[] = [];
  let statsRemote: any = null;
  let watchRemote: any = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch('https://whenreset.dev/api/resets', {
      headers: { 'User-Agent': 'TSalon-ResetRadar/1.0 (+https://tsalon.tech)' },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      if (json && typeof json === 'object') {
        if (Array.isArray(json.events)) events = json.events;
        if (json.stats) statsRemote = json.stats;
        if (json.watch) watchRemote = json.watch;
      }
    }
  } catch (err) {
    console.warn('[reset-radar] Failed to fetch live data from whenreset.dev, using fallback:', err);
  }

  const codex = computeProviderStats('codex', events, statsRemote?.codex, watchRemote?.codex);
  const claude = computeProviderStats('claude', events, statsRemote?.claude, watchRemote?.claude);

  const bParts = toBeijingParts(new Date());
  const data: ResetRadarData = {
    updatedAtBeijing: bParts.full,
    updatedAtIso: new Date().toISOString(),
    codex,
    claude
  };

  cacheData = {
    data,
    expiresAt: now + CACHE_TTL_MS
  };

  return data;
}
