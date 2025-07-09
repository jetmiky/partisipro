// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./ProjectToken.sol";

/**
 * @title ProjectGovernance
 * @dev Token-weighted governance contract for PPP projects
 * @notice Enables token holders to create proposals and vote on project decisions
 */
contract ProjectGovernance is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    enum ProposalState {
        Pending,
        Active,
        Canceled,
        Defeated,
        Succeeded,
        Queued,
        Expired,
        Executed
    }

    enum VoteType {
        Against,
        For,
        Abstain
    }

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        bytes32 descriptionHash;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 quorumVotes;
        bool canceled;
        bool executed;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        string[] signatures;
    }

    struct ProposalVote {
        bool hasVoted;
        VoteType vote;
        uint256 weight;
    }

    struct GovernanceSettings {
        uint256 votingDelay;
        uint256 votingPeriod;
        uint256 proposalThreshold;
        uint256 quorumNumerator;
        uint256 quorumDenominator;
        uint256 executionDelay;
        bool isActive;
    }

    ProjectToken public projectToken;
    GovernanceSettings public governanceSettings;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => ProposalVote)) public proposalVotes;
    mapping(uint256 => uint256) public proposalSnapshots;

    uint256 public proposalCount;
    uint256[] public activeProposals;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        string description,
        uint256 startTime,
        uint256 endTime
    );

    event VoteCast(address indexed voter, uint256 indexed proposalId, VoteType vote, uint256 weight, string reason);

    event ProposalCanceled(uint256 indexed proposalId);
    event ProposalExecuted(uint256 indexed proposalId);
    event GovernanceSettingsUpdated();

    modifier onlyTokenHolder() {
        require(projectToken.balanceOf(msg.sender) > 0, "Not a token holder");
        _;
    }

    modifier validProposal(uint256 _proposalId) {
        require(_proposalId > 0 && _proposalId <= proposalCount, "Invalid proposal ID");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _projectToken,
        address _owner,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumNumerator
    ) public initializer {
        require(_projectToken != address(0), "Invalid token address");
        require(_owner != address(0), "Invalid owner address");
        require(_votingDelay > 0, "Invalid voting delay");
        require(_votingPeriod > 0, "Invalid voting period");
        require(_proposalThreshold > 0, "Invalid proposal threshold");
        require(_quorumNumerator > 0 && _quorumNumerator <= 100, "Invalid quorum numerator");

        __Ownable_init(_owner);
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        projectToken = ProjectToken(_projectToken);

        governanceSettings = GovernanceSettings({
            votingDelay: _votingDelay,
            votingPeriod: _votingPeriod,
            proposalThreshold: _proposalThreshold,
            quorumNumerator: _quorumNumerator,
            quorumDenominator: 100,
            executionDelay: 2 days,
            isActive: true
        });

        proposalCount = 0;
    }

    /**
     * @dev Create a new proposal
     * @param _title Title of the proposal
     * @param _description Description of the proposal
     * @param _targets Target addresses for execution
     * @param _values ETH values for each target
     * @param _calldatas Calldata for each target
     * @param _signatures Function signatures for each target
     * @return proposalId The ID of the created proposal
     */
    function propose(
        string calldata _title,
        string calldata _description,
        address[] calldata _targets,
        uint256[] calldata _values,
        bytes[] calldata _calldatas,
        string[] calldata _signatures
    ) external onlyTokenHolder nonReentrant whenNotPaused returns (uint256 proposalId) {
        require(governanceSettings.isActive, "Governance not active");
        require(bytes(_title).length > 0, "Empty title");
        require(bytes(_description).length > 0, "Empty description");
        require(_targets.length > 0, "No targets");
        require(
            _targets.length == _values.length &&
                _targets.length == _calldatas.length &&
                _targets.length == _signatures.length,
            "Proposal function information arity mismatch"
        );

        uint256 proposerBalance = projectToken.balanceOf(msg.sender);
        require(proposerBalance >= governanceSettings.proposalThreshold, "Insufficient tokens to propose");

        proposalId = ++proposalCount;

        uint256 startTime = block.timestamp + governanceSettings.votingDelay;
        uint256 endTime = startTime + governanceSettings.votingPeriod;

        bytes32 descriptionHash = keccak256(bytes(_description));

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            title: _title,
            description: _description,
            descriptionHash: descriptionHash,
            startTime: startTime,
            endTime: endTime,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            quorumVotes: _getQuorum(),
            canceled: false,
            executed: false,
            targets: _targets,
            values: _values,
            calldatas: _calldatas,
            signatures: _signatures
        });

        // Store token supply snapshot for voting weight calculation
        proposalSnapshots[proposalId] = projectToken.totalSupply();

        activeProposals.push(proposalId);

        emit ProposalCreated(proposalId, msg.sender, _title, _description, startTime, endTime);
    }

    /**
     * @dev Cast a vote on a proposal
     * @param _proposalId ID of the proposal
     * @param _vote Vote type (Against, For, Abstain)
     * @param _reason Reason for the vote
     */
    function castVote(
        uint256 _proposalId,
        VoteType _vote,
        string calldata _reason
    ) external validProposal(_proposalId) onlyTokenHolder nonReentrant whenNotPaused {
        require(state(_proposalId) == ProposalState.Active, "Proposal not active");
        require(!proposalVotes[_proposalId][msg.sender].hasVoted, "Already voted");

        uint256 weight = projectToken.balanceOf(msg.sender);
        require(weight > 0, "No voting power");

        proposalVotes[_proposalId][msg.sender] = ProposalVote({ hasVoted: true, vote: _vote, weight: weight });

        if (_vote == VoteType.Against) {
            proposals[_proposalId].againstVotes += weight;
        } else if (_vote == VoteType.For) {
            proposals[_proposalId].forVotes += weight;
        } else {
            proposals[_proposalId].abstainVotes += weight;
        }

        emit VoteCast(msg.sender, _proposalId, _vote, weight, _reason);
    }

    /**
     * @dev Cancel a proposal (only proposer or owner)
     * @param _proposalId ID of the proposal to cancel
     */
    function cancelProposal(uint256 _proposalId) external validProposal(_proposalId) nonReentrant {
        require(msg.sender == proposals[_proposalId].proposer || msg.sender == owner(), "Not authorized to cancel");
        require(
            state(_proposalId) == ProposalState.Pending || state(_proposalId) == ProposalState.Active,
            "Cannot cancel proposal"
        );

        proposals[_proposalId].canceled = true;

        _removeFromActiveProposals(_proposalId);

        emit ProposalCanceled(_proposalId);
    }

    /**
     * @dev Execute a successful proposal
     * @param _proposalId ID of the proposal to execute
     */
    function executeProposal(uint256 _proposalId) external validProposal(_proposalId) nonReentrant whenNotPaused {
        require(state(_proposalId) == ProposalState.Succeeded, "Proposal not succeeded");
        require(!proposals[_proposalId].executed, "Already executed");

        proposals[_proposalId].executed = true;

        Proposal storage proposal = proposals[_proposalId];

        for (uint256 i = 0; i < proposal.targets.length; i++) {
            bytes memory callData;

            if (bytes(proposal.signatures[i]).length > 0) {
                callData = abi.encodePacked(bytes4(keccak256(bytes(proposal.signatures[i]))), proposal.calldatas[i]);
            } else {
                callData = proposal.calldatas[i];
            }

            (bool success, ) = proposal.targets[i].call{ value: proposal.values[i] }(callData);
            require(success, "Transaction execution reverted");
        }

        _removeFromActiveProposals(_proposalId);

        emit ProposalExecuted(_proposalId);
    }

    /**
     * @dev Update governance settings (only owner)
     * @param _votingDelay New voting delay
     * @param _votingPeriod New voting period
     * @param _proposalThreshold New proposal threshold
     * @param _quorumNumerator New quorum numerator
     */
    function updateGovernanceSettings(
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumNumerator
    ) external onlyOwner {
        require(_votingDelay > 0, "Invalid voting delay");
        require(_votingPeriod > 0, "Invalid voting period");
        require(_proposalThreshold > 0, "Invalid proposal threshold");
        require(_quorumNumerator > 0 && _quorumNumerator <= 100, "Invalid quorum numerator");

        governanceSettings.votingDelay = _votingDelay;
        governanceSettings.votingPeriod = _votingPeriod;
        governanceSettings.proposalThreshold = _proposalThreshold;
        governanceSettings.quorumNumerator = _quorumNumerator;

        emit GovernanceSettingsUpdated();
    }

    /**
     * @dev Set governance active status (only owner)
     * @param _isActive New active status
     */
    function setGovernanceActive(bool _isActive) external onlyOwner {
        governanceSettings.isActive = _isActive;
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
     * @dev Get the state of a proposal
     * @param _proposalId ID of the proposal
     * @return ProposalState Current state of the proposal
     */
    function state(uint256 _proposalId) public view validProposal(_proposalId) returns (ProposalState) {
        Proposal storage proposal = proposals[_proposalId];

        if (proposal.canceled) {
            return ProposalState.Canceled;
        }

        if (proposal.executed) {
            return ProposalState.Executed;
        }

        if (block.timestamp < proposal.startTime) {
            return ProposalState.Pending;
        }

        if (block.timestamp <= proposal.endTime) {
            return ProposalState.Active;
        }

        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;

        if (totalVotes < proposal.quorumVotes) {
            return ProposalState.Defeated;
        }

        if (proposal.forVotes <= proposal.againstVotes) {
            return ProposalState.Defeated;
        }

        return ProposalState.Succeeded;
    }

    /**
     * @dev Get proposal details
     * @param _proposalId ID of the proposal
     * @return proposal Proposal details
     */
    function getProposal(uint256 _proposalId) external view validProposal(_proposalId) returns (Proposal memory) {
        return proposals[_proposalId];
    }

    /**
     * @dev Get vote details for a proposal and voter
     * @param _proposalId ID of the proposal
     * @param _voter Address of the voter
     * @return vote Vote details
     */
    function getVote(
        uint256 _proposalId,
        address _voter
    ) external view validProposal(_proposalId) returns (ProposalVote memory) {
        return proposalVotes[_proposalId][_voter];
    }

    /**
     * @dev Get all active proposal IDs
     * @return uint256[] Array of active proposal IDs
     */
    function getActiveProposals() external view returns (uint256[] memory) {
        return activeProposals;
    }

    /**
     * @dev Get governance settings
     * @return GovernanceSettings Current governance settings
     */
    function getGovernanceSettings() external view returns (GovernanceSettings memory) {
        return governanceSettings;
    }

    /**
     * @dev Get quorum threshold
     * @return uint256 Quorum threshold
     */
    function getQuorum() external view returns (uint256) {
        return _getQuorum();
    }

    /**
     * @dev Internal function to calculate quorum
     * @return uint256 Quorum threshold
     */
    function _getQuorum() internal view returns (uint256) {
        return (projectToken.totalSupply() * governanceSettings.quorumNumerator) / governanceSettings.quorumDenominator;
    }

    /**
     * @dev Internal function to remove proposal from active list
     * @param _proposalId ID of the proposal to remove
     */
    function _removeFromActiveProposals(uint256 _proposalId) internal {
        for (uint256 i = 0; i < activeProposals.length; i++) {
            if (activeProposals[i] == _proposalId) {
                activeProposals[i] = activeProposals[activeProposals.length - 1];
                activeProposals.pop();
                break;
            }
        }
    }

    /**
     * @dev Required by UUPS pattern
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
