@echo off
rem DSHA Bash Launcher - Zero Parenthesis Blocks
if not exist "C:\Program Files\Git\bin\bash.exe" goto :FALLBACK
"C:\Program Files\Git\bin\bash.exe" %*
exit /b %ERRORLEVEL%

:FALLBACK
bash.exe %*
exit /b %ERRORLEVEL%
