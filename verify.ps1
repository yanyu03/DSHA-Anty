# DSHA 安装后体检（只读，不改任何文件）
#   pwsh -File verify.ps1

$ErrorActionPreference = 'Continue'
$cfg = Join-Path $env:USERPROFILE '.gemini\config'
$ok = 0; $fail = 0; $warn = 0

function Check($name, $cond, $detail = '') {
  if ($cond) { Write-Host ("  [PASS] {0} {1}" -f $name, $detail) -ForegroundColor Green; $script:ok++ }
  else       { Write-Host ("  [FAIL] {0} {1}" -f $name, $detail) -ForegroundColor Red;   $script:fail++ }
}
function Note($name, $detail = '') { Write-Host ("  [WARN] {0} {1}" -f $name, $detail) -ForegroundColor Yellow; $script:warn++ }

Write-Host "`n=== 1. 文件完整性 ===" -ForegroundColor Cyan
$files = @(
  'plugins\dsh-permissions\plugin.json',
  'plugins\dsh-permissions\tier.json',
  'plugins\dsh-permissions\hooks.json',
  'plugins\dsh-permissions\lexicon.json',
  'plugins\dsh-permissions\englock.json',
  'plugins\dsh-permissions\scripts\gate.py',
  'plugins\dsh-permissions\scripts\englock.py',
  'plugins\dsh-permissions\scripts\run-gate.cmd',
  'plugins\dsh-permissions\scripts\englock.cmd',
  'plugins\dsh-permissions\rules\AGENTS.md',
  'skills\DSHA\SKILL.md',
  'skills\DSHA\reference.md',
  'skills\DSHA\widget.html',
  'skills\DSHA\engineering-lock.md',
  'skills\DSHA\language-norm.md',
  'agy-tier.ps1'
)
foreach ($f in $files) { Check $f (Test-Path (Join-Path $cfg $f)) }

Write-Host "`n=== 2. Python 与钩子包装器 ===" -ForegroundColor Cyan
$rg = Join-Path $cfg 'plugins\dsh-permissions\scripts\run-gate.cmd'
if (Test-Path $rg) {
  $line = (Get-Content $rg | Where-Object { $_ -match '\.exe' } | Select-Object -First 1)
  $py = if ($line -match '^"([^"]+)"') { $matches[1] } else { $null }
  Check "run-gate.cmd 指向的解释器存在" ($py -and (Test-Path $py)) $py
  Check "run-gate.cmd 保持纯 ASCII" (((Get-Content $rg -Raw) -notmatch '[^\x00-\x7F]'))
}
$eg = Join-Path $cfg 'plugins\dsh-permissions\scripts\englock.cmd'
if (Test-Path $eg) { Check "englock.cmd 保持纯 ASCII" (((Get-Content $eg -Raw) -notmatch '[^\x00-\x7F]')) }

Write-Host "`n=== 3. 提示词注入文件必须纯 ASCII ===" -ForegroundColor Cyan
$agents = Join-Path $cfg 'plugins\dsh-permissions\rules\AGENTS.md'
if (Test-Path $agents) {
  $b = [System.IO.File]::ReadAllBytes($agents)
  $bad = ($b | Where-Object { $_ -gt 127 }).Count
  Check "AGENTS.md 非 ASCII 字节数 = 0" ($bad -eq 0) "（$($b.Length) 字节 / 非 ASCII $bad）"
  $t = Get-Content $agents -Raw
  Check "含 L1-L8 工程锁章节" ($t -match 'Engineering Lock \(L1-L8\)')
  Check "含 L9 语言规范锁章节" ($t -match 'Language Norm Lock \(L9\)')
}

Write-Host "`n=== 4. JSON 配置可解析 ===" -ForegroundColor Cyan
foreach ($j in @('plugins\dsh-permissions\plugin.json','plugins\dsh-permissions\tier.json',
                 'plugins\dsh-permissions\hooks.json','plugins\dsh-permissions\lexicon.json',
                 'plugins\dsh-permissions\englock.json')) {
  $p = Join-Path $cfg $j
  if (Test-Path $p) {
    try { $null = Get-Content $p -Raw -Encoding utf8 | ConvertFrom-Json; Check $j $true }
    catch { Check $j $false $_.Exception.Message }
  }
}

