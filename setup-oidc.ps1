$ErrorActionPreference = "Stop"
$env:PATH += ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")

$RG = "Library-reg"
$CLUSTER = "library-aks"
$MI_NAME = "github-actions-aks-mi"
$REPO = "SachinthaDaham/Library-Manager-Microservices"

Write-Host "Creating Managed Identity..."
$miJson = az identity create --name $MI_NAME --resource-group $RG
$mi = $miJson | ConvertFrom-Json
$MI_CLIENT_ID = $mi.clientId
$MI_PRINCIPAL_ID = $mi.principalId

Write-Host "Getting Subscription ID..."
$subJson = az account show
$sub = $subJson | ConvertFrom-Json
$SUB_ID = $sub.id
$TENANT_ID = $sub.tenantId

Write-Host "Getting AKS Resource ID..."
$AKS_ID = az aks show -g $RG -n $CLUSTER --query id -o tsv

Write-Host "Assigning Cluster Admin Role to Managed Identity (This may take 30 seconds)..."
az role assignment create --role "Azure Kubernetes Service Cluster Admin Role" --assignee $MI_PRINCIPAL_ID --scope $AKS_ID

Write-Host "Checking for existing Federated Credential..."
$existing = az identity federated-credential list --identity-name $MI_NAME --resource-group $RG --query "[?name=='github-actions'].name" -o tsv
if (-not $existing) {
    Write-Host "Creating Federated Identity Credential for GitHub Actions..."
    az identity federated-credential create --name "github-actions" --identity-name $MI_NAME --resource-group $RG --issuer "https://token.actions.githubusercontent.com" --subject "repo:${REPO}:ref:refs/heads/main" --audiences "api://AzureADTokenExchange"
} else {
    Write-Host "Federated Credential already exists."
}

$output = @{
    AZURE_CLIENT_ID = $MI_CLIENT_ID
    AZURE_TENANT_ID = $TENANT_ID
    AZURE_SUBSCRIPTION_ID = $SUB_ID
}
$output | ConvertTo-Json | Out-File oidc_output.json
Write-Host "OIDC Configuration Complete!"
