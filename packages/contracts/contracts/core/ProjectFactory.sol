// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./PlatformRegistry.sol";
import "./PlatformTreasury.sol";
import "./IdentityRegistry.sol";
import "../interfaces/IProjectToken.sol";
import "../interfaces/IProjectOffering.sol";
import "../interfaces/IProjectTreasury.sol";
import "../interfaces/IProjectGovernance.sol";

/**
 * @title ProjectFactory
 * @dev Factory contract for deploying new PPP project contracts
 * @notice This contract manages the creation of new tokenized PPP projects
 */
contract ProjectFactory is AccessControl, ReentrancyGuard {
    using Clones for address;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    address public immutable projectTokenImplementation;
    address public immutable offeringImplementation;
    address public immutable treasuryImplementation;
    address public immutable governanceImplementation;

    struct ProjectDeployment {
        address projectToken;
        address offering;
        address treasury;
        address governance;
        address creator;
        uint256 createdAt;
        bool isActive;
    }

    mapping(uint256 => ProjectDeployment) public projects;
    mapping(address => uint256[]) public creatorProjects;
    uint256 public nextProjectId;

    PlatformRegistry public platformRegistry;
    PlatformTreasury public platformTreasury;
    IdentityRegistry public identityRegistry;

    event ProjectCreated(
        uint256 indexed projectId,
        address indexed creator,
        address projectToken,
        address offering,
        address treasury,
        address governance
    );

    event PlatformRegistryUpdated(address indexed oldRegistry, address indexed newRegistry);
    event PlatformTreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event IdentityRegistryUpdated(address indexed oldRegistry, address indexed newRegistry);

    modifier onlyAuthorizedSPV() {
        require(platformRegistry.isSPVAuthorized(msg.sender), "Not authorized SPV");
        _;
    }

    constructor(
        address _admin,
        address _platformRegistry,
        address payable _platformTreasury,
        address _identityRegistry,
        address _projectTokenImplementation,
        address _offeringImplementation,
        address _treasuryImplementation,
        address _governanceImplementation
    ) {
        require(_admin != address(0), "Invalid admin address");
        require(_platformRegistry != address(0), "Invalid registry address");
        require(_platformTreasury != address(0), "Invalid treasury address");
        require(_identityRegistry != address(0), "Invalid identity registry address");
        require(_projectTokenImplementation != address(0), "Invalid token implementation");
        require(_offeringImplementation != address(0), "Invalid offering implementation");
        require(_treasuryImplementation != address(0), "Invalid treasury implementation");
        require(_governanceImplementation != address(0), "Invalid governance implementation");

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);

        platformRegistry = PlatformRegistry(_platformRegistry);
        platformTreasury = PlatformTreasury(_platformTreasury);
        identityRegistry = IdentityRegistry(_identityRegistry);

        projectTokenImplementation = _projectTokenImplementation;
        offeringImplementation = _offeringImplementation;
        treasuryImplementation = _treasuryImplementation;
        governanceImplementation = _governanceImplementation;

        nextProjectId = 1;
    }

    /**
     * @dev Create a new PPP project with associated contracts
     * @param _projectName Name of the project
     * @param _projectSymbol Symbol for the project token
     * @param _totalSupply Total supply of project tokens
     * @param _offeringPrice Price per token in the offering
     * @return projectId The ID of the newly created project
     */
    function createProject(
        string calldata _projectName,
        string calldata _projectSymbol,
        uint256 _totalSupply,
        uint256 _offeringPrice
    ) external payable nonReentrant onlyAuthorizedSPV returns (uint256 projectId) {
        PlatformRegistry.PlatformConfig memory config = platformRegistry.getPlatformConfig();
        require(msg.value >= config.listingFee, "Insufficient listing fee");

        projectId = nextProjectId++;

        // Deploy contracts using Clone factory pattern
        address projectToken = Clones.clone(projectTokenImplementation);
        address offering = Clones.clone(offeringImplementation);
        address treasury = Clones.clone(treasuryImplementation);
        address governance = Clones.clone(governanceImplementation);

        projects[projectId] = ProjectDeployment({
            projectToken: projectToken,
            offering: offering,
            treasury: treasury,
            governance: governance,
            creator: msg.sender,
            createdAt: block.timestamp,
            isActive: true
        });

        creatorProjects[msg.sender].push(projectId);

        // Send listing fee to platform treasury
        platformTreasury.collectListingFee{ value: msg.value }(projectToken);

        // Increment project count for SPV
        platformRegistry.incrementProjectCount(msg.sender);

        emit ProjectCreated(projectId, msg.sender, projectToken, offering, treasury, governance);

        // Initialize deployed contracts with provided parameters
        _initializeProjectContracts(projectId, _projectName, _projectSymbol, _totalSupply, _offeringPrice);

        // Register the offering contract as an authorized project
        platformRegistry.registerProject(offering);
    }

    /**
     * @dev Get project details by ID
     * @param _projectId The project ID
     * @return deployment The project deployment details
     */
    function getProject(uint256 _projectId) external view returns (ProjectDeployment memory) {
        require(_projectId > 0 && _projectId < nextProjectId, "Invalid project ID");
        return projects[_projectId];
    }

    /**
     * @dev Get all projects created by a specific address
     * @param _creator The creator address
     * @return projectIds Array of project IDs created by the address
     */
    function getCreatorProjects(address _creator) external view returns (uint256[] memory) {
        return creatorProjects[_creator];
    }

    /**
     * @dev Initialize deployed project contracts
     * @param _projectId The project ID
     * @param _projectName Name of the project
     * @param _projectSymbol Symbol for the project token
     * @param _totalSupply Total supply of project tokens
     * @param _offeringPrice Price per token in the offering
     */
    function _initializeProjectContracts(
        uint256 _projectId,
        string calldata _projectName,
        string calldata _projectSymbol,
        uint256 _totalSupply,
        uint256 _offeringPrice
    ) internal {
        ProjectDeployment storage project = projects[_projectId];

        // Create project info struct
        IProjectToken.ProjectInfo memory projectInfo = IProjectToken.ProjectInfo({
            projectName: _projectName,
            projectDescription: string(abi.encodePacked("PPP Project: ", _projectName)),
            projectLocation: "Indonesia",
            projectValue: _totalSupply * _offeringPrice,
            concessionPeriod: 30 * 365 days, // 30 years default
            expectedAPY: 800, // 8% APY
            metadataURI: ""
        });

        // 1. Initialize ProjectToken with IdentityRegistry
        IProjectToken(project.projectToken).initialize(
            _projectName,
            _projectSymbol,
            _totalSupply,
            msg.sender, // SPV is the owner
            project.treasury,
            project.offering,
            address(identityRegistry),
            projectInfo
        );

        // 2. Initialize ProjectTreasury
        IProjectTreasury(project.treasury).initialize(
            project.projectToken,
            address(platformRegistry),
            address(platformTreasury),
            msg.sender // SPV is the owner
        );

        // 3. Initialize ProjectOffering
        uint256 startTime = block.timestamp + 7 days; // Start in 1 week
        uint256 endTime = startTime + 30 days; // Run for 30 days
        uint256 totalValue = (_totalSupply * _offeringPrice) / 10 ** 18; // Total project value in ETH
        uint256 softCap = totalValue / 10; // 10% of total value
        uint256 hardCap = totalValue; // 100% of total value

        IProjectOffering(project.offering).initialize(
            project.projectToken,
            address(platformRegistry),
            address(identityRegistry),
            project.treasury,
            msg.sender, // SPV is the owner
            _offeringPrice,
            _totalSupply,
            startTime,
            endTime,
            softCap,
            hardCap
        );

        // 4. Initialize ProjectGovernance
        IProjectGovernance(project.governance).initialize(
            project.projectToken,
            msg.sender, // SPV is the owner
            1 days, // Voting delay
            7 days, // Voting period
            (_totalSupply * 100) / 10000, // 1% of total supply needed to propose
            20 // 20% quorum
        );

        // Note: setGovernance and addAuthorizedMinter will be called by the SPV after initialization
        // The factory cannot call these directly due to ownership restrictions
    }

    /**
     * @dev Complete project setup (called by SPV after creation)
     * @param _projectId The project ID to finalize
     */
    function finalizeProjectSetup(uint256 _projectId) external nonReentrant {
        require(_projectId > 0 && _projectId < nextProjectId, "Invalid project ID");
        ProjectDeployment storage project = projects[_projectId];
        require(project.creator == msg.sender, "Only project creator can finalize");

        // Set governance contract in token
        IProjectToken(project.projectToken).setGovernance(project.governance);

        // Add offering contract as authorized minter
        IProjectToken(project.projectToken).addAuthorizedMinter(project.offering);
    }

    /**
     * @dev Update platform registry address
     * @param _newRegistry New registry address
     */
    function updatePlatformRegistry(address _newRegistry) external onlyRole(ADMIN_ROLE) {
        require(_newRegistry != address(0), "Invalid registry address");
        address oldRegistry = address(platformRegistry);
        platformRegistry = PlatformRegistry(_newRegistry);
        emit PlatformRegistryUpdated(oldRegistry, _newRegistry);
    }

    /**
     * @dev Update platform treasury address
     * @param _newTreasury New treasury address
     */
    function updatePlatformTreasury(address payable _newTreasury) external onlyRole(ADMIN_ROLE) {
        require(_newTreasury != address(0), "Invalid treasury address");
        address oldTreasury = address(platformTreasury);
        platformTreasury = PlatformTreasury(_newTreasury);
        emit PlatformTreasuryUpdated(oldTreasury, _newTreasury);
    }

    /**
     * @dev Update identity registry address
     * @param _newIdentityRegistry New identity registry address
     */
    function updateIdentityRegistry(address _newIdentityRegistry) external onlyRole(ADMIN_ROLE) {
        require(_newIdentityRegistry != address(0), "Invalid identity registry address");
        address oldRegistry = address(identityRegistry);
        identityRegistry = IdentityRegistry(_newIdentityRegistry);
        emit IdentityRegistryUpdated(oldRegistry, _newIdentityRegistry);
    }

    /**
     * @dev Get identity registry address
     * @return address The identity registry contract address
     */
    function getIdentityRegistry() external view returns (address) {
        return address(identityRegistry);
    }
}
