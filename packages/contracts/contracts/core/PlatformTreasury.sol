// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title PlatformTreasury
 * @dev Platform treasury contract for collecting and managing platform fees
 * @notice Manages listing fees, management fees, and platform revenue
 */
contract PlatformTreasury is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant COLLECTOR_ROLE = keccak256("COLLECTOR_ROLE");

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

    mapping(address => FeeCollection) public tokenFees; // Token address -> fees
    mapping(uint256 => WithdrawalRequest) public withdrawalRequests;

    FeeCollection public ethFees;
    address public platformRegistry;

    uint256 public nextWithdrawalId = 1;
    uint256 public withdrawalDelay = 24 hours;

    // Emergency withdrawal settings
    address public emergencyRecipient;
    uint256 public emergencyWithdrawalThreshold;

    event ListingFeeCollected(address indexed project, uint256 amount);
    event ManagementFeeCollected(address indexed project, uint256 amount);
    event TokenFeeCollected(address indexed token, address indexed project, uint256 amount);
    event WithdrawalRequested(uint256 indexed requestId, address indexed recipient, uint256 amount);
    event WithdrawalExecuted(uint256 indexed requestId, address indexed recipient, uint256 amount);
    event EmergencyWithdrawal(address indexed recipient, uint256 amount, string reason);
    event PlatformRegistryUpdated(address indexed oldRegistry, address indexed newRegistry);
    event WithdrawalDelayUpdated(uint256 oldDelay, uint256 newDelay);
    event EmergencySettingsUpdated(address indexed recipient, uint256 threshold);

    modifier onlyPlatformRegistry() {
        require(msg.sender == platformRegistry, "Only platform registry");
        _;
    }

    modifier validWithdrawalRequest(uint256 _requestId) {
        require(_requestId > 0 && _requestId < nextWithdrawalId, "Invalid request ID");
        require(!withdrawalRequests[_requestId].executed, "Already executed");
        _;
    }

    constructor(
        address _admin,
        address _platformRegistry,
        address _emergencyRecipient,
        uint256 _emergencyWithdrawalThreshold
    ) {
        require(_admin != address(0), "Invalid admin address");
        require(_platformRegistry != address(0), "Invalid registry address");
        require(_emergencyRecipient != address(0), "Invalid emergency recipient");

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);

        platformRegistry = _platformRegistry;
        emergencyRecipient = _emergencyRecipient;
        emergencyWithdrawalThreshold = _emergencyWithdrawalThreshold;
    }

    /**
     * @dev Collect listing fee from project creation
     * @param _project Address of the project
     */
    function collectListingFee(address _project) external payable nonReentrant whenNotPaused {
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
    function collectManagementFee(address _project) external payable nonReentrant whenNotPaused {
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
    ) external onlyRole(COLLECTOR_ROLE) nonReentrant whenNotPaused {
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
    ) external onlyRole(OPERATOR_ROLE) returns (uint256 requestId) {
        require(_amount > 0, "Invalid amount");
        require(_recipient != address(0), "Invalid recipient");
        require(_amount <= getAvailableBalance(), "Insufficient balance");

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
    ) external onlyRole(ADMIN_ROLE) nonReentrant validWithdrawalRequest(_requestId) whenNotPaused {
        WithdrawalRequest storage request = withdrawalRequests[_requestId];

        require(block.timestamp >= request.requestedAt + withdrawalDelay, "Withdrawal delay not met");
        require(request.amount <= getAvailableBalance(), "Insufficient balance");

        request.executed = true;
        ethFees.totalWithdrawn += request.amount;

        (bool success, ) = request.recipient.call{ value: request.amount }("");
        require(success, "Withdrawal failed");

        emit WithdrawalExecuted(_requestId, request.recipient, request.amount);
    }

    /**
     * @dev Emergency withdrawal (bypasses delay)
     * @param _amount Amount to withdraw
     * @param _reason Emergency reason
     */
    function emergencyWithdraw(uint256 _amount, string calldata _reason) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(_amount > 0, "Invalid amount");
        require(_amount >= emergencyWithdrawalThreshold, "Below emergency threshold");
        require(_amount <= getAvailableBalance(), "Insufficient balance");

        ethFees.totalWithdrawn += _amount;

        (bool success, ) = emergencyRecipient.call{ value: _amount }("");
        require(success, "Emergency withdrawal failed");

        emit EmergencyWithdrawal(emergencyRecipient, _amount, _reason);
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
    ) external onlyRole(ADMIN_ROLE) nonReentrant whenNotPaused {
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
        emergencyWithdrawalThreshold = _threshold;
        emit EmergencySettingsUpdated(_recipient, _threshold);
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

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
     * @dev Receive ETH directly (for manual fee payments)
     */
    receive() external payable {
        ethFees.totalCollected += msg.value;
        ethFees.lastUpdated = block.timestamp;
    }
}
