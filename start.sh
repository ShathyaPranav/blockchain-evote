#!/bin/bash
echo "🗳️ Blockchain E-Vote Quick Start"
echo "================================"

echo ""
echo "🚀 Starting local blockchain..."
echo "Keep this terminal open and run the following commands in separate terminals:"
echo ""

# Start Hardhat node in background
npx hardhat node &
HARDHAT_PID=$!

echo "✅ Blockchain started (PID: $HARDHAT_PID)"
echo ""
echo "Next, run these commands in separate terminals:"
echo ""
echo "Terminal 2 - Deploy contract:"
echo "  npx hardhat run scripts/deploy.js --network localhost"
echo ""
echo "Terminal 3 - Generate keys:"
echo "  openssl genpkey -algorithm RSA -out authority_private_key.pem -pkeyopt rsa_keygen_bits:2048"
echo "  openssl rsa -pubout -in authority_private_key.pem -out authority_public_key.pem"
echo ""
echo "Terminal 4 - Start backend:"
echo "  cd backend"
echo "  source venv/bin/activate  # or venv\\Scripts\\activate on Windows"
echo "  export CONTRACT_ADDRESS=0x...  # from deployment output"
echo "  export PRIVATE_KEY_PATH=../authority_private_key.pem"
echo "  python app.py"
echo ""
echo "Then open client/index.html in your browser!"
echo ""
echo "Press Ctrl+C to stop the blockchain"

# Wait for interrupt
trap "echo 'Stopping blockchain...'; kill $HARDHAT_PID; exit" INT
wait
