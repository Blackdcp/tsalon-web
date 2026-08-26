import { createHash, randomUUID } from 'node:crypto';

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

const COUNTERS = ['input_total', 'net_new_input', 'output', 'cache_read', 'cache_write', 'total', 'norm'];
const MAX_RECORDS = 50_000;
const REDIS_CHUNK_SIZE = 500;
const ACCOUNT_AUDIT_TTL_SECONDS = 120 * 24 * 60 * 60;
const ACCOUNT_AUDIT_WRITE_TIMEOUT_MS = 250;
const MAX_ACCOUNT_AUDIT_BYTES = 192 * 1024;
const MAX_ACCOUNT_AUDIT_USER_ID_LENGTH = 128;
type RedisLike = any;
type CanonicalTurns = Record<string, any>;
type UsageAggregate = Record<string, any>;

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
    const price = priceUsage(record.model, record.pricing_tiers);
    for (const [date, usage] of Object.entries(record.daily as Record<string, Record<string, any>>)) {
      days[date] ||= Object.create(null);
      days[date][model.id] ||= emptyAggregate();
      const cost = record.total ? price.usd * (usage.total / record.total) : 0;
      addAggregate(days[date][model.id], usage, cost, price.estimated);
    }
  }
  return days;
}

async function replaceHash(redis: RedisLike, key: string, canonical: CanonicalTurns) {
  const entries = Object.entries(canonical);
  if (!entries.length) {
    await redis.del(key);
    return;
  }
  const tempKey = `${key}:tmp:${randomUUID()}`;
  try {
    await redis.del(tempKey);
    for (let start = 0; start < entries.length; start += REDIS_CHUNK_SIZE) {
      const pipeline = redis.pipeline();
      for (const [field, envelope] of entries.slice(start, start + REDIS_CHUNK_SIZE)) {
        pipeline.hset(tempKey, field, JSON.stringify(envelope));
      }
      await executePipeline(pipeline);
    }
    await redis.rename(tempKey, key);
  } catch (error) {
    try { await redis.del(tempKey); } catch { /* best effort */ }
    throw error;
  }
}

export async function replaceRedisList(redis: RedisLike, key: string, values: string[]) {
  if (!values.length) {
    await redis.del(key);
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
    await redis.rename(tempKey, key);
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

async function rebuildCodexLedgerTimeseries(
  redis: RedisLike,
  userId: string,
  canonical: CanonicalTurns,
  removeLegacyDeviceId: string | null,
) {
  const keyPrefix = `user:${userId}:timeseries:`;
  const existingKeys = await scanKeys(redis, `${keyPrefix}*`);
  const byKey = new Map<string, string[]>();

  for (const key of existingKeys) {
    const rawEvents = await redis.lrange(key, 0, -1) as string[];
    const kept = rawEvents.filter((raw: string) => {
      const event = parseEvent(raw);
      if (!event) return true;
      if (event.source === 'codex-ledger-v5') return false;
      return !(removeLegacyDeviceId
        && event.deviceId === removeLegacyDeviceId
        && (event.tool === 'codex' || event.tool === 'codex_proxy'));
    });
    byKey.set(key, kept);
  }

  for (const [date, models] of Object.entries(canonicalDailyModels(canonical))) {
    const key = `${keyPrefix}${date}`;
    const events = byKey.get(key) ?? [];
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
    byKey.set(key, events);
  }

  for (const [key, events] of byKey) {
    await replaceRedisList(redis, key, events);
  }
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

export async function syncCodexLedger(
  redis: RedisLike,
  userId: string,
  deviceId: string,
  payload: CodexLedgerPayload,
): Promise<CodexLedgerSummary> {
  if (!payload || payload.version !== 5 || payload.full_sync !== true
    || !Array.isArray(payload.records) || payload.records.length > MAX_RECORDS
    || !/^[a-f0-9]{64}$/i.test(payload.manifest_hash)) {
    throw new Error('Invalid Codex ledger payload');
  }
  const expectedManifestHash = createHash('sha256')
    .update(payload.records.map((record) => record?.turn_key).sort().join('\n'))
    .digest('hex');
  if (payload.manifest_hash !== expectedManifestHash) throw new Error('Invalid Codex ledger payload');

  const key = `user:${userId}:codex:turns`;
  const raw = await redis.hgetall(key);
  const existing = Object.fromEntries(Object.entries(raw).map(([field, value]) => [field, JSON.parse(value as string)]));
  const incoming = payload.records.map(validateTurnRecord);
  if (incoming.some((record) => !record)) throw new Error('Invalid Codex ledger record');

  const canonical = reconcileDeviceTurns(existing, deviceId, incoming);
  const versionKey = `user:${userId}:device:${deviceId}:codex-ledger-version`;
  const firstV5Sync = await redis.get(versionKey) !== '5';

  await replaceHash(redis, key, canonical);
  await redis.set(`user:${userId}:device:${deviceId}:codex-manifest`, JSON.stringify({
    manifest_hash: payload.manifest_hash,
    turn_keys: incoming.map((record) => record.turn_key).sort(),
  }));

  const summary = aggregateCanonicalTurns(canonical);
  await rebuildCodexLedgerTimeseries(redis, userId, canonical, firstV5Sync ? deviceId : null);
  await redis.set(`user:${userId}:codex:summary`, JSON.stringify(summary));
  await redis.set(versionKey, '5');
  return summary;
}
