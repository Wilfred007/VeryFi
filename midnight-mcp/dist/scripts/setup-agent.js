#!/usr/bin/env tsx
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const bip39 = __importStar(require("bip39"));
const commander_1 = require("commander");
class AgentSetup {
    constructor(options) {
        this.options = options;
    }
    async setup() {
        console.log('🚀 Setting up ZK Health Pass Midnight MCP Agent...\n');
        // Validate inputs
        this.validateInputs();
        // Create directory structure
        const agentDir = this.createDirectoryStructure();
        // Generate or use provided seed
        const seedData = await this.generateSeedData();
        // Save seed securely
        this.saveSeedData(agentDir, seedData);
        // Create environment file
        this.createEnvironmentFile(agentDir);
        // Display results
        this.displayResults(seedData);
        console.log('\n✅ Agent setup completed successfully!');
        console.log(`\n📁 Agent directory: ${agentDir}`);
        console.log('\n🚀 Next steps:');
        console.log('1. Review and customize the .env file');
        console.log('2. Run: cd midnight-mcp && npm install');
        console.log('3. Run: AGENT_ID=' + this.options.agentId + ' npm run dev');
    }
    validateInputs() {
        if (!this.options.agentId || this.options.agentId.length < 3) {
            throw new Error('Agent ID must be at least 3 characters long');
        }
        if (this.options.words && ![12, 24].includes(this.options.words)) {
            throw new Error('Word count must be 12 or 24');
        }
        if (this.options.seed && this.options.seed.length < 32) {
            throw new Error('Seed must be at least 32 characters long');
        }
    }
    createDirectoryStructure() {
        const baseDir = this.options.directory || process.cwd();
        const agentDir = path.join(baseDir, 'storage', 'agents', this.options.agentId);
        // Create directories
        const dirs = [
            agentDir,
            path.join(agentDir, 'seeds'),
            path.join(agentDir, 'wallet-backups'),
            path.join(agentDir, 'logs')
        ];
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Created directory: ${dir}`);
            }
        }
        return agentDir;
    }
    async generateSeedData() {
        let mnemonic;
        let seed;
        if (this.options.seed) {
            // Use provided seed
            if (this.options.seed.split(' ').length >= 12) {
                // Assume it's a mnemonic
                mnemonic = this.options.seed;
                if (!bip39.validateMnemonic(mnemonic)) {
                    throw new Error('Invalid mnemonic phrase');
                }
            }
            else {
                // Assume it's a hex seed
                seed = this.options.seed.startsWith('0x') ? this.options.seed.slice(2) : this.options.seed;
                // Generate mnemonic from entropy
                const entropy = Buffer.from(seed.slice(0, 32), 'hex');
                mnemonic = bip39.entropyToMnemonic(entropy);
            }
        }
        else {
            // Generate new mnemonic
            const wordCount = this.options.words || 24;
            const strength = wordCount === 24 ? 256 : 128;
            mnemonic = bip39.generateMnemonic(strength);
        }
        // Generate seed from mnemonic
        const seedBuffer = bip39.mnemonicToSeedSync(mnemonic, this.options.password);
        seed = seedBuffer.toString('hex');
        const result = {
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
    saveSeedData(agentDir, seedData) {
        const seedFile = path.join(agentDir, 'seeds', 'seed');
        const seedBackupFile = path.join(agentDir, 'seeds', 'seed.backup');
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
            version: '1.0'
        };
        // Save seed file
        fs.writeFileSync(seedFile, JSON.stringify(seedFileContent, null, 2), { mode: 0o600 });
        fs.writeFileSync(seedBackupFile, JSON.stringify(seedFileContent, null, 2), { mode: 0o600 });
        console.log(`🔐 Seed saved to: ${seedFile}`);
        console.log(`💾 Backup saved to: ${seedBackupFile}`);
    }
    createEnvironmentFile(agentDir) {
        const envFile = path.join(agentDir, '.env');
        const envContent = `# ZK Health Pass Midnight MCP Agent Configuration
# Agent: ${this.options.agentId}
# Generated: ${new Date().toISOString()}

# Required
AGENT_ID=${this.options.agentId}

# Wallet Server Configuration
WALLET_SERVER_HOST=localhost
WALLET_SERVER_PORT=3000

# Network Configuration
NETWORK_ID=TestNet
WALLET_FILENAME=midnight-wallet
LOG_LEVEL=info

# External Services
USE_EXTERNAL_PROOF_SERVER=true
PROOF_SERVER=http://proof-server:8080
INDEXER=http://indexer:8080
INDEXER_WS=ws://indexer:8080
MN_NODE=http://midnight-node:8080

# ZK Health Pass Integration
ZK_HEALTH_PASS_API=http://localhost:8000
ZK_HEALTH_PASS_CONTRACT=0x1234567890123456789012345678901234567890
HEALTH_AUTHORITY_REGISTRY=0x0987654321098765432109876543210987654321

# Security (DO NOT COMMIT TO VERSION CONTROL)
WALLET_PASSWORD=${this.options.password || ''}
`;
        fs.writeFileSync(envFile, envContent);
        console.log(`⚙️  Environment file created: ${envFile}`);
    }
    displayResults(seedData) {
        console.log('\n🔑 WALLET INFORMATION (SAVE SECURELY!)');
        console.log('='.repeat(50));
        console.log(`Agent ID: ${this.options.agentId}`);
        console.log(`\nMidnight Seed (hex): ${seedData.seed}`);
        console.log(`\nBIP39 Mnemonic (${seedData.mnemonic.split(' ').length} words):`);
        console.log(`${seedData.mnemonic}`);
        if (seedData.derivedSeed) {
            console.log(`\nDerived Seed (with password): ${seedData.derivedSeed}`);
        }
        console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
        console.log('• Save the mnemonic phrase in a secure location');
        console.log('• The mnemonic can be imported into any compatible wallet');
        console.log('• Never share your seed or mnemonic with anyone');
        console.log('• Consider using a hardware wallet for production use');
    }
}
// CLI setup
commander_1.program
    .name('setup-agent')
    .description('Set up a new ZK Health Pass Midnight MCP agent')
    .requiredOption('-a, --agent-id <id>', 'Unique agent identifier')
    .option('-d, --directory <path>', 'Base directory for agent setup (default: current directory)')
    .option('-s, --seed <seed>', 'Existing seed phrase or hex seed (if not provided, will be generated)')
    .option('-f, --force', 'Overwrite existing seed file if it exists')
    .option('-w, --words <number>', 'Number of words in mnemonic (12 or 24, default: 24)', (value) => parseInt(value))
    .option('-p, --password <string>', 'Optional password for additional security')
    .action(async (options) => {
    try {
        const setup = new AgentSetup(options);
        await setup.setup();
    }
    catch (error) {
        console.error('❌ Setup failed:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
if (require.main === module) {
    commander_1.program.parse();
}
//# sourceMappingURL=setup-agent.js.map