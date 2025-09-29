# ZK Health Pass - Midnight MCP Server Integration

A Model Context Protocol (MCP) server implementation for the ZK Health Pass system, providing AI agent integration with the Midnight blockchain network and zero-knowledge health verification capabilities.

## Overview

This integration combines the privacy-preserving ZK Health Pass system with the Midnight blockchain network through an MCP server, enabling AI agents to interact with health verification proofs while maintaining patient privacy.

### Key Features

- **Zero-Knowledge Health Proofs**: Generate and verify health credentials without revealing sensitive data
- **Midnight Blockchain Integration**: Store proof hashes on the Midnight network
- **AI Agent Interface**: MCP-compliant server for natural language interactions
- **Privacy-First Design**: Patient data is hashed and never stored on-chain
- **Multi-Agent Support**: Isolated storage and wallet management per agent

## Architecture

```
ZK Health Pass + Midnight MCP Integration
├── Wallet Server (server.ts)     # HTTP API for wallet operations
├── STDIO Server (stdio-server.ts) # MCP protocol interface
├── Health Pass Service           # ZK proof generation and management
├── Wallet Service               # Midnight network operations
└── Agent Storage               # Isolated data per agent
```

## Prerequisites

- Node.js (v18.20.5+)
- TypeScript
- Docker and Docker Compose (for production)
- Access to Midnight network (TestNet/MainNet)

## Quick Start

### 1. Install Dependencies

```bash
cd midnight-mcp
npm install
```

### 2. Set Up Agent

```bash
# Generate a new agent with auto-generated seed
npm run setup-agent -- -a health-pass-agent-1

# Or with custom configuration
npm run setup-agent -- -a health-pass-agent-1 -w 24 -p "secure-password"
```

### 3. Configure Environment

```bash
# Copy and customize environment variables
cp .env.example .env

# Edit the .env file with your configuration
nano .env
```

### 4. Start Development Server

```bash
# Start the wallet server
AGENT_ID=health-pass-agent-1 npm run dev

# In another terminal, test the MCP server
AGENT_ID=health-pass-agent-1 npm run start:mcp
```

## MCP Integration with AI Agents

### ElizaOS Integration

1. **Install ElizaOS CLI**:
   ```bash
   npm install -g @elizaos/cli@beta
   ```

2. **Create ElizaOS Project**:
   ```bash
   elizaos create
   cd my-health-agent
   ```

3. **Install MCP Plugin**:
   ```bash
   bun add @fleek-platform/eliza-plugin-mcp
   ```

4. **Configure Character JSON**:
   ```json
   {
     "mcp": {
       "servers": {
         "zk-health-pass-midnight": {
           "type": "stdio",
           "name": "ZK Health Pass Midnight",
           "command": "bash",
           "args": [
             "-c",
             "source ~/.nvm/nvm.sh && AGENT_ID=health-pass-agent-1 nvm exec 18 node /path/to/midnight-mcp/dist/stdio-server.js"
           ]
         }
       }
     }
   }
   ```

5. **Start ElizaOS**:
   ```bash
   elizaos start
   ```

## Available MCP Tools

### Wallet Operations
- `walletStatus` - Check wallet connection and sync status
- `walletAddress` - Get wallet receiving address
- `walletBalance` - View current balance
- `getTransactions` - List transaction history
- `sendFunds` - Send funds to another address
- `verifyTransaction` - Verify transaction status
- `getWalletConfig` - Get wallet configuration

### Health Pass Operations
- `createHealthProof` - Generate ZK health proof
- `getHealthProofs` - List all health proofs
- `verifyHealthProof` - Verify a health proof
- `revokeHealthProof` - Revoke a health proof (authority only)

### Wallet Management
- `generateWalletSeed` - Generate backup seed phrase

## Example AI Agent Conversations

```
User: "Create a COVID-19 vaccination proof for patient John Doe"
Agent: "I'll create a zero-knowledge health proof for the COVID-19 vaccination. 
        This will generate a cryptographic proof without storing any personal 
        information on the blockchain..."

User: "Check my wallet balance and recent transactions"
Agent: "Let me check your Midnight wallet status and recent activity..."

User: "Verify this health proof: 0x1234..."
Agent: "I'll verify that health proof hash on the blockchain..."
```

