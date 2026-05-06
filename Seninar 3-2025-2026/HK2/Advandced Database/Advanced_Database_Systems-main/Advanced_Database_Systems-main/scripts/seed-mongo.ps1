Param(
	[string]$MongoUri = "mongodb://localhost:27017",
	[string]$Database = "hotel"
)

$ErrorActionPreference = "Stop"

$mongosh = Get-Command mongosh -ErrorAction SilentlyContinue
if (-not $mongosh) {
	Write-Host "mongosh is not installed or not on PATH." -ForegroundColor Red
	exit 1
}

$scriptPath = Join-Path $PSScriptRoot "mongo/setup-mongo.js"
if (-not (Test-Path $scriptPath)) {
	Write-Host "Mongo setup script not found: $scriptPath" -ForegroundColor Red
	exit 1
}

$env:MONGO_URI = $MongoUri
$env:MONGO_DB = $Database

Write-Host "Running Mongo setup..." -ForegroundColor Cyan
Write-Host "- URI: $MongoUri"
Write-Host "- DB:  $Database"

& mongosh --quiet $scriptPath
if ($LASTEXITCODE -ne 0) {
	Write-Host "Mongo setup failed." -ForegroundColor Red
	exit $LASTEXITCODE
}

Write-Host "Mongo setup completed successfully." -ForegroundColor Green
