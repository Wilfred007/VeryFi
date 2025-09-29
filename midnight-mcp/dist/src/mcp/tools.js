"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCP_TOOLS = void 0;
exports.MCP_TOOLS = [
    {
        name: 'walletStatus',
        description: 'Check the current status of the Midnight wallet including connection, sync status, and balance',
        inputSchema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'walletAddress',
        description: 'Get the current wallet receiving address',
        inputSchema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'walletBalance',
        description: 'Get the current wallet balance',
        inputSchema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'getTransactions',
        description: 'Get recent transaction history',
        inputSchema: {
            type: 'object',
            properties: {
                limit: {
                    type: 'number',
                    description: 'Maximum number of transactions to return (default: 10)',
                    minimum: 1,
                    maximum: 100
                }
            },
            required: []
        }
    },
    {
        name: 'sendFunds',
        description: 'Send funds to another address',
        inputSchema: {
            type: 'object',
            properties: {
                to: {
                    type: 'string',
                    description: 'Recipient address'
                },
                amount: {
                    type: 'string',
                    description: 'Amount to send'
                },
                memo: {
                    type: 'string',
                    description: 'Optional memo/note for the transaction'
                }
            },
            required: ['to', 'amount']
        }
    },
    {
        name: 'verifyTransaction',
        description: 'Verify the status of a transaction',
        inputSchema: {
            type: 'object',
            properties: {
                txHash: {
                    type: 'string',
                    description: 'Transaction hash to verify'
                }
            },
            required: ['txHash']
        }
    },
    {
        name: 'getWalletConfig',
        description: 'Get current wallet configuration',
        inputSchema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'createHealthProof',
        description: 'Create a new zero-knowledge health proof and store it on the blockchain',
        inputSchema: {
            type: 'object',
            properties: {
                patientName: {
                    type: 'string',
                    description: 'Patient name (will be hashed for privacy)'
                },
                dateOfBirth: {
                    type: 'string',
                    description: 'Date of birth (YYYY-MM-DD format)'
                },
                vaccinationType: {
                    type: 'string',
                    description: 'Type of vaccination (e.g., COVID-19, Influenza)'
                },
                vaccinationDate: {
                    type: 'string',
                    description: 'Date of vaccination (YYYY-MM-DD format)'
                },
                batchNumber: {
                    type: 'string',
                    description: 'Vaccine batch number'
                },
                administeredBy: {
                    type: 'string',
                    description: 'Healthcare provider who administered the vaccine'
                },
                recordType: {
                    type: 'string',
                    description: 'Type of health record (vaccination, test, treatment)',
                    enum: ['vaccination', 'test', 'treatment']
                },
                authority: {
                    type: 'string',
                    description: 'Health authority issuing the record'
                },
                validityDays: {
                    type: 'number',
                    description: 'Number of days the proof should be valid (default: 30)',
                    minimum: 1,
                    maximum: 365
                }
            },
            required: ['patientName', 'recordType']
        }
    },
    {
        name: 'getHealthProofs',
        description: 'Get all health proofs associated with the current wallet',
        inputSchema: {
            type: 'object',
            properties: {
                limit: {
                    type: 'number',
                    description: 'Maximum number of proofs to return (default: 10)',
                    minimum: 1,
                    maximum: 100
                },
                includeExpired: {
                    type: 'boolean',
                    description: 'Whether to include expired proofs (default: false)'
                }
            },
            required: []
        }
    },
    {
        name: 'verifyHealthProof',
        description: 'Verify a health proof using its hash',
        inputSchema: {
            type: 'object',
            properties: {
                proofHash: {
                    type: 'string',
                    description: 'Hash of the proof to verify'
                }
            },
            required: ['proofHash']
        }
    },
    {
        name: 'revokeHealthProof',
        description: 'Revoke a health proof (only by the issuing authority)',
        inputSchema: {
            type: 'object',
            properties: {
                proofHash: {
                    type: 'string',
                    description: 'Hash of the proof to revoke'
                },
                reason: {
                    type: 'string',
                    description: 'Reason for revocation'
                }
            },
            required: ['proofHash']
        }
    },
    {
        name: 'generateWalletSeed',
        description: 'Generate a new wallet seed phrase for backup purposes',
        inputSchema: {
            type: 'object',
            properties: {
                wordCount: {
                    type: 'number',
                    description: 'Number of words in the mnemonic (12 or 24)',
                    enum: [12, 24]
                }
            },
            required: []
        }
    }
];
//# sourceMappingURL=tools.js.map