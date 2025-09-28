# 🔧 Setup Configuration Template

After cloning this repository, you'll need to configure these files:

## 1. Generate RSA Keys
```bash
openssl genpkey -algorithm RSA -out authority_private_key.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in authority_private_key.pem -out authority_public_key.pem
```

## 2. Deploy Contract
```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

## 3. Update client/config.js
Replace:
- `YOUR_CONTRACT_ADDRESS_HERE` with deployed contract address
- `YOUR_PUBLIC_KEY_CONTENT_HERE` with content from authority_public_key.pem

## 4. Set Environment Variables (for backend)
```bash
$env:CONTRACT_ADDRESS="0x..."  # your deployed address
$env:PRIVATE_KEY_PATH="../authority_private_key.pem"
$env:PROVIDER="http://127.0.0.1:8545"
```

## Files that will be created (and are gitignored):
- `authority_private_key.pem` (PRIVATE - never commit!)
- `authority_public_key.pem` (use content in config.js)
- `node_modules/` (dependencies)
- `artifacts/` (compiled contracts)
- `cache/` (build cache)
- `backend/venv/` (Python virtual environment)
