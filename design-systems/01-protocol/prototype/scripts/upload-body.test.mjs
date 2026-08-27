import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
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
    headers: { 'Content-Type': 'application/json', 'Content-Encoding': 'br' },
    body: '{}',
  });

  await assert.rejects(readUploadJson(request), (error) => error instanceof UploadBodyError
    && error.status === 415);
});
