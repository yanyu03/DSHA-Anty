@echo off
setlocal
call "%~dp0dsha-env.cmd" bash
if errorlevel 1 exit /b 126
"%DSHA_BASH%" -c %*
exit /b %ERRORLEVEL%
