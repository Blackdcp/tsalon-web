import { createHash } from 'node:crypto';

const MARKER = '@tsalon/chunked-v1:';
const SINGLE_BYTES = 4 * 1024 * 1024;
const CHUNK_CHARACTERS = 1024 * 1024;
const MAX_BYTES = 256 * 1024 * 1024;
const MAX_CHUNKS = 256;

// Only for new immutable generation keys. Stage every chunk before the manifest;
// callers publish the generation pointer and persist ALL staged keys atomically.
export async function stageChunkedString(redis: any, key: string, value: string, ttl: number, staged: string[]) {
  const bytes = Buffer.byteLength(value);
  if (bytes > MAX_BYTES) throw new Error('Redis chunked value exceeds size limit');
  if (bytes <= SINGLE_BYTES) {
    staged.push(key);
    await redis.set(key, value, 'EX', ttl);
    return;
  }
  let count = 0;
  for (let start = 0; start < value.length;) {
    let end = Math.min(start + CHUNK_CHARACTERS, value.length);
    // Never split a UTF-16 surrogate pair before Redis encodes the UTF-8 string.
    if (end < value.length && value.charCodeAt(end - 1) >= 0xd800 && value.charCodeAt(end - 1) <= 0xdbff) end--;
    const chunkKey = `${key}:chunk:${count++}`;
    if (count > MAX_CHUNKS) throw new Error('Redis chunk count exceeds limit');
    staged.push(chunkKey);
    await redis.set(chunkKey, value.slice(start, end), 'EX', ttl);
    start = end;
  }
  staged.push(key);
  await redis.set(key, MARKER + JSON.stringify({ count, bytes, sha256: createHash('sha256').update(value).digest('hex') }), 'EX', ttl);
}

export async function readChunkedString(redis: any, key: string): Promise<string | null> {
  const raw = await redis.get(key);
  if (raw === null || !raw.startsWith(MARKER)) return raw;
  let manifest;
  try { manifest = JSON.parse(raw.slice(MARKER.length)); } catch { throw new Error('Invalid Redis chunk manifest'); }
  if (!Number.isInteger(manifest.count) || manifest.count < 1 || manifest.count > MAX_CHUNKS
    || !Number.isInteger(manifest.bytes) || manifest.bytes < 1 || manifest.bytes > MAX_BYTES
    || !/^[a-f0-9]{64}$/.test(manifest.sha256)) throw new Error('Invalid Redis chunk manifest');
  const chunks: string[] = [];
  let bytes = 0;
  const hash = createHash('sha256');
  for (let index = 0; index < manifest.count; index++) {
    const chunk = await redis.get(`${key}:chunk:${index}`);
    if (typeof chunk !== 'string' || Buffer.byteLength(chunk) > SINGLE_BYTES) throw new Error('Missing or invalid Redis chunk');
    bytes += Buffer.byteLength(chunk);
    if (bytes > manifest.bytes) throw new Error('Redis chunk size mismatch');
    hash.update(chunk);
    chunks.push(chunk);
  }
  if (bytes !== manifest.bytes || hash.digest('hex') !== manifest.sha256) throw new Error('Redis chunk integrity mismatch');
  return chunks.join('');
}
