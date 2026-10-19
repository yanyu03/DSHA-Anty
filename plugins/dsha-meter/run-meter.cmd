@echo off
setlocal
if not defined DSHA_PYTHON set "DSHA_PYTHON=python.exe"
set "PYTHONUTF8=1"
"%DSHA_PYTHON%" "%~dp0meter.py" %*
exit /b %ERRORLEVEL%