Write-Host "`n=== 5. 两个校验器自检 ===" -ForegroundColor Cyan
$pyExe = if ($py -and (Test-Path $py)) { $py } else { 'python' }
$gateSelf = Join-Path $cfg 'plugins\dsh-permissions\scripts\selftest.py'
$eng  = Join-Path $cfg 'plugins\dsh-permissions\scripts\englock.py'
if (Test-Path $gateSelf) {
  $g = & $pyExe $gateSelf 2>$null | Select-String -Pattern 'pass=' | Select-Object -Last 1
  Check "权限档位 selftest 无失败" ($g -and $g.Line -match 'fail=0') $g.Line
} else { Check "找到 selftest.py" $false }
if (Test-Path $eng) {
  $e = & $pyExe $eng selftest | Select-String -Pattern 'selftest:' | Select-Object -Last 1
  # 通用判定：解析 "selftest: N/M"，要求 N == M（用例数会随版本增长，不写死）
  $allPass = $false
  if ($e -and $e.Line -match 'selftest:\s*(\d+)\s*/\s*(\d+)') { $allPass = ($matches[1] -eq $matches[2]) }
  Check "englock.py selftest 全通过" $allPass $e.Line
}

Write-Host "`n=== 6. 钩子状态 ===" -ForegroundColor Cyan
$hooks = Join-Path $cfg 'plugins\dsh-permissions\hooks.json'
if (Test-Path $hooks) {
  $h = Get-Content $hooks -Raw -Encoding utf8 | ConvertFrom-Json
  $enabled = $h.'dsh-permissions'.enabled
  $n = $h.'dsh-permissions'.PreToolUse.Count
  if ($enabled) { Note "钩子已启用" "（PreToolUse 行数 $n）" } else { Note "钩子处于关闭状态" "（符合默认策略；需要机械校验时加 -EnableHook）" }
}

Write-Host "`n=== 7. 工程锁模式 ===" -ForegroundColor Cyan
$conf = Join-Path $cfg 'plugins\dsh-permissions\englock.json'
if (Test-Path $conf) {
  $m = (Get-Content $conf -Raw -Encoding utf8 | ConvertFrom-Json).mode
  Note "englock mode = $m" $(if ($m -eq 'strict') { '（L5/L6/L9.1 会直接拒绝）' } else { '（只提醒不拦截）' })
}

Write-Host "`n=== 8. REA 工具与防咬人 Shell ===" -ForegroundColor Cyan
$safeSh = Join-Path $cfg 'dsha-sh.cmd'
if (-not (Test-Path $safeSh)) { $safeSh = "c:\Users\admin\Desktop\GOOGLE\DSHA\bin\dsha-sh.cmd" }
Check "dsha-sh.cmd 防咬人 Shell 就位" (Test-Path $safeSh)

$reaCmd = Join-Path $cfg 'rea.cmd'
if (-not (Test-Path $reaCmd)) { $reaCmd = "c:\Users\admin\Desktop\GOOGLE\DSHA\bin\rea.cmd" }
if (Test-Path $reaCmd) {
  $reaSelf = & $reaCmd --self-test
  $reaPass = ($LASTEXITCODE -eq 0 -and ($reaSelf | Out-String) -match 'v\d+\.\d+')
  Check "rea.cmd 运行时与自检通过" $reaPass
} else {
  Check "找到 rea.cmd" $false
}

Write-Host "`n=== 9. DSHA Dedicated Pwsh (PowerShell 7) Runtime ===" -ForegroundColor Cyan
$pwshExe = Join-Path $cfg 'pwsh\pwsh.exe'
if (-not (Test-Path $pwshExe)) { $pwshExe = "c:\Users\admin\Desktop\GOOGLE\DSHA\bin\pwsh\pwsh.exe" }
Check "pwsh.exe runtime present" (Test-Path $pwshExe) $pwshExe

$pwshCmd = Join-Path $cfg 'pwsh.cmd'
if (-not (Test-Path $pwshCmd)) { $pwshCmd = "c:\Users\admin\Desktop\GOOGLE\DSHA\bin\pwsh.cmd" }
Check "pwsh.cmd launcher present" (Test-Path $pwshCmd)
if (Test-Path $pwshCmd) { Check "pwsh.cmd is pure ASCII" (((Get-Content $pwshCmd -Raw) -notmatch '[^\x00-\x7F]')) }

