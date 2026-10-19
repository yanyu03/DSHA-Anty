@echo off
setlocal
call "%~dp0dsha-env.cmd" python
if errorlevel 1 exit /b 126
if defined DSHA_REA_DRIVER goto :DRIVER_READY
if not defined DSHA_REA_DRIVER set "DSHA_REA_DRIVER=%~dp0..\skills\reverse-engineer-anything\tools\rea\dsha_rea_driver.py"
if not exist "%DSHA_REA_DRIVER%" set "DSHA_REA_DRIVER=%DSHA_CONFIG_DIR%\skills\reverse-engineer-anything\tools\rea\dsha_rea_driver.py"
:DRIVER_READY
if not exist "%DSHA_REA_DRIVER%" exit /b 126
set "PYTHONUTF8=1"
"%DSHA_PYTHON%" "%DSHA_REA_DRIVER%" %*
exit /b %ERRORLEVEL%
