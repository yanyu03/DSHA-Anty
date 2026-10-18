<#
  agy-tier.ps1 -- switch Antigravity between the four DSH permission presets.

  DSH models permission as two orthogonal knobs: a filesystem *sandbox* and an
  *approval policy*, bundled into named presets (see
  @deepseek-ai/dsh-permission-presets).  This deployment configures four:

    read-only          sandbox=read-only          approval=ask
    workspace-write    sandbox=workspace-write    approval=ask
    danger-full-access sandbox=danger-full-access approval=never   ("Full access")
    auto               no sandbox                 per-call review  ("Auto review")

  Antigravity splits the same ground across three native switches plus lifecycle
  hooks, so each tier is realised in two places:

    * config.json / userSettings  -- autoExecutionPolicy, terminal sandbox,
      non-workspace file policy, internet policy, planning, artifact review and
      the grant allowlist.
    * the dsh-permissions plugin  -- tier.json (the gate's state) and hooks.json
      ("enabled").  Only read-only and auto need the hook: workspace-write and
      danger-full-access are fully expressed by the native switches, and running
      their hook would spawn a Python process on every single tool call for no
      benefit.

  HONEST FIDELITY NOTES
    * read-only: the harness blocks writes with a real sandbox; Antigravity has
      no in-workspace write denial, so the hook stands in for it. Catastrophic
      commands and mutating tools are denied; an ordinary write is escalated
      with force_ask instead of being blocked, because nothing here can truly
      prevent it.
    * auto: DSH asks the same model to adjudicate each call. This port uses a
      deterministic local rule engine instead -- free, fast and offline, but it
      will prompt more often than the real thing and can misjudge either way.
    * Switching stops Antigravity first. A running language server owns
      config.json and will overwrite it on its next write.

  USAGE
    pwsh -File agy-tier.ps1 read-only
    pwsh -File agy-tier.ps1 workspace-write
    pwsh -File agy-tier.ps1 danger-full-access
    pwsh -File agy-tier.ps1 auto
    pwsh -File agy-tier.ps1 -Status
    pwsh -File agy-tier.ps1 -SelfTest
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('read-only', 'workspace-write', 'danger-full-access', 'auto')]
    [string]$Tier,

    [switch]$Status,
    [switch]$SelfTest,
    [switch]$NoRestart,

    # Asserts that the warning below was shown to the user and explicitly
    # confirmed.  Without it every switch refuses and changes nothing.
    [switch]$Yes
)

$ErrorActionPreference = 'Stop'

$ConfigDir   = Join-Path $env:USERPROFILE '.gemini\config'
$ConfigPath  = Join-Path $ConfigDir 'config.json'
$PluginsPath = Join-Path $ConfigDir 'plugins.json'
$PluginDir   = Join-Path $ConfigDir 'plugins\dsh-permissions'
$TierPath    = Join-Path $PluginDir 'tier.json'
$HooksPath   = Join-Path $PluginDir 'hooks.json'
$GateLog     = Join-Path $PluginDir 'logs\gate.log'
$RollbackDir = Join-Path $ConfigDir '_rollback'
$AppExe      = Join-Path $env:LOCALAPPDATA 'Programs\antigravity\Antigravity.exe'

$PluginKey = 'dsh-permissions'

# ---------------------------------------------------------------------------
# Read-only grant sets for the native allowlist
# ---------------------------------------------------------------------------
# Grant actions.
#
# The grammar is `<action>(<pattern>)`.  These seven are the `(*)` forms that
# actually exist in language_server.exe; anything else is rejected at load with
# `permission_grant_store.go: ignoring invalid allow entry "...": unknown action`
# and then silently does nothing.  That is how `browser(*)` sat in three tiers
# for a while, contributing 13 warning lines per session and granting nothing.
# The vocabulary was read out of the binary, not guessed:
#   command(*) read_url(*) mcp(*) execute_url(*) read_file(*) write_file(*)
#   unsandboxed(*)
# Test-Grants below refuses to write a grant whose action is not in this set.
# ---------------------------------------------------------------------------
$ValidGrantActions = @(
    'command', 'read_url', 'mcp', 'execute_url', 'read_file', 'write_file', 'unsandboxed'
)

