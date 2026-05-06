param(
    [string]$OutputPath = (Join-Path $PSScriptRoot "..\eb-docker-bundle.zip")
)

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$staging = Join-Path $env:TEMP ("ads-eb-" + [guid]::NewGuid().ToString("N"))

New-Item -ItemType Directory -Path $staging | Out-Null

Copy-Item -Path (Join-Path $repoRoot "Dockerfile") -Destination $staging
Copy-Item -Path (Join-Path $repoRoot ".dockerignore") -Destination $staging

New-Item -ItemType Directory -Path (Join-Path $staging "backend") | Out-Null
Copy-Item -Path (Join-Path $repoRoot "backend\pom.xml") -Destination (Join-Path $staging "backend")
Copy-Item -Recurse -Path (Join-Path $repoRoot "backend\src") -Destination (Join-Path $staging "backend")

if (Test-Path $OutputPath) {
    Remove-Item $OutputPath -Force
}

Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $OutputPath -Force
Remove-Item $staging -Recurse -Force

Write-Host "Created EB bundle: $OutputPath"