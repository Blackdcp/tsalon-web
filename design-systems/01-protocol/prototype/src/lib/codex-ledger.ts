import { createHash } from 'node:crypto';

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
const REPLACE_HASH_SCRIPT = `-- tokenrank:replace-hash-v1
redis.call('DEL', KEYS[1])
for index = 1, #ARGV, 2 do
  redis.call('HSET', KEYS[1], ARGV[index], ARGV[index + 1])
end
return #ARGV / 2`;
const REPLACE_LIST_SCRIPT = `-- tokenrank:replace-list-v1
redis.call('DEL', KEYS[1])
for index = 1, #ARGV do
  redis.call('RPUSH', KEYS[1], ARGV[index])
end
return #ARGV`;
type RedisLike = any;
type CanonicalTurns = Record<string, any>;
type UsageAggregate = Record<string, any>;

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
  const entries = Object.entries(canonical)
    .flatMap(([field, envelope]) => [field, JSON.stringify(envelope)]);
  await redis.eval(REPLACE_HASH_SCRIPT, 1, key, ...entries);
}

export async function replaceRedisList(redis: RedisLike, key: string, values: string[]) {
  await redis.eval(REPLACE_LIST_SCRIPT, 1, key, ...values);
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
