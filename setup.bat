@echo off
echo 🗳️ Blockchain E-Vote Setup Script
echo ================================

echo.
echo Step 1: Installing Node.js dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Running tests...
call npx hardhat test
if %errorlevel% neq 0 (
    echo ❌ Tests failed
    pause
    exit /b 1
)

echo.
echo Step 3: Setting up Python virtual environment...
cd backend
python -m venv venv
if %errorlevel% neq 0 (
    echo ❌ Failed to create virtual environment
    pause
    exit /b 1
)

echo.
echo Step 4: Installing Python dependencies...
call venv\Scripts\activate.bat && pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Failed to install Python dependencies
    pause
    exit /b 1
)

cd ..

echo.
echo ✅ Setup completed successfully!
echo.
echo Next steps:
echo 1. Generate RSA keys: 
echo    openssl genpkey -algorithm RSA -out authority_private_key.pem -pkeyopt rsa_keygen_bits:2048
echo    openssl rsa -pubout -in authority_private_key.pem -out authority_public_key.pem
echo.
echo 2. Start blockchain: npx hardhat node
echo 3. Deploy contract:  npx hardhat run scripts/deploy.js --network localhost
echo 4. Update client/config.js with contract address and public key
echo 5. Start backend:    cd backend && venv\Scripts\activate && python app.py
echo 6. Open client/index.html in browser
echo.
pause
