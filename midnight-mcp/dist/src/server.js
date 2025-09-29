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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv = __importStar(require("dotenv"));
const wallet_service_1 = require("./wallet/wallet-service");
const health_pass_service_1 = require("./services/health-pass-service");
const logger_1 = require("./utils/logger");
// Load environment variables
dotenv.config();
const app = (0, express_1.default)();
exports.app = app;
const logger = new logger_1.Logger('WalletServer');
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('combined'));
// Services
let walletService;
let healthPassService;
// Initialize services
async function initializeServices() {
    try {
        const config = {
            agentId: process.env.AGENT_ID || 'default-agent',
            networkId: process.env.NETWORK_ID || 'TestNet',
            walletFilename: process.env.WALLET_FILENAME || 'midnight-wallet',
            proofServer: process.env.PROOF_SERVER,
            indexer: process.env.INDEXER,
            indexerWs: process.env.INDEXER_WS,
            mnNode: process.env.MN_NODE
        };
        walletService = new wallet_service_1.WalletService(config);
        await walletService.initialize();
        healthPassService = new health_pass_service_1.HealthPassService(walletService);
        await healthPassService.initialize();
        logger.info('Services initialized successfully', { agentId: config.agentId });
    }
    catch (error) {
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
    }
    catch (error) {
        logger.error('Error getting wallet status', { error });
        res.status(500).json({ error: 'Failed to get wallet status' });
    }
});
app.get('/api/wallet/address', async (req, res) => {
    try {
        const address = await walletService.getWalletAddress();
        res.json({ address });
    }
    catch (error) {
        logger.error('Error getting wallet address', { error });
        res.status(500).json({ error: 'Failed to get wallet address' });
    }
});
app.get('/api/wallet/balance', async (req, res) => {
    try {
        const balance = await walletService.getBalance();
        res.json({ balance });
    }
    catch (error) {
        logger.error('Error getting wallet balance', { error });
        res.status(500).json({ error: 'Failed to get wallet balance' });
    }
});
app.get('/api/wallet/transactions', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const transactions = await walletService.getTransactions(limit);
        res.json({ transactions });
    }
    catch (error) {
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
    }
    catch (error) {
        logger.error('Error sending funds', { error });
        res.status(500).json({ error: 'Failed to send funds' });
    }
});
app.get('/api/wallet/verify/:txHash', async (req, res) => {
    try {
        const { txHash } = req.params;
        const isValid = await walletService.verifyTransaction(txHash);
        res.json({ txHash, isValid });
    }
    catch (error) {
        logger.error('Error verifying transaction', { error });
        res.status(500).json({ error: 'Failed to verify transaction' });
    }
});
app.get('/api/wallet/config', async (req, res) => {
    try {
        const config = await walletService.getWalletConfig();
        res.json(config);
    }
    catch (error) {
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
    }
    catch (error) {
        logger.error('Error creating health proof', { error });
        res.status(500).json({ error: 'Failed to create health proof' });
    }
});
app.get('/api/health-pass/proofs', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const includeExpired = req.query.includeExpired === 'true';
        const proofs = await healthPassService.getHealthProofs(limit, includeExpired);
        res.json({ proofs });
    }
    catch (error) {
        logger.error('Error getting health proofs', { error });
        res.status(500).json({ error: 'Failed to get health proofs' });
    }
});
app.get('/api/health-pass/verify/:proofHash', async (req, res) => {
    try {
        const { proofHash } = req.params;
        const verification = await healthPassService.verifyHealthProof(proofHash);
        res.json(verification);
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
        logger.error('Error generating seed', { error });
        res.status(500).json({ error: 'Failed to generate seed' });
    }
});
// Error handling middleware
app.use((error, req, res, next) => {
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
    }
    catch (error) {
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
//# sourceMappingURL=server.js.map