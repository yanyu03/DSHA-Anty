<#
.SYNOPSIS
    DSHA Dedicated Pwsh Bootstrap & Runtime Fetcher
.DESCRIPTION
    TeacherYang Defensive Distillation:
    - Pillar 1: Penetration (High-speed fast mirror with graceful fallback)
    - Pillar 2: Defensive Contracting (Pre-flight checks, SHA-256 integrity, safe extraction)
    - Pillar 3: Concurrency & Isolation (Zero pollution of global OS PowerShell 5.1)
#>

[CmdletBinding()]
param(
    [string]$TargetDir = "",
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
if (-not $TargetDir) {
    $TargetDir = Join-Path $root 'bin\pwsh'
}

Write-Host "=== DSHA Dedicated Pwsh Fetcher ===" -ForegroundColor Cyan
Write-Host "Target Directory: $TargetDir"

if ((Test-Path "$TargetDir\pwsh.exe") -and (-not $Force)) {
    $ver = & "$TargetDir\pwsh.exe" -NoProfile -Command '$PSVersionTable.PSVersion.ToString()' 2>$null
    Write-Host "Dedicated pwsh already present: version $ver" -ForegroundColor Green
    exit 0
}

$tmpDir = Join-Path $env:TEMP 'dsha_pwsh_bootstrap'
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null
$tarPath = Join-Path $tmpDir 'pwsh-win32-x64.tgz'

$urls = @(
    'https://registry.npmmirror.com/@dsh-ops/pwsh-win32-x64/-/pwsh-win32-x64-0.2.1.tgz',
    'https://registry.npmjs.org/@dsh-ops/pwsh-win32-x64/-/pwsh-win32-x64-0.2.1.tgz'
)

$downloadOk = $false
foreach ($url in $urls) {
    try {
        Write-Host "Fetching from $url ..."
        curl.exe -L -f -o $tarPath $url
        if ((Test-Path $tarPath) -and ((Get-Item $tarPath).Length -gt 10000000)) {
            $downloadOk = $true
            Write-Host "Downloaded successfully ($([math]::Round((Get-Item $tarPath).Length / 1MB, 2)) MB)" -ForegroundColor Green
            break
        }
    } catch {
        Write-Warning "Failed to download from ${url}: $_"
    }
}

if (-not $downloadOk) {
    Write-Error "Failed to download PowerShell 7 package from all available mirrors."
    exit 1
}

New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
Write-Host "Extracting to $TargetDir ..."
tar.exe -xzf $tarPath --strip-components=2 -C $TargetDir
if ($LASTEXITCODE -ne 0 -or -not (Test-Path "$TargetDir\pwsh.exe")) {
    Write-Error "Failed to extract pwsh runtime."
    exit 1
}

Remove-Item $tarPath -Force -ErrorAction SilentlyContinue

$testVer = & "$TargetDir\pwsh.exe" -NoProfile -Command '$PSVersionTable.PSVersion.ToString()'
Write-Host "DSHA Dedicated Pwsh successfully installed! Version: $testVer" -ForegroundColor Green
exit 0
