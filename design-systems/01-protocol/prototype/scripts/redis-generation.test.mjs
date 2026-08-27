import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import Redis from 'ioredis';

import { readCodexLedgerView, syncCodexLedger } from '../src/lib/codex-ledger.ts';
import { ledgerPayload, turnRecord } from './helpers/codex-fixtures.mjs';

const REDIS_SERVER_CANDIDATES = [
  process.env.REDIS_SERVER_BIN,
  '/tmp/redis-7.2.5/src/redis-server',
  '/opt/homebrew/bin/redis-server',
  '/usr/local/bin/redis-server',
].filter(Boolean);
const REDIS_SERVER_BIN = REDIS_SERVER_CANDIDATES.find((candidate) => fs.existsSync(candidate));

async function startRedis(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tsalon-real-redis-'));
  const socket = path.join(dir, 'redis.sock');
  const child = spawn(REDIS_SERVER_BIN, [
    '--port', '0',
    '--unixsocket', socket,
    '--unixsocketperm', '700',
    '--save', '',
    '--appendonly', 'no',
    '--dir', dir,
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Redis startup timed out:\n${output}`)), 5_000);
    const onData = () => {
      if (!output.includes('Ready to accept connections')) return;
      clearTimeout(timeout);
      child.stdout.off('data', onData);
      resolve();
    };
    child.stdout.on('data', onData);
    child.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once('exit', (code) => {
      if (output.includes('Ready to accept connections')) return;
      clearTimeout(timeout);
      reject(new Error(`Redis exited during startup (${code}):\n${output}`));
    });
  });

  const redis = new Redis({ path: socket, lazyConnect: true, maxRetriesPerRequest: 1 });
  await redis.connect();
  t.after(async () => {
    try { await redis.quit(); } catch { redis.disconnect(); }
    if (child.exitCode === null) child.kill('SIGTERM');
    await new Promise((resolve) => child.exitCode === null ? child.once('exit', resolve) : resolve());
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return redis;
}

async function visibleLedgerState(redis, userId, date, deviceId) {
  const generation = await redis.get(`user:${userId}:codex:active-generation`);
  if (generation) {
    const prefix = `user:${userId}:codex:generation:${generation}`;
    return {
      generation,
      turnsBlob: await redis.get(`${prefix}:turns:gzip-base64-v1`),
      legacyTurns: await redis.hgetall(`${prefix}:turns`),
      summary: await redis.get(`${prefix}:summary`),
      state: await redis.get(`${prefix}:state`),
      timeseries: await redis.lrange(`${prefix}:timeseries:${date}`, 0, -1),
    };
  }
  return {
    generation: null,
    turns: await redis.hgetall(`user:${userId}:codex:turns`),
    summary: await redis.get(`user:${userId}:codex:summary`),
    manifest: await redis.get(`user:${userId}:device:${deviceId}:codex-manifest`),
    version: await redis.get(`user:${userId}:device:${deviceId}:codex-ledger-version`),
    timeseries: await redis.lrange(`user:${userId}:timeseries:${date}`, 0, -1),
  };
}

test('real Redis runtime errors do not roll back prior MULTI or Lua writes, while ledger readers retain the active generation', {
  skip: REDIS_SERVER_BIN ? false : 'redis-server is unavailable; set REDIS_SERVER_BIN for this integration test',
}, async (t) => {
  const redis = await startRedis(t);

  await redis.set('multi:source', 'old');
  await redis.set('multi:wrongtype', 'string');
  const multiReplies = await redis.multi()
    .rename('multi:source', 'multi:live')
    .lpush('multi:wrongtype', 'boom')
    .set('multi:after', 'written')
    .exec();
  assert.equal(multiReplies[0][0], null);
  assert.match(String(multiReplies[1][0]), /WRONGTYPE/);
  assert.equal(await redis.get('multi:live'), 'old');
  assert.equal(await redis.get('multi:after'), 'written');

  await redis.set('lua:source', 'old');
  await redis.set('lua:wrongtype', 'string');
  await assert.rejects(redis.eval(`
    redis.call('rename', KEYS[1], KEYS[2])
    redis.call('lpush', KEYS[3], 'boom')
    redis.call('set', KEYS[4], 'never')
    return 1
  `, 4, 'lua:source', 'lua:live', 'lua:wrongtype', 'lua:after'), /WRONGTYPE/);
  assert.equal(await redis.get('lua:live'), 'old');
  assert.equal(await redis.get('lua:after'), null);

  await redis.flushdb();
  const legacyGeneration = 'real-redis-legacy-hash';
  const legacyPrefix = `user:u1:codex:generation:${legacyGeneration}`;
  const legacyRecord = turnRecord('real-redis-legacy-hash-turn', 7);
  await redis.set('user:u1:codex:active-generation', legacyGeneration);
  await redis.hset(`${legacyPrefix}:turns`, legacyRecord.turn_key, JSON.stringify({
    record: legacyRecord,
    device_versions: { mac: legacyRecord },
    source_devices: ['mac'],
  }));
  await redis.set(`${legacyPrefix}:summary`, JSON.stringify({ lifetime: { total: 7 }, daily: {}, models: {} }));
  await redis.set(`${legacyPrefix}:state`, JSON.stringify({ devices: {}, dates: [] }));
  const legacyView = await readCodexLedgerView(redis, 'u1');

  await assert.rejects(
    syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([legacyRecord]), {
      commit: async () => { throw new Error('Injected publication stop after compaction'); },
    }),
    /Injected publication stop after compaction/,
  );
  assert.equal(await redis.get('user:u1:codex:active-generation'), legacyGeneration);
  assert.deepEqual(await redis.hgetall(`${legacyPrefix}:turns`), {});
  assert.equal(typeof await redis.get(`${legacyPrefix}:turns:gzip-base64-v1`), 'string');
  assert.equal(await redis.ttl(`${legacyPrefix}:turns:gzip-base64-v1`), -1);
  assert.deepEqual(await readCodexLedgerView(redis, 'u1'), legacyView);

  await redis.flushdb();
  await syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([turnRecord('old', 7)]));
  const before = await visibleLedgerState(redis, 'u1', '2026-08-18', 'mac');
  await redis.set('sync:wrongtype', 'string');

  const runtimeFailingCommit = async (operations) => {
    if (!operations.renames?.length) throw new Error('Injected staging failure before pointer activation');
    await redis.eval(`
      local operations = cjson.decode(ARGV[1])
      redis.call('rename', operations.renames[1][1], operations.renames[1][2])
      redis.call('lpush', KEYS[1], 'boom')
      return 1
    `, 1, 'sync:wrongtype', JSON.stringify(operations));
  };

  await assert.rejects(
    syncCodexLedger(redis, 'u1', 'mac', ledgerPayload([turnRecord('replacement', 110)]), {
      commit: runtimeFailingCommit,
    }),
    /WRONGTYPE|Injected staging failure/,
  );
  assert.deepEqual(await visibleLedgerState(redis, 'u1', '2026-08-18', 'mac'), before);
});
