// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IProjectOffering
 * @dev Interface for ProjectOffering contract
 */
interface IProjectOffering {
    struct OfferingInfo {
        uint256 tokenPrice;
        uint256 totalSupply;
        uint256 availableSupply;
        uint256 minInvestment;
        uint256 maxInvestment;
        uint256 startTime;
        uint256 endTime;
        uint256 softCap;
        uint256 hardCap;
        bool isActive;
        bool isFinalized;
    }

    struct InvestorInfo {
        uint256 totalInvested;
        uint256 tokensAllocated;
        uint256 tokensClaimed;
        bool hasInvested;
    }

    event InvestmentMade(address indexed investor, uint256 amount, uint256 tokens);
    event TokensClaimed(address indexed investor, uint256 amount);
    event OfferingFinalized(uint256 totalRaised, uint256 totalInvestors);
    event OfferingCanceled(string reason);
    event OfferingInfoUpdated();
    event RefundProcessed(address indexed investor, uint256 amount);
    event EmergencyWithdrawal(uint256 amount);

    function initialize(
        address _projectToken,
        address _platformRegistry,
        address _identityRegistry,
        address _projectTreasury,
        address _owner,
        uint256 _tokenPrice,
        uint256 _totalSupply,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _softCap,
        uint256 _hardCap
    ) external;

    function projectToken() external view returns (address);
    function platformRegistry() external view returns (address);
    function identityRegistry() external view returns (address);
    function projectTreasury() external view returns (address);
    function totalFundsRaised() external view returns (uint256);
    function totalInvestors() external view returns (uint256);

    function invest() external payable;
    function claimTokens() external;
    function finalizeOffering() external;
    function cancelOffering(string calldata _reason) external;
    function processRefund(address _investor) external;

    function updateOfferingInfo(
        uint256 _tokenPrice,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _softCap,
        uint256 _hardCap
    ) external;

    function pauseOffering() external;
    function unpauseOffering() external;
    function emergencyWithdraw() external;

    function getInvestorInfo(address _investor) external view returns (InvestorInfo memory);
    function getOfferingProgress() external view returns (uint256, uint256, uint256);
    function getAllInvestors() external view returns (address[] memory);
    function isOfferingActive() external view returns (bool);
    function getOfferingInfo() external view returns (OfferingInfo memory);

    // ERC-3643 Integration Functions
    function updateIdentityRegistry(address _newIdentityRegistry) external;
    function isInvestorAuthorized(address _investor) external view returns (bool);
    function batchCheckInvestorAuthorization(address[] calldata _investors) external view returns (bool[] memory);
}
