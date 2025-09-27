const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging Deployment Issues...");
  console.log("=" .repeat(50));
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("📝 Account:", deployer.address);
  console.log("🌐 Network:", network.name, "| Chain ID:", network.chainId);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
  
  // Check nonce
  const nonce = await ethers.provider.getTransactionCount(deployer.address);
  console.log("🔢 Current nonce:", nonce);
  
  // Check pending nonce
  const pendingNonce = await ethers.provider.getTransactionCount(deployer.address, "pending");
  console.log("⏳ Pending nonce:", pendingNonce);
  
  if (nonce !== pendingNonce) {
    console.log("⚠️  WARNING: There are pending transactions!");
    console.log("   Difference:", pendingNonce - nonce, "pending transactions");
  }
  
  // Check gas price
  const gasPrice = await ethers.provider.getFeeData();
  console.log("⛽ Current gas price:", ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");
  
  // Test a simple transaction
  console.log("\n🧪 Testing simple transaction...");
  try {
    const tx = await deployer.sendTransaction({
      to: deployer.address,
      value: 0,
      gasLimit: 21000,
    });
    console.log("✅ Simple transaction successful:", tx.hash);
    await tx.wait();
    console.log("✅ Transaction confirmed");
  } catch (error) {
    console.log("❌ Simple transaction failed:", error.message);
  }
  
  console.log("\n" + "=" .repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Debug failed:", error);
    process.exit(1);
  });
