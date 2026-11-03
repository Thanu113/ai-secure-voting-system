@echo off
set "ROOT=%~dp0"
set "PATH=%ROOT%.tools\node;%PATH%"
set "NODE_PATH=%ROOT%server\node_modules"
node "%ROOT%scripts\verify_ledger_cli.js"
pause

