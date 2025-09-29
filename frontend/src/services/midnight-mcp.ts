import { HealthRecord, ZKHealthProof } from '../types/health-pass';

export interface MidnightMCPConfig {
  serverUrl: string;
  agentId: string;
  timeout?: number;
}

export interface WalletStatus {
  isConnected: boolean;
  isSynced: boolean;
  blockHeight: number;
  balance: string;
  address: string;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
}

export class MidnightMCPClient {
  private config: MidnightMCPConfig;
  private baseUrl: string;

  constructor(config: MidnightMCPConfig) {
    this.config = config;
    this.baseUrl = config.serverUrl.replace(/\/$/, '');
  }

  private async makeRequest<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-ID': this.config.agentId,
      },
      signal: AbortSignal.timeout(this.config.timeout || 30000),
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return result as T;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Midnight MCP request failed: ${error.message}`);
      }
      throw new Error('Unknown error occurred during Midnight MCP request');
    }
  }

  // Wallet Operations
  async getWalletStatus(): Promise<WalletStatus> {
    return this.makeRequest<WalletStatus>('GET', '/api/wallet/status');
  }

  async getWalletAddress(): Promise<{ address: string }> {
    return this.makeRequest<{ address: string }>('GET', '/api/wallet/address');
  }

  async getWalletBalance(): Promise<{ balance: string }> {
    return this.makeRequest<{ balance: string }>('GET', '/api/wallet/balance');
  }

  async getTransactions(limit: number = 10): Promise<{ transactions: Transaction[] }> {
    return this.makeRequest<{ transactions: Transaction[] }>(
      'GET',
      `/api/wallet/transactions?limit=${limit}`
    );
  }

  async sendFunds(to: string, amount: string, memo?: string): Promise<{ txHash: string; status: string }> {
    return this.makeRequest<{ txHash: string; status: string }>('POST', '/api/wallet/send', {
      to,
      amount,
      memo,
    });
  }

  async verifyTransaction(txHash: string): Promise<{ txHash: string; isValid: boolean }> {
    return this.makeRequest<{ txHash: string; isValid: boolean }>(
      'GET',
      `/api/wallet/verify/${txHash}`
    );
  }

  // Health Pass Operations
  async createHealthProof(healthRecord: Partial<HealthRecord>): Promise<ZKHealthProof> {
    return this.makeRequest<ZKHealthProof>('POST', '/api/health-pass/create', healthRecord);
  }

  async getHealthProofs(
    limit: number = 10,
    includeExpired: boolean = false
  ): Promise<{ proofs: ZKHealthProof[] }> {
    return this.makeRequest<{ proofs: ZKHealthProof[] }>(
      'GET',
      `/api/health-pass/proofs?limit=${limit}&includeExpired=${includeExpired}`
    );
  }

  async verifyHealthProof(
    proofHash: string
  ): Promise<{ isValid: boolean; proof?: ZKHealthProof; reason?: string }> {
    return this.makeRequest<{ isValid: boolean; proof?: ZKHealthProof; reason?: string }>(
      'GET',
      `/api/health-pass/verify/${proofHash}`
    );
  }

  async revokeHealthProof(
    proofHash: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(
      'POST',
      '/api/health-pass/revoke',
      { proofHash, reason }
    );
  }

  // Wallet Management
  async generateSeed(wordCount: 12 | 24 = 24): Promise<{ mnemonic: string; seed: string }> {
    return this.makeRequest<{ mnemonic: string; seed: string }>('POST', '/api/wallet/generate-seed', {
      wordCount,
    });
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string; agentId: string; version: string }> {
    return this.makeRequest<{ status: string; timestamp: string; agentId: string; version: string }>(
      'GET',
      '/health'
    );
  }

  // Connection Test
  async testConnection(): Promise<boolean> {
    try {
      const health = await this.healthCheck();
      return health.status === 'healthy';
    } catch (error) {
      console.error('Midnight MCP connection test failed:', error);
      return false;
    }
  }
}

// Default configuration for development
export const createMidnightMCPClient = (agentId: string = 'health-pass-agent-1'): MidnightMCPClient => {
  const config: MidnightMCPConfig = {
    serverUrl: process.env.REACT_APP_MIDNIGHT_MCP_URL || 'http://localhost:3001',
    agentId,
    timeout: 30000,
  };

  return new MidnightMCPClient(config);
};

// Singleton instance for the app
let midnightMCPClient: MidnightMCPClient | null = null;

export const getMidnightMCPClient = (): MidnightMCPClient => {
  // Always create a new client to ensure we pick up environment variable changes
  midnightMCPClient = createMidnightMCPClient();
  return midnightMCPClient;
};

// React hook for using Midnight MCP client
export const useMidnightMCP = () => {
  const client = getMidnightMCPClient();
  
  return {
    client,
    isAvailable: async () => {
      try {
        return await client.testConnection();
      } catch {
        return false;
      }
    },
  };
};

// Make MCP client available globally for testing
if (typeof window !== 'undefined') {
  (window as any).getMidnightMCPClient = getMidnightMCPClient;
  (window as any).MidnightMCPClient = MidnightMCPClient;
}
