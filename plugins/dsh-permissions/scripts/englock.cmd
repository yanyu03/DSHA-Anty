@echo off
rem Engineering Lock hook wrapper -- mirrors run-gate.cmd.
rem ASCII only, no leading quote, stderr discarded, always exits 0 (fail-open).
"C:\python312\python.exe" "%~dp0englock.py" 2>nul
exit /b 0
