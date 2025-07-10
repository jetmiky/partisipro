// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ClaimTopicsRegistry
 * @dev Registry contract for managing standardized claim topics for ERC-3643 compliance
 * @notice Defines the types of claims that can be issued on the platform (e.g., KYC_APPROVED, ACCREDITED_INVESTOR)
 */
contract ClaimTopicsRegistry is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // Standard claim topics for the platform
    uint256 public constant KYC_APPROVED = 1;
    uint256 public constant ACCREDITED_INVESTOR = 2;
    uint256 public constant INDONESIAN_RESIDENT = 3;
    uint256 public constant PROFESSIONAL_INVESTOR = 4;
    uint256 public constant INSTITUTIONAL_INVESTOR = 5;

    struct ClaimTopic {
        uint256 topicId;
        string name;
        string description;
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
    }

    mapping(uint256 => ClaimTopic) public claimTopics;
    uint256[] public topicIds;

    uint256 public nextTopicId;

    event ClaimTopicAdded(uint256 indexed topicId, string name, string description);
    event ClaimTopicUpdated(uint256 indexed topicId, string name, string description);
    event ClaimTopicDeactivated(uint256 indexed topicId);
    event ClaimTopicReactivated(uint256 indexed topicId);

    modifier onlyValidTopic(uint256 _topicId) {
        require(claimTopics[_topicId].topicId != 0, "Claim topic does not exist");
        _;
    }

    modifier onlyActiveTopic(uint256 _topicId) {
        require(claimTopics[_topicId].isActive, "Claim topic is not active");
        _;
    }

    constructor(address _admin) {
        require(_admin != address(0), "Invalid admin address");

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);

        nextTopicId = 6; // Start after predefined topics

        // Initialize standard claim topics
        _initializeStandardTopics();
    }

    /**
     * @dev Initialize standard claim topics for the platform
     */
    function _initializeStandardTopics() internal {
        _addClaimTopic(KYC_APPROVED, "KYC_APPROVED", "Know Your Customer verification completed and approved");

        _addClaimTopic(
            ACCREDITED_INVESTOR,
            "ACCREDITED_INVESTOR",
            "Qualified as an accredited investor under Indonesian regulations"
        );

        _addClaimTopic(INDONESIAN_RESIDENT, "INDONESIAN_RESIDENT", "Verified Indonesian resident status");

        _addClaimTopic(
            PROFESSIONAL_INVESTOR,
            "PROFESSIONAL_INVESTOR",
            "Professional investor qualification under OJK regulations"
        );

        _addClaimTopic(
            INSTITUTIONAL_INVESTOR,
            "INSTITUTIONAL_INVESTOR",
            "Institutional investor status (banks, insurance, pension funds)"
        );
    }

    /**
     * @dev Add a new claim topic
     * @param _name Name of the claim topic
     * @param _description Description of the claim topic
     * @return topicId The ID of the newly created claim topic
     */
    function addClaimTopic(
        string calldata _name,
        string calldata _description
    ) external onlyRole(ADMIN_ROLE) returns (uint256 topicId) {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");

        topicId = nextTopicId++;
        _addClaimTopic(topicId, _name, _description);
    }

    /**
     * @dev Internal function to add a claim topic
     * @param _topicId ID of the claim topic
     * @param _name Name of the claim topic
     * @param _description Description of the claim topic
     */
    function _addClaimTopic(uint256 _topicId, string memory _name, string memory _description) internal {
        claimTopics[_topicId] = ClaimTopic({
            topicId: _topicId,
            name: _name,
            description: _description,
            isActive: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        topicIds.push(_topicId);

        emit ClaimTopicAdded(_topicId, _name, _description);
    }

    /**
     * @dev Update an existing claim topic
     * @param _topicId ID of the claim topic to update
     * @param _name New name for the claim topic
     * @param _description New description for the claim topic
     */
    function updateClaimTopic(
        uint256 _topicId,
        string calldata _name,
        string calldata _description
    ) external onlyRole(ADMIN_ROLE) onlyValidTopic(_topicId) {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");

        ClaimTopic storage topic = claimTopics[_topicId];
        topic.name = _name;
        topic.description = _description;
        topic.updatedAt = block.timestamp;

        emit ClaimTopicUpdated(_topicId, _name, _description);
    }

    /**
     * @dev Deactivate a claim topic
     * @param _topicId ID of the claim topic to deactivate
     */
    function deactivateClaimTopic(
        uint256 _topicId
    ) external onlyRole(ADMIN_ROLE) onlyValidTopic(_topicId) onlyActiveTopic(_topicId) {
        claimTopics[_topicId].isActive = false;
        claimTopics[_topicId].updatedAt = block.timestamp;

        emit ClaimTopicDeactivated(_topicId);
    }

    /**
     * @dev Reactivate a claim topic
     * @param _topicId ID of the claim topic to reactivate
     */
    function reactivateClaimTopic(uint256 _topicId) external onlyRole(ADMIN_ROLE) onlyValidTopic(_topicId) {
        require(!claimTopics[_topicId].isActive, "Claim topic is already active");

        claimTopics[_topicId].isActive = true;
        claimTopics[_topicId].updatedAt = block.timestamp;

        emit ClaimTopicReactivated(_topicId);
    }

    /**
     * @dev Check if a claim topic is valid and active
     * @param _topicId ID of the claim topic to check
     * @return bool True if the claim topic is valid and active
     */
    function isClaimTopicValid(uint256 _topicId) external view returns (bool) {
        return claimTopics[_topicId].topicId != 0 && claimTopics[_topicId].isActive;
    }

    /**
     * @dev Get claim topic information
     * @param _topicId ID of the claim topic
     * @return ClaimTopic The claim topic information
     */
    function getClaimTopic(uint256 _topicId) external view returns (ClaimTopic memory) {
        require(claimTopics[_topicId].topicId != 0, "Claim topic does not exist");
        return claimTopics[_topicId];
    }

    /**
     * @dev Get all claim topic IDs
     * @return uint256[] Array of all claim topic IDs
     */
    function getAllClaimTopicIds() external view returns (uint256[] memory) {
        return topicIds;
    }

    /**
     * @dev Get active claim topic IDs
     * @return activeTopics Array of active claim topic IDs
     */
    function getActiveClaimTopicIds() external view returns (uint256[] memory activeTopics) {
        uint256 activeCount = 0;

        // Count active topics
        for (uint256 i = 0; i < topicIds.length; i++) {
            if (claimTopics[topicIds[i]].isActive) {
                activeCount++;
            }
        }

        // Create array of active topics
        activeTopics = new uint256[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < topicIds.length; i++) {
            if (claimTopics[topicIds[i]].isActive) {
                activeTopics[index] = topicIds[i];
                index++;
            }
        }
    }

    /**
     * @dev Check if multiple claim topics are valid
     * @param _topicIds Array of claim topic IDs to check
     * @return bool True if all claim topics are valid and active
     */
    function areClaimTopicsValid(uint256[] calldata _topicIds) external view returns (bool) {
        for (uint256 i = 0; i < _topicIds.length; i++) {
            if (!claimTopics[_topicIds[i]].isActive || claimTopics[_topicIds[i]].topicId == 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * @dev Get the total number of claim topics
     * @return uint256 Total number of claim topics
     */
    function getTotalClaimTopics() external view returns (uint256) {
        return topicIds.length;
    }

    /**
     * @dev Check if caller has admin role
     * @return bool True if caller has admin role
     */
    function isAdmin(address _account) external view returns (bool) {
        return hasRole(ADMIN_ROLE, _account);
    }
}
