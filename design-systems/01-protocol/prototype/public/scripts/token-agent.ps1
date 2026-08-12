<#
  T Salon Token Agent — Windows bootstrap (Node.js).
  Invoked via (no .ps1 file is written to disk, so ExecutionPolicy never blocks it):
    powershell -NoProfile -Command "& ([ScriptBlock]::Create((irm 'https://www.tsalon.tech/scripts/token-agent.ps1'))) -token '<token>'"
#>
param(
    [string]$token,
    [string]$host_url = "https://www.tsalon.tech"
)

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
$agentPath   = Join-Path $tsalonDir "agent.mjs"
$sqlJsPath   = Join-Path $tsalonDir "sql-wasm.cjs"
$sqlWasmPath = Join-Path $tsalonDir "sql-wasm.wasm"
$logPath     = Join-Path $tsalonDir "agent.log"

# ---------- download agent + sqlite assets ----------
Write-Host "⬇️  Downloading Token Agent (Node.js)..." -ForegroundColor Cyan
Invoke-WebRequest -Uri "$host_url/scripts/agent.mjs" -OutFile $agentPath -UseBasicParsing
if (-not (Test-Path $sqlJsPath) -or (Get-Item $sqlJsPath).Length -eq 0) {
    Invoke-WebRequest -Uri "$host_url/scripts/sql-wasm.cjs" -OutFile $sqlJsPath -UseBasicParsing
}
if (-not (Test-Path $sqlWasmPath) -or (Get-Item $sqlWasmPath).Length -eq 0) {
    Invoke-WebRequest -Uri "$host_url/scripts/sql-wasm.wasm" -OutFile $sqlWasmPath -UseBasicParsing
}

# ---------- run once, now (output shown in this window, NOT silent) ----------
Write-Host "🚀 Running agent now..." -ForegroundColor Cyan
& $nodeExe $agentPath --token=$token --host=$host_url *> $logPath
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Agent exited with error (code $LASTEXITCODE). Last lines of ${logPath}:" -ForegroundColor Red
    Get-Content $logPath -Tail 25 | ForEach-Object { Write-Host "   $_" }
} else {
    Write-Host "✓ Agent ran successfully. Full log: $logPath" -ForegroundColor Green
}

# ---------- register scheduled task (every 30 min + at logon, self-updating) ----------
$taskName = "TSalonTokenAgent"
# Re-run the bootstrap on every tick so the agent ALWAYS runs the LATEST code
# (matches token-agent.sh on Mac/Linux, which re-curls agent.mjs each run). This
# keeps Windows users on the current agent without ever re-running the installer.
$bootstrapCmd = "`$env:TSALON_TOKEN='$($token -replace "'", "''")'; iex (irm '$host_url/scripts/token-agent.ps1')"
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -WindowStyle Hidden -Command $bootstrapCmd"
$triggerTimer = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 30)
$triggerLogon = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType S4U -RunLevel Limited
try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger @($triggerTimer, $triggerLogon) -Principal $principal -Force -ErrorAction Stop | Out-Null
    Write-Host "✓ Scheduled task '$taskName' registered (every 30 min + at logon, self-updating)." -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not register scheduled task: $_" -ForegroundColor Yellow
    Write-Host "   The one-time run above still succeeded; re-run this command later if you want auto-sync." -ForegroundColor Yellow
}

Write-Host "Done. Refresh the leaderboard in a moment to see your data." -ForegroundColor Cyan
