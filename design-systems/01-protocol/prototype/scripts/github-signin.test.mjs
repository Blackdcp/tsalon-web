import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

async function loadConnectPage(page, signIn) {
  const source = readFileSync(new URL(`../src/pages/${page}`, import.meta.url), 'utf8');
  const script = source.match(/<script>([\s\S]*?)<\/script>/)[1];
  const handlers = new Map();
  const lifecycle = new Map();
  const attributes = new Map();
  const button = {
    disabled: false,
    innerHTML: '<svg></svg> GitHub',
    textContent: 'GitHub',
    addEventListener: (event, handler) => handlers.set(event, handler),
    setAttribute: (key, value) => attributes.set(key, value),
    removeAttribute: key => attributes.delete(key),
  };
  const error = { hidden: true, textContent: '' };
  // Exercise each shipped page script, replacing only the external OAuth client.
  const code = ts.transpileModule(script.replace("await import('auth-astro/client')", 'authClient'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  await vm.runInNewContext(`(async () => { ${code} })()`, {
    authClient: { signIn, signOut() {} },
    document: {
      querySelector: selector => selector === '#login' ? button : selector === '#login-error' ? error : null,
      querySelectorAll: () => [],
    },
    window: { addEventListener: (event, handler) => lifecycle.set(event, handler) },
    console,
  });
  return { button, error, attributes, click: () => handlers.get('click')(), lifecycle };
}

for (const page of ['tokenrank/connect.astro', 'en/tokenrank/connect.astro']) {
  test(`${page}: repeated clicks start only one OAuth flow until navigation`, async () => {
    const pending = Promise.withResolvers();
    const calls = [];
    const ui = await loadConnectPage(page, provider => { calls.push(provider); return pending.promise; });
    const attempts = Array.from({ length: 5 }, () => ui.click());
    assert.deepEqual(calls, ['github']);
    assert.equal(ui.button.disabled, true);
    assert.equal(ui.attributes.get('aria-busy'), 'true');
    pending.resolve();
    await Promise.all(attempts);
    await ui.click();
    assert.deepEqual(calls, ['github'], 'resolving signIn must not unlock before browser navigation');
  });

  test(`${page}: a failed request restores the button and allows a fresh attempt`, async () => {
    let calls = 0;
    const ui = await loadConnectPage(page, async () => {
      if (++calls === 1) throw new Error('Network unavailable');
    });
    await ui.click();
    assert.equal(ui.button.disabled, false);
    assert.equal(ui.button.innerHTML, '<svg></svg> GitHub');
    assert.equal(ui.attributes.has('aria-busy'), false);
    assert.equal(ui.error.hidden, false);
    assert.ok(ui.error.textContent.length > 0);
    await ui.click();
    assert.equal(calls, 2);
    assert.equal(ui.error.hidden, true);
    assert.equal(ui.button.disabled, true);
  });

  test(`${page}: returning from GitHub through browser history allows retry`, async () => {
    let calls = 0;
    const ui = await loadConnectPage(page, async () => { calls += 1; });
    await ui.click();
    assert.equal(ui.button.disabled, true);
    ui.lifecycle.get('pageshow')?.({ persisted: true });
    assert.equal(ui.button.disabled, false);
    await ui.click();
    assert.equal(calls, 2);
  });
}
