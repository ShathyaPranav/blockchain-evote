// Blockchain E-Vote Client Application
class EVoteApp {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.userAccount = null;
        this.selectedCandidate = null;
        this.init();
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
                this.showMessage('MetaMask is not installed. Please install MetaMask to continue.', 'error');
                return;
            }

            this.showMessage('Connecting to MetaMask...', 'info');

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                this.showMessage('No accounts found. Please connect to MetaMask.', 'error');
                return;
            }

            this.userAccount = accounts[0];
            this.web3 = new Web3(window.ethereum);

            // Check if we're on the correct network
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== CONFIG.NETWORK.chainId) {
                await this.switchNetwork();
            }

            await this.loadContract();
            await this.updateDisplay();
            
            this.showMessage(`Connected to MetaMask: ${this.userAccount}`, 'success');

        } catch (error) {
            console.error('Error connecting wallet:', error);
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
                this.web3 = new Web3(CONFIG.NETWORK.rpcUrls[0]);
            }

            this.contract = new this.web3.eth.Contract(
                CONFIG.CONTRACT_ABI,
                CONFIG.CONTRACT_ADDRESS
            );

            console.log('Contract loaded:', CONFIG.CONTRACT_ADDRESS);
        } catch (error) {
            console.error('Error loading contract:', error);
            this.showMessage('Failed to load smart contract', 'error');
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

            this.showMessage('Encrypting your vote...', 'info');

            // Encrypt the vote
            const encryptedVote = await this.encryptVote(this.selectedCandidate.id.toString());
            if (!encryptedVote) {
                this.showMessage('Failed to encrypt vote', 'error');
                return;
            }

            this.showMessage('Submitting vote to blockchain...', 'info');

            // Submit vote to blockchain
            const tx = await this.contract.methods.vote(encryptedVote).send({
                from: this.userAccount,
                gas: 200000
            });

            console.log('Vote transaction:', tx);

            this.showMessage(`Vote cast successfully! Transaction: ${tx.transactionHash}`, 'success');
            
            // Update display
            await this.updateDisplay();
            
            // Disable voting
            document.getElementById('vote-button').disabled = true;
            document.getElementById('vote-button').textContent = 'Vote Cast ✓';

        } catch (error) {
            console.error('Error casting vote:', error);
            let errorMessage = 'Failed to cast vote';
            
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
        }
    }

    async encryptVote(candidateId) {
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
    }

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
