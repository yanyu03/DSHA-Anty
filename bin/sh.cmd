@echo off
rem DSHA Sh Launcher - Zero Parenthesis Blocks
set "SH_EXE="
if exist "%ProgramFiles%\Git\bin\sh.exe" set "SH_EXE=%ProgramFiles%\Git\bin\sh.exe"
if "%SH_EXE%"=="" if exist "%ProgramFiles(x86)%\Git\bin\sh.exe" set "SH_EXE=%ProgramFiles(x86)%\Git\bin\sh.exe"
if "%SH_EXE%"=="" if exist "%LOCALAPPDATA%\Programs\Git\bin\sh.exe" set "SH_EXE=%LOCALAPPDATA%\Programs\Git\bin\sh.exe"
if "%SH_EXE%"=="" for %%B in (sh.exe) do if not "%%~$PATH:B"=="" set "SH_EXE=%%~$PATH:B"

if "%SH_EXE%"=="" goto :FALLBACK
"%SH_EXE%" %*
exit /b %ERRORLEVEL%

:FALLBACK
sh.exe %*
exit /b %ERRORLEVEL%
