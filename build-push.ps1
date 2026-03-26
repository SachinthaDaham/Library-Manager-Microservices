$services = @("api-gateway", "auth-service", "book-service", "borrow-service", "fine-service", "notification-service", "reservation-service", "frontend")

foreach ($s in $services) {
    Write-Host ">>> Building image for $s..."
    docker build -t "dahamsachintha1/$($s):latest" "./$s"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build $s"
        exit 1
    }
    
    Write-Host ">>> Pushing image for $s..."
    docker push "dahamsachintha1/$($s):latest"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to push $s"
        exit 1
    }
}
Write-Host ">>> All Docker images built and pushed successfully!"
