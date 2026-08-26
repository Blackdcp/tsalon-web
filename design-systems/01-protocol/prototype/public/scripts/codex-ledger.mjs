import { createHash, createHmac } from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const COUNTERS = ['input_total', 'net_new_input', 'output', 'cache_read', 'cache_write', 'total', 'norm'];
const TIER_COUNTERS = ['net_new_input', 'cache_read', 'cache_write', 'output'];
const CANONICAL_MODELS = new Set([
  'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna',
  'claude-fable-5', 'claude-3-5-sonnet', 'gemini-2.5-pro',
]);
const MODEL_ALIASES = Object.freeze({
  antigravity: 'gemini-2.5-pro',
  claude: 'claude-3-5-sonnet',
  codex: 'gpt-5.6-sol',
  codex_proxy: 'gpt-5.6-sol',
  cursor: 'gpt-5.6-sol',
});

function positiveInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function nonNegativeSafeInt(value) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function auditDate(value) {
  if (typeof value !== 'string') return null;
  const date = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date ? null : date;
}

function sanitizeDailyBuckets(raw) {
  if (!Array.isArray(raw)) return [];
  const buckets = new Map();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const date = auditDate(item.date ?? item.day ?? item.startDate ?? item.start_time);
    const tokens = nonNegativeSafeInt(item.tokens ?? item.totalTokens ?? item.total_tokens ?? item.tokenCount);
    if (date === null || tokens === null) continue;
    buckets.set(date, tokens);
  }
  return [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, tokens]) => ({ date, tokens }));
}

function codexBinaryCandidates() {
  const candidates = [];
  if (process.env.CODEX_BINARY) candidates.push(process.env.CODEX_BINARY);
  candidates.push('codex');
  if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/ChatGPT.app/Contents/Resources/codex',
      '/Applications/ChatGPT.app/Contents/MacOS/codex',
    );
  }
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA;
    const programFiles = process.env.ProgramFiles;
    if (localAppData) candidates.push(
      path.join(localAppData, 'Programs', 'ChatGPT', 'codex.exe'),
      path.join(localAppData, 'ChatGPT', 'codex.exe'),
    );
    if (programFiles) candidates.push(path.join(programFiles, 'ChatGPT', 'codex.exe'));
  }
  return [...new Set(candidates.filter(Boolean))];
}

function appServerRpc(binary) {
  const child = spawn(binary, ['app-server'], { stdio: ['pipe', 'pipe', 'ignore'] });
  let nextId = 1;
  const pending = new Map();
  let buffer = '';
  const rejectAll = (error) => {
    for (const { reject } of pending.values()) reject(error);
    pending.clear();
  };
  child.on('error', rejectAll);
  child.on('exit', () => rejectAll(new Error('Codex app-server exited')));
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    buffer += chunk;
    let newline;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + 1);
      let message;
      try { message = JSON.parse(line); } catch { continue; }
      if (!message || typeof message.id !== 'number' || !pending.has(message.id)) continue;
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request.reject(new Error('Codex app-server request failed'));
      else request.resolve(message.result);
    }
  });
  const request = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    try {
      child.stdin.write(`${JSON.stringify({ id, method, params })}\n`);
    } catch (error) {
      pending.delete(id);
      reject(error);
    }
  });
  return {
    initialize: () => request('initialize', { clientInfo: { name: 't-salon-token-agent', title: 'T Salon Token Agent', version: '5' } }),
    initialized: () => child.stdin.write(`${JSON.stringify({ method: 'initialized', params: {} })}\n`),
    readAccount: () => request('account/read', { refreshToken: false }),
    readUsage: () => request('account/usage/read'),
    close: async () => {
      child.kill();
    },
  };
}

