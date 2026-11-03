@echo off
echo ========================================================
echo    AI SECURE ONLINE VOTING SYSTEM - TEST RUNNER
echo ========================================================
echo.

set "ROOT=%~dp0"
set "PATH=%ROOT%.tools\node;%ROOT%.tools\python;%ROOT%.tools\python\Scripts;%PATH%"

echo [1/2] Running Backend & Blockchain Ledger Jest Unit Tests...
echo --------------------------------------------------------
cd /d "%ROOT%server"
call npm test
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Backend tests failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Running Python ML & Biometrics Pytest Suite...
echo --------------------------------------------------------
cd /d "%ROOT%ml-service"
python -m pytest tests/test_ml.py -v
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] ML tests failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================================
echo   ALL 12/12 AUTOMATED TESTS PASSED SUCCESSFULLY!
echo ========================================================
echo.
pause

