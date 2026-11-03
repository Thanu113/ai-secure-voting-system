@echo off
title [1/4] MongoDB Database (Port 27017)
echo Starting MongoDB on Port 27017...
if not exist "%~dp0.tools\data\db" (
    mkdir "%~dp0.tools\data\db"
)
"C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --dbpath "%~dp0.tools\data\db" --bind_ip 127.0.0.1 --port 27017
echo.
echo [ERROR] MongoDB has exited.
pause

