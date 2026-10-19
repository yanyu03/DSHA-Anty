@echo off
rem =========================================================================
rem DSHA Cloudflare Tool Launcher - Pure ASCII - Zero Parenthesis Blocks
rem Dispatches to scripts\dsha_cf.py with UTF-8 encoding enabled
rem =========================================================================
setlocal
chcp 65001 >nul 2>nul
set "PYTHONUTF8=1"

set "CF_PY="
if exist "%~dp0..\scripts\dsha_cf.py" set "CF_PY=%~dp0..\scripts\dsha_cf.py"
if "%CF_PY%"=="" if exist "%~dp0..\plugins\dsh-permissions\scripts\dsha_cf.py" set "CF_PY=%~dp0..\plugins\dsh-permissions\scripts\dsha_cf.py"
if "%CF_PY%"=="" if exist "%USERPROFILE%\.gemini\config\plugins\dsh-permissions\scripts\dsha_cf.py" set "CF_PY=%USERPROFILE%\.gemini\config\plugins\dsh-permissions\scripts\dsha_cf.py"

if not "%CF_PY%"=="" goto :HAVE_CF
echo [DSHA-CF] Error: dsha_cf.py not found. 1>&2
exit /b 1

:HAVE_CF
set "PY="
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" set "PY=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
if "%PY%"=="" if exist "C:\python312\python.exe" set "PY=C:\python312\python.exe"
if "%PY%"=="" set "PY=python"

"%PY%" "%CF_PY%" %*
exit /b %ERRORLEVEL%
