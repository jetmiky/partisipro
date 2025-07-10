import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import {
  ClaimTopicsRegistry,
  TrustedIssuersRegistry,
  IdentityRegistry,
  PlatformRegistry,
  PlatformTreasury,
  ProjectFactory,
  ProjectToken,
  ProjectOffering,
  // ProjectTreasury,
  ProjectGovernance,
} from '../../typechain-types';
import { time } from '@nomicfoundation/hardhat-network-helpers';

describe('Governance Flow', function () {
  // ERC-3643 Infrastructure contracts
  let claimTopicsRegistry: ClaimTopicsRegistry;
  let trustedIssuersRegistry: TrustedIssuersRegistry;
  let identityRegistry: IdentityRegistry;

  let platformRegistry: PlatformRegistry;
  let platformTreasury: PlatformTreasury;
  let projectFactory: ProjectFactory;

  // Project contracts
  let projectToken: ProjectToken;
  let projectOffering: ProjectOffering;
  // let projectTreasuryContract: ProjectTreasury;
  let projectGovernance: ProjectGovernance;

  let admin: SignerWithAddress;
  let operator: SignerWithAddress;
  let spv: SignerWithAddress;
  let investor1: SignerWithAddress;
  let investor2: SignerWithAddress;
  let investor3: SignerWithAddress;
  let treasury: SignerWithAddress;
  let kycIssuer: SignerWithAddress;

  const LISTING_FEE = ethers.parseEther('0.1');
  const MANAGEMENT_FEE_RATE = 500; // 5%
  const MIN_INVESTMENT = ethers.parseEther('0.01');
  const MAX_INVESTMENT = ethers.parseEther('10');
  const EMERGENCY_THRESHOLD = ethers.parseEther('1');

  // Project parameters
  const PROJECT_NAME = 'Jakarta Toll Road';
  const PROJECT_SYMBOL = 'JTR';
  const TOTAL_SUPPLY = ethers.parseUnits('1000', 18); // 1K tokens
  const TOKEN_PRICE = ethers.parseUnits('1', 14); // 0.0001 ETH per token

  beforeEach(async function () {
    [
      admin,
      operator,
      spv,
      investor1,
      investor2,
      investor3,
      treasury,
      kycIssuer,
    ] = await ethers.getSigners();

    // Deploy ERC-3643 infrastructure contracts
    const ClaimTopicsRegistry = await ethers.getContractFactory(
      'ClaimTopicsRegistry'
    );
    claimTopicsRegistry = await ClaimTopicsRegistry.deploy(admin.address);

    const TrustedIssuersRegistry = await ethers.getContractFactory(
      'TrustedIssuersRegistry'
    );
    trustedIssuersRegistry = await TrustedIssuersRegistry.deploy(
      admin.address,
      await claimTopicsRegistry.getAddress()
    );

    const IdentityRegistry =
      await ethers.getContractFactory('IdentityRegistry');
    identityRegistry = await IdentityRegistry.deploy(
      admin.address,
      await claimTopicsRegistry.getAddress(),
      await trustedIssuersRegistry.getAddress()
    );

    // Deploy core infrastructure
    const PlatformTreasury =
      await ethers.getContractFactory('PlatformTreasury');
    platformTreasury = await PlatformTreasury.deploy(
      admin.address,
      admin.address, // Will be updated after PlatformRegistry is deployed
      treasury.address,
      EMERGENCY_THRESHOLD
    );

    const PlatformRegistry =
      await ethers.getContractFactory('PlatformRegistry');
    platformRegistry = await PlatformRegistry.deploy(
      admin.address,
      await platformTreasury.getAddress(),
      LISTING_FEE,
      MANAGEMENT_FEE_RATE,
      MIN_INVESTMENT,
      MAX_INVESTMENT
    );

    // Update platform registry in treasury
    await platformTreasury.updatePlatformRegistry(
      await platformRegistry.getAddress()
    );

    // Deploy implementation contracts
    const ProjectToken = await ethers.getContractFactory('ProjectToken');
    const projectTokenImpl = await ProjectToken.deploy();

    const ProjectOffering = await ethers.getContractFactory('ProjectOffering');
    const projectOfferingImpl = await ProjectOffering.deploy();

    const ProjectTreasury = await ethers.getContractFactory('ProjectTreasury');
    const projectTreasuryImpl = await ProjectTreasury.deploy();

    const ProjectGovernance =
      await ethers.getContractFactory('ProjectGovernance');
    const projectGovernanceImpl = await ProjectGovernance.deploy();

    // Deploy factory
    const ProjectFactory = await ethers.getContractFactory('ProjectFactory');
    projectFactory = await ProjectFactory.deploy(
      admin.address,
      await platformRegistry.getAddress(),
      await platformTreasury.getAddress(),
      await identityRegistry.getAddress(),
      await projectTokenImpl.getAddress(),
      await projectOfferingImpl.getAddress(),
      await projectTreasuryImpl.getAddress(),
      await projectGovernanceImpl.getAddress()
    );

    // Setup permissions
    await platformRegistry
      .connect(admin)
      .grantRole(await platformRegistry.OPERATOR_ROLE(), operator.address);
    await platformRegistry
      .connect(admin)
      .authorizeFactory(await projectFactory.getAddress());
    await platformRegistry
      .connect(admin)
      .registerSPV(spv.address, 'Test SPV Corporation', 'SPV-001');

    // Setup ERC-3643 compliance system
    const kycTopicId = await claimTopicsRegistry.KYC_APPROVED();
    await trustedIssuersRegistry
      .connect(admin)
      .addTrustedIssuer(
        kycIssuer.address,
        'Platform KYC Provider',
        'Official KYC verification service',
        [kycTopicId]
      );

    // Grant operator role to KYC issuer in identity registry
    const OPERATOR_ROLE = await identityRegistry.OPERATOR_ROLE();
    await identityRegistry
      .connect(admin)
      .grantRole(OPERATOR_ROLE, kycIssuer.address);

    // Grant operator role to IdentityRegistry in trusted issuers registry
    const TRUSTED_ISSUERS_OPERATOR_ROLE =
      await trustedIssuersRegistry.OPERATOR_ROLE();
    await trustedIssuersRegistry
      .connect(admin)
      .grantRole(
        TRUSTED_ISSUERS_OPERATOR_ROLE,
        await identityRegistry.getAddress()
      );

    // Verify all investors through ERC-3643 IdentityRegistry
    await identityRegistry
      .connect(kycIssuer)
      .addClaim(
        investor1.address,
        kycTopicId,
        ethers.toUtf8Bytes('KYC verification passed'),
        0
      );
    await identityRegistry
      .connect(kycIssuer)
      .addClaim(
        investor2.address,
        kycTopicId,
        ethers.toUtf8Bytes('KYC verification passed'),
        0
      );
    await identityRegistry
      .connect(kycIssuer)
      .addClaim(
        investor3.address,
        kycTopicId,
        ethers.toUtf8Bytes('KYC verification passed'),
        0
      );

    // Create a project and complete setup
    await projectFactory
      .connect(spv)
      .createProject(PROJECT_NAME, PROJECT_SYMBOL, TOTAL_SUPPLY, TOKEN_PRICE, {
        value: LISTING_FEE,
      });

    // Get project contracts
    const project = await projectFactory.getProject(1);
    projectToken = await ethers.getContractAt(
      'ProjectToken',
      project.projectToken
    );
    projectOffering = await ethers.getContractAt(
      'ProjectOffering',
      project.offering
    );
    projectTreasuryContract = await ethers.getContractAt(
      'ProjectTreasury',
      project.treasury
    );
    projectGovernance = await ethers.getContractAt(
      'ProjectGovernance',
      project.governance
    );

    // Complete project setup
    await projectToken.connect(spv).setGovernance(project.governance);
    await projectToken.connect(spv).addAuthorizedMinter(project.offering);

    // Setup investments to give investors tokens for governance
    const offeringInfo = await projectOffering.getOfferingInfo();
    await time.increaseTo(offeringInfo.startTime);

    // Investors buy tokens
    await projectOffering
      .connect(investor1)
      .invest({ value: ethers.parseEther('0.02') }); // 200 tokens
    await projectOffering
      .connect(investor2)
      .invest({ value: ethers.parseEther('0.03') }); // 300 tokens
    await projectOffering
      .connect(investor3)
      .invest({ value: ethers.parseEther('0.01') }); // 100 tokens

    // Finalize offering and claim tokens
    await time.increaseTo(offeringInfo.endTime + 1n);
    await projectOffering.connect(spv).finalizeOffering();

    await projectOffering.connect(investor1).claimTokens();
    await projectOffering.connect(investor2).claimTokens();
    await projectOffering.connect(investor3).claimTokens();
  });

  describe('Proposal Creation', function () {
    it('Should allow token holders to create proposals', async function () {
      const proposalTitle = 'Enable token transfers';
      const proposalDescription =
        'Proposal to enable token transfers for secondary market trading';

      // Create a proposal to call enableTransfers on the token contract
      const targets = [await projectToken.getAddress()];
      const values = [0];
      const calldatas = [
        projectToken.interface.encodeFunctionData('enableTransfers', []),
      ];
      const signatures = ['enableTransfers()'];

      await expect(
        projectGovernance
          .connect(investor1)
          .propose(
            proposalTitle,
            proposalDescription,
            targets,
            values,
            calldatas,
            signatures
          )
      ).to.emit(projectGovernance, 'ProposalCreated');

      const proposal = await projectGovernance.getProposal(1);
      expect(proposal.title).to.equal(proposalTitle);
      expect(proposal.description).to.equal(proposalDescription);
      expect(proposal.proposer).to.equal(investor1.address);
    });

    it('Should reject proposals from non-token holders', async function () {
      const proposalTitle = 'Test proposal';
      const proposalDescription = 'Test description';

      // Create a dummy proposal with proper structure
      const targets = [await projectToken.getAddress()];
      const values = [0];
      const calldatas = [
        projectToken.interface.encodeFunctionData('enableTransfers', []),
      ];
      const signatures = ['enableTransfers()'];

      await expect(
        projectGovernance
          .connect(admin)
          .propose(
            proposalTitle,
            proposalDescription,
            targets,
            values,
            calldatas,
            signatures
          )
      ).to.be.revertedWith('Not a token holder');
    });

    it('Should increment proposal count', async function () {
      const initialCount = await projectGovernance.proposalCount();

      // Create realistic proposals
      const targets = [await projectToken.getAddress()];
      const values = [0];
      const calldatas = [
        projectToken.interface.encodeFunctionData('enableTransfers', []),
      ];
      const signatures = ['enableTransfers()'];

      await projectGovernance
        .connect(investor1)
        .propose(
          'Test proposal 1',
          'Test description 1',
          targets,
          values,
          calldatas,
          signatures
        );

      await projectGovernance
        .connect(investor2)
        .propose(
          'Test proposal 2',
          'Test description 2',
          targets,
          values,
          calldatas,
          signatures
        );

      const finalCount = await projectGovernance.proposalCount();
      expect(finalCount).to.equal(initialCount + 2n);
    });
  });

  describe('Voting Process', function () {
    let proposalId: bigint;

    beforeEach(async function () {
      // Create a proposal
      const targets = [await projectToken.getAddress()];
      const values = [0];
      const calldatas = [
        projectToken.interface.encodeFunctionData('enableTransfers', []),
      ];
      const signatures = ['enableTransfers()'];

      const tx = await projectGovernance
        .connect(investor1)
        .propose(
          'Test proposal',
          'Test description',
          targets,
          values,
          calldatas,
          signatures
        );
      await tx.wait(); // Wait for transaction confirmation
      proposalId = 1n; // First proposal

      // Move past voting delay
      const proposal = await projectGovernance.getProposal(proposalId);
      await time.increaseTo(proposal.startTime);
    });

    it('Should allow token holders to vote', async function () {
      const voteType = 1; // For

      await expect(
        projectGovernance
          .connect(investor1)
          .castVote(proposalId, voteType, 'I support this proposal')
      ).to.emit(projectGovernance, 'VoteCast');

      const vote = await projectGovernance.getVote(
        proposalId,
        investor1.address
      );
      expect(vote.hasVoted).to.be.true;
      expect(vote.vote).to.equal(voteType);
    });

    it('Should count votes correctly', async function () {
      // investor1 has 200 tokens, investor2 has 300 tokens
      await projectGovernance.connect(investor1).castVote(proposalId, 1, 'For'); // For
      await projectGovernance
        .connect(investor2)
        .castVote(proposalId, 0, 'Against'); // Against

      const proposal = await projectGovernance.getProposal(proposalId);
      expect(proposal.forVotes).to.equal(ethers.parseEther('200'));
      expect(proposal.againstVotes).to.equal(ethers.parseEther('300'));
    });

    it('Should reject double voting', async function () {
      await projectGovernance.connect(investor1).castVote(proposalId, 1, 'For');

      await expect(
        projectGovernance.connect(investor1).castVote(proposalId, 0, 'Against')
      ).to.be.revertedWith('Already voted');
    });

    it('Should reject voting from non-token holders', async function () {
      await expect(
        projectGovernance.connect(admin).castVote(proposalId, 1, 'For')
      ).to.be.revertedWith('Not a token holder');
    });

    it('Should reject voting before voting period starts', async function () {
      // Create a new proposal
      const targets = [await projectToken.getAddress()];
      const values = [0];
      const calldatas = [
        projectToken.interface.encodeFunctionData('enableTransfers', []),
      ];
      const signatures = ['enableTransfers()'];

      await projectGovernance
        .connect(investor1)
        .propose(
          'Future proposal',
          'Future description',
          targets,
          values,
          calldatas,
          signatures
        );

      const futureProposalId = 2n;

      await expect(
        projectGovernance
          .connect(investor1)
          .castVote(futureProposalId, 1, 'For')
      ).to.be.revertedWith('Proposal not active');
    });

    it('Should reject voting after voting period ends', async function () {
      const proposal = await projectGovernance.getProposal(proposalId);
      await time.increaseTo(proposal.endTime + 1n);

      await expect(
        projectGovernance.connect(investor1).castVote(proposalId, 1, 'For')
      ).to.be.revertedWith('Proposal not active');
    });
  });

  describe('Proposal States', function () {
    let proposalId: bigint;

    beforeEach(async function () {
      const targets = [await projectToken.getAddress()];
      const values = [0];
      const calldatas = [
        projectToken.interface.encodeFunctionData('enableTransfers', []),
      ];
      const signatures = ['enableTransfers()'];

      await projectGovernance
        .connect(investor1)
        .propose(
          'Test proposal',
          'Test description',
          targets,
          values,
          calldatas,
          signatures
        );
      proposalId = 1n;
    });

    it('Should have correct initial state', async function () {
      const state = await projectGovernance.state(proposalId);
      expect(state).to.equal(0); // Pending
    });

    it('Should transition to Active state', async function () {
      const proposal = await projectGovernance.getProposal(proposalId);
      await time.increaseTo(proposal.startTime);

      const state = await projectGovernance.state(proposalId);
      expect(state).to.equal(1); // Active
    });

    it('Should transition to Succeeded state with sufficient votes', async function () {
      const proposal = await projectGovernance.getProposal(proposalId);
      await time.increaseTo(proposal.startTime);

      // Get enough votes to reach quorum and majority
      await projectGovernance.connect(investor1).castVote(proposalId, 1, 'For'); // 200 tokens
      await projectGovernance.connect(investor2).castVote(proposalId, 1, 'For'); // 300 tokens
      // Total: 500 tokens for, 0 against (500/600 = 83.33% > 20% quorum)

      await time.increaseTo(proposal.endTime + 1n);

      const state = await projectGovernance.state(proposalId);
      expect(state).to.equal(4); // Succeeded
    });

    it('Should transition to Defeated state with insufficient votes', async function () {
      const proposal = await projectGovernance.getProposal(proposalId);
      await time.increaseTo(proposal.startTime);

      // Only small vote, not reaching quorum
      await projectGovernance.connect(investor3).castVote(proposalId, 1, 'For'); // 100 tokens
      // Total: 100 tokens for (100/600 = 16.67% < 20% quorum)

      await time.increaseTo(proposal.endTime + 1n);

      const state = await projectGovernance.state(proposalId);
      expect(state).to.equal(3); // Defeated
    });
  });

  describe('Proposal Management', function () {
    let proposalId: bigint;

    beforeEach(async function () {
      const targets = [await projectToken.getAddress()];
      const values = [0];
      const calldatas = [
        projectToken.interface.encodeFunctionData('enableTransfers', []),
      ];
      const signatures = ['enableTransfers()'];

      await projectGovernance
        .connect(investor1)
        .propose(
          'Test proposal',
          'Test description',
          targets,
          values,
          calldatas,
          signatures
        );
      proposalId = 1n;
    });

    it('Should allow proposer to cancel their proposal', async function () {
      await expect(
        projectGovernance.connect(investor1).cancelProposal(proposalId)
      ).to.emit(projectGovernance, 'ProposalCanceled');

      const state = await projectGovernance.state(proposalId);
      expect(state).to.equal(2); // Canceled
    });

    it('Should reject cancellation from non-proposer', async function () {
      await expect(
        projectGovernance.connect(investor2).cancelProposal(proposalId)
      ).to.be.revertedWith('Not authorized to cancel');
    });

    it('Should track active proposals', async function () {
      const activeProposals = await projectGovernance.getActiveProposals();
      expect(activeProposals).to.include(proposalId);
    });
  });

  describe('Governance Settings', function () {
    it('Should return correct governance settings', async function () {
      const settings = await projectGovernance.governanceSettings();
      expect(settings.votingDelay).to.equal(1n * 24n * 60n * 60n); // 1 day
      expect(settings.votingPeriod).to.equal(7n * 24n * 60n * 60n); // 7 days
      expect(settings.quorumNumerator).to.equal(20n); // 20%
      expect(settings.quorumDenominator).to.equal(100n);
      expect(settings.isActive).to.be.true;
    });

    it('Should calculate quorum correctly', async function () {
      const totalSupply = await projectToken.totalSupply();
      const settings = await projectGovernance.governanceSettings();

      // Quorum should be 20% of total supply
      const expectedQuorum =
        (totalSupply * settings.quorumNumerator) / settings.quorumDenominator;

      // Create a proposal to test quorum calculation
      const targets = [await projectToken.getAddress()];
      const values = [0];
      const calldatas = [
        projectToken.interface.encodeFunctionData('enableTransfers', []),
      ];
      const signatures = ['enableTransfers()'];

      await projectGovernance
        .connect(investor1)
        .propose(
          'Test proposal',
          'Test description',
          targets,
          values,
          calldatas,
          signatures
        );

      const proposal = await projectGovernance.getProposal(1);
      expect(proposal.quorumVotes).to.equal(expectedQuorum);
    });
  });

  describe('Integration with Token Contract', function () {
    it('Should use token balances for voting weight', async function () {
      const targets = [await projectToken.getAddress()];
      const values = [0];
      const calldatas = [
        projectToken.interface.encodeFunctionData('enableTransfers', []),
      ];
      const signatures = ['enableTransfers()'];

      await projectGovernance
        .connect(investor1)
        .propose(
          'Test proposal',
          'Test description',
          targets,
          values,
          calldatas,
          signatures
        );

      const proposalId = 1n;
      const proposal = await projectGovernance.getProposal(proposalId);
      await time.increaseTo(proposal.startTime);

      // Vote with all investors
      await projectGovernance.connect(investor1).castVote(proposalId, 1, 'For'); // 200 tokens
      await projectGovernance.connect(investor2).castVote(proposalId, 1, 'For'); // 300 tokens
      await projectGovernance.connect(investor3).castVote(proposalId, 1, 'For'); // 100 tokens

      const updatedProposal = await projectGovernance.getProposal(proposalId);
      expect(updatedProposal.forVotes).to.equal(ethers.parseEther('600')); // All tokens
    });

    it('Should reflect token transfers in voting weight', async function () {
      // Transfer some tokens from investor1 to investor2
      await projectToken
        .connect(investor1)
        .transfer(investor2.address, ethers.parseEther('100'));

      const targets = [await projectToken.getAddress()];
      const values = [0];
      const calldatas = [
        projectToken.interface.encodeFunctionData('enableTransfers', []),
      ];
      const signatures = ['enableTransfers()'];

      await projectGovernance
        .connect(investor1)
        .propose(
          'Test proposal',
          'Test description',
          targets,
          values,
          calldatas,
          signatures
        );

      const proposalId = 1n;
      const proposal = await projectGovernance.getProposal(proposalId);
      await time.increaseTo(proposal.startTime);

      // Vote with adjusted balances
      await projectGovernance.connect(investor1).castVote(proposalId, 1, 'For'); // 100 tokens (after transfer)
      await projectGovernance.connect(investor2).castVote(proposalId, 1, 'For'); // 400 tokens (after transfer)

      const updatedProposal = await projectGovernance.getProposal(proposalId);
      expect(updatedProposal.forVotes).to.equal(ethers.parseEther('500')); // 100 + 400
    });
  });
});