$dshaPwshCmd = Join-Path $cfg 'dsha-pwsh.cmd'
if (-not (Test-Path $dshaPwshCmd)) { $dshaPwshCmd = "c:\Users\admin\Desktop\GOOGLE\DSHA\bin\dsha-pwsh.cmd" }
Check "dsha-pwsh.cmd hardened launcher present" (Test-Path $dshaPwshCmd)
if (Test-Path $dshaPwshCmd) { Check "dsha-pwsh.cmd is pure ASCII" (((Get-Content $dshaPwshCmd -Raw) -notmatch '[^\x00-\x7F]')) }

if (Test-Path $pwshExe) {
  $verOut = & $pwshExe -NoProfile -Command '$PSVersionTable.PSVersion.ToString()' 2>$null
  Check "pwsh.exe major version is 7 (PowerShell 7.x)" ($verOut -and $verOut.StartsWith('7.')) "($verOut)"
}

if (Test-Path $dshaPwshCmd) {
  $pipeOut = & $dshaPwshCmd -Command '@(1..3) | Measure-Object | Select-Object -ExpandProperty Count' 2>$null
  Check "dsha-pwsh pipeline and parentheses command executes successfully" ($pipeOut -and $pipeOut.Trim() -eq '3') "Count=$pipeOut"
}

$uPath = [Environment]::GetEnvironmentVariable("Path", "User")
Check "User PATH prioritizes DSHA dedicated tools and pwsh" ($uPath -match 'dsh|\.gemini\\config|DSHA\\bin')

Write-Host "`n=== 10. DSHA 书记官 (The Scribe) 智能体与工具 ===" -ForegroundColor Cyan
$scribeCmd = Join-Path $cfg 'scribe.cmd'
if (-not (Test-Path $scribeCmd)) { $scribeCmd = "c:\Users\admin\Desktop\GOOGLE\DSHA\bin\scribe.cmd" }
Check "scribe.cmd launcher present" (Test-Path $scribeCmd)
if (Test-Path $scribeCmd) { Check "scribe.cmd is pure ASCII" (((Get-Content $scribeCmd -Raw) -notmatch '[^\x00-\x7F]')) }

$scribePy = Join-Path $cfg 'plugins\dsh-permissions\scripts\scribe.py'
if (-not (Test-Path $scribePy)) { $scribePy = "c:\Users\admin\Desktop\GOOGLE\DSHA\scripts\scribe.py" }
Check "scribe.py script present" (Test-Path $scribePy)
if (Test-Path $scribePy) {
  $sSelf = & $pyExe $scribePy selftest | Select-String -Pattern 'selftest:' | Select-Object -Last 1
  $sPass = $false
  if ($sSelf -and $sSelf.Line -match 'selftest:\s*(\d+)\s*/\s*(\d+)') { $sPass = ($matches[1] -eq $matches[2]) }
  Check "scribe.py selftest 全通过" $sPass $sSelf.Line
}

Write-Host "`n=== 11. Cloudflare 直通引擎与智能路由层 (DHSA-TestWeb) ===" -ForegroundColor Cyan
$cfCmd = Join-Path $cfg 'cf.cmd'
if (-not (Test-Path $cfCmd)) { $cfCmd = "c:\Users\admin\Desktop\GOOGLE\DSHA\bin\cf.cmd" }
Check "cf.cmd launcher present" (Test-Path $cfCmd)
if (Test-Path $cfCmd) { Check "cf.cmd is pure ASCII" (((Get-Content $cfCmd -Raw) -notmatch '[^\x00-\x7F]')) }

$cfPy = Join-Path $cfg 'plugins\dsh-permissions\scripts\dsha_cf.py'
if (-not (Test-Path $cfPy)) { $cfPy = "c:\Users\admin\Desktop\GOOGLE\DSHA\scripts\dsha_cf.py" }
Check "dsha_cf.py script present" (Test-Path $cfPy)
if (Test-Path $cfPy) {
  $cfSelf = & $pyExe $cfPy selftest | Select-String -Pattern 'selftest:' | Select-Object -Last 1
  $cfPass = $false
  if ($cfSelf -and $cfSelf.Line -match 'selftest:\s*(\d+)\s*/\s*(\d+)') { $cfPass = ($matches[1] -eq $matches[2]) }
  Check "dsha_cf.py selftest 全通过" $cfPass $cfSelf.Line
}

$dshaCmd = Join-Path $cfg 'dsha.cmd'
if (-not (Test-Path $dshaCmd)) { $dshaCmd = "c:\Users\admin\Desktop\GOOGLE\DSHA\bin\dsha.cmd" }
Check "dsha.cmd router launcher present" (Test-Path $dshaCmd)
if (Test-Path $dshaCmd) { Check "dsha.cmd is pure ASCII" (((Get-Content $dshaCmd -Raw) -notmatch '[^\x00-\x7F]')) }

