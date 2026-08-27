import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

function writeExecutable(file, source) {
  fs.writeFileSync(file, source, { mode: 0o755 });
}

function unixInstallerHarness(t, osName = 'Darwin') {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'tsalon-installer-test-'));
  const bin = path.join(home, 'bin');
  const runs = path.join(home, 'runs.log');
  const crontab = path.join(home, 'crontab');
  fs.mkdirSync(bin, { recursive: true });
  fs.mkdirSync(path.join(home, '.tsalon'), { recursive: true });
  fs.writeFileSync(path.join(home, '.tsalon', 'sql-wasm.cjs'), 'fixture');
  fs.writeFileSync(path.join(home, '.tsalon', 'sql-wasm.wasm'), 'fixture');
  writeExecutable(path.join(bin, 'uname'), `#!/bin/bash\necho ${osName}\n`);
  writeExecutable(path.join(bin, 'curl'), `#!/bin/bash
out=""
while [ "$#" -gt 0 ]; do
  if [ "$1" = "-o" ]; then out="$2"; shift 2; else shift; fi
done
if [ -n "$out" ]; then printf 'fixture' > "$out"; fi
`);
  writeExecutable(path.join(bin, 'node'), `#!/bin/bash
echo node >> "$TSALON_TEST_RUNS"
sleep 1
`);
  writeExecutable(path.join(bin, 'launchctl'), `#!/bin/bash
if [ "$1" = "bootstrap" ]; then echo launchd >> "$TSALON_TEST_RUNS"; fi
exit 0
`);
  writeExecutable(path.join(bin, 'crontab'), `#!/bin/bash
if [ "\${1:-}" = "-l" ]; then
  if [ -f "$TSALON_TEST_CRONTAB" ]; then cat "$TSALON_TEST_CRONTAB"; fi
  exit 0
fi
cat > "$TSALON_TEST_CRONTAB"
`);
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  return {
    home,
    runs,
    env: {
      ...process.env,
      HOME: home,
      PATH: `${bin}:/usr/bin:/bin`,
      TSALON_TEST_RUNS: runs,
      TSALON_TEST_CRONTAB: crontab,
    },
  };
}

function runUnixInstaller(args, env) {
  return spawnSync('/bin/bash', ['public/scripts/token-agent.sh', ...args], {
    cwd: process.cwd(),
    env,
    encoding: 'utf8',
  });
}

function readRuns(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean);
}

