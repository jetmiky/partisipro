// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IProjectTreasury
 * @dev Interface for ProjectTreasury contract
 */
interface IProjectTreasury {
    struct ProfitDistribution {
        uint256 totalProfit;
        uint256 platformFee;
        uint256 distributedAmount;
        uint256 timestamp;
        uint256 pricePerToken;
        bool isFinalized;
    }

    struct TokenholderClaim {
        uint256 totalClaimable;
        uint256 totalClaimed;
        uint256 lastClaimDistribution;
    }

    struct TreasuryInfo {
        uint256 totalFundsReceived;
        uint256 totalProfitsDistributed;
        uint256 totalPlatformFeesPaid;
        uint256 totalFinalBuyback;
        uint256 distributionCount;
        bool isFinalBuybackActive;
        uint256 finalBuybackPrice;
    }

    event FundsReceived(address indexed sender, uint256 amount);
    event ProfitDistributionCreated(uint256 indexed distributionId, uint256 totalProfit, uint256 platformFee);
    event ProfitDistributionFinalized(uint256 indexed distributionId, uint256 distributedAmount);
    event ProfitClaimed(address indexed tokenholder, uint256 amount, uint256 distributionId);
    event FinalBuybackActivated(uint256 buybackPrice);
    event FinalBuybackClaim(address indexed tokenholder, uint256 tokenAmount, uint256 ethAmount);
    event EmergencyWithdrawal(address indexed recipient, uint256 amount);
    event PlatformFeeTransferred(uint256 amount);

    function initialize(
        address _projectToken,
        address _platformRegistry,
        address _platformTreasury,
        address _owner
    ) external;

    function projectToken() external view returns (address);
    function platformRegistry() external view returns (address);
    function platformTreasury() external view returns (address);
    function currentDistributionId() external view returns (uint256);

    function createProfitDistribution(uint256 _totalProfit) external;
    function finalizeProfitDistribution(uint256 _distributionId) external;
    function claimProfit(uint256 _distributionId) external;
    function claimMultipleDistributions(uint256[] calldata _distributionIds) external;
    function activateFinalBuyback(uint256 _buybackPrice) external;
    function claimFinalBuyback() external;
    function emergencyWithdraw(uint256 _amount) external;

    function pause() external;
    function unpause() external;

    function getClaimableProfit(address _tokenholder) external view returns (uint256);
    function getDistribution(uint256 _distributionId) external view returns (ProfitDistribution memory);
    function getTokenholderClaim(address _tokenholder) external view returns (TokenholderClaim memory);
    function getTreasuryInfo() external view returns (TreasuryInfo memory);
    function getBalance() external view returns (uint256);
}
