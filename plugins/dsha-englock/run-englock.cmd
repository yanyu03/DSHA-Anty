@echo off
rem DSHA Engineering Lock (independent plugin). ASCII only, fail-open, always exit 0.
python "%~dp0..\dsh-permissions\scripts\englock.py" 2>nul
exit /b 0
