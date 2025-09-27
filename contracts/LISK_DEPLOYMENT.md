# 🔗 ZK Health Pass - Lisk Blockchain Deployment

This guide covers deploying the ZK Health Pass smart contracts on the Lisk blockchain network.

## 🌐 Why Lisk?

- **Low Transaction Fees**: Cost-effective for health record operations
- **EVM Compatibility**: Full Ethereum compatibility for easy migration
- **Fast Finality**: Quick transaction confirmation
- **Developer-Friendly**: Excellent tooling and documentation
- **Sustainable**: Energy-efficient blockchain infrastructure

## 🛠️ Prerequisites

### **1. Development Environment**
```bash
# Install Node.js and npm
node --version  # v18+ required
npm --version

# Install project dependencies
cd contracts
npm install
```

### **2. Wallet Setup**
- Create a new wallet or use existing one
- **Never use mainnet private keys for testing!**
- Get test ETH from Lisk Sepolia faucet

### **3. Get Test ETH**
For Lisk Sepolia testnet:
- Visit: https://faucet.sepolia-api.lisk.com/
- Enter your wallet address
- Request test ETH (you'll need ~0.01 ETH for deployment)

## ⚙️ Configuration

### **1. Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

Required environment variables:
```bash
# Your wallet private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Lisk RPC URLs (already configured)
LISK_RPC_URL=https://rpc.api.lisk.com
LISK_SEPOLIA_RPC_URL=https://rpc.sepolia-api.lisk.com

# Gas settings for Lisk
LISK_GAS_PRICE=1000000000
LISK_GAS_LIMIT=8000000
```

### **2. Network Configuration**
The Hardhat config includes Lisk networks:

```javascript
// Lisk Sepolia Testnet
liskSepolia: {
  url: "https://rpc.sepolia-api.lisk.com",
  accounts: [PRIVATE_KEY],
  chainId: 4202,
  gasPrice: 1000000000, // 1 gwei
},

// Lisk Mainnet
lisk: {
  url: "https://rpc.api.lisk.com",
  accounts: [PRIVATE_KEY],
  chainId: 1135,
  gasPrice: 1000000000, // 1 gwei
}
```

## 🚀 Deployment Process

### **1. Compile Contracts**
```bash
# Compile all smart contracts
npx hardhat compile

# Check for compilation errors
npx hardhat check
```

### **2. Deploy to Lisk Sepolia (Testnet)**
```bash
# Deploy to Lisk Sepolia testnet
npx hardhat run scripts/deploy-lisk.js --network liskSepolia
```

Expected output:
```
🔗 Deploying ZK Health Pass Smart Contracts on Lisk...
============================================================
📝 Deploying contracts with account: 0x...
💰 Account balance: 0.05 ETH
🌐 Network: liskSepolia | Chain ID: 4202
🧪 Deploying on Lisk Sepolia Testnet

============================================================
📋 1/3 Deploying ZKProofVerifier...
   Estimating gas...
   Estimated gas: 2,500,000
✅ ZKProofVerifier deployed to: 0x...
   Transaction hash: 0x...

🏥 2/3 Deploying HealthAuthorityRegistry...
✅ HealthAuthorityRegistry deployed to: 0x...

🔐 3/3 Deploying ZKHealthPassRegistry...
✅ ZKHealthPassRegistry deployed to: 0x...

============================================================
⚙️  Setting up initial configuration...
🔑 Setting up verification key for ECDSA proofs...
✅ Verification key set for ECDSA signature verification
👥 Setting up roles...
✅ Granted VERIFIER_ROLE to ZKProofVerifier contract

🏥 Registering sample health authority for testing...
✅ Sample health authority registered

🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉
============================================================
📋 Contract Addresses on Lisk:
   ZKProofVerifier: 0x...
   HealthAuthorityRegistry: 0x...
   ZKHealthPassRegistry: 0x...
============================================================
```

### **3. Deploy to Lisk Mainnet**
```bash
# Deploy to Lisk mainnet (use with caution!)
npx hardhat run scripts/deploy-lisk.js --network lisk
```

## 📊 Post-Deployment

### **1. Verify Contracts**
Lisk uses Blockscout for contract verification:

1. Visit the Lisk Blockscout explorer:
   - Testnet: https://sepolia-blockscout.lisk.com
   - Mainnet: https://blockscout.lisk.com

2. Navigate to your contract address
3. Click "Verify & Publish"
4. Upload your contract source code
5. Set compiler version to 0.8.20
6. Enable optimization (200 runs)

### **2. Update Backend Configuration**
Update your backend `.env` file with the deployed contract addresses:

```bash
# Lisk Contract Addresses
BLOCKCHAIN_NETWORK=lisk
BLOCKCHAIN_RPC_URL=https://rpc.sepolia-api.lisk.com
ZK_HEALTH_PASS_REGISTRY=0x...
ZK_PROOF_VERIFIER=0x...
HEALTH_AUTHORITY_REGISTRY=0x...
```

### **3. Test Integration**
```bash
# Test contract interaction
npx hardhat run scripts/test-integration.js --network liskSepolia
```

## 🔍 Contract Addresses

### **Lisk Sepolia Testnet**
After deployment, your contract addresses will be saved in:
`deployments/lisk-sepolia.json`

### **Lisk Mainnet**
After deployment, your contract addresses will be saved in:
`deployments/lisk-mainnet.json`

## 🧪 Testing on Lisk

### **1. Interact with Contracts**
```bash
# Open Hardhat console
npx hardhat console --network liskSepolia

# Get contract instance
const registry = await ethers.getContractAt("ZKHealthPassRegistry", "CONTRACT_ADDRESS");

# Check system stats
const stats = await registry.getSystemStats();
console.log("Total authorities:", stats.totalAuthorities.toString());
```

### **2. Submit Test Proof**
```javascript
// Submit a test ZK proof
const proofHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test_proof"));
const recordHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test_record"));
const authorityAddress = "0x..."; // Your authority address
const expiresAt = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
const proofData = "0x1234"; // Placeholder proof data

const tx = await registry.submitZKProof(
  proofHash,
  recordHash,
  authorityAddress,
  expiresAt,
  proofData
);
await tx.wait();
console.log("Proof submitted!");
```

### **3. Verify Proof**
```javascript
// Verify the submitted proof
const isValid = await registry.verifyZKProof(proofHash, "test_context");
console.log("Proof is valid:", isValid);
```

## 💰 Gas Costs on Lisk

Typical gas costs for ZK Health Pass operations:

| Operation | Gas Used | Cost (1 gwei) |
|-----------|----------|---------------|
| Deploy ZKProofVerifier | ~2,500,000 | ~0.0025 ETH |
| Deploy Registry | ~3,000,000 | ~0.003 ETH |
| Submit ZK Proof | ~150,000 | ~0.00015 ETH |
| Verify Proof | ~50,000 | ~0.00005 ETH |
| Register Authority | ~200,000 | ~0.0002 ETH |

## 🔧 Troubleshooting

### **Common Issues**

1. **Insufficient Balance**
   ```
   Error: insufficient funds for gas * price + value
   ```
   Solution: Get more test ETH from the faucet

2. **Gas Estimation Failed**
   ```
   Error: cannot estimate gas
   ```
   Solution: Increase gas limit in hardhat.config.js

3. **Network Connection Issues**
   ```
   Error: network connection timeout
   ```
   Solution: Check RPC URL and internet connection

### **Debug Commands**
```bash
# Check network connection
npx hardhat run scripts/check-network.js --network liskSepolia

# Verify contract deployment
npx hardhat verify --network liskSepolia CONTRACT_ADDRESS

# Check account balance
npx hardhat run scripts/check-balance.js --network liskSepolia
```

## 🌐 Lisk Network Information

### **Lisk Sepolia Testnet**
- **Chain ID**: 4202
- **RPC URL**: https://rpc.sepolia-api.lisk.com
- **Explorer**: https://sepolia-blockscout.lisk.com
- **Faucet**: https://faucet.sepolia-api.lisk.com/

### **Lisk Mainnet**
- **Chain ID**: 1135
- **RPC URL**: https://rpc.api.lisk.com
- **Explorer**: https://blockscout.lisk.com
- **Bridge**: https://bridge.lisk.com

## 📚 Additional Resources

- **Lisk Documentation**: https://docs.lisk.com/
- **Lisk Discord**: https://lisk.chat/
- **Hardhat Documentation**: https://hardhat.org/docs
- **OpenZeppelin Contracts**: https://docs.openzeppelin.com/contracts/

## 🚀 Next Steps

1. **Frontend Integration**: Connect your web app to Lisk contracts
2. **Mobile App**: Build mobile interface for health pass
3. **Authority Onboarding**: Register real health authorities
4. **Production Deployment**: Deploy to Lisk mainnet
5. **Monitoring**: Set up contract monitoring and alerts

---

**🎉 Congratulations! Your ZK Health Pass is now live on Lisk blockchain!**
