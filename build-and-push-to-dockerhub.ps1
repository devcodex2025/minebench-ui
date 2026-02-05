# Minebench UI - Docker Build and Push Script for Windows (Docker Hub)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Docker Build and Push Script (Docker Hub)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Configuration
$DOCKERHUB_USERNAME = "karbivskyi"
$IMAGE_NAME = "minebench-ui"
$FULL_IMAGE_NAME = "$DOCKERHUB_USERNAME/$IMAGE_NAME"

# Read current version from package.json
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$currentVersion = $packageJson.version

Write-Host "Current version: $currentVersion" -ForegroundColor Yellow
$newVersion = Read-Host "Enter new version (or press Enter to keep $currentVersion)"

if ([string]::IsNullOrWhiteSpace($newVersion)) {
    $newVersion = $currentVersion
} else {
    # Update package.json
    $packageJson.version = $newVersion
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
    Write-Host "Updated package.json to version $newVersion" -ForegroundColor Green
}

Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Registry: Docker Hub" -ForegroundColor White
Write-Host "  Image: $FULL_IMAGE_NAME" -ForegroundColor White
Write-Host "  Version: $newVersion" -ForegroundColor White
Write-Host ""

# Check if Docker is running
try {
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not running"
    }
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

# Check if already logged in to Docker Hub
Write-Host "Checking Docker Hub login status..." -ForegroundColor Yellow
$loginCheck = docker info 2>&1 | Select-String "Username:"
if (-not $loginCheck) {
    Write-Host "Not logged in to Docker Hub. Please login:" -ForegroundColor Yellow
    docker login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to login to Docker Hub" -ForegroundColor Red
        exit 1
    }
    Write-Host "Successfully logged in to Docker Hub" -ForegroundColor Green
} else {
    Write-Host "Already logged in to Docker Hub" -ForegroundColor Green
}

# Build the Docker image
Write-Host ""
Write-Host "Building Docker image..." -ForegroundColor Yellow
$latestTag = "$FULL_IMAGE_NAME`:latest"
Write-Host "Building tag: $latestTag"

# Load environment variables from .env.local if it exists
$buildArgs = @()
if (Test-Path ".env.local") {
    Write-Host "Loading environment variables from .env.local" -ForegroundColor Yellow
    $envContent = Get-Content ".env.local" -Raw
    
    # Parse environment variables more reliably
    foreach ($line in $envContent -split "`n") {
        $line = $line.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line -split "=", 2
            if ($parts.Count -eq 2) {
                $key = $parts[0].Trim()
                $value = $parts[1].Trim()
                if ($key -and $value) {
                    $buildArgs += "--build-arg"
                    $buildArgs += "$key=$value"
                }
            }
        }
    }
} else {
    Write-Host "Warning: .env.local not found. Building without environment variables." -ForegroundColor Yellow
}

docker build -t $latestTag @buildArgs .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker build failed" -ForegroundColor Red
    exit 1
}

Write-Host "Docker image built successfully" -ForegroundColor Green

# Tag the version
Write-Host ""
Write-Host "Tagging version v$newVersion..." -ForegroundColor Yellow
$versionTag = "$FULL_IMAGE_NAME`:v$newVersion"
Write-Host "Tagging: $latestTag -> $versionTag"
docker tag $latestTag $versionTag

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to tag image" -ForegroundColor Red
    exit 1
}

# Push images
Write-Host ""
Write-Host "Pushing images to Docker Hub..." -ForegroundColor Yellow
Write-Host "Pushing: $latestTag"
docker push $latestTag

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to push latest tag" -ForegroundColor Red
    exit 1
}

Write-Host "Pushing: $versionTag"
docker push $versionTag

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to push version tag" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Images pushed successfully to Docker Hub" -ForegroundColor Green
Write-Host ""
Write-Host "Success! Your image is now available at:" -ForegroundColor Green
Write-Host "  $latestTag" -ForegroundColor White
Write-Host "  $versionTag" -ForegroundColor White
