// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title ProjectToken
 * @dev ERC20 token representing fractional ownership of a PPP project
 * @notice This token represents shares in a specific infrastructure project
 */
contract ProjectToken is
    Initializable,
    ERC20Upgradeable,
    ERC20PausableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    struct ProjectInfo {
        string projectName;
        string projectDescription;
        string projectLocation;
        uint256 projectValue;
        uint256 concessionPeriod;
        uint256 expectedAPY;
        string metadataURI;
    }

    ProjectInfo public projectInfo;
    address public treasury;
    address public offering;
    address public governance;

    uint256 public constant MAX_SUPPLY = 1_000_000 * 10 ** 18; // 1M tokens max
    bool public transfersEnabled;

    mapping(address => bool) public authorizedMinters;
    mapping(address => uint256) public lastDividendClaim;

    event ProjectInfoUpdated(string name, string description, string location);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event TransfersEnabled();
    event TransfersDisabled();
    event AuthorizedMinterAdded(address indexed minter);
    event AuthorizedMinterRemoved(address indexed minter);

    modifier onlyAuthorized() {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply,
        address _owner,
        address _treasury,
        address _offering,
        ProjectInfo memory _projectInfo
    ) public initializer {
        require(_totalSupply <= MAX_SUPPLY, "Exceeds maximum supply");
        require(_owner != address(0), "Invalid owner");
        require(_treasury != address(0), "Invalid treasury");
        require(_offering != address(0), "Invalid offering");

        __ERC20_init(_name, _symbol);
        __ERC20Pausable_init();
        __Ownable_init(_owner);
        __UUPSUpgradeable_init();

        treasury = _treasury;
        offering = _offering;
        projectInfo = _projectInfo;
        transfersEnabled = false;

        // Mint initial supply to offering contract
        _mint(_offering, _totalSupply);

        // Authorize offering contract to mint
        authorizedMinters[_offering] = true;
        emit AuthorizedMinterAdded(_offering);
    }

    /**
     * @dev Enable token transfers (only owner)
     */
    function enableTransfers() external onlyOwner {
        transfersEnabled = true;
        emit TransfersEnabled();
    }

    /**
     * @dev Disable token transfers (only owner)
     */
    function disableTransfers() external onlyOwner {
        transfersEnabled = false;
        emit TransfersDisabled();
    }

    /**
     * @dev Add authorized minter (only owner)
     */
    function addAuthorizedMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "Invalid minter");
        authorizedMinters[_minter] = true;
        emit AuthorizedMinterAdded(_minter);
    }

    /**
     * @dev Remove authorized minter (only owner)
     */
    function removeAuthorizedMinter(address _minter) external onlyOwner {
        authorizedMinters[_minter] = false;
        emit AuthorizedMinterRemoved(_minter);
    }

    /**
     * @dev Mint tokens (only authorized)
     */
    function mint(address _to, uint256 _amount) external onlyAuthorized {
        require(totalSupply() + _amount <= MAX_SUPPLY, "Exceeds maximum supply");
        _mint(_to, _amount);
    }

    /**
     * @dev Burn tokens from sender
     */
    function burn(uint256 _amount) external {
        _burn(msg.sender, _amount);
    }

    /**
     * @dev Update project information (only owner)
     */
    function updateProjectInfo(
        string calldata _name,
        string calldata _description,
        string calldata _location,
        uint256 _projectValue,
        uint256 _concessionPeriod,
        uint256 _expectedAPY,
        string calldata _metadataURI
    ) external onlyOwner {
        projectInfo = ProjectInfo({
            projectName: _name,
            projectDescription: _description,
            projectLocation: _location,
            projectValue: _projectValue,
            concessionPeriod: _concessionPeriod,
            expectedAPY: _expectedAPY,
            metadataURI: _metadataURI
        });

        emit ProjectInfoUpdated(_name, _description, _location);
    }

    /**
     * @dev Update treasury address (only owner)
     */
    function updateTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid treasury");
        address oldTreasury = treasury;
        treasury = _newTreasury;
        emit TreasuryUpdated(oldTreasury, _newTreasury);
    }

    /**
     * @dev Set governance contract (only owner)
     */
    function setGovernance(address _governance) external onlyOwner {
        require(_governance != address(0), "Invalid governance");
        governance = _governance;
    }

    /**
     * @dev Override transfer function to check if transfers are enabled
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20Upgradeable, ERC20PausableUpgradeable) {
        // Allow minting (from == address(0)) and burning (to == address(0))
        if (from != address(0) && to != address(0)) {
            require(transfersEnabled, "Transfers disabled");
        }

        super._update(from, to, value);
    }

    /**
     * @dev Pause contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Required by UUPS pattern
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev Get project information
     */
    function getProjectInfo() external view returns (ProjectInfo memory) {
        return projectInfo;
    }
}
