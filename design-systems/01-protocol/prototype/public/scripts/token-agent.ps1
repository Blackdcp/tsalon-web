<#
  T Salon Token Agent — Windows bootstrap (Node.js).
  Invoked via (no .ps1 file is written to disk, so ExecutionPolicy never blocks it):
    powershell -NoProfile -Command "& ([ScriptBlock]::Create((irm 'https://www.tsalon.tech/scripts/token-agent.ps1'))) -token '<token>'"
#>
param(
    [string]$token,
    [string]$host_url = "https://www.tsalon.tech",
    [switch]$scheduledRun
)

# Windows PowerShell otherwise decodes Node's UTF-8 output through the active
# legacy code page, producing mojibake for the agent's Chinese/emoji status.
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [Console]::OutputEncoding

# token: prefer -token, then env (so the one-liner above works)
if (-not $token) { $token = $env:TSALON_TOKEN }
if (-not $token) {
    Write-Host "❌ Missing token. Pass -token <TOKEN> or set `$env:TSALON_TOKEN." -ForegroundColor Red
    exit 1
}

# ---------- node detection (PATH + common Windows locations) ----------
function Find-Node {
    if (Get-Command node -ErrorAction SilentlyContinue) { return (Get-Command node).Source }
    if (Get-Command nodejs -ErrorAction SilentlyContinue) { return (Get-Command nodejs).Source }
    $roots = @(
        $env:ProgramFiles,
        ${env:ProgramFiles(x86)},
        $env:LOCALAPPDATA,
        $env:APPDATA,
        "$env:LOCALAPPDATA\Programs",
        "$env:USERPROFILE\.nvm",
        "$env:USERPROFILE\scoop\shims",
        "$env:APPDATA\npm"
    )
    $found = $null
    foreach ($r in $roots) {
        if (-not $r) { continue }
        $direct = Join-Path $r "node.exe"
        if (Test-Path $direct) { return $direct }
        $pj = Join-Path $r "nodejs\node.exe"
        if (Test-Path $pj) { return $pj }
        if ($r -like "*.nvm") {
            Get-ChildItem "$r\v*" -ErrorAction SilentlyContinue | ForEach-Object {
                $n = Join-Path $_.FullName "node.exe"
                if (Test-Path $n) { $found = $n }
            }
        }
    }
    return $found
}

$nodeExe = Find-Node
if ($env:TSALON_NODE -and (Test-Path $env:TSALON_NODE)) { $nodeExe = $env:TSALON_NODE }

