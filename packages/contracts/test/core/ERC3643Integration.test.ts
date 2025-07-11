import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import {
  ClaimTopicsRegistry,
  TrustedIssuersRegistry,
  IdentityRegistry,
  PlatformRegistry,
  PlatformTreasury,
  ProjectFactory,
  ProjectToken,
  ProjectOffering,
} from '../../typechain-types';

describe('ERC-3643 Integration Tests', function () {
  let admin: Signer;
  let spv: Signer;
  let investor1: Signer;
  let investor2: Signer;
  let platformCollector: Signer;
  let kycIssuer: Signer;

  let claimTopicsRegistry: ClaimTopicsRegistry;
  let trustedIssuersRegistry: TrustedIssuersRegistry;
  let identityRegistry: IdentityRegistry;
  let platformRegistry: PlatformRegistry;
  let platformTreasury: PlatformTreasury;
  let projectFactory: ProjectFactory;

  // Implementation contracts
  let projectTokenImpl: ProjectToken;
  let projectOfferingImpl: ProjectOffering;
  let projectTreasuryImpl: string; // Address of treasury implementation
  let projectGovernanceImpl: string; // Address of governance implementation

  const LISTING_FEE = ethers.parseEther('0.1');
  const MANAGEMENT_FEE_RATE = 500; // 5%
  const MIN_INVESTMENT = ethers.parseEther('0.01');
  const MAX_INVESTMENT = ethers.parseEther('10');

  beforeEach(async function () {
    [admin, spv, investor1, investor2, platformCollector, kycIssuer] =
      await ethers.getSigners();

    // Deploy ClaimTopicsRegistry
    const ClaimTopicsRegistryFactory = await ethers.getContractFactory(
      'ClaimTopicsRegistry'
    );
    claimTopicsRegistry = await ClaimTopicsRegistryFactory.deploy(
      await admin.getAddress()
    );
    await claimTopicsRegistry.waitForDeployment();

    // Deploy TrustedIssuersRegistry
    const TrustedIssuersRegistryFactory = await ethers.getContractFactory(
      'TrustedIssuersRegistry'
    );
    trustedIssuersRegistry = await TrustedIssuersRegistryFactory.deploy(
      await admin.getAddress(),
      await claimTopicsRegistry.getAddress()
    );
    await trustedIssuersRegistry.waitForDeployment();

    // Deploy IdentityRegistry
    const IdentityRegistryFactory =
      await ethers.getContractFactory('IdentityRegistry');
    identityRegistry = await IdentityRegistryFactory.deploy(
      await admin.getAddress(),
      await claimTopicsRegistry.getAddress(),
      await trustedIssuersRegistry.getAddress()
    );
    await identityRegistry.waitForDeployment();

    // Deploy PlatformTreasury first (with placeholder)
    const PlatformTreasuryFactory =
      await ethers.getContractFactory('PlatformTreasury');
    platformTreasury = await PlatformTreasuryFactory.deploy(
      await admin.getAddress(),
      await admin.getAddress(), // Placeholder - will update
      await platformCollector.getAddress(),
      ethers.parseEther('1') // Emergency threshold
    );
    await platformTreasury.waitForDeployment();

    // Deploy PlatformRegistry (keeping existing system for SPV management)
    const PlatformRegistryFactory =
      await ethers.getContractFactory('PlatformRegistry');
    platformRegistry = await PlatformRegistryFactory.deploy(
      await admin.getAddress(),
      await platformTreasury.getAddress(),
      LISTING_FEE,
      MANAGEMENT_FEE_RATE,
      MIN_INVESTMENT,
      MAX_INVESTMENT
    );
    await platformRegistry.waitForDeployment();

    // Update PlatformTreasury with correct registry address
    await platformTreasury
      .connect(admin)
      .updatePlatformRegistry(await platformRegistry.getAddress());

    // Deploy implementation contracts
    const ProjectTokenFactory = await ethers.getContractFactory('ProjectToken');
    projectTokenImpl = await ProjectTokenFactory.deploy();
    await projectTokenImpl.waitForDeployment();

    const ProjectOfferingFactory =
      await ethers.getContractFactory('ProjectOffering');
    projectOfferingImpl = await ProjectOfferingFactory.deploy();
    await projectOfferingImpl.waitForDeployment();

    // Deploy actual implementations for treasury and governance
    const ProjectTreasuryFactory =
      await ethers.getContractFactory('ProjectTreasury');
    const projectTreasuryImplContract = await ProjectTreasuryFactory.deploy();
    await projectTreasuryImplContract.waitForDeployment();
    projectTreasuryImpl = await projectTreasuryImplContract.getAddress();

    const ProjectGovernanceFactory =
      await ethers.getContractFactory('ProjectGovernance');
    const projectGovernanceImplContract =
      await ProjectGovernanceFactory.deploy();
    await projectGovernanceImplContract.waitForDeployment();
    projectGovernanceImpl = await projectGovernanceImplContract.getAddress();

    // Deploy ProjectFactory with IdentityRegistry
    const ProjectFactoryFactory =
      await ethers.getContractFactory('ProjectFactory');
    projectFactory = await ProjectFactoryFactory.deploy(
      await admin.getAddress(),
      await platformRegistry.getAddress(),
      await platformTreasury.getAddress(),
      await identityRegistry.getAddress(),
      await projectTokenImpl.getAddress(),
      await projectOfferingImpl.getAddress(),
      projectTreasuryImpl, // treasury implementation
      projectGovernanceImpl // governance implementation
    );
    await projectFactory.waitForDeployment();

    // Setup: Register SPV in platform registry
    await platformRegistry
      .connect(admin)
      .registerSPV(await spv.getAddress(), 'Test SPV', 'SPV-001');

    // Setup: Authorize factory in platform registry
    await platformRegistry
      .connect(admin)
      .authorizeFactory(await projectFactory.getAddress());

    // Setup: Add KYC issuer to trusted issuers registry
    const kycTopicId = await claimTopicsRegistry.KYC_APPROVED();
    await trustedIssuersRegistry
      .connect(admin)
      .addTrustedIssuer(
        await kycIssuer.getAddress(),
        'Platform KYC Provider',
        'Official KYC verification service',
        [kycTopicId]
      );

    // Grant operator role to KYC issuer in identity registry
    const OPERATOR_ROLE = await identityRegistry.OPERATOR_ROLE();
    await identityRegistry
      .connect(admin)
      .grantRole(OPERATOR_ROLE, await kycIssuer.getAddress());

    // Grant operator role to IdentityRegistry in trusted issuers registry (needed for recordClaimIssuance)
    const TRUSTED_ISSUERS_OPERATOR_ROLE =
      await trustedIssuersRegistry.OPERATOR_ROLE();
    await trustedIssuersRegistry
      .connect(admin)
      .grantRole(
        TRUSTED_ISSUERS_OPERATOR_ROLE,
        await identityRegistry.getAddress()
      );
  });

  describe('Identity and Claims Management', function () {
    it('Should allow KYC issuer to verify investors', async function () {
      const investor1Address = await investor1.getAddress();
      const kycTopicId = await claimTopicsRegistry.KYC_APPROVED();

      // Check initial state - investor should not be verified
      expect(await identityRegistry.isIdentityVerified(investor1Address)).to.be
        .false;

      // KYC issuer adds KYC claim for investor1
      await identityRegistry.connect(kycIssuer).addClaim(
        investor1Address,
        kycTopicId,
        ethers.toUtf8Bytes('KYC verification passed'),
        0 // No expiration
      );

      // Investor should now be verified
      expect(await identityRegistry.isIdentityVerified(investor1Address)).to.be
        .true;

      // Check claim details
      const claim = await identityRegistry.getClaim(
        investor1Address,
        kycTopicId
      );
      expect(claim.topicId).to.equal(kycTopicId);
      expect(claim.issuer).to.equal(await kycIssuer.getAddress());
      expect(claim.isActive).to.be.true;
    });

    it('Should not allow unauthorized addresses to issue claims', async function () {
      const investor1Address = await investor1.getAddress();
      const kycTopicId = await claimTopicsRegistry.KYC_APPROVED();

      // Try to add claim from non-authorized address (should fail)
      await expect(
        identityRegistry
          .connect(investor2)
          .addClaim(
            investor1Address,
            kycTopicId,
            ethers.toUtf8Bytes('Unauthorized KYC'),
            0
          )
      ).to.be.revertedWith('Not authorized issuer for this topic');
    });

    it('Should batch check multiple investor verifications', async function () {
      const investor1Address = await investor1.getAddress();
      const investor2Address = await investor2.getAddress();
      const kycTopicId = await claimTopicsRegistry.KYC_APPROVED();

      // Verify only investor1
      await identityRegistry
        .connect(kycIssuer)
        .addClaim(
          investor1Address,
          kycTopicId,
          ethers.toUtf8Bytes('KYC verification passed'),
          0
        );

      // Batch check both investors
      const addresses = [investor1Address, investor2Address];
      const verificationStatuses =
        await identityRegistry.batchCheckVerification(addresses);

      expect(verificationStatuses[0]).to.be.true; // investor1 verified
      expect(verificationStatuses[1]).to.be.false; // investor2 not verified
    });
  });

  describe('ERC-3643 Token Compliance', function () {
    let projectToken: ProjectToken;

    beforeEach(async function () {
      // Verify SPV is authorized before creating project
      const isAuthorized = await platformRegistry.isSPVAuthorized(
        await spv.getAddress()
      );
      if (!isAuthorized) {
        throw new Error('SPV not authorized for project creation');
      }

      // Create project token using the factory (proper way)
      const totalSupply = ethers.parseEther('1000');
      const tokenPrice = ethers.parseEther('0.001');

      // Create project through factory
      const tx = await projectFactory
        .connect(spv)
        .createProject(
          'Test Infrastructure Project',
          'TIP',
          totalSupply,
          tokenPrice,
          { value: LISTING_FEE }
        );

      const receipt = await tx.wait();
      const projectCreatedEvent = receipt?.logs.find(
        (log: any) => log.fragment && log.fragment.name === 'ProjectCreated'
      );

      if (!projectCreatedEvent || !('args' in projectCreatedEvent)) {
        throw new Error('ProjectCreated event not found');
      }

      const projectTokenAddress = (projectCreatedEvent as any).args[2]; // token address is third argument
      projectToken = await ethers.getContractAt(
        'ProjectToken',
        projectTokenAddress
      );

      // Enable transfers for testing
      await projectToken.connect(spv).enableTransfers(); // SPV is the owner
    });

    it('Should prevent transfers between unverified addresses', async function () {
      const investor1Address = await investor1.getAddress();
      const investor2Address = await investor2.getAddress();

      // Mint some tokens to investor1 (SPV as owner can mint)
      await projectToken
        .connect(spv)
        .addAuthorizedMinter(await spv.getAddress());
      await projectToken
        .connect(spv)
        .mint(investor1Address, ethers.parseEther('100'));

      // Try to transfer from unverified investor1 to unverified investor2 (should fail)
      await expect(
        projectToken
          .connect(investor1)
          .transfer(investor2Address, ethers.parseEther('10'))
      ).to.be.revertedWith('Sender not verified');
    });

    it('Should allow transfers between verified addresses', async function () {
      const investor1Address = await investor1.getAddress();
      const investor2Address = await investor2.getAddress();
      const kycTopicId = await claimTopicsRegistry.KYC_APPROVED();

      // Verify both investors
      await identityRegistry
        .connect(kycIssuer)
        .addClaim(
          investor1Address,
          kycTopicId,
          ethers.toUtf8Bytes('KYC verification passed'),
          0
        );

      await identityRegistry
        .connect(kycIssuer)
        .addClaim(
          investor2Address,
          kycTopicId,
          ethers.toUtf8Bytes('KYC verification passed'),
          0
        );

      // Mint some tokens to investor1 (SPV as owner can mint)
      await projectToken
        .connect(spv)
        .addAuthorizedMinter(await spv.getAddress());
      await projectToken
        .connect(spv)
        .mint(investor1Address, ethers.parseEther('100'));

      // Transfer should work now
      await expect(
        projectToken
          .connect(investor1)
          .transfer(investor2Address, ethers.parseEther('10'))
      ).to.not.be.reverted;

      // Check balances
      expect(await projectToken.balanceOf(investor2Address)).to.equal(
        ethers.parseEther('10')
      );
      expect(await projectToken.balanceOf(investor1Address)).to.equal(
        ethers.parseEther('90')
      );
    });

    it('Should report correct verification status via isVerified function', async function () {
      const investor1Address = await investor1.getAddress();
      const kycTopicId = await claimTopicsRegistry.KYC_APPROVED();

      // Initially not verified
      expect(await projectToken.isVerified(investor1Address)).to.be.false;

      // Verify investor
      await identityRegistry
        .connect(kycIssuer)
        .addClaim(
          investor1Address,
          kycTopicId,
          ethers.toUtf8Bytes('KYC verification passed'),
          0
        );

      // Should now be verified
      expect(await projectToken.isVerified(investor1Address)).to.be.true;
    });

    it('Should correctly check transfer eligibility via canTransfer function', async function () {
      const investor1Address = await investor1.getAddress();
      const investor2Address = await investor2.getAddress();
      const kycTopicId = await claimTopicsRegistry.KYC_APPROVED();

      // Both unverified - should not be able to transfer
      expect(
        await projectToken.canTransfer(
          investor1Address,
          investor2Address,
          ethers.parseEther('10')
        )
      ).to.be.false;

      // Verify investor1 only
      await identityRegistry
        .connect(kycIssuer)
        .addClaim(
          investor1Address,
          kycTopicId,
          ethers.toUtf8Bytes('KYC verification passed'),
          0
        );

      // Still should not be able to transfer (receiver not verified)
      expect(
        await projectToken.canTransfer(
          investor1Address,
          investor2Address,
          ethers.parseEther('10')
        )
      ).to.be.false;

      // Verify investor2 as well
      await identityRegistry
        .connect(kycIssuer)
        .addClaim(
          investor2Address,
          kycTopicId,
          ethers.toUtf8Bytes('KYC verification passed'),
          0
        );

      // Now transfer should be allowed
      expect(
        await projectToken.canTransfer(
          investor1Address,
          investor2Address,
          ethers.parseEther('10')
        )
      ).to.be.true;
    });
  });

  describe('Integration with ProjectOffering', function () {
    it('Should allow verified investors to participate in offerings', async function () {
      // This test would be implemented once we have complete ProjectOffering integration
      // For now, we'll just verify that the identity registry integration exists
      expect(await projectFactory.getIdentityRegistry()).to.equal(
        await identityRegistry.getAddress()
      );
    });
  });
});
