// Configuration file for the blockchain e-voting client
const CONFIG = {
    // Contract configuration
    CONTRACT_ADDRESS: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Latest local deployment
    
    // Network configuration for Hardhat local network
    NETWORK: {
        chainId: '0x7A69', // 31337 in hex (Hardhat local network)
        chainName: 'Hardhat Local',
        nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18
        },
        rpcUrls: ['http://127.0.0.1:8545'],
        blockExplorerUrls: []
    },
    
    // Contract ABI (Application Binary Interface) - Exact match to deployed contract
    CONTRACT_ABI: [
        {
            "inputs": [],
            "name": "getAllCandidates",
            "outputs": [
                {
                    "components": [
                        {
                            "internalType": "uint256",
                            "name": "id",
                            "type": "uint256"
                        },
                        {
                            "internalType": "string",
                            "name": "name",
                            "type": "string"
                        },
                        {
                            "internalType": "uint256",
                            "name": "voteCount",
                            "type": "uint256"
                        }
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
            "inputs": [
                {
                    "internalType": "string",
                    "name": "_encryptedBallot",
                    "type": "string"
                }
            ],
            "name": "vote",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getVotingStatus",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                },
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getTotalVotes",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "hasVoted",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "voterCommitments",
            "outputs": [
                {
                    "internalType": "bytes32",
                    "name": "",
                    "type": "bytes32"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "_index",
                    "type": "uint256"
                }
            ],
            "name": "getVote",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                },
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ],
    
    // RSA Public Key for vote encryption (if needed)
    RSA_PUBLIC_KEY: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtbYfvg8tc43b1gtnznbZ
0s3qG4NiN0yKm55g+9tXpD/rMRJJYotrc/eE+z8bwGTCWsjedTq2kQ8tXMsAhorO
6hy0hEWSe5bM+P/adYfKZJLFke6TjLI/BrVQQBIWp1nkDTOunJQGKKgHCPoeu+63
RBl36NbNl4rMyZxebc6RSxW1MujV9BI8sOf4hDFyTvn8TYaMJPpJTYQzicHCV7jy
k5f9S4Uv4aN1RCh0BQyRTPG7K/cnNjo4Llk/5vv/jA596U9o73aoTmIh/SMK1ecy
blGAW6NU3x9WqLWnM2/9USz/motR3ZTK5VYtehAIyWhGj9OwEknBmNegjgDfv8x5
2QIDAQAB
-----END PUBLIC KEY-----`,
    
    // Backend API configuration
    API_BASE_URL: 'http://127.0.0.1:5000',
};
