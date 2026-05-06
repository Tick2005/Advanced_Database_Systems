Param(
    [string]$MongoUri = "mongodb://localhost:27017",
    [string]$Database = "hotel",
    [int]$Iterations = 5000,
    [string]$OutputPath = "docs/architecture/hotel-catalog-stress-result.json"
)

$ErrorActionPreference = "Stop"

$mongosh = Get-Command mongosh -ErrorAction SilentlyContinue
if (-not $mongosh) {
    Write-Host "mongosh is not installed or not on PATH." -ForegroundColor Red
    exit 1
}

$scriptPath = Join-Path $PSScriptRoot "mongo/stress-hotel-catalog.js"
if (-not (Test-Path $scriptPath)) {
    Write-Host "Stress script not found: $scriptPath" -ForegroundColor Red
    exit 1
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$resolvedOutput = Join-Path $repoRoot $OutputPath

$env:MONGO_URI = $MongoUri
$env:MONGO_DB = $Database
$env:STRESS_ITERATIONS = "$Iterations"
$env:STRESS_OUTPUT_PATH = $resolvedOutput

Write-Host "Running hotel catalog stress test..." -ForegroundColor Cyan
Write-Host "- URI: $MongoUri"
Write-Host "- DB:  $Database"
Write-Host "- Iterations: $Iterations"
Write-Host "- Output: $resolvedOutput"

& mongosh --quiet $scriptPath
if ($LASTEXITCODE -ne 0) {
    Write-Host "Stress test failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Stress test completed successfully." -ForegroundColor Green
