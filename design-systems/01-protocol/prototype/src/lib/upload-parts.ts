import { createHash } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { validateTurnRecord } from './tokenrank-domain.mjs';

const TTL = 1800;
const MAX_PARTS = 64;
const MAX_PART_BYTES = 16 * 1024 * 1024;
const MAX_BATCH_BYTES = 192 * 1024 * 1024;
function invalid(): never { throw new Error('Invalid Codex ledger upload batch; restart the upload'); }
function validId(id: unknown): id is string { return typeof id === 'string' && /^[a-f0-9]{32}$/.test(id); }
export function uploadPartsKey(user: string, device: string) {
  return `upload-parts:${user}:${createHash('sha256').update(device).digest('hex')}`;
}
export function uploadReceiptKey(user: string, device: string, id: string) {
  if (!validId(id)) invalid();
  return `${uploadPartsKey(user, device)}:receipt:${id}`;
}
const STAGE = `
local id = redis.call('HGET', KEYS[1], 'id')
if redis.call('HEXISTS', KEYS[1], 'owner') == 1 then return -1 end
if id and id ~= ARGV[1] then
  if ARGV[2] ~= '0' then return -1 end
  redis.call('DEL', KEYS[1]); id = false
end
if not id then
  if ARGV[2] ~= '0' then return -1 end
  redis.call('HSET', KEYS[1], 'id', ARGV[1], 'count', ARGV[3], 'bytes', 0, 'records', 0)
end
if redis.call('HGET', KEYS[1], 'count') ~= ARGV[3] then return -1 end
if redis.call('HEXISTS', KEYS[1], 'receipt') == 1 then return 1 end
local field = 'part:' .. ARGV[2]
local old = redis.call('HGET', KEYS[1], field)
if old and old ~= ARGV[4] then return -1 end
if not old then
  local bytes = tonumber(redis.call('HGET', KEYS[1], 'bytes')) + tonumber(ARGV[5])
  local records = tonumber(redis.call('HGET', KEYS[1], 'records')) + tonumber(ARGV[8])
  if bytes > tonumber(ARGV[7]) or records > 200000 then return -1 end
  redis.call('HSET', KEYS[1], field, ARGV[4], 'bytes', bytes, 'records', records)
end
redis.call('EXPIRE', KEYS[1], ARGV[6]); return 1
`;
const READ = `
if redis.call('HGET', KEYS[1], 'id') ~= ARGV[1] then return {} end
local owner = redis.call('HGET', KEYS[1], 'owner')
if owner and owner ~= ARGV[2] then return {} end
local count = tonumber(redis.call('HGET', KEYS[1], 'count')) or 0
if count < 1 or count > 64 then return {} end
for index = 0, count - 1 do
  if redis.call('HEXISTS', KEYS[1], 'part:' .. index) ~= 1 then return 0 end
end
redis.call('HSET', KEYS[1], 'owner', ARGV[2])
redis.call('EXPIRE', KEYS[1], ARGV[3])
return count
`;
export async function stageUploadPart(redis: any, user: string, device: string, part: any) {
  if (!part || !validId(part.id) || !Number.isInteger(part.count) || part.count < 1 || part.count > MAX_PARTS
    || !Number.isInteger(part.index) || part.index < 0 || part.index >= part.count
    || !Array.isArray(part.records) || part.records.length < 1 || part.records.length > 10000) invalid();
  const records = part.records.map(validateTurnRecord);
  if (records.some((record: any) => !record)) invalid();
  const json = JSON.stringify(records);
  const bytes = Buffer.byteLength(json);
  if (bytes > MAX_PART_BYTES) invalid();
  const compressed = gzipSync(json, { level: 1 });
  if (compressed.length > 2 * 1024 * 1024) invalid();
  const stored = await redis.eval(STAGE, 1, uploadPartsKey(user, device), part.id, part.index, part.count,
    compressed.toString('base64'), bytes, TTL, MAX_BATCH_BYTES, records.length);
  if (stored !== 1) invalid();
}
export async function readUploadParts(redis: any, user: string, device: string, id: string, owner = 'test-reader') {
  if (!validId(id)) invalid();
  const key = uploadPartsKey(user, device);
  const count = await redis.eval(READ, 1, key, id, owner, TTL);
  if (!Number.isInteger(count) || count < 1 || count > MAX_PARTS) invalid();
  const records: any[] = [];
  for (let index = 0; index < count; index++) {
    // Freeze the complete batch first, then read one bounded response at a time.
    // Checking ownership on each read also fails closed after expiry/replacement.
    const part = await redis.eval(`if redis.call('HGET', KEYS[1], 'id') ~= ARGV[1]
      or redis.call('HGET', KEYS[1], 'owner') ~= ARGV[2] then return false end
      return redis.call('HGET', KEYS[1], ARGV[3])`, 1, key, id, owner, `part:${index}`);
    if (typeof part !== 'string') invalid();
    const decoded = JSON.parse(gunzipSync(Buffer.from(part, 'base64'), { maxOutputLength: MAX_PART_BYTES }).toString('utf8'));
    if (!Array.isArray(decoded) || decoded.length > 10000) invalid();
    for (const record of decoded) records.push(record);
  }
  return records;
}
export async function readUploadReceipt(redis: any, user: string, device: string, id: string) {
  const receipt = await redis.get(uploadReceiptKey(user, device, id));
  return receipt ? JSON.parse(receipt) : null;
}
export async function releaseUploadParts(redis: any, user: string, device: string, id: string, owner: string) {
  await redis.eval(`if redis.call('HGET', KEYS[1], 'id') == ARGV[1]
    and redis.call('HGET', KEYS[1], 'owner') == ARGV[2] then return redis.call('HDEL', KEYS[1], 'owner') end
    return 0`, 1, uploadPartsKey(user, device), id, owner);
}
