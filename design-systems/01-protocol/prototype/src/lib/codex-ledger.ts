import { createHash, randomUUID } from 'node:crypto';
import { gunzipSync, gzipSync } from 'node:zlib';

import { PRICING_SNAPSHOT_DATE, normalizeModelId, priceUsage } from './token-pricing.mjs';
import { aggregateCanonicalTurns, reconcileDeviceTurns, validateTurnRecord } from './tokenrank-domain.mjs';

export interface CodexLedgerPayload {
  version: 5;
  full_sync: true;
  manifest_hash: string;
  records: Record<string, any>[];
}

export interface CodexLedgerSummary {
  lifetime: Record<string, number | boolean>;
  daily: Record<string, Record<string, number | boolean>>;
  models: Record<string, Record<string, number | boolean>>;
}

export interface RedisCommitOperations {
  renames?: Array<[string, string]>;
  deletes?: string[];
  sets?: Array<[string, string]>;
  zadds?: Array<[string, number, string]>;
  rpushes?: Array<[string, string[]]>;
  persists?: string[];
}

export interface SyncCodexLedgerOptions {
  commit?: (operations: RedisCommitOperations) => Promise<void>;
}

const COUNTERS = ['input_total', 'net_new_input', 'output', 'cache_read', 'cache_write', 'total', 'norm'];
const MAX_RECORDS = 50_000;
const REDIS_CHUNK_SIZE = 500;
const GENERATION_STAGING_TTL_SECONDS = 24 * 60 * 60;
const GENERATION_READER_GRACE_SECONDS = 60 * 60;
const ACCOUNT_AUDIT_TTL_SECONDS = 120 * 24 * 60 * 60;
const ACCOUNT_AUDIT_WRITE_TIMEOUT_MS = 250;
const MAX_ACCOUNT_AUDIT_BYTES = 192 * 1024;
const MAX_ACCOUNT_AUDIT_USER_ID_LENGTH = 128;
const CODEX_LEDGER_TURNS_BLOB_SCHEMA = 'codex-ledger-turns-v1';
const CODEX_LEDGER_TURNS_BLOB_SUFFIX = ':turns:gzip-base64-v1';
const MAX_CODEX_LEDGER_TURNS_JSON_BYTES = 128 * 1024 * 1024;
const MAX_CODEX_LEDGER_TURNS_BASE64_LENGTH = Math.ceil(MAX_CODEX_LEDGER_TURNS_JSON_BYTES * 4 / 3) + 4;
const CANONICAL_TURN_KEY = /^[a-f0-9]{64}$/;
type RedisLike = any;
type CanonicalTurns = Record<string, any>;
type UsageAggregate = Record<string, any>;

export interface CodexLedgerGenerationState {
  devices: Record<string, {
    version: 5;
    manifest: { manifest_hash: string; turn_keys: string[] };
  }>;
  dates: string[];
}

export interface CodexLedgerView {
  generation: string | null;
  prefix: string | null;
  turns: CanonicalTurns;
  summary: CodexLedgerSummary | null;
  state: CodexLedgerGenerationState;
}

export interface CodexAccountAudit {
  account_audit_key: string;
  lifetime_tokens: number;
  daily_buckets: Array<{ date: string; tokens: number }>;
  observed_at: string;
}

function validAuditDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validAuditInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function validObservedAt(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const observed = new Date(value);
  return !Number.isNaN(observed.getTime()) && observed.toISOString() === value;
}

