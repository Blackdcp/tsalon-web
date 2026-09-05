import type { APIRoute } from 'astro';
import { createHash, timingSafeEqual } from 'node:crypto';
import Redis from 'ioredis';
import { kv } from '../../lib/kv';

export const prerender = false;
export const maxDuration = 60;

const AUTH_HASH = '5f6145026e4e88a8c9f6c455c4ee2e8bc1a097179417aee748c03282d24236cb';

function authorized(request: Request): boolean {
  const supplied = request.headers.get('x-migration-secret') || '';
  const digest = createHash('sha256').update(supplied).digest();
  return timingSafeEqual(digest, Buffer.from(AUTH_HASH, 'hex'));
}

async function scanAll(redis: any): Promise<string[]> {
  const keys: string[] = [];
  let cursor = '0';
  do {
    const [next, batch] = await redis.scan(cursor, 'COUNT', 500);
    cursor = next;
    keys.push(...batch);
  } while (cursor !== '0');
  return keys;
}

type RedisValue =
  | { type: 'string'; value: string }
  | { type: 'hash'; value: Record<string, string> }
  | { type: 'list' | 'set' | 'zset'; value: string[] };

async function readValue(redis: any, key: string): Promise<RedisValue> {
  const type = await redis.type(key);
  if (type === 'string') return { type, value: await redis.get(key) };
  if (type === 'hash') return { type, value: await redis.hgetall(key) };
  if (type === 'list') return { type, value: await redis.lrange(key, 0, -1) };
  if (type === 'set') return { type, value: (await redis.smembers(key)).sort() };
  if (type === 'zset') return { type, value: await redis.zrange(key, 0, -1, 'WITHSCORES') };
  throw new Error(`unsupported Redis type: ${type}`);
}

async function writeValue(redis: any, key: string, entry: RedisValue, ttl: number): Promise<void> {
  if (entry.type === 'string') await redis.set(key, entry.value);
  if (entry.type === 'hash' && Object.keys(entry.value).length) await redis.hset(key, entry.value);
  if (entry.type === 'list' && entry.value.length) await redis.rpush(key, ...entry.value);
  if (entry.type === 'set' && entry.value.length) await redis.sadd(key, ...entry.value);
  if (entry.type === 'zset' && entry.value.length) await redis.zadd(key, ...entry.value.flatMap((value, index) => index % 2 ? [] : [entry.value[index + 1], value]));
  if (ttl > 0) await redis.pexpire(key, ttl);
}

function digest(entry: RedisValue): string {
  const normalized = entry.type === 'hash'
    ? Object.entries(entry.value).sort(([left], [right]) => left.localeCompare(right))
    : entry.value;
  return createHash('sha256').update(JSON.stringify([entry.type, normalized])).digest('hex');
}

export const POST: APIRoute = async ({ request }) => {
  if (!authorized(request)) return new Response('Not found', { status: 404 });
  if (!kv) return new Response(JSON.stringify({ success: false, error: 'source unavailable' }), { status: 503 });

  let target: Redis | null = null;
  try {
    const { target_url: targetUrl } = await request.json();
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'rediss:' || !parsed.hostname.endsWith('.upstash.io')) {
      return new Response(JSON.stringify({ success: false, error: 'invalid target' }), { status: 400 });
    }

    target = new Redis(targetUrl, { maxRetriesPerRequest: 2 });
    await target.flushdb();
    const keys = await scanAll(kv);
    const expected = new Map<string, string>();

    for (const key of keys) {
      const ttl = await kv.pttl(key);
      const entry = await readValue(kv, key);
      expected.set(key, digest(entry));
      await writeValue(target, key, entry, ttl);
    }

    const targetKeys = await scanAll(target);
    let verified = 0;
    let mismatch = 0;
    for (const key of targetKeys) {
        const actual = digest(await readValue(target, key));
        if (expected.get(key) === actual) verified++;
        else mismatch++;
    }
    const missing = [...expected.keys()].filter((key) => !targetKeys.includes(key)).length;
    const summary = { sourceKeys: keys.length, migrated: expected.size, targetKeys: targetKeys.length, verified, missing, mismatch };
    if (missing || mismatch || verified !== expected.size) throw new Error(`verification failed: ${JSON.stringify(summary)}`);
    return new Response(JSON.stringify({ success: true, ...summary }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'migration failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } finally {
    target?.disconnect();
  }
};

export const GET: APIRoute = async () => new Response('Not found', { status: 404 });
