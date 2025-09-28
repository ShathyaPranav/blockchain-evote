# 🗳️ Blockchain E-Vote

A minimal blockchain voting demonstration using **Hardhat**, **Solidity**, **MetaMask**, and **Flask**.

⚠️ **Educational Purpose Only** — Not production secure.

## 🔧 Prerequisites

Install these tools first:

1. **[Node.js LTS](https://nodejs.org/en/download)** → verify with `node -v`
2. **[Python 3.10+](https://www.python.org/downloads/windows/)** → verify with `python --version`
3. **[Git for Windows](https://git-scm.com/download/win)** → verify with `git --version`
4. **[OpenSSL for Windows](https://slproweb.com/products/Win32OpenSSL.html)** → verify with `openssl version`
5. **[MetaMask Browser Extension](https://metamask.io/)**

## 🚀 Quick Setup

### 1. Clone and Install Dependencies

```powershell
git clone https://github.com/ishanvikaushik/blockchain-evote.git
cd blockchain-evote
npm install
```

### 2. Start Local Blockchain

```powershell
npx hardhat node
```

Keep this terminal open - it will show available accounts and private keys.

### 3. Deploy Smart Contract

In a new terminal:

```powershell
npx hardhat run scripts/deploy.js --network localhost
```

**Important:** Copy the deployed contract address from the output.

### 4. Generate RSA Keys for Vote Encryption

```powershell
openssl genpkey -algorithm RSA -out authority_private_key.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in authority_private_key.pem -out authority_public_key.pem
```

### 5. Update Configuration

Open `client/config.js` and update:
- `CONTRACT_ADDRESS` with the deployed contract address
- `RSA_PUBLIC_KEY` with content from `authority_public_key.pem`

### 6. Setup Backend Environment

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

Set environment variables:

```powershell
$env:CONTRACT_ADDRESS="0x..." # Your deployed contract address
$env:PRIVATE_KEY_PATH="..\authority_private_key.pem"
$env:PROVIDER="http://127.0.0.1:8545"
```

### 7. Start Flask Backend

```powershell
python app.py
```

### 8. Configure MetaMask

1. **Add Local Network:**
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. **Import Test Account:**
   - Copy a private key from the Hardhat node terminal
   - Import into MetaMask

### 9. Open Voting Interface

Open `client/index.html` in your browser and:
1. Click "Connect MetaMask"
2. Select a candidate
3. Cast your vote!

### 10. Tally Results

```powershell
curl http://127.0.0.1:5000/tally -X POST
```

## 🧪 Run Tests

```powershell
npx hardhat test
```

## 📁 Project Structure

```
blockchain-evote/
├── contracts/          # Solidity smart contracts
│   └── EVoting.sol     # Main voting contract
├── scripts/            # Deployment scripts
│   └── deploy.js       # Contract deployment
├── test/               # Contract tests
│   └── EVoting.test.js # Unit tests
├── client/             # Frontend web application
│   ├── index.html      # Main UI
│   ├── app.js          # Application logic
│   └── config.js       # Configuration
├── backend/            # Flask API server
│   ├── app.py          # Main backend application
│   └── requirements.txt# Python dependencies
├── hardhat.config.js   # Hardhat configuration
└── package.json        # Node.js dependencies
```

## 🔐 How It Works

1. **Smart Contract**: Stores encrypted votes on the blockchain
2. **RSA Encryption**: Votes are encrypted before submission
3. **MetaMask Integration**: Provides wallet connectivity
4. **Flask Backend**: Decrypts votes for tallying
5. **Web Interface**: User-friendly voting experience

## ⚠️ Security Considerations

This is an **educational demonstration** with several limitations:

- **Not Production Ready**: Missing many security features
- **Simplified Encryption**: Real systems need more robust encryption
- **No Voter Verification**: No identity verification system
- **Local Network Only**: Not deployed to mainnet
- **Limited Privacy**: Blockchain analysis can reveal patterns

## 🔧 Troubleshooting

### Common Issues:

**"Error loading contract"**
- Ensure Hardhat node is running
- Verify contract address in `config.js`

**"Transaction failed"**
- Check if you're authorized to vote
- Ensure you haven't already voted
- Verify MetaMask is connected to correct network

**"Failed to connect wallet"**
- Install/enable MetaMask
- Add local network to MetaMask
- Import a test account

**Backend connection errors**
- Ensure Flask server is running
- Check environment variables are set
- Verify private key file exists

## 📚 API Endpoints

- **GET** `/health` - Backend health check
- **GET** `/candidates` - Get all candidates
- **POST** `/tally` - Decrypt and tally votes
- **GET** `/votes` - Get vote summary (encrypted)

## 🛠️ Development Commands

```powershell
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Start local blockchain
npx hardhat node

# Deploy to localhost
npx hardhat run scripts/deploy.js --network localhost

# Clean and rebuild
npx hardhat clean
npm run compile
```

## 🌐 Network Configuration

**Hardhat Local Network:**
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Block Time: Instant
- Gas Price: 0

## 📖 Learning Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Web3.js Documentation](https://web3js.readthedocs.io/)
- [MetaMask Documentation](https://docs.metamask.io/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## 🤝 Contributing

This is an educational project. Feel free to:
- Report issues
- Suggest improvements
- Submit pull requests
- Use as learning material

## 📄 License

MIT License - See LICENSE file for details.

---

**Remember**: This is for educational purposes only. Real-world voting systems require extensive security audits, formal verification, and compliance with electoral regulations.
