# 🗳️ Blockchain E-Vote (Windows Setup)

Minimal blockchain voting demo using **Hardhat + Solidity + MetaMask + Flask**.  
⚠️ Educational only — not production secure.

---

## 🔧 Prerequisites
Install these once:
1. [Node.js LTS](https://nodejs.org/en/download) → verify with `node -v`
2. [Python 3.10+](https://www.python.org/downloads/windows/) → verify with `python --version`
3. [Git for Windows](https://git-scm.com/download/win) → verify with `git --version`
4. [OpenSSL for Windows](https://slproweb.com/products/Win32OpenSSL.html) → verify with `openssl version`
5. [MetaMask extension](https://metamask.io/)

---

## 🚀 Setup

```powershell
git clone https://github.com/<your-username>/blockchain-evote.git
cd blockchain-evote
npm install
▶️ Run Demo
Start local blockchain:

powershell
Copy code
npx hardhat node
Deploy contract:

powershell
Copy code
npx hardhat run scripts/deploy.js --network localhost
Copy the deployed contract address.

Generate keys:

powershell
Copy code
openssl genpkey -algorithm RSA -out authority_private_key.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in authority_private_key.pem -out authority_public_key.pem
Paste public key into client/config.js.

Run backend:

powershell
Copy code
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt

set CONTRACT_ADDRESS=0x...   # contract from step 2
set PRIVATE_KEY_PATH=..\authority_private_key.pem
set PROVIDER=http://127.0.0.1:8545
flask run
MetaMask:

Add network → RPC http://127.0.0.1:8545, Chain ID 31337.

Import one Hardhat account (private key printed in step 1).

Cast votes:

Open client/index.html in browser.

Connect MetaMask → select candidate → cast vote.

Tally results:

powershell
Copy code
curl http://127.0.0.1:5000/tally
✅ Run Tests
powershell
Copy code
npx hardhat test
⚠️ Notes
Blockchain ensures immutability but not full privacy.

Voter devices can be compromised.

Only a demo, not production-ready.

📖 References
Hardhat: https://hardhat.org

OpenZeppelin: https://docs.openzeppelin.com/contracts

MetaMask: https://docs.metamask.io
