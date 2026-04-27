@echo off
cd /d "%~dp0backend"

echo.
echo ========================================
echo Starting Backend Server
echo ========================================
echo.
echo Server will run at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo API Redoc: http://localhost:8000/redoc
echo.
echo MongoDB is optional. If it is unavailable, the app will use local fallback storage.
echo.

python -m uvicorn main:app --host 127.0.0.1 --port 8000
pause
