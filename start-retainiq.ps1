# RetainIQ One-Click PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "        RetainIQ - Customer Retention Platform          " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Check MySQL
$mysqlService = Get-Service -Name MySQL80 -ErrorAction SilentlyContinue
if ($mysqlService -and $mysqlService.Status -ne 'Running') {
    Write-Host "[INFO] Starting MySQL80 service..." -ForegroundColor Yellow
    Start-Service -Name MySQL80
}

$root = $PSScriptRoot

Write-Host "[1/2] Starting Backend FastAPI Server (http://127.0.0.1:8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Write-Host "[2/2] Starting Frontend Vite Server (http://127.0.0.1:5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev -- --host 127.0.0.1 --port 5173"

Start-Sleep -Seconds 4

Write-Host "Opening application in browser..." -ForegroundColor Cyan
Start-Process "http://127.0.0.1:5173/login"

Write-Host ""
Write-Host "Both servers are running in dedicated PowerShell windows." -ForegroundColor Green

