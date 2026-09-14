import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const homepage = fs.readFileSync(new URL('../dist/client/index.html', import.meta.url), 'utf8');

test('rendered homepage does not require Astro client routing or view transitions', () => {
  assert.doesNotMatch(homepage, /astro-view-transitions|ClientRouter\.astro/);
  assert.match(homepage, /<main[\s>]/);
});

test('locale preference script tolerates unavailable WebView storage', () => {
  const scripts = [...homepage.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  const localeScript = scripts.find((script) => script.includes('tsalon-locale'));
  assert.ok(localeScript, 'expected rendered locale preference script');

  const context = {
    document: { querySelectorAll: () => [] },
    localStorage: {
      getItem: () => { throw new Error('storage unavailable'); },
      setItem: () => { throw new Error('storage unavailable'); },
    },
    location: { replace: () => { throw new Error('unexpected redirect'); } },
    navigator: { language: 'zh-CN', languages: ['zh-CN'] },
  };
  assert.doesNotThrow(() => vm.runInNewContext(localeScript, context));
});
