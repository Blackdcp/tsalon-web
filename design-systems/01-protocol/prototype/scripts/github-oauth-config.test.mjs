import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('GitHub OAuth accepts GitHub’s authorization-response issuer', () => {
  const source = fs.readFileSync('auth.config.mjs', 'utf8');
  assert.match(source, /GitHub\(\{[\s\S]*issuer:\s*['"]https:\/\/github\.com\/login\/oauth['"]/);
});
