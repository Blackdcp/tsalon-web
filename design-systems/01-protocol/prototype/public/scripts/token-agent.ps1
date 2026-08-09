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

$agentScriptUrl = "$host_url/scripts/agent.py"
$tempAgentPath = Join-Path $env:TEMP "tsalon-agent.py"

Write-Host "⬇️ Downloading Token Agent script for Windows..." -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri $agentScriptUrl -OutFile $tempAgentPath -UseBasicParsing
} catch {
    Write-Host "❌ Failed to download agent script." -ForegroundColor Red
    exit 1
}

$pythonCmd = "python"
if (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonCmd = "py"
} elseif (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    if (-not (Get-Command python3 -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Python is not installed or not in PATH. Please install Python first." -ForegroundColor Red
        exit 1
    } else {
        $pythonCmd = "python3"
    }
}

& $pythonCmd $tempAgentPath --token=$token --host=$host_url
