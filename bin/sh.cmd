@echo off
setlocal
call "%~dp0dsha-env.cmd" sh
if errorlevel 1 exit /b 126
"%DSHA_SH%" %*
exit /b %ERRORLEVEL%