async function withTimeout(promise, timeoutMs) {
  let timeout;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Codex audit timed out')), timeoutMs); }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

async function readFromAppServer(deadline) {
  let lastError = null;
  for (const binary of codexBinaryCandidates()) {
    let rpc;
    try {
      rpc = appServerRpc(binary);
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new Error('Codex audit timed out');
      await withTimeout(rpc.initialize(), remaining);
      rpc.initialized();
      return rpc;
    } catch (error) {
      lastError = error;
      await rpc?.close();
    }
  }
  throw lastError || new Error('Codex app-server is unavailable');
}

export async function readOfficialCodexAudit({ token, timeoutMs = 5000, rpc } = {}) {
  if (typeof token !== 'string' || !token || !Number.isFinite(timeoutMs) || timeoutMs <= 0) return null;
  const deadline = Date.now() + Math.floor(timeoutMs);
  const remainingTimeout = () => Math.max(1, deadline - Date.now());
  let client = rpc;
  try {
    if (!client) client = await readFromAppServer(deadline);
    const accountResult = await withTimeout(client.readAccount(), remainingTimeout());
    const account = accountResult?.account ?? accountResult;
    const accountType = String(account?.type ?? account?.accountType ?? '').toLowerCase();
    const email = String(account?.email ?? '').trim().toLowerCase();
    if (accountType !== 'chatgpt' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    const usageResult = await withTimeout(client.readUsage(), remainingTimeout());
    const usage = usageResult?.usage ?? usageResult;
    const lifetimeTokens = nonNegativeSafeInt(usage?.summary?.lifetimeTokens ?? usage?.summary?.lifetime_tokens);
    if (lifetimeTokens === null) return null;
    return {
      account_audit_key: createHmac('sha256', token).update(email).digest('hex'),
      lifetime_tokens: lifetimeTokens,
      daily_buckets: sanitizeDailyBuckets(usage?.dailyUsageBuckets ?? usage?.daily_usage_buckets),
      observed_at: new Date().toISOString(),
    };
  } catch {
    console.warn('Codex official audit unavailable; continuing with local ledger upload.');
    return null;
  } finally {
    try {
      await client?.close?.();
    } catch {
      // Cleanup is best effort; an audit transport error must never affect upload.
    }
  }
}

export function normalizeCodexUsage(raw = {}) {
  const inputTotal = positiveInt(raw.input_tokens);
  const output = positiveInt(raw.output_tokens);
  const cacheRead = positiveInt(raw.cached_input_tokens ?? raw.cache_read_input_tokens);
  const cacheWrite = positiveInt(raw.cache_write_input_tokens);
  const total = inputTotal + output;
  const netNewInput = Math.max(0, inputTotal - cacheRead - cacheWrite);
  return {
    input_total: inputTotal,
    net_new_input: netNewInput,
    output,
    cache_read: cacheRead,
    cache_write: cacheWrite,
    total,
    norm: netNewInput + output,
  };
}

function usageDelta(current, previous) {
  if (!previous || current.total < previous.total) return current;
  return Object.fromEntries(COUNTERS.map((key) => [key, Math.max(0, current[key] - previous[key])]));
}

function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeCachedModelId(raw) {
  const id = String(raw || '').trim().toLowerCase().split('/').at(-1) || '';
  if (id === 'gpt-5.6') return 'gpt-5.6-sol';
  if (CANONICAL_MODELS.has(id)) return id;
  if (id.startsWith('claude-3-5-sonnet')) return 'claude-3-5-sonnet';
  if (id.startsWith('gpt-5.6-sol')) return 'gpt-5.6-sol';
  return Object.hasOwn(MODEL_ALIASES, id) ? MODEL_ALIASES[id] : 'unknown';
}

function sanitizedCachedCounters(raw) {
  return Object.fromEntries(COUNTERS.map((key) => [key, Number(raw?.[key]) || 0]));
}

function sanitizedCachedTiers(raw) {
  return {
    base: Object.fromEntries(TIER_COUNTERS.map((key) => [key, Number(raw?.base?.[key]) || 0])),
    long: Object.fromEntries(TIER_COUNTERS.map((key) => [key, Number(raw?.long?.[key]) || 0])),
  };
}

function sanitizedCachedRecord(raw) {
  if (!raw || typeof raw !== 'object'
    || typeof raw.turn_key !== 'string' || typeof raw.session_key !== 'string') return null;
  const daily = {};
  if (raw.daily && typeof raw.daily === 'object' && !Array.isArray(raw.daily)) {
    for (const [date, usage] of Object.entries(raw.daily)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !usage || typeof usage !== 'object') continue;
      daily[date] = {
        ...sanitizedCachedCounters(usage),
        pricing_tiers: sanitizedCachedTiers(usage.pricing_tiers),
      };
    }
  }
  return {
    turn_key: raw.turn_key,
    session_key: raw.session_key,
    model: normalizeCachedModelId(raw.model),
    ...sanitizedCachedCounters(raw),
    pricing_tiers: sanitizedCachedTiers(raw.pricing_tiers),
    daily,
  };
}

function sanitizedCachedRecords(raw) {
  if (!Array.isArray(raw)) return null;
  return raw.map(sanitizedCachedRecord).filter(Boolean);
}

function emptyCounters() {
  return Object.fromEntries(COUNTERS.map((key) => [key, 0]));
}

function emptyTier() {
  return { net_new_input: 0, cache_read: 0, cache_write: 0, output: 0 };
}

function emptyDailyUsage() {
  return {
    ...emptyCounters(),
    pricing_tiers: { base: emptyTier(), long: emptyTier() },
  };
}

function addCounters(target, source) {
  for (const key of COUNTERS) target[key] += Number(source?.[key]) || 0;
}

function addTier(target, source) {
  for (const key of Object.keys(target)) target[key] += Number(source?.[key]) || 0;
}

function beijingDate(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function findSessionFiles(dir) {
  const files = [];
  let available = true;
  const visit = (current) => {
    let entries = [];
    try { entries = fs.readdirSync(current, { withFileTypes: true }); } catch {
      available = false;
      return;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile() && entry.name.endsWith('.jsonl')) files.push(full);
    }
  };
  visit(dir);
  return { files: files.sort(), available };
}

function makeRecord(sessionId, turnId, model) {
  return {
    turn_key: hash(`${sessionId}|${turnId}`),
    session_key: hash(sessionId),
    model: normalizeCachedModelId(model),
    ...emptyCounters(),
    pricing_tiers: { base: emptyTier(), long: emptyTier() },
    daily: {},
  };
}

function parseSessionFile(filePath, relativePath) {
  const records = new Map();
  let sessionId = null;
  let turnId = null;
  let model = null;
  let previous = null;
  let tokenEventSequence = 0;
  const seenLastUsage = new Set();
  let content = '';
  try { content = fs.readFileSync(filePath, 'utf8'); } catch (error) {
    return { status: error?.code === 'ENOENT' ? 'deleted' : 'unreadable', records: [] };
  }
  for (const line of content.split('\n')) {
    if (!line.trim()) continue;
    let event;
    try { event = JSON.parse(line); } catch (error) {
      console.warn(`Codex session ${hash(relativePath).slice(0, 16)}: ${error.name}`);
      return { status: 'invalid', records: [] };
    }
    if (event.type === 'session_meta') {
      sessionId = event.payload?.id || null;
      turnId = null;
      model = null;
      previous = null;
      tokenEventSequence = 0;
      continue;
    }
    if (event.type === 'turn_context') {
      turnId = event.payload?.turn_id || null;
      model = event.payload?.model || null;
      continue;
    }
    const info = event.payload?.type === 'token_count' ? event.payload.info : null;
    const cumulativeUsage = info?.total_token_usage;
    const lastUsage = info?.last_token_usage;
    const rawUsage = cumulativeUsage || lastUsage;
    if (!sessionId || !rawUsage) continue;
    tokenEventSequence += 1;
    const fallbackTurnId = `fallback:${tokenEventSequence}:${typeof event.timestamp === 'string' ? event.timestamp : ''}`;
    const recordTurnId = turnId || fallbackTurnId;
    const current = normalizeCodexUsage(rawUsage);
    const isLastUsage = !cumulativeUsage && Boolean(lastUsage);
    const fingerprintTurnId = turnId || `fallback:${typeof event.timestamp === 'string' ? event.timestamp : ''}`;
    const fingerprint = hash(`${sessionId}|${fingerprintTurnId}|${stableJson(rawUsage)}`);
    if (isLastUsage && seenLastUsage.has(fingerprint)) continue;
    if (isLastUsage) seenLastUsage.add(fingerprint);
    const delta = isLastUsage ? current : usageDelta(current, previous);
    if (!isLastUsage) previous = current;
    const key = hash(`${sessionId}|${recordTurnId}`);
    if (!records.has(key)) records.set(key, makeRecord(sessionId, recordTurnId, model));
    const record = records.get(key);
    addCounters(record, delta);
    const day = beijingDate(event.timestamp);
    const tierName = delta.input_total > 272_000 ? 'long' : 'base';
    if (day) {
      if (!record.daily[day]) record.daily[day] = emptyDailyUsage();
      addCounters(record.daily[day], delta);
      addTier(record.daily[day].pricing_tiers[tierName], delta);
    }
    addTier(record.pricing_tiers[tierName], delta);
  }
  return { status: 'ok', records: [...records.values()] };
}

function preferRecord(current, candidate) {
  if (!current || candidate.total > current.total) return candidate;
  const completeness = (record) => (record.model !== 'unknown' ? 1 : 0) + Object.keys(record.daily || {}).length;
  if (candidate.total === current.total && completeness(candidate) > completeness(current)) return candidate;
  return current;
}

export async function scanCodexLedger(home, options = {}) {
  const sessionsDir = path.join(home, '.codex', 'sessions');
  const discovery = findSessionFiles(sessionsDir);
  const files = discovery.files;
  let authoritative = discovery.available;
  const cacheDir = path.join(home, '.tsalon');
  const cachePath = path.join(cacheDir, 'codex-session-cache-v5.json');
  let cachedFiles = {};
  let cacheVersion = 0;
  try {
    const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    if ([6, 7].includes(cache?.version) && cache.files && typeof cache.files === 'object') {
      cacheVersion = cache.version;
      cachedFiles = cache.files;
    }
  } catch {}
  const nextCachedFiles = {};
  const recordsByKey = new Map();
  let cachedCount = 0;
  let parsedCount = 0;
  let skippedCount = 0;
  let staleCount = 0;
  let deletedCount = 0;
  let usableFileCount = 0;
  for (let index = 0; index < files.length; index++) {
    const filePath = files[index];
    const relativePath = path.relative(sessionsDir, filePath);
    const sourceKey = hash(`codex-session-cache-v7|${relativePath}`);
    const rawCached = cacheVersion === 7 ? cachedFiles[sourceKey] : cachedFiles[relativePath];
    const cachedRecords = sanitizedCachedRecords(rawCached?.records);
    const cached = cachedRecords ? {
      size: Number(rawCached?.size) || 0,
      mtimeMs: Number(rawCached?.mtimeMs) || 0,
      records: cachedRecords,
    } : null;
    let stat;
    try { stat = fs.statSync(filePath); } catch (error) {
      skippedCount++;
      if (error?.code === 'ENOENT') {
        deletedCount++;
      } else if (cached) {
        staleCount++;
        usableFileCount++;
        nextCachedFiles[sourceKey] = cached;
        for (const record of cached.records) {
          recordsByKey.set(record.turn_key, preferRecord(recordsByKey.get(record.turn_key), record));
        }
      }
      options.onProgress?.({ current: index + 1, total: files.length });
      continue;
    }
    const cacheHit = cached?.size === stat.size && cached?.mtimeMs === stat.mtimeMs;
    const parsed = cacheHit ? null : parseSessionFile(filePath, relativePath);
    let records = cacheHit ? cached.records : parsed.records;
    if (cacheHit) {
      cachedCount++;
      nextCachedFiles[sourceKey] = cached;
    } else if (parsed.status === 'ok') {
      parsedCount++;
      nextCachedFiles[sourceKey] = { size: stat.size, mtimeMs: stat.mtimeMs, records };
    } else if (parsed.status === 'deleted') {
      skippedCount++;
      deletedCount++;
      records = [];
    } else {
      skippedCount++;
      if (cached) {
        records = cached.records;
        staleCount++;
        nextCachedFiles[sourceKey] = cached;
      } else {
        records = [];
      }
    }
    if (cacheHit || records.length > 0 || nextCachedFiles[sourceKey]) usableFileCount++;
    for (const record of records) {
      recordsByKey.set(record.turn_key, preferRecord(recordsByKey.get(record.turn_key), record));
    }
    options.onProgress?.({ current: index + 1, total: files.length });
  }
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    const temporary = `${cachePath}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify({ version: 7, files: nextCachedFiles }));
    fs.renameSync(temporary, cachePath);
  } catch {}
  const existingFileCount = Math.max(0, files.length - deletedCount);
  authoritative &&= existingFileCount === 0 || usableFileCount > 0;
  const records = (authoritative ? [...recordsByKey.values()] : [])
    .filter((record) => Number.isFinite(record.total) && record.total > 0)
    .sort((a, b) => a.turn_key.localeCompare(b.turn_key));
  const summary = emptyCounters();
  for (const record of records) addCounters(summary, record);
  return {
    records,
    summary,
    authoritative,
    available: authoritative,
    hasNativeSessions: authoritative,
    files: {
      total: files.length,
      cached: cachedCount,
      parsed: parsedCount,
      skipped: skippedCount,
      stale: staleCount,
      deleted: deletedCount,
    },
  };
}
