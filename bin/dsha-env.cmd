@echo off
rem Shared runtime resolver. An explicit invalid override fails closed.
if not defined DSHA_CONFIG_DIR set "DSHA_CONFIG_DIR=%USERPROFILE%\.gemini\config"
if /i "%~1"=="python" goto :PYTHON
if /i "%~1"=="pwsh" goto :PWSH
if /i "%~1"=="bash" goto :BASH
if /i "%~1"=="sh" goto :SH
exit /b 126
:PYTHON
if defined DSHA_PYTHON goto :CHECK_PYTHON
for /f "delims=" %%I in ('where.exe python.exe 2^>nul') do if not defined DSHA_PYTHON set "DSHA_PYTHON=%%I"
:CHECK_PYTHON
if not defined DSHA_PYTHON goto :MISSING
if not exist "%DSHA_PYTHON%" goto :MISSING
echo "%DSHA_PYTHON%" | findstr /i /c:"WindowsApps" >nul
if not errorlevel 1 goto :MISSING
exit /b 0
:PWSH
if defined DSHA_PWSH goto :CHECK_PWSH
if exist "%~dp0pwsh\pwsh.exe" set "DSHA_PWSH=%~dp0pwsh\pwsh.exe"
if not defined DSHA_PWSH if exist "%DSHA_CONFIG_DIR%\pwsh\pwsh.exe" set "DSHA_PWSH=%DSHA_CONFIG_DIR%\pwsh\pwsh.exe"
if not defined DSHA_PWSH if exist "%ProgramFiles%\PowerShell\7\pwsh.exe" set "DSHA_PWSH=%ProgramFiles%\PowerShell\7\pwsh.exe"
:CHECK_PWSH
if not defined DSHA_PWSH goto :MISSING
if not exist "%DSHA_PWSH%" goto :MISSING
exit /b 0
:BASH
if defined DSHA_BASH goto :CHECK_BASH
if exist "%ProgramFiles%\Git\bin\bash.exe" set "DSHA_BASH=%ProgramFiles%\Git\bin\bash.exe"
:CHECK_BASH
if not defined DSHA_BASH goto :MISSING
if not exist "%DSHA_BASH%" goto :MISSING
exit /b 0
:SH
if defined DSHA_SH goto :CHECK_SH
if exist "%ProgramFiles%\Git\bin\sh.exe" set "DSHA_SH=%ProgramFiles%\Git\bin\sh.exe"
:CHECK_SH
if not defined DSHA_SH goto :MISSING
if not exist "%DSHA_SH%" goto :MISSING
exit /b 0
:MISSING
echo [DSHA] Runtime missing or invalid. Set DSHA_PYTHON, DSHA_PWSH, DSHA_BASH or DSHA_SH. 1>&2
exit /b 126
