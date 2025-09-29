#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as bip39 from 'bip39';
import { program } from 'commander';

interface DockerSetupOptions {
  agentId: string;
  seed?: string;
  force?: boolean;
  words?: number;
  password?: string;
  port?: number;
  indexer?: string;
  indexerWs?: string;
  node?: string;
}

class DockerSetup {
  private options: DockerSetupOptions;

  constructor(options: DockerSetupOptions) {
    this.options = options;
  }

  async setup(): Promise<void> {
    console.log('🐳 Setting up ZK Health Pass Midnight MCP Docker deployment...\n');

    // Validate inputs
    this.validateInputs();

    // Create agent directory structure
    const agentDir = this.createAgentDirectory();

    // Generate or use provided seed
    const seedData = await this.generateSeedData();

    // Save seed securely
    this.saveSeedData(agentDir, seedData);

    // Create Docker environment file
    this.createDockerEnvironment(agentDir);

    // Copy Docker Compose file
    this.copyDockerCompose(agentDir);

    // Create data directories with proper permissions
    this.createDataDirectories(agentDir);

    // Display results
    this.displayResults(agentDir, seedData);

    console.log('\n✅ Docker setup completed successfully!');
    console.log(`\n📁 Agent directory: ${agentDir}`);
    console.log('\n🚀 Next steps:');
    console.log(`1. cd ${agentDir}`);
    console.log('2. Review and customize the .env file');
    console.log('3. docker-compose up -d');
    console.log('4. docker-compose logs -f wallet-server');
  }

  private validateInputs(): void {
    if (!this.options.agentId || this.options.agentId.length < 3) {
      throw new Error('Agent ID must be at least 3 characters long');
    }

    if (this.options.words && ![12, 24].includes(this.options.words)) {
      throw new Error('Word count must be 12 or 24');
    }

    if (this.options.seed && this.options.seed.length < 32) {
      throw new Error('Seed must be at least 32 characters long');
    }

    if (this.options.port && (this.options.port < 1000 || this.options.port > 65535)) {
      throw new Error('Port must be between 1000 and 65535');
    }
  }

  private createAgentDirectory(): string {
    const agentDir = path.join(process.cwd(), 'agents', this.options.agentId);

    // Create directories
    const dirs = [
      agentDir,
      path.join(agentDir, 'data'),
      path.join(agentDir, 'logs'),
      path.join(agentDir, 'config')
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    }

    return agentDir;
  }

  private async generateSeedData(): Promise<{ mnemonic: string; seed: string; derivedSeed?: string }> {
    let mnemonic: string;
    let seed: string;

    if (this.options.seed) {
      // Use provided seed
      if (this.options.seed.split(' ').length >= 12) {
        // Assume it's a mnemonic
        mnemonic = this.options.seed;
        if (!bip39.validateMnemonic(mnemonic)) {
          throw new Error('Invalid mnemonic phrase');
        }
      } else {
        // Assume it's a hex seed
        seed = this.options.seed.startsWith('0x') ? this.options.seed.slice(2) : this.options.seed;
        // Generate mnemonic from entropy
        const entropy = Buffer.from(seed.slice(0, 32), 'hex');
        mnemonic = bip39.entropyToMnemonic(entropy);
      }
    } else {
      // Generate new mnemonic
      const wordCount = this.options.words || 24;
      const strength = wordCount === 24 ? 256 : 128;
      mnemonic = bip39.generateMnemonic(strength);
    }

    // Generate seed from mnemonic
    const seedBuffer = bip39.mnemonicToSeedSync(mnemonic, this.options.password);
    seed = seedBuffer.toString('hex');

    const result: { mnemonic: string; seed: string; derivedSeed?: string } = {
      mnemonic,
      seed
    };

    if (this.options.password) {
      result.derivedSeed = crypto
        .createHash('sha256')
        .update(seedBuffer)
        .update(this.options.password)
        .digest('hex');
    }

    return result;
  }

