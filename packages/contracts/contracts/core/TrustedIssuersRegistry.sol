// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ClaimTopicsRegistry.sol";

/**
 * @title TrustedIssuersRegistry
 * @dev Registry contract for managing trusted claim issuers for ERC-3643 compliance
 * @notice Manages addresses authorized to issue claims (platform backend, KYC providers)
 */
contract TrustedIssuersRegistry is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    struct TrustedIssuer {
        address issuerAddress;
        string name;
        string description;
        uint256[] authorizedTopics;
        bool isActive;
        uint256 addedAt;
        uint256 updatedAt;
        uint256 claimsIssued;
    }

    mapping(address => TrustedIssuer) public trustedIssuers;
    mapping(address => mapping(uint256 => bool)) public issuerTopicAuthorization;
    address[] public issuersList;

    ClaimTopicsRegistry public claimTopicsRegistry;

    event TrustedIssuerAdded(address indexed issuer, string name, uint256[] authorizedTopics);
    event TrustedIssuerUpdated(address indexed issuer, string name, uint256[] authorizedTopics);
    event TrustedIssuerDeactivated(address indexed issuer);
    event TrustedIssuerReactivated(address indexed issuer);
    event IssuerTopicsUpdated(address indexed issuer, uint256[] authorizedTopics);
    event ClaimIssued(address indexed issuer, address indexed subject, uint256 topicId);

    modifier onlyValidIssuer(address _issuer) {
        require(trustedIssuers[_issuer].issuerAddress != address(0), "Issuer does not exist");
        _;
    }

    modifier onlyActiveIssuer(address _issuer) {
        require(trustedIssuers[_issuer].isActive, "Issuer is not active");
        _;
    }

    constructor(address _admin, address _claimTopicsRegistry) {
        require(_admin != address(0), "Invalid admin address");
        require(_claimTopicsRegistry != address(0), "Invalid claim topics registry");

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);

        claimTopicsRegistry = ClaimTopicsRegistry(_claimTopicsRegistry);
    }

    /**
     * @dev Add a new trusted issuer
     * @param _issuer Address of the issuer
     * @param _name Name of the issuer organization
     * @param _description Description of the issuer
     * @param _authorizedTopics Array of claim topic IDs the issuer can issue
     */
    function addTrustedIssuer(
        address _issuer,
        string calldata _name,
        string calldata _description,
        uint256[] calldata _authorizedTopics
    ) external onlyRole(ADMIN_ROLE) {
        require(_issuer != address(0), "Invalid issuer address");
        require(trustedIssuers[_issuer].issuerAddress == address(0), "Issuer already exists");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_authorizedTopics.length > 0, "Must authorize at least one topic");

        // Validate all authorized topics exist and are active
        require(claimTopicsRegistry.areClaimTopicsValid(_authorizedTopics), "Invalid or inactive claim topics");

        trustedIssuers[_issuer] = TrustedIssuer({
            issuerAddress: _issuer,
            name: _name,
            description: _description,
            authorizedTopics: _authorizedTopics,
            isActive: true,
            addedAt: block.timestamp,
            updatedAt: block.timestamp,
            claimsIssued: 0
        });

        // Set topic authorizations
        for (uint256 i = 0; i < _authorizedTopics.length; i++) {
            issuerTopicAuthorization[_issuer][_authorizedTopics[i]] = true;
        }

        issuersList.push(_issuer);

        emit TrustedIssuerAdded(_issuer, _name, _authorizedTopics);
    }

    /**
     * @dev Update trusted issuer information
     * @param _issuer Address of the issuer
     * @param _name New name of the issuer
     * @param _description New description of the issuer
     */
    function updateTrustedIssuer(
        address _issuer,
        string calldata _name,
        string calldata _description
    ) external onlyRole(ADMIN_ROLE) onlyValidIssuer(_issuer) {
        require(bytes(_name).length > 0, "Name cannot be empty");

        TrustedIssuer storage issuer = trustedIssuers[_issuer];
        issuer.name = _name;
        issuer.description = _description;
        issuer.updatedAt = block.timestamp;

        emit TrustedIssuerUpdated(_issuer, _name, issuer.authorizedTopics);
    }

    /**
     * @dev Update authorized topics for a trusted issuer
     * @param _issuer Address of the issuer
     * @param _authorizedTopics New array of authorized claim topic IDs
     */
    function updateIssuerTopics(
        address _issuer,
        uint256[] calldata _authorizedTopics
    ) external onlyRole(ADMIN_ROLE) onlyValidIssuer(_issuer) {
        require(_authorizedTopics.length > 0, "Must authorize at least one topic");

        // Validate all authorized topics exist and are active
        require(claimTopicsRegistry.areClaimTopicsValid(_authorizedTopics), "Invalid or inactive claim topics");

        TrustedIssuer storage issuer = trustedIssuers[_issuer];

        // Clear existing authorizations
        for (uint256 i = 0; i < issuer.authorizedTopics.length; i++) {
            issuerTopicAuthorization[_issuer][issuer.authorizedTopics[i]] = false;
        }

        // Set new authorizations
        issuer.authorizedTopics = _authorizedTopics;
        for (uint256 i = 0; i < _authorizedTopics.length; i++) {
            issuerTopicAuthorization[_issuer][_authorizedTopics[i]] = true;
        }

        issuer.updatedAt = block.timestamp;

        emit IssuerTopicsUpdated(_issuer, _authorizedTopics);
    }

    /**
     * @dev Deactivate a trusted issuer
     * @param _issuer Address of the issuer to deactivate
     */
    function deactivateTrustedIssuer(
        address _issuer
    ) external onlyRole(ADMIN_ROLE) onlyValidIssuer(_issuer) onlyActiveIssuer(_issuer) {
        trustedIssuers[_issuer].isActive = false;
        trustedIssuers[_issuer].updatedAt = block.timestamp;

        emit TrustedIssuerDeactivated(_issuer);
    }

    /**
     * @dev Reactivate a trusted issuer
     * @param _issuer Address of the issuer to reactivate
     */
    function reactivateTrustedIssuer(address _issuer) external onlyRole(ADMIN_ROLE) onlyValidIssuer(_issuer) {
        require(!trustedIssuers[_issuer].isActive, "Issuer is already active");

        trustedIssuers[_issuer].isActive = true;
        trustedIssuers[_issuer].updatedAt = block.timestamp;

        emit TrustedIssuerReactivated(_issuer);
    }

    /**
     * @dev Record that an issuer has issued a claim (called by IdentityRegistry)
     * @param _issuer Address of the issuer
     * @param _subject Address of the claim subject
     * @param _topicId Claim topic ID that was issued
     */
    function recordClaimIssuance(
        address _issuer,
        address _subject,
        uint256 _topicId
    ) external onlyRole(OPERATOR_ROLE) onlyValidIssuer(_issuer) onlyActiveIssuer(_issuer) {
        require(isTrustedIssuer(_issuer, _topicId), "Issuer not authorized for this topic");

        trustedIssuers[_issuer].claimsIssued++;

        emit ClaimIssued(_issuer, _subject, _topicId);
    }

    /**
     * @dev Check if an address is a trusted issuer for a specific claim topic
     * @param _issuer Address to check
     * @param _topicId Claim topic ID to check authorization for
     * @return bool True if the issuer is trusted and authorized for the topic
     */
    function isTrustedIssuer(address _issuer, uint256 _topicId) public view returns (bool) {
        return
            trustedIssuers[_issuer].isActive &&
            issuerTopicAuthorization[_issuer][_topicId] &&
            claimTopicsRegistry.isClaimTopicValid(_topicId);
    }

    /**
     * @dev Check if an address is a trusted issuer for any topic
     * @param _issuer Address to check
     * @return bool True if the issuer is trusted and active
     */
    function isTrustedIssuer(address _issuer) external view returns (bool) {
        return trustedIssuers[_issuer].isActive && trustedIssuers[_issuer].issuerAddress != address(0);
    }

    /**
     * @dev Get trusted issuer information
     * @param _issuer Address of the issuer
     * @return TrustedIssuer The issuer information
     */
    function getTrustedIssuer(address _issuer) external view returns (TrustedIssuer memory) {
        require(trustedIssuers[_issuer].issuerAddress != address(0), "Issuer does not exist");
        return trustedIssuers[_issuer];
    }

    /**
     * @dev Get authorized topics for an issuer
     * @param _issuer Address of the issuer
     * @return uint256[] Array of authorized claim topic IDs
     */
    function getIssuerAuthorizedTopics(address _issuer) external view returns (uint256[] memory) {
        require(trustedIssuers[_issuer].issuerAddress != address(0), "Issuer does not exist");
        return trustedIssuers[_issuer].authorizedTopics;
    }

    /**
     * @dev Get all trusted issuers
     * @return address[] Array of all trusted issuer addresses
     */
    function getAllTrustedIssuers() external view returns (address[] memory) {
        return issuersList;
    }

    /**
     * @dev Get active trusted issuers
     * @return activeIssuers Array of active trusted issuer addresses
     */
    function getActiveTrustedIssuers() external view returns (address[] memory activeIssuers) {
        uint256 activeCount = 0;

        // Count active issuers
        for (uint256 i = 0; i < issuersList.length; i++) {
            if (trustedIssuers[issuersList[i]].isActive) {
                activeCount++;
            }
        }

        // Create array of active issuers
        activeIssuers = new address[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < issuersList.length; i++) {
            if (trustedIssuers[issuersList[i]].isActive) {
                activeIssuers[index] = issuersList[i];
                index++;
            }
        }
    }

    /**
     * @dev Get trusted issuers for a specific claim topic
     * @param _topicId Claim topic ID
     * @return authorizedIssuers Array of issuer addresses authorized for the topic
     */
    function getTrustedIssuersForTopic(uint256 _topicId) external view returns (address[] memory authorizedIssuers) {
        require(claimTopicsRegistry.isClaimTopicValid(_topicId), "Invalid claim topic");

        uint256 authorizedCount = 0;

        // Count authorized issuers for the topic
        for (uint256 i = 0; i < issuersList.length; i++) {
            if (isTrustedIssuer(issuersList[i], _topicId)) {
                authorizedCount++;
            }
        }

        // Create array of authorized issuers
        authorizedIssuers = new address[](authorizedCount);
        uint256 index = 0;

        for (uint256 i = 0; i < issuersList.length; i++) {
            if (isTrustedIssuer(issuersList[i], _topicId)) {
                authorizedIssuers[index] = issuersList[i];
                index++;
            }
        }
    }

    /**
     * @dev Get the total number of trusted issuers
     * @return uint256 Total number of trusted issuers
     */
    function getTotalTrustedIssuers() external view returns (uint256) {
        return issuersList.length;
    }

    /**
     * @dev Check if caller has admin role
     * @return bool True if caller has admin role
     */
    function isAdmin(address _account) external view returns (bool) {
        return hasRole(ADMIN_ROLE, _account);
    }

    /**
     * @dev Update the claim topics registry address
     * @param _newRegistry Address of the new claim topics registry
     */
    function updateClaimTopicsRegistry(address _newRegistry) external onlyRole(ADMIN_ROLE) {
        require(_newRegistry != address(0), "Invalid registry address");
        claimTopicsRegistry = ClaimTopicsRegistry(_newRegistry);
    }
}
