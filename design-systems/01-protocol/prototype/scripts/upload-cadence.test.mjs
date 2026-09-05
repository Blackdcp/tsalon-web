import assert from 'node:assert/strict';
import test from 'node:test';

import {
  claimDeviceUploadWindow,
  completeDeviceUploadWindow,
  deviceUploadWindowKey,
  DEVICE_UPLOAD_IN_FLIGHT_SECONDS,
  DEVICE_UPLOAD_WINDOW_SECONDS,
  normalizeUploadDeviceId,
} from '../src/lib/upload-cadence.ts';
import { FakeRedis } from './helpers/fake-redis.mjs';

test('a device can claim only one expensive upload window', async () => {
  const redis = new FakeRedis();

  assert.equal(await claimDeviceUploadWindow(redis, 'user-1', 'device-1'), true);
  assert.equal(await claimDeviceUploadWindow(redis, 'user-1', 'device-1'), false);
  const key = deviceUploadWindowKey('user-1', 'device-1');
  assert.ok(await redis.ttl(key) <= DEVICE_UPLOAD_IN_FLIGHT_SECONDS);
  await completeDeviceUploadWindow(redis, 'user-1', 'device-1');
  assert.ok(await redis.ttl(key) > DEVICE_UPLOAD_IN_FLIGHT_SECONDS);
  assert.ok(await redis.ttl(key) <= DEVICE_UPLOAD_WINDOW_SECONDS);
});

test('device-controlled identifiers never appear in Redis keys', () => {
  const hostileDeviceId = `device:${'x'.repeat(100_000)}`;
  const key = deviceUploadWindowKey('user-1', hostileDeviceId);

  assert.equal(key.length, 'upload-window:user-1:'.length + 64);
  assert.equal(key.includes(hostileDeviceId), false);
});

test('device identifiers are bounded before any upload storage operation', () => {
  assert.equal(normalizeUploadDeviceId('dev_abc-123'), 'dev_abc-123');
  const normalized = normalizeUploadDeviceId(`device:${'x'.repeat(100_000)}`);
  assert.match(normalized, /^device_[a-f0-9]{32}$/);
  assert.equal(normalized.length, 39);
});

test('upload windows are isolated by user and device', async () => {
  const redis = new FakeRedis();

  assert.equal(await claimDeviceUploadWindow(redis, 'user-1', 'device-1'), true);
  assert.equal(await claimDeviceUploadWindow(redis, 'user-1', 'device-2'), true);
  assert.equal(await claimDeviceUploadWindow(redis, 'user-2', 'device-1'), true);
});
