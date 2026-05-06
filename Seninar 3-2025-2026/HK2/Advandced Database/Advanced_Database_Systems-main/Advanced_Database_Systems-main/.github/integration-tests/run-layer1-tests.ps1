Param(
    [string]$BackendDir = "backend"
)

$ErrorActionPreference = "Stop"

Write-Host "[Layer1] Starting Layer 1 integration tests..."

$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCmd) {
    Write-Host "❌ Layer 1 integration tests FAILED"
    Write-Host "Docker CLI is not installed or not on PATH."
    exit 1
}

try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Layer 1 integration tests FAILED"
    Write-Host "Docker daemon is not running. Please start Docker Desktop."
    exit 1
}

$root = Resolve-Path (Join-Path $PSScriptRoot "../..");
$backendPath = Join-Path $root $BackendDir

if (-not (Test-Path $backendPath)) {
    Write-Host "❌ Layer 1 integration tests FAILED"
    Write-Host "Backend directory not found: $backendPath"
    exit 1
}

Push-Location $backendPath
try {
    ./mvnw.cmd "-Dtest=BookingPaymentRoomFlowL1Test,AuthAndSecurityFlowL1Test" test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Layer 1 integration tests FAILED"
        exit $LASTEXITCODE
    }

    Write-Host "✅ Layer 1 integration tests PASSED"
    exit 0
} finally {
    Pop-Location
}
