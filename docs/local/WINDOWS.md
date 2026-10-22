# Windows adaptation route (Windows-first, not blanket verified)

**Reference host:** Windows 10/11 x64, standard non-administrator user, isolated test directory or disposable VM. DSHA V1.0 was principally validated on Windows x64; that does not certify this exact host.

## Stage 0: passive preflight

In PowerShell, from an authorized source checkout:

```powershell
$PSVersionTable.PSVersion.ToString()
Get-Command python, git, pwsh, node -ErrorAction SilentlyContinue |
  Select-Object Name, Source
git rev-parse HEAD
git status --short
Get-Content .\plugins\dsh-permissions\tier.json
```

The checked-in Gate configuration currently says `danger-full-access` and `auto_reviewer: local`. This **must not** be treated as permission to execute unattended or to deploy. Use explicit human authorization and host sandbox controls before actions that write.

## Stage 1: source-level validation

```powershell
python -m unittest discover -s scripts -p test_kaeru_router_safety.py -v
python scripts\index.py list
python scripts\router.py route "zzzyyyxxx-no-registered-tool" --json
```

A no-match request returns a nonzero exit code intentionally. `install.ps1 -WhatIfOnly` is a distinct installation preflight; review its content before using it. Never invoke `install.ps1` or `verify.ps1` just to get a harmless status.

## Stage 2: Office / WPS discovery (OPTIONAL, no COM activation)

Look for registry registration as **one candidate signal**; absence/presence alone is not proof of installation or working automation.

```powershell
$progIds = @(
  'Word.Application','Excel.Application','PowerPoint.Application',
  'KWPS.Application','KET.Application','KWPP.Application'
)
foreach ($id in $progIds) {
  [pscustomobject]@{
    ProgID = $id
    Registered = Test-Path -LiteralPath ("Registry::HKEY_CLASSES_ROOT\" + $id)
  }
}
```

Do not activate COM, save files, register components or close existing applications during discovery. 32-bit/64-bit registry views and WPS version differences require separate examination.

## Stage 3: Windows native acceptance on a disposable VM

- **Only on explicit user approval**, with known, owned synthetic `.docx/.xlsx/.pptx` files and their recorded SHA256.
- Require a clean desktop session; if the intended application is already running, avoid altering someone else's process.
- Launch via `DispatchEx`/equivalent only after implementation and ownership have been reviewed; use an out-of-process worker with timeouts and reliable cleanup.
- For each of six components, verify activation, non-writing open, a meaningful read operation, close/quit, process ownership/exit, and fixture SHA256 unchanged.
- Record `BLOCKED/NOT_RUN` for absent products, activation errors or missing sandbox requirements. No mock output counts as real native success.
- Do not run macro-enabled inputs, global COM registration repair, Office/WPS updates or cloud sync.

The six-component COM V2 exercises discussed for Hamasaki **are not part of this Kaeru Local reference branch**. See [ACCEPTANCE.md](ACCEPTANCE.md).
