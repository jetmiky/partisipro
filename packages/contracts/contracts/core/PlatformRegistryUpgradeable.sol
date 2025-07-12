// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

/**
 * @title PlatformRegistryUpgradeable
 * @dev Upgradeable central access control and configuration contract for the platform
 * @notice Manages whitelisted SPVs, investors, and platform parameters with emergency controls
 */
contract PlatformRegistryUpgradeable is
    Initializable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable,
    PausableUpgradeable
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct SPVInfo {
        string name;
        string registrationNumber;
        address walletAddress;
        bool isActive;
        uint256 registeredAt;
        uint256 projectsCreated;
    }

    struct InvestorInfo {
        address walletAddress;
        bool kycVerified;
        bool isActive;
        uint256 verifiedAt;
        uint256 investmentCount;
    }

    struct PlatformConfig {
        uint256 listingFee;
        uint256 managementFeeRate;
        uint256 minimumInvestment;
        uint256 maximumInvestment;
        bool platformActive;
        uint256 emergencyWithdrawalThreshold;
    }

    mapping(address => SPVInfo) public spvs;
    mapping(address => InvestorInfo) public investors;
    mapping(address => bool) public authorizedFactories;
    mapping(address => bool) public authorizedProjects;

    address[] public spvList;
    address[] public investorList;

    PlatformConfig public platformConfig;
    address public platformTreasury;

    // Emergency controls
    uint256 public emergencyActivatedAt;
    bool public emergencyMode;
    mapping(address => uint256) public lastActivity;

    event SPVRegistered(address indexed spv, string name, string registrationNumber);
    event SPVDeactivated(address indexed spv);
    event InvestorVerified(address indexed investor);
    event InvestorDeactivated(address indexed investor);
    event PlatformConfigUpdated(uint256 listingFee, uint256 managementFeeRate);
    event PlatformTreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event FactoryAuthorized(address indexed factory);
    event FactoryDeauthorized(address indexed factory);
    event PlatformStatusChanged(bool active);
    event EmergencyModeActivated(address indexed activator);
    event EmergencyModeDeactivated(address indexed deactivator);
    event EmergencyWithdrawal(address indexed to, uint256 amount);

    modifier onlyActivePlatform() {
        require(platformConfig.platformActive && !emergencyMode, "Platform not active or in emergency mode");
        _;
    }

    modifier onlyAuthorizedFactory() {
        require(authorizedFactories[msg.sender], "Not authorized factory");
        _;
    }

    modifier onlyAuthorizedContract() {
        require(authorizedFactories[msg.sender] || authorizedProjects[msg.sender], "Not authorized contract");
        _;
    }

    modifier notInEmergency() {
        require(!emergencyMode, "Platform in emergency mode");
        _;
    }

    modifier onlyInEmergency() {
        require(emergencyMode, "Platform not in emergency mode");
        _;
    }

    modifier updateActivity() {
        lastActivity[msg.sender] = block.timestamp;
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _admin,
        address _platformTreasury,
        uint256 _listingFee,
        uint256 _managementFeeRate,
        uint256 _minimumInvestment,
        uint256 _maximumInvestment,
        uint256 _emergencyWithdrawalThreshold
    ) public initializer {
        require(_admin != address(0), "Invalid admin address");
        require(_platformTreasury != address(0), "Invalid treasury address");
        require(_managementFeeRate <= 1000, "Management fee too high"); // Max 10%

        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(UPGRADER_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);

        platformTreasury = _platformTreasury;
        platformConfig = PlatformConfig({
            listingFee: _listingFee,
            managementFeeRate: _managementFeeRate,
            minimumInvestment: _minimumInvestment,
            maximumInvestment: _maximumInvestment,
            platformActive: true,
            emergencyWithdrawalThreshold: _emergencyWithdrawalThreshold
        });

        emergencyMode = false;
        emergencyActivatedAt = 0;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    /**
     * @dev Register a new SPV (Special Purpose Vehicle)
     * @param _spv Address of the SPV wallet
     * @param _name Name of the SPV
     * @param _registrationNumber Official registration number
     */
    function registerSPV(
        address _spv,
        string calldata _name,
        string calldata _registrationNumber
    ) external onlyRole(ADMIN_ROLE) whenNotPaused notInEmergency updateActivity {
        require(_spv != address(0), "Invalid SPV address");
        require(!spvs[_spv].isActive, "SPV already registered");
        require(bytes(_name).length > 0, "Empty name");
        require(bytes(_registrationNumber).length > 0, "Empty registration number");

        spvs[_spv] = SPVInfo({
            name: _name,
            registrationNumber: _registrationNumber,
            walletAddress: _spv,
            isActive: true,
            registeredAt: block.timestamp,
            projectsCreated: 0
        });

        spvList.push(_spv);

        emit SPVRegistered(_spv, _name, _registrationNumber);
    }

    /**
     * @dev Deactivate an SPV
     * @param _spv Address of the SPV to deactivate
     */
    function deactivateSPV(address _spv) external onlyRole(ADMIN_ROLE) whenNotPaused updateActivity {
        require(spvs[_spv].isActive, "SPV not active");
        spvs[_spv].isActive = false;
        emit SPVDeactivated(_spv);
    }

    /**
     * @dev Verify and whitelist an investor
     * @param _investor Address of the investor
     */
    function verifyInvestor(
        address _investor
    ) external onlyRole(OPERATOR_ROLE) whenNotPaused notInEmergency updateActivity {
        require(_investor != address(0), "Invalid investor address");

        investors[_investor] = InvestorInfo({
            walletAddress: _investor,
            kycVerified: true,
            isActive: true,
            verifiedAt: block.timestamp,
            investmentCount: 0
        });

        investorList.push(_investor);

        emit InvestorVerified(_investor);
    }

    /**
     * @dev Deactivate an investor
     * @param _investor Address of the investor to deactivate
     */
    function deactivateInvestor(address _investor) external onlyRole(ADMIN_ROLE) whenNotPaused updateActivity {
        require(investors[_investor].isActive, "Investor not active");
        investors[_investor].isActive = false;
        emit InvestorDeactivated(_investor);
    }

    /**
     * @dev Update platform configuration
     * @param _listingFee New listing fee
     * @param _managementFeeRate New management fee rate (basis points)
     * @param _minimumInvestment New minimum investment amount
     * @param _maximumInvestment New maximum investment amount
     * @param _emergencyWithdrawalThreshold New emergency withdrawal threshold
     */
    function updatePlatformConfig(
        uint256 _listingFee,
        uint256 _managementFeeRate,
        uint256 _minimumInvestment,
        uint256 _maximumInvestment,
        uint256 _emergencyWithdrawalThreshold
    ) external onlyRole(ADMIN_ROLE) whenNotPaused updateActivity {
        require(_managementFeeRate <= 1000, "Management fee too high"); // Max 10%
        require(_minimumInvestment <= _maximumInvestment, "Invalid investment limits");

        platformConfig.listingFee = _listingFee;
        platformConfig.managementFeeRate = _managementFeeRate;
        platformConfig.minimumInvestment = _minimumInvestment;
        platformConfig.maximumInvestment = _maximumInvestment;
        platformConfig.emergencyWithdrawalThreshold = _emergencyWithdrawalThreshold;

        emit PlatformConfigUpdated(_listingFee, _managementFeeRate);
    }

    /**
     * @dev Update platform treasury address
     * @param _newTreasury New treasury address
     */
    function updatePlatformTreasury(address _newTreasury) external onlyRole(ADMIN_ROLE) whenNotPaused updateActivity {
        require(_newTreasury != address(0), "Invalid treasury address");
        address oldTreasury = platformTreasury;
        platformTreasury = _newTreasury;
        emit PlatformTreasuryUpdated(oldTreasury, _newTreasury);
    }

    /**
     * @dev Authorize a factory contract
     * @param _factory Address of the factory contract
     */
    function authorizeFactory(address _factory) external onlyRole(ADMIN_ROLE) whenNotPaused updateActivity {
        require(_factory != address(0), "Invalid factory address");
        authorizedFactories[_factory] = true;
        emit FactoryAuthorized(_factory);
    }

    /**
     * @dev Deauthorize a factory contract
     * @param _factory Address of the factory contract
     */
    function deauthorizeFactory(address _factory) external onlyRole(ADMIN_ROLE) whenNotPaused updateActivity {
        authorizedFactories[_factory] = false;
        emit FactoryDeauthorized(_factory);
    }

    /**
     * @dev Register a project contract (called by authorized factories)
     * @param _project Address of the project contract
     */
    function registerProject(
        address _project
    ) external onlyAuthorizedFactory whenNotPaused notInEmergency updateActivity {
        require(_project != address(0), "Invalid project address");
        authorizedProjects[_project] = true;
    }

    /**
     * @dev Set platform active status
     * @param _active New platform status
     */
    function setPlatformActive(bool _active) external onlyRole(ADMIN_ROLE) whenNotPaused updateActivity {
        platformConfig.platformActive = _active;
        emit PlatformStatusChanged(_active);
    }

    /**
     * @dev Increment project count for SPV (called by authorized factory)
     * @param _spv Address of the SPV
     */
    function incrementProjectCount(
        address _spv
    ) external onlyAuthorizedFactory whenNotPaused notInEmergency updateActivity {
        require(spvs[_spv].isActive, "SPV not active");
        spvs[_spv].projectsCreated++;
    }

    /**
     * @dev Increment investment count for investor (called by authorized contracts)
     * @param _investor Address of the investor
     */
    function incrementInvestmentCount(
        address _investor
    ) external onlyAuthorizedContract whenNotPaused notInEmergency updateActivity {
        require(investors[_investor].isActive, "Investor not active");
        investors[_investor].investmentCount++;
    }

    // Emergency Functions

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
     * @dev Emergency withdrawal function
     * @param _to Address to withdraw to
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(address _to, uint256 _amount) external onlyRole(ADMIN_ROLE) onlyInEmergency {
        require(_to != address(0), "Invalid withdrawal address");
        require(_amount > 0, "Invalid amount");
        require(address(this).balance >= _amount, "Insufficient balance");
        require(_amount <= platformConfig.emergencyWithdrawalThreshold, "Amount exceeds threshold");

        (bool success, ) = _to.call{ value: _amount }("");
        require(success, "Withdrawal failed");

        emit EmergencyWithdrawal(_to, _amount);
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

    // View Functions

    /**
     * @dev Check if SPV is authorized to create projects
     * @param _spv Address of the SPV
     * @return bool True if SPV is authorized
     */
    function isSPVAuthorized(address _spv) external view returns (bool) {
        return spvs[_spv].isActive && platformConfig.platformActive && !emergencyMode;
    }

    /**
     * @dev Check if investor is authorized to invest
     * @param _investor Address of the investor
     * @return bool True if investor is authorized
     */
    function isInvestorAuthorized(address _investor) external view returns (bool) {
        return
            investors[_investor].isActive &&
            investors[_investor].kycVerified &&
            platformConfig.platformActive &&
            !emergencyMode;
    }

    /**
     * @dev Get platform configuration
     * @return PlatformConfig Current platform configuration
     */
    function getPlatformConfig() external view returns (PlatformConfig memory) {
        return platformConfig;
    }

    /**
     * @dev Get SPV information
     * @param _spv Address of the SPV
     * @return SPVInfo SPV information
     */
    function getSPVInfo(address _spv) external view returns (SPVInfo memory) {
        return spvs[_spv];
    }

    /**
     * @dev Get investor information
     * @param _investor Address of the investor
     * @return InvestorInfo Investor information
     */
    function getInvestorInfo(address _investor) external view returns (InvestorInfo memory) {
        return investors[_investor];
    }

    /**
     * @dev Get all registered SPVs
     * @return address[] Array of SPV addresses
     */
    function getAllSPVs() external view returns (address[] memory) {
        return spvList;
    }

    /**
     * @dev Get all verified investors
     * @return address[] Array of investor addresses
     */
    function getAllInvestors() external view returns (address[] memory) {
        return investorList;
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
     * @dev Get last activity timestamp for address
     * @param _address Address to check
     * @return uint256 Last activity timestamp
     */
    function getLastActivity(address _address) external view returns (uint256) {
        return lastActivity[_address];
    }

    /**
     * @dev Check if contract is in emergency mode
     * @return bool True if in emergency mode
     */
    function isEmergencyMode() external view returns (bool) {
        return emergencyMode;
    }

    receive() external payable {}
}
