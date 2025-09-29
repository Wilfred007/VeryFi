import { WalletService } from '../wallet/wallet-service';
import { ZKHealthProof, HealthRecord } from '../types';
export declare class HealthPassService {
    private walletService;
    private logger;
    private proofs;
    constructor(walletService: WalletService);
    initialize(): Promise<void>;
    private loadExistingProofs;
    createHealthProof(healthRecord: Partial<HealthRecord>): Promise<ZKHealthProof>;
    getHealthProofs(limit?: number, includeExpired?: boolean): Promise<ZKHealthProof[]>;
    verifyHealthProof(proofHash: string): Promise<{
        isValid: boolean;
        proof?: ZKHealthProof;
        reason?: string;
    }>;
    revokeHealthProof(proofHash: string, reason?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private hashHealthRecord;
    private createProofHash;
    private generateZKProof;
}
//# sourceMappingURL=health-pass-service.d.ts.map