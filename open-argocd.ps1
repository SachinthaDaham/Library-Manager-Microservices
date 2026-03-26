# =============================================
# ArgoCD Web UI Access Script
# Run this script to open the ArgoCD dashboard
# =============================================

Write-Host "Fetching ArgoCD admin password..." -ForegroundColor Cyan
$encodedPassword = kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}"
$password = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($encodedPassword))

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host " ArgoCD Login Credentials"            -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host " URL:      http://localhost:8080"     -ForegroundColor Yellow
Write-Host " Username: admin"                      -ForegroundColor Yellow
Write-Host " Password: $password"                  -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Starting port-forward... (Press Ctrl+C to stop)" -ForegroundColor Cyan
Write-Host "Opening browser in 3 seconds..." -ForegroundColor Cyan

Start-Job -ScriptBlock { Start-Sleep 3; Start-Process "http://localhost:8080" } | Out-Null

kubectl port-forward svc/argocd-server -n argocd 8080:80