$ReadOnlyGrants = @(
    'command(git status)', 'command(git diff *)', 'command(git log *)',
    'command(git show *)', 'command(ls *)', 'command(dir *)', 'command(cat *)',
    'command(type *)', 'command(Get-ChildItem *)', 'command(Get-Content *)',
    'command(Get-Command *)', 'command(Get-Location *)', 'command(Select-String *)',
    'command(Get-Process *)', 'command(grep *)', 'command(findstr *)',
    'read_url(*)'
)

$DevGrants = @(
    'command(git *)', 'command(npm *)', 'command(pnpm *)', 'command(yarn *)',
    'command(pip *)', 'command(python *)', 'command(py *)', 'command(node *)',
    'command(cargo *)', 'command(go *)', 'command(dotnet *)', 'command(pytest *)',
    'command(make *)', 'command(ls *)', 'command(dir *)', 'command(cat *)',
    'command(type *)', 'command(Get-ChildItem *)', 'command(Get-Content *)',
    'command(Select-String *)', 'mcp(*)', 'read_url(*)'
)

# Full access also takes the file and url-execution grants.  unsandboxed(*) is
# deliberately NOT included: its name is in the vocabulary but its semantics are
# not established here, and this tier is already unrestricted natively.
$FullGrants = @(
    'command(*)', 'mcp(*)', 'read_url(*)', 'execute_url(*)',
    'read_file(*)', 'write_file(*)'
)

function Test-Grants {
    <# Returns the entries whose action is not a known grant action. #>
    param([string[]]$Grants)
    $bad = @()
    foreach ($g in $Grants) {
        if ($g -notmatch '^([a-z_]+)\((.*)\)$') { $bad += $g; continue }
        if ($ValidGrantActions -notcontains $matches[1]) { $bad += $g }
    }
    return $bad
}

