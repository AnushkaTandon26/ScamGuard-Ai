@echo off
REM Scam Detector - Setup and Launch

setlocal enabledelayedexpansion

cd /d "%~dp0"
echo.
echo ========================================
echo ScamGuard AI - Full Stack Setup
echo ========================================
echo.

echo [1/5] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python 3 not found. Please install Python 3.8+
    pause
    exit /b 1
)
python --version
echo.

echo [2/5] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js 16+
    pause
    exit /b 1
)
node --version
echo.

echo [3/5] Preparing backend...
cd backend
if not exist venv (
    echo Creating backend virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
if not exist venv\Scripts\uvicorn.exe (
    echo Installing backend requirements...
    pip install --upgrade pip
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ERROR: Failed to install backend requirements
        pause
        exit /b 1
    )
)
cd ..
echo.

echo [4/5] Preparing frontend...
cd frontend
if not exist node_modules (
    echo Installing frontend packages...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install frontend packages
        cd ..
        pause
        exit /b 1
    )
)
cd ..
echo.

echo [5/5] Checking MongoDB...
mongod --version >nul 2>&1
if errorlevel 1 (
    echo MongoDB not found locally.
    echo The backend can still run using local fallback storage.
) else (
    echo MongoDB detected.
)
echo.

echo ========================================
echo Launch options
echo ========================================
echo Press A - Start ALL
echo Press B - Start Backend only
echo Press F - Start Frontend only
echo Press X - Exit
echo.

choice /c ABFX /N /M "Enter your choice: "
if errorlevel 4 goto :EOF
if errorlevel 3 goto start_frontend
if errorlevel 2 goto start_backend
if errorlevel 1 goto start_all

:start_all
echo.
echo Opening backend and frontend in separate windows...
start cmd /k "cd /d "%~dp0"backend && call venv\Scripts\activate.bat && python main.py"
timeout /t 3 >nul
start cmd /k "cd /d "%~dp0"frontend && npm start"
echo Frontend: http://localhost:3000
echo Backend: http://localhost:8000
pause
goto :EOF

:start_backend
echo.
echo Starting backend at http://localhost:8000
cd backend
call venv\Scripts\activate.bat
python main.py
pause
goto :EOF

:start_frontend
echo.
echo Starting frontend at http://localhost:3000
cd frontend
npm start
pause
goto :EOF
