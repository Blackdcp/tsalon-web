import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { createRequire } from 'node:module';

const root = process.cwd();
const require = createRequire(resolve(root, 'package.json'));
const { getTransformedRoutes } = require('@vercel/routing-utils');

test('the historical English T Chat 6 URL redirects to the available original in both deployment roots', () => {
  for (const file of ['vercel.json', '../../../vercel.json']) {
    const config = JSON.parse(readFileSync(resolve(root, file), 'utf8'));
    const { routes, error } = getTransformedRoutes({ redirects: config.redirects, trailingSlash: config.trailingSlash });
    assert.equal(error, null);
    const aliases = routes.filter(route => route.status === 308 && route.headers?.Location === '/articles/tchat-6/' && !route.has);
    for (const pathname of ['/en/articles/tchat-6', '/en/articles/tchat-6/']) {
      assert.ok(aliases.some(route => new RegExp(route.src).test(pathname)), `${file}: missing redirect for ${pathname}`);
    }
    for (const pathname of ['/articles/tchat-6/', '/en/articles/tchat-60/', '/en/articles/tchat-6/extra/']) {
      assert.ok(aliases.every(route => !new RegExp(route.src).test(pathname)), `${file}: alias captures ${pathname}`);
    }
  }
});
