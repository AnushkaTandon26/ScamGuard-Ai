@echo off
cd /d "%~dp0frontend"

echo.
echo ========================================
echo Starting Frontend Server
echo ========================================
echo.
echo Frontend will run at: http://localhost:3000
echo.

npm.cmd start
pause
