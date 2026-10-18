<#
  agy-audit.ps1 -- review the DSHA gate audit trail.

  The gate writes one line per decision that is not a plain allow.  A log full of
  self-test traffic and no way to separate it from real agent activity is not an
  audit, so this script does the separation for you:

    * real agent calls are identified by the conversationId the hook was handed
      (a UUID); every synthetic payload written by selftest.py or by a wiring
      check carries a made-up id such as `selftest` or `realpath-check`;
    * by default only real calls are reported, because on this machine they were
      a small minority of the file.

  IMPORTANT LIMITATION: with `log_allow: false` in tier.json the gate records
  only deny / ask / force_ask.  A run that was allowed end to end leaves NO trace
  here, so "nothing in the log" does NOT mean "nothing happened".  Set
  `"log_allow": true` in tier.json (it takes effect immediately, no restart) to
  record allows too.

  USAGE
    pwsh -File agy-audit.ps1                 # real agent calls only
    pwsh -File agy-audit.ps1 -All            # include synthetic entries
    pwsh -File agy-audit.ps1 -Tier read-only # one tier only
    pwsh -File agy-audit.ps1 -Tail 40        # show more non-allow lines
#>
[CmdletBinding()]
param(
    [switch]$All,
    [string]$Tier,
    [int]$Tail = 20
)

$ErrorActionPreference = 'Continue'

$ConfigDir = Join-Path $env:USERPROFILE '.gemini\config'
$PluginDir = Join-Path $ConfigDir 'plugins\dsh-permissions'
$LogPath   = Join-Path $PluginDir 'logs\gate.log'
$RotPath   = "$LogPath.1"
$TierPath  = Join-Path $PluginDir 'tier.json'

$UuidPattern = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'

if (-not (Test-Path -LiteralPath $LogPath)) {
    Write-Host ''
    Write-Host "  no audit log yet at $LogPath" -ForegroundColor Yellow
    Write-Host '  the gate only writes when a tool call reaches it; a tier with the'
    Write-Host '  hook disabled (workspace-write, danger-full-access) never does.'
    Write-Host ''
    exit 0
}

$files = @($LogPath)
if (Test-Path -LiteralPath $RotPath) { $files += $RotPath }
$lines = @()
foreach ($f in $files) { $lines += @(Get-Content -LiteralPath $f) }
$parsed = @()
foreach ($line in $lines) {
    # cid/step are optional: rows written before the gate started recording them
    # are still real audit rows and must not be silently dropped.
    if ($line -match '^\[([^\]]+)\]\s+\[([^\]]+)\]\s+\[([^\]]+)\]\s+(?:cid=(\S+)\s+step=(\S+)\s+)?tool=(\S*)\s+cmd=(.*?)\s+::\s+(.*)$') {
        $parsed += [pscustomobject]@{
            Time    = $matches[1]
            Tier    = $matches[2]
            Decision= $matches[3]
            Cid     = $(if ($matches[4]) { $matches[4] } else { '(pre-cid row)' })
            Step    = $(if ($matches[5]) { $matches[5] } else { '-' })
            Tool    = $matches[6]
            Cmd     = $matches[7]
            Reason  = $matches[8]
            Real    = ($matches[4] -match $UuidPattern)
        }
    }
}

Write-Host ''
Write-Host '  DSHA gate audit' -ForegroundColor Cyan
Write-Host ''
Write-Host ('    log files      : {0}' -f ($files | ForEach-Object { Split-Path $_ -Leaf }) -join ', ')
Write-Host ('    lines parsed   : {0} of {1} raw' -f $parsed.Count, $lines.Count)
if (Test-Path -LiteralPath $TierPath) {
    $t = Get-Content -LiteralPath $TierPath -Raw -Encoding UTF8 | ConvertFrom-Json
    Write-Host ('    active tier    : {0}' -f $t.tier)
    Write-Host ('    log_allow      : {0}' -f $t.log_allow)
}
if ($parsed.Count -eq 0) {
    Write-Host ''
    Write-Host '    nothing parsed; the file does not look like gate output.' -ForegroundColor Yellow
    Write-Host ''
    exit 0
}

$real = @($parsed | Where-Object { $_.Real })
$synth = @($parsed | Where-Object { -not $_.Real })
Write-Host ('    real calls     : {0}' -f $real.Count) -ForegroundColor Green
Write-Host ('    synthetic      : {0}  (self-test and wiring checks)' -f $synth.Count) -ForegroundColor DarkGray
Write-Host ('    window         : {0}  ->  {1}' -f $parsed[0].Time, $parsed[-1].Time)

