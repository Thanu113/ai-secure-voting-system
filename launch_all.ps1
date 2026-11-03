# AI Secure Voting System - Master Launcher
$ErrorActionPreference = "Continue"
$root = $PSScriptRoot

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "    AI-BASED SECURE ONLINE VOTING SYSTEM (MERN + ML)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Ensure MongoDB data folder exists
$dbDir = Join-Path $root ".tools\data\db"
if (-not (Test-Path $dbDir)) {
    New-Item -ItemType Directory -Path $dbDir -Force | Out-Null
}

Write-Host "[1/4] Starting MongoDB Database (Port 27017)..." -ForegroundColor Yellow
$mongoExe = "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe"
Start-Process -FilePath $mongoExe -ArgumentList "--dbpath `"$dbDir`" --bind_ip 127.0.0.1 --port 27017"

Start-Sleep -Seconds 4

Write-Host "[2/4] Starting FastAPI ML Microservice (Port 8000)..." -ForegroundColor Yellow
$mlDir = Join-Path $root "ml-service"
$pyPath = Join-Path $root ".tools\python"
$pyScripts = Join-Path $root ".tools\python\Scripts"
$mlCmd = "title FastAPI ML (Port 8000) & set `"PATH=$pyPath;$pyScripts;%PATH%`" & cd /d `"$mlDir`" & python -m uvicorn main:app --host 127.0.0.1 --port 8000"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", $mlCmd

Start-Sleep -Seconds 4

Write-Host "[3/4] Starting Express Backend Core API (Port 5000)..." -ForegroundColor Yellow
$serverDir = Join-Path $root "server"
$nodePath = Join-Path $root ".tools\node"
$backendCmd = "title Express Backend (Port 5000) & set `"PATH=$nodePath;%PATH%`" & cd /d `"$serverDir`" & node server.js"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", $backendCmd

Start-Sleep -Seconds 4

Write-Host "[4/4] Starting React Vite Frontend Client (Port 5173)..." -ForegroundColor Yellow
$clientDir = Join-Path $root "client"
$frontendCmd = "title React Vite Frontend (Port 5173) & set `"PATH=$nodePath;%PATH%`" & cd /d `"$clientDir`" & npx.cmd vite --host 0.0.0.0 --port 5173"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", $frontendCmd

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "              SYSTEM BOOTSTRAP COMPLETE!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Web Application:   http://localhost:5173" -ForegroundColor White
Write-Host "  Backend Core API:  http://127.0.0.1:5000" -ForegroundColor Gray
Write-Host "  FastAPI ML Engine: http://127.0.0.1:8000" -ForegroundColor Gray
Write-Host "  MongoDB Database:  127.0.0.1:27017" -ForegroundColor Gray
Write-Host ""
Write-Host "  Admin Login: admin@securevote.org  /  Admin@12345" -ForegroundColor Cyan
Write-Host "  Voter Login: voter1@securevote.org /  Voter@12345" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "Waiting 5 seconds before opening browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "Browser opened! Keep all service windows open while using." -ForegroundColor Green
Write-Host "Press Enter to exit this launcher window..."
Read-Host

