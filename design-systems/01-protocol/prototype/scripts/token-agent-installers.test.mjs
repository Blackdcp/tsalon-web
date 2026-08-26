import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('Windows scheduled task launches wscript and never PowerShell directly', () => {
  const source = fs.readFileSync('public/scripts/token-agent.ps1', 'utf8');
  assert.match(source, /New-ScheduledTaskAction -Execute "wscript\.exe"/i);
  assert.match(source, /run-agent-hidden\.vbs/i);
  assert.doesNotMatch(source, /New-ScheduledTaskAction -Execute "PowerShell\.exe"/i);
  assert.match(source, /\.Run\([^,]+,\s*0,\s*True\)/i);
});

test('both installers download codex-ledger.mjs before agent execution', () => {
  for (const file of ['public/scripts/token-agent.ps1', 'public/scripts/token-agent.sh']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.ok(source.indexOf('codex-ledger.mjs') < source.lastIndexOf('agent.mjs'));
  }
});