  private saveSeedData(agentDir: string, seedData: { mnemonic: string; seed: string; derivedSeed?: string }): void {
    const seedFile = path.join(agentDir, 'config', 'seed.json');
    const seedBackupFile = path.join(agentDir, 'config', 'seed.backup.json');

    // Check if seed file exists
    if (fs.existsSync(seedFile) && !this.options.force) {
      throw new Error(`Seed file already exists: ${seedFile}. Use --force to overwrite.`);
    }

    // Create seed data
    const seedFileContent = {
      agentId: this.options.agentId,
      mnemonic: seedData.mnemonic,
      seed: seedData.seed,
      derivedSeed: seedData.derivedSeed,
      createdAt: new Date().toISOString(),
      version: '1.0',
      deploymentType: 'docker'
    };

    // Save seed file with restricted permissions
    fs.writeFileSync(seedFile, JSON.stringify(seedFileContent, null, 2), { mode: 0o600 });
    fs.writeFileSync(seedBackupFile, JSON.stringify(seedFileContent, null, 2), { mode: 0o600 });

    console.log(`🔐 Seed saved to: ${seedFile}`);
    console.log(`💾 Backup saved to: ${seedBackupFile}`);
  }

  private createDockerEnvironment(agentDir: string): void {
    const envFile = path.join(agentDir, '.env');
    const port = this.options.port || 3000;
    const proofServerPort = port + 1000; // Offset proof server port

    const envContent = `# ZK Health Pass Midnight MCP Docker Configuration
# Agent: ${this.options.agentId}
# Generated: ${new Date().toISOString()}

# Agent Configuration
AGENT_ID=${this.options.agentId}

# Server Ports
WALLET_SERVER_PORT=${port}
PROOF_SERVER_PORT=${proofServerPort}

# Network Configuration
NETWORK_ID=TestNet
WALLET_FILENAME=midnight-wallet
LOG_LEVEL=info

# External Services
USE_EXTERNAL_PROOF_SERVER=true
PROOF_SERVER=http://proof-server:8080
INDEXER=${this.options.indexer || 'http://indexer:8080'}
INDEXER_WS=${this.options.indexerWs || 'ws://indexer:8080'}
MN_NODE=${this.options.node || 'http://midnight-node:8080'}

# ZK Health Pass Integration
ZK_HEALTH_PASS_API=http://host.docker.internal:8000
ZK_HEALTH_PASS_CONTRACT=0x1234567890123456789012345678901234567890
HEALTH_AUTHORITY_REGISTRY=0x0987654321098765432109876543210987654321

# Security (loaded from mounted config)
WALLET_PASSWORD=${this.options.password || ''}

# Docker-specific settings
COMPOSE_PROJECT_NAME=${this.options.agentId}
`;

    fs.writeFileSync(envFile, envContent);
    console.log(`⚙️  Docker environment file created: ${envFile}`);
  }

  private copyDockerCompose(agentDir: string): void {
    const sourceCompose = path.join(process.cwd(), 'docker-compose.yml');
    const targetCompose = path.join(agentDir, 'docker-compose.yml');

    if (fs.existsSync(sourceCompose)) {
      fs.copyFileSync(sourceCompose, targetCompose);
      console.log(`🐳 Docker Compose file copied to: ${targetCompose}`);
    } else {
      // Create a basic docker-compose.yml if source doesn't exist
      this.createDockerComposeFile(targetCompose);
    }
  }

  private createDockerComposeFile(filePath: string): void {
    const dockerComposeContent = `version: '3.8'

services:
  # Midnight Proof Server
  proof-server:
    image: midnight/proof-server:latest
    container_name: \${AGENT_ID}-proof-server
    ports:
      - "\${PROOF_SERVER_PORT:-8080}:8080"
    environment:
      - LOG_LEVEL=\${LOG_LEVEL:-info}
    volumes:
      - proof-data:/app/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped

  # ZK Health Pass Midnight MCP Wallet Server
  wallet-server:
    build:
      context: ../..
      dockerfile: midnight-mcp/Dockerfile
    container_name: \${AGENT_ID}-wallet-server
    ports:
      - "\${WALLET_SERVER_PORT:-3000}:3000"
    environment:
      - AGENT_ID=\${AGENT_ID}
      - WALLET_SERVER_HOST=0.0.0.0
      - WALLET_SERVER_PORT=3000
      - NETWORK_ID=\${NETWORK_ID:-TestNet}
      - WALLET_FILENAME=\${WALLET_FILENAME:-midnight-wallet}
      - LOG_LEVEL=\${LOG_LEVEL:-info}
      - USE_EXTERNAL_PROOF_SERVER=true
      - PROOF_SERVER=http://proof-server:8080
      - INDEXER=\${INDEXER:-http://indexer:8080}
      - INDEXER_WS=\${INDEXER_WS:-ws://indexer:8080}
      - MN_NODE=\${MN_NODE:-http://midnight-node:8080}
      - ZK_HEALTH_PASS_API=\${ZK_HEALTH_PASS_API}
      - ZK_HEALTH_PASS_CONTRACT=\${ZK_HEALTH_PASS_CONTRACT}
      - HEALTH_AUTHORITY_REGISTRY=\${HEALTH_AUTHORITY_REGISTRY}
      - WALLET_PASSWORD=\${WALLET_PASSWORD}
    volumes:
      - wallet-data:/app/storage
      - ./config:/app/config:ro
      - ./logs:/app/storage/logs
    depends_on:
      proof-server:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    restart: unless-stopped

volumes:
  proof-data:
    driver: local
  wallet-data:
    driver: local

networks:
  default:
    name: \${AGENT_ID}-network
`;

    fs.writeFileSync(filePath, dockerComposeContent);
    console.log(`🐳 Docker Compose file created: ${filePath}`);
  }

