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

export interface HealthPassFormData {
  recordType: 'vaccination' | 'test' | 'treatment';
  patientName: string;
  dateOfBirth: string;
  vaccinationType?: string;
  vaccinationDate?: string;
  batchNumber?: string;
  administeredBy?: string;
  authority?: string;
  validityDays?: number;
}

export interface ProofVerificationResult {
  isValid: boolean;
  proof?: ZKHealthProof;
  reason?: string;
  verifiedAt: number;
}

export interface HealthPassStats {
  totalProofs: number;
  activeProofs: number;
  expiredProofs: number;
  revokedProofs: number;
  totalVerifications: number;
}
