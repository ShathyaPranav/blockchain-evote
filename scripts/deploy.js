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
  
  // Add some sample candidates
  console.log("\nAdding sample candidates...");
  await evoting.addCandidate("Alice Johnson");
  await evoting.addCandidate("Bob Smith");
  await evoting.addCandidate("Carol Davis");
  
  // Authorize some voters (using the first few Hardhat accounts)
  const accounts = await ethers.getSigners();
  console.log("\nAuthorizing voters...");
  for (let i = 1; i < Math.min(accounts.length, 6); i++) {
    await evoting.authorizeVoter(accounts[i].address);
    console.log(`Authorized voter: ${accounts[i].address}`);
  }
  
  // Start voting
  await evoting.startVoting();
  console.log("\nVoting started!");
  
  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Owner Address: ${owner.address}`);
  console.log(`Network: ${ethers.provider._network?.name || 'localhost'}`);
  console.log("Candidates: Alice Johnson, Bob Smith, Carol Davis");
  console.log(`Authorized Voters: ${Math.min(accounts.length - 1, 5)}`);
  console.log("\n=== NEXT STEPS ===");
  console.log(`1. Copy contract address: ${contractAddress}`);
  console.log("2. Update backend environment variable: CONTRACT_ADDRESS");
  console.log("3. Update client/config.js with contract address");
  console.log("4. Generate RSA keys for vote encryption");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
