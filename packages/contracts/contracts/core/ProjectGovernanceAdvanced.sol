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

/**
 * @title ProjectGovernanceAdvanced
 * @dev Advanced governance contract with proposal templates and voting incentives
 * @notice Enhanced governance system with participation rewards and streamlined proposal creation
 */
contract ProjectGovernanceAdvanced is
    Initializable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable,
    PausableUpgradeable
{
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    enum ProposalType {
        PARAMETER_CHANGE,
        TREASURY_WITHDRAWAL,
        CONTRACT_UPGRADE,
        EMERGENCY_ACTION,
        CUSTOM
    }

    enum ProposalStatus {
        PENDING,
        ACTIVE,
        SUCCEEDED,
        DEFEATED,
        EXECUTED,
        CANCELED
    }

    struct ProposalTemplate {
        string name;
        string description;
        ProposalType proposalType;
        uint256 minVotingPower;
        uint256 votingPeriod;
        uint256 quorumPercentage;
        uint256 approvalThreshold;
        bool isActive;
        bytes callData;
        address targetContract;
    }

    struct Proposal {
        uint256 id;
        string title;
        string description;
        ProposalType proposalType;
        address proposer;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 quorumRequired;
        uint256 approvalThreshold;
        ProposalStatus status;
        mapping(address => bool) hasVoted;
        mapping(address => uint256) voteWeights;
        bytes callData;
        address targetContract;
        bool executed;
        uint256 totalVotingPower;
    }

    struct VotingIncentive {
        uint256 baseReward;
        uint256 participationBonus;
        uint256 earlyVotingBonus;
        uint256 consecutiveVotingBonus;
        uint256 maxRewardPerProposal;
        bool isActive;
    }

    struct VoterStats {
        uint256 totalVotes;
        uint256 consecutiveVotes;
        uint256 lastVotedProposal;
        uint256 totalRewardsEarned;
        uint256 votingPowerUsed;
    }

    struct VotingConfig {
        uint256 minProposalThreshold;
        uint256 defaultVotingPeriod;
        uint256 defaultQuorumPercentage;
        uint256 defaultApprovalThreshold;
        uint256 proposalDelay;
        uint256 executionDelay;
        bool delegationEnabled;
    }

    struct DelegationInfo {
        address delegatee;
        uint256 delegatedPower;
        uint256 delegatedAt;
        bool isActive;
    }

    IProjectToken public projectToken;
    IERC20 public rewardToken;

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => ProposalTemplate) public proposalTemplates;
    mapping(address => VoterStats) public voterStats;
    mapping(address => DelegationInfo) public delegations;
    mapping(address => uint256) public delegatedVotingPower;

    uint256 public templateCount;
    VotingConfig public votingConfig;
    VotingIncentive public votingIncentive;

    // Participation tracking
    mapping(uint256 => uint256) public proposalParticipation;
    mapping(uint256 => address[]) public proposalVoters;
    mapping(address => uint256[]) public userProposalVotes;

    // Rewards pool
    uint256 public rewardPool;
    uint256 public totalRewardsDistributed;

    // Analytics
    uint256 public totalVotingPowerUsed;
    uint256 public averageParticipationRate;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        ProposalType proposalType,
        uint256 startTime,
        uint256 endTime
    );
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint256 votingPower,
        uint8 support,
        uint256 reward
    );
    event ProposalExecuted(uint256 indexed proposalId, bool success);
    event ProposalCanceled(uint256 indexed proposalId);
    event TemplateCreated(uint256 indexed templateId, string name, ProposalType proposalType);
    event TemplateUpdated(uint256 indexed templateId, string name, bool isActive);
    event VotingIncentiveUpdated(uint256 baseReward, uint256 participationBonus, uint256 earlyVotingBonus);
    event DelegationSet(address indexed delegator, address indexed delegatee, uint256 votingPower);
    event DelegationRemoved(address indexed delegator, address indexed delegatee);
    event RewardsClaimed(address indexed voter, uint256 amount);
    event RewardPoolFunded(uint256 amount);

    modifier onlyTokenHolder() {
        require(projectToken.balanceOf(msg.sender) > 0, "Must hold project tokens");
        _;
    }

    modifier validProposal(uint256 _proposalId) {
        require(_proposalId > 0 && _proposalId <= proposalCount, "Invalid proposal ID");
        require(proposals[_proposalId].id != 0, "Proposal does not exist");
        _;
    }

    modifier canVote(uint256 _proposalId) {
        require(block.timestamp >= proposals[_proposalId].startTime, "Voting not started");
        require(block.timestamp <= proposals[_proposalId].endTime, "Voting ended");
        require(!proposals[_proposalId].hasVoted[msg.sender], "Already voted");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _admin,
        address _projectToken,
        address _rewardToken,
        uint256 _minProposalThreshold,
        uint256 _defaultVotingPeriod,
        uint256 _defaultQuorumPercentage,
        uint256 _defaultApprovalThreshold
    ) public initializer {
        require(_admin != address(0), "Invalid admin address");
        require(_projectToken != address(0), "Invalid project token address");
        require(_rewardToken != address(0), "Invalid reward token address");
        require(_minProposalThreshold > 0, "Invalid proposal threshold");
        require(_defaultVotingPeriod > 0, "Invalid voting period");
        require(_defaultQuorumPercentage > 0 && _defaultQuorumPercentage <= 100, "Invalid quorum percentage");
        require(_defaultApprovalThreshold > 0 && _defaultApprovalThreshold <= 100, "Invalid approval threshold");

        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(UPGRADER_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);

        projectToken = IProjectToken(_projectToken);
        rewardToken = IERC20(_rewardToken);

        votingConfig = VotingConfig({
            minProposalThreshold: _minProposalThreshold,
            defaultVotingPeriod: _defaultVotingPeriod,
            defaultQuorumPercentage: _defaultQuorumPercentage,
            defaultApprovalThreshold: _defaultApprovalThreshold,
            proposalDelay: 1 days,
            executionDelay: 2 days,
            delegationEnabled: true
        });

        votingIncentive = VotingIncentive({
            baseReward: 1e18, // 1 token
            participationBonus: 5e17, // 0.5 token
            earlyVotingBonus: 2e17, // 0.2 token
            consecutiveVotingBonus: 1e17, // 0.1 token
            maxRewardPerProposal: 2e18, // 2 tokens
            isActive: true
        });

        _createDefaultTemplates();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    /**
     * @dev Create default proposal templates
     */
    function _createDefaultTemplates() internal {
        // Parameter Change Template
        _createTemplate(
            "Parameter Change",
            "Change platform parameters such as fees, limits, or thresholds",
            ProposalType.PARAMETER_CHANGE,
            votingConfig.minProposalThreshold,
            votingConfig.defaultVotingPeriod,
            votingConfig.defaultQuorumPercentage,
            votingConfig.defaultApprovalThreshold,
            "",
            address(0)
        );

        // Treasury Withdrawal Template
        _createTemplate(
            "Treasury Withdrawal",
            "Withdraw funds from project treasury for specified purposes",
            ProposalType.TREASURY_WITHDRAWAL,
            votingConfig.minProposalThreshold * 2,
            votingConfig.defaultVotingPeriod * 2,
            votingConfig.defaultQuorumPercentage + 10,
            votingConfig.defaultApprovalThreshold + 10,
            "",
            address(0)
        );

        // Contract Upgrade Template
        _createTemplate(
            "Contract Upgrade",
            "Upgrade project smart contracts to new implementations",
            ProposalType.CONTRACT_UPGRADE,
            votingConfig.minProposalThreshold * 3,
            votingConfig.defaultVotingPeriod * 3,
            votingConfig.defaultQuorumPercentage + 20,
            votingConfig.defaultApprovalThreshold + 15,
            "",
            address(0)
        );

        // Emergency Action Template
        _createTemplate(
            "Emergency Action",
            "Execute emergency actions for platform security or operations",
            ProposalType.EMERGENCY_ACTION,
            votingConfig.minProposalThreshold / 2,
            votingConfig.defaultVotingPeriod / 2,
            votingConfig.defaultQuorumPercentage - 5,
            votingConfig.defaultApprovalThreshold + 20,
            "",
            address(0)
        );
    }

    /**
     * @dev Create a new proposal template
     * @param _name Template name
     * @param _description Template description
     * @param _proposalType Type of proposal
     * @param _minVotingPower Minimum voting power required
     * @param _votingPeriod Voting period in seconds
     * @param _quorumPercentage Quorum percentage required
     * @param _approvalThreshold Approval threshold percentage
     * @param _callData Default call data
     * @param _targetContract Default target contract
     */
    function _createTemplate(
        string memory _name,
        string memory _description,
        ProposalType _proposalType,
        uint256 _minVotingPower,
        uint256 _votingPeriod,
        uint256 _quorumPercentage,
        uint256 _approvalThreshold,
        string memory _callData,
        address _targetContract
    ) internal {
        templateCount++;

        ProposalTemplate storage template = proposalTemplates[templateCount];
        template.name = _name;
        template.description = _description;
        template.proposalType = _proposalType;
        template.minVotingPower = _minVotingPower;
        template.votingPeriod = _votingPeriod;
        template.quorumPercentage = _quorumPercentage;
        template.approvalThreshold = _approvalThreshold;
        template.isActive = true;
        template.callData = bytes(_callData);
        template.targetContract = _targetContract;

        emit TemplateCreated(templateCount, _name, _proposalType);
    }

    /**
     * @dev Create a new proposal using a template
     * @param _templateId Template ID to use
     * @param _title Proposal title
     * @param _description Proposal description
     * @param _callData Call data for execution
     * @param _targetContract Target contract for execution
     * @return proposalId New proposal ID
     */
    function createProposalFromTemplate(
        uint256 _templateId,
        string memory _title,
        string memory _description,
        bytes memory _callData,
        address _targetContract
    ) external onlyTokenHolder whenNotPaused returns (uint256 proposalId) {
        require(_templateId > 0 && _templateId <= templateCount, "Invalid template ID");
        require(proposalTemplates[_templateId].isActive, "Template is not active");

        ProposalTemplate storage template = proposalTemplates[_templateId];

        // Check if proposer has enough voting power
        uint256 proposerVotingPower = _getVotingPower(msg.sender);
        require(proposerVotingPower >= template.minVotingPower, "Insufficient voting power");

        return
            _createProposal(
                _title,
                _description,
                template.proposalType,
                template.votingPeriod,
                template.quorumPercentage,
                template.approvalThreshold,
                _callData,
                _targetContract
            );
    }

    /**
     * @dev Create a custom proposal
     * @param _title Proposal title
     * @param _description Proposal description
     * @param _votingPeriod Voting period in seconds
     * @param _quorumPercentage Quorum percentage required
     * @param _approvalThreshold Approval threshold percentage
     * @param _callData Call data for execution
     * @param _targetContract Target contract for execution
     * @return proposalId New proposal ID
     */
    function createCustomProposal(
        string memory _title,
        string memory _description,
        uint256 _votingPeriod,
        uint256 _quorumPercentage,
        uint256 _approvalThreshold,
        bytes memory _callData,
        address _targetContract
    ) external onlyTokenHolder whenNotPaused returns (uint256 proposalId) {
        require(_votingPeriod >= 1 days && _votingPeriod <= 30 days, "Invalid voting period");
        require(_quorumPercentage > 0 && _quorumPercentage <= 100, "Invalid quorum percentage");
        require(_approvalThreshold > 0 && _approvalThreshold <= 100, "Invalid approval threshold");

        uint256 proposerVotingPower = _getVotingPower(msg.sender);
        require(proposerVotingPower >= votingConfig.minProposalThreshold, "Insufficient voting power");

        return
            _createProposal(
                _title,
                _description,
                ProposalType.CUSTOM,
                _votingPeriod,
                _quorumPercentage,
                _approvalThreshold,
                _callData,
                _targetContract
            );
    }

    /**
     * @dev Internal function to create a proposal
     */
    function _createProposal(
        string memory _title,
        string memory _description,
        ProposalType _proposalType,
        uint256 _votingPeriod,
        uint256 _quorumPercentage,
        uint256 _approvalThreshold,
        bytes memory _callData,
        address _targetContract
    ) internal returns (uint256 proposalId) {
        proposalCount++;
        proposalId = proposalCount;

        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.title = _title;
        proposal.description = _description;
        proposal.proposalType = _proposalType;
        proposal.proposer = msg.sender;
        proposal.startTime = block.timestamp + votingConfig.proposalDelay;
        proposal.endTime = proposal.startTime + _votingPeriod;
        proposal.quorumRequired = (projectToken.totalSupply() * _quorumPercentage) / 100;
        proposal.approvalThreshold = _approvalThreshold;
        proposal.status = ProposalStatus.PENDING;
        proposal.callData = _callData;
        proposal.targetContract = _targetContract;
        proposal.executed = false;
        proposal.totalVotingPower = projectToken.totalSupply();

        emit ProposalCreated(proposalId, msg.sender, _title, _proposalType, proposal.startTime, proposal.endTime);
    }

    /**
     * @dev Cast a vote on a proposal
     * @param _proposalId Proposal ID
     * @param _support Vote support (0 = Against, 1 = For, 2 = Abstain)
     */
    function castVote(
        uint256 _proposalId,
        uint8 _support
    ) external validProposal(_proposalId) canVote(_proposalId) whenNotPaused nonReentrant {
        require(_support <= 2, "Invalid support value");

        Proposal storage proposal = proposals[_proposalId];
        uint256 votingPower = _getVotingPower(msg.sender);
        require(votingPower > 0, "No voting power");

        // Record vote
        proposal.hasVoted[msg.sender] = true;
        proposal.voteWeights[msg.sender] = votingPower;

        // Update vote counts
        if (_support == 0) {
            proposal.againstVotes += votingPower;
        } else if (_support == 1) {
            proposal.forVotes += votingPower;
        } else {
            proposal.abstainVotes += votingPower;
        }

        // Track participation
        proposalVoters[_proposalId].push(msg.sender);
        userProposalVotes[msg.sender].push(_proposalId);
        proposalParticipation[_proposalId] += votingPower;

        // Update voter stats
        VoterStats storage stats = voterStats[msg.sender];
        stats.totalVotes++;
        stats.votingPowerUsed += votingPower;

        // Check for consecutive voting
        if (stats.lastVotedProposal == _proposalId - 1) {
            stats.consecutiveVotes++;
        } else {
            stats.consecutiveVotes = 1;
        }
        stats.lastVotedProposal = _proposalId;

        // Calculate and distribute rewards
        uint256 reward = 0;
        if (votingIncentive.isActive && rewardPool > 0) {
            reward = _calculateVotingReward(_proposalId, msg.sender, stats);
            if (reward > 0) {
                _distributeReward(msg.sender, reward);
                stats.totalRewardsEarned += reward;
            }
        }

        // Update global stats
        totalVotingPowerUsed += votingPower;

        emit VoteCast(_proposalId, msg.sender, votingPower, _support, reward);
    }

    /**
     * @dev Calculate voting reward for a voter
     * @param _proposalId Proposal ID
     * @param _stats Voter stats
     * @return reward Calculated reward amount
     */
    function _calculateVotingReward(
        uint256 _proposalId,
        address /* _voter */,
        VoterStats storage _stats
    ) internal view returns (uint256 reward) {
        Proposal storage proposal = proposals[_proposalId];

        // Base reward
        reward = votingIncentive.baseReward;

        // Early voting bonus (within first 25% of voting period)
        uint256 earlyVotingThreshold = proposal.startTime + (proposal.endTime - proposal.startTime) / 4;
        if (block.timestamp <= earlyVotingThreshold) {
            reward += votingIncentive.earlyVotingBonus;
        }

        // Consecutive voting bonus
        if (_stats.consecutiveVotes >= 3) {
            reward += votingIncentive.consecutiveVotingBonus;
        }

        // Participation bonus (if proposal has low participation)
        uint256 currentParticipation = (proposalParticipation[_proposalId] * 100) / proposal.totalVotingPower;
        if (currentParticipation < 20) {
            // Less than 20% participation
            reward += votingIncentive.participationBonus;
        }

        // Cap reward at maximum
        if (reward > votingIncentive.maxRewardPerProposal) {
            reward = votingIncentive.maxRewardPerProposal;
        }

        // Ensure reward doesn't exceed available pool
        if (reward > rewardPool) {
            reward = rewardPool;
        }
    }

    /**
     * @dev Distribute reward to voter
     * @param _voter Voter address
     * @param _reward Reward amount
     */
    function _distributeReward(address _voter, uint256 _reward) internal {
        if (_reward > 0 && rewardPool >= _reward) {
            rewardPool -= _reward;
            totalRewardsDistributed += _reward;
            rewardToken.safeTransfer(_voter, _reward);
        }
    }

    /**
     * @dev Execute a proposal
     * @param _proposalId Proposal ID
     */
    function executeProposal(uint256 _proposalId) external validProposal(_proposalId) whenNotPaused nonReentrant {
        Proposal storage proposal = proposals[_proposalId];

        require(block.timestamp > proposal.endTime, "Voting still active");
        require(
            proposal.status == ProposalStatus.PENDING || proposal.status == ProposalStatus.ACTIVE,
            "Proposal not executable"
        );
        require(!proposal.executed, "Already executed");

        // Check if proposal passed
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        bool quorumMet = totalVotes >= proposal.quorumRequired;
        bool approvalMet = proposal.forVotes >= (totalVotes * proposal.approvalThreshold) / 100;

        if (quorumMet && approvalMet) {
            proposal.status = ProposalStatus.SUCCEEDED;

            // Execute if there's call data
            if (proposal.callData.length > 0 && proposal.targetContract != address(0)) {
                // Wait for execution delay
                require(block.timestamp >= proposal.endTime + votingConfig.executionDelay, "Execution delay not met");

                proposal.executed = true;
                (bool success, ) = proposal.targetContract.call(proposal.callData);

                emit ProposalExecuted(_proposalId, success);
            }
        } else {
            proposal.status = ProposalStatus.DEFEATED;
        }
    }

    /**
     * @dev Delegate voting power to another address
     * @param _delegatee Address to delegate to
     */
    function delegate(address _delegatee) external onlyTokenHolder whenNotPaused {
        require(_delegatee != address(0), "Cannot delegate to zero address");
        require(_delegatee != msg.sender, "Cannot delegate to self");
        require(votingConfig.delegationEnabled, "Delegation not enabled");

        uint256 votingPower = projectToken.balanceOf(msg.sender);
        require(votingPower > 0, "No voting power to delegate");

        // Remove existing delegation
        _removeDelegation(msg.sender);

        // Set new delegation
        delegations[msg.sender] = DelegationInfo({
            delegatee: _delegatee,
            delegatedPower: votingPower,
            delegatedAt: block.timestamp,
            isActive: true
        });

        delegatedVotingPower[_delegatee] += votingPower;

        emit DelegationSet(msg.sender, _delegatee, votingPower);
    }

    /**
     * @dev Remove delegation
     */
    function removeDelegation() external {
        _removeDelegation(msg.sender);
    }

    /**
     * @dev Internal function to remove delegation
     * @param _delegator Address of delegator
     */
    function _removeDelegation(address _delegator) internal {
        DelegationInfo storage delegation = delegations[_delegator];

        if (delegation.isActive) {
            address delegatee = delegation.delegatee;
            uint256 delegatedPower = delegation.delegatedPower;

            delegatedVotingPower[delegatee] -= delegatedPower;

            delegation.isActive = false;
            delegation.delegatee = address(0);
            delegation.delegatedPower = 0;

            emit DelegationRemoved(_delegator, delegatee);
        }
    }

    /**
     * @dev Get voting power for an address
     * @param _account Address to check
     * @return votingPower Total voting power
     */
    function _getVotingPower(address _account) internal view returns (uint256 votingPower) {
        // Own tokens
        votingPower = projectToken.balanceOf(_account);

        // Add delegated power
        votingPower += delegatedVotingPower[_account];

        return votingPower;
    }

    /**
     * @dev Fund the rewards pool
     * @param _amount Amount to fund
     */
    function fundRewardPool(uint256 _amount) external onlyRole(ADMIN_ROLE) {
        require(_amount > 0, "Invalid amount");

        rewardToken.safeTransferFrom(msg.sender, address(this), _amount);
        rewardPool += _amount;

        emit RewardPoolFunded(_amount);
    }

    /**
     * @dev Update voting incentive configuration
     * @param _baseReward Base reward amount
     * @param _participationBonus Participation bonus amount
     * @param _earlyVotingBonus Early voting bonus amount
     * @param _consecutiveVotingBonus Consecutive voting bonus amount
     * @param _maxRewardPerProposal Maximum reward per proposal
     * @param _isActive Whether incentives are active
     */
    function updateVotingIncentive(
        uint256 _baseReward,
        uint256 _participationBonus,
        uint256 _earlyVotingBonus,
        uint256 _consecutiveVotingBonus,
        uint256 _maxRewardPerProposal,
        bool _isActive
    ) external onlyRole(ADMIN_ROLE) {
        votingIncentive = VotingIncentive({
            baseReward: _baseReward,
            participationBonus: _participationBonus,
            earlyVotingBonus: _earlyVotingBonus,
            consecutiveVotingBonus: _consecutiveVotingBonus,
            maxRewardPerProposal: _maxRewardPerProposal,
            isActive: _isActive
        });

        emit VotingIncentiveUpdated(_baseReward, _participationBonus, _earlyVotingBonus);
    }

    /**
     * @dev Get proposal information
     * @param _proposalId Proposal ID
     * @return id Proposal ID
     * @return title Proposal title
     * @return description Proposal description
     * @return proposalType Proposal type
     * @return proposer Proposer address
     * @return startTime Voting start time
     * @return endTime Voting end time
     * @return forVotes Votes in favor
     * @return againstVotes Votes against
     * @return abstainVotes Abstain votes
     * @return status Proposal status
     * @return executed Whether proposal was executed
     */
    function getProposal(
        uint256 _proposalId
    )
        external
        view
        validProposal(_proposalId)
        returns (
            uint256 id,
            string memory title,
            string memory description,
            ProposalType proposalType,
            address proposer,
            uint256 startTime,
            uint256 endTime,
            uint256 forVotes,
            uint256 againstVotes,
            uint256 abstainVotes,
            ProposalStatus status,
            bool executed
        )
    {
        Proposal storage proposal = proposals[_proposalId];
        return (
            proposal.id,
            proposal.title,
            proposal.description,
            proposal.proposalType,
            proposal.proposer,
            proposal.startTime,
            proposal.endTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            proposal.status,
            proposal.executed
        );
    }

    /**
     * @dev Get voting power for an address
     * @param _account Address to check
     * @return votingPower Total voting power
     */
    function getVotingPower(address _account) external view returns (uint256 votingPower) {
        return _getVotingPower(_account);
    }

    /**
     * @dev Get voter statistics
     * @param _voter Voter address
     * @return stats Voter statistics
     */
    function getVoterStats(address _voter) external view returns (VoterStats memory stats) {
        return voterStats[_voter];
    }

    /**
     * @dev Get proposal template
     * @param _templateId Template ID
     * @return template Proposal template
     */
    function getProposalTemplate(uint256 _templateId) external view returns (ProposalTemplate memory template) {
        require(_templateId > 0 && _templateId <= templateCount, "Invalid template ID");
        return proposalTemplates[_templateId];
    }

    /**
     * @dev Get all active proposal templates
     * @return activeTemplates Array of active template IDs
     */
    function getActiveTemplates() external view returns (uint256[] memory activeTemplates) {
        uint256 activeCount = 0;

        // Count active templates
        for (uint256 i = 1; i <= templateCount; i++) {
            if (proposalTemplates[i].isActive) {
                activeCount++;
            }
        }

        // Create array of active templates
        activeTemplates = new uint256[](activeCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= templateCount; i++) {
            if (proposalTemplates[i].isActive) {
                activeTemplates[index] = i;
                index++;
            }
        }
    }

    /**
     * @dev Get governance analytics
     * @return totalProposals Total number of proposals
     * @return totalVoters Total number of unique voters
     * @return avgParticipation Average participation rate
     * @return totalRewards Total rewards distributed
     */
    function getGovernanceAnalytics()
        external
        view
        returns (uint256 totalProposals, uint256 totalVoters, uint256 avgParticipation, uint256 totalRewards)
    {
        totalProposals = proposalCount;
        totalRewards = totalRewardsDistributed;

        // Calculate unique voters (simplified)
        uint256 voterCount = 0;
        // This is a simplified calculation - in practice, you'd track unique voters

        // Calculate average participation
        if (proposalCount > 0) {
            avgParticipation = averageParticipationRate / proposalCount;
        }

        return (totalProposals, voterCount, avgParticipation, totalRewards);
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
}
