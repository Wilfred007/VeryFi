// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title ZKHealthPassRegistry
 * @dev Main registry contract for ZK Health Pass system
 * Manages health authorities, proof verification, and system governance
 */
contract ZKHealthPassRegistry is 
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant AUTHORITY_MANAGER_ROLE = keccak256("AUTHORITY_MANAGER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // Health Authority structure
    struct HealthAuthority {
        string name;
        string authorityType; // hospital, clinic, lab, government
        bytes publicKey; // secp256k1 public key for ECDSA verification
        string certificate; // X.509 certificate or IPFS hash
        bool isActive;
        uint256 registeredAt;
        uint256 totalRecordsIssued;
        mapping(bytes32 => bool) revokedRecords; // Hash -> revoked status
    }

    // ZK Proof structure
    struct ZKProof {
        bytes32 proofHash; // Hash of the proof data
        bytes32 healthRecordHash; // Hash of the original health record
        address authority; // Health authority that issued the record
        uint256 generatedAt;
        uint256 expiresAt;
        bool isRevoked;
        uint256 verificationCount;
    }

    // Verification event structure
    struct VerificationEvent {
        bytes32 proofHash;
        address verifier;
        bool isValid;
        uint256 timestamp;
        string context; // Additional verification context
    }

    // State variables
    mapping(address => HealthAuthority) public healthAuthorities;
    mapping(bytes32 => ZKProof) public zkProofs;
    mapping(bytes32 => VerificationEvent[]) public verificationHistory;
    
    address[] public authorityAddresses;
    bytes32[] public proofHashes;
    
    uint256 public totalAuthorities;
    uint256 public totalProofs;
    uint256 public totalVerifications;

    // Events
    event HealthAuthorityRegistered(
        address indexed authority,
        string name,
        string authorityType
    );
    
    event HealthAuthorityUpdated(
        address indexed authority,
        bool isActive
    );
    
    event ZKProofSubmitted(
        bytes32 indexed proofHash,
        bytes32 indexed healthRecordHash,
        address indexed authority,
        uint256 expiresAt
    );
    
    event ZKProofVerified(
        bytes32 indexed proofHash,
        address indexed verifier,
        bool isValid,
        string context
    );
    
    event ZKProofRevoked(
        bytes32 indexed proofHash,
        address indexed revoker
    );

    event HealthRecordRevoked(
        bytes32 indexed recordHash,
        address indexed authority
    );

    // Custom errors
    error UnauthorizedAccess();
    error InvalidAuthority();
    error InvalidProof();
    error ProofExpired();
    error ProofAlreadyExists();
    error AuthorityAlreadyExists();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract
     */
    function initialize(address admin) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(AUTHORITY_MANAGER_ROLE, admin);
    }

    /**
     * @dev Register a new health authority
     */
    function registerHealthAuthority(
        address authorityAddress,
        string calldata name,
        string calldata authorityType,
        bytes calldata publicKey,
        string calldata certificate
    ) external onlyRole(AUTHORITY_MANAGER_ROLE) whenNotPaused {
        if (healthAuthorities[authorityAddress].registeredAt != 0) {
            revert AuthorityAlreadyExists();
        }

        HealthAuthority storage authority = healthAuthorities[authorityAddress];
        authority.name = name;
        authority.authorityType = authorityType;
        authority.publicKey = publicKey;
        authority.certificate = certificate;
        authority.isActive = true;
        authority.registeredAt = block.timestamp;

        authorityAddresses.push(authorityAddress);
        totalAuthorities++;

        emit HealthAuthorityRegistered(authorityAddress, name, authorityType);
    }

    /**
     * @dev Update health authority status
     */
    function updateHealthAuthorityStatus(
        address authorityAddress,
        bool isActive
    ) external onlyRole(AUTHORITY_MANAGER_ROLE) whenNotPaused {
        if (healthAuthorities[authorityAddress].registeredAt == 0) {
            revert InvalidAuthority();
        }

        healthAuthorities[authorityAddress].isActive = isActive;
        emit HealthAuthorityUpdated(authorityAddress, isActive);
    }

    /**
     * @dev Submit a ZK proof for verification
     */
    function submitZKProof(
        bytes32 proofHash,
        bytes32 healthRecordHash,
        address authority,
        uint256 expiresAt,
        bytes calldata proofData
    ) external whenNotPaused nonReentrant {
        if (zkProofs[proofHash].generatedAt != 0) {
            revert ProofAlreadyExists();
        }

        if (!healthAuthorities[authority].isActive) {
            revert InvalidAuthority();
        }

        // Verify the proof is valid (basic checks)
        if (proofHash == bytes32(0) || healthRecordHash == bytes32(0)) {
            revert InvalidProof();
        }

        zkProofs[proofHash] = ZKProof({
            proofHash: proofHash,
            healthRecordHash: healthRecordHash,
            authority: authority,
            generatedAt: block.timestamp,
            expiresAt: expiresAt,
            isRevoked: false,
            verificationCount: 0
        });

        proofHashes.push(proofHash);
        totalProofs++;
        healthAuthorities[authority].totalRecordsIssued++;

        emit ZKProofSubmitted(proofHash, healthRecordHash, authority, expiresAt);
    }

    /**
     * @dev Verify a ZK proof
     */
    function verifyZKProof(
        bytes32 proofHash,
        string calldata context
    ) external whenNotPaused returns (bool isValid) {
        ZKProof storage proof = zkProofs[proofHash];
        
        if (proof.generatedAt == 0) {
            isValid = false;
        } else if (proof.isRevoked) {
            isValid = false;
        } else if (proof.expiresAt > 0 && block.timestamp > proof.expiresAt) {
            isValid = false;
        } else if (!healthAuthorities[proof.authority].isActive) {
            isValid = false;
        } else if (healthAuthorities[proof.authority].revokedRecords[proof.healthRecordHash]) {
            isValid = false;
        } else {
            isValid = true;
            proof.verificationCount++;
        }

        // Record verification event
        verificationHistory[proofHash].push(VerificationEvent({
            proofHash: proofHash,
            verifier: msg.sender,
            isValid: isValid,
            timestamp: block.timestamp,
            context: context
        }));

        totalVerifications++;

        emit ZKProofVerified(proofHash, msg.sender, isValid, context);
        return isValid;
    }

    /**
     * @dev Revoke a ZK proof
     */
    function revokeZKProof(
        bytes32 proofHash
    ) external whenNotPaused {
        ZKProof storage proof = zkProofs[proofHash];
        
        if (proof.generatedAt == 0) {
            revert InvalidProof();
        }

        // Only the issuing authority or admin can revoke
        if (msg.sender != proof.authority && !hasRole(ADMIN_ROLE, msg.sender)) {
            revert UnauthorizedAccess();
        }

        proof.isRevoked = true;
        emit ZKProofRevoked(proofHash, msg.sender);
    }

    /**
     * @dev Revoke a health record (affects all proofs based on it)
     */
    function revokeHealthRecord(
        bytes32 recordHash
    ) external whenNotPaused {
        // Only registered authorities can revoke their own records
        if (!healthAuthorities[msg.sender].isActive && !hasRole(ADMIN_ROLE, msg.sender)) {
            revert UnauthorizedAccess();
        }

        healthAuthorities[msg.sender].revokedRecords[recordHash] = true;
        emit HealthRecordRevoked(recordHash, msg.sender);
    }

    /**
     * @dev Get health authority information
     */
    function getHealthAuthority(address authorityAddress) 
        external 
        view 
        returns (
            string memory name,
            string memory authorityType,
            bytes memory publicKey,
            string memory certificate,
            bool isActive,
            uint256 registeredAt,
            uint256 totalRecordsIssued
        ) 
    {
        HealthAuthority storage authority = healthAuthorities[authorityAddress];
        return (
            authority.name,
            authority.authorityType,
            authority.publicKey,
            authority.certificate,
            authority.isActive,
            authority.registeredAt,
            authority.totalRecordsIssued
        );
    }

    /**
     * @dev Get ZK proof information
     */
    function getZKProof(bytes32 proofHash)
        external
        view
        returns (
            bytes32 healthRecordHash,
            address authority,
            uint256 generatedAt,
            uint256 expiresAt,
            bool isRevoked,
            uint256 verificationCount
        )
    {
        ZKProof storage proof = zkProofs[proofHash];
        return (
            proof.healthRecordHash,
            proof.authority,
            proof.generatedAt,
            proof.expiresAt,
            proof.isRevoked,
            proof.verificationCount
        );
    }

    /**
     * @dev Get verification history for a proof
     */
    function getVerificationHistory(bytes32 proofHash)
        external
        view
        returns (VerificationEvent[] memory)
    {
        return verificationHistory[proofHash];
    }

    /**
     * @dev Get system statistics
     */
    function getSystemStats()
        external
        view
        returns (
            uint256 _totalAuthorities,
            uint256 _totalProofs,
            uint256 _totalVerifications
        )
    {
        return (totalAuthorities, totalProofs, totalVerifications);
    }

    /**
     * @dev Check if a health record is revoked
     */
    function isHealthRecordRevoked(address authority, bytes32 recordHash)
        external
        view
        returns (bool)
    {
        return healthAuthorities[authority].revokedRecords[recordHash];
    }

    /**
     * @dev Pause the contract (admin only)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract (admin only)
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Authorize upgrade (admin only)
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(ADMIN_ROLE)
    {}

    /**
     * @dev Get all authority addresses (for enumeration)
     */
    function getAllAuthorities() external view returns (address[] memory) {
        return authorityAddresses;
    }

    /**
     * @dev Get all proof hashes (for enumeration)
     */
    function getAllProofHashes() external view returns (bytes32[] memory) {
        return proofHashes;
    }
}
