import { createHash, randomUUID } from 'node:crypto';
import { beijingDateString, SITE_TZ_OFFSET_HOURS } from './date.ts';

export const DEVICE_UPLOAD_IN_FLIGHT_SECONDS = 30 * 60;
export const DEVICE_UPLOAD_DAILY_LIMIT = 2;
const LEGACY_SUCCESS_WINDOW_SECONDS = 23 * 60 * 60;

export interface DeviceUploadLease { owner: string }
export interface DeviceUploadSkip {
  reason: 'upload_in_flight' | 'daily_upload_limit';
  retryAfterSeconds: number;
}

function dailyWindow(now: number) {
  const day = beijingDateString(new Date(now));
  const start = Date.parse(`${day}T00:00:00Z`) - SITE_TZ_OFFSET_HOURS * 3_600_000;
  return { day, start, ttl: Math.max(1, Math.ceil((start + 86_400_000 - now) / 1000)) };
}

// Keep the legacy key read-only until its old 23-hour TTL expires. A remaining
// successful upload today counts as one; a recent in-flight attempt keeps its
// cooldown. Initialization, quota check and lease acquisition must be atomic.
const CLAIM_UPLOAD = `
  if redis.call('EXISTS', KEYS[2]) == 1 then
    return {0, 1, math.max(1, redis.call('TTL', KEYS[2]))}
  end
  local count = redis.call('GET', KEYS[3])
  if not count then
    local legacy = tonumber(redis.call('GET', KEYS[1]))
    local initial = 0
    if legacy then
      local ttl = redis.call('PTTL', KEYS[1])
      if tonumber(ARGV[2]) - legacy < tonumber(ARGV[5]) * 1000
        and ttl <= tonumber(ARGV[5]) * 1000 then
        return {0, 1, math.max(1, math.ceil(ttl / 1000))}
      end
      -- Legacy values contain the start time, but success reset the TTL to 23h.
      -- Recover completion time so uploads spanning midnight count today.
      local completedAt = tonumber(ARGV[2]) + ttl - tonumber(ARGV[7]) * 1000
      if completedAt >= tonumber(ARGV[3]) then initial = 1 end
    end
    count = tostring(initial)
    redis.call('SET', KEYS[3], count, 'EX', ARGV[4])
  end
  if tonumber(count) >= tonumber(ARGV[6]) then return {0, 2, tonumber(ARGV[4])} end
  redis.call('SET', KEYS[2], ARGV[1], 'EX', ARGV[5])
  return {1, 0, 0}
`;

// Only the lease owner may charge a success and release the device. Explicit
// failures release immediately; the TTL recovers workers that crash or time out.
const COMPLETE_UPLOAD = `
  if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
  if KEYS[3] then
    if redis.call('HGET', KEYS[3], 'id') ~= ARGV[3]
      or redis.call('HGET', KEYS[3], 'owner') ~= ARGV[1] then return -1 end
    redis.call('HSET', KEYS[3], 'receipt', ARGV[4])
    redis.call('SET', KEYS[4], ARGV[4], 'EX', 86400)
    redis.call('HDEL', KEYS[3], 'owner')
    for index = 0, 63 do redis.call('HDEL', KEYS[3], 'part:' .. index) end
    redis.call('EXPIRE', KEYS[3], 86400)
  end
  local count = tonumber(redis.call('GET', KEYS[2])) or 0
  redis.call('SET', KEYS[2], tostring(count + 1), 'EX', ARGV[2])
  redis.call('DEL', KEYS[1])
  return 1
`;

const RELEASE_UPLOAD = `
  if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
  return redis.call('DEL', KEYS[1])
`;

function uploadKeys(userId: string, deviceId: string, day: string) {
  const suffix = `${userId}:${createHash('sha256').update(deviceId).digest('hex')}`;
  return { lock: `upload-in-flight:${suffix}`, daily: `upload-daily:${suffix}:${day}` };
}

export function normalizeUploadDeviceId(value: unknown): string {
  const candidate = typeof value === 'string' ? value.trim() : '';
  if (/^[A-Za-z0-9._-]{1,128}$/.test(candidate)) return candidate;
  if (!candidate) return 'default_device';
  return `device_${createHash('sha256').update(candidate).digest('hex').slice(0, 32)}`;
}

export function deviceUploadWindowKey(userId: string, deviceId: string): string {
  const digest = createHash('sha256').update(deviceId).digest('hex');
  return `upload-window:${userId}:${digest}`;
}

export async function claimDeviceUploadWindow(
  redis: any,
  userId: string,
  deviceId: string,
  now = Date.now(),
): Promise<DeviceUploadLease | DeviceUploadSkip> {
  const window = dailyWindow(now);
  const keys = uploadKeys(userId, deviceId, window.day);
  const lease = { owner: randomUUID() };
  const claimed = await redis.eval(
    CLAIM_UPLOAD, 3,
    deviceUploadWindowKey(userId, deviceId),
    keys.lock, keys.daily,
    lease.owner, now, window.start, window.ttl,
    DEVICE_UPLOAD_IN_FLIGHT_SECONDS, DEVICE_UPLOAD_DAILY_LIMIT, LEGACY_SUCCESS_WINDOW_SECONDS,
  );
  return claimed[0] === 1 ? lease : {
    reason: claimed[1] === 1 ? 'upload_in_flight' : 'daily_upload_limit',
    retryAfterSeconds: Number(claimed[2]),
  };
}

export async function releaseDeviceUploadWindow(
  redis: any,
  userId: string,
  deviceId: string,
  lease: DeviceUploadLease,
): Promise<void> {
  const keys = uploadKeys(userId, deviceId, '');
  await redis.eval(RELEASE_UPLOAD, 1, keys.lock, lease.owner);
}

export async function completeDeviceUploadWindow(
  redis: any,
  userId: string,
  deviceId: string,
  lease: DeviceUploadLease,
  now = Date.now(),
  receipt?: { key: string; receiptKey: string; batchId: string; value: string },
): Promise<void> {
  // Count on the Beijing date of completion, including requests crossing midnight.
  const window = dailyWindow(now);
  const keys = uploadKeys(userId, deviceId, window.day);
  if (receipt) {
    const completed = await redis.eval(COMPLETE_UPLOAD, 4, keys.lock, keys.daily, receipt.key, receipt.receiptKey,
      lease.owner, window.ttl, receipt.batchId, receipt.value);
    if (completed !== 1) throw new Error('Upload completion lease was lost');
  } else {
    await redis.eval(COMPLETE_UPLOAD, 2, keys.lock, keys.daily, lease.owner, window.ttl);
  }
}
