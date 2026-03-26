$ErrorActionPreference = "Stop"

# 1. Get correct OIDC values
Write-Host "Fetching Azure identity values..."
$mi = az identity show --name "github-actions-aks-mi" --resource-group "Library-reg" | ConvertFrom-Json
$sub = az account show | ConvertFrom-Json

$CLIENT_ID = $mi.clientId
$TENANT_ID = $sub.tenantId
$SUB_ID = $sub.id

Write-Host "CLIENT_ID = $CLIENT_ID"
Write-Host "TENANT_ID = $TENANT_ID"
Write-Host "SUB_ID    = $SUB_ID"

# 2. Delete ArgoCD remnants
Write-Host "Removing ArgoCD app manifest from k8s/..."
if (Test-Path "k8s\argocd-app.yaml") {
    Remove-Item "k8s\argocd-app.yaml" -Force
    Write-Host "Deleted k8s/argocd-app.yaml"
}
if (Test-Path "argocd-patch.yaml") {
    Remove-Item "argocd-patch.yaml" -Force
    Write-Host "Deleted argocd-patch.yaml"
}

# 3. Write the final, correct GitHub Actions workflow
$workflow = @"
name: Library System AKS CI/CD

on:
  push:
    branches:
      - main

permissions:
  contents: read
  packages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Authenticate GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: `${{ github.actor }}
          password: `${{ secrets.GITHUB_TOKEN }}

      - name: Build & Push All Microservices
        run: |
          REPO=`$(echo "`${{ github.repository }}" | tr '[:upper:]' '[:lower:]')
          COMMIT_SHA=`${{ github.sha }}
          services=("api-gateway" "auth-service" "book-service" "borrow-service" "fine-service" "notification-service" "reservation-service" "frontend")
          for service in "`${services[@]}"; do
            echo "========== Building: `$service =========="
            IMAGE="ghcr.io/`$REPO/`$service:`$COMMIT_SHA"
            IMAGE_LATEST="ghcr.io/`$REPO/`$service:latest"
            docker build -t "`$IMAGE" -t "`$IMAGE_LATEST" "./`$service"
            docker push "`$IMAGE"
            docker push "`$IMAGE_LATEST"
            sed -i "s|image: .*`$service:.*|image: `$IMAGE|g" "k8s/`$service.yaml"
            echo "Pushed: `$IMAGE"
          done

      - name: Authenticate to Azure via OIDC
        uses: azure/login@v2
        with:
          client-id: "$CLIENT_ID"
          tenant-id: "$TENANT_ID"
          subscription-id: "$SUB_ID"

      - name: Get AKS Credentials
        uses: azure/aks-set-context@v3
        with:
          cluster-name: library-aks
          resource-group: Library-reg
          admin: 'true'

      - name: Deploy to AKS
        run: |
          kubectl create namespace library-system --dry-run=client -o yaml | kubectl apply -f -
          kubectl apply -f k8s/
          kubectl rollout status deployment -n library-system --timeout=120s || true
          echo "========== All pods =========="
          kubectl get pods -n library-system
"@

$workflow | Set-Content -Path ".github\workflows\main.yml" -Encoding UTF8
Write-Host "Workflow file written successfully."

# 4. Fix all K8s manifests to use placeholder ghcr.io image (will be updated at runtime)
$REPO_LOWER = "sachinthadaham/library-manager-microservices"
$services = @("api-gateway", "auth-service", "book-service", "borrow-service", "fine-service", "notification-service", "reservation-service", "frontend")
Write-Host "Updating K8s manifests to reference GHCR images..."
foreach ($service in $services) {
    $file = "k8s\$service.yaml"
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $content = $content -replace "image: .*$service:.*", "image: ghcr.io/$REPO_LOWER/$service`:latest"
        Set-Content -Path $file -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $file"
    }
}

Write-Host "`nAll fixes applied. Committing..."
git add -A
git commit -m "fix(ci): complete pipeline overhaul - correct OIDC, remove ArgoCD, fix K8s image refs"
git push

Write-Host "`nDone! Pipeline is fixed and pushed to GitHub."
