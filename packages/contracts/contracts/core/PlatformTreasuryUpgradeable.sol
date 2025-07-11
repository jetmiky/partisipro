// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title PlatformTreasuryUpgradeable
 * @dev Upgradeable platform treasury contract with enhanced security and emergency controls
 * @notice Manages listing fees, management fees, and platform revenue with circuit breaker patterns
 */
contract PlatformTreasuryUpgradeable is
    Initializable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant COLLECTOR_ROLE = keccak256("COLLECTOR_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct FeeCollection {
        uint256 listingFees;
        uint256 managementFees;
        uint256 totalCollected;
        uint256 totalWithdrawn;
        uint256 lastUpdated;
    }

    struct WithdrawalRequest {
        uint256 amount;
        address recipient;
        string reason;
        uint256 requestedAt;
        bool executed;
        address requestedBy;
    }

    struct EmergencyLimits {
        uint256 dailyWithdrawalLimit;
        uint256 maxSingleWithdrawal;
        uint256 emergencyThreshold;
        uint256 lastEmergencyWithdrawal;
        uint256 dailyWithdrawnAmount;
        uint256 lastResetDay;
    }

    mapping(address => FeeCollection) public tokenFees;
    mapping(uint256 => WithdrawalRequest) public withdrawalRequests;
    mapping(address => uint256) public dailyWithdrawals;
    mapping(address => uint256) public lastWithdrawalDay;

    FeeCollection public ethFees;
    address public platformRegistry;
    EmergencyLimits public emergencyLimits;

    uint256 public nextWithdrawalId = 1;
    uint256 public withdrawalDelay = 24 hours;
    address public emergencyRecipient;
    bool public emergencyMode;
    uint256 public emergencyActivatedAt;

    // Circuit breaker parameters
    uint256 public circuitBreakerThreshold;
    uint256 public circuitBreakerWindow;
    uint256 public lastCircuitBreakerReset;
    uint256 public circuitBreakerTriggered;

    event ListingFeeCollected(address indexed project, uint256 amount);
    event ManagementFeeCollected(address indexed project, uint256 amount);
    event TokenFeeCollected(address indexed token, address indexed project, uint256 amount);
    event WithdrawalRequested(uint256 indexed requestId, address indexed recipient, uint256 amount);
    event WithdrawalExecuted(uint256 indexed requestId, address indexed recipient, uint256 amount);
    event EmergencyWithdrawal(address indexed recipient, uint256 amount, string reason);
    event PlatformRegistryUpdated(address indexed oldRegistry, address indexed newRegistry);
    event WithdrawalDelayUpdated(uint256 oldDelay, uint256 newDelay);
    event EmergencySettingsUpdated(address indexed recipient, uint256 threshold);
    event EmergencyModeActivated(address indexed activator);
    event EmergencyModeDeactivated(address indexed deactivator);
    event CircuitBreakerTriggered(uint256 threshold, uint256 amount);
    event CircuitBreakerReset(address indexed admin);

    modifier onlyPlatformRegistry() {
        require(msg.sender == platformRegistry, "Only platform registry");
        _;
    }

    modifier validWithdrawalRequest(uint256 _requestId) {
        require(_requestId > 0 && _requestId < nextWithdrawalId, "Invalid request ID");
        require(!withdrawalRequests[_requestId].executed, "Already executed");
        _;
    }

    modifier notInEmergency() {
        require(!emergencyMode, "Contract in emergency mode");
        _;
    }

    modifier onlyInEmergency() {
        require(emergencyMode, "Contract not in emergency mode");
        _;
    }

    modifier circuitBreakerCheck(uint256 _amount) {
        require(!_isCircuitBreakerTriggered(_amount), "Circuit breaker triggered");
        _;
    }

    modifier dailyLimitCheck(uint256 _amount) {
        require(_checkDailyLimit(_amount), "Daily withdrawal limit exceeded");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _admin,
        address _platformRegistry,
        address _emergencyRecipient,
        uint256 _emergencyWithdrawalThreshold,
        uint256 _dailyWithdrawalLimit,
        uint256 _maxSingleWithdrawal,
        uint256 _circuitBreakerThreshold
    ) public initializer {
        require(_admin != address(0), "Invalid admin address");
        require(_platformRegistry != address(0), "Invalid registry address");
        require(_emergencyRecipient != address(0), "Invalid emergency recipient");

        __AccessControl_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);
        _grantRole(UPGRADER_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);

        platformRegistry = _platformRegistry;
        emergencyRecipient = _emergencyRecipient;
        emergencyMode = false;
        emergencyActivatedAt = 0;

        emergencyLimits = EmergencyLimits({
            dailyWithdrawalLimit: _dailyWithdrawalLimit,
            maxSingleWithdrawal: _maxSingleWithdrawal,
            emergencyThreshold: _emergencyWithdrawalThreshold,
            lastEmergencyWithdrawal: 0,
            dailyWithdrawnAmount: 0,
            lastResetDay: block.timestamp / 1 days
        });

        circuitBreakerThreshold = _circuitBreakerThreshold;
        circuitBreakerWindow = 1 hours;
        lastCircuitBreakerReset = block.timestamp;
        circuitBreakerTriggered = 0;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    /**
     * @dev Collect listing fee from project creation
     * @param _project Address of the project
     */
    function collectListingFee(address _project) external payable nonReentrant whenNotPaused notInEmergency {
        require(msg.value > 0, "No fee sent");
        require(_project != address(0), "Invalid project address");

        ethFees.listingFees += msg.value;
        ethFees.totalCollected += msg.value;
        ethFees.lastUpdated = block.timestamp;

        emit ListingFeeCollected(_project, msg.value);
    }

    /**
     * @dev Collect management fee from project treasury
     * @param _project Address of the project
     */
    function collectManagementFee(address _project) external payable nonReentrant whenNotPaused notInEmergency {
        require(msg.value > 0, "No fee sent");
        require(_project != address(0), "Invalid project address");

        ethFees.managementFees += msg.value;
        ethFees.totalCollected += msg.value;
        ethFees.lastUpdated = block.timestamp;

        emit ManagementFeeCollected(_project, msg.value);
    }

    /**
     * @dev Collect token-based fees
     * @param _token Address of the token
     * @param _project Address of the project
     * @param _amount Amount of tokens to collect
     */
    function collectTokenFee(
        address _token,
        address _project,
        uint256 _amount
    ) external onlyRole(COLLECTOR_ROLE) nonReentrant whenNotPaused notInEmergency {
        require(_token != address(0), "Invalid token address");
        require(_project != address(0), "Invalid project address");
        require(_amount > 0, "Invalid amount");

        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        tokenFees[_token].totalCollected += _amount;
        tokenFees[_token].lastUpdated = block.timestamp;

        emit TokenFeeCollected(_token, _project, _amount);
    }

    /**
     * @dev Request withdrawal of ETH fees
     * @param _amount Amount to withdraw
     * @param _recipient Recipient address
     * @param _reason Reason for withdrawal
     */
    function requestWithdrawal(
        uint256 _amount,
        address _recipient,
        string calldata _reason
    ) external onlyRole(OPERATOR_ROLE) notInEmergency circuitBreakerCheck(_amount) returns (uint256 requestId) {
        require(_amount > 0, "Invalid amount");
        require(_recipient != address(0), "Invalid recipient");
        require(_amount <= getAvailableBalance(), "Insufficient balance");
        require(_amount <= emergencyLimits.maxSingleWithdrawal, "Amount exceeds single withdrawal limit");

        requestId = nextWithdrawalId++;

        withdrawalRequests[requestId] = WithdrawalRequest({
            amount: _amount,
            recipient: _recipient,
            reason: _reason,
            requestedAt: block.timestamp,
            executed: false,
            requestedBy: msg.sender
        });

        emit WithdrawalRequested(requestId, _recipient, _amount);
    }

    /**
     * @dev Execute withdrawal after delay period
     * @param _requestId ID of the withdrawal request
     */
    function executeWithdrawal(
        uint256 _requestId
    )
        external
        onlyRole(ADMIN_ROLE)
        nonReentrant
        validWithdrawalRequest(_requestId)
        whenNotPaused
        notInEmergency
        dailyLimitCheck(withdrawalRequests[_requestId].amount)
    {
        WithdrawalRequest storage request = withdrawalRequests[_requestId];

        require(block.timestamp >= request.requestedAt + withdrawalDelay, "Withdrawal delay not met");
        require(request.amount <= getAvailableBalance(), "Insufficient balance");

        request.executed = true;
        ethFees.totalWithdrawn += request.amount;

        _updateDailyWithdrawal(request.amount);

        (bool success, ) = request.recipient.call{ value: request.amount }("");
        require(success, "Withdrawal failed");

        emit WithdrawalExecuted(_requestId, request.recipient, request.amount);
    }

    /**
     * @dev Emergency withdrawal (bypasses delay)
     * @param _amount Amount to withdraw
     * @param _reason Emergency reason
     */
    function emergencyWithdraw(
        uint256 _amount,
        string calldata _reason
    ) external onlyRole(ADMIN_ROLE) nonReentrant onlyInEmergency {
        require(_amount > 0, "Invalid amount");
        require(_amount >= emergencyLimits.emergencyThreshold, "Below emergency threshold");
        require(_amount <= getAvailableBalance(), "Insufficient balance");

        ethFees.totalWithdrawn += _amount;
        emergencyLimits.lastEmergencyWithdrawal = block.timestamp;

        (bool success, ) = emergencyRecipient.call{ value: _amount }("");
        require(success, "Emergency withdrawal failed");

        emit EmergencyWithdrawal(emergencyRecipient, _amount, _reason);
    }

    /**
     * @dev Activate emergency mode
     */
    function activateEmergencyMode() external onlyRole(ADMIN_ROLE) {
        require(!emergencyMode, "Emergency mode already active");
        emergencyMode = true;
        emergencyActivatedAt = block.timestamp;
        _pause();
        emit EmergencyModeActivated(msg.sender);
    }

    /**
     * @dev Deactivate emergency mode
     */
    function deactivateEmergencyMode() external onlyRole(ADMIN_ROLE) {
        require(emergencyMode, "Emergency mode not active");
        emergencyMode = false;
        emergencyActivatedAt = 0;
        _unpause();
        emit EmergencyModeDeactivated(msg.sender);
    }

    /**
     * @dev Trigger circuit breaker manually
     */
    function triggerCircuitBreaker() external onlyRole(ADMIN_ROLE) {
        circuitBreakerTriggered = block.timestamp;
        emit CircuitBreakerTriggered(circuitBreakerThreshold, 0);
    }

    /**
     * @dev Reset circuit breaker
     */
    function resetCircuitBreaker() external onlyRole(ADMIN_ROLE) {
        lastCircuitBreakerReset = block.timestamp;
        circuitBreakerTriggered = 0;
        emit CircuitBreakerReset(msg.sender);
    }

    /**
     * @dev Update emergency limits
     * @param _dailyLimit New daily withdrawal limit
     * @param _maxSingle New maximum single withdrawal
     * @param _emergencyThreshold New emergency threshold
     */
    function updateEmergencyLimits(
        uint256 _dailyLimit,
        uint256 _maxSingle,
        uint256 _emergencyThreshold
    ) external onlyRole(ADMIN_ROLE) {
        emergencyLimits.dailyWithdrawalLimit = _dailyLimit;
        emergencyLimits.maxSingleWithdrawal = _maxSingle;
        emergencyLimits.emergencyThreshold = _emergencyThreshold;
    }

    /**
     * @dev Update circuit breaker parameters
     * @param _threshold New circuit breaker threshold
     * @param _window New circuit breaker window
     */
    function updateCircuitBreaker(uint256 _threshold, uint256 _window) external onlyRole(ADMIN_ROLE) {
        circuitBreakerThreshold = _threshold;
        circuitBreakerWindow = _window;
    }

    /**
     * @dev Withdraw tokens
     * @param _token Token address
     * @param _amount Amount to withdraw
     * @param _recipient Recipient address
     */
    function withdrawToken(
        address _token,
        uint256 _amount,
        address _recipient
    ) external onlyRole(ADMIN_ROLE) nonReentrant whenNotPaused notInEmergency {
        require(_token != address(0), "Invalid token address");
        require(_amount > 0, "Invalid amount");
        require(_recipient != address(0), "Invalid recipient");

        uint256 balance = IERC20(_token).balanceOf(address(this));
        require(_amount <= balance, "Insufficient token balance");

        tokenFees[_token].totalWithdrawn += _amount;
        IERC20(_token).safeTransfer(_recipient, _amount);
    }

    /**
     * @dev Update platform registry address
     * @param _newRegistry New registry address
     */
    function updatePlatformRegistry(address _newRegistry) external onlyRole(ADMIN_ROLE) {
        require(_newRegistry != address(0), "Invalid registry address");
        address oldRegistry = platformRegistry;
        platformRegistry = _newRegistry;
        emit PlatformRegistryUpdated(oldRegistry, _newRegistry);
    }

    /**
     * @dev Update withdrawal delay
     * @param _newDelay New delay in seconds
     */
    function updateWithdrawalDelay(uint256 _newDelay) external onlyRole(ADMIN_ROLE) {
        require(_newDelay >= 1 hours && _newDelay <= 7 days, "Invalid delay");
        uint256 oldDelay = withdrawalDelay;
        withdrawalDelay = _newDelay;
        emit WithdrawalDelayUpdated(oldDelay, _newDelay);
    }

    /**
     * @dev Update emergency settings
     * @param _recipient Emergency recipient address
     * @param _threshold Emergency withdrawal threshold
     */
    function updateEmergencySettings(address _recipient, uint256 _threshold) external onlyRole(ADMIN_ROLE) {
        require(_recipient != address(0), "Invalid recipient");
        emergencyRecipient = _recipient;
        emergencyLimits.emergencyThreshold = _threshold;
        emit EmergencySettingsUpdated(_recipient, _threshold);
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Internal functions

    function _isCircuitBreakerTriggered(uint256 _amount) internal view returns (bool) {
        if (circuitBreakerTriggered == 0) return false;
        if (block.timestamp - circuitBreakerTriggered > circuitBreakerWindow) return false;
        return _amount >= circuitBreakerThreshold;
    }

    function _checkDailyLimit(uint256 _amount) internal view returns (bool) {
        uint256 currentDay = block.timestamp / 1 days;
        if (currentDay > emergencyLimits.lastResetDay) {
            return _amount <= emergencyLimits.dailyWithdrawalLimit;
        }
        return (emergencyLimits.dailyWithdrawnAmount + _amount) <= emergencyLimits.dailyWithdrawalLimit;
    }

    function _updateDailyWithdrawal(uint256 _amount) internal {
        uint256 currentDay = block.timestamp / 1 days;
        if (currentDay > emergencyLimits.lastResetDay) {
            emergencyLimits.dailyWithdrawnAmount = _amount;
            emergencyLimits.lastResetDay = currentDay;
        } else {
            emergencyLimits.dailyWithdrawnAmount += _amount;
        }
    }

    // View functions

    /**
     * @dev Get available balance for withdrawal
     * @return uint256 Available balance
     */
    function getAvailableBalance() public view returns (uint256) {
        return ethFees.totalCollected - ethFees.totalWithdrawn;
    }

    /**
     * @dev Get token balance
     * @param _token Token address
     * @return uint256 Token balance
     */
    function getTokenBalance(address _token) external view returns (uint256) {
        return IERC20(_token).balanceOf(address(this));
    }

    /**
     * @dev Get ETH fees summary
     * @return FeeCollection ETH fees information
     */
    function getEthFees() external view returns (FeeCollection memory) {
        return ethFees;
    }

    /**
     * @dev Get token fees summary
     * @param _token Token address
     * @return FeeCollection Token fees information
     */
    function getTokenFees(address _token) external view returns (FeeCollection memory) {
        return tokenFees[_token];
    }

    /**
     * @dev Get withdrawal request details
     * @param _requestId Request ID
     * @return WithdrawalRequest Request details
     */
    function getWithdrawalRequest(uint256 _requestId) external view returns (WithdrawalRequest memory) {
        return withdrawalRequests[_requestId];
    }

    /**
     * @dev Get emergency status
     * @return bool Emergency mode status
     * @return uint256 Emergency activation timestamp
     */
    function getEmergencyStatus() external view returns (bool, uint256) {
        return (emergencyMode, emergencyActivatedAt);
    }

    /**
     * @dev Get emergency limits
     * @return EmergencyLimits Emergency limits structure
     */
    function getEmergencyLimits() external view returns (EmergencyLimits memory) {
        return emergencyLimits;
    }

    /**
     * @dev Check if circuit breaker is active
     * @return bool Circuit breaker status
     */
    function isCircuitBreakerActive() external view returns (bool) {
        return _isCircuitBreakerTriggered(0);
    }

    /**
     * @dev Get remaining daily withdrawal limit
     * @return uint256 Remaining daily limit
     */
    function getRemainingDailyLimit() external view returns (uint256) {
        uint256 currentDay = block.timestamp / 1 days;
        if (currentDay > emergencyLimits.lastResetDay) {
            return emergencyLimits.dailyWithdrawalLimit;
        }
        return emergencyLimits.dailyWithdrawalLimit - emergencyLimits.dailyWithdrawnAmount;
    }

    /**
     * @dev Receive ETH directly (for manual fee payments)
     */
    receive() external payable {
        ethFees.totalCollected += msg.value;
        ethFees.lastUpdated = block.timestamp;
    }
}
