import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import * as dotenv from 'dotenv';
import { WalletService } from './wallet/wallet-service';
import { HealthPassService } from './services/health-pass-service';
import { Logger } from './utils/logger';
import { WalletConfig } from './types';

// Load environment variables
dotenv.config();

const app = express();
const logger = new Logger('WalletServer');

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Services
let walletService: WalletService;
let healthPassService: HealthPassService;

// Initialize services
async function initializeServices() {
  try {
    const config: WalletConfig = {
      agentId: process.env.AGENT_ID || 'default-agent',
      networkId: process.env.NETWORK_ID || 'TestNet',
      walletFilename: process.env.WALLET_FILENAME || 'midnight-wallet',
      proofServer: process.env.PROOF_SERVER,
      indexer: process.env.INDEXER,
      indexerWs: process.env.INDEXER_WS,
      mnNode: process.env.MN_NODE
    };

    walletService = new WalletService(config);
    await walletService.initialize();

    healthPassService = new HealthPassService(walletService);
    await healthPassService.initialize();

    logger.info('Services initialized successfully', { agentId: config.agentId });
  } catch (error) {
    logger.error('Failed to initialize services', { error });
    process.exit(1);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    agentId: process.env.AGENT_ID,
    version: '1.0.0'
  });
});

// Wallet endpoints
app.get('/api/wallet/status', async (req, res) => {
  try {
    const status = await walletService.getWalletStatus();
    res.json(status);
  } catch (error) {
    logger.error('Error getting wallet status', { error });
    res.status(500).json({ error: 'Failed to get wallet status' });
  }
});

app.get('/api/wallet/address', async (req, res) => {
  try {
    const address = await walletService.getWalletAddress();
    res.json({ address });
  } catch (error) {
    logger.error('Error getting wallet address', { error });
    res.status(500).json({ error: 'Failed to get wallet address' });
  }
});

app.get('/api/wallet/balance', async (req, res) => {
  try {
    const balance = await walletService.getBalance();
    res.json({ balance });
  } catch (error) {
    logger.error('Error getting wallet balance', { error });
    res.status(500).json({ error: 'Failed to get wallet balance' });
  }
});

app.get('/api/wallet/transactions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const transactions = await walletService.getTransactions(limit);
    res.json({ transactions });
  } catch (error) {
    logger.error('Error getting transactions', { error });
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

app.post('/api/wallet/send', async (req, res) => {
  try {
    const { to, amount, memo } = req.body;
    
    if (!to || !amount) {
      return res.status(400).json({ error: 'Missing required fields: to, amount' });
    }

    const txHash = await walletService.sendFunds(to, amount, memo);
    res.json({ txHash, status: 'sent' });
  } catch (error) {
    logger.error('Error sending funds', { error });
    res.status(500).json({ error: 'Failed to send funds' });
  }
});

app.get('/api/wallet/verify/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    const isValid = await walletService.verifyTransaction(txHash);
    res.json({ txHash, isValid });
  } catch (error) {
    logger.error('Error verifying transaction', { error });
    res.status(500).json({ error: 'Failed to verify transaction' });
  }
});

app.get('/api/wallet/config', async (req, res) => {
  try {
    const config = await walletService.getWalletConfig();
    res.json(config);
  } catch (error) {
    logger.error('Error getting wallet config', { error });
    res.status(500).json({ error: 'Failed to get wallet config' });
  }
});

// Health Pass endpoints
app.post('/api/health-pass/create', async (req, res) => {
  try {
    const healthRecord = req.body;
    const proof = await healthPassService.createHealthProof(healthRecord);
    res.json(proof);
  } catch (error) {
    logger.error('Error creating health proof', { error });
    res.status(500).json({ error: 'Failed to create health proof' });
  }
});

app.get('/api/health-pass/proofs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const includeExpired = req.query.includeExpired === 'true';
    const proofs = await healthPassService.getHealthProofs(limit, includeExpired);
    res.json({ proofs });
  } catch (error) {
    logger.error('Error getting health proofs', { error });
    res.status(500).json({ error: 'Failed to get health proofs' });
  }
});

app.get('/api/health-pass/verify/:proofHash', async (req, res) => {
  try {
    const { proofHash } = req.params;
    const verification = await healthPassService.verifyHealthProof(proofHash);
    res.json(verification);
  } catch (error) {
    logger.error('Error verifying health proof', { error });
    res.status(500).json({ error: 'Failed to verify health proof' });
  }
});

app.post('/api/health-pass/revoke', async (req, res) => {
  try {
    const { proofHash, reason } = req.body;
    
    if (!proofHash) {
      return res.status(400).json({ error: 'Missing required field: proofHash' });
    }

    const result = await healthPassService.revokeHealthProof(proofHash, reason);
    res.json(result);
  } catch (error) {
    logger.error('Error revoking health proof', { error });
    res.status(500).json({ error: 'Failed to revoke health proof' });
  }
});

// Wallet management endpoints
app.post('/api/wallet/generate-seed', async (req, res) => {
  try {
    const { wordCount } = req.body;
    const seedData = await walletService.generateSeed(wordCount || 24);
    res.json(seedData);
  } catch (error) {
    logger.error('Error generating seed', { error });
    res.status(500).json({ error: 'Failed to generate seed' });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error, path: req.path, method: req.method });
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const PORT = process.env.WALLET_SERVER_PORT || 3000;

async function startServer() {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      logger.info(`Wallet server started`, { 
        port: PORT, 
        agentId: process.env.AGENT_ID,
        nodeEnv: process.env.NODE_ENV || 'development'
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

if (require.main === module) {
  startServer();
}

export { app };
