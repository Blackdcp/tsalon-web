import assert from 'node:assert/strict';
import test from 'node:test';
import { stageChunkedString, readChunkedString } from '../src/lib/redis-chunks.ts';
import { FakeRedis } from './helpers/fake-redis.mjs';

test('large immutable strings roundtrip below the provider command limit', async () => {
  const redis = new FakeRedis();
  const limit = 4 * 1024 * 1024 + 1024;
  const originalSet = redis.set.bind(redis), originalGet = redis.get.bind(redis);
  redis.set = async (key, value, ...args) => {
    assert.ok(Buffer.byteLength(value) < limit);
    return originalSet(key, value, ...args);
  };
  redis.get = async key => {
    const value = await originalGet(key);
    assert.ok(Buffer.byteLength(value ?? '') < limit);
    return value;
  };
  const value = ('x'.repeat(1048575) + '😀中文').repeat(12);
  const staged = [];
  await stageChunkedString(redis, 'immutable-generation', value, 86400, staged);
  assert.ok(staged.length > 2);
  for (const key of staged) assert.ok(await redis.ttl(key) > 0);
  assert.equal(await readChunkedString(redis, 'immutable-generation'), value);
  const originalChunk = await redis.get(staged[0]);
  await redis.set(staged[0], 'y' + originalChunk.slice(1));
  await assert.rejects(readChunkedString(redis, 'immutable-generation'), /integrity/);
  await redis.set(staged[0], originalChunk);
  await redis.del(staged[0]);
  await assert.rejects(readChunkedString(redis, 'immutable-generation'), /chunk/);
});

test('small and legacy values retain their original storage and missing chunks fail closed', async () => {
  const redis = new FakeRedis(), staged = [];
  await stageChunkedString(redis, 'small', '{"old":true}', 86400, staged);
  assert.deepEqual(staged, ['small']);
  assert.equal(await redis.get('small'), '{"old":true}');
  assert.equal(await readChunkedString(redis, 'small'), '{"old":true}');
  assert.equal(await readChunkedString(redis, 'missing'), null);
});
