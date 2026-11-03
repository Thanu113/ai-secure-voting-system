@echo off
title AI Secure Voting System Stopper
echo ========================================================
echo     STOPPING ALL VOTING SYSTEM SERVICES...
echo ========================================================
echo.

echo Terminating Vite Frontend (Node)...
taskkill /F /IM node.exe 2>nul

echo Terminating FastAPI ML Microservice (Python)...
taskkill /F /IM python.exe 2>nul

echo Terminating MongoDB Daemon...
taskkill /F /IM mongod.exe 2>nul

:: Clean up helper launcher scripts
set "ROOT=%~dp0"
del /q "%ROOT%_run_mongo.bat" 2>nul
del /q "%ROOT%_run_ml.bat" 2>nul
del /q "%ROOT%_run_backend.bat" 2>nul
del /q "%ROOT%_run_frontend.bat" 2>nul

echo.
echo ========================================================
echo        ALL SERVICES HAVE BEEN SHUT DOWN CLEANLY.
echo ========================================================
echo.
pause
