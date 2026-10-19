@echo off
rem =========================================================================
rem DSHA-Index Master Capability Catalog Launcher - Pure ASCII
rem Dispatches to scripts\index.py with UTF-8 encoding enabled
rem =========================================================================
setlocal
chcp 65001 >nul 2>nul
set "PYTHONUTF8=1"

set "INDEX_PY="
if exist "%~dp0..\scripts\index.py" set "INDEX_PY=%~dp0..\scripts\index.py"
if "%INDEX_PY%"=="" if exist "%USERPROFILE%\.gemini\config\plugins\dsh-permissions\scripts\index.py" set "INDEX_PY=%USERPROFILE%\.gemini\config\plugins\dsh-permissions\scripts\index.py"

if not "%INDEX_PY%"=="" goto :HAVE_INDEX
echo [DSHA-INDEX] Error: index.py not found. 1>&2
exit /b 1

:HAVE_INDEX
set "PY="
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" set "PY=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
if "%PY%"=="" for %%P in (python.exe) do if not "%%~$PATH:P"=="" set "PY=%%~$PATH:P"
if "%PY%"=="" set "PY=python"

"%PY%" "%INDEX_PY%" %*
exit /b %ERRORLEVEL%
