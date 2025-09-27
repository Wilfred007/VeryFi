#!/bin/bash

# ZK Health Pass - Lisk Deployment Script
# This script automates the complete deployment process to Lisk blockchain

set -e

echo "🔗 ZK Health Pass - Lisk Blockchain Deployment"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "contracts/package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Step 1: Installing contract dependencies..."
cd contracts

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "   Installing npm packages..."
    npm install
else
    echo "   ✅ Dependencies already installed"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo ""
    echo "⚙️  Step 2: Setting up environment configuration..."
    cp .env.example .env
    echo "   📝 Created .env file from template"
    echo ""
    echo "🔑 IMPORTANT: Please edit the .env file with your configuration:"
    echo "   1. Add your private key (without 0x prefix)"
    echo "   2. Make sure you have test ETH in your wallet"
    echo ""
    echo "   To get test ETH for Lisk Sepolia:"
    echo "   👉 Visit: https://faucet.sepolia-api.lisk.com/"
    echo ""
    read -p "   Press Enter after you've configured your .env file..."
else
    echo "✅ Step 2: Environment configuration found"
fi

echo ""
echo "💰 Step 3: Checking wallet balance..."
npm run check-balance -- --network liskSepolia

echo ""
echo "🔧 Step 4: Compiling smart contracts..."
npm run compile

echo ""
echo "🧪 Step 5: Running tests..."
npm test

echo ""
echo "🚀 Step 6: Deploying to Lisk Sepolia testnet..."
echo "   This will deploy all three contracts:"
echo "   - ZKProofVerifier"
echo "   - HealthAuthorityRegistry" 
echo "   - ZKHealthPassRegistry"
echo ""

npm run deploy:lisk-sepolia

echo ""
echo "✅ Step 7: Deployment completed!"

# Check if deployment file exists
if [ -f "deployments/lisk-sepolia.json" ]; then
    echo ""
    echo "📋 Contract addresses saved to: deployments/lisk-sepolia.json"
    echo ""
    echo "🔍 View your contracts on Lisk Sepolia Explorer:"
    
    # Extract contract addresses from deployment file
    ZK_VERIFIER=$(node -p "JSON.parse(require('fs').readFileSync('deployments/lisk-sepolia.json', 'utf8')).contracts.ZKProofVerifier.address")
    AUTHORITY_REGISTRY=$(node -p "JSON.parse(require('fs').readFileSync('deployments/lisk-sepolia.json', 'utf8')).contracts.HealthAuthorityRegistry.address")
    HEALTH_REGISTRY=$(node -p "JSON.parse(require('fs').readFileSync('deployments/lisk-sepolia.json', 'utf8')).contracts.ZKHealthPassRegistry.address")
    
    echo "   ZKProofVerifier: https://sepolia-blockscout.lisk.com/address/$ZK_VERIFIER"
    echo "   HealthAuthorityRegistry: https://sepolia-blockscout.lisk.com/address/$AUTHORITY_REGISTRY"
    echo "   ZKHealthPassRegistry: https://sepolia-blockscout.lisk.com/address/$HEALTH_REGISTRY"
fi

echo ""
echo "🎯 Next Steps:"
echo "   1. Verify your contracts on Blockscout explorer"
echo "   2. Update your backend .env with the contract addresses"
echo "   3. Test the integration with your ZK Health Pass system"
echo "   4. Register real health authorities"
echo ""

# Update backend configuration
echo "🔧 Step 8: Updating backend configuration..."
cd ../backend

if [ -f ".env" ]; then
    # Backup existing .env
    cp .env .env.backup
    echo "   📋 Backed up existing backend .env to .env.backup"
fi

# Add blockchain configuration to backend .env
cat >> .env << EOF

# Lisk Blockchain Configuration (added by deployment script)
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_NETWORK=lisk-sepolia
BLOCKCHAIN_RPC_URL=https://rpc.sepolia-api.lisk.com
ZK_HEALTH_PASS_REGISTRY_ADDRESS=$HEALTH_REGISTRY
ZK_PROOF_VERIFIER_ADDRESS=$ZK_VERIFIER
HEALTH_AUTHORITY_REGISTRY_ADDRESS=$AUTHORITY_REGISTRY
# BLOCKCHAIN_PRIVATE_KEY=your_private_key_here (add manually for security)
EOF

echo "   ✅ Updated backend .env with contract addresses"
echo "   ⚠️  Remember to add your BLOCKCHAIN_PRIVATE_KEY to backend/.env"

cd ..

echo ""
echo "🎉 ZK Health Pass Successfully Deployed to Lisk!"
echo "=============================================="
echo ""
echo "📊 Deployment Summary:"
echo "   ✅ Smart contracts deployed to Lisk Sepolia"
echo "   ✅ Backend configuration updated"
echo "   ✅ Ready for integration testing"
echo ""
echo "🔗 Your ZK Health Pass is now live on Lisk blockchain!"
echo "   Network: Lisk Sepolia Testnet"
echo "   Explorer: https://sepolia-blockscout.lisk.com"
echo "   Faucet: https://faucet.sepolia-api.lisk.com/"
echo ""
echo "📚 Next: Follow the integration guide in contracts/LISK_DEPLOYMENT.md"
