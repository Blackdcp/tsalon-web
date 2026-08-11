param (
    [Parameter(Mandatory=$false)]
    [string]$token,

    [Parameter(Mandatory=$false)]
    [string]$host_url = "https://www.tsalon.tech"
)

if (-not $token) {
    Write-Host "Error: Missing -token argument" -ForegroundColor Red
    exit 1
}

# Detect node
$nodeCmd = $null
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeCmd = "node"
} elseif (Get-Command nodejs -ErrorAction SilentlyContinue) {
    $nodeCmd = "nodejs"
}

if (-not $nodeCmd) {
    Write-Host "❌ Node.js is not installed or not in PATH. Install Node.js (https://nodejs.org) and retry." -ForegroundColor Red
    exit 1
}

$tsalonDir = Join-Path $env:USERPROFILE ".tsalon"
if (-not (Test-Path $tsalonDir)) {
    New-Item -ItemType Directory -Path $tsalonDir -Force | Out-Null
}

$agentPath  = Join-Path $tsalonDir "agent.mjs"
$sqlJsPath  = Join-Path $tsalonDir "sql-wasm.cjs"
$sqlWasmPath = Join-Path $tsalonDir "sql-wasm.wasm"
$logPath    = Join-Path $tsalonDir "agent.log"

Write-Host "⬇️ Downloading Token Agent (Node.js)..." -ForegroundColor Cyan
Invoke-WebRequest -Uri "$host_url/scripts/agent.mjs" -OutFile $agentPath -UseBasicParsing
if (-not (Test-Path $sqlJsPath) -or (Get-Item $sqlJsPath).Length -eq 0) {
    Invoke-WebRequest -Uri "$host_url/scripts/sql-wasm.cjs" -OutFile $sqlJsPath -UseBasicParsing
}
if (-not (Test-Path $sqlWasmPath) -or (Get-Item $sqlWasmPath).Length -eq 0) {
    Invoke-WebRequest -Uri "$host_url/scripts/sql-wasm.wasm" -OutFile $sqlWasmPath -UseBasicParsing
}

# Run and capture all output to a log so failures are never silent.
& $nodeCmd $agentPath --token=$token --host=$host_url *> $logPath
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Agent exited with error. See $logPath" -ForegroundColor Red
    exit $LASTEXITCODE
}
