// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IIdentityRegistry
 * @dev Interface for IdentityRegistry contract
 */
interface IIdentityRegistry {
    struct ClaimView {
        uint256 topicId;
        address issuer;
        bytes data;
        uint256 issuedAt;
        uint256 expiresAt;
        bool isActive;
    }

    event IdentityRegistered(address indexed identity, uint256 timestamp);
    event IdentityUpdated(address indexed identity, uint256 timestamp);
    event IdentityRemoved(address indexed identity, uint256 timestamp);
    event ClaimAdded(address indexed identity, uint256 indexed topicId, address indexed issuer, bytes data);
    event ClaimUpdated(address indexed identity, uint256 indexed topicId, address indexed issuer, bytes data);
    event ClaimRemoved(address indexed identity, uint256 indexed topicId);
    event VerificationStatusChanged(address indexed identity, bool isVerified);
    event RequiredClaimTopicsUpdated(uint256[] requiredTopics);

    function registerIdentity(address _identity) external;
    function addClaim(address _identity, uint256 _topicId, bytes calldata _data, uint256 _expiresAt) external;
    function removeClaim(address _identity, uint256 _topicId) external;
    function removeIdentity(address _identity) external;

    function isIdentityVerified(address _identity) external view returns (bool);
    function getClaim(address _identity, uint256 _topicId) external view returns (ClaimView memory);
    function getClaimTopics(address _identity) external view returns (uint256[] memory);
    function hasClaim(address _identity, uint256 _topicId) external view returns (bool);

    function updateRequiredClaimTopics(uint256[] calldata _requiredTopics) external;
    function getRequiredClaimTopics() external view returns (uint256[] memory);

    function getAllIdentities() external view returns (address[] memory);
    function getVerifiedIdentities() external view returns (address[] memory);
    function getIdentityInfo(
        address _identity
    ) external view returns (address wallet, bool exists, uint256 createdAt, uint256 updatedAt, bool verified);

    function getTotalIdentities() external view returns (uint256);
    function isAdmin(address _account) external view returns (bool);
    function updateRegistries(address _claimTopicsRegistry, address _trustedIssuersRegistry) external;
    function batchCheckVerification(address[] calldata _identities) external view returns (bool[] memory);
}
