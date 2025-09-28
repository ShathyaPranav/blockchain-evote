from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from web3 import Web3
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
import base64

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
CONTRACT_ADDRESS = os.getenv('CONTRACT_ADDRESS')
PRIVATE_KEY_PATH = os.getenv('PRIVATE_KEY_PATH', '../authority_private_key.pem')
PROVIDER_URL = os.getenv('PROVIDER', 'http://127.0.0.1:8545')

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(PROVIDER_URL))

# Contract ABI (simplified for the methods we need)
CONTRACT_ABI = [
    {
        "inputs": [],
        "name": "getTotalVotes",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_index", "type": "uint256"}],
        "name": "getVote",
        "outputs": [
            {"internalType": "address", "name": "", "type": "address"},
            {"internalType": "string", "name": "", "type": "string"},
            {"internalType": "uint256", "name": "", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_candidateId", "type": "uint256"}],
        "name": "getCandidate",
        "outputs": [
            {"internalType": "uint256", "name": "", "type": "uint256"},
            {"internalType": "string", "name": "", "type": "string"},
            {"internalType": "uint256", "name": "", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
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
        "inputs": [{"internalType": "uint256", "name": "_candidateId", "type": "uint256"}],
        "name": "incrementCandidateVote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "candidatesCount",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]

def load_private_key():
    """Load the RSA private key for decryption"""
    try:
        with open(PRIVATE_KEY_PATH, 'rb') as key_file:
            private_key = serialization.load_pem_private_key(
                key_file.read(),
                password=None,
                backend=default_backend()
            )
        return private_key
    except Exception as e:
        print(f"Error loading private key: {e}")
        return None

def decrypt_vote(encrypted_vote_base64, private_key):
    """Decrypt a base64 encoded encrypted vote"""
    try:
        encrypted_vote = base64.b64decode(encrypted_vote_base64)
        decrypted_vote = private_key.decrypt(
            encrypted_vote,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        return decrypted_vote.decode('utf-8')
    except Exception as e:
        print(f"Error decrypting vote: {e}")
        return None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'contract_address': CONTRACT_ADDRESS,
        'provider': PROVIDER_URL,
        'connected': w3.is_connected()
    })

@app.route('/candidates', methods=['GET'])
def get_candidates():
    """Get all candidates"""
    try:
        if not CONTRACT_ADDRESS:
            return jsonify({'error': 'Contract address not configured'}), 400
        
        contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)
        candidates = contract.functions.getAllCandidates().call()
        
        candidates_list = []
        for candidate in candidates:
            candidates_list.append({
                'id': candidate[0],
                'name': candidate[1],
                'voteCount': candidate[2]
            })
        
        return jsonify({'candidates': candidates_list})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/tally', methods=['POST'])
def tally_votes():
    """Decrypt and tally all votes (Authority only)"""
    try:
        if not CONTRACT_ADDRESS:
            return jsonify({'error': 'Contract address not configured'}), 400
        
        # Load private key
        private_key = load_private_key()
        if not private_key:
            return jsonify({'error': 'Failed to load private key'}), 500
        
        contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)
        
        # Get total number of votes
        total_votes = contract.functions.getTotalVotes().call()
        print(f"Total votes to decrypt: {total_votes}")
        
        if total_votes == 0:
            return jsonify({'message': 'No votes to tally', 'results': []})
        
        # Initialize vote counts
        vote_counts = {}
        decryption_errors = 0
        
        # Process each vote
        for i in range(total_votes):
            try:
                # Get encrypted vote from blockchain
                voter_address, encrypted_vote, timestamp = contract.functions.getVote(i).call()
                
                # Decrypt the vote
                decrypted_vote = decrypt_vote(encrypted_vote, private_key)
                
                if decrypted_vote:
                    candidate_id = int(decrypted_vote)
                    vote_counts[candidate_id] = vote_counts.get(candidate_id, 0) + 1
                    print(f"Vote {i}: Voter {voter_address} voted for candidate {candidate_id}")
                else:
                    decryption_errors += 1
                    print(f"Vote {i}: Failed to decrypt vote from {voter_address}")
                    
            except Exception as e:
                decryption_errors += 1
                print(f"Error processing vote {i}: {e}")
        
        # Get candidate information and compile results
        results = []
        try:
            candidates_count = contract.functions.candidatesCount().call()
            for candidate_id in range(1, candidates_count + 1):
                candidate_info = contract.functions.getCandidate(candidate_id).call()
                results.append({
                    'candidate_id': candidate_id,
                    'name': candidate_info[1],
                    'votes': vote_counts.get(candidate_id, 0)
                })
        except Exception as e:
            print(f"Error getting candidate info: {e}")
        
        return jsonify({
            'message': 'Vote tallying completed',
            'total_votes_processed': total_votes,
            'decryption_errors': decryption_errors,
            'results': results
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/votes', methods=['GET'])
def get_vote_summary():
    """Get summary of votes (without decryption)"""
    try:
        if not CONTRACT_ADDRESS:
            return jsonify({'error': 'Contract address not configured'}), 400
        
        contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)
        total_votes = contract.functions.getTotalVotes().call()
        
        votes_summary = []
        for i in range(min(total_votes, 10)):  # Limit to first 10 for demo
            voter_address, encrypted_vote, timestamp = contract.functions.getVote(i).call()
            votes_summary.append({
                'index': i,
                'voter': voter_address,
                'timestamp': timestamp,
                'encrypted_data_length': len(encrypted_vote)
            })
        
        return jsonify({
            'total_votes': total_votes,
            'votes_sample': votes_summary
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🗳️  Blockchain E-Vote Backend Starting...")
    print(f"Contract Address: {CONTRACT_ADDRESS}")
    print(f"Provider: {PROVIDER_URL}")
    print(f"Private Key Path: {PRIVATE_KEY_PATH}")
    print(f"Web3 Connected: {w3.is_connected()}")
    
    app.run(debug=True, host='127.0.0.1', port=5000)
