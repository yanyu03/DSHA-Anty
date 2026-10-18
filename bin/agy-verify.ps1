<#
  agy-verify.ps1 -- READ-ONLY post-reboot verification for Antigravity.

  Answers three questions in one shot:
    1. Does Antigravity 2.15.1 actually start now?
    2. Are the DSH-equivalent permission settings in effect?
    3. Did any of the old tampering come back?

  It changes NOTHING. Safe to run any time.

  USAGE
    pwsh -File agy-verify.ps1
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Continue'

$ConfigPath   = Join-Path $env:USERPROFILE '.gemini\config\config.json'
$PluginsPath  = Join-Path $env:USERPROFILE '.gemini\config\plugins.json'
$InstallDir   = Join-Path $env:LOCALAPPDATA 'Programs\antigravity'
$ResourcesDir = Join-Path $InstallDir 'resources'
$AppData      = Join-Path $env:APPDATA 'Antigravity'
$MainLog      = Join-Path $AppData 'logs\main.log'
$HookPath     = Join-Path $env:USERPROFILE 'Desktop\MYSQL\.agents\hooks.json'

$pass = 0; $fail = 0; $warn = 0

function Ok   ($m) { Write-Host ("  [PASS] " + $m) -ForegroundColor Green;  $script:pass++ }
function Bad  ($m) { Write-Host ("  [FAIL] " + $m) -ForegroundColor Red;    $script:fail++ }
function Warn ($m) { Write-Host ("  [WARN] " + $m) -ForegroundColor Yellow; $script:warn++ }
function Head ($m) { Write-Host ''; Write-Host ("== " + $m) -ForegroundColor Cyan }

# ---------------------------------------------------------------- 1. launch
Head 'Antigravity process'
$procs = @(Get-Process -Name 'Antigravity' -ErrorAction SilentlyContinue)
$ls    = @(Get-Process -Name 'language_server' -ErrorAction SilentlyContinue)
if ($procs.Count -gt 0) { Ok ("Antigravity running ({0} processes)" -f $procs.Count) }
else { Bad 'Antigravity is NOT running (start it, then re-run this script)' }
if ($ls.Count -gt 0) { Ok ("language_server running ({0})" -f $ls.Count) }
else { if ($procs.Count -gt 0) { Warn 'language_server not up yet (normal for the first ~10s)' } else { Warn 'language_server not running' } }

Head 'Installed version'
if (Test-Path -LiteralPath (Join-Path $InstallDir 'Antigravity.exe')) {
    $vi = (Get-Item -LiteralPath (Join-Path $InstallDir 'Antigravity.exe')).VersionInfo
    $ver = $vi.FileVersion
    if ($ver -eq '2.15.1') { Ok "Antigravity.exe version $ver" } else { Warn "Antigravity.exe version $ver (was 2.15.1 at fix time)" }
} else { Bad 'Antigravity.exe not found' }

# ---------------------------------------------------------------- 2. settings
Head 'Permission settings (config.json)'
if (Test-Path -LiteralPath $ConfigPath) {
    try {
        $us = (Get-Content -LiteralPath $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json).userSettings
        $expect = [ordered]@{
            autoExecutionPolicy          = 'CASCADE_COMMANDS_AUTO_EXECUTION_EAGER'
            planningMode                 = 'PLANNING_MODE_OFF'
            artifactReviewMode           = 'ARTIFACT_REVIEW_MODE_TURBO'
            enableTerminalSandbox        = $false
            nonWorkspaceFileAccessPolicy = 'AGENT_SETTING_POLICY_ALLOW'
            internetAccessPolicy         = 'AGENT_SETTING_POLICY_ALLOW'
        }
        foreach ($k in $expect.Keys) {
            $got = $us.$k
            $want = $expect[$k]
            if ($got -eq $want) { Ok ("{0} = {1}" -f $k, $got) }
            else { Bad ("{0} = {1}  (expected {2})" -f $k, $got, $want) }
        }
        $allow = @($us.globalPermissionGrants.allow)
        Write-Host ("         allowlist: " + ($allow -join ', ')) -ForegroundColor DarkGray
        if ($allow -contains 'command(*)') { Ok ("allowlist contains command(*)  ({0} entries)" -f $allow.Count) }
        else { Bad 'allowlist is missing command(*)' }
        if ($allow.Count -le 6) { Ok ("allowlist is clean ({0} entries)" -f $allow.Count) }
        else { Warn ("allowlist has {0} entries; junk one-off grants may have come back" -f $allow.Count) }
    } catch { Bad ("could not parse config.json: " + $_.Exception.Message) }
} else { Bad "config.json not found at $ConfigPath" }

