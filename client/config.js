// Configuration file for the blockchain e-voting client
const CONFIG = {
    // Contract configuration - UPDATE THESE AFTER DEPLOYMENT!
    CONTRACT_ADDRESS: 'YOUR_CONTRACT_ADDRESS_HERE', // Replace with deployed contract address
    
    // Network configuration
    NETWORK: {
        chainId: '0x7A69', // 31337 in hex (Hardhat local network)
        chainName: 'Hardhat Local',
        rpcUrls: ['http://127.0.0.1:8545'],
        blockExplorerUrls: ['http://127.0.0.1:8545']
    },
    
    // RSA Public Key for vote encryption - UPDATE THIS!
    // Generate with: openssl rsa -pubout -in authority_private_key.pem -out authority_public_key.pem
    // Then copy the content here (including -----BEGIN/END----- lines)
    RSA_PUBLIC_KEY: `-----BEGIN PUBLIC KEY-----
YOUR_PUBLIC_KEY_CONTENT_HERE
-----END PUBLIC KEY-----`,
    
    // Backend API configuration
    API_BASE_URL: 'http://127.0.0.1:5000',
    
    // Contract ABI (Application Binary Interface)
    CONTRACT_ABI: [
        {
            "inputs": [],
            "name": "getAllCandidates",
            "outputs": [
                {
                    "components": [
                        {"internalType": "uint256", "name": "id", "type": "uint256"},
                        {"internalType": "string", "name": "name", "type": "string"},
                        {"internalType": "uint256", "name": "voteCount", "type": "uint256"}
                    ],
                    "internalType": "struct EVoting.Candidate[]",
                    "name": "",
                    "type": "tuple[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{"internalType": "string", "name": "_encryptedBallot", "type": "string"}],
            "name": "vote",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getVotingStatus",
            "outputs": [
                {"internalType": "bool", "name": "", "type": "bool"},
                {"internalType": "uint256", "name": "", "type": "uint256"},
                {"internalType": "uint256", "name": "", "type": "uint256"}
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getTotalVotes",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{"internalType": "address", "name": "", "type": "address"}],
            "name": "hasVoted",
            "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{"internalType": "address", "name": "", "type": "address"}],
            "name": "authorizedVoters",
            "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "anonymous": false,
            "inputs": [
                {"indexed": true, "internalType": "address", "name": "voter", "type": "address"},
                {"indexed": false, "internalType": "string", "name": "encryptedBallot", "type": "string"},
                {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
            ],
            "name": "VoteCast",
            "type": "event"
        }
    ]
};
