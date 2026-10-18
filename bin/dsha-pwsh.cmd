@echo off
rem =========================================================================
rem DSHA Hardened Pwsh Launcher - Pure ASCII - Zero Parenthesis Blocks
rem Runs commands in PowerShell 7 with -NoProfile and ExecutionPolicy Bypass
rem =========================================================================
chcp 65001 >nul 2>nul

if exist "%~dp0pwsh\pwsh.exe" goto :RUN_LOCAL
if exist "%USERPROFILE%\.gemini\config\pwsh\pwsh.exe" goto :RUN_GLOBAL
goto :RUN_FALLBACK

:RUN_LOCAL
"%~dp0pwsh\pwsh.exe" -NoProfile -ExecutionPolicy Bypass %*
exit /b %ERRORLEVEL%

:RUN_GLOBAL
"%USERPROFILE%\.gemini\config\pwsh\pwsh.exe" -NoProfile -ExecutionPolicy Bypass %*
exit /b %ERRORLEVEL%

:RUN_FALLBACK
call "%~dp0pwsh.cmd" -NoProfile -ExecutionPolicy Bypass %*
exit /b %ERRORLEVEL%
