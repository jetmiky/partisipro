// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ClaimTopicsRegistry.sol";
import "./TrustedIssuersRegistry.sol";

/**
 * @title IdentityRegistry
 * @dev Central identity and claims management contract for ERC-3643 compliance
 * @notice Core of the ERC-3643 system - manages investor identities and compliance claims
 */
contract IdentityRegistry is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    struct Identity {
        address wallet;
        bool exists;
        uint256 createdAt;
        uint256 updatedAt;
        uint256[] claimTopics;
        mapping(uint256 => Claim) claims;
    }

    struct Claim {
        uint256 topicId;
        address issuer;
        bytes data;
        uint256 issuedAt;
        uint256 expiresAt;
        bool isActive;
    }

    struct ClaimView {
        uint256 topicId;
        address issuer;
        bytes data;
        uint256 issuedAt;
        uint256 expiresAt;
        bool isActive;
    }

    mapping(address => Identity) public identities;
    mapping(address => bool) public isVerified;
    address[] public registeredIdentities;

    ClaimTopicsRegistry public claimTopicsRegistry;
    TrustedIssuersRegistry public trustedIssuersRegistry;

    // Verification requirements - which claims are needed for verification
    uint256[] public requiredClaimTopics;
    mapping(uint256 => bool) public isRequiredClaimTopic;

    event IdentityRegistered(address indexed identity, uint256 timestamp);
    event IdentityUpdated(address indexed identity, uint256 timestamp);
    event IdentityRemoved(address indexed identity, uint256 timestamp);
    event ClaimAdded(address indexed identity, uint256 indexed topicId, address indexed issuer, bytes data);
    event ClaimUpdated(address indexed identity, uint256 indexed topicId, address indexed issuer, bytes data);
    event ClaimRemoved(address indexed identity, uint256 indexed topicId);
    event VerificationStatusChanged(address indexed identity, bool isVerified);
    event RequiredClaimTopicsUpdated(uint256[] requiredTopics);

    modifier onlyExistingIdentity(address _identity) {
        require(identities[_identity].exists, "Identity does not exist");
        _;
    }

    modifier onlyTrustedIssuer(uint256 _topicId) {
        require(trustedIssuersRegistry.isTrustedIssuer(msg.sender, _topicId), "Not authorized issuer for this topic");
        _;
    }

    constructor(address _admin, address _claimTopicsRegistry, address _trustedIssuersRegistry) {
        require(_admin != address(0), "Invalid admin address");
        require(_claimTopicsRegistry != address(0), "Invalid claim topics registry");
        require(_trustedIssuersRegistry != address(0), "Invalid trusted issuers registry");

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);

        claimTopicsRegistry = ClaimTopicsRegistry(_claimTopicsRegistry);
        trustedIssuersRegistry = TrustedIssuersRegistry(_trustedIssuersRegistry);

        // Initialize with KYC as the only required claim
        requiredClaimTopics.push(claimTopicsRegistry.KYC_APPROVED());
        isRequiredClaimTopic[claimTopicsRegistry.KYC_APPROVED()] = true;
    }

    /**
     * @dev Register a new identity
     * @param _identity Address to register as an identity
     */
    function registerIdentity(address _identity) external onlyRole(OPERATOR_ROLE) {
        require(_identity != address(0), "Invalid identity address");
        require(!identities[_identity].exists, "Identity already exists");

        identities[_identity].wallet = _identity;
        identities[_identity].exists = true;
        identities[_identity].createdAt = block.timestamp;
        identities[_identity].updatedAt = block.timestamp;

        registeredIdentities.push(_identity);

        emit IdentityRegistered(_identity, block.timestamp);
    }

    /**
     * @dev Add a claim to an identity
     * @param _identity Address of the identity
     * @param _topicId Claim topic ID
     * @param _data Claim data
     * @param _expiresAt Expiration timestamp (0 for no expiration)
     */
    function addClaim(
        address _identity,
        uint256 _topicId,
        bytes calldata _data,
        uint256 _expiresAt
    ) external onlyTrustedIssuer(_topicId) nonReentrant {
        require(_identity != address(0), "Invalid identity address");
        require(claimTopicsRegistry.isClaimTopicValid(_topicId), "Invalid claim topic");
        require(_expiresAt == 0 || _expiresAt > block.timestamp, "Invalid expiration time");

        // Register identity if it doesn't exist
        if (!identities[_identity].exists) {
            identities[_identity].wallet = _identity;
            identities[_identity].exists = true;
            identities[_identity].createdAt = block.timestamp;
            registeredIdentities.push(_identity);
            emit IdentityRegistered(_identity, block.timestamp);
        }

        Identity storage identity = identities[_identity];

        // Check if claim already exists for this topic
        bool claimExists = identity.claims[_topicId].topicId != 0;

        // Add or update the claim
        identity.claims[_topicId] = Claim({
            topicId: _topicId,
            issuer: msg.sender,
            data: _data,
            issuedAt: block.timestamp,
            expiresAt: _expiresAt,
            isActive: true
        });

        // Add topic to identity's claim topics if new
        if (!claimExists) {
            identity.claimTopics.push(_topicId);
        }

        identity.updatedAt = block.timestamp;

        // Record in trusted issuers registry
        trustedIssuersRegistry.recordClaimIssuance(msg.sender, _identity, _topicId);

        // Update verification status
        _updateVerificationStatus(_identity);

        if (claimExists) {
            emit ClaimUpdated(_identity, _topicId, msg.sender, _data);
        } else {
            emit ClaimAdded(_identity, _topicId, msg.sender, _data);
        }
    }

    /**
     * @dev Remove a claim from an identity
     * @param _identity Address of the identity
     * @param _topicId Claim topic ID to remove
     */
    function removeClaim(address _identity, uint256 _topicId) external onlyExistingIdentity(_identity) nonReentrant {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || identities[_identity].claims[_topicId].issuer == msg.sender,
            "Not authorized to remove this claim"
        );

        Identity storage identity = identities[_identity];
        require(identity.claims[_topicId].topicId != 0, "Claim does not exist");

        // Mark claim as inactive
        identity.claims[_topicId].isActive = false;
        identity.updatedAt = block.timestamp;

        // Update verification status
        _updateVerificationStatus(_identity);

        emit ClaimRemoved(_identity, _topicId);
    }

    /**
     * @dev Remove an identity completely
     * @param _identity Address of the identity to remove
     */
    function removeIdentity(address _identity) external onlyRole(ADMIN_ROLE) onlyExistingIdentity(_identity) {
        identities[_identity].exists = false;
        isVerified[_identity] = false;

        emit IdentityRemoved(_identity, block.timestamp);
        emit VerificationStatusChanged(_identity, false);
    }

    /**
     * @dev Update verification status based on required claims
     * @param _identity Address of the identity to check
     */
    function _updateVerificationStatus(address _identity) internal {
        bool verified = _checkVerificationStatus(_identity);

        if (isVerified[_identity] != verified) {
            isVerified[_identity] = verified;
            emit VerificationStatusChanged(_identity, verified);
        }
    }

    /**
     * @dev Check if an identity meets verification requirements
     * @param _identity Address of the identity to check
     * @return bool True if identity is verified
     */
    function _checkVerificationStatus(address _identity) internal view returns (bool) {
        if (!identities[_identity].exists) {
            return false;
        }

        // Check all required claim topics
        for (uint256 i = 0; i < requiredClaimTopics.length; i++) {
            uint256 topicId = requiredClaimTopics[i];
            Claim storage claim = identities[_identity].claims[topicId];

            // Check if claim exists, is active, and not expired
            if (claim.topicId == 0 || !claim.isActive || (claim.expiresAt != 0 && claim.expiresAt <= block.timestamp)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @dev Check if an identity is verified
     * @param _identity Address to check
     * @return bool True if identity is verified
     */
    function isIdentityVerified(address _identity) external view returns (bool) {
        return isVerified[_identity];
    }

    /**
     * @dev Get claim information for an identity and topic
     * @param _identity Address of the identity
     * @param _topicId Claim topic ID
     * @return ClaimView The claim information
     */
    function getClaim(address _identity, uint256 _topicId) external view returns (ClaimView memory) {
        require(identities[_identity].exists, "Identity does not exist");
        Claim storage claim = identities[_identity].claims[_topicId];
        require(claim.topicId != 0, "Claim does not exist");

        return
            ClaimView({
                topicId: claim.topicId,
                issuer: claim.issuer,
                data: claim.data,
                issuedAt: claim.issuedAt,
                expiresAt: claim.expiresAt,
                isActive: claim.isActive
            });
    }

    /**
     * @dev Get all claim topics for an identity
     * @param _identity Address of the identity
     * @return uint256[] Array of claim topic IDs
     */
    function getClaimTopics(address _identity) external view returns (uint256[] memory) {
        require(identities[_identity].exists, "Identity does not exist");
        return identities[_identity].claimTopics;
    }

    /**
     * @dev Check if an identity has a specific claim
     * @param _identity Address of the identity
     * @param _topicId Claim topic ID
     * @return bool True if identity has the claim and it's active and not expired
     */
    function hasClaim(address _identity, uint256 _topicId) external view returns (bool) {
        if (!identities[_identity].exists) {
            return false;
        }

        Claim storage claim = identities[_identity].claims[_topicId];
        return claim.topicId != 0 && claim.isActive && (claim.expiresAt == 0 || claim.expiresAt > block.timestamp);
    }

    /**
     * @dev Update required claim topics for verification
     * @param _requiredTopics Array of claim topic IDs required for verification
     */
    function updateRequiredClaimTopics(uint256[] calldata _requiredTopics) external onlyRole(ADMIN_ROLE) {
        require(_requiredTopics.length > 0, "Must have at least one required topic");
        require(claimTopicsRegistry.areClaimTopicsValid(_requiredTopics), "Invalid claim topics");

        // Clear existing required topics
        for (uint256 i = 0; i < requiredClaimTopics.length; i++) {
            isRequiredClaimTopic[requiredClaimTopics[i]] = false;
        }

        // Set new required topics
        requiredClaimTopics = _requiredTopics;
        for (uint256 i = 0; i < _requiredTopics.length; i++) {
            isRequiredClaimTopic[_requiredTopics[i]] = true;
        }

        // Update verification status for all identities
        for (uint256 i = 0; i < registeredIdentities.length; i++) {
            _updateVerificationStatus(registeredIdentities[i]);
        }

        emit RequiredClaimTopicsUpdated(_requiredTopics);
    }

    /**
     * @dev Get required claim topics for verification
     * @return uint256[] Array of required claim topic IDs
     */
    function getRequiredClaimTopics() external view returns (uint256[] memory) {
        return requiredClaimTopics;
    }

    /**
     * @dev Get all registered identities
     * @return address[] Array of all registered identity addresses
     */
    function getAllIdentities() external view returns (address[] memory) {
        return registeredIdentities;
    }

    /**
     * @dev Get all verified identities
     * @return verifiedIdentities Array of verified identity addresses
     */
    function getVerifiedIdentities() external view returns (address[] memory verifiedIdentities) {
        uint256 verifiedCount = 0;

        // Count verified identities
        for (uint256 i = 0; i < registeredIdentities.length; i++) {
            if (isVerified[registeredIdentities[i]]) {
                verifiedCount++;
            }
        }

        // Create array of verified identities
        verifiedIdentities = new address[](verifiedCount);
        uint256 index = 0;

        for (uint256 i = 0; i < registeredIdentities.length; i++) {
            if (isVerified[registeredIdentities[i]]) {
                verifiedIdentities[index] = registeredIdentities[i];
                index++;
            }
        }
    }

    /**
     * @dev Get identity information
     * @param _identity Address of the identity
     * @return wallet Identity wallet address
     * @return exists Whether identity exists
     * @return createdAt Creation timestamp
     * @return updatedAt Last update timestamp
     * @return verified Verification status
     */
    function getIdentityInfo(
        address _identity
    ) external view returns (address wallet, bool exists, uint256 createdAt, uint256 updatedAt, bool verified) {
        Identity storage identity = identities[_identity];
        return (identity.wallet, identity.exists, identity.createdAt, identity.updatedAt, isVerified[_identity]);
    }

    /**
     * @dev Get total number of registered identities
     * @return uint256 Total number of registered identities
     */
    function getTotalIdentities() external view returns (uint256) {
        return registeredIdentities.length;
    }

    /**
     * @dev Check if caller has admin role
     * @return bool True if caller has admin role
     */
    function isAdmin(address _account) external view returns (bool) {
        return hasRole(ADMIN_ROLE, _account);
    }

    /**
     * @dev Update registry contracts
     * @param _claimTopicsRegistry New claim topics registry address
     * @param _trustedIssuersRegistry New trusted issuers registry address
     */
    function updateRegistries(
        address _claimTopicsRegistry,
        address _trustedIssuersRegistry
    ) external onlyRole(ADMIN_ROLE) {
        if (_claimTopicsRegistry != address(0)) {
            claimTopicsRegistry = ClaimTopicsRegistry(_claimTopicsRegistry);
        }
        if (_trustedIssuersRegistry != address(0)) {
            trustedIssuersRegistry = TrustedIssuersRegistry(_trustedIssuersRegistry);
        }
    }

    /**
     * @dev Batch verify multiple identities (gas optimization)
     * @param _identities Array of identity addresses to check
     * @return verificationStatuses Array of verification statuses
     */
    function batchCheckVerification(
        address[] calldata _identities
    ) external view returns (bool[] memory verificationStatuses) {
        verificationStatuses = new bool[](_identities.length);
        for (uint256 i = 0; i < _identities.length; i++) {
            verificationStatuses[i] = isVerified[_identities[i]];
        }
    }
}
