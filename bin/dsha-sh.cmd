@echo off
rem DSHA Safe Shell - Pure ASCII - Zero Parenthesis Blocks
chcp 65001 >nul 2>nul
if not exist "C:\Program Files\Git\bin\bash.exe" goto :FALLBACK
"C:\Program Files\Git\bin\bash.exe" -c %*
exit /b %ERRORLEVEL%

:FALLBACK
cmd.exe /c %*
exit /b %ERRORLEVEL%
