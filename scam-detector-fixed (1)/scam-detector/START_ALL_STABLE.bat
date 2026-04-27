@echo off
cd /d "%~dp0"

start "ScamGuard Backend" cmd /k "%~dp0LAUNCH_BACKEND.bat"
timeout /t 3 >nul
start "ScamGuard Frontend" cmd /k "%~dp0LAUNCH_FRONTEND.bat"

echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
