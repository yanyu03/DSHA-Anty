@echo off
rem DSHA-REA Local Tool Launcher - TeacherYang Mindset
setlocal
set "PY="
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" set "PY=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
if "%PY%"=="" if exist "C:\python312\python.exe" set "PY=C:\python312\python.exe"
if "%PY%"=="" set "PY=python"
"%PY%" "%~dp0dsha_rea_driver.py" %*
exit /b %ERRORLEVEL%
