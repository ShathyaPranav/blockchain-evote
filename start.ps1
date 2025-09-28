# PowerShell startup script for Blockchain E-Vote
Write-Host "Blockchain E-Vote - Windows Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Check if all prerequisites are installed
Write-Host "`nChecking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js not found. Please install Node.js LTS" -ForegroundColor Red
    exit 1
}

# Check Python
try {
    $pythonVersion = python --version
    Write-Host "Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Python not found. Please install Python 3.10+" -ForegroundColor Red
    exit 1
}

# Check OpenSSL
try {
    $opensslVersion = openssl version
    Write-Host "OpenSSL: $opensslVersion" -ForegroundColor Green
} catch {
    Write-Host "OpenSSL not found. Please install OpenSSL for Windows" -ForegroundColor Red
    Write-Host "   Download from: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nStarting blockchain e-voting demo..." -ForegroundColor Cyan

# Function to run in new terminal
function Start-NewTerminal {
    param([string]$Command, [string]$Title)
    $currentPath = $PWD.Path
    $scriptBlock = "cd '$currentPath'; Write-Host '$Title' -ForegroundColor Cyan; $Command"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $scriptBlock
}

Write-Host "`nInstalling dependencies (if needed)..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    npm install
}

Write-Host "`nRunning tests..." -ForegroundColor Yellow
$testResult = npx hardhat test
if ($LASTEXITCODE -ne 0) {
    Write-Host "Tests failed. Please check the output above." -ForegroundColor Red
    exit 1
}

Write-Host "`nAll tests passed!" -ForegroundColor Green

Write-Host "`nGenerating RSA keys..." -ForegroundColor Yellow
if (-not (Test-Path "authority_private_key.pem")) {
    openssl genpkey -algorithm RSA -out authority_private_key.pem -pkeyopt rsa_keygen_bits:2048
    openssl rsa -pubout -in authority_private_key.pem -out authority_public_key.pem
    Write-Host "RSA keys generated" -ForegroundColor Green
} else {
    Write-Host "RSA keys already exist" -ForegroundColor Green
}

Write-Host "`nStarting blockchain node..." -ForegroundColor Yellow
Start-NewTerminal "npx hardhat node" "Hardhat Blockchain Node"

Write-Host "`nWaiting for blockchain to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`nDeploying smart contract..." -ForegroundColor Yellow
Start-NewTerminal "npx hardhat run scripts/deploy.js --network localhost; Read-Host 'Press Enter to continue...'" "Contract Deployment"

Write-Host "`nSetting up Python backend..." -ForegroundColor Yellow
if (-not (Test-Path "backend/venv")) {
    Set-Location backend
    python -m venv venv
    Set-Location ..
}

Write-Host "`nInstructions for next steps:" -ForegroundColor Cyan
Write-Host "1. Wait for contract deployment to complete" -ForegroundColor White
Write-Host "2. Copy the contract address from the deployment terminal" -ForegroundColor White
Write-Host "3. Update client/config.js with the contract address" -ForegroundColor White
Write-Host "4. Run the backend server:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   .\venv\Scripts\activate" -ForegroundColor Gray
Write-Host "   `$env:CONTRACT_ADDRESS='0x...'  # your deployed address" -ForegroundColor Gray
Write-Host "   `$env:PRIVATE_KEY_PATH='../authority_private_key.pem'" -ForegroundColor Gray
Write-Host "   python app.py" -ForegroundColor Gray
Write-Host "5. Open client/index.html in your browser" -ForegroundColor White
Write-Host "6. Configure MetaMask with local network (Chain ID: 31337)" -ForegroundColor White

Write-Host "`nSetup complete! Follow the instructions above to start voting." -ForegroundColor Green
