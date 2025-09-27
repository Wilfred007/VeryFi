import { keccak256, toBytes } from 'viem';

/**
 * Privacy-preserving utilities for ZK Health Pass
 * Ensures patient data is never stored in plain text on blockchain
 */

export interface PatientData {
  patientId: string;
  recordType: string;
  authority: string;
  timestamp: number;
  salt: string;
}

export interface HealthRecord {
  // Sensitive data that gets hashed
  patientName?: string;
  dateOfBirth?: string;
  vaccinationType?: string;
  vaccinationDate?: string;
  batchNumber?: string;
  administeredBy?: string;
  // Public metadata
  recordType: string;
  authority: string;
  issuedAt: number;
}

/**
 * Creates a privacy-preserving hash of patient data
 * Original data is never stored - only the hash
 */
export function hashPatientData(data: PatientData): `0x${string}` {
  const dataString = JSON.stringify({
    ...data,
    // Ensure consistent ordering for same hash
    timestamp: data.timestamp,
    salt: data.salt
  });
  
  return keccak256(toBytes(dataString));
}

/**
 * Creates a hash of the complete health record
 * Includes all sensitive medical information
 */
export function hashHealthRecord(record: HealthRecord): `0x${string}` {
  // Remove sensitive fields and create hash
  const sensitiveData = {
    patientName: record.patientName || '',
    dateOfBirth: record.dateOfBirth || '',
    vaccinationType: record.vaccinationType || '',
    vaccinationDate: record.vaccinationDate || '',
    batchNumber: record.batchNumber || '',
    administeredBy: record.administeredBy || '',
    recordType: record.recordType,
    authority: record.authority,
    issuedAt: record.issuedAt,
    // Add entropy to prevent rainbow table attacks
    salt: Math.random().toString(36).substring(2, 15)
  };

  return keccak256(toBytes(JSON.stringify(sensitiveData)));
}

/**
 * Creates a ZK proof hash from the health record hash
 * This represents the cryptographic proof without revealing the data
 */
export function createProofHash(
  recordHash: `0x${string}`,
  authority: string,
  timestamp: number
): `0x${string}` {
  const proofData = {
    recordHash,
    authority,
    timestamp,
    proofType: 'zk-health-pass',
    version: '1.0'
  };

  return keccak256(toBytes(JSON.stringify(proofData)));
}

/**
 * Demonstrates what gets stored on blockchain vs what stays private
 */
export function getStorageBreakdown(record: HealthRecord) {
  const recordHash = hashHealthRecord(record);
  const proofHash = createProofHash(recordHash, record.authority, record.issuedAt);

  return {
    // 🔐 PRIVATE (never stored on blockchain)
    privateData: {
      patientName: record.patientName,
      dateOfBirth: record.dateOfBirth,
      vaccinationType: record.vaccinationType,
      vaccinationDate: record.vaccinationDate,
      batchNumber: record.batchNumber,
      administeredBy: record.administeredBy
    },
    
    // 🌐 PUBLIC (stored on blockchain)
    blockchainData: {
      proofHash,
      recordHash, // Hash only, not original data
      authority: record.authority,
      recordType: record.recordType,
      issuedAt: record.issuedAt,
      expiresAt: record.issuedAt + (30 * 24 * 60 * 60 * 1000), // 30 days
      isRevoked: false
    },
    
    // 📊 PRIVACY SUMMARY
    privacySummary: {
      sensitiveFieldsHashed: 6,
      dataOnBlockchain: 'Hashes only',
      originalDataLocation: 'Never stored',
      verifiableWithoutRevealingData: true
    }
  };
}