# ---------------------------------------------------------------------------
# Tier table.  Hook = whether the PreToolUse gate is enabled for this tier.
# ---------------------------------------------------------------------------
$Tiers = [ordered]@{
    'read-only' = @{
        Label   = 'read-only          (DSH: sandbox=read-only, approval=ask)'
        WarningTitle = 'read-only is an approximation, not a real sandbox.'
        WarningBody  = 'Antigravity has no in-workspace write denial, so a hook stands in: mutating tools and catastrophic commands are denied, but an ordinary write only becomes "must be confirmed". This tier therefore means writes need approval, NOT that writes are impossible. Non-workspace file access and internet become DENY; terminal policy becomes strict (every command approved).'
        Hook    = $true
        Grants  = $ReadOnlyGrants
        Settings = [ordered]@{
            autoExecutionPolicy          = 'CASCADE_COMMANDS_AUTO_EXECUTION_OFF'
            enableTerminalSandbox        = $true
            nonWorkspaceFileAccessPolicy = 'AGENT_SETTING_POLICY_DENY'
            internetAccessPolicy         = 'AGENT_SETTING_POLICY_DENY'
            planningMode                 = 'PLANNING_MODE_OFF'
            artifactReviewMode           = 'ARTIFACT_REVIEW_MODE_ALWAYS'
        }
    }
    'workspace-write' = @{
        Label   = 'workspace-write    (DSH: sandbox=workspace-write, approval=ask)'
        WarningTitle = 'workspace-write keeps the terminal sandbox on and asks outside a dev allowlist.'
        WarningBody  = 'Only git / npm / pnpm / pip / python / node / cargo / go / dotnet / pytest / make style commands run without approval; everything else still asks. Non-workspace file access and internet become ASK. This tier is carried entirely by native switches with the hook off, so it costs nothing per tool call.'
        Hook    = $false
        Grants  = $DevGrants
        Settings = [ordered]@{
            autoExecutionPolicy          = 'CASCADE_COMMANDS_AUTO_EXECUTION_AUTO'
            enableTerminalSandbox        = $true
            nonWorkspaceFileAccessPolicy = 'AGENT_SETTING_POLICY_ASK'
            internetAccessPolicy         = 'AGENT_SETTING_POLICY_ASK'
            planningMode                 = 'PLANNING_MODE_OFF'
            artifactReviewMode           = 'ARTIFACT_REVIEW_MODE_AUTO'
        }
    }
    'danger-full-access' = @{
        Label   = 'danger-full-access (DSH: sandbox=danger-full-access, approval=never)'
        WarningTitle = 'danger-full-access removes every terminal approval.'
        WarningBody  = 'Terminal auto-execution becomes always-proceed, non-workspace file access and internet become ALLOW, and the grant allowlist collapses to command(*) / mcp(*) / read_url(*) / execute_url(*) / read_file(*) / write_file(*). The upstream preset warns that this reduces confirmation steps and lets the agent perform sensitive operations, file changes and external commands directly -- enable it only when you trust the following task.'
        Hook    = $false
        Grants  = $FullGrants
        Settings = [ordered]@{
            autoExecutionPolicy          = 'CASCADE_COMMANDS_AUTO_EXECUTION_EAGER'
            enableTerminalSandbox        = $false
            nonWorkspaceFileAccessPolicy = 'AGENT_SETTING_POLICY_ALLOW'
            internetAccessPolicy         = 'AGENT_SETTING_POLICY_ALLOW'
            planningMode                 = 'PLANNING_MODE_OFF'
            artifactReviewMode           = 'ARTIFACT_REVIEW_MODE_TURBO'
        }
    }
    'auto' = @{
        Label   = 'auto               (DSH: no sandbox, per-call review -- LOCAL policy engine)'
        WarningTitle = 'auto here is a LOCAL policy engine, NOT the model review DSH performs.'
        WarningBody  = 'DSH runs auto with no sandbox and asks the same model to adjudicate every call. This port has no cheap one-shot model entry point, so it uses a deterministic local regex policy: free, offline, roughly 50 ms, auditable -- and it will both allow and block the wrong thing, and interrupt you more often than the real thing. Logs and documentation call it "auto (local policy)" so it is never mistaken for the original.'
        Hook    = $true
        Grants  = @('mcp(*)', 'read_url(*)', 'execute_url(*)')
        Settings = [ordered]@{
            autoExecutionPolicy          = 'CASCADE_COMMANDS_AUTO_EXECUTION_AUTO'
            enableTerminalSandbox        = $false
            nonWorkspaceFileAccessPolicy = 'AGENT_SETTING_POLICY_ALLOW'
            internetAccessPolicy         = 'AGENT_SETTING_POLICY_ALLOW'
            planningMode                 = 'PLANNING_MODE_OFF'
            artifactReviewMode           = 'ARTIFACT_REVIEW_MODE_AUTO'
        }
    }
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
function Get-PythonPath {
    $cmd = Get-Command python -ErrorAction SilentlyContinue
    if ($cmd -and $cmd.Source) { return $cmd.Source }
    foreach ($p in @('C:\python312\python.exe', "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe")) {
        if (Test-Path -LiteralPath $p) { return $p }
    }
    throw 'python not found; the gate is a Python script and needs an interpreter'
}

function Backup-File([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { return }
    $stamp = Get-Date -Format 'yyyy-MM-dd_HHmmss'
    $dir = Join-Path $RollbackDir $stamp
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    Copy-Item -LiteralPath $Path -Destination (Join-Path $dir (Split-Path $Path -Leaf)) -Force
    Write-Host ("  backup -> {0}" -f (Join-Path $dir (Split-Path $Path -Leaf))) -ForegroundColor DarkGray
}

function Write-JsonNoBom([string]$Path, [string]$Json) {
    $tmp = "$Path.tmp"
    [System.IO.File]::WriteAllText($tmp, $Json, (New-Object System.Text.UTF8Encoding($false)))
    Move-Item -LiteralPath $tmp -Destination $Path -Force
}

function Stop-Antigravity {
    $procs = @(Get-Process -Name 'Antigravity', 'language_server' -ErrorAction SilentlyContinue)
    if (-not $procs) { return $false }
    Write-Host '  stopping Antigravity (a live language server rewrites config.json)...' -ForegroundColor DarkGray
    $procs | Where-Object { $_.MainWindowHandle -ne 0 } | ForEach-Object { $null = $_.CloseMainWindow() }
    Start-Sleep -Seconds 4
    Get-Process -Name 'Antigravity', 'language_server' -ErrorAction SilentlyContinue |
        Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    return $true
}

function Test-Elevated {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    return ([Security.Principal.WindowsPrincipal]::new($id)).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Start-Antigravity {
    if (-not (Test-Path -LiteralPath $AppExe)) { Write-Warning "Antigravity.exe not found at $AppExe"; return }

    # IMPORTANT: Antigravity must NOT be launched from an elevated process.
    # Electron calls app.requestSingleInstanceLock(); when the launcher runs with
    # a high-integrity token the lock is not acquired, the app quits with exit
    # code 0 before electron-log is even initialised, and nothing is written to
    # main.log -- it looks exactly like a silent no-op.  Handing the path to
    # explorer.exe makes the interactive shell (medium integrity) do the launch,
    # which is what a Start Menu click does.
    if (Test-Elevated) {
        Write-Host '  starting Antigravity de-elevated via explorer.exe ...' -ForegroundColor DarkGray
        Start-Process -FilePath (Join-Path $env:WINDIR 'explorer.exe') -ArgumentList "`"$AppExe`""
    } else {
        Write-Host '  starting Antigravity ...' -ForegroundColor DarkGray
        Start-Process -FilePath $AppExe | Out-Null
    }

    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Seconds 2
        if (Get-Process -Name 'Antigravity' -ErrorAction SilentlyContinue) {
            Write-Host '  Antigravity restarted.' -ForegroundColor Green
            return
        }
    }
    Write-Warning '  Antigravity did not come up after 40s; check logs\main.log'
}

function Write-HookLauncher([string]$Python) {
    # A launcher .cmd instead of a quoted interpreter path in hooks.json, for two
    # reasons that both bit us in practice:
    #
    #   1. Antigravity runs a hook command through `cmd /c`, and cmd mangles a
    #      command line that STARTS with a quote.  '"python.exe" "gate.py"' made
    #      cmd treat the quoted exe path as the program name and fail with
    #      "is not recognized as an internal or external command".
    #   2. Antigravity captures a hook's stderr into a protobuf string.  cmd.exe
    #      emits its errors in the console OEM code page (cp936 here), which is
    #      not valid UTF-8, so the agent executor dies with
    #      "proto: field google.protobuf.Value.string_value contains invalid
    #      UTF-8".  stderr is therefore discarded, and gate.py records its own
    #      failures into logs\gate.log as ASCII instead.
    $launcher = Join-Path $PluginDir 'run-gate.cmd'
    $lines = @(
        '@echo off',
        'rem Generated by agy-tier.ps1 -- see that script for why this exists.',
        'rem ASCII only, no leading quote, stderr discarded.',
        ('"{0}" "%~dp0scripts\gate.py" 2>nul' -f $Python),
        'exit /b %ERRORLEVEL%'
    )
    [System.IO.File]::WriteAllText($launcher, ($lines -join "`r`n") + "`r`n",
        (New-Object System.Text.UTF8Encoding($false)))
    return $launcher
}

function Write-HooksJson([bool]$Enabled) {
    $launcher = Write-HookLauncher (Get-PythonPath)
    $hooks = [ordered]@{
        $PluginKey = [ordered]@{
            enabled  = $Enabled
            PreToolUse = @(
                [ordered]@{
                    matcher = '.*'
                    hooks   = @(
                        [ordered]@{
                            type    = 'command'
                            command = $launcher
                            timeout = 10
                        }
                    )
                }
            )
        }
    }
    $json = $hooks | ConvertTo-Json -Depth 12
    Write-JsonNoBom -Path $HooksPath -Json $json
}

function Sync-ProjectSettings {
    <#
      Project settings override the global ones, so a stale project file silently
      defeats a tier switch inside that workspace.  This machine had exactly that:
      the MYSQL project pinned autoExecutionPolicy=EAGER and grant command(*),
      which meant read-only and workspace-write never took effect there while
      everything outside the project looked correct.

      Only the keys a tier owns are written; every other project field is
      preserved.  This runs while Antigravity is stopped, because the language
      server owns these files too.
    #>
    param($Spec)

    $dir = Join-Path $ConfigDir 'projects'
    if (-not (Test-Path -LiteralPath $dir)) { return 0 }
    $touched = 0
    foreach ($file in Get-ChildItem -LiteralPath $dir -Filter *.json -File) {
        try {
            $proj = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
        } catch {
            Write-Host ('    ! unreadable, skipped: {0}' -f $file.Name) -ForegroundColor Yellow
            continue
        }
        Backup-File $file.FullName
        if ($null -eq $proj.settings) {
            $proj | Add-Member -NotePropertyName settings -NotePropertyValue ([pscustomobject]@{}) -Force
        }
        $proj.settings | Add-Member -NotePropertyName autoExecutionPolicy `
            -NotePropertyValue $Spec.Settings['autoExecutionPolicy'] -Force
        if ($null -eq $proj.settings.globalPermissionGrants) {
            $proj.settings | Add-Member -NotePropertyName globalPermissionGrants `
                -NotePropertyValue ([pscustomobject]@{ allow = @() }) -Force
        }
        $proj.settings.globalPermissionGrants |
            Add-Member -NotePropertyName allow -NotePropertyValue $Spec.Grants -Force
        Write-JsonNoBom -Path $file.FullName -Json ($proj | ConvertTo-Json -Depth 20)
        Write-Host ('    project {0,-8} -> autoExecutionPolicy + {1} grants' -f $proj.name, $Spec.Grants.Count)
        $touched++
    }
    return $touched
}

function Get-CurrentTier {
    if (-not (Test-Path -LiteralPath $TierPath)) { return '<missing tier.json>' }
    try { return (Get-Content -LiteralPath $TierPath -Raw -Encoding UTF8 | ConvertFrom-Json).tier }
    catch { return '<unreadable>' }
}

function Show-Status {
    Write-Host ''
    Write-Host '  DSH permission tiers -> Antigravity' -ForegroundColor Cyan
    Write-Host ''
    Write-Host ('    active tier (plugin) : {0}' -f (Get-CurrentTier)) -ForegroundColor Yellow
    if (Test-Path -LiteralPath $ConfigPath) {
        $cfg = Get-Content -LiteralPath $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
        $us = $cfg.userSettings
        foreach ($k in 'autoExecutionPolicy', 'planningMode', 'artifactReviewMode',
                       'enableTerminalSandbox', 'nonWorkspaceFileAccessPolicy', 'internetAccessPolicy') {
            $v = $us.$k; if ($null -eq $v) { $v = '<unset>' }
            Write-Host ('    {0,-30} {1}' -f $k, $v)
        }
        $allow = @($us.globalPermissionGrants.allow)
        Write-Host ('    {0,-30} {1} entries' -f 'grants.allow', $allow.Count)
        # Surface bad grant actions here rather than letting the language server
        # ignore them silently; they contribute nothing but warning lines.
        $bad = Test-Grants $allow
        if ($bad.Count -gt 0) {
            Write-Host ('    {0,-30} {1}' -f 'grants: unknown actions', ($bad -join ', ')) -ForegroundColor Red
            Write-Host ('    {0,-30} {1}' -f '', 'the server ignores these; fix agy-tier.ps1') -ForegroundColor Red
        } else {
            Write-Host ('    {0,-30} {1}' -f 'grants: actions valid', 'yes') -ForegroundColor Green
        }
        # Project overrides beat these globals.  Show them, and flag any that pin a
        # different policy, because that is how a tier silently fails to apply
        # inside one workspace while -Status still looks correct.
        $projDir = Join-Path $ConfigDir 'projects'
        if (Test-Path -LiteralPath $projDir) {
            foreach ($pf in Get-ChildItem -LiteralPath $projDir -Filter *.json -File) {
                try { $pj = Get-Content -LiteralPath $pf.FullName -Raw -Encoding UTF8 | ConvertFrom-Json } catch { continue }
                $pPolicy = [string]$pj.settings.autoExecutionPolicy
                $pGrants = @($pj.settings.globalPermissionGrants.allow)
                $aligned = ($pPolicy -eq [string]$us.autoExecutionPolicy) -and ($pGrants.Count -eq $allow.Count)
                Write-Host ('    {0,-30} {1}' -f ('project ' + $pj.name), "$pPolicy / $($pGrants.Count) grants $(if ($aligned) { '' } else { '<-- NOT aligned with the tier' })") `
                    -ForegroundColor $(if ($aligned) { 'DarkGray' } else { 'Red' })
            }
        }
        $enabled = $null
        if ($cfg.plugins -and $cfg.plugins.$PluginKey) { $enabled = $cfg.plugins.$PluginKey.enabled }
        Write-Host ('    {0,-30} {1}' -f "plugins.$PluginKey.enabled", $(if ($null -eq $enabled) { '<unset>' } else { $enabled }))
    } else { Write-Warning "config.json not found at $ConfigPath" }

    $hookState = '<no hooks.json>'
    if (Test-Path -LiteralPath $HooksPath) {
        try { $hookState = (Get-Content -LiteralPath $HooksPath -Raw -Encoding UTF8 | ConvertFrom-Json).$PluginKey.enabled }
        catch { $hookState = '<unreadable>' }
    }
    Write-Host ('    {0,-30} {1}' -f 'hooks.json enabled', $hookState)
    $running = [bool](Get-Process -Name 'Antigravity' -ErrorAction SilentlyContinue)
    Write-Host ('    {0,-30} {1}' -f 'Antigravity running', $running)
    if (Test-Path -LiteralPath $GateLog) {
        Write-Host ''
        Write-Host '  last gate decisions (logs\gate.log)' -ForegroundColor Cyan
        Get-Content -LiteralPath $GateLog -Tail 6 | ForEach-Object {
            $line = $_; if ($line.Length -gt 150) { $line = $line.Substring(0, 150) + '...' }
            Write-Host ('    ' + $line) -ForegroundColor DarkGray
        }
    }
    Write-Host ''
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if ($SelfTest) {
    $py = Get-PythonPath
    Write-Host ''
    & $py (Join-Path $PluginDir 'scripts\selftest.py')
    exit $LASTEXITCODE
}

if ($Status -or -not $Tier) {
    Show-Status
    return
}

$spec = $Tiers[$Tier]

# ---------------------------------------------------------------------------
# Confirmation gate.
#
# A warning that a model may silently skip is not a warning.  Without -Yes this
# prints the tier's warning and exits WITHOUT touching anything, so the caller
# must assert that the user was shown the warning and confirmed.  Both supported
# front ends do exactly that: the DSH settings UI shows the warning text and an
# explicit confirm button before it passes -Yes, and the Antigravity skill
# instructs the agent to show it verbatim and wait for the user's word.
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Grant grammar gate.
#
# The language server does not reject a bad grant action; it logs
# `ignoring invalid allow entry "browser(*)": unknown action "browser"` once per
# session and then grants nothing.  A silent no-op is worse than a failure, so
# refuse to write one.  Runs before -Yes is even considered, so a bad table can
# never reach config.json.
# ---------------------------------------------------------------------------
$badGrants = Test-Grants $spec.Grants
if ($badGrants.Count -gt 0) {
    Write-Host ''
    Write-Host ('  refusing to write {0}: unknown grant action(s)' -f $Tier) -ForegroundColor Red
    foreach ($g in $badGrants) { Write-Host ('    {0}' -f $g) -ForegroundColor Red }
    Write-Host ''
    Write-Host ('  known actions: {0}' -f ($ValidGrantActions -join ', '))
    Write-Host '  the language server would ignore these silently and grant nothing.'
    Write-Host ''
    Write-Host '  Nothing was changed.' -ForegroundColor Green
    exit 3
}

if (-not $Yes) {
    Write-Host ''
    Write-Host ('  refusing to apply "{0}" without -Yes' -f $Tier) -ForegroundColor Yellow
    Write-Host ''
    Write-Host ('  {0}' -f $spec.WarningTitle) -ForegroundColor Yellow
    Write-Host ('  {0}' -f $spec.WarningBody)
    Write-Host ''
    Write-Host '  Every switch also stops and restarts Antigravity, which:' -ForegroundColor Yellow
    Write-Host '    - interrupts any conversation currently running'
    Write-Host '    - must launch the app de-elevated (an elevated launch exits 0 at'
    Write-Host '      requestSingleInstanceLock() with no log at all)'
    Write-Host ''
    Write-Host '  Show this to the user, wait for an explicit confirmation, then re-run:'
    Write-Host ('    agy-tier.ps1 {0} -Yes' -f $Tier) -ForegroundColor DarkGray
    Write-Host ''
    Write-Host '  Nothing was changed.' -ForegroundColor Green
    exit 2
}

Write-Host ''
Write-Host ('  applying tier: {0}' -f $spec.Label) -ForegroundColor Cyan
Write-Host ''

$wasRunning = Stop-Antigravity

# 1. native switches
Backup-File $ConfigPath
$cfg = Get-Content -LiteralPath $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
if ($null -eq $cfg.userSettings) {
    $cfg | Add-Member -NotePropertyName userSettings -NotePropertyValue ([pscustomobject]@{}) -Force
}
foreach ($k in $spec.Settings.Keys) {
    $cfg.userSettings | Add-Member -NotePropertyName $k -NotePropertyValue $spec.Settings[$k] -Force
    Write-Host ('    {0} = {1}' -f $k, $spec.Settings[$k])
}
if ($null -eq $cfg.userSettings.globalPermissionGrants) {
    $cfg.userSettings | Add-Member -NotePropertyName globalPermissionGrants `
        -NotePropertyValue ([pscustomobject]@{ allow = @() }) -Force
}
$cfg.userSettings.globalPermissionGrants |
    Add-Member -NotePropertyName allow -NotePropertyValue $spec.Grants -Force
Write-Host ('    globalPermissionGrants.allow = {0} entries' -f $spec.Grants.Count)

# 2. plugin enablement lives in config.json, keyed by the plugin DIRECTORY name
$pluginsMap = [ordered]@{}
if ($cfg.plugins) {
    foreach ($p in $cfg.plugins.PSObject.Properties) { $pluginsMap[$p.Name] = $p.Value }
}
$pluginsMap[$PluginKey] = [ordered]@{ enabled = $true }
$cfg | Add-Member -NotePropertyName plugins -NotePropertyValue ([pscustomobject]$pluginsMap) -Force
Write-Host ('    plugins.{0}.enabled = true' -f $PluginKey)

Write-JsonNoBom -Path $ConfigPath -Json ($cfg | ConvertTo-Json -Depth 40)
Write-Host '    config.json written.'

# 1b. project-level overrides.  They win over the global settings, so a stale
# project file can silently defeat this whole switch inside its workspace.
$touchedProjects = Sync-ProjectSettings $spec
Write-Host ('    project overrides aligned: {0}' -f $touchedProjects)

# 3. register the plugin
if (Test-Path -LiteralPath $PluginsPath) { Backup-File $PluginsPath }
$entries = @()
if (Test-Path -LiteralPath $PluginsPath) {
    try {
        $existing = Get-Content -LiteralPath $PluginsPath -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($existing.entries) { $entries = @($existing.entries) }
    } catch { }
}
if (-not ($entries | Where-Object { $_.path -eq $PluginDir })) {
    $entries += [pscustomobject]@{ path = $PluginDir }
}
Write-JsonNoBom -Path $PluginsPath -Json ([pscustomobject]@{ entries = $entries } | ConvertTo-Json -Depth 10)
Write-Host ('    plugins.json registers {0} entry(ies)' -f $entries.Count)

# 4. plugin state + hook arming
Backup-File $TierPath
Write-JsonNoBom -Path $TierPath -Json ([ordered]@{
    tier            = $Tier
    auto_reviewer   = 'local'
    audit_logging   = $true
    log_allow       = $false
} | ConvertTo-Json)
Write-Host ('    tier.json -> {0}' -f $Tier)

Backup-File $HooksPath
Write-HooksJson -Enabled ([bool]$spec.Hook)
Write-Host ('    hooks.json enabled = {0}  (per-call gate {1})' -f $spec.Hook, $(if ($spec.Hook) { 'ACTIVE' } else { 'off: native switches carry this tier' }))

if (-not $NoRestart) {
    Start-Antigravity
} elseif ($wasRunning) {
    Write-Host '  -NoRestart set; Antigravity was stopped and left stopped.' -ForegroundColor Yellow
}

Write-Host ''
Show-Status
