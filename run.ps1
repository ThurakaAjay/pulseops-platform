$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Starting PulseOps HQ Real-Time Platform" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan

# Start server
Start-Process powershell -WorkingDirectory "$scriptDir\server" -ArgumentList "-NoExit", "-Command", "npm run dev"
Start-Sleep -Seconds 3

# Start client
Start-Process powershell -WorkingDirectory "$scriptDir\client" -ArgumentList "-NoExit", "-Command", "npm run dev"
Start-Sleep -Seconds 3

Write-Host "PulseOps HQ is live at http://localhost:3000" -ForegroundColor Green
Start-Process "http://localhost:3000"
