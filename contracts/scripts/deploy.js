const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("🚀 Deploying ZK Health Pass Smart Contracts...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.getBalance()).toString());

  // Deploy ZKProofVerifier
  console.log("\n📋 Deploying ZKProofVerifier...");
  const ZKProofVerifier = await ethers.getContractFactory("ZKProofVerifier");
  const zkProofVerifier = await ZKProofVerifier.deploy();
  await zkProofVerifier.deployed();
  console.log("✅ ZKProofVerifier deployed to:", zkProofVerifier.address);

  // Deploy HealthAuthorityRegistry (upgradeable)
  console.log("\n🏥 Deploying HealthAuthorityRegistry...");
  const HealthAuthorityRegistry = await ethers.getContractFactory("HealthAuthorityRegistry");
  const healthAuthorityRegistry = await upgrades.deployProxy(
    HealthAuthorityRegistry,
    [deployer.address], // admin address
    { initializer: "initialize" }
  );
  await healthAuthorityRegistry.deployed();
  console.log("✅ HealthAuthorityRegistry deployed to:", healthAuthorityRegistry.address);

  // Deploy ZKHealthPassRegistry (upgradeable)
  console.log("\n🔐 Deploying ZKHealthPassRegistry...");
  const ZKHealthPassRegistry = await ethers.getContractFactory("ZKHealthPassRegistry");
  const zkHealthPassRegistry = await upgrades.deployProxy(
    ZKHealthPassRegistry,
    [deployer.address], // admin address
    { initializer: "initialize" }
  );
  await zkHealthPassRegistry.deployed();
  console.log("✅ ZKHealthPassRegistry deployed to:", zkHealthPassRegistry.address);

  // Set up initial configuration
  console.log("\n⚙️  Setting up initial configuration...");

  // Set verification key for ECDSA signature verification
  console.log("🔑 Setting up verification key for ECDSA proofs...");
  const dummyVkData = ethers.utils.hexlify(ethers.utils.randomBytes(32)); // Placeholder VK
  await zkProofVerifier.setVerificationKey("ecdsa_signature_verification", dummyVkData);
  console.log("✅ Verification key set for ECDSA signature verification");

  // Grant roles
  console.log("👥 Setting up roles...");
  const AUTHORITY_MANAGER_ROLE = await zkHealthPassRegistry.AUTHORITY_MANAGER_ROLE();
  const VERIFIER_ROLE = await zkHealthPassRegistry.VERIFIER_ROLE();
  
  // Grant verifier role to the ZKProofVerifier contract
  await zkHealthPassRegistry.grantRole(VERIFIER_ROLE, zkProofVerifier.address);
  console.log("✅ Granted VERIFIER_ROLE to ZKProofVerifier contract");

  // Register a sample health authority for testing
  console.log("\n🏥 Registering sample health authority...");
  const samplePublicKey = "0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8";
  
  await zkHealthPassRegistry.registerHealthAuthority(
    deployer.address, // Use deployer as sample authority
    "Sample Health Authority",
    "hospital",
    samplePublicKey,
    "QmSampleCertificateHash" // IPFS hash placeholder
  );
  console.log("✅ Sample health authority registered");

  // Display deployment summary
  console.log("\n🎉 Deployment completed successfully!");
  console.log("=" .repeat(60));
  console.log("📋 Contract Addresses:");
  console.log("   ZKProofVerifier:", zkProofVerifier.address);
  console.log("   HealthAuthorityRegistry:", healthAuthorityRegistry.address);
  console.log("   ZKHealthPassRegistry:", zkHealthPassRegistry.address);
  console.log("=" .repeat(60));

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      ZKProofVerifier: zkProofVerifier.address,
      HealthAuthorityRegistry: healthAuthorityRegistry.address,
      ZKHealthPassRegistry: zkHealthPassRegistry.address,
    },
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  const fs = require("fs");
  fs.writeFileSync(
    `deployments/${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`📁 Deployment info saved to deployments/${hre.network.name}.json`);

  // Verification instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 To verify contracts on Etherscan, run:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${zkProofVerifier.address}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${healthAuthorityRegistry.address}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${zkHealthPassRegistry.address}`);
  }

  return {
    zkProofVerifier: zkProofVerifier.address,
    healthAuthorityRegistry: healthAuthorityRegistry.address,
    zkHealthPassRegistry: zkHealthPassRegistry.address,
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
