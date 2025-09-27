# 🔐 ZK Health Pass Frontend

A modern React TypeScript application for managing zero-knowledge health proofs on the Lisk blockchain.

## 🌟 Features

- **🔒 Privacy-First**: Zero-knowledge proofs ensure health data remains private
- **🌐 Blockchain Integration**: Built on Lisk Sepolia testnet
- **👥 Authority Management**: Register and manage health authorities
- **🛡️ Proof Verification**: Verify health proofs cryptographically
- **📊 Real-time Analytics**: System statistics and monitoring
- **💳 Wallet Integration**: Connect with MetaMask and other Web3 wallets
- **📱 Responsive Design**: Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MetaMask or compatible Web3 wallet
- Test ETH on Lisk Sepolia (get from [faucet](https://faucet.sepolia-api.lisk.com/))

### Installation

1. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Open application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# WalletConnect Project ID (optional)
REACT_APP_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# Contract Addresses (pre-configured for Lisk Sepolia)
REACT_APP_HEALTH_AUTHORITY_REGISTRY=0xF0AcD34E64736F6AB60E39088469ae86fF165AA9
REACT_APP_ZK_HEALTH_PASS_REGISTRY=0x749AFac3004131CF8DB9e820Bc6D9f3F654Ab44F

# Network Configuration
REACT_APP_CHAIN_ID=4202
REACT_APP_NETWORK_NAME=Lisk Sepolia
REACT_APP_RPC_URL=https://rpc.sepolia-api.lisk.com
```

### Wallet Setup

1. **Install MetaMask** or compatible Web3 wallet
2. **Add Lisk Sepolia Network**:
   - Network Name: `Lisk Sepolia`
   - RPC URL: `https://rpc.sepolia-api.lisk.com`
   - Chain ID: `4202`
   - Currency Symbol: `ETH`
   - Block Explorer: `https://sepolia-blockscout.lisk.com`

3. **Get Test ETH**:
   - Visit [Lisk Sepolia Faucet](https://faucet.sepolia-api.lisk.com/)
   - Request test ETH for your wallet address

## 📱 Application Features

### 🏠 Dashboard
- Overview of health passes and system statistics
- Quick access to all major features
- Real-time network status

### 🛡️ Health Pass Manager
- Create new ZK health proofs
- View existing proofs and their status
- Track verification history
- Export proof data

### 👥 Authority Manager
- Apply to become a health authority
- View registered authorities
- Manage authority applications
- Authority verification status

### 🔍 Proof Verifier
- Verify ZK health proofs
- View verification history
- Batch verification (coming soon)
- QR code scanning (coming soon)

### 📊 System Statistics
- Real-time system metrics
- Network health monitoring
- Authority and proof analytics
- Recent activity feed

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Web3**: Wagmi + RainbowKit
- **State Management**: React Query
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

### Project Structure
```
src/
├── components/          # React components
│   ├── Dashboard.tsx    # Main dashboard
│   ├── Header.tsx       # Navigation header
│   ├── HealthPassManager.tsx
│   ├── authorityManager.tsx
│   ├── ProofVerifier.tsx
│   └── SystemStats.tsx
├── config/             # Configuration files
│   ├── contracts.ts    # Contract addresses & types
│   ├── abis.ts        # Smart contract ABIs
│   └── wagmi.ts       # Web3 configuration
├── App.tsx            # Main application component
└── index.css          # Global styles
```

## 🔗 Smart Contract Integration

The frontend integrates with deployed smart contracts on Lisk Sepolia:

- **HealthAuthorityRegistry**: `0xF0AcD34E64736F6AB60E39088469ae86fF165AA9`
- **ZKHealthPassRegistry**: `0x749AFac3004131CF8DB9e820Bc6D9f3F654Ab44F`

### Key Functions
- Submit health authority applications
- Create and submit ZK proofs
- Verify proof validity
- Query system statistics

## 🧪 Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `build/` directory.

## 🔧 Troubleshooting

### Common Issues

1. **Wallet Connection Issues**
   - Ensure MetaMask is installed and unlocked
   - Check that you're on the Lisk Sepolia network
   - Verify you have sufficient test ETH

2. **Transaction Failures**
   - Check your ETH balance for gas fees
   - Ensure contract addresses are correct
   - Verify network connectivity

3. **Build Errors**
   - Use `--legacy-peer-deps` flag with npm install
   - Clear node_modules and reinstall if needed

### Getting Help

- Check the [Lisk Documentation](https://docs.lisk.com/)
- Visit [Lisk Discord](https://lisk.chat/) for community support
- Review smart contract code in `../contracts/`

## 🔗 Related

- [Smart Contracts](../contracts/) - Solidity contracts
- [ZK Circuit](../noir/) - Noir zero-knowledge circuit
- [Input Generator](../generate_inputs/) - Rust ECDSA signature generator
- [Backend API](../backend/) - Rust backend service
