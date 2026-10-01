export interface WeeklyPaceResult {
  isValid: boolean;
  isResetDue: boolean;
  usedPercent: number;
  remainingPercent: number;
  remainingDays: number;
  remainingHours: number;
  dailyBudgetPercent: number;
  projectedTotalPercent: number;
  tier: 'comfortable' | 'on-track' | 'tight' | 'exhausted' | 'due' | 'invalid';
  badgeZh: string;
  badgeEn: string;
  summaryZh: string;
  summaryEn: string;
  depletionTimeBeijing?: string;
  depletionTimeIso?: string;
}

function toBeijingTimeStr(date: Date): string {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`;
}

export function calculateWeeklyPace(
  usedPercentInput: number,
  knownResetTimeBeijing: string,
  cycleDays = 7,
  now = Date.now()
): WeeklyPaceResult {
  if (
    !Number.isFinite(usedPercentInput) ||
    usedPercentInput < 0 ||
    usedPercentInput > 100 ||
    !knownResetTimeBeijing ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(knownResetTimeBeijing)
  ) {
    return {
      isValid: false,
      isResetDue: false,
      usedPercent: 0,
      remainingPercent: 100,
      remainingDays: 0,
      remainingHours: 0,
      dailyBudgetPercent: 0,
      projectedTotalPercent: 0,
      tier: 'invalid',
      badgeZh: '输入无效',
      badgeEn: 'Invalid Input',
      summaryZh: '请填写有效的已用百分比（0-100）及重置时间。',
      summaryEn: 'Please enter a valid usage percentage (0-100) and reset time.',
    };
  }

  const resetTimestamp = Date.parse(`${knownResetTimeBeijing}:00+08:00`);
  if (!Number.isFinite(resetTimestamp)) {
    return {
      isValid: false,
      isResetDue: false,
      usedPercent: usedPercentInput,
      remainingPercent: 100 - usedPercentInput,
      remainingDays: 0,
      remainingHours: 0,
      dailyBudgetPercent: 0,
      projectedTotalPercent: 0,
      tier: 'invalid',
      badgeZh: '日期无效',
      badgeEn: 'Invalid Date',
      summaryZh: '重置日期解析失败，请检查日期是否有效。',
      summaryEn: 'Failed to parse reset date. Please verify the date.',
    };
  }

  // Reject impossible dates like Feb 30
  const normalizedIso = new Date(resetTimestamp + 8 * 3600000).toISOString().slice(0, 16);
  if (normalizedIso !== knownResetTimeBeijing) {
    return {
      isValid: false,
      isResetDue: false,
      usedPercent: usedPercentInput,
      remainingPercent: 100 - usedPercentInput,
      remainingDays: 0,
      remainingHours: 0,
      dailyBudgetPercent: 0,
      projectedTotalPercent: 0,
      tier: 'invalid',
      badgeZh: '日期不存在',
      badgeEn: 'Date Does Not Exist',
      summaryZh: '该日期在日历中不存在（如 2 月 30 日）。',
      summaryEn: 'This date does not exist on the calendar (e.g. Feb 30).',
    };
  }

  const remainingMs = resetTimestamp - now;
  if (remainingMs <= 0) {
    return {
      isValid: true,
      isResetDue: true,
      usedPercent: usedPercentInput,
      remainingPercent: 0,
      remainingDays: 0,
      remainingHours: 0,
      dailyBudgetPercent: 0,
      projectedTotalPercent: usedPercentInput,
      tier: 'due',
      badgeZh: '已到重置时间',
      badgeEn: 'Reset Time Reached',
      summaryZh: '设定重置时间已过或正在重置中，请查看客户端刷新状态。',
      summaryEn: 'The reset time has arrived or is pending. Check your client for refreshed quota.',
    };
  }

  const cycleMs = cycleDays * 86400000;
  const elapsedMs = Math.min(cycleMs, Math.max(3600000, cycleMs - remainingMs));
  const remainingHours = Number((remainingMs / 3600000).toFixed(1));
  const remainingDays = Number((remainingMs / 86400000).toFixed(1));
  const remainingPercent = Math.max(0, 100 - usedPercentInput);

  const burnRatePerHour = usedPercentInput / (elapsedMs / 3600000);
  const projectedTotalPercent = Number((usedPercentInput + burnRatePerHour * (remainingMs / 3600000)).toFixed(1));
  const daysCeil = Math.max(1, Math.ceil(remainingDays));
  const dailyBudgetPercent = Number((remainingPercent / daysCeil).toFixed(1));

  let tier: 'comfortable' | 'on-track' | 'tight' | 'exhausted' = 'comfortable';
  let badgeZh = '余量充足';
  let badgeEn = 'Comfortable';
  let summaryZh = '消耗节奏健康，本周额度预计有较多剩余，可放心使用。';
  let summaryEn = 'Healthy pacing. Your quota is projected to comfortably last through reset.';
  let depletionTimeBeijing: string | undefined;
  let depletionTimeIso: string | undefined;

  if (projectedTotalPercent >= 100) {
    tier = 'exhausted';
    badgeZh = '预计提前耗尽';
    badgeEn = 'Will Run Out Early';
    const hoursToDepletion = burnRatePerHour > 0 ? remainingPercent / burnRatePerHour : 0;
    const depletionDate = new Date(now + hoursToDepletion * 3600000);
    depletionTimeIso = depletionDate.toISOString();
    depletionTimeBeijing = toBeijingTimeStr(depletionDate);
    summaryZh = `按当前速度预计将于 ${depletionTimeBeijing} 耗尽额度，建议放缓调用节奏。`;
    summaryEn = `Projected to run out of quota around ${depletionTimeBeijing} (UTC+8). Recommend pacing usage.`;
  } else if (projectedTotalPercent >= 88) {
    tier = 'tight';
    badgeZh = '用量偏紧';
    badgeEn = 'Pacing Tight';
    summaryZh = `预计周期结束时将使用 ${Math.round(projectedTotalPercent)}%，建议参照日均预算 ${dailyBudgetPercent}% 控制频次。`;
    summaryEn = `Projected to use ${Math.round(projectedTotalPercent)}% by reset. Recommended daily budget: ${dailyBudgetPercent}%.`;
  } else if (projectedTotalPercent >= 68) {
    tier = 'on-track';
    badgeZh = '节奏平稳';
    badgeEn = 'On Track';
    summaryZh = `当前消耗速度与时间进度相符，预计使用 ${Math.round(projectedTotalPercent)}%，保持现有频率即可。`;
    summaryEn = `Your usage pace is well-balanced. Projected total: ${Math.round(projectedTotalPercent)}%.`;
  }

  return {
    isValid: true,
    isResetDue: false,
    usedPercent: usedPercentInput,
    remainingPercent,
    remainingDays,
    remainingHours,
    dailyBudgetPercent,
    projectedTotalPercent,
    tier,
    badgeZh,
    badgeEn,
    summaryZh,
    summaryEn,
    depletionTimeBeijing,
    depletionTimeIso,
  };
}

export function initWeeklyQuotaCalculator(locale: 'zh' | 'en') {
  const root = document.getElementById('weekly-calculator-app');
  if (!root) return;

  const rawUsedSlider = root.querySelector('#weekly-used-slider') as HTMLInputElement | null;
  const rawUsedInput = root.querySelector('#weekly-used-number') as HTMLInputElement | null;
  const rawResetInput = root.querySelector('#weekly-reset-time') as HTMLInputElement | null;
  const presetBtns = root.querySelectorAll<HTMLButtonElement>('.calc-preset-btn');
  const rawResultBadge = root.querySelector('#weekly-calc-badge') as HTMLElement | null;
  const rawResultBurn = root.querySelector('#weekly-calc-burn') as HTMLElement | null;
  const rawResultBudget = root.querySelector('#weekly-calc-budget') as HTMLElement | null;
  const rawResultRemaining = root.querySelector('#weekly-calc-remaining') as HTMLElement | null;
  const rawResultSummary = root.querySelector('#weekly-calc-summary') as HTMLElement | null;

  if (
    !rawUsedSlider ||
    !rawUsedInput ||
    !rawResetInput ||
    !rawResultBadge ||
    !rawResultBurn ||
    !rawResultBudget ||
    !rawResultRemaining ||
    !rawResultSummary
  ) {
    return;
  }

  const slider = rawUsedSlider;
  const numInput = rawUsedInput;
  const timeInput = rawResetInput;
  const badge = rawResultBadge;
  const burn = rawResultBurn;
  const budget = rawResultBudget;
  const remaining = rawResultRemaining;
  const summary = rawResultSummary;

  // Load from localStorage or set defaults
  const storageKey = 'tsalon_weekly_quota_planner_v1';
  let defaultCycleDays = 7;

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.used === 'number') {
        slider.value = String(parsed.used);
        numInput.value = String(parsed.used);
      }
      if (typeof parsed.resetTime === 'string') {
        timeInput.value = parsed.resetTime;
      }
      if (typeof parsed.cycleDays === 'number') {
        defaultCycleDays = parsed.cycleDays;
      }
    }
  } catch (_) {
    // Ignore storage parse error
  }

  // If no reset time is filled yet, default to next Sunday 23:59 Beijing time
  if (!timeInput.value) {
    const now = new Date();
    const shanghaiNow = new Date(now.getTime() + 8 * 3600000);
    const day = shanghaiNow.getUTCDay();
    const daysUntilSunday = (7 - day) % 7 || 7;
    const nextSunday = new Date(shanghaiNow.getTime() + daysUntilSunday * 86400000);
    const yyyy = nextSunday.getUTCFullYear();
    const mm = String(nextSunday.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(nextSunday.getUTCDate()).padStart(2, '0');
    timeInput.value = `${yyyy}-${mm}-${dd}T23:59`;
  }

  function render() {
    const used = Number(slider.value || 0);
    const resetTime = timeInput.value || '';
    const res = calculateWeeklyPace(used, resetTime, defaultCycleDays);

    if (!res.isValid) {
      badge.textContent = locale === 'zh' ? res.badgeZh : res.badgeEn;
      badge.className = 'pace-badge badge-neutral';
      burn.textContent = '—';
      budget.textContent = '—';
      remaining.textContent = '—';
      summary.textContent = locale === 'zh' ? res.summaryZh : res.summaryEn;
      return;
    }

    if (res.isResetDue) {
      badge.textContent = locale === 'zh' ? res.badgeZh : res.badgeEn;
      badge.className = 'pace-badge badge-due';
      burn.textContent = `${res.usedPercent}%`;
      budget.textContent = '0%';
      remaining.textContent = locale === 'zh' ? '0 天' : '0d';
      summary.textContent = locale === 'zh' ? res.summaryZh : res.summaryEn;
      return;
    }

    const badgeClass =
      res.tier === 'comfortable'
        ? 'badge-success'
        : res.tier === 'on-track'
        ? 'badge-info'
        : res.tier === 'tight'
        ? 'badge-warning'
        : 'badge-danger';

    badge.textContent = locale === 'zh' ? res.badgeZh : res.badgeEn;
    badge.className = `pace-badge ${badgeClass}`;

    burn.textContent = `${Math.round(res.projectedTotalPercent)}%`;
    budget.textContent = `${res.dailyBudgetPercent}% / ${locale === 'zh' ? '天' : 'day'}`;
    remaining.textContent =
      locale === 'zh' ? `${res.remainingDays} 天 (${res.remainingHours} 小时)` : `${res.remainingDays}d (${res.remainingHours}h)`;
    summary.textContent = locale === 'zh' ? res.summaryZh : res.summaryEn;

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          used,
          resetTime,
          cycleDays: defaultCycleDays,
        })
      );
    } catch (_) {
      // Ignore storage error
    }
  }

  slider.addEventListener('input', () => {
    numInput.value = slider.value;
    render();
  });

  numInput.addEventListener('input', () => {
    let val = Number(numInput.value);
    if (val < 0) val = 0;
    if (val > 100) val = 100;
    slider.value = String(val);
    render();
  });

  timeInput.addEventListener('input', render);

  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      presetBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = btn.dataset.preset;
      if (preset === 'cursor') {
        defaultCycleDays = 30;
      } else {
        defaultCycleDays = 7;
      }
      render();
    });
  });

  render();
}
