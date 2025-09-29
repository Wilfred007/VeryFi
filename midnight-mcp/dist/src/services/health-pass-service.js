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
exports.HealthPassService = void 0;
const crypto = __importStar(require("crypto"));
const logger_1 = require("../utils/logger");
class HealthPassService {
    constructor(walletService) {
        this.proofs = new Map();
        this.walletService = walletService;
        this.logger = new logger_1.Logger('HealthPassService');
    }
    async initialize() {
        this.logger.info('Initializing Health Pass service');
        // Load existing proofs from storage
        await this.loadExistingProofs();
        this.logger.info('Health Pass service initialized');
    }
    async loadExistingProofs() {
        // In a real implementation, this would load from blockchain or persistent storage
        // For now, we'll start with an empty map
        this.logger.debug('Loading existing health proofs from storage');
    }
    async createHealthProof(healthRecord) {
        try {
            this.logger.info('Creating new health proof', { recordType: healthRecord.recordType });
            // Fill in default values for missing fields
            const completeRecord = {
                patientName: healthRecord.patientName || 'Anonymous Patient',
                dateOfBirth: healthRecord.dateOfBirth || '1990-01-01',
                vaccinationType: healthRecord.vaccinationType || 'COVID-19',
                vaccinationDate: healthRecord.vaccinationDate || new Date().toISOString().split('T')[0],
                batchNumber: healthRecord.batchNumber || 'BATCH-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
                administeredBy: healthRecord.administeredBy || 'Dr. Health Provider',
                recordType: healthRecord.recordType || 'vaccination',
                authority: healthRecord.authority || 'Health Authority',
                issuedAt: Date.now()
            };
            // Generate privacy-preserving hashes
            const healthRecordHash = this.hashHealthRecord(completeRecord);
            const proofHash = this.createProofHash(healthRecordHash, completeRecord.authority, completeRecord.issuedAt);
            // Create ZK proof data (mock implementation)
            const zkProofData = await this.generateZKProof(completeRecord);
            // Calculate expiry
            const validityDays = healthRecord.validityDays || 30;
            const expiresAt = Date.now() + (validityDays * 24 * 60 * 60 * 1000);
            // Get wallet address for authority
            const walletAddress = await this.walletService.getWalletAddress();
            const proof = {
                proofHash,
                healthRecordHash,
                authority: walletAddress,
                generatedAt: Date.now(),
                expiresAt,
                isRevoked: false,
                verificationCount: 0,
                zkProofData
            };
            // Store proof
            this.proofs.set(proofHash, proof);
            // In a real implementation, this would be stored on the blockchain
            this.logger.info('Health proof created successfully', {
                proofHash: proofHash.slice(0, 20) + '...',
                recordType: completeRecord.recordType,
                expiresAt: new Date(expiresAt).toISOString()
            });
            return proof;
        }
        catch (error) {
            this.logger.error('Failed to create health proof', { error });
            throw error;
        }
    }
    async getHealthProofs(limit = 10, includeExpired = false) {
        try {
            const now = Date.now();
            let proofs = Array.from(this.proofs.values());
            // Filter expired proofs if requested
            if (!includeExpired) {
                proofs = proofs.filter(proof => proof.expiresAt > now && !proof.isRevoked);
            }
            // Sort by creation date (newest first)
            proofs.sort((a, b) => b.generatedAt - a.generatedAt);
            // Apply limit
            return proofs.slice(0, limit);
        }
        catch (error) {
            this.logger.error('Failed to get health proofs', { error });
            throw error;
        }
    }
    async verifyHealthProof(proofHash) {
        try {
            this.logger.info('Verifying health proof', { proofHash: proofHash.slice(0, 20) + '...' });
            const proof = this.proofs.get(proofHash);
            if (!proof) {
                return { isValid: false, reason: 'Proof not found' };
            }
            if (proof.isRevoked) {
                return { isValid: false, proof, reason: 'Proof has been revoked' };
            }
            if (proof.expiresAt < Date.now()) {
                return { isValid: false, proof, reason: 'Proof has expired' };
            }
            // Increment verification count
            proof.verificationCount += 1;
            this.proofs.set(proofHash, proof);
            this.logger.info('Health proof verified successfully', {
                proofHash: proofHash.slice(0, 20) + '...',
                verificationCount: proof.verificationCount
            });
            return { isValid: true, proof };
        }
        catch (error) {
            this.logger.error('Failed to verify health proof', { error });
            throw error;
        }
    }
    async revokeHealthProof(proofHash, reason) {
        try {
            this.logger.info('Revoking health proof', { proofHash: proofHash.slice(0, 20) + '...', reason });
            const proof = this.proofs.get(proofHash);
            if (!proof) {
                return { success: false, message: 'Proof not found' };
            }
            if (proof.isRevoked) {
                return { success: false, message: 'Proof is already revoked' };
            }
            // Check if the current wallet is the authority (in a real implementation)
            const walletAddress = await this.walletService.getWalletAddress();
            if (proof.authority !== walletAddress) {
                return { success: false, message: 'Only the issuing authority can revoke this proof' };
            }
            // Revoke the proof
            proof.isRevoked = true;
            this.proofs.set(proofHash, proof);
            this.logger.info('Health proof revoked successfully', {
                proofHash: proofHash.slice(0, 20) + '...',
                reason
            });
            return { success: true, message: 'Proof revoked successfully' };
        }
        catch (error) {
            this.logger.error('Failed to revoke health proof', { error });
            throw error;
        }
    }
    hashHealthRecord(record) {
        // Create a deterministic hash of sensitive health data
        const sensitiveData = {
            patientName: record.patientName,
            dateOfBirth: record.dateOfBirth,
            vaccinationType: record.vaccinationType,
            vaccinationDate: record.vaccinationDate,
            batchNumber: record.batchNumber,
            administeredBy: record.administeredBy
        };
        const dataString = JSON.stringify(sensitiveData, Object.keys(sensitiveData).sort());
        return '0x' + crypto.createHash('sha256').update(dataString).digest('hex');
    }
    createProofHash(recordHash, authority, timestamp) {
        // Create a unique proof hash
        const proofData = `${recordHash}:${authority}:${timestamp}`;
        return '0x' + crypto.createHash('sha256').update(proofData).digest('hex');
    }
    async generateZKProof(record) {
        // Mock ZK proof generation
        // In a real implementation, this would use the Noir circuit
        this.logger.debug('Generating ZK proof for health record', { recordType: record.recordType });
        // Create a mock proof (in reality, this would be the actual ZK proof)
        const proofString = JSON.stringify({
            recordType: record.recordType,
            authority: record.authority,
            timestamp: record.issuedAt,
            // Sensitive data is not included in the proof itself
            proofVersion: '1.0'
        });
        return new TextEncoder().encode(proofString);
    }
}
exports.HealthPassService = HealthPassService;
//# sourceMappingURL=health-pass-service.js.map