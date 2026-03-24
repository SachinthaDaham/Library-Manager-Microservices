$services = @(
    "api-gateway",
    "auth-service",
    "book-service",
    "borrow-service",
    "fine-service",
    "notification-service",
    "reservation-service",
    "frontend"
)

Write-Host "Installing dependencies for all services..."
foreach ($service in $services) {
    Write-Host "Running npm install in $service..."
    Push-Location $service
    npm install
    Pop-Location
}

Write-Host "All dependencies installed. Starting services..."
npx concurrently --kill-others -n "api-gw,auth,book,borrow,fine,notify,reserv,front" -c "bgBlue,bgMagenta,bgCyan,bgGreen,bgRed,bgYellow,bgWhite,bgBlack" "cd api-gateway && npm run start:dev" "cd auth-service && npm run start:dev" "cd book-service && npm run start:dev" "cd borrow-service && npm run start:dev" "cd fine-service && npm run start:dev" "cd notification-service && npm run start:dev" "cd reservation-service && npm run start:dev" "cd frontend && npm run dev"
