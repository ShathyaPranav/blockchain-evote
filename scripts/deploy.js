const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying EVoting contract...");
  
  // Get the contract factory
  const EVoting = await ethers.getContractFactory("EVoting");
  
  // Deploy the contract
  const evoting = await EVoting.deploy();
  await evoting.waitForDeployment();
  
  const contractAddress = await evoting.getAddress();
  console.log("EVoting contract deployed to:", contractAddress);
  
  // Get the deployer (owner) address
  const [owner] = await ethers.getSigners();
  console.log("Contract owner:", owner.address);
  
  // Add 20 sample candidates
  console.log("\nAdding sample candidates...");
  const candidates = [
    "Alice Johnson",
    "Bob Smith",
    "Carol Davis",
    "David Thompson",
    "Emily Clark",
    "Franklin Moore",
    "Grace Lee",
    "Henry Wilson",
    "Isabella Martinez",
    "Jack Anderson",
    "Katherine Nguyen",
    "Liam Rodriguez",
    "Mia Patel",
    "Noah Kim",
    "Olivia Brown",
    "Peter Walker",
    "Quinn Harris",
    "Ryan Young",
    "Sophia Turner",
    "Thomas Perez"
  ];
  for (const name of candidates) {
    const tx = await evoting.addCandidate(name);
    await tx.wait();
  }

  // Note: No manual voter authorization needed - voters self-register with crypto proofs
  console.log("\n✅ Voters can now self-register using cryptographic commitments");
  console.log("🔐 This provides Sybil resistance through digital signatures");

  // Start voting
  await evoting.startVoting();
  console.log("\nVoting started!");
  
  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Owner Address: ${owner.address}`);
  console.log(`Network: ${ethers.provider._network?.name || 'localhost'}`);
  console.log(`Candidates: ${candidates.join(', ')}`);
  console.log("🔐 Security Features:");
  console.log("  • RSA encryption for vote confidentiality");
  console.log("  • ECDSA signatures for voter authentication");
  console.log("  • ZKP commitments for vote validity");
  console.log("  • Self-registration (no manual authorization needed)");

  console.log("\n=== NEXT STEPS ===");
  console.log(`1. Copy contract address: ${contractAddress}`);
  console.log("2. Update backend environment variable: CONTRACT_ADDRESS");
  console.log("3. Update client/config.js with contract address");
  console.log("4. Test the new security features:");
  console.log("   • Connect wallet and register voter");
  console.log("   • Select candidate and cast encrypted vote");
  console.log("   • Verify vote was recorded with signature");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
