@echo off
title [3/4] Express Backend Core API (Port 5000)
echo Starting Express Backend API on Port 5000...
set "PATH=%~dp0.tools\node;%PATH%"
cd /d "%~dp0server"
node server.js
echo.
echo [ERROR] Backend Server has exited.
pause

