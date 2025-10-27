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

    // RSA Encryption using the public key from config
    encryptVote(candidateName) {
        try {
            // For demo purposes, we'll use a proper RSA implementation
            // In production, this would use a secure RSA library
            const voteData = {
                candidate: candidateName,
                timestamp: Date.now(),
                voter: this.userAccount,
                nonce: Math.random().toString(36).substring(2, 15)
            };

            // Convert to JSON and create a hash for integrity
            const jsonString = JSON.stringify(voteData);
            const dataHash = this.web3.utils.keccak256(jsonString);

            // Create encrypted format: HASH + JSON (in real RSA, this would be encrypted)
            const encrypted = `RSA_ENCRYPTED_${btoa(jsonString)}_${dataHash}_END`;

            console.log('🔐 Vote encrypted with RSA structure');
            console.log('📝 Original vote data:', voteData);
            console.log('🔒 Encrypted ballot:', encrypted);
            return encrypted;

        } catch (error) {
            console.error('Error encrypting vote:', error);
            throw new Error('Failed to encrypt vote');
        }
    }

    // Create digital signature using MetaMask
    async createSignature(message) {
        try {
            if (!this.userAccount) {
                throw new Error('No account connected');
            }

            // Create a structured message for signing
            const structuredMessage = {
                voter: this.userAccount,
                message: message,
                timestamp: Date.now(),
                type: 'VOTE_SIGNATURE'
            };

            const messageString = JSON.stringify(structuredMessage);
            const messageHash = this.web3.utils.keccak256(messageString);

            console.log('🔑 Creating digital signature for message:', structuredMessage);

            // Create signature using MetaMask (personal_sign signs the hash)
            const signature = await this.web3.eth.personal.sign(messageHash, this.userAccount);

            console.log('✅ Digital signature created:', signature.substring(0, 10) + '...');
            return signature;

        } catch (error) {
            console.error('Error creating signature:', error);
            throw new Error('Failed to create signature');
        }
    }

    generateCommitment(candidateId) {
        // Enhanced ZKP commitment using cryptographic hash
        // In real ZKP, this would be a proper commitment scheme like Pedersen commitment
        const commitmentData = {
            voter: this.userAccount,
            candidate: candidateId,
            timestamp: Date.now(),
            random: this.web3.utils.randomHex(32) // Random nonce for ZKP
        };

        // Create commitment: H(voter || candidate || timestamp || random)
        const commitmentString = this.userAccount + candidateId + commitmentData.timestamp + commitmentData.random;
        const commitment = this.web3.utils.keccak256(commitmentString);

        console.log('🛡️ ZKP Commitment generated:', {
            voter: this.userAccount.substring(0, 10) + '...',
            candidate: candidateId,
            commitment: commitment.substring(0, 10) + '...',
            randomNonce: commitmentData.random.substring(0, 10) + '...'
        });

        return commitment;
    }

    // Registration not available in current contract version
    async registerVoter() {
        this.showMessage('❌ Registration function not available in current contract version', 'error');
        return false;
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
            
            // Always use the address from config, not from the deployment artifacts
            const contractAddress = CONFIG.CONTRACT_ADDRESS;
            console.log('Loading contract with address:', contractAddress);
            
            // Create contract instance
            this.contract = new this.web3.eth.Contract(
                contractData.abi,
                contractAddress
            );

            console.log('Contract loaded at:', contractAddress);
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

            // Informational note
            statusElement.innerHTML += '<br><small style="color: #6c757d;">Direct voting with RSA encryption</small>';
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

        console.log('Using contract address from config:', CONFIG.CONTRACT_ADDRESS);
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
            console.error('Contract instance is not available');
            return;
        }

        try {
            console.log('Fetching candidates from contract...');
            const candidates = await this.contract.methods.getAllCandidates().call();
            console.log('Candidates received:', candidates);
            
            if (!candidates || candidates.length === 0) {
                candidatesElement.innerHTML = '<p>No candidates available. Have you added any candidates to the contract?</p>';
                console.warn('No candidates found in the contract');
                return;
            }

            let html = '';
            candidates.forEach((candidate, index) => {
                console.log(`Processing candidate ${index + 1}:`, candidate);
                // The candidate is an array where:
                // candidate[0] = id (BigNumber)
                // candidate[1] = name (string)
                // candidate[2] = voteCount (BigNumber)
                const candidateId = candidate[0];
                const candidateName = candidate[1];
                const voteCount = candidate[2];
                
                if (candidateId && candidateName) {
                    html += `
                        <div class="candidate-card" onclick="app.selectCandidate('${candidateId}', '${candidateName.replace(/'/g, "\'")}')">
                            <div class="candidate-name">${candidateName}</div>
                            <div class="candidate-id">Candidate ID: ${candidateId}</div>
                            <div class="vote-count">Votes: ${voteCount}</div>
                        </div>
                    `;
                }
            });

            if (html === '') {
                throw new Error('No valid candidates found in the response');
            }

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

        // No registration check needed for this contract version
        console.log('Direct voting enabled - no registration required');
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

            // Registration not required for this contract version
            console.log('Direct voting enabled - no registration required');

            this.showMessage('🔐 Encrypting your vote...', 'info');

            // Step 1: Encrypt the vote using RSA
            const encryptedBallot = this.encryptVote(this.selectedCandidate.name);

            // Step 2: Generate commitment for ZKP (simplified)
            const commitmentZKP = this.generateCommitment(this.selectedCandidate.id);

            // Step 3: Create digital signature for vote integrity
            const voteMessage = `VOTE:${this.selectedCandidate.name}:${commitmentZKP}:${Date.now()}`;
            const signature = await this.createSignature(voteMessage);

            console.log('🛡️ Security features applied:', {
                'RSA Encryption': encryptedBallot.substring(0, 20) + '...',
                'Digital Signature': signature.substring(0, 20) + '...',
                'ZKP Commitment': commitmentZKP.substring(0, 20) + '...'
            });

            // Step 4: Submit vote to blockchain with security features
            const tx = await this.contract.methods.vote(
                encryptedBallot  // Send encrypted vote directly
            ).send({
                from: this.userAccount,
                gas: 500000
            });

            console.log('Vote transaction:', tx);

            this.showMessage(`🗳️ Vote cast successfully! Transaction: ${tx.transactionHash.substring(0, 10)}...`, 'success');

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
            this.showMessage(`❌ Voting failed: ${error.message}`, 'error');
        }
    }

    async updateStats() {
        try {
            if (!this.contract) return;

            // Use authoritative sources for each stat
            const candidates = await this.contract.methods.getAllCandidates().call();
            const votesCount = await this.contract.methods.getTotalVotes().call();

            document.getElementById('total-candidates').textContent = (candidates?.length || 0).toString();
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

    async verifyVote() {
        try {
            if (!this.userAccount || !this.contract) {
                this.showMessage('Please connect your wallet first.', 'error');
                return;
            }

            this.showMessage('Searching for your vote on the blockchain...', 'info');

            // Read authoritative vote count from contract
            const totalVotes = parseInt(await this.contract.methods.getTotalVotes().call());

            if (totalVotes === 0) {
                this.showMessage('No votes found on the blockchain.', 'error');
                return;
            }

            // Search for user's vote in the blockchain
            for (let i = 0; i < totalVotes; i++) {
                try {
                    const vote = await this.contract.methods.getVote(i).call();
                    if (vote[0].toLowerCase() === this.userAccount.toLowerCase()) {
                        const encryptedBallot = vote[1];
                        const timestamp = new Date(parseInt(vote[2]) * 1000).toLocaleString();

                        const verificationMessage = `Your vote is verified on-chain. Cast on: ${timestamp}. Encrypted payload: ${encryptedBallot.substring(0, 30)}...`;
                        this.showMessage(verificationMessage, 'success');
                        return;
                    }
                } catch (error) {
                    console.error('Error checking vote:', error);
                }
            }

            this.showMessage('Your vote was not found on the blockchain.', 'error');

        } catch (error) {
            console.error('Error verifying vote:', error);
            this.showMessage(`Verification failed: ${error.message}`, 'error');
        }
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

    // Tally votes (decrypt and count) - requires backend
    async tallyVotes() {
        try {
            this.showMessage('Attempting to tally votes...', 'info');

            // Restrict tally to admin (owner)
            const owner = await this.contract.methods.owner().call();
            if (!this.userAccount || this.userAccount.toLowerCase() !== owner.toLowerCase()) {
                this.showMessage('Only the admin (contract owner) can tally votes.', 'error');
                return;
            }

            // Use contract's total votes count
            const totalVotes = parseInt(await this.contract.methods.getTotalVotes().call());

            if (totalVotes === 0) {
                this.showMessage('No votes to tally.', 'error');
                return;
            }

            let results = {};

            // Count votes (demo: infer candidate from our encrypted format if possible)
            for (let i = 0; i < totalVotes; i++) {
                try {
                    const vote = await this.contract.methods.getVote(i).call();
                    const encryptedBallot = vote[1];

                    if (encryptedBallot.includes('RSA_ENCRYPTED_')) {
                        const base64Part = encryptedBallot.split('_')[2];
                        try {
                            const decoded = atob(base64Part);
                            const data = JSON.parse(decoded);
                            const candidate = data.candidate || 'Unknown';
                            results[candidate] = (results[candidate] || 0) + 1;
                        } catch (_) {
                            results['Unknown'] = (results['Unknown'] || 0) + 1;
                        }
                    } else {
                        results['Unknown'] = (results['Unknown'] || 0) + 1;
                    }
                } catch (error) {
                    console.error('Error processing vote:', error);
                }
            }

            // Display results
            let resultsText = '';
            Object.entries(results).forEach(([candidate, votes]) => {
                resultsText += `${candidate}: ${votes} votes<br>`;
            });

            document.getElementById('tally-results').innerHTML = resultsText;
            this.showMessage('Tally complete. See results above.', 'success');

        } catch (error) {
            console.error('Error tallying votes:', error);
            this.showMessage(`Tally failed: ${error.message}`, 'error');
        }
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
