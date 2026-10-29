@echo off
title RetainIQ Launcher
echo ========================================================
echo         RetainIQ - Customer Retention Platform
echo ========================================================
echo.

echo Checking MySQL service...
sc query MySQL80 | find "RUNNING" >nul
if errorlevel 1 (
    echo [WARNING] MySQL80 service is not running. Attempting to start...
    net start MySQL80
)

echo.
echo [1/2] Starting Backend FastAPI Server (port 8000)...
start "RetainIQ Backend (FastAPI)" cmd /k "cd /d %~dp0backend && .\venv\Scripts\activate.bat && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting Frontend Vite Server (port 5173)...
start "RetainIQ Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo Waiting 4 seconds for servers to initialize...
timeout /t 4 /nobreak >nul

echo Opening RetainIQ in default browser...
start http://127.0.0.1:5173/login

echo.
echo ========================================================
echo RetainIQ is running!
echo Frontend: http://127.0.0.1:5173
echo Backend API Docs: http://127.0.0.1:8000/docs
echo.
echo Press any key in this window to close launcher.
echo (Server terminal windows will stay open in the background)
echo ========================================================
pause >nul

