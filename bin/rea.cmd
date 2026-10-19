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
if "%PY%"=="" if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" set "PY=%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
if "%PY%"=="" if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" set "PY=%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
if "%PY%"=="" if exist "%LOCALAPPDATA%\Programs\Python\Python310\python.exe" set "PY=%LOCALAPPDATA%\Programs\Python\Python310\python.exe"
if "%PY%"=="" if exist "%SystemRoot%\py.exe" set "PY=%SystemRoot%\py.exe"
if "%PY%"=="" for %%P in (python.exe) do if not "%%~$PATH:P"=="" call :RESOLVE_PY "%%~$PATH:P"
if "%PY%"=="" set "PY=python"
goto :RUN_REA

:RESOLVE_PY
if "%~1"=="" exit /b
echo %~1 | findstr /i /c:"WindowsApps" >nul
if errorlevel 1 if "%PY%"=="" set "PY=%~1"
exit /b

:RUN_REA
"%PY%" "%DRIVER%" %*
exit /b %ERRORLEVEL%
