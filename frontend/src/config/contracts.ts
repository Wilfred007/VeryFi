// Contract addresses on Lisk Sepolia
export const CONTRACT_ADDRESSES = {
  HEALTH_AUTHORITY_REGISTRY: '0xF0AcD34E64736F6AB60E39088469ae86fF165AA9',
  ZK_HEALTH_PASS_REGISTRY: '0x749AFac3004131CF8DB9e820Bc6D9f3F654Ab44F',
  // ZK_PROOF_VERIFIER: '', // To be deployed
} as const;

// Import LISK_SEPOLIA from wagmi config
export { LISK_SEPOLIA } from './wagmi'

// Authority types enum
export enum AuthorityType {
  Hospital = 0,
  Clinic = 1,
  Laboratory = 2,
  Government = 3,
  Pharmacy = 4,
  University = 5,
  Other = 6,
}

// Authority status enum
export enum AuthorityStatus {
  Pending = 0,
  Active = 1,
  Suspended = 2,
  Revoked = 3,
}

export const AUTHORITY_TYPE_LABELS = {
  [AuthorityType.Hospital]: 'Hospital',
  [AuthorityType.Clinic]: 'Clinic',
  [AuthorityType.Laboratory]: 'Laboratory',
  [AuthorityType.Government]: 'Government',
  [AuthorityType.Pharmacy]: 'Pharmacy',
  [AuthorityType.University]: 'University',
  [AuthorityType.Other]: 'Other',
};

export const AUTHORITY_STATUS_LABELS = {
  [AuthorityStatus.Pending]: 'Pending',
  [AuthorityStatus.Active]: 'Active',
  [AuthorityStatus.Suspended]: 'Suspended',
  [AuthorityStatus.Revoked]: 'Revoked',
};
