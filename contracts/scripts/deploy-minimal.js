const { ethers } = require("hardhat");

async function main() {
  console.log("🔗 Minimal ZK Health Pass Deployment on Lisk...");
  console.log("=" .repeat(50));
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
  
  // Deploy only ZKProofVerifier (simplest contract)
  console.log("\n📋 Deploying ZKProofVerifier...");
  const ZKProofVerifier = await ethers.getContractFactory("ZKProofVerifier");
  
  // Use automatic gas estimation
  const zkProofVerifier = await ZKProofVerifier.deploy();
  await zkProofVerifier.waitForDeployment();
  
  const address = await zkProofVerifier.getAddress();
  console.log("✅ ZKProofVerifier deployed to:", address);
  console.log("🔗 Explorer:", `https://sepolia-blockscout.lisk.com/address/${address}`);
  
  return { zkProofVerifier: address };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error.message);
    process.exit(1);
  });
