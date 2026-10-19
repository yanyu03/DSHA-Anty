@echo off
setlocal
call "%~dp0dsha-env.cmd" python
if errorlevel 1 exit /b 126
if defined DSHA_SCRIPT_DIR goto :SCRIPT_READY
if not defined DSHA_SCRIPT_DIR set "DSHA_SCRIPT_DIR=%~dp0..\scripts"
if not exist "%DSHA_SCRIPT_DIR%\router.py" set "DSHA_SCRIPT_DIR=%DSHA_CONFIG_DIR%\plugins\dsh-permissions\scripts"
:SCRIPT_READY
if not exist "%DSHA_SCRIPT_DIR%\router.py" exit /b 126
set "PYTHONUTF8=1"
"%DSHA_PYTHON%" "%DSHA_SCRIPT_DIR%\router.py" %*
exit /b %ERRORLEVEL%
