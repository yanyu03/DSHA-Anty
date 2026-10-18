@echo off
rem DSHA Sh Launcher - Zero Parenthesis Blocks
if not exist "C:\Program Files\Git\bin\sh.exe" goto :FALLBACK
"C:\Program Files\Git\bin\sh.exe" %*
exit /b %ERRORLEVEL%

:FALLBACK
sh.exe %*
exit /b %ERRORLEVEL%
