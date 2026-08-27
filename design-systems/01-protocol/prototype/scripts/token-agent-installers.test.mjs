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

function assertLedgerDownloadBeforeAgent(source, downloadPattern) {
  const ledgerIndex = source.indexOf('codex-ledger.mjs');
  const agentIndex = source.lastIndexOf('agent.mjs');
  assert.notEqual(ledgerIndex, -1, 'installer must mention codex-ledger.mjs');
  assert.notEqual(agentIndex, -1, 'installer must mention agent.mjs');
  assert.match(source, downloadPattern);
  assert.ok(ledgerIndex < agentIndex, 'installer must download the ledger before agent.mjs');
}

test('both installers download codex-ledger.mjs before agent execution', () => {
  const installers = [
    {
      file: 'public/scripts/token-agent.ps1',
      downloadPattern: /Invoke-WebRequest\s+-Uri\s+"\$host_url\/scripts\/codex-ledger\.mjs"\s+-OutFile\s+\$ledgerPath\b/i,
    },
    {
      file: 'public/scripts/token-agent.sh',
      downloadPattern: /"\$CURL_BIN"\s+-fsSL\s+"\$HOST\/scripts\/codex-ledger\.mjs"\s+-o\s+"\$TSALON_DIR\/codex-ledger\.mjs"/,
    },
  ];
  for (const { file, downloadPattern } of installers) {
    assertLedgerDownloadBeforeAgent(fs.readFileSync(file, 'utf8'), downloadPattern);
  }
});

test('connect-page bootstrap commands pin token-agent schema version 7', () => {
  for (const file of ['src/pages/tokenrank/connect.astro', 'src/pages/en/tokenrank/connect.astro']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /https':'\/\/www\.tsalon\.tech\/scripts\/token-agent\.sh\\\?v=7/);
    assert.match(source, /token-agent\.sh\\\?v=7/);
    assert.match(source, /'https' \+ ':\/\/www\.tsalon\.tech\/scripts\/token-agent\.ps1\?v=7'/);
  }
});

test('scheduled self-updaters request versioned installers with cache revalidation', () => {
  const windows = fs.readFileSync('public/scripts/token-agent.ps1', 'utf8');
  assert.match(windows, /irm '\$safeHost\/scripts\/token-agent\.ps1\?v=5' -Headers @\{ 'Cache-Control' = 'no-cache' \}/i);

  const unix = fs.readFileSync('public/scripts/token-agent.sh', 'utf8');
  const macRunner = unix.split('\n').find((line) => line.includes('/usr/bin/curl -fsSL'));
  const linuxCron = unix.split('\n').find((line) => line.trimStart().startsWith('line='));
  assert.match(macRunner, /\/usr\/bin\/curl -fsSL -H 'Cache-Control: no-cache' '\$HOST\/scripts\/token-agent\.sh\?v=5'/);
  assert.match(linuxCron, /curl -fsSL -H 'Cache-Control: no-cache' '\$HOST\/scripts\/token-agent\.sh\?v=5'/);
});

test('root Vercel configuration disables caching for scripts while preserving API protection', () => {
  const config = JSON.parse(fs.readFileSync('../../../vercel.json', 'utf8'));
  const scriptsRule = config.headers.find((rule) => rule.source === '/scripts/(.*)');
  const apiRule = config.headers.find((rule) => rule.source === '/api/(fix-db|db-maint)(.*)');
  assert.deepEqual(scriptsRule?.headers, [{
    key: 'Cache-Control',
    value: 'no-store, no-cache, must-revalidate, max-age=0',
  }]);
  assert.ok(apiRule, 'existing API cache-control rule must remain');
});
