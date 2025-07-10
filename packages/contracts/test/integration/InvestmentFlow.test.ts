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
  ProjectTreasury,
  // ProjectGovernance,
} from '../../typechain-types';
import { time } from '@nomicfoundation/hardhat-network-helpers';

describe('Investment and Offering Flow', function () {
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
  let projectTreasuryContract: ProjectTreasury;
  // let projectGovernance: ProjectGovernance;

  let admin: SignerWithAddress;
  let operator: SignerWithAddress;
  let spv: SignerWithAddress;
  let investor1: SignerWithAddress;
  let investor2: SignerWithAddress;
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
  const TOKEN_PRICE = ethers.parseUnits('1', 14); // 0.0001 ETH per token (1 * 10^14 = 0.0001 * 10^18)

  beforeEach(async function () {
    [admin, operator, spv, investor1, investor2, treasury, kycIssuer] =
      await ethers.getSigners();

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
      admin.address, // will be updated
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

    // Verify investors through ERC-3643 IdentityRegistry
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

    // Create a project
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
    // projectGovernance = await ethers.getContractAt(
    //   'ProjectGovernance',
    //   project.governance
    // );

    // Finalize project setup
    await projectToken.connect(spv).setGovernance(project.governance);
    await projectToken.connect(spv).addAuthorizedMinter(project.offering);

    // Authorize offering contract to call registry functions
    await platformRegistry.connect(admin).authorizeFactory(project.offering);
  });

  describe('Investment Process', function () {
    it('Should allow verified investors to invest during offering period', async function () {
      // Move to offering start time
      const offeringInfo = await projectOffering.getOfferingInfo();
      await time.increaseTo(offeringInfo.startTime);

      const investmentAmount = ethers.parseEther('0.1'); // 0.1 ETH
      const expectedTokens =
        (investmentAmount / TOKEN_PRICE) * ethers.parseEther('1');

      // Investor 1 invests
      await expect(
        projectOffering.connect(investor1).invest({ value: investmentAmount })
      )
        .to.emit(projectOffering, 'InvestmentMade')
        .withArgs(investor1.address, investmentAmount, expectedTokens);

      // Check investor info
      const investorInfo = await projectOffering.getInvestorInfo(
        investor1.address
      );
      expect(investorInfo.totalInvested).to.equal(investmentAmount);
      expect(investorInfo.tokensAllocated).to.equal(expectedTokens);
      expect(investorInfo.hasInvested).to.be.true;

      // Check offering progress
      const progress = await projectOffering.getOfferingProgress();
      expect(progress[0]).to.equal(investmentAmount); // totalRaised
      expect(progress[1]).to.equal(1); // totalInvestors
    });

    it('Should reject investment from unauthorized investor', async function () {
      // Move to offering start time
      const offeringInfo = await projectOffering.getOfferingInfo();
      await time.increaseTo(offeringInfo.startTime);

      const investmentAmount = ethers.parseEther('1');

      // Try to invest from unverified investor
      await expect(
        projectOffering.connect(treasury).invest({ value: investmentAmount })
      ).to.be.revertedWith('Investor not verified');
    });

    it('Should reject investment below minimum amount', async function () {
      const offeringInfo = await projectOffering.getOfferingInfo();
      await time.increaseTo(offeringInfo.startTime);

      const tooSmallAmount = MIN_INVESTMENT / 2n;

      await expect(
        projectOffering.connect(investor1).invest({ value: tooSmallAmount })
      ).to.be.revertedWith('Below minimum investment');
    });

    it('Should reject investment above maximum amount', async function () {
      const offeringInfo = await projectOffering.getOfferingInfo();
      await time.increaseTo(offeringInfo.startTime);

      const tooLargeAmount = MAX_INVESTMENT + ethers.parseEther('1');

      await expect(
        projectOffering.connect(investor1).invest({ value: tooLargeAmount })
      ).to.be.revertedWith('Exceeds maximum investment');
    });

    it('Should reject investment before offering starts', async function () {
      const investmentAmount = ethers.parseEther('1');

      await expect(
        projectOffering.connect(investor1).invest({ value: investmentAmount })
      ).to.be.revertedWith('Offering not active');
    });

    it('Should reject investment after offering ends', async function () {
      const offeringInfo = await projectOffering.getOfferingInfo();
      await time.increaseTo(offeringInfo.endTime + 1n);

      const investmentAmount = ethers.parseEther('1');

      await expect(
        projectOffering.connect(investor1).invest({ value: investmentAmount })
      ).to.be.revertedWith('Offering not active');
    });

    it('Should handle multiple investors correctly', async function () {
      const offeringInfo = await projectOffering.getOfferingInfo();
      await time.increaseTo(offeringInfo.startTime);

      const investment1 = ethers.parseEther('0.05'); // 0.05 ETH
      const investment2 = ethers.parseEther('0.05'); // 0.05 ETH
      const expectedTokens1 =
        (investment1 / TOKEN_PRICE) * ethers.parseEther('1');
      const expectedTokens2 =
        (investment2 / TOKEN_PRICE) * ethers.parseEther('1');

      // Investor 1 invests
      await projectOffering.connect(investor1).invest({ value: investment1 });

      // Investor 2 invests
      await projectOffering.connect(investor2).invest({ value: investment2 });

      // Check total progress
      const progress = await projectOffering.getOfferingProgress();
      expect(progress[0]).to.equal(investment1 + investment2); // totalRaised
      expect(progress[1]).to.equal(2); // totalInvestors

      // Check individual investor info
      const investor1Info = await projectOffering.getInvestorInfo(
        investor1.address
      );
      expect(investor1Info.totalInvested).to.equal(investment1);
      expect(investor1Info.tokensAllocated).to.equal(expectedTokens1);

      const investor2Info = await projectOffering.getInvestorInfo(
        investor2.address
      );
      expect(investor2Info.totalInvested).to.equal(investment2);
      expect(investor2Info.tokensAllocated).to.equal(expectedTokens2);

      // Check investors list
      const allInvestors = await projectOffering.getAllInvestors();
      expect(allInvestors).to.deep.equal([
        investor1.address,
        investor2.address,
      ]);
    });
  });

  describe('Offering Finalization', function () {
    beforeEach(async function () {
      // Setup some investments
      const offeringInfo = await projectOffering.getOfferingInfo();
      await time.increaseTo(offeringInfo.startTime);

      // Multiple investments to reach soft cap (need 0.01 ETH total)
      await projectOffering
        .connect(investor1)
        .invest({ value: ethers.parseEther('0.01') });
      await projectOffering
        .connect(investor2)
        .invest({ value: ethers.parseEther('0.01') });
    });

    it('Should finalize offering after end time if soft cap is reached', async function () {
      const offeringInfo = await projectOffering.getOfferingInfo();
      await time.increaseTo(offeringInfo.endTime + 1n);

      // Check that soft cap is reached
      const progress = await projectOffering.getOfferingProgress();
      // console.log('Soft cap:', offeringInfo.softCap.toString());
      // console.log('Total raised:', progress[0].toString());
      expect(progress[0]).to.be.greaterThan(offeringInfo.softCap);

      await expect(projectOffering.connect(spv).finalizeOffering())
        .to.emit(projectOffering, 'OfferingFinalized')
        .withArgs(progress[0], progress[1]);

      const finalizedInfo = await projectOffering.getOfferingInfo();
      expect(finalizedInfo.isFinalized).to.be.true;
      expect(finalizedInfo.isActive).to.be.false;
    });

    it('Should transfer funds to project treasury after finalization', async function () {
      const offeringInfo = await projectOffering.getOfferingInfo();
      await time.increaseTo(offeringInfo.endTime + 1n);

      const initialTreasuryBalance = await ethers.provider.getBalance(
        await projectTreasuryContract.getAddress()
      );
      const totalRaised = await projectOffering.totalFundsRaised();

      await projectOffering.connect(spv).finalizeOffering();

      const finalTreasuryBalance = await ethers.provider.getBalance(
        await projectTreasuryContract.getAddress()
      );
      expect(finalTreasuryBalance - initialTreasuryBalance).to.equal(
        totalRaised
      );
    });

    it('Should auto-finalize when hard cap is reached', async function () {
      const offeringInfo = await projectOffering.getOfferingInfo();

      // Calculate remaining amount to reach hard cap
      const currentRaised = await projectOffering.totalFundsRaised();
      const remainingToHardCap = offeringInfo.hardCap - currentRaised;

      // Invest to reach hard cap
      await expect(
        projectOffering.connect(investor1).invest({ value: remainingToHardCap })
      ).to.emit(projectOffering, 'OfferingFinalized');

      const finalizedInfo = await projectOffering.getOfferingInfo();
      expect(finalizedInfo.isFinalized).to.be.true;
    });
  });

  describe('Token Claiming', function () {
    beforeEach(async function () {
      // Setup and finalize offering
      const offeringInfo = await projectOffering.getOfferingInfo();
      await time.increaseTo(offeringInfo.startTime);

      await projectOffering
        .connect(investor1)
        .invest({ value: ethers.parseEther('0.01') });
      await projectOffering
        .connect(investor2)
        .invest({ value: ethers.parseEther('0.01') });

      await time.increaseTo(offeringInfo.endTime + 1n);
      await projectOffering.connect(spv).finalizeOffering();
    });

    it('Should allow investors to claim tokens after offering finalization', async function () {
      const investor1Info = await projectOffering.getInvestorInfo(
        investor1.address
      );
      const expectedTokens = investor1Info.tokensAllocated;

      await expect(projectOffering.connect(investor1).claimTokens())
        .to.emit(projectOffering, 'TokensClaimed')
        .withArgs(investor1.address, expectedTokens);

      // Check token balance
      const tokenBalance = await projectToken.balanceOf(investor1.address);
      expect(tokenBalance).to.equal(expectedTokens);

      // Check claim status
      const updatedInfo = await projectOffering.getInvestorInfo(
        investor1.address
      );
      expect(updatedInfo.tokensClaimed).to.equal(expectedTokens);
    });

    it('Should reject token claiming before finalization', async function () {
      // Create a new project and investment without finalization
      await projectFactory
        .connect(spv)
        .createProject('Test Project 2', 'TP2', TOTAL_SUPPLY, TOKEN_PRICE, {
          value: LISTING_FEE,
        });

      const project2 = await projectFactory.getProject(2);
      const projectOffering2 = await ethers.getContractAt(
        'ProjectOffering',
        project2.offering
      );
      const projectToken2 = await ethers.getContractAt(
        'ProjectToken',
        project2.projectToken
      );

      await projectToken2.connect(spv).setGovernance(project2.governance);
      await projectToken2.connect(spv).addAuthorizedMinter(project2.offering);

      const offeringInfo2 = await projectOffering2.getOfferingInfo();
      await time.increaseTo(offeringInfo2.startTime);

      await projectOffering2
        .connect(investor1)
        .invest({ value: ethers.parseEther('0.01') });

      await expect(
        projectOffering2.connect(investor1).claimTokens()
      ).to.be.revertedWith('Offering still active');
    });

    it('Should reject double claiming', async function () {
      // First claim
      await projectOffering.connect(investor1).claimTokens();

      // Try to claim again
      await expect(
        projectOffering.connect(investor1).claimTokens()
      ).to.be.revertedWith('No tokens to claim');
    });
  });
});