function accountAuditSerializedBytes(audit: unknown): number {
  try {
    const serialized = JSON.stringify(audit);
    return typeof serialized === 'string' ? new TextEncoder().encode(serialized).byteLength : Number.POSITIVE_INFINITY;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function sanitizeAccountAudit(audit: unknown): CodexAccountAudit {
  if (!audit || typeof audit !== 'object' || Array.isArray(audit)
    || accountAuditSerializedBytes(audit) > MAX_ACCOUNT_AUDIT_BYTES) throw new Error('Invalid Codex account audit');
  const value = audit as Record<string, unknown>;
  const permitted = new Set(['account_audit_key', 'lifetime_tokens', 'daily_buckets', 'observed_at']);
  if (Object.keys(value).some((key) => !permitted.has(key))
    || typeof value.account_audit_key !== 'string'
    || !/^[a-f0-9]{64}$/i.test(value.account_audit_key)
    || !validAuditInteger(value.lifetime_tokens)
    || !Array.isArray(value.daily_buckets)
    || value.daily_buckets.length > 3_660
    || !validObservedAt(value.observed_at)) {
    throw new Error('Invalid Codex account audit');
  }
  const seenDates = new Set<string>();
  const daily_buckets = value.daily_buckets.map((bucket) => {
    if (!bucket || typeof bucket !== 'object' || Array.isArray(bucket)) throw new Error('Invalid Codex account audit');
    const item = bucket as Record<string, unknown>;
    if (Object.keys(item).length !== 2 || !validAuditDate(item.date) || !validAuditInteger(item.tokens) || seenDates.has(item.date)) {
      throw new Error('Invalid Codex account audit');
    }
    seenDates.add(item.date);
    return { date: item.date, tokens: item.tokens };
  });
  return {
    account_audit_key: String(value.account_audit_key).toLowerCase(),
    lifetime_tokens: value.lifetime_tokens,
    daily_buckets,
    observed_at: new Date(value.observed_at).toISOString(),
  };
}

function validateAuditUserId(userId: unknown): asserts userId is string {
  if (typeof userId !== 'string' || userId.length > MAX_ACCOUNT_AUDIT_USER_ID_LENGTH || !/^[a-z0-9_-]+$/i.test(userId)) {
    throw new Error('Invalid Codex account audit');
  }
}

async function persistAccountAudit(redis: RedisLike, userId: string, sanitized: CodexAccountAudit): Promise<CodexAccountAudit> {
  await redis.set(
    `user:${userId}:codex:audit:${sanitized.account_audit_key}`,
    JSON.stringify(sanitized),
    'EX',
    ACCOUNT_AUDIT_TTL_SECONDS,
  );
  return sanitized;
}

export async function storeAccountAudit(redis: RedisLike, userId: string, audit: unknown): Promise<CodexAccountAudit> {
  validateAuditUserId(userId);
  return persistAccountAudit(redis, userId, sanitizeAccountAudit(audit));
}

export async function storeAccountAuditWithTimeout(
  redis: RedisLike,
  userId: string,
  audit: unknown,
  timeoutMs = ACCOUNT_AUDIT_WRITE_TIMEOUT_MS,
): Promise<CodexAccountAudit | null> {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) return null;
  let sanitized: CodexAccountAudit;
  try {
    validateAuditUserId(userId);
    sanitized = sanitizeAccountAudit(audit);
  } catch {
    return null;
  }
  const write = persistAccountAudit(redis, userId, sanitized);
  // The response may win the timeout race; consume a late Redis rejection.
  void write.catch(() => {});
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      write,
      new Promise<null>((resolve) => { timeout = setTimeout(() => resolve(null), timeoutMs); }),
    ]);
  } catch {
    return null;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function emptyAggregate(): UsageAggregate {
  return Object.fromEntries([...COUNTERS.map((counter) => [counter, 0]), ['cost', 0], ['estimated', false]]);
}

function addAggregate(target: UsageAggregate, usage: Record<string, any>, cost: number, estimated: boolean) {
  for (const counter of COUNTERS) target[counter] += Number(usage[counter]) || 0;
  target.cost += cost;
  target.estimated ||= estimated;
}

function canonicalDailyModels(canonical: CanonicalTurns): Record<string, Record<string, UsageAggregate>> {
  const days: Record<string, Record<string, UsageAggregate>> = Object.create(null);
  for (const envelope of Object.values(canonical)) {
    const record = validateTurnRecord(envelope?.record) as Record<string, any> | null;
    if (!record) continue;
    const model = normalizeModelId(record.model);
    for (const [date, usage] of Object.entries(record.daily as Record<string, Record<string, any>>)) {
      days[date] ||= Object.create(null);
      days[date][model.id] ||= emptyAggregate();
      const price = priceUsage(record.model, usage.pricing_tiers);
      addAggregate(days[date][model.id], usage, price.usd, price.estimated);
    }
  }
  return days;
}

function emptyGenerationState(): CodexLedgerGenerationState {
  return { devices: Object.create(null), dates: [] };
}

function generationPointerKey(userId: string) {
  return `user:${userId}:codex:active-generation`;
}

function generationPrefix(userId: string, generation: string) {
  return `user:${userId}:codex:generation:${generation}`;
}

function parseJsonObject(raw: string | null): Record<string, any> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function parseTurns(raw: Record<string, string>): CanonicalTurns {
  const turns: CanonicalTurns = Object.create(null);
  for (const [field, value] of Object.entries(raw || {})) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) turns[field] = parsed;
    } catch { /* a later authoritative upload repairs malformed legacy data */ }
  }
  return turns;
}

