import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const COUNTERS = ['input_total', 'net_new_input', 'output', 'cache_read', 'cache_write', 'total', 'norm'];

function positiveInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function normalizeCodexUsage(raw = {}) {
  const inputTotal = positiveInt(raw.input_tokens);
  const output = positiveInt(raw.output_tokens);
  const cacheRead = positiveInt(raw.cached_input_tokens ?? raw.cache_read_input_tokens);
  const cacheWrite = positiveInt(raw.cache_write_input_tokens);
  const total = positiveInt(raw.total_tokens) || inputTotal + output;
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

function emptyCounters() {
  return Object.fromEntries(COUNTERS.map((key) => [key, 0]));
}

function emptyTier() {
  return { net_new_input: 0, cache_read: 0, cache_write: 0, output: 0 };
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
  const visit = (current) => {
    let entries = [];
    try { entries = fs.readdirSync(current, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile() && entry.name.endsWith('.jsonl')) files.push(full);
    }
  };
  visit(dir);
  return files.sort();
}

function makeRecord(sessionId, turnId, model) {
  return {
    turn_key: hash(`${sessionId}|${turnId}`),
    session_key: hash(sessionId),
    model: model || 'unknown',
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
  const seenLastUsage = new Set();
  let content = '';
  try { content = fs.readFileSync(filePath, 'utf8'); } catch { return []; }
  for (const line of content.split('\n')) {
    if (!line.trim()) continue;
    let event;
    try { event = JSON.parse(line); } catch (error) {
      console.warn(`Codex session ${hash(relativePath).slice(0, 16)}: ${error.name}`);
      continue;
    }
    if (event.type === 'session_meta') {
      sessionId = event.payload?.id || null;
      turnId = null;
      model = null;
      previous = null;
      continue;
    }
    if (event.type === 'turn_context') {
      turnId = event.payload?.turn_id || null;
      model = event.payload?.model || null;
      continue;
    }
    const info = event.payload?.type === 'token_count' ? event.payload.info : null;
    const rawUsage = info?.total_token_usage || info?.last_token_usage;
    if (!sessionId || !turnId || !rawUsage) continue;
    const current = normalizeCodexUsage(rawUsage);
    const isLastUsage = !Object.hasOwn(rawUsage, 'total_tokens');
    const fingerprint = hash(`${sessionId}|${turnId}|${stableJson(rawUsage)}`);
    if (isLastUsage && seenLastUsage.has(fingerprint)) continue;
    if (isLastUsage) seenLastUsage.add(fingerprint);
    const delta = isLastUsage ? current : usageDelta(current, previous);
    if (!isLastUsage) previous = current;
    const key = hash(`${sessionId}|${turnId}`);
    if (!records.has(key)) records.set(key, makeRecord(sessionId, turnId, model));
    const record = records.get(key);
    addCounters(record, delta);
    const day = beijingDate(event.timestamp);
    if (day) {
      if (!record.daily[day]) record.daily[day] = emptyCounters();
      addCounters(record.daily[day], delta);
    }
    const tier = current.input_total > 272_000 ? record.pricing_tiers.long : record.pricing_tiers.base;
    addTier(tier, delta);
  }
  return [...records.values()];
}

function preferRecord(current, candidate) {
  if (!current || candidate.total > current.total) return candidate;
  const completeness = (record) => (record.model !== 'unknown' ? 1 : 0) + Object.keys(record.daily || {}).length;
  if (candidate.total === current.total && completeness(candidate) > completeness(current)) return candidate;
  return current;
}

export async function scanCodexLedger(home, options = {}) {
  const sessionsDir = path.join(home, '.codex', 'sessions');
  const files = findSessionFiles(sessionsDir);
  const cacheDir = path.join(home, '.tsalon');
  const cachePath = path.join(cacheDir, 'codex-session-cache-v5.json');
  let cachedFiles = {};
  try {
    const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    if (cache?.version === 5 && cache.files && typeof cache.files === 'object') cachedFiles = cache.files;
  } catch {}
  const nextCachedFiles = {};
  const recordsByKey = new Map();
  for (let index = 0; index < files.length; index++) {
    const filePath = files[index];
    const relativePath = path.relative(sessionsDir, filePath);
    let stat;
    try { stat = fs.statSync(filePath); } catch { continue; }
    const cached = cachedFiles[relativePath];
    const records = cached?.size === stat.size && cached?.mtimeMs === stat.mtimeMs && Array.isArray(cached.records)
      ? cached.records
      : parseSessionFile(filePath, relativePath);
    nextCachedFiles[relativePath] = { size: stat.size, mtimeMs: stat.mtimeMs, records };
    for (const record of records) {
      recordsByKey.set(record.turn_key, preferRecord(recordsByKey.get(record.turn_key), record));
    }
    options.onProgress?.({ current: index + 1, total: files.length });
  }
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    const temporary = `${cachePath}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify({ version: 5, files: nextCachedFiles }));
    fs.renameSync(temporary, cachePath);
  } catch {}
  const records = [...recordsByKey.values()].sort((a, b) => a.turn_key.localeCompare(b.turn_key));
  const summary = emptyCounters();
  for (const record of records) addCounters(summary, record);
  return {
    records,
    summary,
    hasNativeSessions: files.length > 0,
    files: { total: files.length, cached: files.length },
  };
}
