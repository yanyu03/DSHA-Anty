@echo off
rem DSHA-REA Global Tool Launcher - Zero Parenthesis Blocks
setlocal
set "DRIVER="
if exist "%~dp0..\skills\reverse-engineer-anything\tools\rea\dsha_rea_driver.py" set "DRIVER=%~dp0..\skills\reverse-engineer-anything\tools\rea\dsha_rea_driver.py"
if "%DRIVER%"=="" if exist "%USERPROFILE%\.gemini\config\skills\reverse-engineer-anything\tools\rea\dsha_rea_driver.py" set "DRIVER=%USERPROFILE%\.gemini\config\skills\reverse-engineer-anything\tools\rea\dsha_rea_driver.py"

if not "%DRIVER%"=="" goto :HAVE_DRIVER
echo [DSHA-REA] Error: REA driver script not found. 1>&2
exit /b 1

:HAVE_DRIVER
set "PY="
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" set "PY=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
if "%PY%"=="" if exist "C:\python312\python.exe" set "PY=C:\python312\python.exe"
if "%PY%"=="" set "PY=python"

"%PY%" "%DRIVER%" %*
exit /b %ERRORLEVEL%