function generationTurnsBlobKey(prefix: string) {
  return `${prefix}${CODEX_LEDGER_TURNS_BLOB_SUFFIX}`;
}

function serializeTurnsBlob(turns: CanonicalTurns): string {
  const serialized = JSON.stringify({ schema: CODEX_LEDGER_TURNS_BLOB_SCHEMA, turns });
  if (Buffer.byteLength(serialized) > MAX_CODEX_LEDGER_TURNS_JSON_BYTES) {
    throw new Error('Codex ledger turns blob is too large');
  }
  return gzipSync(serialized, { level: 1 }).toString('base64');
}

function isStrictBase64(raw: string): boolean {
  if (!raw || raw.length % 4 !== 0) return false;
  const padding = raw.endsWith('==') ? 2 : raw.endsWith('=') ? 1 : 0;
  for (let index = 0; index < raw.length - padding; index += 1) {
    const code = raw.charCodeAt(index);
    if (!((code >= 65 && code <= 90) || (code >= 97 && code <= 122)
      || (code >= 48 && code <= 57) || code === 43 || code === 47)) return false;
  }
  return true;
}

function parseTurnsBlob(raw: string): CanonicalTurns {
  try {
    if (!raw || raw.length > MAX_CODEX_LEDGER_TURNS_BASE64_LENGTH
      || !isStrictBase64(raw)) throw new Error('invalid base64');
    const compressed = Buffer.from(raw, 'base64');
    if (compressed.toString('base64') !== raw) throw new Error('non-canonical base64');
    const decoded = gunzipSync(compressed, { maxOutputLength: MAX_CODEX_LEDGER_TURNS_JSON_BYTES });
    const parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(decoded));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)
      || Object.keys(parsed).length !== 2
      || parsed.schema !== CODEX_LEDGER_TURNS_BLOB_SCHEMA
      || !parsed.turns || typeof parsed.turns !== 'object' || Array.isArray(parsed.turns)) {
      throw new Error('invalid schema');
    }
    const turns: CanonicalTurns = Object.create(null);
    for (const [turnKey, envelope] of Object.entries(parsed.turns as Record<string, unknown>)) {
      if (!CANONICAL_TURN_KEY.test(turnKey)
        || !envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
        throw new Error('invalid turn envelope');
      }
      turns[turnKey] = envelope;
    }
    return turns;
  } catch {
    throw new Error('Invalid Codex ledger turns blob');
  }
}