$sel = if ($All) { $parsed } else { $real }
if ($Tier) { $sel = @($sel | Where-Object { $_.Tier -eq $Tier }) }

if ($sel.Count -eq 0) {
    Write-Host ''
    if ($real.Count -eq 0) {
        Write-Host '    no REAL agent call has reached the gate yet.' -ForegroundColor Yellow
        Write-Host '    the gate only sees calls while a hook tier (read-only / auto) is active.'
    } else {
        Write-Host '    no rows matched the filter.'
    }
    Write-Host ''
    exit 0
}

Write-Host ''
Write-Host ('  conversations ({0})' -f $(if ($All) { 'all entries' } else { 'real only' })) -ForegroundColor Cyan
$sel | Group-Object Cid | Sort-Object Count -Descending | ForEach-Object {
    $dec = ($_.Group | Group-Object Decision | ForEach-Object { '{0} x{1}' -f $_.Name, $_.Count }) -join ', '
    $tiers = ($_.Group | Select-Object -ExpandProperty Tier -Unique) -join '/'
    Write-Host ('    {0,-40} {1,3} calls  [{2}]  {3}' -f $_.Name, $_.Count, $tiers, $dec)
}

Write-Host ''
Write-Host '  decisions' -ForegroundColor Cyan
$sel | Group-Object Decision | Sort-Object Count -Descending | ForEach-Object {
    Write-Host ('    {0,-12} x{1}' -f $_.Name, $_.Count)
}

# Rows the gate wrote when it crashed and fell back to force_ask.  These are the
# single highest-value signal in the trail: a bare decision count cannot tell a
# correct force_ask apart from force_ask-by-exception, which is exactly how an
# unbounded recursion in the classifier stayed invisible until this section
# existed.  Always shown, never filtered.
$internal = @($lines | Where-Object { $_ -match '\[internal\]' })
if ($internal.Count -gt 0) {
    Write-Host ''
    Write-Host ('  GATE CRASHES ({0}) -- the gate raised and answered force_ask' -f $internal.Count) -ForegroundColor Red
    $internal | Select-Object -Last 10 | ForEach-Object {
        $t = $_; if ($t.Length -gt 150) { $t = $t.Substring(0, 150) + '...' }
        Write-Host ('    ' + $t) -ForegroundColor Red
    }
    Write-Host '    A row here means a decision came from the exception handler, not the' -ForegroundColor DarkGray
    Write-Host '    classifier. Look for a shape the classifier mishandles, fix gate.py,' -ForegroundColor DarkGray
    Write-Host '    and add a case to selftest.py that asserts the REASON, not just the' -ForegroundColor DarkGray
    Write-Host '    decision -- a bare expectation can be satisfied by the crash itself.' -ForegroundColor DarkGray
}

Write-Host ''
Write-Host '  tools seen' -ForegroundColor Cyan
$sel | Group-Object Tool,Decision | Sort-Object Count -Descending | ForEach-Object {
    Write-Host ('    {0,-40} x{1}' -f $_.Name.Replace(', ', ' -> '), $_.Count)
}

$blocked = @($sel | Where-Object { $_.Decision -ne 'allow' })
if ($blocked.Count -gt 0) {
    Write-Host ''
    Write-Host ('  refusals and escalations (last {0} of {1})' -f [Math]::Min($Tail, $blocked.Count), $blocked.Count) -ForegroundColor Cyan
    $blocked | Select-Object -Last $Tail | ForEach-Object {
        $reason = $_.Reason
        if ($reason.Length -gt 96) { $reason = $reason.Substring(0, 96) + '...' }
        $cmd = $_.Cmd
        if ($cmd.Length -gt 60) { $cmd = $cmd.Substring(0, 60) + '...' }
        Write-Host ('    {0}  [{1}] {2,-8} {3,-22} {4}' -f $_.Time, $_.Tier, $_.Decision, $_.Tool, $reason) -ForegroundColor Yellow
        if ($cmd -and $cmd -ne "''") { Write-Host ('        cmd: {0}' -f $cmd) -ForegroundColor DarkGray }
    }

    Write-Host ''
    Write-Host '  repeated refusals of one tool can mean a classification gap, not an' -ForegroundColor DarkGray
    Write-Host '  agent misbehaving -- that is exactly how the list_dir false positive' -ForegroundColor DarkGray
    Write-Host '  was found. Check the tool name against gate.py READ_TOOLS/WRITE_TOOLS.' -ForegroundColor DarkGray
}

if (-not $All -and $synth.Count -gt 0) {
    Write-Host ''
    Write-Host ('  {0} synthetic entries are hidden; use -All to include them.' -f $synth.Count) -ForegroundColor DarkGray
}
Write-Host ''
