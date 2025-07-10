// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITrustedIssuersRegistry
 * @dev Interface for TrustedIssuersRegistry contract
 */
interface ITrustedIssuersRegistry {
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

    event TrustedIssuerAdded(address indexed issuer, string name, uint256[] authorizedTopics);
    event TrustedIssuerUpdated(address indexed issuer, string name, uint256[] authorizedTopics);
    event TrustedIssuerDeactivated(address indexed issuer);
    event TrustedIssuerReactivated(address indexed issuer);
    event IssuerTopicsUpdated(address indexed issuer, uint256[] authorizedTopics);
    event ClaimIssued(address indexed issuer, address indexed subject, uint256 topicId);

    function addTrustedIssuer(
        address _issuer,
        string calldata _name,
        string calldata _description,
        uint256[] calldata _authorizedTopics
    ) external;

    function updateTrustedIssuer(address _issuer, string calldata _name, string calldata _description) external;

    function updateIssuerTopics(address _issuer, uint256[] calldata _authorizedTopics) external;
    function deactivateTrustedIssuer(address _issuer) external;
    function reactivateTrustedIssuer(address _issuer) external;

    function recordClaimIssuance(address _issuer, address _subject, uint256 _topicId) external;

    function isTrustedIssuer(address _issuer, uint256 _topicId) external view returns (bool);
    function isTrustedIssuer(address _issuer) external view returns (bool);

    function getTrustedIssuer(address _issuer) external view returns (TrustedIssuer memory);
    function getIssuerAuthorizedTopics(address _issuer) external view returns (uint256[] memory);
    function getAllTrustedIssuers() external view returns (address[] memory);
    function getActiveTrustedIssuers() external view returns (address[] memory);
    function getTrustedIssuersForTopic(uint256 _topicId) external view returns (address[] memory);

    function getTotalTrustedIssuers() external view returns (uint256);
    function isAdmin(address _account) external view returns (bool);
    function updateClaimTopicsRegistry(address _newRegistry) external;
}
