const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Checking Account Balance on Lisk...");
  console.log("=" .repeat(50));
  
  const [account] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(account.address);
  const network = await ethers.provider.getNetwork();
  
  console.log("📝 Account:", account.address);
  console.log("🌐 Network:", network.name, "| Chain ID:", network.chainId);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
  
  // Check if balance is sufficient for deployment
  const minBalance = ethers.parseEther("0.01");
  if (balance < minBalance) {
    console.log("⚠️  Warning: Balance is low for deployment");
    if (network.chainId === 4202) {
      console.log("🚰 Get test ETH from: https://faucet.sepolia-api.lisk.com/");
    }
  } else {
    console.log("✅ Balance is sufficient for deployment");
  }
  
  console.log("=" .repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
