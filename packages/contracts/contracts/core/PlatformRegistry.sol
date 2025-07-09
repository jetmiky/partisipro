// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PlatformRegistry
 * @dev Central access control and configuration contract for the platform
 * @notice Manages whitelisted SPVs, investors, and platform parameters
 */
contract PlatformRegistry is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

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
    }

    mapping(address => SPVInfo) public spvs;
    mapping(address => InvestorInfo) public investors;
    mapping(address => bool) public authorizedFactories;
    mapping(address => bool) public authorizedProjects;

    address[] public spvList;
    address[] public investorList;

    PlatformConfig public platformConfig;
    address public platformTreasury;

    event SPVRegistered(address indexed spv, string name, string registrationNumber);
    event SPVDeactivated(address indexed spv);
    event InvestorVerified(address indexed investor);
    event InvestorDeactivated(address indexed investor);
    event PlatformConfigUpdated(uint256 listingFee, uint256 managementFeeRate);
    event PlatformTreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event FactoryAuthorized(address indexed factory);
    event FactoryDeauthorized(address indexed factory);
    event PlatformStatusChanged(bool active);

    modifier onlyActivePlatform() {
        require(platformConfig.platformActive, "Platform is not active");
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

    constructor(
        address _admin,
        address _platformTreasury,
        uint256 _listingFee,
        uint256 _managementFeeRate,
        uint256 _minimumInvestment,
        uint256 _maximumInvestment
    ) {
        require(_admin != address(0), "Invalid admin address");
        require(_platformTreasury != address(0), "Invalid treasury address");
        require(_managementFeeRate <= 1000, "Management fee too high"); // Max 10%

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);

        platformTreasury = _platformTreasury;
        platformConfig = PlatformConfig({
            listingFee: _listingFee,
            managementFeeRate: _managementFeeRate,
            minimumInvestment: _minimumInvestment,
            maximumInvestment: _maximumInvestment,
            platformActive: true
        });
    }

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
    ) external onlyRole(ADMIN_ROLE) {
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
    function deactivateSPV(address _spv) external onlyRole(ADMIN_ROLE) {
        require(spvs[_spv].isActive, "SPV not active");
        spvs[_spv].isActive = false;
        emit SPVDeactivated(_spv);
    }

    /**
     * @dev Verify and whitelist an investor
     * @param _investor Address of the investor
     */
    function verifyInvestor(address _investor) external onlyRole(OPERATOR_ROLE) {
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
    function deactivateInvestor(address _investor) external onlyRole(ADMIN_ROLE) {
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
     */
    function updatePlatformConfig(
        uint256 _listingFee,
        uint256 _managementFeeRate,
        uint256 _minimumInvestment,
        uint256 _maximumInvestment
    ) external onlyRole(ADMIN_ROLE) {
        require(_managementFeeRate <= 1000, "Management fee too high"); // Max 10%
        require(_minimumInvestment <= _maximumInvestment, "Invalid investment limits");

        platformConfig.listingFee = _listingFee;
        platformConfig.managementFeeRate = _managementFeeRate;
        platformConfig.minimumInvestment = _minimumInvestment;
        platformConfig.maximumInvestment = _maximumInvestment;

        emit PlatformConfigUpdated(_listingFee, _managementFeeRate);
    }

    /**
     * @dev Update platform treasury address
     * @param _newTreasury New treasury address
     */
    function updatePlatformTreasury(address _newTreasury) external onlyRole(ADMIN_ROLE) {
        require(_newTreasury != address(0), "Invalid treasury address");
        address oldTreasury = platformTreasury;
        platformTreasury = _newTreasury;
        emit PlatformTreasuryUpdated(oldTreasury, _newTreasury);
    }

    /**
     * @dev Authorize a factory contract
     * @param _factory Address of the factory contract
     */
    function authorizeFactory(address _factory) external onlyRole(ADMIN_ROLE) {
        require(_factory != address(0), "Invalid factory address");
        authorizedFactories[_factory] = true;
        emit FactoryAuthorized(_factory);
    }

    /**
     * @dev Deauthorize a factory contract
     * @param _factory Address of the factory contract
     */
    function deauthorizeFactory(address _factory) external onlyRole(ADMIN_ROLE) {
        authorizedFactories[_factory] = false;
        emit FactoryDeauthorized(_factory);
    }

    /**
     * @dev Register a project contract (called by authorized factories)
     * @param _project Address of the project contract
     */
    function registerProject(address _project) external onlyAuthorizedFactory {
        require(_project != address(0), "Invalid project address");
        authorizedProjects[_project] = true;
    }

    /**
     * @dev Set platform active status
     * @param _active New platform status
     */
    function setPlatformActive(bool _active) external onlyRole(ADMIN_ROLE) {
        platformConfig.platformActive = _active;
        emit PlatformStatusChanged(_active);
    }

    /**
     * @dev Increment project count for SPV (called by authorized factory)
     * @param _spv Address of the SPV
     */
    function incrementProjectCount(address _spv) external onlyAuthorizedFactory {
        require(spvs[_spv].isActive, "SPV not active");
        spvs[_spv].projectsCreated++;
    }

    /**
     * @dev Increment investment count for investor (called by authorized contracts)
     * @param _investor Address of the investor
     */
    function incrementInvestmentCount(address _investor) external onlyAuthorizedContract {
        require(investors[_investor].isActive, "Investor not active");
        investors[_investor].investmentCount++;
    }

    /**
     * @dev Check if SPV is authorized to create projects
     * @param _spv Address of the SPV
     * @return bool True if SPV is authorized
     */
    function isSPVAuthorized(address _spv) external view returns (bool) {
        return spvs[_spv].isActive && platformConfig.platformActive;
    }

    /**
     * @dev Check if investor is authorized to invest
     * @param _investor Address of the investor
     * @return bool True if investor is authorized
     */
    function isInvestorAuthorized(address _investor) external view returns (bool) {
        return investors[_investor].isActive && investors[_investor].kycVerified && platformConfig.platformActive;
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
}
