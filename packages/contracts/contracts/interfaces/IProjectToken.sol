// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IProjectToken
 * @dev Interface for ERC-3643 compliant ProjectToken contract
 */
interface IProjectToken is IERC20 {
    struct ProjectInfo {
        string projectName;
        string projectDescription;
        string projectLocation;
        uint256 projectValue;
        uint256 concessionPeriod;
        uint256 expectedAPY;
        string metadataURI;
    }

    event ProjectInfoUpdated(string name, string description, string location);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event TransfersEnabled();
    event TransfersDisabled();
    event AuthorizedMinterAdded(address indexed minter);
    event AuthorizedMinterRemoved(address indexed minter);
    event IdentityRegistryUpdated(address indexed oldRegistry, address indexed newRegistry);
    event ComplianceVerificationFailed(address indexed from, address indexed to, string reason);

    function initialize(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply,
        address _owner,
        address _treasury,
        address _offering,
        address _identityRegistry,
        ProjectInfo memory _projectInfo
    ) external;

    function treasury() external view returns (address);
    function offering() external view returns (address);
    function governance() external view returns (address);
    function identityRegistry() external view returns (address);
    function transfersEnabled() external view returns (bool);
    function authorizedMinters(address minter) external view returns (bool);

    function enableTransfers() external;
    function disableTransfers() external;
    function addAuthorizedMinter(address _minter) external;
    function removeAuthorizedMinter(address _minter) external;
    function mint(address _to, uint256 _amount) external;
    function burn(uint256 _amount) external;
    function setGovernance(address _governance) external;
    function setIdentityRegistry(address _identityRegistry) external;
    function updateProjectInfo(
        string calldata _name,
        string calldata _description,
        string calldata _location,
        uint256 _projectValue,
        uint256 _concessionPeriod,
        uint256 _expectedAPY,
        string calldata _metadataURI
    ) external;
    function updateTreasury(address _newTreasury) external;
    function getProjectInfo() external view returns (ProjectInfo memory);
    function pause() external;
    function unpause() external;

    // ERC-3643 Standard Functions
    function isVerified(address _address) external view returns (bool);
    function getIdentityRegistry() external view returns (address);
    function canTransfer(address from, address to, uint256 value) external view returns (bool);
    function batchIsVerified(address[] calldata _addresses) external view returns (bool[] memory);
}
