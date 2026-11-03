@echo off
title [4/4] React Vite Frontend Client (Port 5173)
echo Starting React Vite Frontend on Port 5173...
set "PATH=%~dp0.tools\node;%PATH%"
cd /d "%~dp0client"
npx.cmd vite --host 0.0.0.0 --port 5173
echo.
echo [ERROR] Frontend Server has exited.
pause

