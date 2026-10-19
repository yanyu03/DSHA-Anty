@echo off
rem DSHA Safe Shell - Pure ASCII - Zero Parenthesis Blocks
chcp 65001 >nul 2>nul
set "BASH_EXE="
if exist "%ProgramFiles%\Git\bin\bash.exe" set "BASH_EXE=%ProgramFiles%\Git\bin\bash.exe"
if "%BASH_EXE%"=="" if exist "%ProgramFiles(x86)%\Git\bin\bash.exe" set "BASH_EXE=%ProgramFiles(x86)%\Git\bin\bash.exe"
if "%BASH_EXE%"=="" if exist "%LOCALAPPDATA%\Programs\Git\bin\bash.exe" set "BASH_EXE=%LOCALAPPDATA%\Programs\Git\bin\bash.exe"
if "%BASH_EXE%"=="" for %%B in (bash.exe) do if not "%%~$PATH:B"=="" set "BASH_EXE=%%~$PATH:B"

if "%BASH_EXE%"=="" goto :FALLBACK
"%BASH_EXE%" -c %*
exit /b %ERRORLEVEL%

:FALLBACK
cmd.exe /c %*
exit /b %ERRORLEVEL%
