// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IProjectToken {
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

interface IPlatformTreasury {
    function collectManagementFee(address project) external payable;
}

/**
 * @title ProjectTreasuryAdvanced
 * @dev Advanced project treasury with dynamic fee structures and enhanced profit distribution
 * @notice Enhanced treasury system with performance-based fees and advanced distribution algorithms
 */
contract ProjectTreasuryAdvanced is
    Initializable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable,
    PausableUpgradeable
{
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant SPV_ROLE = keccak256("SPV_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct ProfitDistribution {
        uint256 id;
        uint256 totalAmount;
        uint256 platformFee;
        uint256 netDistribution;
        uint256 timestamp;
        uint256 totalTokenSupply;
        uint256 perTokenAmount;
        mapping(address => uint256) claimedAmounts;
        mapping(address => bool) hasClaimed;
        bool isActive;
        uint256 claimedCount;
        uint256 totalClaimed;
    }

    struct DynamicFeeConfig {
        uint256 baseManagementFee;
        uint256 performanceFeeRate;
        uint256 highPerformanceThreshold;
        uint256 lowPerformanceThreshold;
        uint256 maxFeeRate;
        uint256 minFeeRate;
        bool isActive;
    }

    struct PerformanceMetrics {
        uint256 totalProfitsDistributed;
        uint256 totalDistributions;
        uint256 averageDistributionAmount;
        uint256 lastDistributionTime;
        uint256 distributionFrequency;
        uint256 annualizedReturn;
        uint256 performanceScore;
    }

    struct StakingRewards {
        uint256 totalStaked;
        uint256 rewardRate;
        uint256 lastUpdateTime;
        uint256 rewardPerTokenStored;
        mapping(address => uint256) userRewardPerTokenPaid;
        mapping(address => uint256) rewards;
        mapping(address => uint256) stakedTokens;
        bool isActive;
    }

    struct ClaimSchedule {
        uint256 totalAmount;
        uint256 claimedAmount;
        uint256[] vestingSchedule;
        uint256[] releaseAmounts;
        uint256 startTime;
        uint256 cliffPeriod;
        bool isActive;
    }

    struct EmergencyConfig {
        uint256 emergencyWithdrawalLimit;
        uint256 emergencyFundRatio;
        uint256 lastEmergencyWithdrawal;
        bool emergencyMode;
        address emergencyRecipient;
    }

    IProjectToken public projectToken;
    IPlatformTreasury public platformTreasury;

    uint256 public distributionCount;
    mapping(uint256 => ProfitDistribution) public distributions;
    mapping(address => uint256[]) public userDistributions;
    mapping(address => ClaimSchedule) public claimSchedules;

    DynamicFeeConfig public feeConfig;
    PerformanceMetrics public performanceMetrics;
    StakingRewards public stakingRewards;
    EmergencyConfig public emergencyConfig;

    // Enhanced tracking
    mapping(address => uint256) public totalClaimed;
    mapping(address => uint256) public lastClaimTime;
    mapping(address => uint256) public claimStreak;

    // Profit analytics
    uint256 public totalProfitsReceived;
    uint256 public totalFeesCollected;
    uint256 public totalNetDistributed;
    uint256 public lastProfitAmount;
    uint256 public profitTrend;

    // Automated distribution
    uint256 public autoDistributionThreshold;
    uint256 public autoDistributionDelay;
    bool public autoDistributionEnabled;

    // Advanced features
    mapping(address => bool) public isWhitelistedRecipient;
    mapping(address => uint256) public recipientWeights;
    uint256 public totalRecipientWeight;

    event ProfitReceived(uint256 amount, uint256 timestamp);
    event ProfitDistributed(
        uint256 indexed distributionId,
        uint256 totalAmount,
        uint256 platformFee,
        uint256 netAmount
    );
    event ProfitClaimed(uint256 indexed distributionId, address indexed claimer, uint256 amount);
    event FeeConfigUpdated(uint256 baseRate, uint256 performanceRate, uint256 maxRate, uint256 minRate);
    event PerformanceMetricsUpdated(uint256 totalProfits, uint256 averageAmount, uint256 annualizedReturn);
    event EmergencyWithdrawal(address indexed recipient, uint256 amount, string reason);
    event StakingRewardsUpdated(uint256 totalStaked, uint256 rewardRate);
    event ClaimScheduleSet(address indexed recipient, uint256 totalAmount, uint256 cliffPeriod);
    event AutoDistributionTriggered(uint256 distributionId, uint256 amount);

    modifier onlyProjectToken() {
        require(msg.sender == address(projectToken), "Only project token can call");
        _;
    }

    modifier validDistribution(uint256 _distributionId) {
        require(_distributionId > 0 && _distributionId <= distributionCount, "Invalid distribution ID");
        require(distributions[_distributionId].isActive, "Distribution not active");
        _;
    }

    modifier hasStake() {
        require(stakingRewards.stakedTokens[msg.sender] > 0, "No tokens staked");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _admin,
        address _projectToken,
        address _platformTreasury,
        address _spv,
        uint256 _baseManagementFee,
        uint256 _performanceFeeRate,
        uint256 _emergencyWithdrawalLimit
    ) public initializer {
        require(_admin != address(0), "Invalid admin address");
        require(_projectToken != address(0), "Invalid project token address");
        require(_platformTreasury != address(0), "Invalid platform treasury address");
        require(_spv != address(0), "Invalid SPV address");
        require(_baseManagementFee <= 1000, "Base fee too high"); // Max 10%
        require(_performanceFeeRate <= 2000, "Performance fee too high"); // Max 20%
        require(_emergencyWithdrawalLimit > 0, "Invalid emergency limit");

        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(UPGRADER_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);
        _grantRole(SPV_ROLE, _spv);

        projectToken = IProjectToken(_projectToken);
        platformTreasury = IPlatformTreasury(_platformTreasury);

        // Initialize dynamic fee configuration
        feeConfig = DynamicFeeConfig({
            baseManagementFee: _baseManagementFee,
            performanceFeeRate: _performanceFeeRate,
            highPerformanceThreshold: 15000, // 150% of average
            lowPerformanceThreshold: 5000, // 50% of average
            maxFeeRate: 2000, // 20%
            minFeeRate: 100, // 1%
            isActive: true
        });

        // Initialize emergency configuration
        emergencyConfig = EmergencyConfig({
            emergencyWithdrawalLimit: _emergencyWithdrawalLimit,
            emergencyFundRatio: 500, // 5% of balance
            lastEmergencyWithdrawal: 0,
            emergencyMode: false,
            emergencyRecipient: _admin
        });

        // Initialize staking rewards
        stakingRewards.isActive = true;
        stakingRewards.rewardRate = 1000; // 10% APR
        stakingRewards.lastUpdateTime = block.timestamp;

        // Initialize auto-distribution
        autoDistributionThreshold = 1 ether;
        autoDistributionDelay = 7 days;
        autoDistributionEnabled = false;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    /**
     * @dev Receive profits from project operations
     */
    function receiveProfits() external payable onlyRole(SPV_ROLE) whenNotPaused {
        require(msg.value > 0, "No profits received");

        totalProfitsReceived += msg.value;
        lastProfitAmount = msg.value;

        // Update performance metrics
        _updatePerformanceMetrics(msg.value);

        // Check for auto-distribution
        if (autoDistributionEnabled && msg.value >= autoDistributionThreshold) {
            _distributeProfits(msg.value);
        }

        emit ProfitReceived(msg.value, block.timestamp);
    }

    /**
     * @dev Distribute profits to token holders
     * @param _amount Amount to distribute
     */
    function distributeProfits(uint256 _amount) external onlyRole(SPV_ROLE) whenNotPaused {
        require(_amount > 0, "Invalid amount");
        require(address(this).balance >= _amount, "Insufficient balance");

        _distributeProfits(_amount);
    }

    /**
     * @dev Internal function to distribute profits
     * @param _amount Amount to distribute
     */
    function _distributeProfits(uint256 _amount) internal {
        require(_amount > 0, "Invalid amount");
        require(address(this).balance >= _amount, "Insufficient balance");

        uint256 totalTokens = projectToken.totalSupply();
        require(totalTokens > 0, "No tokens in circulation");

        // Calculate dynamic platform fee
        uint256 platformFee = _calculateDynamicFee(_amount);
        uint256 netDistribution = _amount - platformFee;

        distributionCount++;

        ProfitDistribution storage distribution = distributions[distributionCount];
        distribution.id = distributionCount;
        distribution.totalAmount = _amount;
        distribution.platformFee = platformFee;
        distribution.netDistribution = netDistribution;
        distribution.timestamp = block.timestamp;
        distribution.totalTokenSupply = totalTokens;
        distribution.perTokenAmount = netDistribution / totalTokens;
        distribution.isActive = true;
        distribution.claimedCount = 0;
        distribution.totalClaimed = 0;

        // Update global metrics
        totalFeesCollected += platformFee;
        totalNetDistributed += netDistribution;

        // Send platform fee
        if (platformFee > 0) {
            platformTreasury.collectManagementFee{ value: platformFee }(address(this));
        }

        // Update staking rewards
        _updateStakingRewards(netDistribution);

        emit ProfitDistributed(distributionCount, _amount, platformFee, netDistribution);

        // Auto-distribution triggered
        if (autoDistributionEnabled) {
            emit AutoDistributionTriggered(distributionCount, _amount);
        }
    }

    /**
     * @dev Calculate dynamic fee based on performance
     * @param _amount Amount to calculate fee for
     * @return fee Calculated fee amount
     */
    function _calculateDynamicFee(uint256 _amount) internal view returns (uint256 fee) {
        if (!feeConfig.isActive) {
            return (_amount * feeConfig.baseManagementFee) / 10000;
        }

        uint256 feeRate = feeConfig.baseManagementFee;

        // Adjust fee based on performance
        if (performanceMetrics.totalDistributions > 0) {
            uint256 currentPerformance = (_amount * 10000) / performanceMetrics.averageDistributionAmount;

            if (currentPerformance > feeConfig.highPerformanceThreshold) {
                // High performance - increase fee
                feeRate += feeConfig.performanceFeeRate;
            } else if (currentPerformance < feeConfig.lowPerformanceThreshold) {
                // Low performance - decrease fee
                feeRate = feeRate > feeConfig.performanceFeeRate
                    ? feeRate - feeConfig.performanceFeeRate
                    : feeConfig.minFeeRate;
            }
        }

        // Apply limits
        if (feeRate > feeConfig.maxFeeRate) {
            feeRate = feeConfig.maxFeeRate;
        }
        if (feeRate < feeConfig.minFeeRate) {
            feeRate = feeConfig.minFeeRate;
        }

        return (_amount * feeRate) / 10000;
    }

    /**
     * @dev Update performance metrics
     * @param _amount Current profit amount
     */
    function _updatePerformanceMetrics(uint256 _amount) internal {
        performanceMetrics.totalProfitsDistributed += _amount;
        performanceMetrics.totalDistributions++;
        performanceMetrics.averageDistributionAmount =
            performanceMetrics.totalProfitsDistributed /
            performanceMetrics.totalDistributions;

        // Calculate distribution frequency
        if (performanceMetrics.lastDistributionTime > 0) {
            uint256 timeSinceLastDistribution = block.timestamp - performanceMetrics.lastDistributionTime;
            performanceMetrics.distributionFrequency =
                (performanceMetrics.distributionFrequency + timeSinceLastDistribution) /
                2;
        }

        performanceMetrics.lastDistributionTime = block.timestamp;

        // Calculate annualized return (simplified)
        if (performanceMetrics.distributionFrequency > 0) {
            uint256 annualDistributions = 365 days / performanceMetrics.distributionFrequency;
            performanceMetrics.annualizedReturn =
                (performanceMetrics.averageDistributionAmount * annualDistributions * 10000) /
                projectToken.totalSupply();
        }

        // Calculate performance score (0-100)
        uint256 consistencyScore = performanceMetrics.totalDistributions > 10
            ? 50
            : (performanceMetrics.totalDistributions * 5);
        uint256 returnScore = performanceMetrics.annualizedReturn > 1000
            ? 50
            : (performanceMetrics.annualizedReturn / 20);
        performanceMetrics.performanceScore = consistencyScore + returnScore;

        emit PerformanceMetricsUpdated(
            performanceMetrics.totalProfitsDistributed,
            performanceMetrics.averageDistributionAmount,
            performanceMetrics.annualizedReturn
        );
    }

    /**
     * @dev Update staking rewards
     * @param _distributionAmount Amount distributed
     */
    function _updateStakingRewards(uint256 _distributionAmount) internal {
        if (!stakingRewards.isActive || stakingRewards.totalStaked == 0) return;

        uint256 rewardAmount = (_distributionAmount * stakingRewards.rewardRate) / 10000;
        stakingRewards.rewardPerTokenStored += (rewardAmount * 1e18) / stakingRewards.totalStaked;
        stakingRewards.lastUpdateTime = block.timestamp;

        emit StakingRewardsUpdated(stakingRewards.totalStaked, stakingRewards.rewardRate);
    }

    /**
     * @dev Claim profits from a specific distribution
     * @param _distributionId Distribution ID to claim from
     */
    function claimProfits(
        uint256 _distributionId
    ) external validDistribution(_distributionId) whenNotPaused nonReentrant {
        ProfitDistribution storage distribution = distributions[_distributionId];

        require(!distribution.hasClaimed[msg.sender], "Already claimed");
        require(projectToken.balanceOf(msg.sender) > 0, "No tokens held");

        uint256 userTokens = projectToken.balanceOf(msg.sender);
        uint256 claimAmount = (userTokens * distribution.perTokenAmount);

        require(claimAmount > 0, "No profits to claim");
        require(address(this).balance >= claimAmount, "Insufficient balance");

        // Apply vesting schedule if applicable
        if (claimSchedules[msg.sender].isActive) {
            claimAmount = _applyVestingSchedule(msg.sender, claimAmount);
        }

        // Record claim
        distribution.hasClaimed[msg.sender] = true;
        distribution.claimedAmounts[msg.sender] = claimAmount;
        distribution.claimedCount++;
        distribution.totalClaimed += claimAmount;

        // Update user stats
        totalClaimed[msg.sender] += claimAmount;
        userDistributions[msg.sender].push(_distributionId);

        // Update claim streak
        if (lastClaimTime[msg.sender] > 0 && block.timestamp - lastClaimTime[msg.sender] <= 30 days) {
            claimStreak[msg.sender]++;
        } else {
            claimStreak[msg.sender] = 1;
        }
        lastClaimTime[msg.sender] = block.timestamp;

        // Update staking rewards
        _updateRewards(msg.sender);

        // Transfer profits
        (bool success, ) = payable(msg.sender).call{ value: claimAmount }("");
        require(success, "Transfer failed");

        emit ProfitClaimed(_distributionId, msg.sender, claimAmount);
    }

    /**
     * @dev Apply vesting schedule to claim amount
     * @param _recipient Recipient address
     * @param _amount Original claim amount
     * @return vestedAmount Vested amount available for claim
     */
    function _applyVestingSchedule(address _recipient, uint256 _amount) internal view returns (uint256 vestedAmount) {
        ClaimSchedule storage schedule = claimSchedules[_recipient];

        if (block.timestamp < schedule.startTime + schedule.cliffPeriod) {
            return 0; // Still in cliff period
        }

        uint256 elapsedTime = block.timestamp - schedule.startTime;
        uint256 totalVestingPeriod = schedule.vestingSchedule[schedule.vestingSchedule.length - 1];

        if (elapsedTime >= totalVestingPeriod) {
            return _amount; // Fully vested
        }

        // Calculate vested percentage based on schedule
        uint256 vestedPercentage = 0;
        for (uint256 i = 0; i < schedule.vestingSchedule.length; i++) {
            if (elapsedTime >= schedule.vestingSchedule[i]) {
                vestedPercentage = schedule.releaseAmounts[i];
            } else {
                break;
            }
        }

        return (_amount * vestedPercentage) / 10000;
    }

    /**
     * @dev Update rewards for a user
     * @param _user User address
     */
    function _updateRewards(address _user) internal {
        if (!stakingRewards.isActive) return;

        uint256 userStake = stakingRewards.stakedTokens[_user];
        if (userStake == 0) return;

        uint256 reward = (userStake *
            (stakingRewards.rewardPerTokenStored - stakingRewards.userRewardPerTokenPaid[_user])) / 1e18;

        stakingRewards.rewards[_user] += reward;
        stakingRewards.userRewardPerTokenPaid[_user] = stakingRewards.rewardPerTokenStored;
    }

    /**
     * @dev Stake tokens for additional rewards
     * @param _amount Amount of tokens to stake
     */
    function stakeTokens(uint256 _amount) external hasStake whenNotPaused {
        require(_amount > 0, "Invalid amount");
        require(projectToken.balanceOf(msg.sender) >= _amount, "Insufficient tokens");

        _updateRewards(msg.sender);

        // This would require the project token to support staking
        // For now, we'll just track the amount
        stakingRewards.stakedTokens[msg.sender] += _amount;
        stakingRewards.totalStaked += _amount;

        emit StakingRewardsUpdated(stakingRewards.totalStaked, stakingRewards.rewardRate);
    }

    /**
     * @dev Batch claim profits from multiple distributions
     * @param _distributionIds Array of distribution IDs to claim from
     * @return totalClaimedAmount Total amount claimed
     */
    function batchClaimProfits(
        uint256[] calldata _distributionIds
    ) external whenNotPaused nonReentrant returns (uint256 totalClaimedAmount) {
        require(_distributionIds.length > 0, "No distributions specified");
        require(_distributionIds.length <= 20, "Too many distributions");

        uint256 userTokens = projectToken.balanceOf(msg.sender);
        require(userTokens > 0, "No tokens held");

        for (uint256 i = 0; i < _distributionIds.length; i++) {
            uint256 distributionId = _distributionIds[i];

            if (
                distributionId > 0 &&
                distributionId <= distributionCount &&
                distributions[distributionId].isActive &&
                !distributions[distributionId].hasClaimed[msg.sender]
            ) {
                ProfitDistribution storage distribution = distributions[distributionId];
                uint256 claimAmount = (userTokens * distribution.perTokenAmount);

                if (claimAmount > 0 && address(this).balance >= claimAmount) {
                    // Apply vesting if applicable
                    if (claimSchedules[msg.sender].isActive) {
                        claimAmount = _applyVestingSchedule(msg.sender, claimAmount);
                    }

                    if (claimAmount > 0) {
                        distribution.hasClaimed[msg.sender] = true;
                        distribution.claimedAmounts[msg.sender] = claimAmount;
                        distribution.claimedCount++;
                        distribution.totalClaimed += claimAmount;

                        totalClaimedAmount += claimAmount;
                        totalClaimed[msg.sender] += claimAmount;
                        userDistributions[msg.sender].push(distributionId);

                        emit ProfitClaimed(distributionId, msg.sender, claimAmount);
                    }
                }
            }
        }

        require(totalClaimedAmount > 0, "No profits to claim");

        // Update claim streak
        if (lastClaimTime[msg.sender] > 0 && block.timestamp - lastClaimTime[msg.sender] <= 30 days) {
            claimStreak[msg.sender]++;
        } else {
            claimStreak[msg.sender] = 1;
        }
        lastClaimTime[msg.sender] = block.timestamp;

        // Update staking rewards
        _updateRewards(msg.sender);

        // Transfer total claimed amount
        (bool success, ) = payable(msg.sender).call{ value: totalClaimedAmount }("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Set claim schedule for a recipient
     * @param _recipient Recipient address
     * @param _totalAmount Total amount to be vested
     * @param _vestingSchedule Array of vesting periods (in seconds)
     * @param _releaseAmounts Array of release percentages (basis points)
     * @param _cliffPeriod Cliff period in seconds
     */
    function setClaimSchedule(
        address _recipient,
        uint256 _totalAmount,
        uint256[] calldata _vestingSchedule,
        uint256[] calldata _releaseAmounts,
        uint256 _cliffPeriod
    ) external onlyRole(ADMIN_ROLE) {
        require(_recipient != address(0), "Invalid recipient");
        require(_totalAmount > 0, "Invalid total amount");
        require(_vestingSchedule.length == _releaseAmounts.length, "Array length mismatch");
        require(_vestingSchedule.length > 0, "Empty vesting schedule");

        claimSchedules[_recipient] = ClaimSchedule({
            totalAmount: _totalAmount,
            claimedAmount: 0,
            vestingSchedule: _vestingSchedule,
            releaseAmounts: _releaseAmounts,
            startTime: block.timestamp,
            cliffPeriod: _cliffPeriod,
            isActive: true
        });

        emit ClaimScheduleSet(_recipient, _totalAmount, _cliffPeriod);
    }

    /**
     * @dev Emergency withdrawal function
     * @param _amount Amount to withdraw
     * @param _reason Reason for emergency withdrawal
     */
    function emergencyWithdraw(uint256 _amount, string calldata _reason) external onlyRole(ADMIN_ROLE) {
        require(_amount > 0, "Invalid amount");
        require(_amount <= emergencyConfig.emergencyWithdrawalLimit, "Exceeds emergency limit");
        require(address(this).balance >= _amount, "Insufficient balance");
        require(emergencyConfig.emergencyMode, "Emergency mode not active");

        emergencyConfig.lastEmergencyWithdrawal = block.timestamp;

        (bool success, ) = payable(emergencyConfig.emergencyRecipient).call{ value: _amount }("");
        require(success, "Emergency withdrawal failed");

        emit EmergencyWithdrawal(emergencyConfig.emergencyRecipient, _amount, _reason);
    }

    /**
     * @dev Update dynamic fee configuration
     * @param _baseManagementFee Base management fee rate
     * @param _performanceFeeRate Performance fee rate
     * @param _highPerformanceThreshold High performance threshold
     * @param _lowPerformanceThreshold Low performance threshold
     * @param _maxFeeRate Maximum fee rate
     * @param _minFeeRate Minimum fee rate
     */
    function updateFeeConfig(
        uint256 _baseManagementFee,
        uint256 _performanceFeeRate,
        uint256 _highPerformanceThreshold,
        uint256 _lowPerformanceThreshold,
        uint256 _maxFeeRate,
        uint256 _minFeeRate
    ) external onlyRole(ADMIN_ROLE) {
        require(_baseManagementFee <= 2000, "Base fee too high");
        require(_performanceFeeRate <= 3000, "Performance fee too high");
        require(_maxFeeRate >= _minFeeRate, "Invalid fee range");
        require(_highPerformanceThreshold > _lowPerformanceThreshold, "Invalid thresholds");

        feeConfig.baseManagementFee = _baseManagementFee;
        feeConfig.performanceFeeRate = _performanceFeeRate;
        feeConfig.highPerformanceThreshold = _highPerformanceThreshold;
        feeConfig.lowPerformanceThreshold = _lowPerformanceThreshold;
        feeConfig.maxFeeRate = _maxFeeRate;
        feeConfig.minFeeRate = _minFeeRate;

        emit FeeConfigUpdated(_baseManagementFee, _performanceFeeRate, _maxFeeRate, _minFeeRate);
    }

    /**
     * @dev Get distribution information
     * @param _distributionId Distribution ID
     * @return id Distribution ID
     * @return totalAmount Total distribution amount
     * @return platformFee Platform fee amount
     * @return netDistribution Net distribution amount
     * @return timestamp Distribution timestamp
     * @return totalTokenSupply Total token supply at distribution
     * @return perTokenAmount Amount per token
     * @return claimedCount Number of claims made
     * @return totalClaimedAmount Total amount claimed
     * @return isActive Whether distribution is active
     */
    function getDistribution(
        uint256 _distributionId
    )
        external
        view
        validDistribution(_distributionId)
        returns (
            uint256 id,
            uint256 totalAmount,
            uint256 platformFee,
            uint256 netDistribution,
            uint256 timestamp,
            uint256 totalTokenSupply,
            uint256 perTokenAmount,
            uint256 claimedCount,
            uint256 totalClaimedAmount,
            bool isActive
        )
    {
        ProfitDistribution storage distribution = distributions[_distributionId];
        return (
            distribution.id,
            distribution.totalAmount,
            distribution.platformFee,
            distribution.netDistribution,
            distribution.timestamp,
            distribution.totalTokenSupply,
            distribution.perTokenAmount,
            distribution.claimedCount,
            distribution.totalClaimed,
            distribution.isActive
        );
    }

    /**
     * @dev Get user's claimable amount for a distribution
     * @param _user User address
     * @param _distributionId Distribution ID
     * @return claimableAmount Amount user can claim
     */
    function getClaimableAmount(
        address _user,
        uint256 _distributionId
    ) external view validDistribution(_distributionId) returns (uint256 claimableAmount) {
        ProfitDistribution storage distribution = distributions[_distributionId];

        if (distribution.hasClaimed[_user]) {
            return 0;
        }

        uint256 userTokens = projectToken.balanceOf(_user);
        if (userTokens == 0) {
            return 0;
        }

        uint256 baseAmount = (userTokens * distribution.perTokenAmount);

        // Apply vesting schedule if applicable
        if (claimSchedules[_user].isActive) {
            return _applyVestingSchedule(_user, baseAmount);
        }

        return baseAmount;
    }

    /**
     * @dev Get all user distributions
     * @param _user User address
     * @return distributionIds Array of distribution IDs user participated in
     */
    function getUserDistributions(address _user) external view returns (uint256[] memory distributionIds) {
        return userDistributions[_user];
    }

    /**
     * @dev Get performance metrics
     * @return metrics Current performance metrics
     */
    function getPerformanceMetrics() external view returns (PerformanceMetrics memory metrics) {
        return performanceMetrics;
    }

    /**
     * @dev Get fee configuration
     * @return config Current fee configuration
     */
    function getFeeConfig() external view returns (DynamicFeeConfig memory config) {
        return feeConfig;
    }

    /**
     * @dev Get staking rewards information
     * @param _user User address
     * @return stakedAmount Amount staked by user
     * @return rewardAmount Pending rewards
     * @return totalStaked Total staked tokens
     */
    function getStakingInfo(
        address _user
    ) external view returns (uint256 stakedAmount, uint256 rewardAmount, uint256 totalStaked) {
        stakedAmount = stakingRewards.stakedTokens[_user];

        if (stakedAmount > 0) {
            rewardAmount =
                stakingRewards.rewards[_user] +
                ((stakedAmount * (stakingRewards.rewardPerTokenStored - stakingRewards.userRewardPerTokenPaid[_user])) /
                    1e18);
        }

        totalStaked = stakingRewards.totalStaked;
    }

    /**
     * @dev Pause contract operations
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract operations
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Fallback function to receive ETH
     */
    receive() external payable {
        // Allow contract to receive ETH
    }
}
