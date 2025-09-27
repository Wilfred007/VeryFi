// Health Authority Registry ABI - Essential functions
export const HEALTH_AUTHORITY_REGISTRY_ABI = [
  // Submit application
  {
    "inputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "uint8", "name": "authorityType", "type": "uint8"},
      {"internalType": "string", "name": "country", "type": "string"},
      {"internalType": "string", "name": "region", "type": "string"},
      {"internalType": "bytes", "name": "publicKey", "type": "bytes"},
      {"internalType": "string", "name": "certificateHash", "type": "string"},
      {"internalType": "string", "name": "contactInfo", "type": "string"},
      {"internalType": "string[]", "name": "accreditations", "type": "string[]"}
    ],
    "name": "submitApplication",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Approve application
  {
    "inputs": [
      {"internalType": "address", "name": "applicant", "type": "address"}
    ],
    "name": "approveApplication",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Get authority info
  {
    "inputs": [
      {"internalType": "address", "name": "authority", "type": "address"}
    ],
    "name": "getAuthority",
    "outputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "uint8", "name": "authorityType", "type": "uint8"},
      {"internalType": "string", "name": "country", "type": "string"},
      {"internalType": "string", "name": "region", "type": "string"},
      {"internalType": "bytes", "name": "publicKey", "type": "bytes"},
      {"internalType": "string", "name": "certificateHash", "type": "string"},
      {"internalType": "string", "name": "contactInfo", "type": "string"},
      {"internalType": "uint8", "name": "status", "type": "uint8"},
      {"internalType": "uint256", "name": "registeredAt", "type": "uint256"},
      {"internalType": "uint256", "name": "totalRecordsIssued", "type": "uint256"},
      {"internalType": "uint256", "name": "totalRecordsRevoked", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Get all authorities
  {
    "inputs": [],
    "name": "getAllAuthorities",
    "outputs": [
      {"internalType": "address[]", "name": "", "type": "address[]"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Get pending applications
  {
    "inputs": [],
    "name": "getPendingApplications",
    "outputs": [
      {"internalType": "address[]", "name": "", "type": "address[]"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Get registry stats
  {
    "inputs": [],
    "name": "getRegistryStats",
    "outputs": [
      {"internalType": "uint256", "name": "total", "type": "uint256"},
      {"internalType": "uint256", "name": "active", "type": "uint256"},
      {"internalType": "uint256", "name": "pending", "type": "uint256"},
      {"internalType": "uint256", "name": "suspended", "type": "uint256"},
      {"internalType": "uint256", "name": "revoked", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Check if authority is active
  {
    "inputs": [
      {"internalType": "address", "name": "authority", "type": "address"}
    ],
    "name": "isActiveAuthority",
    "outputs": [
      {"internalType": "bool", "name": "", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "applicant", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "name", "type": "string"},
      {"indexed": false, "internalType": "uint8", "name": "authorityType", "type": "uint8"},
      {"indexed": false, "internalType": "string", "name": "country", "type": "string"}
    ],
    "name": "ApplicationSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "authority", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "name", "type": "string"},
      {"indexed": false, "internalType": "uint8", "name": "authorityType", "type": "uint8"},
      {"indexed": true, "internalType": "address", "name": "registeredBy", "type": "address"}
    ],
    "name": "AuthorityRegistered",
    "type": "event"
  }
] as const;

// ZK Health Pass Registry ABI - Essential functions
export const ZK_HEALTH_PASS_REGISTRY_ABI = [
  // Submit ZK proof
  {
    "inputs": [
      {"internalType": "bytes32", "name": "proofHash", "type": "bytes32"},
      {"internalType": "bytes32", "name": "healthRecordHash", "type": "bytes32"},
      {"internalType": "address", "name": "authority", "type": "address"},
      {"internalType": "uint256", "name": "expiresAt", "type": "uint256"},
      {"internalType": "bytes", "name": "proofData", "type": "bytes"}
    ],
    "name": "submitZKProof",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Verify ZK proof
  {
    "inputs": [
      {"internalType": "bytes32", "name": "proofHash", "type": "bytes32"},
      {"internalType": "string", "name": "context", "type": "string"}
    ],
    "name": "verifyZKProof",
    "outputs": [
      {"internalType": "bool", "name": "", "type": "bool"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Get proof details
  {
    "inputs": [
      {"internalType": "bytes32", "name": "proofHash", "type": "bytes32"}
    ],
    "name": "getZKProof",
    "outputs": [
      {"internalType": "bytes32", "name": "proofHash", "type": "bytes32"},
      {"internalType": "bytes32", "name": "healthRecordHash", "type": "bytes32"},
      {"internalType": "address", "name": "authority", "type": "address"},
      {"internalType": "uint256", "name": "generatedAt", "type": "uint256"},
      {"internalType": "uint256", "name": "expiresAt", "type": "uint256"},
      {"internalType": "bool", "name": "isRevoked", "type": "bool"},
      {"internalType": "uint256", "name": "verificationCount", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Get system stats
  {
    "inputs": [],
    "name": "getSystemStats",
    "outputs": [
      {"internalType": "uint256", "name": "totalAuthorities", "type": "uint256"},
      {"internalType": "uint256", "name": "totalProofs", "type": "uint256"},
      {"internalType": "uint256", "name": "totalVerifications", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "bytes32", "name": "proofHash", "type": "bytes32"},
      {"indexed": true, "internalType": "address", "name": "authority", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "expiresAt", "type": "uint256"}
    ],
    "name": "ZKProofSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "bytes32", "name": "proofHash", "type": "bytes32"},
      {"indexed": true, "internalType": "address", "name": "verifier", "type": "address"},
      {"indexed": false, "internalType": "bool", "name": "isValid", "type": "bool"},
      {"indexed": false, "internalType": "string", "name": "context", "type": "string"}
    ],
    "name": "ZKProofVerified",
    "type": "event"
  }
] as const;
