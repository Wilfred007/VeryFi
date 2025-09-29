import { WalletConfig, WalletStatus, Transaction } from '../types';
export declare class WalletService {
    private config;
    private logger;
    private walletData;
    private isInitialized;
    constructor(config: WalletConfig);
    initialize(): Promise<void>;
    private loadOrCreateWallet;
    private generateMockAddress;
    private generateMockPrivateKey;
    private generateMockPublicKey;
    getWalletStatus(): Promise<WalletStatus>;
    getWalletAddress(): Promise<string>;
    getBalance(): Promise<string>;
    getTransactions(limit?: number): Promise<Transaction[]>;
    sendFunds(to: string, amount: string, memo?: string): Promise<string>;
    verifyTransaction(txHash: string): Promise<boolean>;
    getWalletConfig(): Promise<WalletConfig>;
    generateSeed(wordCount?: 12 | 24): Promise<{
        mnemonic: string;
        seed: string;
    }>;
    importFromMnemonic(mnemonic: string, password?: string): Promise<void>;
    private deriveAddressFromPublicKey;
}
//# sourceMappingURL=wallet-service.d.ts.map