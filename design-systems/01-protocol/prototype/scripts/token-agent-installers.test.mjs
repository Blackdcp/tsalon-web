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
