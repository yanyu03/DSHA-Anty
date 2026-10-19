@echo off
rem =========================================================================
rem DSHA Master Routing Layer & Dispatcher - Pure ASCII - Zero Parentheses
rem Dispatches to scripts\router.py with UTF-8 encoding enabled
rem =========================================================================
setlocal
chcp 65001 >nul 2>nul
set "PYTHONUTF8=1"

set "ROUTER_PY="
if exist "%~dp0..\scripts\router.py" set "ROUTER_PY=%~dp0..\scripts\router.py"
if "%ROUTER_PY%"=="" if exist "%USERPROFILE%\.gemini\config\plugins\dsh-permissions\scripts\router.py" set "ROUTER_PY=%USERPROFILE%\.gemini\config\plugins\dsh-permissions\scripts\router.py"

if not "%ROUTER_PY%"=="" goto :HAVE_ROUTER
echo [DSHA-ROUTER] Error: router.py not found. 1>&2
exit /b 1

:HAVE_ROUTER
set "PY="
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" set "PY=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
if "%PY%"=="" if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" set "PY=%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
if "%PY%"=="" if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" set "PY=%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
if "%PY%"=="" if exist "%LOCALAPPDATA%\Programs\Python\Python310\python.exe" set "PY=%LOCALAPPDATA%\Programs\Python\Python310\python.exe"
if "%PY%"=="" if exist "%SystemRoot%\py.exe" set "PY=%SystemRoot%\py.exe"
if "%PY%"=="" for %%P in (python.exe) do if not "%%~$PATH:P"=="" call :RESOLVE_PY "%%~$PATH:P"
if "%PY%"=="" set "PY=python"
goto :RUN_ROUTER

:RESOLVE_PY
if "%~1"=="" exit /b
echo %~1 | findstr /i /c:"WindowsApps" >nul
if errorlevel 1 if "%PY%"=="" set "PY=%~1"
exit /b

:RUN_ROUTER
"%PY%" "%ROUTER_PY%" %*
exit /b %ERRORLEVEL%
