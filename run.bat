@echo off
echo ===================================================
echo   Starting PulseOps HQ (Frontend + Backend)
echo ===================================================
echo.
echo Launching Server on http://localhost:5000...
start cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak >nul
echo Launching Client on http://localhost:3000...
start cmd /k "cd client && npm run dev"
echo.
echo PulseOps is booting! Opening browser at http://localhost:3000
timeout /t 3 /nobreak >nul
start http://localhost:3000