function parseGenerationState(raw: string | null): CodexLedgerGenerationState {
  const parsed = parseJsonObject(raw);
  const state = emptyGenerationState();
  if (!parsed) return state;
  if (parsed.devices && typeof parsed.devices === 'object' && !Array.isArray(parsed.devices)) {
    for (const [deviceId, device] of Object.entries(parsed.devices as Record<string, any>)) {
      if (!deviceId || device?.version !== 5 || !device.manifest
        || typeof device.manifest.manifest_hash !== 'string'
        || !Array.isArray(device.manifest.turn_keys)) continue;
      state.devices[deviceId] = {
        version: 5,
        manifest: {
          manifest_hash: device.manifest.manifest_hash,
          turn_keys: device.manifest.turn_keys.filter((key: unknown) => typeof key === 'string'),
        },
      };
    }
  }
  if (Array.isArray(parsed.dates)) {
    state.dates = [...new Set(parsed.dates.filter((date: unknown) => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)))].sort();
  }
  return state;
}

async function readLegacyGenerationState(redis: RedisLike, userId: string): Promise<CodexLedgerGenerationState> {
  const state = emptyGenerationState();
  const prefix = `user:${userId}:device:`;
  const suffix = ':codex-ledger-version';
  const versionKeys = await scanKeys(redis, `${prefix}*${suffix}`);
  for (const key of versionKeys) {
    const deviceId = key.slice(prefix.length, -suffix.length);
    if (!deviceId || await redis.get(key) !== '5') continue;
    const manifest = parseJsonObject(await redis.get(`${prefix}${deviceId}:codex-manifest`));
    state.devices[deviceId] = {
      version: 5,
      manifest: {
        manifest_hash: typeof manifest?.manifest_hash === 'string' ? manifest.manifest_hash : '',
        turn_keys: Array.isArray(manifest?.turn_keys)
          ? manifest.turn_keys.filter((turnKey: unknown) => typeof turnKey === 'string')
          : [],
      },
    };
  }
  return state;
}

export async function readCodexLedgerView(redis: RedisLike, userId: string): Promise<CodexLedgerView> {
  // Resolve the pointer exactly once. Generation keys are immutable after
  // publication, so every value below necessarily belongs to the same view.
  const generation = await redis.get(generationPointerKey(userId));
  if (generation) {
    const prefix = generationPrefix(userId, generation);
    const [rawTurnsBlob, rawSummary, rawState] = await Promise.all([
      redis.get(generationTurnsBlobKey(prefix)),
      redis.get(`${prefix}:summary`),
      redis.get(`${prefix}:state`),
    ]);
    const turns = rawTurnsBlob === null
      ? parseTurns(await redis.hgetall(`${prefix}:turns`))
      : parseTurnsBlob(rawTurnsBlob);
    return {
      generation,
      prefix,
      turns,
      summary: parseJsonObject(rawSummary) as CodexLedgerSummary | null,
      state: parseGenerationState(rawState),
    };
  }

  const [rawTurns, rawSummary, state] = await Promise.all([
    redis.hgetall(`user:${userId}:codex:turns`),
    redis.get(`user:${userId}:codex:summary`),
    readLegacyGenerationState(redis, userId),
  ]);
  return {
    generation: null,
    prefix: null,
    turns: parseTurns(rawTurns),
    summary: parseJsonObject(rawSummary) as CodexLedgerSummary | null,
    state,
  };
}

export async function readCodexLedgerTimeseries(
  redis: RedisLike,
  userId: string,
  date: string,
  view?: CodexLedgerView,
): Promise<string[]> {
  const resolved = view ?? await readCodexLedgerView(redis, userId);
  const legacy = await redis.lrange(`user:${userId}:timeseries:${date}`, 0, -1) as string[];
  if (!resolved.generation || !resolved.prefix) return legacy;

  const migratedDevices = new Set(Object.keys(resolved.state.devices));
  const kept = legacy.filter((raw) => {
    const event = parseEvent(raw);
    if (!event) return true;
    if (event.source === 'codex-ledger-v5') return false;
    return !(migratedDevices.has(String(event.deviceId || ''))
      && (event.tool === 'codex' || event.tool === 'codex_proxy'));
  });
  const canonical = await redis.lrange(`${resolved.prefix}:timeseries:${date}`, 0, -1) as string[];
  return [...kept, ...canonical];
}