# ---------------------------------------------------------------- 3. tampering
Head 'Binary tampering'
if (Test-Path -LiteralPath (Join-Path $ResourcesDir 'app.asar')) { Ok 'resources\app.asar present (official bundle)' }
else { Bad 'resources\app.asar MISSING' }
if (Test-Path -LiteralPath (Join-Path $ResourcesDir 'app.asar.disabled')) { Bad 'resources\app.asar.disabled exists -- patcher ran again' }
else { Ok 'no app.asar.disabled' }
if (Test-Path -LiteralPath (Join-Path $ResourcesDir 'app')) { Bad 'resources\app\ exists (unpacked/patched tree is back)' }
else { Ok 'no unpacked resources\app\' }
$preload = Join-Path $ResourcesDir 'app\dist\preload.js'
if (Test-Path -LiteralPath $preload) {
    $len = (Get-Item -LiteralPath $preload).Length
    if ($len -gt 6000) { Bad ("injected preload.js is back ({0} bytes; official is 4925)" -f $len) }
    else { Warn ("resources\app\dist\preload.js present ({0} bytes)" -f $len) }
}
$patcher = Join-Path $env:USERPROFILE 'Desktop\MYSQL\0921\Antigravity-Patcher.exe'
if (Test-Path -LiteralPath $patcher) { Warn 'Antigravity-Patcher.exe still on disk -- do NOT run it, it re-applies the patch' }

Head 'Plugin / hook rollback'
if (Test-Path -LiteralPath $PluginsPath) {
    try {
        $entries = @((Get-Content -LiteralPath $PluginsPath -Raw -Encoding UTF8 | ConvertFrom-Json).entries)
        if ($entries.Count -eq 0) { Ok 'plugins.json registers no plugins' }
        else { Bad ("plugins.json registers {0} plugin(s) again" -f $entries.Count) }
    } catch { Warn 'could not parse plugins.json' }
}
if (Test-Path -LiteralPath $HookPath) { Bad 'MYSQL\.agents\hooks.json is active again (per-command Python spawn)' }
else { Ok 'workspace hooks.json is disabled' }

# ---------------------------------------------------------------- 4. log
Head 'Startup evidence (main.log tail)'
if (Test-Path -LiteralPath $MainLog) {
    $tail = Get-Content -LiteralPath $MainLog -Tail 40
    $start = $tail | Where-Object { $_ -match 'Starting app \(v2\.15\.1\)' } | Select-Object -Last 1
    if ($start) { Ok ('startup logged: ' + $start.Trim()) }
    else {
        $any = $tail | Where-Object { $_ -match 'Starting app \(v' } | Select-Object -Last 1
        if ($any) { Warn ('last logged startup: ' + $any.Trim()) } else { Warn 'no "Starting app" line in the last 40 log lines' }
    }
    $run = $tail | Where-Object { $_ -match 'Local:\s+https://127\.0\.0\.1' } | Select-Object -Last 1
    if ($run) { Ok ('UI served at ' + $run.Trim()) }
} else { Warn "main.log not found at $MainLog" }

# ---------------------------------------------------------------- verdict
Head 'Verdict'
Write-Host ("  pass={0}  fail={1}  warn={2}" -f $pass, $fail, $warn)
if ($fail -eq 0 -and $procs.Count -gt 0) { Write-Host '  Antigravity is up with DSH-style full access.' -ForegroundColor Green }
elseif ($fail -eq 0) { Write-Host '  Settings are correct; Antigravity just is not started yet.' -ForegroundColor Yellow }
else { Write-Host '  Something regressed -- see FAIL lines above.' -ForegroundColor Red }
Write-Host ''