if (-not $nodeExe) {
    Write-Host "❌ Node.js not found in PATH or common locations." -ForegroundColor Red
    Write-Host "   Claude Code / Cursor / VS Code all bundle Node. Either:" -ForegroundColor Yellow
    Write-Host "   1) install Node from https://nodejs.org, or" -ForegroundColor Yellow
    Write-Host "   2) set `$env:TSALON_NODE to the full path of node.exe, then re-run." -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Node found: $nodeExe" -ForegroundColor Green

# ---------- prepare dir ----------
$tsalonDir = Join-Path $env:USERPROFILE ".tsalon"
if (-not (Test-Path $tsalonDir)) { New-Item -ItemType Directory -Path $tsalonDir -Force | Out-Null }
$ledgerPath  = Join-Path $tsalonDir "codex-ledger.mjs"
$agentPath   = Join-Path $tsalonDir "agent.mjs"
$sqlJsPath   = Join-Path $tsalonDir "sql-wasm.cjs"
$sqlWasmPath = Join-Path $tsalonDir "sql-wasm.wasm"
$logPath     = Join-Path $tsalonDir "agent.log"
$runLockPath = Join-Path $tsalonDir "agent-run.lock"
$runLockOwnerPath = Join-Path $runLockPath "pid"

function Acquire-RunLock {
    try {
        New-Item -ItemType Directory -Path $runLockPath -ErrorAction Stop | Out-Null
    } catch {
        $ownerPid = $null
        try { $ownerPid = [int](Get-Content -LiteralPath $runLockOwnerPath -TotalCount 1 -ErrorAction Stop) } catch {}
        if ($ownerPid -and (Get-Process -Id $ownerPid -ErrorAction SilentlyContinue)) { return $false }
        if (-not $ownerPid) {
            $lockAge = (Get-Date) - (Get-Item -LiteralPath $runLockPath -ErrorAction SilentlyContinue).LastWriteTime
            if (-not $lockAge -or $lockAge.TotalMinutes -lt 15) { return $false }
        }
        Remove-Item -LiteralPath $runLockPath -Recurse -Force -ErrorAction SilentlyContinue
        try {
            New-Item -ItemType Directory -Path $runLockPath -ErrorAction Stop | Out-Null
        } catch {
            return $false
        }
    }
    [System.IO.File]::WriteAllText($runLockOwnerPath, [string]$PID, [Text.Encoding]::ASCII)
    return $true
}

if (-not (Acquire-RunLock)) {
    Write-Host "⏭️ Token Agent is already running; skipping this overlapping run." -ForegroundColor Yellow
    exit 0
}

try {

# ---------- download agent + ledger + sqlite assets ----------
Write-Host "⬇️  Downloading Token Agent (Node.js)..." -ForegroundColor Cyan
try {
    # agent.mjs imports this sibling module, so download it first and never run
    # the agent if any required fetch fails.
    Invoke-WebRequest -Uri "$host_url/scripts/codex-ledger.mjs" -OutFile $ledgerPath -UseBasicParsing -ErrorAction Stop
    Invoke-WebRequest -Uri "$host_url/scripts/agent.mjs" -OutFile $agentPath -UseBasicParsing -ErrorAction Stop
    if (-not (Test-Path $sqlJsPath) -or (Get-Item $sqlJsPath).Length -eq 0) {
        Invoke-WebRequest -Uri "$host_url/scripts/sql-wasm.cjs" -OutFile $sqlJsPath -UseBasicParsing -ErrorAction Stop
    }
    if (-not (Test-Path $sqlWasmPath) -or (Get-Item $sqlWasmPath).Length -eq 0) {
        Invoke-WebRequest -Uri "$host_url/scripts/sql-wasm.wasm" -OutFile $sqlWasmPath -UseBasicParsing -ErrorAction Stop
    }
} catch {
    Write-Host "❌ Could not download required Token Agent files: $_" -ForegroundColor Red
    exit 1
}

# ---------- register scheduled task before the first historical scan ----------
# A large first scan may take a while. Install auto-start first so closing this
# window cannot leave the machine unregistered.
if (-not $scheduledRun) {
    $taskName = "TSalonTokenAgent"
    $safeToken = $token -replace "'", "''"
    $safeHost = $host_url -replace "'", "''"
    $bootstrapCmd = "& ([ScriptBlock]::Create((irm '$safeHost/scripts/token-agent.ps1?v=8' -Headers @{ 'Cache-Control' = 'no-cache' }))) -token '$safeToken' -host_url '$safeHost' -scheduledRun"
    $encodedCommand = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($bootstrapCmd))
    $runnerPath = Join-Path $tsalonDir 'run-agent-hidden.vbs'
    $vbsCommand = 'powershell.exe -NoProfile -NonInteractive -EncodedCommand ' + $encodedCommand
    $escapedVbsCommand = $vbsCommand.Replace('"', '""')
    $vbs = @"
Set shell = CreateObject("WScript.Shell")
exitCode = shell.Run("$escapedVbsCommand", 0, True)
WScript.Quit exitCode
"@
    [System.IO.File]::WriteAllText($runnerPath, $vbs, [Text.Encoding]::ASCII)
    $action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument ('"' + $runnerPath + '"')
    $triggerLogon = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
    $triggerDaily = New-ScheduledTaskTrigger -Daily -At "09:17"
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
    $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 15) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
    try {
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger @($triggerLogon, $triggerDaily) -Principal $principal -Settings $settings -Force -ErrorAction Stop | Out-Null
        Write-Host "✓ Scheduled task '$taskName' registered (at login + daily at 09:17)." -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not register scheduled task: $_" -ForegroundColor Yellow
        Write-Host "   The scan will continue; re-run this command to retry auto-start setup." -ForegroundColor Yellow
    }
}

# ---------- run once, now (output shown in this window AND appended to a shared log) ----------
# Open the log with FileShare.ReadWrite + Append so a concurrently-running scheduled task
# (which runs this same script) can't lock the file and crash this run with "file in use".
Write-Host "🚀 Running agent now..." -ForegroundColor Cyan
function Open-LogStream {
    $attempts = 0
    while ($true) {
        try {
            return [System.IO.File]::Open($logPath, [System.IO.FileMode]::Append, [System.IO.FileAccess]::Write, [System.IO.FileShare]::ReadWrite)
        } catch {
            $attempts++
            if ($attempts -ge 3) {
                # fallback to a timestamped log so this run can never fail on a lock
                $fallback = Join-Path $tsalonDir "agent-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
                return [System.IO.File]::Open($fallback, [System.IO.FileMode]::Append, [System.IO.FileAccess]::Write, [System.IO.FileShare]::ReadWrite)
            }
            Start-Sleep -Milliseconds 500
        }
    }
}
$logStream = Open-LogStream
$actualLogPath = $logStream.Name
$logWriter = New-Object System.IO.StreamWriter($logStream)
try {
    & $nodeExe --no-warnings $agentPath --token=$token --host=$host_url 2>&1 | ForEach-Object {
        $logWriter.WriteLine($_)
        $_   # also echo live to this window
    }
    $exitCode = $LASTEXITCODE
} finally {
    $logWriter.Close()
}
if ($exitCode -ne 0) {
    Write-Host "❌ Agent exited with error (code $exitCode). Last lines of ${actualLogPath}:" -ForegroundColor Red
    Get-Content $actualLogPath -Tail 25 | ForEach-Object { Write-Host "   $_" }
} else {
    Write-Host "✓ Agent ran successfully. Full log: $actualLogPath" -ForegroundColor Green
}

Write-Host "Done. Refresh the leaderboard in a moment to see your data." -ForegroundColor Cyan
} finally {
    Remove-Item -LiteralPath $runLockPath -Recurse -Force -ErrorAction SilentlyContinue
}
