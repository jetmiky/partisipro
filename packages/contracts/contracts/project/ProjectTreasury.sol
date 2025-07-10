// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ProjectToken.sol";
import "../core/PlatformRegistry.sol";
import "../core/PlatformTreasury.sol";

/**
 * @title ProjectTreasury
 * @dev Project-specific treasury contract for profit distribution
 * @notice Manages project funds, profit distribution, and final buyback
 */
contract ProjectTreasury is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
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

    ProjectToken public projectToken;
    PlatformRegistry public platformRegistry;
    PlatformTreasury public platformTreasury;

    TreasuryInfo public treasuryInfo;
    mapping(uint256 => ProfitDistribution) public distributions;
    mapping(address => TokenholderClaim) public tokenholderClaims;

    uint256 public currentDistributionId;
    uint256 public constant DISTRIBUTION_DELAY = 1 days;

    event FundsReceived(address indexed sender, uint256 amount);
    event ProfitDistributionCreated(uint256 indexed distributionId, uint256 totalProfit, uint256 platformFee);
    event ProfitDistributionFinalized(uint256 indexed distributionId, uint256 distributedAmount);
    event ProfitClaimed(address indexed tokenholder, uint256 amount, uint256 distributionId);
    event FinalBuybackActivated(uint256 buybackPrice);
    event FinalBuybackClaim(address indexed tokenholder, uint256 tokenAmount, uint256 ethAmount);
    event EmergencyWithdrawal(address indexed recipient, uint256 amount);
    event PlatformFeeTransferred(uint256 amount);

    modifier onlyAfterDistributionDelay(uint256 _distributionId) {
        require(
            block.timestamp >= distributions[_distributionId].timestamp + DISTRIBUTION_DELAY,
            "Distribution delay not met"
        );
        _;
    }

    modifier onlyDuringFinalBuyback() {
        require(treasuryInfo.isFinalBuybackActive, "Final buyback not active");
        _;
    }

    modifier onlyTokenHolder() {
        require(projectToken.balanceOf(msg.sender) > 0, "Not a token holder");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _projectToken,
        address _platformRegistry,
        address payable _platformTreasury,
        address _owner
    ) public initializer {
        require(_projectToken != address(0), "Invalid token address");
        require(_platformRegistry != address(0), "Invalid registry address");
        require(_platformTreasury != address(0), "Invalid platform treasury address");
        require(_owner != address(0), "Invalid owner address");

        __Ownable_init(_owner);
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        projectToken = ProjectToken(_projectToken);
        platformRegistry = PlatformRegistry(_platformRegistry);
        platformTreasury = PlatformTreasury(_platformTreasury);

        currentDistributionId = 1;
    }

    /**
     * @dev Receive funds from offering or external sources
     */
    receive() external payable {
        treasuryInfo.totalFundsReceived += msg.value;
        emit FundsReceived(msg.sender, msg.value);
    }

    /**
     * @dev Create a new profit distribution
     * @param _totalProfit Total profit amount to distribute
     */
    function createProfitDistribution(uint256 _totalProfit) external onlyOwner nonReentrant whenNotPaused {
        require(_totalProfit > 0, "Invalid profit amount");
        require(_totalProfit <= address(this).balance, "Insufficient balance");
        require(!treasuryInfo.isFinalBuybackActive, "Final buyback active");

        // Calculate platform management fee
        PlatformRegistry.PlatformConfig memory config = platformRegistry.getPlatformConfig();
        uint256 platformFee = (_totalProfit * config.managementFeeRate) / 10000;
        uint256 distributedAmount = _totalProfit - platformFee;

        // Calculate profit per token
        uint256 totalSupply = projectToken.totalSupply();
        require(totalSupply > 0, "No tokens in circulation");
        uint256 pricePerToken = distributedAmount / totalSupply;

        // Create distribution record
        distributions[currentDistributionId] = ProfitDistribution({
            totalProfit: _totalProfit,
            platformFee: platformFee,
            distributedAmount: distributedAmount,
            timestamp: block.timestamp,
            pricePerToken: pricePerToken,
            isFinalized: false
        });

        emit ProfitDistributionCreated(currentDistributionId, _totalProfit, platformFee);
        currentDistributionId++;
    }

    /**
     * @dev Finalize profit distribution and transfer platform fee
     * @param _distributionId Distribution ID to finalize
     */
    function finalizeProfitDistribution(
        uint256 _distributionId
    ) external onlyOwner nonReentrant onlyAfterDistributionDelay(_distributionId) whenNotPaused {
        require(_distributionId > 0 && _distributionId < currentDistributionId, "Invalid distribution ID");
        require(!distributions[_distributionId].isFinalized, "Already finalized");

        ProfitDistribution storage distribution = distributions[_distributionId];
        distribution.isFinalized = true;

        // Transfer platform fee to platform treasury
        if (distribution.platformFee > 0) {
            platformTreasury.collectManagementFee{ value: distribution.platformFee }(address(projectToken));
            treasuryInfo.totalPlatformFeesPaid += distribution.platformFee;
        }

        // Update treasury info
        treasuryInfo.totalProfitsDistributed += distribution.distributedAmount;
        treasuryInfo.distributionCount++;

        emit ProfitDistributionFinalized(_distributionId, distribution.distributedAmount);
        emit PlatformFeeTransferred(distribution.platformFee);
    }

    /**
     * @dev Claim profit from a specific distribution
     * @param _distributionId Distribution ID to claim from
     */
    function claimProfit(uint256 _distributionId) external nonReentrant onlyTokenHolder whenNotPaused {
        require(_distributionId > 0 && _distributionId < currentDistributionId, "Invalid distribution ID");
        require(distributions[_distributionId].isFinalized, "Distribution not finalized");
        require(
            tokenholderClaims[msg.sender].lastClaimDistribution < _distributionId,
            "Already claimed from this distribution"
        );

        uint256 tokenBalance = projectToken.balanceOf(msg.sender);
        require(tokenBalance > 0, "No tokens to claim for");

        uint256 claimAmount = tokenBalance * distributions[_distributionId].pricePerToken;
        require(claimAmount > 0, "No profit to claim");

        // Update claim records
        tokenholderClaims[msg.sender].totalClaimable += claimAmount;
        tokenholderClaims[msg.sender].totalClaimed += claimAmount;
        tokenholderClaims[msg.sender].lastClaimDistribution = _distributionId;

        // Transfer profit to tokenholder
        (bool success, ) = msg.sender.call{ value: claimAmount }("");
        require(success, "Profit transfer failed");

        emit ProfitClaimed(msg.sender, claimAmount, _distributionId);
    }

    /**
     * @dev Claim profits from multiple distributions
     * @param _distributionIds Array of distribution IDs to claim from
     */
    function claimMultipleDistributions(
        uint256[] calldata _distributionIds
    ) external nonReentrant onlyTokenHolder whenNotPaused {
        require(_distributionIds.length > 0, "No distributions specified");
        require(_distributionIds.length <= 10, "Too many distributions");

        uint256 totalClaimAmount = 0;
        uint256 tokenBalance = projectToken.balanceOf(msg.sender);
        require(tokenBalance > 0, "No tokens to claim for");

        for (uint256 i = 0; i < _distributionIds.length; i++) {
            uint256 distributionId = _distributionIds[i];

            require(distributionId > 0 && distributionId < currentDistributionId, "Invalid distribution ID");
            require(distributions[distributionId].isFinalized, "Distribution not finalized");
            require(
                tokenholderClaims[msg.sender].lastClaimDistribution < distributionId,
                "Already claimed from this distribution"
            );

            uint256 claimAmount = tokenBalance * distributions[distributionId].pricePerToken;
            totalClaimAmount += claimAmount;

            emit ProfitClaimed(msg.sender, claimAmount, distributionId);
        }

        require(totalClaimAmount > 0, "No profit to claim");

        // Update claim records
        tokenholderClaims[msg.sender].totalClaimable += totalClaimAmount;
        tokenholderClaims[msg.sender].totalClaimed += totalClaimAmount;
        tokenholderClaims[msg.sender].lastClaimDistribution = _distributionIds[_distributionIds.length - 1];

        // Transfer total profit to tokenholder
        (bool success, ) = msg.sender.call{ value: totalClaimAmount }("");
        require(success, "Profit transfer failed");
    }

    /**
     * @dev Activate final buyback mechanism
     * @param _buybackPrice Price per token for final buyback
     */
    function activateFinalBuyback(uint256 _buybackPrice) external onlyOwner nonReentrant whenNotPaused {
        require(_buybackPrice > 0, "Invalid buyback price");
        require(!treasuryInfo.isFinalBuybackActive, "Final buyback already active");

        uint256 totalSupply = projectToken.totalSupply();
        uint256 totalBuybackAmount = totalSupply * _buybackPrice;
        require(totalBuybackAmount <= address(this).balance, "Insufficient funds for buyback");

        treasuryInfo.isFinalBuybackActive = true;
        treasuryInfo.finalBuybackPrice = _buybackPrice;

        // Disable token transfers
        projectToken.disableTransfers();

        emit FinalBuybackActivated(_buybackPrice);
    }

    /**
     * @dev Claim final buyback by burning tokens
     */
    function claimFinalBuyback() external nonReentrant onlyDuringFinalBuyback onlyTokenHolder whenNotPaused {
        uint256 tokenBalance = projectToken.balanceOf(msg.sender);
        require(tokenBalance > 0, "No tokens to burn");

        uint256 buybackAmount = tokenBalance * treasuryInfo.finalBuybackPrice;
        require(buybackAmount <= address(this).balance, "Insufficient buyback funds");

        // Burn tokens
        projectToken.burn(tokenBalance);

        // Update treasury info
        treasuryInfo.totalFinalBuyback += buybackAmount;

        // Transfer buyback amount to tokenholder
        (bool success, ) = msg.sender.call{ value: buybackAmount }("");
        require(success, "Buyback transfer failed");

        emit FinalBuybackClaim(msg.sender, tokenBalance, buybackAmount);
    }

    /**
     * @dev Emergency withdrawal (only owner)
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 _amount) external onlyOwner nonReentrant {
        require(_amount > 0, "Invalid amount");
        require(_amount <= address(this).balance, "Insufficient balance");

        (bool success, ) = owner().call{ value: _amount }("");
        require(success, "Emergency withdrawal failed");

        emit EmergencyWithdrawal(owner(), _amount);
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Get claimable profit for a tokenholder
     * @param _tokenholder Address of the tokenholder
     * @return claimableAmount Amount of profit claimable
     */
    function getClaimableProfit(address _tokenholder) external view returns (uint256 claimableAmount) {
        uint256 tokenBalance = projectToken.balanceOf(_tokenholder);
        if (tokenBalance == 0) return 0;

        uint256 lastClaimedDistribution = tokenholderClaims[_tokenholder].lastClaimDistribution;

        for (uint256 i = lastClaimedDistribution + 1; i < currentDistributionId; i++) {
            if (distributions[i].isFinalized) {
                claimableAmount += tokenBalance * distributions[i].pricePerToken;
            }
        }
    }

    /**
     * @dev Get distribution information
     * @param _distributionId Distribution ID
     * @return ProfitDistribution Distribution details
     */
    function getDistribution(uint256 _distributionId) external view returns (ProfitDistribution memory) {
        return distributions[_distributionId];
    }

    /**
     * @dev Get tokenholder claim information
     * @param _tokenholder Address of the tokenholder
     * @return TokenholderClaim Claim details
     */
    function getTokenholderClaim(address _tokenholder) external view returns (TokenholderClaim memory) {
        return tokenholderClaims[_tokenholder];
    }

    /**
     * @dev Get treasury information
     * @return TreasuryInfo Treasury details
     */
    function getTreasuryInfo() external view returns (TreasuryInfo memory) {
        return treasuryInfo;
    }

    /**
     * @dev Get contract balance
     * @return uint256 Current contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Required by UUPS pattern
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
