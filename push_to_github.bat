@echo off
title Push Code to GitHub
cd /d "%~dp0"
echo ========================================================
echo         PUSHING CODE TO GITHUB REPOSITORY
echo ========================================================
echo.
echo Target: https://github.com/Thanu113/ai-secure-voting-system.git
echo.
echo If prompted, sign in with your GitHub account in the browser
echo or enter your GitHub Personal Access Token.
echo.
git push -u origin main
echo.
echo ========================================================
if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Code pushed to GitHub successfully!
) else (
    echo [FAILED] Push failed. Please check your GitHub credentials.
)
echo ========================================================
pause
