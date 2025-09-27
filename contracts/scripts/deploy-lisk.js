const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🔗 Deploying ZK Health Pass Smart Contracts on Lisk...");
  console.log("=" .repeat(60));
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  // Get balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  
  // Check if we have enough balance for deployment
  const minBalance = ethers.parseEther("0.01"); // 0.01 ETH minimum
  if (balance < minBalance) {
    console.log("⚠️  Warning: Low balance. You may need more ETH for deployment.");
    console.log("   Get Lisk Sepolia ETH from: https://faucet.sepolia-api.lisk.com/");
  }

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "| Chain ID:", network.chainId);
  
  if (network.chainId === 4202) {
    console.log("🧪 Deploying on Lisk Sepolia Testnet");
  } else if (network.chainId === 1135) {
    console.log("🚀 Deploying on Lisk Mainnet");
  } else {
    console.log("⚠️  Unknown network. Proceeding with deployment...");
  }

  console.log("\n" + "=" .repeat(60));

  // Deploy ZKProofVerifier
  console.log("📋 1/3 Deploying ZKProofVerifier...");
  const ZKProofVerifier = await ethers.getContractFactory("ZKProofVerifier");
  
  console.log("   Deploying with sufficient gas limit...");
  
  const zkProofVerifier = await ZKProofVerifier.deploy({
    gasLimit: 1500000, // Increased gas limit
    gasPrice: ethers.parseUnits("2", "gwei"), // Higher gas price to replace pending tx
  });
  await zkProofVerifier.waitForDeployment();
  console.log("✅ ZKProofVerifier deployed to:", await zkProofVerifier.getAddress());
  console.log("   Transaction hash:", zkProofVerifier.deploymentTransaction().hash);

  // Deploy HealthAuthorityRegistry (upgradeable)
  console.log("\n🏥 2/3 Deploying HealthAuthorityRegistry...");
  const HealthAuthorityRegistry = await ethers.getContractFactory("HealthAuthorityRegistry");
  
  const healthAuthorityRegistry = await upgrades.deployProxy(
    HealthAuthorityRegistry,
    [deployer.address], // admin address
    { 
      initializer: "initialize",
      gasLimit: 1000000, // Reduced gas limit for proxy deployment
    }
  );
  await healthAuthorityRegistry.waitForDeployment();
  console.log("✅ HealthAuthorityRegistry deployed to:", await healthAuthorityRegistry.getAddress());

  // Deploy ZKHealthPassRegistry (upgradeable)
  console.log("\n🔐 3/3 Deploying ZKHealthPassRegistry...");
  const ZKHealthPassRegistry = await ethers.getContractFactory("ZKHealthPassRegistry");
  
  const zkHealthPassRegistry = await upgrades.deployProxy(
    ZKHealthPassRegistry,
    [deployer.address], // admin address
    { 
      initializer: "initialize",
      gasLimit: 1000000, // Reduced gas limit for proxy deployment
    }
  );
  await zkHealthPassRegistry.waitForDeployment();
  console.log("✅ ZKHealthPassRegistry deployed to:", await zkHealthPassRegistry.getAddress());

  console.log("\n" + "=" .repeat(60));
  console.log("⚙️  Setting up initial configuration...");

  // Set verification key for ECDSA signature verification
  console.log("🔑 Setting up verification key for ECDSA proofs...");
  const dummyVkData = ethers.hexlify(ethers.randomBytes(32)); // Placeholder VK
  const setVkTx = await zkProofVerifier.setVerificationKey("ecdsa_signature_verification", dummyVkData);
  await setVkTx.wait();
  console.log("✅ Verification key set for ECDSA signature verification");

  // Grant roles
  console.log("👥 Setting up roles...");
  const AUTHORITY_MANAGER_ROLE = await zkHealthPassRegistry.AUTHORITY_MANAGER_ROLE();
  const VERIFIER_ROLE = await zkHealthPassRegistry.VERIFIER_ROLE();
  
  // Grant verifier role to the ZKProofVerifier contract
  const grantRoleTx = await zkHealthPassRegistry.grantRole(VERIFIER_ROLE, await zkProofVerifier.getAddress());
  await grantRoleTx.wait();
  console.log("✅ Granted VERIFIER_ROLE to ZKProofVerifier contract");

  // Register a sample health authority for testing (only on testnet)
  if (network.chainId === 4202) { // Lisk Sepolia
    console.log("\n🏥 Registering sample health authority for testing...");
    const samplePublicKey = "0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8";
    
    const registerTx = await zkHealthPassRegistry.registerHealthAuthority(
      deployer.address, // Use deployer as sample authority
      "Lisk Health Authority Demo",
      "hospital",
      samplePublicKey,
      "QmSampleCertificateHashForLiskDemo" // IPFS hash placeholder
    );
    await registerTx.wait();
    console.log("✅ Sample health authority registered");
  }

  // Display deployment summary
  console.log("\n" + "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉".padStart(50));
  console.log("=" .repeat(60));
  console.log("📋 Contract Addresses on Lisk:");
  console.log("   ZKProofVerifier:", await zkProofVerifier.getAddress());
  console.log("   HealthAuthorityRegistry:", await healthAuthorityRegistry.getAddress());
  console.log("   ZKHealthPassRegistry:", await zkHealthPassRegistry.getAddress());
  console.log("=" .repeat(60));

  // Calculate total gas used
  const zkVerifierReceipt = await zkProofVerifier.deploymentTransaction().wait();
  console.log("⛽ Gas Usage Summary:");
  console.log("   ZKProofVerifier:", zkVerifierReceipt.gasUsed.toString());
  console.log("   Total ETH spent: ~", ethers.formatEther(
    zkVerifierReceipt.gasUsed * zkVerifierReceipt.effectiveGasPrice
  ));

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: network.chainId,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    contracts: {
      ZKProofVerifier: {
        address: await zkProofVerifier.getAddress(),
        transactionHash: zkProofVerifier.deploymentTransaction().hash,
        gasUsed: zkVerifierReceipt.gasUsed.toString(),
      },
      HealthAuthorityRegistry: {
        address: await healthAuthorityRegistry.getAddress(),
        transactionHash: healthAuthorityRegistry.deploymentTransaction().hash,
      },
      ZKHealthPassRegistry: {
        address: await zkHealthPassRegistry.getAddress(),
        transactionHash: zkHealthPassRegistry.deploymentTransaction().hash,
      },
    },
    liskSpecific: {
      rpcUrl: network.chainId === 4202 ? "https://rpc.sepolia-api.lisk.com" : "https://rpc.api.lisk.com",
      explorer: network.chainId === 4202 ? "https://sepolia-blockscout.lisk.com" : "https://blockscout.lisk.com",
      faucet: network.chainId === 4202 ? "https://faucet.sepolia-api.lisk.com/" : null,
    }
  };

  // Create deployments directory if it doesn't exist
  if (!fs.existsSync("deployments")) {
    fs.mkdirSync("deployments");
  }

  const filename = `deployments/lisk-${network.chainId === 4202 ? 'sepolia' : 'mainnet'}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📁 Deployment info saved to ${filename}`);

  // Lisk-specific information
  console.log("\n🔗 Lisk Blockchain Information:");
  if (network.chainId === 4202) {
    console.log("   🧪 Network: Lisk Sepolia Testnet");
    console.log("   🌐 Explorer: https://sepolia-blockscout.lisk.com");
    console.log("   🚰 Faucet: https://faucet.sepolia-api.lisk.com/");
    console.log("   📚 Docs: https://docs.lisk.com/");
  } else if (network.chainId === 1135) {
    console.log("   🚀 Network: Lisk Mainnet");
    console.log("   🌐 Explorer: https://blockscout.lisk.com");
    console.log("   📚 Docs: https://docs.lisk.com/");
  }

  // Contract verification info
  console.log("\n🔍 Contract Verification:");
  console.log("   Lisk uses Blockscout for contract verification");
  console.log("   Visit the explorer and verify contracts manually:");
  console.log(`   - ZKProofVerifier: ${deploymentInfo.liskSpecific.explorer}/address/${zkProofVerifier.address}`);
  console.log(`   - HealthAuthorityRegistry: ${deploymentInfo.liskSpecific.explorer}/address/${healthAuthorityRegistry.address}`);
  console.log(`   - ZKHealthPassRegistry: ${deploymentInfo.liskSpecific.explorer}/address/${zkHealthPassRegistry.address}`);

  // Next steps
  console.log("\n🚀 Next Steps:");
  console.log("   1. Verify contracts on Blockscout explorer");
  console.log("   2. Update backend configuration with new contract addresses");
  console.log("   3. Test the integration with Lisk network");
  console.log("   4. Register real health authorities");
  console.log("   5. Start generating and verifying ZK proofs!");

  console.log("\n✨ Your ZK Health Pass is now live on Lisk! ✨");

  return {
    zkProofVerifier: await zkProofVerifier.getAddress(),
    healthAuthorityRegistry: await healthAuthorityRegistry.getAddress(),
    zkHealthPassRegistry: await zkHealthPassRegistry.getAddress(),
    network: network.name,
    chainId: network.chainId,
  };
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = main;
