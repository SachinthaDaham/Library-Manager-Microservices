# Error action preference to stop on errors
$ErrorActionPreference = "Stop"

Write-Host "Cleaning up any failed git init..."
if (Test-Path ".git") { Remove-Item -Recurse -Force .git }

Write-Host "Initializing repository..."
git init -b main
git config core.autocrlf false

# Verify/Set user identity
git config user.name "SachinthaDaham"
git config user.email "sachinthadaham@gmail.com"

# Setup Remote
git remote add origin https://github.com/SachinthaDaham/Library-Manager-Microservices.git

# 1. Base Commit
Write-Host "Creating Base Commit..."
git add .gitignore
if (Test-Path "emit.js") { git add emit.js }
if (Test-Path "test-fines.js") { git add test-fines.js }
git commit -m "Initialize repository with base configurations"

# Services to process
$services = @("api-gateway", "auth-service", "book-service", "borrow-service", "fine-service", "reservation-service", "notification-service", "frontend")

foreach ($service in $services) {
    if (Test-Path $service) {
        Write-Host "Processing feature branch for $service..."
        # Create and checkout feature branch
        git checkout -b "feat/$service"
        
        # Add service files
        git add $service
        git commit -m "feat: implement $service module"
        
        # Checkout main and merge with no fast-forward to maintain graph history
        git checkout main
        git merge --no-ff "feat/$service" -m "Merge branch 'feat/$service' into main"
    }
}

Write-Host "Git history simulation complete."
Write-Host "Pushing to GitHub..."
git push -u origin --all
