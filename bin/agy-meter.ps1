# DSHA-Meter 控制脚本 (带动态环境解析 · 隐私安全 · 幂等控制)
param(
    [switch]$Start,
    [switch]$Stop,
    [switch]$Restart,
    [switch]$Status
)

$cfg = Join-Path $env:USERPROFILE '.gemini\config'
$meterDir = Join-Path $cfg 'plugins\dsha-meter'
$meterPy = Join-Path $meterDir 'meter.py'

# 动态解析 Python 解释器 (优先检测系统已安装环境)
$py = $null
foreach ($cand in @(
    (Join-Path $env:LOCALAPPDATA 'Programs\Python\Python312\python.exe'),
    'C:\python312\python.exe',
    (Get-Command python.exe -ErrorAction SilentlyContinue).Source
)) {
    if ($cand -and (Test-Path $cand)) { $py = $cand; break }
}
if (-not $py) { $py = 'python.exe' }

$pyw = $null
if (Test-Path $py) {
    $candW = Join-Path (Split-Path $py) 'pythonw.exe'
    if (Test-Path $candW) { $pyw = $candW }
}
if (-not $pyw) { $pyw = 'pythonw.exe' }

function Get-MeterProcess {
    Get-CimInstance Win32_Process | Where-Object { 
        $_.CommandLine -like "*meter.py*" -and $_.ProcessId -ne $PID
    }
}

if ($Stop -or $Restart) {
    $procs = Get-MeterProcess
    if ($procs) {
        $procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
        Write-Host "[DSHA-Meter] 已停止悬浮窗进程。" -ForegroundColor Yellow
    } else {
        Write-Host "[DSHA-Meter] 当前没有正在运行的悬浮窗进程。" -ForegroundColor Gray
    }
    if ($Stop) { exit 0 }
}

if ($Start -or $Restart) {
    $procs = Get-MeterProcess
    if ($procs -and -not $Restart) {
        Write-Host "[DSHA-Meter] 悬浮窗已在运行中 (PID: $(($procs | Select-Object -First 1).ProcessId))。" -ForegroundColor Green
        exit 0
    }
    if (-not (Test-Path $meterPy)) {
        Write-Host "[DSHA-Meter] 错误: 找不到 meter.py ($meterPy)。请先运行 install.ps1 安装。" -ForegroundColor Red
        exit 1
    }
    $res = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
        CommandLine = "`"$pyw`" `"$meterPy`""
        CurrentDirectory = $meterDir
    }
    if ($res.ReturnValue -eq 0) {
        Write-Host "[DSHA-Meter] 悬浮窗已成功在前台启动 (PID: $($res.ProcessId))！" -ForegroundColor Green
    } else {
        Write-Host "[DSHA-Meter] 启动失败，错误码：$($res.ReturnValue)" -ForegroundColor Red
    }
    exit 0
}

# 默认状态检查
$procs = Get-MeterProcess
if ($procs) {
    Write-Host "[DSHA-Meter] 悬浮窗运行中 (PID: $(($procs | Select-Object -First 1).ProcessId))" -ForegroundColor Green
} else {
    Write-Host "[DSHA-Meter] 悬浮窗未运行" -ForegroundColor Gray
}

# 打印当前 5H / 7D / Context 遥测数值
Write-Host "`n--- 当前实时动态刷新额度遥测 ---" -ForegroundColor Cyan
if (Test-Path $meterPy) {
    & $py -c "import sys; sys.path.append(r'$meterDir'); from meter import get_telemetry, fmt_tokens, fmt_countdown; st = get_telemetry(); print('  当前模型: ' + str(st['latest_model'])); print('  单轮上下文: 已用 ' + fmt_tokens(st['current_context_tokens']) + ' / 总额 1.0M (' + str(round(st['current_context_tokens']/10000, 1)) + '%) | 剩余: ' + fmt_tokens(max(0, 1000000 - st['current_context_tokens'])) + ' (/compact 可即时重置)'); print('  5H 滚动配额: 已用 ' + fmt_tokens(st['5h_tokens']) + ' / 总额 1.0M (' + str(round(st['5h_tokens']/10000, 1)) + '%) | 请求: ' + str(st['5h_requests']) + ' / 200次'); print('    [5H 下次回血倒计时]: ' + fmt_countdown(st['5h_next_recover_seconds']) + ' (将释放 +' + fmt_tokens(st['5h_next_recover_tokens']) + ' tokens)'); print('    [5H 完全回满倒计时]: ' + fmt_countdown(st['5h_full_recover_seconds'])); print('  7D 周度总配额: 已用 ' + fmt_tokens(st['7d_tokens']) + ' / 总额 10.0M (' + str(round(st['7d_tokens']/100000, 1)) + '%) | 缓存: ' + fmt_tokens(st['7d_cached_tokens']) + ' tok'); print('    [7D 周额度刷新倒计时]: ' + fmt_countdown(st['7d_next_recover_seconds']) + ' (首笔回血释放)'); print('  末轮输出: ' + str(st['last_step_output_tokens']) + ' tok | 活跃会话: ' + str(st['active_cid']))"
} else {
    Write-Host "[DSHA-Meter] 未检测到插件安装，请运行 install.ps1。" -ForegroundColor Yellow
}
