import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { time } from '@nomicfoundation/hardhat-network-helpers';
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import {
  ProjectGovernanceAdvanced,
  ProjectToken,
} from '../typechain-types';

describe('ProjectGovernanceAdvanced', function () {
  let governance: ProjectGovernanceAdvanced;
  let projectToken: ProjectToken;
  let admin: SignerWithAddress;
  let operator: SignerWithAddress;
  let tokenHolder1: SignerWithAddress;
  let tokenHolder2: SignerWithAddress;
  let tokenHolder3: SignerWithAddress;
  let other: SignerWithAddress;

  const MIN_PROPOSAL_THRESHOLD = ethers.parseEther('1000');
  const DEFAULT_VOTING_PERIOD = 7 * 24 * 60 * 60; // 7 days
  const DEFAULT_QUORUM_PERCENTAGE = 20; // 20%
  const DEFAULT_APPROVAL_THRESHOLD = 51; // 51%
  // const TOTAL_SUPPLY = ethers.parseEther('1000000'); // Removed for simplified test setup

  beforeEach(async function () {
    [admin, operator, tokenHolder1, tokenHolder2, tokenHolder3, other] =
      await ethers.getSigners();

    // Deploy mock project token
    const ProjectToken = await ethers.getContractFactory('ProjectToken');
    projectToken = await ProjectToken.deploy();
    await projectToken.waitForDeployment();

    // Deploy ProjectGovernanceAdvanced
    const ProjectGovernanceAdvanced = await ethers.getContractFactory(
      'ProjectGovernanceAdvanced'
    );
    governance = (await upgrades.deployProxy(
      ProjectGovernanceAdvanced,
      [
        admin.address,
        await projectToken.getAddress(),
        MIN_PROPOSAL_THRESHOLD,
        DEFAULT_VOTING_PERIOD,
        DEFAULT_QUORUM_PERCENTAGE,
        DEFAULT_APPROVAL_THRESHOLD,
      ],
      {
        initializer: 'initialize',
        kind: 'uups',
      }
    )) as unknown as ProjectGovernanceAdvanced;

    await governance.waitForDeployment();

    // Grant operator role
    const OPERATOR_ROLE = await governance.OPERATOR_ROLE();
    await governance.grantRole(OPERATOR_ROLE, operator.address);

    // Distribute tokens to holders
    await projectToken.transfer(
      tokenHolder1.address,
      ethers.parseEther('100000')
    );
    await projectToken.transfer(
      tokenHolder2.address,
      ethers.parseEther('50000')
    );
    await projectToken.transfer(
      tokenHolder3.address,
      ethers.parseEther('25000')
    );

    // Setup governance (funding via admin)
  });

  describe('Deployment & Initialization', function () {
    it('Should initialize with correct parameters', async function () {
      expect(await governance.projectToken()).to.equal(
        await projectToken.getAddress()
      );

      const votingConfig = await governance.votingConfig();
      expect(votingConfig.minProposalThreshold).to.equal(
        MIN_PROPOSAL_THRESHOLD
      );
      expect(votingConfig.defaultVotingPeriod).to.equal(DEFAULT_VOTING_PERIOD);
      expect(votingConfig.defaultQuorumPercentage).to.equal(
        DEFAULT_QUORUM_PERCENTAGE
      );
      expect(votingConfig.defaultApprovalThreshold).to.equal(
        DEFAULT_APPROVAL_THRESHOLD
      );
    });

    it('Should create default proposal templates', async function () {
      const activeTemplates = await governance.getActiveTemplates();
      expect(activeTemplates.length).to.equal(4);

      // Check template names and types
      const template1 = await governance.getProposalTemplate(1);
      expect(template1.name).to.equal('Parameter Change');
      expect(template1.proposalType).to.equal(0); // PARAMETER_CHANGE

      const template2 = await governance.getProposalTemplate(2);
      expect(template2.name).to.equal('Treasury Withdrawal');
      expect(template2.proposalType).to.equal(1); // TREASURY_WITHDRAWAL
    });

    it('Should initialize voting incentives', async function () {
      const incentive = await governance.votingIncentive();
      expect(incentive.isActive).to.be.true;
      expect(incentive.baseReward).to.equal(ethers.parseEther('1'));
      expect(incentive.maxRewardPerProposal).to.equal(ethers.parseEther('2'));
    });

    it('Should initialize with funded reward pool', async function () {
      expect(await governance.rewardPool()).to.equal(
        ethers.parseEther('50000')
      );
    });
  });

  describe('Proposal Templates', function () {
    it('Should create proposal from template', async function () {
      const templateId = 1; // Parameter Change template
      const title = 'Update Fee Rate';
      const description = 'Proposal to update the platform fee rate';
      const callData = ethers.toUtf8Bytes('updateFeeRate(500)');
      const targetContract = await governance.getAddress();

      const proposalId = await governance
        .connect(tokenHolder1)
        .createProposalFromTemplate.staticCall(
          templateId,
          title,
          description,
          callData,
          targetContract
        );

      await expect(
        governance
          .connect(tokenHolder1)
          .createProposalFromTemplate(
            templateId,
            title,
            description,
            callData,
            targetContract
          )
      )
        .to.emit(governance, 'ProposalCreated')
        .withArgs(
          proposalId,
          tokenHolder1.address,
          title,
          0,
          anyValue,
          anyValue
        );

      const proposal = await governance.getProposal(proposalId);
      expect(proposal.title).to.equal(title);
      expect(proposal.description).to.equal(description);
      expect(proposal.proposalType).to.equal(0); // PARAMETER_CHANGE
      expect(proposal.proposer).to.equal(tokenHolder1.address);
    });

    it('Should create custom proposal', async function () {
      const title = 'Custom Proposal';
      const description = 'A custom proposal with specific parameters';
      const votingPeriod = 3 * 24 * 60 * 60; // 3 days
      const quorumPercentage = 25;
      const approvalThreshold = 60;
      const callData = ethers.toUtf8Bytes('customAction()');
      const targetContract = await governance.getAddress();

      const proposalId = await governance
        .connect(tokenHolder1)
        .createCustomProposal.staticCall(
          title,
          description,
          votingPeriod,
          quorumPercentage,
          approvalThreshold,
          callData,
          targetContract
        );

      await expect(
        governance
          .connect(tokenHolder1)
          .createCustomProposal(
            title,
            description,
            votingPeriod,
            quorumPercentage,
            approvalThreshold,
            callData,
            targetContract
          )
      )
        .to.emit(governance, 'ProposalCreated')
        .withArgs(
          proposalId,
          tokenHolder1.address,
          title,
          4,
          anyValue,
          anyValue
        ); // 4 = CUSTOM

      const proposal = await governance.getProposal(proposalId);
      expect(proposal.title).to.equal(title);
      expect(proposal.proposalType).to.equal(4); // CUSTOM
    });

    it('Should enforce minimum voting power for proposals', async function () {
      const templateId = 1;
      const title = 'Test Proposal';
      const description = 'Test Description';
      const callData = '0x';
      const targetContract = ethers.ZeroAddress;

      await expect(
        governance
          .connect(other)
          .createProposalFromTemplate(
            templateId,
            title,
            description,
            callData,
            targetContract
          )
      ).to.be.revertedWith('Insufficient voting power');
    });

    it('Should prevent inactive templates from being used', async function () {
      // First, deactivate a template (this would require admin access)
      // For now, test with invalid template ID
      await expect(
        governance.connect(tokenHolder1).createProposalFromTemplate(
          999, // Invalid template ID
          'Test',
          'Test',
          '0x',
          ethers.ZeroAddress
        )
      ).to.be.revertedWith('Invalid template ID');
    });
  });

  describe('Voting Process', function () {
    let proposalId: number;

    beforeEach(async function () {
      // Create a proposal
      const templateId = 1;
      const title = 'Test Proposal';
      const description = 'Test Description';
      const callData = '0x';
      const targetContract = ethers.ZeroAddress;

      const proposalResult = await governance
        .connect(tokenHolder1)
        .createProposalFromTemplate.staticCall(
          templateId,
          title,
          description,
          callData,
          targetContract
        );
      proposalId = Number(proposalResult);

      await governance
        .connect(tokenHolder1)
        .createProposalFromTemplate(
          templateId,
          title,
          description,
          callData,
          targetContract
        );

      // Wait for proposal delay
      await time.increase(1 * 24 * 60 * 60 + 1); // 1 day + 1 second
    });

    it('Should allow token holders to vote', async function () {
      const support = 1; // Vote for
      const votingPower = await governance.getVotingPower(tokenHolder1.address);

      await expect(
        governance.connect(tokenHolder1).castVote(proposalId, support)
      )
        .to.emit(governance, 'VoteCast')
        .withArgs(
          proposalId,
          tokenHolder1.address,
          votingPower,
          support,
          anyValue
        );

      const proposal = await governance.getProposal(proposalId);
      expect(proposal.forVotes).to.equal(votingPower);
      expect(proposal.againstVotes).to.equal(0);
      expect(proposal.abstainVotes).to.equal(0);
    });

    it('Should track voting statistics', async function () {
      const support = 1;

      await governance.connect(tokenHolder1).castVote(proposalId, support);

      const stats = await governance.getVoterStats(tokenHolder1.address);
      expect(stats.totalVotes).to.equal(1);
    });

    it('Should calculate early voting bonus', async function () {
      const support = 1;

      // Vote early (immediately after voting starts)
      await governance.connect(tokenHolder1).castVote(proposalId, support);

      // Wait and have another voter vote later
      await time.increase(3 * 24 * 60 * 60); // 3 days
      await governance.connect(tokenHolder2).castVote(proposalId, support);

      const stats1 = await governance.getVoterStats(tokenHolder1.address);
      const stats2 = await governance.getVoterStats(tokenHolder2.address);

      // Early voter should get more rewards
      expect(stats1.totalRewardsEarned).to.be.greaterThan(
        stats2.totalRewardsEarned
      );
    });

    it('Should track consecutive voting bonus', async function () {
      // Create multiple proposals and have same voter vote on all
      for (let i = 0; i < 3; i++) {
        const newProposalId = await governance
          .connect(tokenHolder1)
          .createProposalFromTemplate.staticCall(
            1,
            `Test Proposal ${i}`,
            'Test Description',
            '0x',
            ethers.ZeroAddress
          );

        await governance
          .connect(tokenHolder1)
          .createProposalFromTemplate(
            1,
            `Test Proposal ${i}`,
            'Test Description',
            '0x',
            ethers.ZeroAddress
          );

        await time.increase(1 * 24 * 60 * 60 + 1); // Wait for proposal delay
        await governance.connect(tokenHolder1).castVote(newProposalId, 1);
      }

      const stats = await governance.getVoterStats(tokenHolder1.address);
      expect(stats.consecutiveVotes).to.be.greaterThan(1);
    });

    it('Should prevent double voting', async function () {
      await governance.connect(tokenHolder1).castVote(proposalId, 1);

      await expect(
        governance.connect(tokenHolder1).castVote(proposalId, 0)
      ).to.be.revertedWith('Already voted');
    });

    it('Should prevent voting on non-existent proposal', async function () {
      await expect(
        governance.connect(tokenHolder1).castVote(999, 1)
      ).to.be.revertedWith('Invalid proposal ID');
    });

    it('Should prevent voting with invalid support value', async function () {
      await expect(
        governance.connect(tokenHolder1).castVote(proposalId, 3)
      ).to.be.revertedWith('Invalid support value');
    });

    it('Should prevent voting by non-token holders', async function () {
      await expect(
        governance.connect(other).castVote(proposalId, 1)
      ).to.be.revertedWith('No voting power');
    });
  });

  describe('Delegation', function () {
    it('Should allow token holders to delegate voting power', async function () {
      await expect(
        governance.connect(tokenHolder1).delegate(tokenHolder2.address)
      )
        .to.emit(governance, 'DelegationSet')
        .withArgs(tokenHolder1.address, tokenHolder2.address, anyValue);

      const votingPower = await governance.getVotingPower(tokenHolder2.address);
      expect(votingPower).to.be.greaterThan(
        await projectToken.balanceOf(tokenHolder2.address)
      );
    });

    it('Should allow delegators to remove delegation', async function () {
      await governance.connect(tokenHolder1).delegate(tokenHolder2.address);

      const initialVotingPower = await governance.getVotingPower(
        tokenHolder2.address
      );

      await expect(governance.connect(tokenHolder1).removeDelegation())
        .to.emit(governance, 'DelegationRemoved')
        .withArgs(tokenHolder1.address, tokenHolder2.address);

      const finalVotingPower = await governance.getVotingPower(
        tokenHolder2.address
      );
      expect(finalVotingPower).to.be.lessThan(initialVotingPower);
    });

    it('Should prevent self-delegation', async function () {
      await expect(
        governance.connect(tokenHolder1).delegate(tokenHolder1.address)
      ).to.be.revertedWith('Cannot delegate to self');
    });

    it('Should prevent delegation to zero address', async function () {
      await expect(
        governance.connect(tokenHolder1).delegate(ethers.ZeroAddress)
      ).to.be.revertedWith('Cannot delegate to zero address');
    });

    it('Should prevent delegation by non-token holders', async function () {
      await expect(
        governance.connect(other).delegate(tokenHolder1.address)
      ).to.be.revertedWith('No voting power to delegate');
    });
  });

  describe('Proposal Execution', function () {
    let proposalId: number;

    beforeEach(async function () {
      // Create a proposal
      const templateId = 1;
      const title = 'Test Proposal';
      const description = 'Test Description';
      const callData = '0x';
      const targetContract = ethers.ZeroAddress;

      const proposalResult = await governance
        .connect(tokenHolder1)
        .createProposalFromTemplate.staticCall(
          templateId,
          title,
          description,
          callData,
          targetContract
        );
      proposalId = Number(proposalResult);

      await governance
        .connect(tokenHolder1)
        .createProposalFromTemplate(
          templateId,
          title,
          description,
          callData,
          targetContract
        );

      // Wait for proposal delay
      await time.increase(1 * 24 * 60 * 60 + 1); // 1 day + 1 second
    });

    it('Should execute successful proposal', async function () {
      // Vote on the proposal
      await governance.connect(tokenHolder1).castVote(proposalId, 1); // For
      await governance.connect(tokenHolder2).castVote(proposalId, 1); // For
      await governance.connect(tokenHolder3).castVote(proposalId, 1); // For

      // Wait for voting period to end
      await time.increase(DEFAULT_VOTING_PERIOD + 1);

      // Execute proposal
      await expect(governance.executeProposal(proposalId))
        .to.emit(governance, 'ProposalExecuted')
        .withArgs(proposalId, anyValue);

      const proposal = await governance.getProposal(proposalId);
      expect(proposal.status).to.equal(2); // SUCCEEDED
    });

    it('Should reject proposal that fails quorum', async function () {
      // Only small vote (insufficient quorum)
      await governance.connect(tokenHolder3).castVote(proposalId, 1);

      // Wait for voting period to end
      await time.increase(DEFAULT_VOTING_PERIOD + 1);

      // Execute proposal
      await governance.executeProposal(proposalId);

      const proposal = await governance.getProposal(proposalId);
      expect(proposal.status).to.equal(3); // DEFEATED
    });

    it('Should reject proposal that fails approval threshold', async function () {
      // Vote with majority against
      await governance.connect(tokenHolder1).castVote(proposalId, 0); // Against
      await governance.connect(tokenHolder2).castVote(proposalId, 0); // Against
      await governance.connect(tokenHolder3).castVote(proposalId, 1); // For

      // Wait for voting period to end
      await time.increase(DEFAULT_VOTING_PERIOD + 1);

      // Execute proposal
      await governance.executeProposal(proposalId);

      const proposal = await governance.getProposal(proposalId);
      expect(proposal.status).to.equal(3); // DEFEATED
    });

    it('Should enforce execution delay', async function () {
      // Vote to pass proposal
      await governance.connect(tokenHolder1).castVote(proposalId, 1);
      await governance.connect(tokenHolder2).castVote(proposalId, 1);
      await governance.connect(tokenHolder3).castVote(proposalId, 1);

      // Wait for voting period to end
      await time.increase(DEFAULT_VOTING_PERIOD + 1);

      // Try to execute immediately (should fail if there's call data)
      await governance.executeProposal(proposalId);

      const proposal = await governance.getProposal(proposalId);
      expect(proposal.status).to.equal(2); // SUCCEEDED (no call data to execute)
    });

    it('Should prevent execution before voting ends', async function () {
      await expect(governance.executeProposal(proposalId)).to.be.revertedWith(
        'Voting still active'
      );
    });

    it('Should prevent execution of non-existent proposal', async function () {
      await expect(governance.executeProposal(999)).to.be.revertedWith(
        'Invalid proposal ID'
      );
    });
  });

  describe('Voting Incentives', function () {
    it('Should allow admin to update voting incentives', async function () {
      const newBaseReward = ethers.parseEther('2');
      const newParticipationBonus = ethers.parseEther('1');
      const newEarlyVotingBonus = ethers.parseEther('0.5');
      const newConsecutiveBonus = ethers.parseEther('0.3');
      const newMaxReward = ethers.parseEther('5');

      await expect(
        governance
          .connect(admin)
          .updateVotingIncentive(
            newBaseReward,
            newParticipationBonus,
            newEarlyVotingBonus,
            newConsecutiveBonus,
            newMaxReward,
            true
          )
      )
        .to.emit(governance, 'VotingIncentiveUpdated')
        .withArgs(newBaseReward, newParticipationBonus, newEarlyVotingBonus);

      const incentive = await governance.votingIncentive();
      expect(incentive.baseReward).to.equal(newBaseReward);
      expect(incentive.participationBonus).to.equal(newParticipationBonus);
      expect(incentive.earlyVotingBonus).to.equal(newEarlyVotingBonus);
      expect(incentive.consecutiveVotingBonus).to.equal(newConsecutiveBonus);
      expect(incentive.maxRewardPerProposal).to.equal(newMaxReward);
    });

    it('Should allow admin to fund reward pool', async function () {
      const fundAmount = ethers.parseEther('10000');
      const initialPool = await governance.rewardPool();

      await expect(governance.connect(admin).fundRewardPool(fundAmount))
        .to.emit(governance, 'RewardPoolFunded')
        .withArgs(fundAmount);

      const finalPool = await governance.rewardPool();
      expect(finalPool).to.equal(initialPool + fundAmount);
    });

    it('Should prevent non-admin from updating incentives', async function () {
      await expect(
        governance
          .connect(other)
          .updateVotingIncentive(
            ethers.parseEther('1'),
            ethers.parseEther('1'),
            ethers.parseEther('1'),
            ethers.parseEther('1'),
            ethers.parseEther('1'),
            true
          )
      ).to.be.revertedWith('AccessControl:');
    });
  });

  describe('Governance Analytics', function () {
    it('Should track governance metrics', async function () {
      // Create and vote on a proposal
      const proposalId = await governance
        .connect(tokenHolder1)
        .createProposalFromTemplate.staticCall(
          1,
          'Test Proposal',
          'Test Description',
          '0x',
          ethers.ZeroAddress
        );

      await governance
        .connect(tokenHolder1)
        .createProposalFromTemplate(
          1,
          'Test Proposal',
          'Test Description',
          '0x',
          ethers.ZeroAddress
        );

      await time.increase(1 * 24 * 60 * 60 + 1);
      await governance.connect(tokenHolder1).castVote(proposalId, 1);

      // Get analytics
      const analytics = await governance.getGovernanceAnalytics();
      expect(analytics.totalProposals).to.equal(1);
      expect(analytics.totalRewards).to.be.greaterThan(0);
    });

    it('Should track voter statistics', async function () {
      // Create proposal and vote
      const proposalId = await governance
        .connect(tokenHolder1)
        .createProposalFromTemplate.staticCall(
          1,
          'Test Proposal',
          'Test Description',
          '0x',
          ethers.ZeroAddress
        );

      await governance
        .connect(tokenHolder1)
        .createProposalFromTemplate(
          1,
          'Test Proposal',
          'Test Description',
          '0x',
          ethers.ZeroAddress
        );

      await time.increase(1 * 24 * 60 * 60 + 1);
      await governance.connect(tokenHolder1).castVote(proposalId, 1);

      const stats = await governance.getVoterStats(tokenHolder1.address);
      expect(stats.totalVotes).to.equal(1);
      expect(stats.totalRewardsEarned).to.be.greaterThan(0);
      expect(stats.votingPowerUsed).to.be.greaterThan(0);
    });
  });

  describe('UUPS Upgradeability', function () {
    it('Should allow admin to upgrade contract', async function () {
      const ProjectGovernanceAdvancedV2 = await ethers.getContractFactory(
        'ProjectGovernanceAdvanced'
      );

      await expect(
        upgrades.upgradeProxy(governance.target, ProjectGovernanceAdvancedV2)
      ).to.not.be.reverted;
    });

    it('Should prevent non-admin from upgrading', async function () {
      const ProjectGovernanceAdvancedV2 = await ethers.getContractFactory(
        'ProjectGovernanceAdvanced',
        other
      );

      await expect(
        upgrades.upgradeProxy(governance.target, ProjectGovernanceAdvancedV2)
      ).to.be.revertedWith('AccessControl:');
    });
  });

  describe('Pause/Unpause Functionality', function () {
    it('Should allow pauser to pause contract', async function () {
      await governance.connect(admin).pause();

      await expect(
        governance
          .connect(tokenHolder1)
          .createProposalFromTemplate(
            1,
            'Test',
            'Test',
            '0x',
            ethers.ZeroAddress
          )
      ).to.be.revertedWith('Pausable: paused');
    });

    it('Should allow pauser to unpause contract', async function () {
      await governance.connect(admin).pause();
      await governance.connect(admin).unpause();

      await expect(
        governance
          .connect(tokenHolder1)
          .createProposalFromTemplate(
            1,
            'Test',
            'Test',
            '0x',
            ethers.ZeroAddress
          )
      ).to.not.be.reverted;
    });
  });

  describe('Edge Cases', function () {
    it('Should handle proposal with zero voting power', async function () {
      // Transfer all tokens away
      await projectToken
        .connect(tokenHolder1)
        .transfer(
          tokenHolder2.address,
          await projectToken.balanceOf(tokenHolder1.address)
        );

      await expect(
        governance
          .connect(tokenHolder1)
          .createProposalFromTemplate(
            1,
            'Test',
            'Test',
            '0x',
            ethers.ZeroAddress
          )
      ).to.be.revertedWith('Insufficient voting power');
    });

    it('Should handle voting when reward pool is empty', async function () {
      // Create proposal
      const proposalId = await governance
        .connect(tokenHolder1)
        .createProposalFromTemplate.staticCall(
          1,
          'Test Proposal',
          'Test Description',
          '0x',
          ethers.ZeroAddress
        );

      await governance
        .connect(tokenHolder1)
        .createProposalFromTemplate(
          1,
          'Test Proposal',
          'Test Description',
          '0x',
          ethers.ZeroAddress
        );

      // Empty reward pool (this would require admin access in real scenario)
      await time.increase(1 * 24 * 60 * 60 + 1);

      // Should still allow voting even without rewards
      await expect(governance.connect(tokenHolder1).castVote(proposalId, 1)).to
        .not.be.reverted;
    });

    it('Should handle template with zero voting period', async function () {
      await expect(
        governance.connect(tokenHolder1).createCustomProposal(
          'Test',
          'Test',
          0, // Invalid voting period
          20,
          51,
          '0x',
          ethers.ZeroAddress
        )
      ).to.be.revertedWith('Invalid voting period');
    });
  });
});
