import assert from 'node:assert/strict';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import test from 'node:test';

import { UploadBodyError, readUploadJson } from '../src/lib/upload-body.ts';

test('upload body accepts gzip-compressed JSON without changing its contents', async () => {
  const source = { token: 'token', codex_ledger: { records: [{ turn_key: 'turn' }] } };
  const request = new Request('https://example.test/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' },
    body: gzipSync(JSON.stringify(source)),
  });

  assert.deepEqual(await readUploadJson(request), source);
});

test('upload body preserves plain JSON compatibility', async () => {
  const source = { token: 'token', data: { codex: { total: 1 } } };
  const request = new Request('https://example.test/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(source),
  });

  assert.deepEqual(await readUploadJson(request), source);
});

test('upload body reports malformed gzip as a client error', async () => {
  const request = new Request('https://example.test/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' },
    body: new Uint8Array([1, 2, 3]),
  });

  await assert.rejects(readUploadJson(request), (error) => error instanceof UploadBodyError
    && error.status === 400 && error.message === 'Invalid gzip payload');
});

test('upload body rejects unsupported content encodings explicitly', async () => {
  const request = new Request('https://example.test/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Encoding': 'zstd' },
    body: '{}',
  });

  await assert.rejects(readUploadJson(request), (error) => error instanceof UploadBodyError
    && error.status === 415);
});

test('Brotli preserves a historical payload larger than the old 8 MiB JSON limit', async () => {
  const source = { token: 'test-only', data: { padding: 'x'.repeat(9 * 1024 * 1024) } };
  const request = new Request('https://example.test/upload', {
    method: 'POST', headers: { 'Content-Encoding': 'br' }, body: brotliCompressSync(JSON.stringify(source)),
  });
  assert.deepEqual(await readUploadJson(request), source);
});

test('malformed Brotli and decompression bombs fail before JSON parsing', async () => {
  for (const [body, status] of [[Buffer.from('not brotli'), 400],
    [brotliCompressSync(Buffer.alloc(64 * 1024 * 1024 + 1)), 413]]) {
    const request = new Request('https://example.test/upload', {
      method: 'POST', headers: { 'Content-Encoding': 'br' }, body,
    });
    await assert.rejects(readUploadJson(request), e => e instanceof UploadBodyError && e.status === status);
  }
});

test('compressed requests above the 4 MiB wire budget are rejected while streaming', async () => {
  const request = new Request('https://example.test/upload', {
    method: 'POST', headers: { 'Content-Encoding': 'gzip' }, body: Buffer.alloc(4 * 1024 * 1024 + 1),
  });
  await assert.rejects(readUploadJson(request), e => e instanceof UploadBodyError && e.status === 413);
});
