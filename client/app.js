// Blockchain E-Vote Client Application
class EVoteApp {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.userAccount = null;
        this.selectedCandidate = null;
        
        // Initialize Web3 immediately
        this.initWeb3().then(() => {
            this.init();
        }).catch(error => {
            console.error('Failed to initialize Web3:', error);
            this.showMessage('Failed to connect to Web3. Please install MetaMask!', 'error');
        });
    }

    async initWeb3() {
        // Modern dapp browsers
        if (window.ethereum) {
            this.web3 = new Web3(window.ethereum);
            try {
                // Request account access
                await window.ethereum.enable();
                console.log('Web3 initialized with MetaMask');
            } catch (error) {
                console.error("User denied account access");
                throw new Error("Please allow access to your account");
            }
        }
        // Legacy dapp browsers
        else if (window.web3) {
            this.web3 = new Web3(web3.currentProvider);
            console.log('Web3 initialized with legacy provider');
        }
        // Non-dapp browsers
        else {
            throw new Error('No Web3 provider detected. Please install MetaMask!');
        }
    }

    async init() {
        console.log('🗳️ Initializing E-Vote App...');
        this.setupEventListeners();
        await this.loadContract();
        await this.updateDisplay();
    }

    setupEventListeners() {
        // Connect wallet button
        document.getElementById('connect-wallet').addEventListener('click', () => {
            this.connectWallet();
        });

        // Vote button
        document.getElementById('vote-button').addEventListener('click', () => {
            this.castVote();
        });

        // Listen for account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                this.handleAccountChange(accounts);
            });

            window.ethereum.on('chainChanged', (chainId) => {
                window.location.reload();
            });
        }
    }

    async connectWallet() {
        try {
            if (!window.ethereum) {
                this.showMessage('Please install MetaMask to continue', 'error');
                return;
            }

            this.showMessage('Connecting to MetaMask...', 'info');
            
            // Request accounts
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                this.showMessage('No accounts found. Please connect to MetaMask.', 'error');
                return;
            }

            this.userAccount = accounts[0];
            this.web3 = new Web3(window.ethereum);

            // Check network
            const chainId = await this.web3.eth.getChainId();
            if (chainId.toString() !== '31337') { // 31337 is Hardhat's chain ID
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x7a69' }], // 0x7a69 is 31337 in hex
                    });
                } catch (switchError) {
                    // Handle network switch error
                    console.error('Failed to switch network:', switchError);
                    this.showMessage('Please switch to Hardhat network (Chain ID: 31337)', 'error');
                    return;
                }
            }

            await this.loadContract();
            await this.updateDisplay();
            this.showMessage(`Connected: ${this.userAccount}`, 'success');

        } catch (error) {
            console.error('Connection error:', error);
            this.showMessage(`Failed to connect: ${error.message}`, 'error');
        }
    }

    async switchNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: CONFIG.NETWORK.chainId }],
            });
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [CONFIG.NETWORK],
                    });
                } catch (addError) {
                    throw new Error('Failed to add network to MetaMask');
                }
            } else {
                throw switchError;
            }
        }
    }

    async loadContract() {
        try {
            if (!this.web3) {
                throw new Error('Web3 not initialized');
            }

            // Get the contract ABI
            const response = await fetch('/build/contracts/EVoting.json');
            const contractData = await response.json();
            
            // Create contract instance
            this.contract = new this.web3.eth.Contract(
                contractData.abi,
                CONFIG.CONTRACT_ADDRESS
            );

            console.log('Contract loaded:', CONFIG.CONTRACT_ADDRESS);
        } catch (error) {
            console.error('Error loading contract:', error);
            this.showMessage('Failed to load smart contract', 'error');
            throw error;
        }
    }

    async updateDisplay() {
        await this.updateWalletStatus();
        await this.updateContractStatus();
        await this.loadCandidates();
        await this.updateStats();
    }

    async updateWalletStatus() {
        const statusElement = document.getElementById('wallet-status');
        const connectButton = document.getElementById('connect-wallet');

        if (this.userAccount) {
            statusElement.innerHTML = `Connected: <code>${this.userAccount}</code>`;
            connectButton.textContent = 'Connected ✓';
            connectButton.disabled = true;
            connectButton.style.background = '#28a745';
        } else {
            statusElement.textContent = 'Not connected';
            connectButton.textContent = 'Connect MetaMask';
            connectButton.disabled = false;
        }
    }

    async updateContractStatus() {
        const addressElement = document.getElementById('contract-address');
        const networkElement = document.getElementById('network-info');
        const statusElement = document.getElementById('voting-status');

        addressElement.textContent = CONFIG.CONTRACT_ADDRESS;

        if (this.contract) {
            try {
                const [isActive, candidatesCount, votesCount] = await this.contract.methods.getVotingStatus().call();
                statusElement.textContent = isActive ? 'Active ✅' : 'Inactive ❌';
                networkElement.textContent = CONFIG.NETWORK.chainName;
            } catch (error) {
                console.error('Error getting contract status:', error);
                statusElement.textContent = 'Error loading status';
            }
        }
    }

    async loadCandidates() {
        const candidatesElement = document.getElementById('candidates-list');
        
        if (!this.contract) {
            candidatesElement.innerHTML = '<p>Contract not loaded</p>';
            return;
        }

        try {
            const candidates = await this.contract.methods.getAllCandidates().call();
            
            if (candidates.length === 0) {
                candidatesElement.innerHTML = '<p>No candidates available</p>';
                return;
            }

            let html = '';
            candidates.forEach(candidate => {
                html += `
                    <div class="candidate-card" onclick="app.selectCandidate(${candidate.id}, '${candidate.name}')">
                        <div class="candidate-name">${candidate.name}</div>
                        <div class="candidate-id">Candidate ID: ${candidate.id}</div>
                    </div>
                `;
            });

            candidatesElement.innerHTML = html;

        } catch (error) {
            console.error('Error loading candidates:', error);
            candidatesElement.innerHTML = '<p>Error loading candidates</p>';
        }
    }

    selectCandidate(candidateId, candidateName) {
        // Remove previous selection
        document.querySelectorAll('.candidate-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Add selection to clicked candidate
        event.target.closest('.candidate-card').classList.add('selected');

        this.selectedCandidate = {
            id: candidateId,
            name: candidateName
        };

        // Update vote button
        const voteButton = document.getElementById('vote-button');
        voteButton.textContent = `Vote for ${candidateName}`;
        voteButton.disabled = false;

        console.log('Selected candidate:', this.selectedCandidate);
    }

    async castVote() {
        if (!this.selectedCandidate) {
            this.showMessage('Please select a candidate first', 'error');
            return;
        }
    
        if (!this.userAccount) {
            this.showMessage('Please connect your wallet first', 'error');
            return;
        }
    
        try {
            // Check if user has already voted
            const hasVoted = await this.contract.methods.hasVoted(this.userAccount).call();
            if (hasVoted) {
                this.showMessage('You have already voted!', 'error');
                return;
            }
    
            // Check if user is authorized
            const isAuthorized = await this.contract.methods.authorizedVoters(this.userAccount).call();
            if (!isAuthorized) {
                this.showMessage('You are not authorized to vote', 'error');
                return;
            }
    
            this.showMessage('Preparing your vote...', 'info');
    
            // Convert candidate ID to string and send directly (no encryption for now)
            const voteData = this.selectedCandidate.name; //THIS IS SUPPOSED TO BE AN ID NOT NAME THIS IS SORTA HARDCODED PLS FLAG THIS 
            
            console.log('Vote data:', voteData);
    
            // Submit vote to blockchain
            const tx = await this.contract.methods.vote(voteData).send({
                from: this.userAccount,
                gas: 500000
            });
    
            console.log('Vote transaction:', tx);
    
            this.showMessage(`Vote cast successfully! Transaction: ${tx.transactionHash}`, 'success');
            
            // Update display
            await this.updateDisplay();
            
            // Disable voting
            document.getElementById('vote-button').disabled = true;
            document.getElementById('vote-button').textContent = 'Vote Cast ✓';
    
        } catch (error) {
            console.error('Voting error:', {
                message: error.message,
                code: error.code,
                data: error.data
            });
            this.showMessage(`Voting failed: ${error.message}`, 'error');
        }
        /*catch (error) {
            console.error('Error casting vote:', error);
            let errorMessage = error.message || 'Failed to cast vote';
            
            if (error.message.includes('revert')) {
                if (error.message.includes('already voted')) {
                    errorMessage = 'You have already voted';
                } else if (error.message.includes('not authorized')) {
                    errorMessage = 'You are not authorized to vote';
                } else if (error.message.includes('not active')) {
                    errorMessage = 'Voting is not currently active';
                }
            }
            
            this.showMessage(errorMessage, 'error');
        }*/
    }

    /*async encryptVote(candidateId) {
        try {
            // For demo purposes, we'll use a simple base64 encoding
            // In a real implementation, you'd use proper RSA encryption
            const voteData = candidateId;
            const encoded = btoa(voteData); // Base64 encode for demo
            
            console.log('Vote encrypted (demo):', encoded);
            return encoded;
            
        } catch (error) {
            console.error('Error encrypting vote:', error);
            return null;
        }
    }*/

    async updateStats() {
        try {
            if (!this.contract) return;

            const [isActive, candidatesCount, votesCount] = await this.contract.methods.getVotingStatus().call();
            
            document.getElementById('total-candidates').textContent = candidatesCount.toString();
            document.getElementById('total-votes').textContent = votesCount.toString();

        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    handleAccountChange(accounts) {
        if (accounts.length === 0) {
            this.userAccount = null;
            this.showMessage('Wallet disconnected', 'info');
        } else {
            this.userAccount = accounts[0];
            this.showMessage(`Account changed: ${this.userAccount}`, 'info');
        }
        this.updateDisplay();
    }

    showMessage(message, type = 'info') {
        const messagesDiv = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;

        messagesDiv.appendChild(messageDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);

        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    clearMessages() {
        document.getElementById('messages').innerHTML = '';
    }
}

// Initialize the app when the page loads
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new EVoteApp();
});

// Utility functions for external access
window.EVoteUtils = {
    async checkVotingStatus() {
        if (app && app.contract) {
            return await app.contract.methods.getVotingStatus().call();
        }
        return null;
    },
    
    async getCandidates() {
        if (app && app.contract) {
            return await app.contract.methods.getAllCandidates().call();
        }
        return [];
    },
    
    getContractAddress() {
        return CONFIG.CONTRACT_ADDRESS;
    }
};
