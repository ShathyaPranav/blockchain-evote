# Simple PowerShell startup script for Blockchain E-Vote
Write-Host "Blockchain E-Vote - Windows Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = & node --version 2>$null
    Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js not found. Please install Node.js LTS" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Python
try {
    $pythonVersion = & python --version 2>$null
    Write-Host "Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Python not found. Please install Python 3.10+" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check OpenSSL
try {
    $opensslVersion = & openssl version 2>$null
    Write-Host "OpenSSL: $opensslVersion" -ForegroundColor Green
} catch {
    Write-Host "OpenSSL not found. Please install OpenSSL for Windows" -ForegroundColor Red
    Write-Host "Download from: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "`nStarting setup..." -ForegroundColor Cyan

# Install dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Run tests
Write-Host "Running tests..." -ForegroundColor Yellow
npx hardhat test
if ($LASTEXITCODE -ne 0) {
    Write-Host "Tests failed. Please check the output above." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "All tests passed!" -ForegroundColor Green

# Generate RSA keys
Write-Host "Generating RSA keys..." -ForegroundColor Yellow
if (-not (Test-Path "authority_private_key.pem")) {
    openssl genpkey -algorithm RSA -out authority_private_key.pem -pkeyopt rsa_keygen_bits:2048
    openssl rsa -pubout -in authority_private_key.pem -out authority_public_key.pem
    Write-Host "RSA keys generated" -ForegroundColor Green
} else {
    Write-Host "RSA keys already exist" -ForegroundColor Green
}

# Setup Python virtual environment
Write-Host "Setting up Python backend..." -ForegroundColor Yellow
if (-not (Test-Path "backend/venv")) {
    Set-Location backend
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to create virtual environment" -ForegroundColor Red
        Set-Location ..
        Read-Host "Press Enter to exit"
        exit 1
    }
    Set-Location ..
}

Write-Host "`nSetup completed!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Open THREE separate PowerShell terminals" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 1 - Start blockchain:" -ForegroundColor Yellow
Write-Host "   npx hardhat node" -ForegroundColor Gray
Write-Host ""
Write-Host "Terminal 2 - Deploy contract:" -ForegroundColor Yellow
Write-Host "   npx hardhat run scripts/deploy.js --network localhost" -ForegroundColor Gray
Write-Host "   (Copy the contract address from output)" -ForegroundColor Gray
Write-Host ""
Write-Host "Terminal 3 - Start backend:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   .\venv\Scripts\activate" -ForegroundColor Gray
Write-Host "   `$env:CONTRACT_ADDRESS='0x...'  # paste your contract address" -ForegroundColor Gray
Write-Host "   `$env:PRIVATE_KEY_PATH='../authority_private_key.pem'" -ForegroundColor Gray
Write-Host "   python app.py" -ForegroundColor Gray
Write-Host ""
Write-Host "Then:" -ForegroundColor Cyan
Write-Host "4. Update client/config.js with contract address" -ForegroundColor White
Write-Host "5. Open client/index.html in browser" -ForegroundColor White
Write-Host "6. Configure MetaMask (Chain ID: 31337, RPC: http://127.0.0.1:8545)" -ForegroundColor White

Read-Host "`nPress Enter to exit"
