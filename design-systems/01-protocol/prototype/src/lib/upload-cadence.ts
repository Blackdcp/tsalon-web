import { createHash } from 'node:crypto';

export const DEVICE_UPLOAD_IN_FLIGHT_SECONDS = 30 * 60;
export const DEVICE_UPLOAD_WINDOW_SECONDS = 23 * 60 * 60;

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
): Promise<boolean> {
  const claimed = await redis.set(
    deviceUploadWindowKey(userId, deviceId),
    Date.now().toString(),
    'EX',
    DEVICE_UPLOAD_IN_FLIGHT_SECONDS,
    'NX',
  );
  return claimed === 'OK';
}

export async function completeDeviceUploadWindow(
  redis: any,
  userId: string,
  deviceId: string,
): Promise<void> {
  await redis.expire(deviceUploadWindowKey(userId, deviceId), DEVICE_UPLOAD_WINDOW_SECONDS);
}
