@echo off
rem =========================================================================
rem DSHA Dedicated Pwsh Launcher - Pure ASCII - Zero Parenthesis Blocks
rem Dispatches directly to DSHA bundled PowerShell 7 (pwsh.exe)
rem =========================================================================
chcp 65001 >nul 2>nul

if exist "%~dp0pwsh\pwsh.exe" goto :RUN_LOCAL
if exist "%USERPROFILE%\.gemini\config\pwsh\pwsh.exe" goto :RUN_GLOBAL
goto :RUN_PATH

:RUN_LOCAL
"%~dp0pwsh\pwsh.exe" %*
exit /b %ERRORLEVEL%

:RUN_GLOBAL
"%USERPROFILE%\.gemini\config\pwsh\pwsh.exe" %*
exit /b %ERRORLEVEL%

:RUN_PATH
where.exe pwsh.exe >nul 2>nul
if %ERRORLEVEL% neq 0 goto :NOT_FOUND
pwsh.exe %*
exit /b %ERRORLEVEL%

:NOT_FOUND
echo [DSHA FATAL] DSHA dedicated pwsh.exe not found in %~dp0pwsh or global config. 1>&2
echo Run scripts\fetch-pwsh.ps1 or install.ps1 to bootstrap the runtime. 1>&2
exit /b 1
