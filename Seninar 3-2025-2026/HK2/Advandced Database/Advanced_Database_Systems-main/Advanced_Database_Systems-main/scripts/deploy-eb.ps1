param(
    [Parameter(Mandatory=$true)]
    [string]$AwsAccountId,
    
    [Parameter(Mandatory=$true)]
    [string]$AwsRegion = "ap-southeast-1",
    
    [Parameter(Mandatory=$false)]
    [string]$EbEnvName = "luxstayhotel-origin-env",
    
    [Parameter(Mandatory=$false)]
    [switch]$BuildImage,
    
    [Parameter(Mandatory=$false)]
    [switch]$PushImage,
    
    [Parameter(Mandatory=$false)]
    [switch]$Deploy,
    
    [Parameter(Mandatory=$false)]
    [switch]$ShowLogs
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path $PSScriptRoot).Path

function Write-Header {
    param([string]$Message)
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# Build Docker Image
if ($BuildImage) {
    Write-Header "Building Docker Image"
    
    try {
        Push-Location $repoRoot
        docker build -t hotel-backend:latest -f Dockerfile .
        Write-Success "Docker image built successfully"
    }
    catch {
        Write-Error-Custom "Failed to build Docker image: $_"
        exit 1
    }
    finally {
        Pop-Location
    }
}

# Push to ECR
if ($PushImage) {
    Write-Header "Pushing to ECR"
    
    try {
        $ecrUri = "$AwsAccountId.dkr.ecr.$AwsRegion.amazonaws.com"
        $ecrRepo = "$ecrUri/hotel-backend"
        
        # Login to ECR
        Write-Host "Logging in to ECR..."
        $loginCmd = aws ecr get-login-password --region $AwsRegion | docker login --username AWS --password-stdin $ecrUri
        if ($LASTEXITCODE -ne 0) {
            throw "ECR login failed"
        }
        Write-Success "Logged in to ECR"
        
        # Tag image
        Write-Host "Tagging image..."
        docker tag hotel-backend:latest "$ecrRepo`:latest"
        Write-Success "Image tagged"
        
        # Push image
        Write-Host "Pushing image to ECR..."
        docker push "$ecrRepo`:latest"
        Write-Success "Image pushed to $ecrRepo"
    }
    catch {
        Write-Error-Custom "Failed to push to ECR: $_"
        exit 1
    }
}

# Deploy to EB
if ($Deploy) {
    Write-Header "Deploying to Elastic Beanstalk"
    
    try {
        Push-Location $repoRoot
        
        # Update Dockerrun.aws.json with account ID
        Write-Host "Updating Dockerrun.aws.json..."
        $dockerrunPath = Join-Path $repoRoot "Dockerrun.aws.json"
        $dockerrunContent = Get-Content $dockerrunPath -Raw
        $dockerrunContent = $dockerrunContent -replace "ACCOUNT_ID", $AwsAccountId
        $dockerrunContent = $dockerrunContent -replace "REGION", $AwsRegion
        Set-Content $dockerrunPath $dockerrunContent
        Write-Success "Dockerrun.aws.json updated"
        
        # Deploy
        Write-Host "Deploying to EB environment: $EbEnvName..."
        eb deploy $EbEnvName --region $AwsRegion
        Write-Success "Deployment initiated"
        
        # Wait for deployment
        Write-Host "Waiting for deployment to complete (this may take a few minutes)..."
        $maxAttempts = 60
        $attempt = 0
        
        while ($attempt -lt $maxAttempts) {
            $status = eb status --region $AwsRegion | Select-String "Status"
            
            if ($status -match "Ready") {
                Write-Success "Deployment completed successfully!"
                break
            }
            elseif ($status -match "Terminated") {
                Write-Error-Custom "Deployment failed"
                exit 1
            }
            
            $attempt++
            Write-Host "Status: $status [Attempt $attempt/$maxAttempts]"
            Start-Sleep -Seconds 10
        }
    }
    catch {
        Write-Error-Custom "Failed to deploy: $_"
        exit 1
    }
    finally {
        Pop-Location
    }
}

# Show logs
if ($ShowLogs) {
    Write-Header "Showing EB Logs"
    
    try {
        eb logs -l --region $AwsRegion
    }
    catch {
        Write-Error-Custom "Failed to retrieve logs: $_"
        exit 1
    }
}

# Summary
Write-Header "Deployment Summary"
Write-Host "AWS Account ID: $AwsAccountId"
Write-Host "AWS Region: $AwsRegion"
Write-Host "EB Environment: $EbEnvName"
Write-Host "Build Image: $BuildImage"
Write-Host "Push Image: $PushImage"
Write-Host "Deploy: $Deploy"
Write-Host "Show Logs: $ShowLogs"

Write-Host ""
Write-Host "Deployment workflow completed!" -ForegroundColor Green
