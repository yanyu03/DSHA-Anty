@echo off
setlocal
call "%~dp0dsha-env.cmd" pwsh
if errorlevel 1 exit /b 126
"%DSHA_PWSH%" -NoProfile -ExecutionPolicy Bypass %*
exit /b %ERRORLEVEL%
