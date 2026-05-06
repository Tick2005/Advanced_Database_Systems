Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "[FRONTEND] Building UI..." -ForegroundColor Cyan
Push-Location "$PSScriptRoot/../frontend"
try {
	npm run build
	Write-Host "[FRONTEND] PASS" -ForegroundColor Green
}
finally {
	Pop-Location
}
