Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "[BACKEND] Running unit/integration tests..." -ForegroundColor Cyan
Push-Location "$PSScriptRoot/../backend"
try {
	./mvnw.cmd test
	if ($LASTEXITCODE -ne 0) {
		throw "Backend tests failed with exit code $LASTEXITCODE"
	}
	Write-Host "[BACKEND] PASS" -ForegroundColor Green
}
finally {
	Pop-Location
}
