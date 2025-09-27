// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title HealthAuthorityRegistry
 * @dev Registry for managing trusted health authorities
 * Handles registration, verification, and management of health authorities
 */
contract HealthAuthorityRegistry is 
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    // Authority types
    enum AuthorityType {
        Hospital,
        Clinic,
        Laboratory,
        Government,
        Pharmacy,
        University,
        Other
    }

    // Authority status
    enum AuthorityStatus {
        Pending,
        Active,
        Suspended,
        Revoked
    }

    // Health Authority structure
    struct HealthAuthority {
        string name;
        AuthorityType authorityType;
        string country;
        string region;
        bytes publicKey; // secp256k1 public key for ECDSA verification
        string certificateHash; // IPFS hash of X.509 certificate
        string contactInfo; // Contact information
        AuthorityStatus status;
        uint256 registeredAt;
        uint256 lastUpdated;
        address registeredBy;
        uint256 totalRecordsIssued;
        uint256 totalRecordsRevoked;
        string[] accreditations; // List of accreditation bodies
    }

    // Authority application structure
    struct AuthorityApplication {
        address applicant;
        string name;
        AuthorityType authorityType;
        string country;
        string region;
        bytes publicKey;
        string certificateHash;
        string contactInfo;
        string[] accreditations;
        uint256 appliedAt;
        bool isProcessed;
        string rejectionReason;
    }

    // State variables
    mapping(address => HealthAuthority) public healthAuthorities;
    mapping(address => AuthorityApplication) public applications;
    mapping(string => address) public nameToAddress; // Name -> Address mapping
    mapping(AuthorityType => address[]) public authoritiesByType;
    mapping(string => address[]) public authoritiesByCountry;
    
    address[] public allAuthorities;
    address[] public pendingApplications;
    
    uint256 public totalAuthorities;
    uint256 public activeAuthorities;
    uint256 public pendingApplicationsCount;

    // Events
    event ApplicationSubmitted(
        address indexed applicant,
        string name,
        AuthorityType authorityType,
        string country
    );
    
    event AuthorityRegistered(
        address indexed authority,
        string name,
        AuthorityType authorityType,
        address indexed registeredBy
    );
    
    event AuthorityStatusChanged(
        address indexed authority,
        AuthorityStatus oldStatus,
        AuthorityStatus newStatus,
        address indexed changedBy
    );
    
    event AuthorityUpdated(
        address indexed authority,
        string field,
        address indexed updatedBy
    );

    event ApplicationRejected(
        address indexed applicant,
        string reason,
        address indexed rejectedBy
    );

    // Custom errors
    error UnauthorizedAccess();
    error InvalidAuthority();
    error AuthorityAlreadyExists();
    error ApplicationAlreadyExists();
    error ApplicationNotFound();
    error InvalidPublicKey();
    error NameAlreadyTaken();

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
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(REGISTRAR_ROLE, admin);
    }

    /**
     * @dev Submit application to become a health authority
     */
    function submitApplication(
        string calldata name,
        AuthorityType authorityType,
        string calldata country,
        string calldata region,
        bytes calldata publicKey,
        string calldata certificateHash,
        string calldata contactInfo,
        string[] calldata accreditations
    ) external whenNotPaused {
        // Check if application already exists
        if (applications[msg.sender].appliedAt != 0) {
            revert ApplicationAlreadyExists();
        }

        // Check if authority already registered
        if (healthAuthorities[msg.sender].registeredAt != 0) {
            revert AuthorityAlreadyExists();
        }

        // Check if name is already taken
        if (nameToAddress[name] != address(0)) {
            revert NameAlreadyTaken();
        }

        // Validate public key (basic check)
        if (publicKey.length != 64) { // Uncompressed secp256k1 public key
            revert InvalidPublicKey();
        }

        // Create application
        applications[msg.sender] = AuthorityApplication({
            applicant: msg.sender,
            name: name,
            authorityType: authorityType,
            country: country,
            region: region,
            publicKey: publicKey,
            certificateHash: certificateHash,
            contactInfo: contactInfo,
            accreditations: accreditations,
            appliedAt: block.timestamp,
            isProcessed: false,
            rejectionReason: ""
        });

        pendingApplications.push(msg.sender);
        pendingApplicationsCount++;

        emit ApplicationSubmitted(msg.sender, name, authorityType, country);
    }

    /**
     * @dev Approve an authority application
     */
    function approveApplication(
        address applicant
    ) external onlyRole(REGISTRAR_ROLE) whenNotPaused {
        AuthorityApplication storage app = applications[applicant];
        
        if (app.appliedAt == 0) {
            revert ApplicationNotFound();
        }

        if (app.isProcessed) {
            revert ApplicationAlreadyExists();
        }

        // Register the authority
        healthAuthorities[applicant] = HealthAuthority({
            name: app.name,
            authorityType: app.authorityType,
            country: app.country,
            region: app.region,
            publicKey: app.publicKey,
            certificateHash: app.certificateHash,
            contactInfo: app.contactInfo,
            status: AuthorityStatus.Active,
            registeredAt: block.timestamp,
            lastUpdated: block.timestamp,
            registeredBy: msg.sender,
            totalRecordsIssued: 0,
            totalRecordsRevoked: 0,
            accreditations: app.accreditations
        });

        // Update mappings
        nameToAddress[app.name] = applicant;
        authoritiesByType[app.authorityType].push(applicant);
        authoritiesByCountry[app.country].push(applicant);
        allAuthorities.push(applicant);

        // Mark application as processed
        app.isProcessed = true;

        // Update counters
        totalAuthorities++;
        activeAuthorities++;
        pendingApplicationsCount--;

        // Remove from pending applications
        _removePendingApplication(applicant);

        emit AuthorityRegistered(applicant, app.name, app.authorityType, msg.sender);
    }

    /**
     * @dev Reject an authority application
     */
    function rejectApplication(
        address applicant,
        string calldata reason
    ) external onlyRole(REGISTRAR_ROLE) whenNotPaused {
        AuthorityApplication storage app = applications[applicant];
        
        if (app.appliedAt == 0) {
            revert ApplicationNotFound();
        }

        if (app.isProcessed) {
            revert ApplicationAlreadyExists();
        }

        // Mark application as processed and rejected
        app.isProcessed = true;
        app.rejectionReason = reason;

        // Update counters
        pendingApplicationsCount--;

        // Remove from pending applications
        _removePendingApplication(applicant);

        emit ApplicationRejected(applicant, reason, msg.sender);
    }

    /**
     * @dev Update authority status
     */
    function updateAuthorityStatus(
        address authority,
        AuthorityStatus newStatus
    ) external onlyRole(REGISTRAR_ROLE) whenNotPaused {
        if (healthAuthorities[authority].registeredAt == 0) {
            revert InvalidAuthority();
        }

        AuthorityStatus oldStatus = healthAuthorities[authority].status;
        healthAuthorities[authority].status = newStatus;
        healthAuthorities[authority].lastUpdated = block.timestamp;

        // Update active authorities count
        if (oldStatus == AuthorityStatus.Active && newStatus != AuthorityStatus.Active) {
            activeAuthorities--;
        } else if (oldStatus != AuthorityStatus.Active && newStatus == AuthorityStatus.Active) {
            activeAuthorities++;
        }

        emit AuthorityStatusChanged(authority, oldStatus, newStatus, msg.sender);
    }

    /**
     * @dev Update authority information
     */
    function updateAuthorityInfo(
        address authority,
        string calldata contactInfo,
        string calldata certificateHash
    ) external whenNotPaused {
        // Only the authority itself or admin can update
        if (msg.sender != authority && !hasRole(ADMIN_ROLE, msg.sender)) {
            revert UnauthorizedAccess();
        }

        if (healthAuthorities[authority].registeredAt == 0) {
            revert InvalidAuthority();
        }

        healthAuthorities[authority].contactInfo = contactInfo;
        healthAuthorities[authority].certificateHash = certificateHash;
        healthAuthorities[authority].lastUpdated = block.timestamp;

        emit AuthorityUpdated(authority, "info", msg.sender);
    }

    /**
     * @dev Record that an authority issued a health record
     */
    function recordHealthRecordIssued(address authority) external {
        // This should be called by the main registry contract
        if (healthAuthorities[authority].registeredAt == 0) {
            revert InvalidAuthority();
        }

        healthAuthorities[authority].totalRecordsIssued++;
    }

    /**
     * @dev Record that an authority revoked a health record
     */
    function recordHealthRecordRevoked(address authority) external {
        // This should be called by the main registry contract
        if (healthAuthorities[authority].registeredAt == 0) {
            revert InvalidAuthority();
        }

        healthAuthorities[authority].totalRecordsRevoked++;
    }

    /**
     * @dev Get authority information
     */
    function getAuthority(address authority)
        external
        view
        returns (
            string memory name,
            AuthorityType authorityType,
            string memory country,
            string memory region,
            bytes memory publicKey,
            string memory certificateHash,
            string memory contactInfo,
            AuthorityStatus status,
            uint256 registeredAt,
            uint256 totalRecordsIssued,
            uint256 totalRecordsRevoked
        )
    {
        HealthAuthority storage auth = healthAuthorities[authority];
        return (
            auth.name,
            auth.authorityType,
            auth.country,
            auth.region,
            auth.publicKey,
            auth.certificateHash,
            auth.contactInfo,
            auth.status,
            auth.registeredAt,
            auth.totalRecordsIssued,
            auth.totalRecordsRevoked
        );
    }

    /**
     * @dev Get application information
     */
    function getApplication(address applicant)
        external
        view
        returns (
            string memory name,
            AuthorityType authorityType,
            string memory country,
            string memory region,
            bytes memory publicKey,
            string memory certificateHash,
            string memory contactInfo,
            uint256 appliedAt,
            bool isProcessed,
            string memory rejectionReason
        )
    {
        AuthorityApplication storage app = applications[applicant];
        return (
            app.name,
            app.authorityType,
            app.country,
            app.region,
            app.publicKey,
            app.certificateHash,
            app.contactInfo,
            app.appliedAt,
            app.isProcessed,
            app.rejectionReason
        );
    }

    /**
     * @dev Get authorities by type
     */
    function getAuthoritiesByType(AuthorityType authorityType)
        external
        view
        returns (address[] memory)
    {
        return authoritiesByType[authorityType];
    }

    /**
     * @dev Get authorities by country
     */
    function getAuthoritiesByCountry(string calldata country)
        external
        view
        returns (address[] memory)
    {
        return authoritiesByCountry[country];
    }

    /**
     * @dev Get all authorities
     */
    function getAllAuthorities() external view returns (address[] memory) {
        return allAuthorities;
    }

    /**
     * @dev Get pending applications
     */
    function getPendingApplications() external view returns (address[] memory) {
        return pendingApplications;
    }

    /**
     * @dev Get registry statistics
     */
    function getRegistryStats()
        external
        view
        returns (
            uint256 total,
            uint256 active,
            uint256 pending,
            uint256 suspended,
            uint256 revoked
        )
    {
        total = totalAuthorities;
        active = activeAuthorities;
        pending = pendingApplicationsCount;
        
        // Count suspended and revoked
        suspended = 0;
        revoked = 0;
        for (uint256 i = 0; i < allAuthorities.length; i++) {
            AuthorityStatus status = healthAuthorities[allAuthorities[i]].status;
            if (status == AuthorityStatus.Suspended) {
                suspended++;
            } else if (status == AuthorityStatus.Revoked) {
                revoked++;
            }
        }
        
        return (total, active, pending, suspended, revoked);
    }

    /**
     * @dev Check if an authority is active
     */
    function isActiveAuthority(address authority) external view returns (bool) {
        return healthAuthorities[authority].status == AuthorityStatus.Active;
    }

    /**
     * @dev Internal function to remove pending application
     */
    function _removePendingApplication(address applicant) internal {
        for (uint256 i = 0; i < pendingApplications.length; i++) {
            if (pendingApplications[i] == applicant) {
                pendingApplications[i] = pendingApplications[pendingApplications.length - 1];
                pendingApplications.pop();
                break;
            }
        }
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
}