export async function replaceRedisList(
  redis: RedisLike,
  key: string,
  values: string[],
  commit?: (operations: RedisCommitOperations) => Promise<void>,
) {
  if (!values.length) {
    if (commit) await commit({ deletes: [key] });
    else await redis.del(key);
    return;
  }
  const tempKey = `${key}:tmp:${randomUUID()}`;
  try {
    await redis.del(tempKey);
    for (let start = 0; start < values.length; start += REDIS_CHUNK_SIZE) {
      const pipeline = redis.pipeline();
      pipeline.rpush(tempKey, ...values.slice(start, start + REDIS_CHUNK_SIZE));
      await executePipeline(pipeline);
    }
    if (commit) await commit({ renames: [[tempKey, key]] });
    else await redis.rename(tempKey, key);
  } catch (error) {
    try { await redis.del(tempKey); } catch { /* best effort */ }
    throw error;
  }
}

async function executePipeline(pipeline: any) {
  const replies = await pipeline.exec();
  if (!Array.isArray(replies)) throw new Error('Redis pipeline returned no replies');
  const failed = replies.find(([error]) => error);
  if (failed) throw failed[0];
}

function parseEvent(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildCodexLedgerTimeseries(canonical: CanonicalTurns): Map<string, string[]> {
  const byDate = new Map<string, string[]>();
  for (const [date, models] of Object.entries(canonicalDailyModels(canonical))) {
    const events: string[] = [];
    for (const [model, usage] of Object.entries(models)) {
      events.push(JSON.stringify({
        timestamp: new Date(`${date}T00:00:00.000Z`).getTime(),
        tool: 'codex',
        model,
        tokens: usage.norm,
        rawTokens: usage.total,
        normTokens: usage.norm,
        inTokens: usage.net_new_input,
        outTokens: usage.output,
        cacheReadTokens: usage.cache_read,
        cacheWriteTokens: usage.cache_write,
        cacheHit: usage.cache_read > 0,
        source: 'codex-ledger-v5',
        costUsd: usage.cost,
        pricingEstimated: usage.estimated,
        pricingSnapshotDate: PRICING_SNAPSHOT_DATE,
      }));
    }
    byDate.set(date, events);
  }
  return byDate;
}

async function scanKeys(redis: RedisLike, pattern: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor = '0';
  do {
    const [next, found] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 500);
    cursor = next;
    keys.push(...found);
  } while (cursor !== '0');
  return keys;
}

async function expireInactiveGenerations(redis: RedisLike, userId: string, activePrefix: string) {
  const keys = await scanKeys(redis, `user:${userId}:codex:generation:*`);
  const inactive = keys.filter((key) => !key.startsWith(`${activePrefix}:`));
  for (let start = 0; start < inactive.length; start += REDIS_CHUNK_SIZE) {
    const pipeline = redis.pipeline();
    for (const key of inactive.slice(start, start + REDIS_CHUNK_SIZE)) {
      pipeline.expire(key, GENERATION_READER_GRACE_SECONDS, 'NX');
    }
    await executePipeline(pipeline);
  }
}

