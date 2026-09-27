<#
.SYNOPSIS
    TINDA POS — One-Command Local Release & Tagging Tool.
    Automates version bumping, sanity checks, and Git tagging without requiring admin privileges.

.USAGE
    .\tools\release.ps1 -Version 1.0.29
#>

param (
    [Parameter(Mandatory=$true)]
    [string]$Version
)

$ErrorActionPreference = "Stop"

$cleanVersion = $Version.TrimStart('v')
$tag = "v$cleanVersion"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  TINDA POS AUTOMATED RELEASE PREPARATION " -ForegroundColor Cyan
Write-Host "  Target Version: $cleanVersion ($tag)" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Check Git Status
Write-Host "`n[1/5] Checking Git Working Tree..." -ForegroundColor Cyan
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Warning "Working tree has uncommitted changes:"
    git status -s
    $confirm = Read-Host "Do you want to continue and commit these changes? (y/n)"
    if ($confirm -ne 'y') {
        Write-Host "Release aborted." -ForegroundColor Red
        exit 1
    }
}

# 2. Bump package.json version
Write-Host "`n[2/5] Updating package.json to v$cleanVersion..." -ForegroundColor Cyan
$pkgPath = "source/package.json"
if (Test-Path $pkgPath) {
    $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
    $pkg.version = $cleanVersion
    $pkgJson = $pkg | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText((Resolve-Path $pkgPath), "$pkgJson`n", [System.Text.Encoding]::UTF8)
    Write-Host "  -> Updated $pkgPath version to $cleanVersion" -ForegroundColor Green
} else {
    Write-Error "Could not find $pkgPath"
    exit 1
}

# 3. Update Master Documentation header
Write-Host "`n[3/5] Updating User Manual header..." -ForegroundColor Cyan
$manualPath = "docs/USER-MANUAL.md"
if (Test-Path $manualPath) {
    $manualContent = Get-Content $manualPath -Raw
    $updatedManual = $manualContent -replace 'TINDA POS v\d+\.\d+\.\d+', "TINDA POS v$cleanVersion"
    [System.IO.File]::WriteAllText((Resolve-Path $manualPath), $updatedManual, [System.Text.Encoding]::UTF8)
    Write-Host "  -> Updated $manualPath title to v$cleanVersion" -ForegroundColor Green
}

# 4. Commit changes
Write-Host "`n[4/5] Committing version bump to Git..." -ForegroundColor Cyan
git add source/package.json docs/USER-MANUAL.md
git commit -m "chore(release): bump version to $tag"
Write-Host "  -> Committed release changes." -ForegroundColor Green

# 5. Create Git Tag & Push Prompt
Write-Host "`n[5/5] Creating Git Tag $tag..." -ForegroundColor Cyan
git tag -a $tag -m "Release $tag"
Write-Host "  -> Tag $tag created successfully!" -ForegroundColor Green

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  READY FOR CLOUD CI/CD RELEASE!                         " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host "To trigger the automated GitHub Actions build & release:" -ForegroundColor Yellow
Write-Host "Run this command:" -ForegroundColor White
Write-Host "   git push origin master --tags" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor Gray
Write-Host "GitHub will automatically build Setup.exe, Portable.exe," -ForegroundColor Gray
Write-Host "validate latest.yml, and attach the User Guide PDF!" -ForegroundColor Gray
Write-Host "========================================================" -ForegroundColor Green
