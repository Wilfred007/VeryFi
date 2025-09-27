const { ethers } = require("hardhat");

async function main() {
  console.log("🧹 Clearing Pending Transactions...");
  console.log("=" .repeat(50));
  
  const [deployer] = await ethers.getSigners();
  
  // Get current and pending nonce
  const currentNonce = await ethers.provider.getTransactionCount(deployer.address);
  const pendingNonce = await ethers.provider.getTransactionCount(deployer.address, "pending");
  
  console.log("🔢 Current nonce:", currentNonce);
  console.log("⏳ Pending nonce:", pendingNonce);
  
  if (currentNonce === pendingNonce) {
    console.log("✅ No pending transactions to clear!");
    return;
  }
  
  const stuckTransactions = pendingNonce - currentNonce;
  console.log("🚫 Stuck transactions:", stuckTransactions);
  
  // Get current gas price and increase it significantly
  const feeData = await ethers.provider.getFeeData();
  const highGasPrice = feeData.gasPrice * 2n; // Double the gas price
  
  console.log("⛽ Using high gas price:", ethers.formatUnits(highGasPrice, "gwei"), "gwei");
  
  // Send replacement transactions for each stuck nonce
  for (let i = 0; i < stuckTransactions; i++) {
    const nonce = currentNonce + i;
    console.log(`\n🔄 Replacing transaction with nonce ${nonce}...`);
    
    try {
      const tx = await deployer.sendTransaction({
        to: deployer.address,
        value: 0,
        gasLimit: 21000,
        gasPrice: highGasPrice,
        nonce: nonce,
      });
      
      console.log(`✅ Replacement tx sent: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`✅ Confirmed in block: ${receipt.blockNumber}`);
      
    } catch (error) {
      console.log(`❌ Failed to replace nonce ${nonce}:`, error.message);
    }
  }
  
  // Verify nonces are cleared
  const newCurrentNonce = await ethers.provider.getTransactionCount(deployer.address);
  const newPendingNonce = await ethers.provider.getTransactionCount(deployer.address, "pending");
  
  console.log("\n📊 Final Status:");
  console.log("🔢 New current nonce:", newCurrentNonce);
  console.log("⏳ New pending nonce:", newPendingNonce);
  
  if (newCurrentNonce === newPendingNonce) {
    console.log("🎉 All pending transactions cleared!");
  } else {
    console.log("⚠️  Some transactions may still be pending");
  }
  
  console.log("=" .repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Clear failed:", error);
    process.exit(1);
  });