  private createDataDirectories(agentDir: string): void {
    const dataDirs = [
      path.join(agentDir, 'data', 'wallet'),
      path.join(agentDir, 'data', 'proofs'),
      path.join(agentDir, 'logs', 'wallet'),
      path.join(agentDir, 'logs', 'proof-server')
    ];

    for (const dir of dataDirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
        console.log(`📁 Created data directory: ${dir}`);
      }
    }

    // Create .gitkeep files to preserve directory structure
    for (const dir of dataDirs) {
      const gitkeepFile = path.join(dir, '.gitkeep');
      if (!fs.existsSync(gitkeepFile)) {
        fs.writeFileSync(gitkeepFile, '');
      }
    }
  }

  private displayResults(agentDir: string, seedData: { mnemonic: string; seed: string; derivedSeed?: string }): void {
    console.log('\n🔑 WALLET INFORMATION (SAVE SECURELY!)');
    console.log('=' .repeat(50));
    console.log(`Agent ID: ${this.options.agentId}`);
    console.log(`Deployment: Docker`);
    console.log(`Port: ${this.options.port || 3000}`);
    console.log(`\nMidnight Seed (hex): ${seedData.seed}`);
    console.log(`\nBIP39 Mnemonic (${seedData.mnemonic.split(' ').length} words):`);
    console.log(`${seedData.mnemonic}`);
    
    if (seedData.derivedSeed) {
      console.log(`\nDerived Seed (with password): ${seedData.derivedSeed}`);
    }

    console.log('\n🐳 DOCKER DEPLOYMENT INFO:');
    console.log(`• Agent Directory: ${agentDir}`);
    console.log(`• Wallet Server Port: ${this.options.port || 3000}`);
    console.log(`• Proof Server Port: ${(this.options.port || 3000) + 1000}`);
    console.log(`• Network: ${this.options.agentId}-network`);

    console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
    console.log('• Seed files are stored in config/ directory with restricted permissions');
    console.log('• Config directory is mounted read-only in containers');
    console.log('• Data and logs are persisted in Docker volumes');
    console.log('• Never commit seed files to version control');
    console.log('• Consider using Docker secrets for production deployments');
  }
}

// CLI setup
program
  .name('setup-docker')
  .description('Set up Docker deployment for ZK Health Pass Midnight MCP agent')
  .requiredOption('-a, --agent-id <id>', 'Unique agent identifier')
  .option('-s, --seed <seed>', 'Existing seed phrase or hex seed (if not provided, will be generated)')
  .option('-f, --force', 'Overwrite existing seed file if it exists')
  .option('-w, --words <number>', 'Number of words in mnemonic (12 or 24, default: 24)', (value) => parseInt(value))
  .option('-p, --password <string>', 'Optional password for additional security')
  .option('-P, --port <number>', 'Wallet server port (default: 3000)', (value) => parseInt(value))
  .option('-i, --indexer <url>', 'Indexer URL (default: http://indexer:8080)')
  .option('-w, --indexer-ws <url>', 'Indexer WebSocket URL (default: ws://indexer:8080)')
  .option('-n, --node <url>', 'Midnight node URL (default: http://midnight-node:8080)')
  .action(async (options: DockerSetupOptions) => {
    try {
      const setup = new DockerSetup(options);
      await setup.setup();
    } catch (error) {
      console.error('❌ Docker setup failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

if (require.main === module) {
  program.parse();
}
