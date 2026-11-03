@echo off
title [2/4] FastAPI ML Microservice (Port 8000)
echo Starting FastAPI ML Microservice on Port 8000...
set "PATH=%~dp0.tools\python;%~dp0.tools\python\Scripts;%PATH%"
cd /d "%~dp0ml-service"
python -m uvicorn main:app --host 127.0.0.1 --port 8000
echo.
echo [ERROR] ML Service has exited.
pause

