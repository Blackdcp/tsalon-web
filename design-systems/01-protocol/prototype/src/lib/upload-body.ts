import { gunzipSync } from 'node:zlib';

const MAX_COMPRESSED_UPLOAD_BYTES = 1024 * 1024;
const MAX_UPLOAD_JSON_BYTES = 8 * 1024 * 1024;

export class UploadBodyError extends Error {
  readonly status: 400 | 413 | 415;

  constructor(status: 400 | 413 | 415, message: string) {
    super(message);
    this.status = status;
  }
}

async function readLimitedBytes(stream: ReadableStream<Uint8Array> | null, limit: number): Promise<Uint8Array> {
  if (!stream) throw new UploadBodyError(400, 'Missing upload payload');
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new UploadBodyError(413, 'Upload payload is too large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function readUploadJson(request: Request): Promise<Record<string, any>> {
  const encoding = (request.headers.get('content-encoding') || 'identity').trim().toLowerCase();
  if (encoding !== 'identity' && encoding !== 'gzip') {
    throw new UploadBodyError(415, 'Unsupported Content-Encoding');
  }
  const bytes = await readLimitedBytes(request.body, encoding === 'gzip' ? MAX_COMPRESSED_UPLOAD_BYTES : MAX_UPLOAD_JSON_BYTES);
  let decoded = bytes;
  if (encoding === 'gzip') {
    try {
      decoded = gunzipSync(bytes, { maxOutputLength: MAX_UPLOAD_JSON_BYTES });
    } catch (error: any) {
      throw new UploadBodyError(error?.code === 'ERR_BUFFER_TOO_LARGE' ? 413 : 400,
        error?.code === 'ERR_BUFFER_TOO_LARGE' ? 'Upload payload is too large' : 'Invalid gzip payload');
    }
  }
  try {
    const body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(decoded));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('not an object');
    return body;
  } catch {
    throw new UploadBodyError(400, 'Invalid JSON payload');
  }
}
