import { normalizeModelId, priceUsage } from './token-pricing.mjs';

const COUNTERS = Object.freeze(['input_total', 'net_new_input', 'output', 'cache_read', 'cache_write', 'total', 'norm']);
const TIER_COUNTERS = Object.freeze(['net_new_input', 'cache_read', 'cache_write', 'output']);
const MAX_RECORDS = 50_000;
const MAX_TOKENS_PER_TURN = 1e12;
const HEX_64 = /^[a-f0-9]{64}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function numberValue(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

function emptyCounters() {
  return Object.fromEntries(COUNTERS.map((key) => [key, 0]));
}

function emptyMap() {
  return Object.create(null);
}

function numericFallback(raw) {
  const total = Number(raw) || 0;
  return {
    total,
    raw_total: total,
    norm: total,
    in: total * 0.9,
    out: total * 0.1,
    cache_read: 0,
    cache_write: 0,
  };
}

export function normalizeToolTokens(tool, raw) {
  const value = typeof raw === 'number' ? numericFallback(raw) : { ...(raw || {}) };
  if (tool === 'codex' || tool === 'codex_proxy') {
    const total = Number(value.raw_total ?? value.total) || 0;
    value.total = total;
    value.raw_total = total;
    value.norm = Number.isFinite(Number(value.norm))
      ? Number(value.norm)
      : Math.max(0, total - (Number(value.cache_read) || 0) - (Number(value.cache_write) || 0));
  }
  return value;
}

export function normalizeDeviceUpload(tokens = {}, { hasCodexLedger = false } = {}) {
  const normalized = {};
  for (const [tool, raw] of Object.entries(tokens || {})) {
    if (tool === 'total' || tool === 'history') continue;
    if (hasCodexLedger && (tool === 'codex' || tool === 'codex_proxy')) continue;
    if (typeof raw !== 'number' && (!raw || typeof raw !== 'object' || Array.isArray(raw))) continue;
    normalized[tool] = normalizeToolTokens(tool, raw);
  }
  return normalized;
}

function compareStrings(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function emptyAggregate() {
  return { ...emptyCounters(), cost: 0, estimated: false };
}

function addCounters(target, source) {
  for (const key of COUNTERS) target[key] += source[key];
}

function isCalendarDate(value) {
  if (typeof value !== 'string' || !DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function validCounters(raw) {
  if (!isObject(raw)) return false;
  if (COUNTERS.some((key) => numberValue(raw[key]) === null)) return false;
  if (raw.total > MAX_TOKENS_PER_TURN) return false;
  return raw.input_total === raw.net_new_input + raw.cache_read + raw.cache_write
    && raw.total === raw.input_total + raw.output
    && raw.norm === raw.net_new_input + raw.output;
}

function validTiers(raw, record) {
  if (!isObject(raw) || !isObject(raw.base) || !isObject(raw.long)) return false;
  for (const key of TIER_COUNTERS) {
    if (numberValue(raw.base[key]) === null || numberValue(raw.long[key]) === null) return false;
    if (raw.base[key] + raw.long[key] !== record[key]) return false;
  }
  return true;
}

function validDaily(raw, record) {
  if (!isObject(raw)) return false;
  const total = emptyCounters();
  for (const [day, usage] of Object.entries(raw)) {
    if (!isCalendarDate(day) || !validCounters(usage)) return false;
    addCounters(total, usage);
  }
  return COUNTERS.every((key) => total[key] === record[key]);
}

export function validateTurnRecord(raw) {
  if (!isObject(raw) || !HEX_64.test(raw.turn_key) || !HEX_64.test(raw.session_key)) return null;
  if (typeof raw.model !== 'string' || !raw.model.trim() || !validCounters(raw)) return null;
  if (!validTiers(raw.pricing_tiers, raw) || !validDaily(raw.daily, raw)) return null;
  return structuredClone(raw);
}

function completeness(record) {
  return (record.model !== 'unknown' ? 1 : 0) + Object.keys(record.daily).length + TIER_COUNTERS.length;
}

function compareRecords(left, right, leftDevice = '', rightDevice = '') {
  const complete = completeness(right) - completeness(left);
  if (complete) return complete;
  const total = right.total - left.total;
  if (total) return total;
  return compareStrings(leftDevice, rightDevice);
}

function canonicalVersions(envelope) {
  const versions = emptyMap();
  if (!isObject(envelope) || !isObject(envelope.device_versions)) return versions;
  for (const [deviceId, record] of Object.entries(envelope.device_versions)) {
    const validRecord = validateTurnRecord(record);
    if (deviceId && validRecord) versions[deviceId] = validRecord;
  }
  return versions;
}

function materializeEnvelope(versions) {
  const sourceDevices = Object.keys(versions).sort(compareStrings);
  const winner = sourceDevices
    .map((deviceId) => ({ deviceId, record: versions[deviceId] }))
    .sort((left, right) => compareRecords(left.record, right.record, left.deviceId, right.deviceId))[0];
  return {
    record: structuredClone(winner.record),
    device_versions: Object.assign(emptyMap(), Object.fromEntries(sourceDevices.map((deviceId) => [deviceId, structuredClone(versions[deviceId])]))),
    source_devices: sourceDevices,
  };
}

function sortedCanonical(turns) {
  return Object.assign(emptyMap(), Object.fromEntries(Object.keys(turns).sort(compareStrings).map((key) => [key, turns[key]])));
}

export function reconcileDeviceTurns(existing = {}, deviceId, incoming = []) {
  if (!isObject(existing) || typeof deviceId !== 'string' || !deviceId || !Array.isArray(incoming) || incoming.length > MAX_RECORDS) {
    return sortedCanonical(Object.fromEntries(Object.entries(existing || {}).filter(([, envelope]) => isObject(envelope))));
  }
  const records = incoming.map(validateTurnRecord);
  if (records.some((record) => record === null)) return sortedCanonical(structuredClone(existing));

  const next = emptyMap();
  const incomingKeys = new Set(records.map((record) => record.turn_key));
  for (const [key, envelope] of Object.entries(existing)) {
    const versions = canonicalVersions(envelope);
    if (!(deviceId in versions) || incomingKeys.has(key)) {
      if (Object.keys(versions).length) next[key] = materializeEnvelope(versions);
      continue;
    }
    delete versions[deviceId];
    if (Object.keys(versions).length) next[key] = materializeEnvelope(versions);
  }
  for (const record of records) {
    const versions = canonicalVersions(next[record.turn_key]);
    versions[deviceId] = record;
    next[record.turn_key] = materializeEnvelope(versions);
  }
  return sortedCanonical(next);
}

function addUsage(target, usage, cost = 0, estimated = false) {
  addCounters(target, usage);
  target.cost += cost;
  target.estimated ||= estimated;
}

export function aggregateCanonicalTurns(turns = {}) {
  const daily = emptyMap();
  const models = emptyMap();
  for (const envelope of Object.values(turns || {})) {
    const record = validateTurnRecord(envelope?.record);
    if (!record) continue;
    const price = priceUsage(record.model, record.pricing_tiers);
    const normalized = normalizeModelId(record.model);
    if (!models[normalized.id]) models[normalized.id] = emptyAggregate();
    addUsage(models[normalized.id], record, price.usd, price.estimated);
    for (const [day, usage] of Object.entries(record.daily)) {
      if (!daily[day]) daily[day] = emptyAggregate();
      const dayCost = record.total ? price.usd * (usage.total / record.total) : 0;
      addUsage(daily[day], usage, dayCost, price.estimated);
    }
  }
  const lifetime = emptyAggregate();
  for (const usage of Object.values(daily)) addUsage(lifetime, usage, usage.cost, usage.estimated);
  return {
    lifetime,
    daily: Object.assign(emptyMap(), Object.fromEntries(Object.keys(daily).sort(compareStrings).map((day) => [day, daily[day]]))),
    models: Object.assign(emptyMap(), Object.fromEntries(Object.keys(models).sort(compareStrings).map((model) => [model, models[model]]))),
  };
}

export function metricValue(aggregate, metric) {
  const value = aggregate?.lifetime?.[metric];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function sortRankRows(rows = [], metric = 'total') {
  return [...rows].sort((left, right) => {
    const metricDifference = metricValue(right.aggregate || right, metric) - metricValue(left.aggregate || left, metric);
    if (metricDifference) return metricDifference;
    return compareStrings(String(left.userId || ''), String(right.userId || ''));
  });
}
