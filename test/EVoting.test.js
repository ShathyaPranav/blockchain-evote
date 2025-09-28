const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EVoting Contract", function () {
  let EVoting, evoting, owner, voter1, voter2, voter3;

  beforeEach(async function () {
    // Get signers
    [owner, voter1, voter2, voter3] = await ethers.getSigners();
    
    // Deploy contract
    EVoting = await ethers.getContractFactory("EVoting");
    evoting = await EVoting.deploy();
    await evoting.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await evoting.owner()).to.equal(owner.address);
    });

    it("Should initialize with voting inactive", async function () {
      expect(await evoting.votingActive()).to.equal(false);
    });

    it("Should initialize with zero candidates", async function () {
      expect(await evoting.candidatesCount()).to.equal(0);
    });
  });

  describe("Candidate Management", function () {
    it("Should allow owner to add candidates", async function () {
      await evoting.addCandidate("Alice");
      expect(await evoting.candidatesCount()).to.equal(1);
      
      const candidate = await evoting.getCandidate(1);
      expect(candidate[1]).to.equal("Alice");
      expect(candidate[2]).to.equal(0); // vote count should be 0
    });

    it("Should not allow non-owner to add candidates", async function () {
      await expect(
        evoting.connect(voter1).addCandidate("Bob")
      ).to.be.revertedWithCustomError(evoting, "OwnableUnauthorizedAccount");
    });
  });

  describe("Voter Authorization", function () {
    it("Should allow owner to authorize voters", async function () {
      await evoting.authorizeVoter(voter1.address);
      expect(await evoting.authorizedVoters(voter1.address)).to.equal(true);
    });

    it("Should not allow non-owner to authorize voters", async function () {
      await expect(
        evoting.connect(voter1).authorizeVoter(voter2.address)
      ).to.be.revertedWithCustomError(evoting, "OwnableUnauthorizedAccount");
    });
  });

  describe("Voting Process", function () {
    beforeEach(async function () {
      // Setup for voting tests
      await evoting.addCandidate("Alice");
      await evoting.addCandidate("Bob");
      await evoting.authorizeVoter(voter1.address);
      await evoting.authorizeVoter(voter2.address);
    });

    it("Should not allow voting when inactive", async function () {
      await expect(
        evoting.connect(voter1).vote("encrypted_vote_for_alice")
      ).to.be.revertedWith("Voting is not active");
    });

    it("Should allow authorized voters to vote when active", async function () {
      await evoting.startVoting();
      
      await expect(evoting.connect(voter1).vote("encrypted_vote_for_alice"))
        .to.emit(evoting, "VoteCast")
        .withArgs(voter1.address, "encrypted_vote_for_alice", anyValue);
      
      expect(await evoting.hasVoted(voter1.address)).to.equal(true);
      expect(await evoting.getTotalVotes()).to.equal(1);
    });

    it("Should not allow unauthorized voters to vote", async function () {
      await evoting.startVoting();
      
      await expect(
        evoting.connect(voter3).vote("encrypted_vote")
      ).to.be.revertedWith("You are not authorized to vote");
    });

    it("Should not allow double voting", async function () {
      await evoting.startVoting();
      
      await evoting.connect(voter1).vote("encrypted_vote_1");
      
      await expect(
        evoting.connect(voter1).vote("encrypted_vote_2")
      ).to.be.revertedWith("You have already voted");
    });
  });

  describe("Vote Tallying", function () {
    beforeEach(async function () {
      await evoting.addCandidate("Alice");
      await evoting.addCandidate("Bob");
      await evoting.authorizeVoter(voter1.address);
      await evoting.authorizeVoter(voter2.address);
      await evoting.startVoting();
    });

    it("Should allow owner to increment candidate votes", async function () {
      await evoting.incrementCandidateVote(1);
      
      const candidate = await evoting.getCandidate(1);
      expect(candidate[2]).to.equal(1); // vote count should be 1
    });

    it("Should retrieve vote data correctly", async function () {
      await evoting.connect(voter1).vote("encrypted_alice_vote");
      
      const vote = await evoting.getVote(0);
      expect(vote[0]).to.equal(voter1.address);
      expect(vote[1]).to.equal("encrypted_alice_vote");
    });
  });

  describe("Utility Functions", function () {
    beforeEach(async function () {
      await evoting.addCandidate("Alice");
      await evoting.addCandidate("Bob");
      await evoting.addCandidate("Carol");
    });

    it("Should return all candidates", async function () {
      const candidates = await evoting.getAllCandidates();
      expect(candidates.length).to.equal(3);
      expect(candidates[0].name).to.equal("Alice");
      expect(candidates[1].name).to.equal("Bob");
      expect(candidates[2].name).to.equal("Carol");
    });

    it("Should return voting status", async function () {
      const [active, candidateCount, voteCount] = await evoting.getVotingStatus();
      expect(active).to.equal(false);
      expect(candidateCount).to.equal(3);
      expect(voteCount).to.equal(0);
    });
  });
});

// Helper function for testing events with timestamps
const anyValue = (value) => true;
