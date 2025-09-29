export interface WalletConfig {
    agentId: string;
    networkId: string;
    walletFilename: string;
    proofServer?: string;
    indexer?: string;
    indexerWs?: string;
    mnNode?: string;
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
export interface ZKHealthProof {
    proofHash: string;
    healthRecordHash: string;
    authority: string;
    generatedAt: number;
    expiresAt: number;
    isRevoked: boolean;
    verificationCount: number;
    zkProofData?: Uint8Array;
}
export interface HealthRecord {
    patientName: string;
    dateOfBirth: string;
    vaccinationType: string;
    vaccinationDate: string;
    batchNumber: string;
    administeredBy: string;
    recordType: string;
    authority: string;
    issuedAt: number;
}
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: Record<string, any>;
        required?: string[];
    };
}
export interface MCPRequest {
    method: string;
    params: {
        name: string;
        arguments?: Record<string, any>;
    };
}
export interface MCPResponse {
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}
//# sourceMappingURL=index.d.ts.map