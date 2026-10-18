@echo off
rem DSHA-Meter background runner. Portable & non-blocking.
set "PYW="
if exist "%LOCALAPPDATA%\Programs\Python\Python312\pythonw.exe" set "PYW=%LOCALAPPDATA%\Programs\Python\Python312\pythonw.exe"
if "%PYW%"=="" if exist "C:\python312\pythonw.exe" set "PYW=C:\python312\pythonw.exe"
if "%PYW%"=="" set "PYW=pythonw.exe"
start "" "%PYW%" "%~dp0meter.py"
exit /b 0
