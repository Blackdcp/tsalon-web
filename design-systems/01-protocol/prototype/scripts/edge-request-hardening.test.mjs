import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('known scanner-only paths get a CDN cache policy before Astro render fallback', () => {
  const config = JSON.parse(fs.readFileSync('../../../vercel.json', 'utf8'));
  const rule = config.headers.find((entry) => entry.source === '/(contact|home)(/.*)?');

  assert.deepEqual(rule?.headers, [{
    key: 'Cache-Control',
    value: 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
  }]);
});
