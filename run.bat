@echo off
cd /d "%~dp0"
echo ===================================================
echo   Starting PulseOps HQ (Frontend + Backend)
echo ===================================================
echo.
echo Launching Server on http://localhost:5000...
start "PulseOps Server" /D "%~dp0server" cmd /k npm run dev
timeout /t 3 /nobreak >nul
echo Launching Client on http://localhost:3000...
start "PulseOps Client" /D "%~dp0client" cmd /k npm run dev
echo.
echo PulseOps is booting! Opening browser at http://localhost:3000
timeout /t 3 /nobreak >nul
start http://localhost:3000
