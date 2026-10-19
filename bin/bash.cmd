@echo off
rem DSHA Bash Launcher - Zero Parenthesis Blocks
set "BASH_EXE="
if exist "%ProgramFiles%\Git\bin\bash.exe" set "BASH_EXE=%ProgramFiles%\Git\bin\bash.exe"
if "%BASH_EXE%"=="" if exist "%ProgramFiles(x86)%\Git\bin\bash.exe" set "BASH_EXE=%ProgramFiles(x86)%\Git\bin\bash.exe"
if "%BASH_EXE%"=="" if exist "%LOCALAPPDATA%\Programs\Git\bin\bash.exe" set "BASH_EXE=%LOCALAPPDATA%\Programs\Git\bin\bash.exe"
if "%BASH_EXE%"=="" for %%B in (bash.exe) do if not "%%~$PATH:B"=="" set "BASH_EXE=%%~$PATH:B"

if "%BASH_EXE%"=="" goto :FALLBACK
"%BASH_EXE%" %*
exit /b %ERRORLEVEL%

:FALLBACK
bash.exe %*
exit /b %ERRORLEVEL%
