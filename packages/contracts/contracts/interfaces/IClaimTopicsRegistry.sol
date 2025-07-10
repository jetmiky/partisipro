// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IClaimTopicsRegistry
 * @dev Interface for ClaimTopicsRegistry contract
 */
interface IClaimTopicsRegistry {
    struct ClaimTopic {
        uint256 topicId;
        string name;
        string description;
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
    }

    event ClaimTopicAdded(uint256 indexed topicId, string name, string description);
    event ClaimTopicUpdated(uint256 indexed topicId, string name, string description);
    event ClaimTopicDeactivated(uint256 indexed topicId);
    event ClaimTopicReactivated(uint256 indexed topicId);

    // Standard claim topic constants
    function KYC_APPROVED() external view returns (uint256);
    function ACCREDITED_INVESTOR() external view returns (uint256);
    function INDONESIAN_RESIDENT() external view returns (uint256);
    function PROFESSIONAL_INVESTOR() external view returns (uint256);
    function INSTITUTIONAL_INVESTOR() external view returns (uint256);

    function addClaimTopic(string calldata _name, string calldata _description) external returns (uint256);
    function updateClaimTopic(uint256 _topicId, string calldata _name, string calldata _description) external;
    function deactivateClaimTopic(uint256 _topicId) external;
    function reactivateClaimTopic(uint256 _topicId) external;

    function isClaimTopicValid(uint256 _topicId) external view returns (bool);
    function getClaimTopic(uint256 _topicId) external view returns (ClaimTopic memory);
    function getAllClaimTopicIds() external view returns (uint256[] memory);
    function getActiveClaimTopicIds() external view returns (uint256[] memory);
    function areClaimTopicsValid(uint256[] calldata _topicIds) external view returns (bool);
    function getTotalClaimTopics() external view returns (uint256);
    function isAdmin(address _account) external view returns (bool);
}
