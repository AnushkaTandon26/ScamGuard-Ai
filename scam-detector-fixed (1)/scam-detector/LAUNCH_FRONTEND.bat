@echo off
cd /d "%~dp0frontend"

if not exist node_modules (
  echo Frontend dependencies are missing.
  echo Run these commands first:
  echo   cd frontend
  echo   npm install
  exit /b 1
)

npm.cmd start
