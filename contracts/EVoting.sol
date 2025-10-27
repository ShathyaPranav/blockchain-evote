// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract EVoting is Ownable {
    // Struct to represent a candidate
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }
    
// Struct to represent a vote with encrypted ballot
struct Vote {
    address voter;
    string encryptedBallot;  // RSA encrypted vote
    bytes signature;         // ECDSA signature for authentication
    uint256 timestamp;
    bytes32 commitment;      // For ZKP verification
}
    
    // State variables
    mapping(uint256 => Candidate) public candidates;
    mapping(address => bool) public hasVoted;
    mapping(address => bytes32) public voterCommitments; // For ZKP verification
    Vote[] public votes;
    
    uint256 public candidatesCount;
    bool public votingActive;
    
    // Events
    event VoteCast(address indexed voter, string encryptedBallot, uint256 timestamp);
    event CandidateAdded(uint256 indexed candidateId, string name);
    event VotingStarted();
    event VotingEnded();
    
    constructor() Ownable(msg.sender) {
        votingActive = false;
        candidatesCount = 0;
    }
    
    // Add a candidate (only owner)
    function addCandidate(string memory _name) public onlyOwner {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
        emit CandidateAdded(candidatesCount, _name);
    }
    
    // Register voter commitment for ZKP (replaces manual authorization)
    function registerVoterCommitment(bytes32 _commitment) public {
        require(voterCommitments[msg.sender] == bytes32(0), "Already registered");
        voterCommitments[msg.sender] = _commitment;
    }

    // Basic ZKP verification - proves vote is for valid candidate without revealing which
    function isValidVoteCommitment(bytes32 _commitment, address _voter) public view returns (bool) {
        // For demo purposes, just check if voter has registered
        // In production, this would verify a zero-knowledge proof
        return voterCommitments[_voter] != bytes32(0);
    }
    
    // Start voting (only owner)
    function startVoting() public onlyOwner {
        votingActive = true;
        emit VotingStarted();
    }
    
    // End voting (only owner)
    function endVoting() public onlyOwner {
        votingActive = false;
        emit VotingEnded();
    }
    
    // Cast vote with encrypted ballot
    function vote(string memory _encryptedBallot) public {
        require(votingActive, "Voting is not active");
        require(!hasVoted[msg.sender], "You have already voted");

        // For demo purposes, just store the encrypted vote
        // In production, would decrypt and validate the vote

        // Record the vote with encryption
        votes.push(Vote({
            voter: msg.sender,
            encryptedBallot: _encryptedBallot,
            signature: "", // No signature for now
            timestamp: block.timestamp,
            commitment: bytes32(0) // No commitment for now
        }));

        hasVoted[msg.sender] = true;
        emit VoteCast(msg.sender, _encryptedBallot, block.timestamp);
    }
    
    // Get candidate details
    function getCandidate(uint256 _candidateId) public view returns (uint256, string memory, uint256) {
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate ID");
        Candidate memory candidate = candidates[_candidateId];
        return (candidate.id, candidate.name, candidate.voteCount);
    }
    
    // Get all candidates
    function getAllCandidates() public view returns (Candidate[] memory) {
        Candidate[] memory allCandidates = new Candidate[](candidatesCount);
        for (uint256 i = 1; i <= candidatesCount; i++) {
            allCandidates[i-1] = candidates[i];
        }
        return allCandidates;
    }
    
    // Get total votes cast
    function getTotalVotes() public view returns (uint256) {
        return votes.length;
    }
    
    // Get encrypted vote by index (for tallying)
    function getVote(uint256 _index) public view returns (address, string memory, uint256) {
        require(_index < votes.length, "Invalid vote index");
        Vote memory v = votes[_index];
        return (v.voter, v.encryptedBallot, v.timestamp);
    }
    
    // Increment candidate vote count (only owner, used during tallying)
    function incrementCandidateVote(uint256 _candidateId) public onlyOwner {
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate ID");
        candidates[_candidateId].voteCount++;
    }
    
    // Get voting status
    function getVotingStatus() public view returns (bool, uint256, uint256) {
        return (votingActive, candidatesCount, votes.length);
    }
}
