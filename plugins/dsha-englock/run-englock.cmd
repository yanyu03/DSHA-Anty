@echo off
rem DSHA Engineering Lock (independent plugin). ASCII only, fail-open, always exit 0.
"C:\python312\python.exe" "C:\Users\Administrator\.gemini\config\plugins\dsh-permissions\scripts\englock.py" 2>nul
exit /b 0
