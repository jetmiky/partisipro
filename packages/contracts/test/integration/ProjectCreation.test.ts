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
  ProjectGovernance,
} from '../../typechain-types';

describe('Project Creation Integration', function () {
  // ERC-3643 Infrastructure contracts
  let claimTopicsRegistry: ClaimTopicsRegistry;
  let trustedIssuersRegistry: TrustedIssuersRegistry;
  let identityRegistry: IdentityRegistry;

  let platformRegistry: PlatformRegistry;
  let platformTreasury: PlatformTreasury;
  let projectFactory: ProjectFactory;

  // Implementation contracts
  let projectTokenImpl: ProjectToken;
  let projectOfferingImpl: ProjectOffering;
  let projectTreasuryImpl: ProjectTreasury;
  let projectGovernanceImpl: ProjectGovernance;

  let admin: SignerWithAddress;
  let operator: SignerWithAddress;
  let spv: SignerWithAddress;
  let investor1: SignerWithAddress;
  let investor2: SignerWithAddress;
  let treasury: SignerWithAddress;

  const LISTING_FEE = ethers.parseEther('0.1');
  const MANAGEMENT_FEE_RATE = 500; // 5%
  const MIN_INVESTMENT = ethers.parseEther('0.01');
  const MAX_INVESTMENT = ethers.parseEther('10');
  const EMERGENCY_THRESHOLD = ethers.parseEther('1');

  // Project parameters
  const PROJECT_NAME = 'Jakarta Toll Road';
  const PROJECT_SYMBOL = 'JTR';
  const TOTAL_SUPPLY = ethers.parseEther('1000000'); // 1M tokens
  const TOKEN_PRICE = ethers.parseEther('0.001'); // 0.001 ETH per token

  beforeEach(async function () {
    [admin, operator, spv, investor1, investor2, treasury] =
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

    // Update treasury with registry
    await platformTreasury.updatePlatformRegistry(
      await platformRegistry.getAddress()
    );

    // Deploy implementation contracts
    const ProjectToken = await ethers.getContractFactory('ProjectToken');
    projectTokenImpl = await ProjectToken.deploy();

    const ProjectOffering = await ethers.getContractFactory('ProjectOffering');
    projectOfferingImpl = await ProjectOffering.deploy();

    const ProjectTreasury = await ethers.getContractFactory('ProjectTreasury');
    projectTreasuryImpl = await ProjectTreasury.deploy();

    const ProjectGovernance =
      await ethers.getContractFactory('ProjectGovernance');
    projectGovernanceImpl = await ProjectGovernance.deploy();

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
    await platformRegistry.connect(operator).verifyInvestor(investor1.address);
    await platformRegistry.connect(operator).verifyInvestor(investor2.address);
  });

  describe('Complete Project Creation Flow', function () {
    it('Should create a complete project with all contracts initialized', async function () {
      // Create project
      const tx = await projectFactory
        .connect(spv)
        .createProject(
          PROJECT_NAME,
          PROJECT_SYMBOL,
          TOTAL_SUPPLY,
          TOKEN_PRICE,
          { value: LISTING_FEE }
        );

      const receipt = await tx.wait();
      const projectCreatedEvent = receipt?.logs.find(
        log =>
          projectFactory.interface.parseLog(log as any)?.name ===
          'ProjectCreated'
      );

      expect(projectCreatedEvent).to.not.be.undefined;

      const parsedEvent = projectFactory.interface.parseLog(
        projectCreatedEvent as any
      );
      const projectId = parsedEvent?.args[0];

      expect(projectId).to.equal(1);

      // Get project details
      const project = await projectFactory.getProject(projectId);

      // Finalize project setup - SPV calls contracts directly
      const projectTokenContract = await ethers.getContractAt(
        'ProjectToken',
        project.projectToken
      );
      await projectTokenContract.connect(spv).setGovernance(project.governance);
      await projectTokenContract
        .connect(spv)
        .addAuthorizedMinter(project.offering);

      expect(project.creator).to.equal(spv.address);
      expect(project.isActive).to.be.true;
      expect(project.projectToken).to.not.equal(ethers.ZeroAddress);
      expect(project.offering).to.not.equal(ethers.ZeroAddress);
      expect(project.treasury).to.not.equal(ethers.ZeroAddress);
      expect(project.governance).to.not.equal(ethers.ZeroAddress);

      // Verify token contract is initialized correctly
      expect(await projectTokenContract.name()).to.equal(PROJECT_NAME);
      expect(await projectTokenContract.symbol()).to.equal(PROJECT_SYMBOL);
      expect(await projectTokenContract.totalSupply()).to.equal(TOTAL_SUPPLY);
      expect(await projectTokenContract.owner()).to.equal(spv.address);
      expect(await projectTokenContract.treasury()).to.equal(project.treasury);
      expect(await projectTokenContract.offering()).to.equal(project.offering);
      expect(await projectTokenContract.governance()).to.equal(
        project.governance
      );

      // Verify offering contract is initialized correctly
      const projectOffering = await ethers.getContractAt(
        'ProjectOffering',
        project.offering
      );
      const offeringInfo = await projectOffering.getOfferingInfo();
      expect(offeringInfo.tokenPrice).to.equal(TOKEN_PRICE);
      expect(offeringInfo.totalSupply).to.equal(TOTAL_SUPPLY);
      expect(await projectOffering.owner()).to.equal(spv.address);

      // Verify treasury contract is initialized correctly
      const projectTreasuryContract = await ethers.getContractAt(
        'ProjectTreasury',
        project.treasury
      );
      expect(await projectTreasuryContract.projectToken()).to.equal(
        project.projectToken
      );
      expect(await projectTreasuryContract.owner()).to.equal(spv.address);

      // Verify governance contract is initialized correctly
      const projectGovernance = await ethers.getContractAt(
        'ProjectGovernance',
        project.governance
      );
      expect(await projectGovernance.projectToken()).to.equal(
        project.projectToken
      );
      expect(await projectGovernance.owner()).to.equal(spv.address);

      // Verify offering contract has minting permission
      expect(await projectTokenContract.authorizedMinters(project.offering)).to
        .be.true;

      // Verify project info
      const projectInfo = await projectTokenContract.getProjectInfo();
      expect(projectInfo.projectName).to.equal(PROJECT_NAME);
      expect(projectInfo.projectValue).to.equal(TOTAL_SUPPLY * TOKEN_PRICE);
    });

    it('Should collect listing fee correctly', async function () {
      const initialTreasuryBalance = await ethers.provider.getBalance(
        await platformTreasury.getAddress()
      );

      await projectFactory
        .connect(spv)
        .createProject(
          PROJECT_NAME,
          PROJECT_SYMBOL,
          TOTAL_SUPPLY,
          TOKEN_PRICE,
          { value: LISTING_FEE }
        );

      // Finalize project setup
      const project = await projectFactory.getProject(1);
      const projectToken = await ethers.getContractAt(
        'ProjectToken',
        project.projectToken
      );
      await projectToken.connect(spv).setGovernance(project.governance);
      await projectToken.connect(spv).addAuthorizedMinter(project.offering);

      const finalTreasuryBalance = await ethers.provider.getBalance(
        await platformTreasury.getAddress()
      );
      expect(finalTreasuryBalance - initialTreasuryBalance).to.equal(
        LISTING_FEE
      );

      const ethFees = await platformTreasury.getEthFees();
      expect(ethFees.listingFees).to.equal(LISTING_FEE);
      expect(ethFees.totalCollected).to.equal(LISTING_FEE);
    });

    it('Should increment SPV project count', async function () {
      const initialSPVInfo = await platformRegistry.getSPVInfo(spv.address);
      expect(initialSPVInfo.projectsCreated).to.equal(0);

      await projectFactory
        .connect(spv)
        .createProject(
          PROJECT_NAME,
          PROJECT_SYMBOL,
          TOTAL_SUPPLY,
          TOKEN_PRICE,
          { value: LISTING_FEE }
        );

      // Finalize project setup
      const project = await projectFactory.getProject(1);
      const projectToken = await ethers.getContractAt(
        'ProjectToken',
        project.projectToken
      );
      await projectToken.connect(spv).setGovernance(project.governance);
      await projectToken.connect(spv).addAuthorizedMinter(project.offering);

      const finalSPVInfo = await platformRegistry.getSPVInfo(spv.address);
      expect(finalSPVInfo.projectsCreated).to.equal(1);
    });

    it('Should reject project creation from unauthorized SPV', async function () {
      await expect(
        projectFactory
          .connect(investor1)
          .createProject(
            PROJECT_NAME,
            PROJECT_SYMBOL,
            TOTAL_SUPPLY,
            TOKEN_PRICE,
            { value: LISTING_FEE }
          )
      ).to.be.revertedWith('Not authorized SPV');
    });

    it('Should reject project creation with insufficient listing fee', async function () {
      await expect(
        projectFactory
          .connect(spv)
          .createProject(
            PROJECT_NAME,
            PROJECT_SYMBOL,
            TOTAL_SUPPLY,
            TOKEN_PRICE,
            { value: LISTING_FEE / 2n }
          )
      ).to.be.revertedWith('Insufficient listing fee');
    });

    it('Should create multiple projects correctly', async function () {
      // Create first project
      await projectFactory
        .connect(spv)
        .createProject('Project 1', 'P1', TOTAL_SUPPLY, TOKEN_PRICE, {
          value: LISTING_FEE,
        });
      // Finalize first project
      const project1 = await projectFactory.getProject(1);
      const projectToken1 = await ethers.getContractAt(
        'ProjectToken',
        project1.projectToken
      );
      await projectToken1.connect(spv).setGovernance(project1.governance);
      await projectToken1.connect(spv).addAuthorizedMinter(project1.offering);

      // Create second project
      await projectFactory
        .connect(spv)
        .createProject('Project 2', 'P2', TOTAL_SUPPLY, TOKEN_PRICE, {
          value: LISTING_FEE,
        });
      // Finalize second project
      const project2 = await projectFactory.getProject(2);
      const projectToken2 = await ethers.getContractAt(
        'ProjectToken',
        project2.projectToken
      );
      await projectToken2.connect(spv).setGovernance(project2.governance);
      await projectToken2.connect(spv).addAuthorizedMinter(project2.offering);

      // Verify both projects exist
      const projectDetails1 = await projectFactory.getProject(1);
      const projectDetails2 = await projectFactory.getProject(2);

      expect(projectDetails1.creator).to.equal(spv.address);
      expect(projectDetails2.creator).to.equal(spv.address);
      expect(projectDetails1.projectToken).to.not.equal(
        projectDetails2.projectToken
      );
      expect(projectDetails1.offering).to.not.equal(projectDetails2.offering);

      // Verify SPV project count
      const spvInfo = await platformRegistry.getSPVInfo(spv.address);
      expect(spvInfo.projectsCreated).to.equal(2);

      // Verify SPV projects list
      const spvProjects = await projectFactory.getCreatorProjects(spv.address);
      expect(spvProjects).to.deep.equal([1n, 2n]);
    });
  });

  describe('Gas Usage Analysis', function () {
    it('Should measure gas usage for project creation', async function () {
      const tx1 = await projectFactory
        .connect(spv)
        .createProject(
          PROJECT_NAME,
          PROJECT_SYMBOL,
          TOTAL_SUPPLY,
          TOKEN_PRICE,
          { value: LISTING_FEE }
        );

      const receipt1 = await tx1.wait();
      const gasUsed1 = receipt1?.gasUsed;

      // Finalize project setup
      const project = await projectFactory.getProject(1);
      const projectToken = await ethers.getContractAt(
        'ProjectToken',
        project.projectToken
      );
      const tx2 = await projectToken
        .connect(spv)
        .setGovernance(project.governance);
      const receipt2 = await tx2.wait();
      const gasUsed2 = receipt2?.gasUsed;

      const tx3 = await projectToken
        .connect(spv)
        .addAuthorizedMinter(project.offering);
      const receipt3 = await tx3.wait();
      const gasUsed3 = receipt3?.gasUsed;

      const totalGasUsed =
        (gasUsed1 || 0n) + (gasUsed2 || 0n) + (gasUsed3 || 0n);

      // console.log(`Project creation gas used: ${gasUsed1?.toString()}`);
      // console.log(`Set governance gas used: ${gasUsed2?.toString()}`);
      // console.log(`Add minter gas used: ${gasUsed3?.toString()}`);
      // console.log(`Total gas used: ${totalGasUsed.toString()}`);

      // Should be under 2M gas (reasonable for deploying 4 upgradeable contracts)
      expect(totalGasUsed).to.be.lessThan(2000000);
    });
  });
});