export async function syncCodexLedger(
  redis: RedisLike,
  userId: string,
  deviceId: string,
  payload: CodexLedgerPayload,
  options: SyncCodexLedgerOptions = {},
): Promise<CodexLedgerSummary> {
  if (!payload || payload.version !== 5 || payload.full_sync !== true
    || !Array.isArray(payload.records) || payload.records.length > MAX_RECORDS
    || !/^[a-f0-9]{64}$/.test(payload.manifest_hash)) {
    throw new Error('Invalid Codex ledger payload');
  }
  const rawTurnKeys = payload.records.map((record) => record?.turn_key);
  if (rawTurnKeys.some((turnKey) => typeof turnKey !== 'string' || !/^[a-f0-9]{64}$/.test(turnKey))
    || new Set(rawTurnKeys).size !== rawTurnKeys.length) {
    throw new Error('Invalid Codex ledger payload');
  }
  const expectedManifestHash = createHash('sha256')
    .update([...rawTurnKeys].sort().join('\n'))
    .digest('hex');
  if (payload.manifest_hash !== expectedManifestHash) throw new Error('Invalid Codex ledger payload');

  const previousView = await readCodexLedgerView(redis, userId);
  const existing = previousView.turns;
  const incoming = payload.records.map(validateTurnRecord);
  if (incoming.some((record) => !record)) throw new Error('Invalid Codex ledger record');
  const validIncoming = incoming as Record<string, any>[];

  const canonical = reconcileDeviceTurns(existing, deviceId, validIncoming);
  const manifest = {
    manifest_hash: payload.manifest_hash,
    turn_keys: validIncoming.map((record) => record.turn_key).sort(),
  };

  const summary = aggregateCanonicalTurns(canonical);
  const timeseries = buildCodexLedgerTimeseries(canonical);
  const nextState = emptyGenerationState();
  for (const [previousDeviceId, previousDevice] of Object.entries(previousView.state.devices)) {
    nextState.devices[previousDeviceId] = structuredClone(previousDevice);
  }
  nextState.devices[deviceId] = { version: 5, manifest };
  nextState.dates = [...timeseries.keys()].sort();

  const generation = randomUUID();
  const prefix = generationPrefix(userId, generation);
  const turnsBlobKey = generationTurnsBlobKey(prefix);
  const summaryKey = `${prefix}:summary`;
  const stateKey = `${prefix}:state`;
  const stagedKeys = [turnsBlobKey, summaryKey, stateKey,
    ...[...timeseries.keys()].map((date) => `${prefix}:timeseries:${date}`)];
  let activationStarted = false;
  try {
    await redis.set(turnsBlobKey, serializeTurnsBlob(canonical), 'EX', GENERATION_STAGING_TTL_SECONDS);
    for (const [date, events] of timeseries) {
      const timeseriesKey = `${prefix}:timeseries:${date}`;
      for (let start = 0; start < events.length; start += REDIS_CHUNK_SIZE) {
        const pipeline = redis.pipeline();
        pipeline.rpush(timeseriesKey, ...events.slice(start, start + REDIS_CHUNK_SIZE));
        pipeline.expire(timeseriesKey, GENERATION_STAGING_TTL_SECONDS);
        await executePipeline(pipeline);
      }
    }
    await redis.set(summaryKey, JSON.stringify(summary), 'EX', GENERATION_STAGING_TTL_SECONDS);
    await redis.set(stateKey, JSON.stringify(nextState), 'EX', GENERATION_STAGING_TTL_SECONDS);

    const operations: RedisCommitOperations = {
      sets: [[generationPointerKey(userId), generation]],
      persists: stagedKeys,
    };
    // After activation starts, a lost Redis response is ambiguous: the pointer
    // may already reference this generation. Never delete immutable generation
    // data in that state; an unreferenced generation is harmless staging garbage.
    activationStarted = true;
    if (options.commit) {
      await options.commit(operations);
    } else {
      const transaction = redis.multi();
      transaction.set(generationPointerKey(userId), generation);
      for (const key of stagedKeys) transaction.persist(key);
      await executePipeline(transaction);
    }
  } catch (error) {
    if (!activationStarted) {
      try { await redis.del(...stagedKeys); } catch { /* orphaned staging is invisible and safe */ }
    }
    throw error;
  }
  try { await expireInactiveGenerations(redis, userId, prefix); } catch { /* best-effort generation GC */ }
  return summary;
}
