@echo off
rem =========================================================================
rem DSHA Scribe Launcher - Pure ASCII - Zero Parenthesis Blocks
rem Dispatches to scripts\scribe.py with UTF-8 encoding enabled
rem =========================================================================
setlocal
chcp 65001 >nul 2>nul
set "PYTHONUTF8=1"

set "SCRIBE_PY="
if exist "%~dp0..\scripts\scribe.py" set "SCRIBE_PY=%~dp0..\scripts\scribe.py"
if "%SCRIBE_PY%"=="" if exist "%~dp0..\plugins\dsh-permissions\scripts\scribe.py" set "SCRIBE_PY=%~dp0..\plugins\dsh-permissions\scripts\scribe.py"
if "%SCRIBE_PY%"=="" if exist "%USERPROFILE%\.gemini\config\plugins\dsh-permissions\scripts\scribe.py" set "SCRIBE_PY=%USERPROFILE%\.gemini\config\plugins\dsh-permissions\scripts\scribe.py"

if not "%SCRIBE_PY%"=="" goto :HAVE_SCRIBE
echo [DSHA-SCRIBE] Error: scribe.py not found. 1>&2
exit /b 1

:HAVE_SCRIBE
set "PY="
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" set "PY=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
if "%PY%"=="" if exist "C:\python312\python.exe" set "PY=C:\python312\python.exe"
if "%PY%"=="" set "PY=python"

"%PY%" "%SCRIBE_PY%" %*
exit /b %ERRORLEVEL%
