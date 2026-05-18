param(
    [string]$Registry = "docker.io",
    [string]$Image = "karbivskyi/minebench-ui",
    [string[]]$Tags = @("latest"),
    [string]$Platform = "linux/amd64",
    [string]$EnvFile = ".env.local",
    [switch]$Push,
    [switch]$Load
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Invoke-Checked {
    param([string]$Command, [string[]]$Arguments)

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed: $Command"
    }
}

if ($Push -and $Load) {
    throw "Use either -Push or -Load, not both."
}

if (-not $Push -and -not $Load) {
    $Push = $true
}

Invoke-Checked "docker" @("info")

$fullImage = if ($Registry) { "$Registry/$Image" } else { $Image }
$normalizedTags = @()
foreach ($tag in $Tags) {
    $normalizedTags += @($tag -split "," | ForEach-Object { $_.Trim() } | Where-Object { $_ })
}

if (-not $normalizedTags) {
    throw "At least one Docker tag is required."
}

$tagArgs = @()
foreach ($tag in $normalizedTags) {
    $tagArgs += @("-t", "$fullImage`:$tag")
}

$buildArgs = @()
if (Test-Path $EnvFile) {
    Write-Host "Loading NEXT_PUBLIC_* build args from $EnvFile" -ForegroundColor Yellow
    foreach ($line in Get-Content $EnvFile) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }

        $parts = $trimmed -split "=", 2
        if ($parts.Count -ne 2) { continue }

        $key = $parts[0].Trim()
        $value = $parts[1].Trim()
        if ($key.StartsWith("NEXT_PUBLIC_") -and $value) {
            $buildArgs += @("--build-arg", "$key=$value")
        }
    }
} else {
    Write-Host "Warning: $EnvFile not found. Docker build may fail if required public env vars are missing." -ForegroundColor Yellow
}

$outputArg = if ($Push) { "--push" } else { "--load" }

Write-Host "Building image with Windows Docker" -ForegroundColor Cyan
Write-Host "  Image: $fullImage" -ForegroundColor White
Write-Host "  Tags: $($normalizedTags -join ', ')" -ForegroundColor White
Write-Host "  Platform: $Platform" -ForegroundColor White
Write-Host "  Output: $outputArg" -ForegroundColor White

$dockerArgs = @(
    "buildx", "build",
    "--platform", $Platform
) + $tagArgs + $buildArgs + @($outputArg, ".")

Invoke-Checked "docker" $dockerArgs

Write-Host "Done." -ForegroundColor Green
