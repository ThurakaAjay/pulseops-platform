Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Starting PulseOps HQ Real-Time Platform" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan

# Start server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"
Start-Sleep -Seconds 3

# Start client
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev"
Start-Sleep -Seconds 2

Write-Host "PulseOps HQ is live at http://localhost:3000" -ForegroundColor Green
Start-Process "http://localhost:3000"
