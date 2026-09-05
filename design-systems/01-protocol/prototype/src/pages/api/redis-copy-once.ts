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
    if (await target.dbsize() !== 0) throw new Error('target database is not empty');
    const keys = await scanAll(kv);
    const expected = new Map<string, string>();

    for (let offset = 0; offset < keys.length; offset += 100) {
      const batch = keys.slice(offset, offset + 100);
      const reads = kv.pipeline();
      for (const key of batch) {
        reads.pttl(key);
        reads.dump(key);
      }
      const values = await reads.exec();
      const writes = target.pipeline();
      for (let index = 0; index < batch.length; index++) {
        const ttl = values?.[index * 2]?.[1] as number;
        const dump = values?.[index * 2 + 1]?.[1] as Buffer | null;
        if (!dump) continue;
        expected.set(batch[index], createHash('sha256').update(dump).digest('hex'));
        writes.restore(batch[index], ttl > 0 ? ttl : 0, dump, 'REPLACE');
      }
      const results = await writes.exec();
      const failed = results?.find(([error]) => error);
      if (failed) throw failed[0];
    }

    const targetKeys = await scanAll(target);
    let verified = 0;
    let mismatch = 0;
    for (let offset = 0; offset < targetKeys.length; offset += 100) {
      const batch = targetKeys.slice(offset, offset + 100);
      const reads = target.pipeline();
      for (const key of batch) reads.dump(key);
      const values = await reads.exec();
      for (let index = 0; index < batch.length; index++) {
        const dump = values?.[index]?.[1] as Buffer | null;
        const digest = dump ? createHash('sha256').update(dump).digest('hex') : '';
        if (expected.get(batch[index]) === digest) verified++;
        else mismatch++;
      }
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