async function waitForRun(file) {
  const deadline = Date.now() + 2_000;
  while (Date.now() < deadline) {
    if (readRuns(file).length) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.fail('first agent process did not start');
}

test('macOS install leaves the immediate first upload exclusively to launchd RunAtLoad', (t) => {
  const harness = unixInstallerHarness(t);

  const result = runUnixInstaller([
    '--token=test-token', '--host=http://localhost', '--install',
  ], harness.env);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(readRuns(harness.runs), ['launchd']);

  const plist = fs.readFileSync(path.join(
    harness.home,
    'Library/LaunchAgents/tech.tsalon.token-agent.plist',
  ), 'utf8');
  assert.match(plist, /<key>RunAtLoad<\/key><true\/>/);
  assert.match(plist, /<key>StartCalendarInterval<\/key>\s*<dict>\s*<key>Hour<\/key><integer>9<\/integer>\s*<key>Minute<\/key><integer>17<\/integer>\s*<\/dict>/);
  assert.doesNotMatch(plist, /StartInterval|1800/);
});

test('Linux install schedules one startup upload and one daily upload at 09:17 local time', (t) => {
  const harness = unixInstallerHarness(t, 'Linux');

  const result = runUnixInstaller([
    '--token=test-token', '--host=http://localhost', '--install',
  ], harness.env);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(fs.readFileSync(harness.env.TSALON_TEST_CRONTAB, 'utf8').trim().split('\n').map((line) => line.split(' ')[0]), [
    '@reboot',
    '17',
  ]);
  const installed = fs.readFileSync(harness.env.TSALON_TEST_CRONTAB, 'utf8');
  assert.match(installed, /^@reboot .*--scheduled-run/m);
  assert.match(installed, /^17 9 \* \* \* .*--scheduled-run/m);
  assert.doesNotMatch(installed, /\*\/30|1800/);
});

test('a legacy Linux scheduled run migrates its own 30-minute cron entry once', (t) => {
  const harness = unixInstallerHarness(t, 'Linux');
  fs.writeFileSync(harness.env.TSALON_TEST_CRONTAB, '*/30 * * * * legacy tsalon.tech/scripts/token-agent.sh --scheduled-run\n');

  const result = runUnixInstaller([
    '--token=test-token', '--host=http://localhost', '--scheduled-run',
  ], harness.env);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const installed = fs.readFileSync(harness.env.TSALON_TEST_CRONTAB, 'utf8');
  assert.match(installed, /^@reboot .*--scheduled-run/m);
  assert.match(installed, /^17 9 \* \* \* .*--scheduled-run/m);
  assert.doesNotMatch(installed, /\*\/30/);
  assert.equal(fs.readFileSync(path.join(harness.home, '.tsalon', 'schedule-v2'), 'utf8').trim(), '2');
});

test('Unix runner lock allows only one agent process during overlapping scheduled runs', async (t) => {
  const harness = unixInstallerHarness(t, 'Linux');
  const args = ['public/scripts/token-agent.sh', '--token=test-token', '--host=http://localhost', '--scheduled-run'];
  const run = () => new Promise((resolve, reject) => {
    const child = spawn('/bin/bash', args, { cwd: process.cwd(), env: harness.env });
    child.once('error', reject);
    child.once('exit', (code) => resolve(code));
  });

  const first = run();
  await waitForRun(harness.runs);
  const second = run();

  assert.deepEqual(await Promise.all([first, second]), [0, 0]);
  assert.deepEqual(readRuns(harness.runs), ['node']);
});

test('Unix runner never reclaims a freshly-created lock before its owner PID is published', async (t) => {
  const harness = unixInstallerHarness(t, 'Linux');
  const ready = path.join(harness.home, 'lock-created');
  writeExecutable(path.join(harness.home, 'bin', 'mkdir'), `#!/bin/bash
/bin/mkdir "$@"
status=$?
if [ "$status" -eq 0 ] && printf '%s\\n' "$@" | grep -q 'agent-run.lock'; then
  : > "$TSALON_TEST_LOCK_READY"
  sleep 0.5
fi
exit "$status"
`);
  harness.env.TSALON_TEST_LOCK_READY = ready;
  const args = ['public/scripts/token-agent.sh', '--token=test-token', '--host=http://localhost', '--scheduled-run'];
  const run = () => new Promise((resolve, reject) => {
    const child = spawn('/bin/bash', args, { cwd: process.cwd(), env: harness.env });
    child.once('error', reject);
    child.once('exit', (code) => resolve(code));
  });

  const first = run();
  const deadline = Date.now() + 2_000;
  while (!fs.existsSync(ready) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.ok(fs.existsSync(ready), 'first process did not create the lock');
  const second = run();

  assert.deepEqual(await Promise.all([first, second]), [0, 0]);
  assert.deepEqual(readRuns(harness.runs), ['node']);
});

test('Windows bootstrap locks the whole download and agent run against manual overlap', () => {
  const source = fs.readFileSync('public/scripts/token-agent.ps1', 'utf8');
  const lockIndex = source.indexOf('New-Item -ItemType Directory -Path $runLockPath');
  const downloadIndex = source.indexOf('Invoke-WebRequest -Uri "$host_url/scripts/codex-ledger.mjs"');
  const agentIndex = source.indexOf('& $nodeExe --no-warnings $agentPath');
  const unlockIndex = source.lastIndexOf('Remove-Item -LiteralPath $runLockPath');

  assert.ok(lockIndex >= 0, 'Windows bootstrap must acquire an atomic directory lock');
  assert.ok(lockIndex < downloadIndex, 'lock must cover shared-file downloads');
  assert.ok(downloadIndex < agentIndex, 'lock must remain held through agent execution');
  assert.ok(agentIndex < unlockIndex, 'lock must be released only after the agent exits');
});

test('Windows bootstrap emits UTF-8 output and suppresses harmless Node warnings', () => {
  const source = fs.readFileSync('public/scripts/token-agent.ps1', 'utf8');
  assert.match(source, /\[Console\]::OutputEncoding\s*=\s*\[System\.Text\.UTF8Encoding\]::new\(\$false\)/);
  assert.match(source, /& \$nodeExe --no-warnings \$agentPath/);
});

test('Windows scheduled task launches wscript and never PowerShell directly', () => {
  const source = fs.readFileSync('public/scripts/token-agent.ps1', 'utf8');
  assert.match(source, /New-ScheduledTaskAction -Execute "wscript\.exe"/i);
  assert.match(source, /run-agent-hidden\.vbs/i);
  assert.doesNotMatch(source, /New-ScheduledTaskAction -Execute "PowerShell\.exe"/i);
  assert.match(source, /\.Run\([^,]+,\s*0,\s*True\)/i);
});

test('Windows scheduled task runs at login and once daily at 09:17 local time', () => {
  const source = fs.readFileSync('public/scripts/token-agent.ps1', 'utf8');
  assert.match(source, /New-ScheduledTaskTrigger -AtLogOn -User \$env:USERNAME/);
  assert.match(source, /New-ScheduledTaskTrigger -Daily -At "09:17"/);
  assert.doesNotMatch(source, /RepetitionInterval|AddMinutes\(30\)|every 30 minutes/i);
});

test('scheduled runs self-migrate old schedules exactly once before continuing the upload', () => {
  const unix = fs.readFileSync('public/scripts/token-agent.sh', 'utf8');
  const windows = fs.readFileSync('public/scripts/token-agent.ps1', 'utf8');
  assert.match(unix, /SCHEDULE_VERSION_FILE=.*schedule-v2/);
  assert.match(unix, /\[ "\$SCHEDULED_RUN" -eq 1 \].*SCHEDULE_VERSION_FILE/s);
  assert.match(unix, /install_macos_launch_agent|install_linux_cron/);
  assert.match(windows, /\$scheduleVersionPath\s*=\s*Join-Path \$tsalonDir "schedule-v2"/);
  assert.match(windows, /\$scheduledRun\s+-or\s+-not \(Test-ScheduleV2\)/);
  assert.match(windows, /Set-Content -LiteralPath \$scheduleVersionPath .*'2'/);
});

test('installers contain no 30-minute polling schedules or copy', () => {
  for (const file of ['public/scripts/token-agent.sh', 'public/scripts/token-agent.ps1']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /<key>StartInterval<\/key>|<integer>1800<\/integer>|\*\/30|RepetitionInterval|every 30 minutes/i, file);
  }
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

test('connect-page bootstrap commands pin token-agent schema version 8', () => {
  for (const file of ['src/pages/tokenrank/connect.astro', 'src/pages/en/tokenrank/connect.astro']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /https':'\/\/www\.tsalon\.tech\/scripts\/token-agent\.sh\\\?v=8/);
    assert.match(source, /token-agent\.sh\\\?v=8/);
    assert.match(source, /'https' \+ ':\/\/www\.tsalon\.tech\/scripts\/token-agent\.ps1\?v=8'/);
  }
});

test('connect pages describe login sync plus one daily 09:17 sync', () => {
  const chinese = fs.readFileSync('src/pages/tokenrank/connect.astro', 'utf8');
  assert.match(chinese, /登录即同步 \+ 每天 09:17/);
  assert.doesNotMatch(chinese, /每 30 分钟/);

  const english = fs.readFileSync('src/pages/en/tokenrank/connect.astro', 'utf8');
  assert.match(english, /at login \+ daily at 09:17/);
  assert.doesNotMatch(english, /every 30 min/);
});

test('scheduled self-updaters request versioned installers with cache revalidation', () => {
  const windows = fs.readFileSync('public/scripts/token-agent.ps1', 'utf8');
  assert.match(windows, /irm '\$safeHost\/scripts\/token-agent\.ps1\?v=8' -Headers @\{ 'Cache-Control' = 'no-cache' \}/i);

  const unix = fs.readFileSync('public/scripts/token-agent.sh', 'utf8');
  const macRunner = unix.split('\n').find((line) => line.includes('/usr/bin/curl -fsSL'));
  const linuxCron = unix.split('\n').find((line) => line.trimStart().startsWith('line='));
  assert.match(macRunner, /\/usr\/bin\/curl -fsSL -H 'Cache-Control: no-cache' '\$HOST\/scripts\/token-agent\.sh\?v=8'/);
  assert.match(linuxCron, /curl -fsSL -H 'Cache-Control: no-cache' '\$HOST\/scripts\/token-agent\.sh\?v=8'/);
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
