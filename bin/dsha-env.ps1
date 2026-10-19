function Get-DshaConfigDir([string]$Value) {
    if ($Value) { return $Value }
    if ($env:DSHA_CONFIG_DIR) { return $env:DSHA_CONFIG_DIR }
    return Join-Path $HOME '.gemini/config'
}
function Get-DshaPython([string]$Value) {
    if (-not $Value) { $Value = $env:DSHA_PYTHON }
    if ($Value) {
        if (-not (Test-Path -LiteralPath $Value -PathType Leaf)) { throw 'Invalid DSHA_PYTHON; configuration value omitted' }
        return $Value
    }
    $candidate = Get-Command python.exe -ErrorAction SilentlyContinue
    if ($candidate -and $candidate.Source -notmatch 'WindowsApps') { return $candidate.Source }
    throw 'Python unavailable; set DSHA_PYTHON'
}
