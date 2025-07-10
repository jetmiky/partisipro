// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IProjectGovernance
 * @dev Interface for ProjectGovernance contract
 */
interface IProjectGovernance {
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

    function initialize(
        address _projectToken,
        address _owner,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumNumerator
    ) external;

    function projectToken() external view returns (address);
    function proposalCount() external view returns (uint256);

    function propose(
        string calldata _title,
        string calldata _description,
        address[] calldata _targets,
        uint256[] calldata _values,
        bytes[] calldata _calldatas,
        string[] calldata _signatures
    ) external returns (uint256 proposalId);

    function castVote(uint256 _proposalId, VoteType _vote, string calldata _reason) external;

    function cancelProposal(uint256 _proposalId) external;
    function executeProposal(uint256 _proposalId) external;

    function updateGovernanceSettings(
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumNumerator
    ) external;

    function setGovernanceActive(bool _isActive) external;
    function pause() external;
    function unpause() external;

    function state(uint256 _proposalId) external view returns (ProposalState);
    function getProposal(uint256 _proposalId) external view returns (Proposal memory);
    function getVote(uint256 _proposalId, address _voter) external view returns (ProposalVote memory);
    function getActiveProposals() external view returns (uint256[] memory);
    function getGovernanceSettings() external view returns (GovernanceSettings memory);
    function getQuorum() external view returns (uint256);
}
