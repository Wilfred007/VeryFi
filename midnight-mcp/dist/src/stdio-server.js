#!/usr/bin/env node
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
exports.MCPStdioServer = void 0;
const http = __importStar(require("http"));
const logger_1 = require("./utils/logger");
const tools_1 = require("./mcp/tools");
class MCPStdioServer {
    constructor() {
        this.logger = new logger_1.Logger('MCPStdioServer');
        const host = process.env.WALLET_SERVER_HOST || 'localhost';
        const port = process.env.WALLET_SERVER_PORT || '3000';
        this.walletServerUrl = `http://${host}:${port}`;
    }
    async start() {
        this.logger.info('Starting MCP STDIO server', {
            agentId: process.env.AGENT_ID,
            walletServerUrl: this.walletServerUrl
        });
        // Set up stdin/stdout for MCP communication
        process.stdin.setEncoding('utf8');
        process.stdout.setDefaultEncoding('utf8');
        // Handle MCP protocol messages
        let buffer = '';
        process.stdin.on('data', (chunk) => {
            buffer += chunk;
            // Process complete JSON-RPC messages
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                if (line.trim()) {
                    this.handleMessage(line.trim());
                }
            }
        });
        // Handle process termination
        process.on('SIGTERM', () => this.shutdown());
        process.on('SIGINT', () => this.shutdown());
    }
    async handleMessage(message) {
        try {
            const request = JSON.parse(message);
            this.logger.debug('Received MCP request', { method: request.method, id: request.id });
            let response;
            switch (request.method) {
                case 'initialize':
                    response = await this.handleInitialize(request);
                    break;
                case 'tools/list':
                    response = await this.handleToolsList(request);
                    break;
                case 'tools/call':
                    response = await this.handleToolCall(request);
                    break;
                default:
                    response = {
                        jsonrpc: '2.0',
                        id: request.id,
                        error: {
                            code: -32601,
                            message: 'Method not found'
                        }
                    };
            }
            this.sendResponse(response);
        }
        catch (error) {
            this.logger.error('Error handling MCP message', { error, message });
            const errorResponse = {
                jsonrpc: '2.0',
                id: null,
                error: {
                    code: -32700,
                    message: 'Parse error'
                }
            };
            this.sendResponse(errorResponse);
        }
    }
    async handleInitialize(request) {
        return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
                protocolVersion: '2024-11-05',
                capabilities: {
                    tools: {}
                },
                serverInfo: {
                    name: 'zk-health-pass-midnight-mcp',
                    version: '1.0.0'
                }
            }
        };
    }
    async handleToolsList(request) {
        return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
                tools: tools_1.MCP_TOOLS
            }
        };
    }
    async handleToolCall(request) {
        try {
            const { name, arguments: args } = request.params;
            this.logger.info('Executing tool', { toolName: name, args });
            const result = await this.executeToolCall(name, args || {});
            return {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                    content: [
                        {
                            type: 'text',
                            text: result.content
                        }
                    ],
                    isError: result.isError || false
                }
            };
        }
        catch (error) {
            this.logger.error('Error executing tool', { error, toolName: request.params?.name });
            return {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                    content: [
                        {
                            type: 'text',
                            text: `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }
                    ],
                    isError: true
                }
            };
        }
    }
    async executeToolCall(toolName, args) {
        try {
            switch (toolName) {
                case 'walletStatus':
                    return await this.callWalletAPI('GET', '/api/wallet/status');
                case 'walletAddress':
                    return await this.callWalletAPI('GET', '/api/wallet/address');
                case 'walletBalance':
                    return await this.callWalletAPI('GET', '/api/wallet/balance');
                case 'getTransactions':
                    const limit = args.limit || 10;
                    return await this.callWalletAPI('GET', `/api/wallet/transactions?limit=${limit}`);
                case 'sendFunds':
                    return await this.callWalletAPI('POST', '/api/wallet/send', {
                        to: args.to,
                        amount: args.amount,
                        memo: args.memo
                    });
                case 'verifyTransaction':
                    return await this.callWalletAPI('GET', `/api/wallet/verify/${args.txHash}`);
                case 'getWalletConfig':
                    return await this.callWalletAPI('GET', '/api/wallet/config');
                case 'createHealthProof':
                    return await this.callWalletAPI('POST', '/api/health-pass/create', args);
                case 'getHealthProofs':
                    const proofLimit = args.limit || 10;
                    const includeExpired = args.includeExpired || false;
                    return await this.callWalletAPI('GET', `/api/health-pass/proofs?limit=${proofLimit}&includeExpired=${includeExpired}`);
                case 'verifyHealthProof':
                    return await this.callWalletAPI('GET', `/api/health-pass/verify/${args.proofHash}`);
                case 'revokeHealthProof':
                    return await this.callWalletAPI('POST', '/api/health-pass/revoke', {
                        proofHash: args.proofHash,
                        reason: args.reason
                    });
                case 'generateWalletSeed':
                    return await this.callWalletAPI('POST', '/api/wallet/generate-seed', {
                        wordCount: args.wordCount || 24
                    });
                default:
                    return {
                        content: `Unknown tool: ${toolName}`,
                        isError: true
                    };
            }
        }
        catch (error) {
            this.logger.error('Tool execution failed', { toolName, error });
            return {
                content: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                isError: true
            };
        }
    }
    async callWalletAPI(method, path, data) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.walletServerUrl);
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'ZK-Health-Pass-MCP/1.0.0'
                }
            };
            const req = http.request(url, options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                res.on('end', () => {
                    try {
                        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                            const result = JSON.parse(responseData);
                            resolve({
                                content: JSON.stringify(result, null, 2)
                            });
                        }
                        else {
                            resolve({
                                content: `HTTP ${res.statusCode}: ${responseData}`,
                                isError: true
                            });
                        }
                    }
                    catch (error) {
                        resolve({
                            content: `Failed to parse response: ${responseData}`,
                            isError: true
                        });
                    }
                });
            });
            req.on('error', (error) => {
                resolve({
                    content: `Network error: ${error.message}`,
                    isError: true
                });
            });
            if (data && (method === 'POST' || method === 'PUT')) {
                req.write(JSON.stringify(data));
            }
            req.end();
        });
    }
    sendResponse(response) {
        const message = JSON.stringify(response) + '\n';
        process.stdout.write(message);
        this.logger.debug('Sent MCP response', { id: response.id, hasError: !!response.error });
    }
    shutdown() {
        this.logger.info('Shutting down MCP STDIO server');
        process.exit(0);
    }
}
exports.MCPStdioServer = MCPStdioServer;
// Start the server if this file is run directly
if (require.main === module) {
    const server = new MCPStdioServer();
    server.start().catch((error) => {
        console.error('Failed to start MCP STDIO server:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=stdio-server.js.map