## Privacy & Security

### What's Stored On-Chain
- ✅ Cryptographic proof hashes
- ✅ Verification timestamps
- ✅ Authority signatures
- ✅ Expiration dates

### What's NEVER Stored On-Chain
- ❌ Patient names or personal data
- ❌ Medical record details
- ❌ Vaccination specifics
- ❌ Healthcare provider information

### Security Features
- **Seed Phrase Protection**: BIP39 mnemonic generation and secure storage
- **Agent Isolation**: Each agent has isolated storage and wallet
- **Hash-Based Privacy**: All sensitive data is cryptographically hashed
- **Zero-Knowledge Proofs**: Verification without data revelation

## Production Deployment

### Docker Deployment

1. **Set Up Agent for Docker**:
   ```bash
   npm run setup-docker -- -a production-agent-1 -P 3001
   ```

2. **Deploy with Docker Compose**:
   ```bash
   cd storage/agents/production-agent-1
   docker-compose up -d
   ```

3. **Monitor Logs**:
   ```bash
   docker-compose logs -f wallet-server
   ```

### Health Checks

The system includes comprehensive health monitoring:
- HTTP health endpoints
- Docker health checks
- Service dependency management
- Automatic restart policies

## Integration with Existing ZK Health Pass

This MCP server integrates seamlessly with your existing ZK Health Pass components:

### Frontend Integration
```typescript
// Add Midnight network support to your React app
const midnightConfig = {
  chainId: 'midnight-testnet',
  rpcUrl: 'http://localhost:3000/api',
  mcpEndpoint: 'stdio://midnight-mcp'
};
```

### Backend Integration
```rust
// Connect Rust backend to MCP server
let mcp_client = MCPClient::new("http://localhost:3000");
let proof_result = mcp_client.create_health_proof(health_record).await?;
```

### Smart Contract Integration
```solidity
// Verify proofs from Midnight network in your contracts
function verifyMidnightProof(bytes32 proofHash) external view returns (bool) {
    return midnightVerifier.isValidProof(proofHash);
}
```

## Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Test MCP protocol
npm run test:e2e:stdio

# Test ElizaOS integration
npm run test:e2e:eliza
```

## Development

### Project Structure
```
midnight-mcp/
├── src/
│   ├── server.ts              # Main wallet server
│   ├── stdio-server.ts        # MCP protocol server
│   ├── wallet/                # Wallet service implementation
│   ├── services/              # Health pass service
│   ├── mcp/                   # MCP tools and handlers
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Logging and utilities
├── scripts/                   # Setup and deployment scripts
├── storage/                   # Agent data storage
└── test/                      # Test suites
```

### Adding New Tools

1. **Define Tool Schema** (`src/mcp/tools.ts`):
   ```typescript
   {
     name: 'newTool',
     description: 'Description of the new tool',
     inputSchema: {
       type: 'object',
       properties: { /* parameters */ },
       required: ['param1']
     }
   }
   ```

2. **Implement Tool Handler** (`src/stdio-server.ts`):
   ```typescript
   case 'newTool':
     return await this.callWalletAPI('POST', '/api/new-endpoint', args);
   ```

3. **Add API Endpoint** (`src/server.ts`):
   ```typescript
   app.post('/api/new-endpoint', async (req, res) => {
     // Implementation
   });
   ```

## Troubleshooting

### Common Issues

1. **Agent Not Found**: Ensure `AGENT_ID` environment variable is set
2. **Wallet Connection Failed**: Check Midnight network connectivity
3. **MCP Protocol Errors**: Verify stdio-server is running correctly
4. **Permission Denied**: Check file permissions in storage directories

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug AGENT_ID=your-agent npm run dev
```

### Health Checks

```bash
# Check wallet server health
curl http://localhost:3000/health

# Check wallet status
curl http://localhost:3000/api/wallet/status
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit a pull request

## License

This project is part of the ZK Health Pass system and follows the same licensing terms.

---

**Status**: ✅ **Ready for Integration**

For questions or support, please refer to the main ZK Health Pass documentation or create an issue in the repository.
