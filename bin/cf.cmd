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
if "%PY%"=="" if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" set "PY=%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
if "%PY%"=="" if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" set "PY=%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
if "%PY%"=="" if exist "%LOCALAPPDATA%\Programs\Python\Python310\python.exe" set "PY=%LOCALAPPDATA%\Programs\Python\Python310\python.exe"
if "%PY%"=="" if exist "%SystemRoot%\py.exe" set "PY=%SystemRoot%\py.exe"
if "%PY%"=="" for %%P in (python.exe) do if not "%%~$PATH:P"=="" call :RESOLVE_PY "%%~$PATH:P"
if "%PY%"=="" set "PY=python"
goto :RUN_CF

:RESOLVE_PY
if "%~1"=="" exit /b
echo %~1 | findstr /i /c:"WindowsApps" >nul
if errorlevel 1 if "%PY%"=="" set "PY=%~1"
exit /b

:RUN_CF
"%PY%" "%CF_PY%" %*
exit /b %ERRORLEVEL%