$routerPy = Join-Path $cfg 'plugins\dsh-permissions\scripts\router.py'
if (-not (Test-Path $routerPy)) { $routerPy = "c:\Users\admin\Desktop\GOOGLE\DSHA\scripts\router.py" }
Check "router.py script present" (Test-Path $routerPy)
if (Test-Path $routerPy) {
  $rSelf = & $pyExe $routerPy selftest | Select-String -Pattern 'selftest:' | Select-Object -Last 1
  $rPass = $false
  if ($rSelf -and $rSelf.Line -match 'selftest:\s*(\d+)\s*/\s*(\d+)') { $rPass = ($matches[1] -eq $matches[2]) }
  Check "router.py selftest 全通过" $rPass $rSelf.Line
}

Write-Host "`n=== 12. DSHA-Index 顶层目录与 Call_Tools 统合拉取协议 (v1.0.0) ===" -ForegroundColor Cyan
$indexCmd = Join-Path $cfg 'dsha-index.cmd'
if (-not (Test-Path $indexCmd)) { $indexCmd = "c:\Users\admin\Desktop\GOOGLE\DSHA\bin\dsha-index.cmd" }
Check "dsha-index.cmd launcher present" (Test-Path $indexCmd)
if (Test-Path $indexCmd) { Check "dsha-index.cmd is pure ASCII" (((Get-Content $indexCmd -Raw) -notmatch '[^\x00-\x7F]')) }

$indexPy = Join-Path $cfg 'plugins\dsh-permissions\scripts\index.py'
if (-not (Test-Path $indexPy)) { $indexPy = "c:\Users\admin\Desktop\GOOGLE\DSHA\scripts\index.py" }
Check "index.py script present" (Test-Path $indexPy)
if (Test-Path $indexPy) {
  $iSelf = & $pyExe $indexPy selftest | Select-String -Pattern 'selftest:' | Select-Object -Last 1
  $iPass = $false
  if ($iSelf -and $iSelf.Line -match 'selftest:\s*(\d+)\s*/\s*(\d+)') { $iPass = ($matches[1] -eq $matches[2]) }
  Check "index.py Call_Tools selftest 全通过" $iPass $iSelf.Line
}

Write-Host "`n=== 13. DSHA 类基工具架构与 ErrBlock 宿主环境断言 (BaseTool & Anti-Privilege) ===" -ForegroundColor Cyan
$baseToolPy = Join-Path $cfg 'plugins\dsh-permissions\scripts\base_tool.py'
if (-not (Test-Path $baseToolPy)) { $baseToolPy = "c:\Users\admin\Desktop\GOOGLE\DSHA\scripts\base_tool.py" }
Check "base_tool.py script present" (Test-Path $baseToolPy)
if (Test-Path $baseToolPy) {
  $btSelf = & $pyExe $baseToolPy selftest | Select-String -Pattern 'selftest:' | Select-Object -Last 1
  $btPass = $false
  if ($btSelf -and $btSelf.Line -match 'selftest:\s*(\d+)\s*/\s*(\d+)') { $btPass = ($matches[1] -eq $matches[2]) }
  Check "base_tool.py 类目检索与越权/环境拦截 selftest 全通过" $btPass $btSelf.Line
}

$checkOut = & $pyExe $indexPy check 2>$null
Check "dsha-index check 7大工具宿主环境断言全部满足" ($LASTEXITCODE -eq 0 -and ($checkOut | Select-String -Pattern '\[PASS\]').Count -eq 7)

$catOut = & $pyExe $indexPy list -c WebEdge 2>$null
Check "dsha-index list -c WebEdge 按类目精确取用成功" ($catOut -match 'cf\s+\|\s+WebEdge')

Write-Host "`n--------------------------------------------------"
Write-Host ("PASS {0} / FAIL {1} / WARN {2}" -f $ok, $fail, $warn) -ForegroundColor $(if ($fail -eq 0) { 'Green' } else { 'Red' })
if ($fail -eq 0) { Write-Host "DSHA 体检通过。" -ForegroundColor Green } else { Write-Host "存在失败项，请按上方 [FAIL] 逐条处理。" -ForegroundColor Red }
exit $(if ($fail -eq 0) { 0 } else { 1 })

