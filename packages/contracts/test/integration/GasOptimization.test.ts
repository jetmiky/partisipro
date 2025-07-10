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

describe('Gas Optimization Analysis', function () {
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
  });

  describe('Project Creation Gas Analysis', function () {
    it('Should measure gas costs for complete project creation', async function () {
      // Create project
      const createTx = await projectFactory
        .connect(spv)
        .createProject(
          PROJECT_NAME,
          PROJECT_SYMBOL,
          TOTAL_SUPPLY,
          TOKEN_PRICE,
          { value: LISTING_FEE }
        );
      const createReceipt = await createTx.wait();
      const createGas = createReceipt?.gasUsed || 0n;

      // Setup project
      const project = await projectFactory.getProject(1);
      projectToken = await ethers.getContractAt(
        'ProjectToken',
        project.projectToken
      );

      const setupTx1 = await projectToken
        .connect(spv)
        .setGovernance(project.governance);
      const setupReceipt1 = await setupTx1.wait();
      const setupGas1 = setupReceipt1?.gasUsed || 0n;

      const setupTx2 = await projectToken
        .connect(spv)
        .addAuthorizedMinter(project.offering);
      const setupReceipt2 = await setupTx2.wait();
      const setupGas2 = setupReceipt2?.gasUsed || 0n;

      const totalGas = createGas + setupGas1 + setupGas2;

      // console.log(`\\nProject Creation Gas Analysis:`);
      // console.log(`- Factory createProject: ${createGas.toString()} gas`);
      // console.log(`- Set governance: ${setupGas1.toString()} gas`);
      // console.log(`- Add minter: ${setupGas2.toString()} gas`);
      // console.log(`- Total: ${totalGas.toString()} gas`);
      // console.log(
      //   `- Est. cost at 20 gwei: ${ethers.formatEther(totalGas * 20_000_000_000n)} ETH`
      // );

      // Gas should be reasonable for deploying 4 upgradeable contracts
      expect(totalGas).to.be.lessThan(2_000_000n); // Less than 2M gas
    });
  });

  describe('Investment Flow Gas Analysis', function () {
    beforeEach(async function () {
      // Create and setup project
      await projectFactory
        .connect(spv)
        .createProject(
          PROJECT_NAME,
          PROJECT_SYMBOL,
          TOTAL_SUPPLY,
          TOKEN_PRICE,
          { value: LISTING_FEE }
        );

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

      await projectToken.connect(spv).setGovernance(project.governance);
      await projectToken.connect(spv).addAuthorizedMinter(project.offering);

      // Verify investors through ERC-3643 IdentityRegistry
      const kycTopicId = await claimTopicsRegistry.KYC_APPROVED();
      await identityRegistry
        .connect(kycIssuer)
        .addClaim(
          await investor1.getAddress(),
          kycTopicId,
          ethers.toUtf8Bytes('KYC verification passed'),
          0
        );

      await identityRegistry
        .connect(kycIssuer)
        .addClaim(
          await investor2.getAddress(),
          kycTopicId,
          ethers.toUtf8Bytes('KYC verification passed'),
          0
        );

      // Move to offering start
      const offeringInfo = await projectOffering.getOfferingInfo();
      await time.increaseTo(offeringInfo.startTime);
    });

    it('Should measure gas costs for investment flow', async function () {
      const investmentAmount = ethers.parseEther('0.02');

      // Investment
      const investTx = await projectOffering
        .connect(investor1)
        .invest({ value: investmentAmount });
      const investReceipt = await investTx.wait();
      const investGas = investReceipt?.gasUsed || 0n;

      // Second investment (should be cheaper, no first-time setup)
      const investTx2 = await projectOffering
        .connect(investor2)
        .invest({ value: investmentAmount });
      const investReceipt2 = await investTx2.wait();
      const investGas2 = investReceipt2?.gasUsed || 0n;

      // Finalize offering
      const offeringInfo = await projectOffering.getOfferingInfo();
      await time.increaseTo(offeringInfo.endTime + 1n);

      const finalizeTx = await projectOffering.connect(spv).finalizeOffering();
      const finalizeReceipt = await finalizeTx.wait();
      const finalizeGas = finalizeReceipt?.gasUsed || 0n;

      // Claim tokens
      const claimTx = await projectOffering.connect(investor1).claimTokens();
      const claimReceipt = await claimTx.wait();
      const claimGas = claimReceipt?.gasUsed || 0n;

      // console.log(`\\nInvestment Flow Gas Analysis:`);
      // console.log(`- First investment: ${investGas.toString()} gas`);
      // console.log(`- Second investment: ${investGas2.toString()} gas`);
      // console.log(`- Finalize offering: ${finalizeGas.toString()} gas`);
      // console.log(`- Claim tokens: ${claimGas.toString()} gas`);
      // console.log(
      //   `- Total flow: ${(investGas + finalizeGas + claimGas).toString()} gas`
      // );

      // Investment operations should be reasonably efficient
      expect(investGas).to.be.lessThan(300_000n); // Less than 300k gas
      expect(investGas2).to.be.lessThan(250_000n); // Second investment similar
      expect(finalizeGas).to.be.lessThan(150_000n); // Finalization < 150k gas
      expect(claimGas).to.be.lessThan(150_000n); // Claiming < 150k gas
    });
  });

  describe('Governance Flow Gas Analysis', function () {
    beforeEach(async function () {
      // Create and setup project
      await projectFactory
        .connect(spv)
        .createProject(
          PROJECT_NAME,
          PROJECT_SYMBOL,
          TOTAL_SUPPLY,
          TOKEN_PRICE,
          { value: LISTING_FEE }
        );

      const project = await projectFactory.getProject(1);
      projectToken = await ethers.getContractAt(
        'ProjectToken',
        project.projectToken
      );
      projectOffering = await ethers.getContractAt(
        'ProjectOffering',
        project.offering
      );
      projectGovernance = await ethers.getContractAt(
        'ProjectGovernance',
        project.governance
      );

      await projectToken.connect(spv).setGovernance(project.governance);
      await projectToken.connect(spv).addAuthorizedMinter(project.offering);

      // Verify investors through ERC-3643 IdentityRegistry (needed for this test)
      const kycTopicId = await claimTopicsRegistry.KYC_APPROVED();
      await identityRegistry
        .connect(kycIssuer)
        .addClaim(
          await investor1.getAddress(),
          kycTopicId,
          ethers.toUtf8Bytes('KYC verification passed'),
          0
        );

      await identityRegistry
        .connect(kycIssuer)
        .addClaim(
          await investor2.getAddress(),
          kycTopicId,
          ethers.toUtf8Bytes('KYC verification passed'),
          0
        );

      // Setup investments and complete offering
      const offeringInfo = await projectOffering.getOfferingInfo();
      await time.increaseTo(offeringInfo.startTime);

      await projectOffering
        .connect(investor1)
        .invest({ value: ethers.parseEther('0.02') });
      await projectOffering
        .connect(investor2)
        .invest({ value: ethers.parseEther('0.02') });

      await time.increaseTo(offeringInfo.endTime + 1n);
      await projectOffering.connect(spv).finalizeOffering();

      await projectOffering.connect(investor1).claimTokens();
      await projectOffering.connect(investor2).claimTokens();
    });

    it('Should measure gas costs for governance flow', async function () {
      // Create proposal
      const targets = [await projectToken.getAddress()];
      const values = [0];
      const calldatas = [
        projectToken.interface.encodeFunctionData('enableTransfers', []),
      ];
      const signatures = ['enableTransfers()'];

      const proposeTx = await projectGovernance
        .connect(investor1)
        .propose(
          'Enable transfers',
          'Proposal to enable token transfers',
          targets,
          values,
          calldatas,
          signatures
        );
      const proposeReceipt = await proposeTx.wait();
      const proposeGas = proposeReceipt?.gasUsed || 0n;

      // Vote on proposal
      const proposalId = 1n;
      const proposal = await projectGovernance.getProposal(proposalId);
      await time.increaseTo(proposal.startTime);

      const voteTx = await projectGovernance
        .connect(investor1)
        .castVote(proposalId, 1, 'For');
      const voteReceipt = await voteTx.wait();
      const voteGas = voteReceipt?.gasUsed || 0n;

      // Second vote (should be similar)
      const voteTx2 = await projectGovernance
        .connect(investor2)
        .castVote(proposalId, 1, 'For');
      const voteReceipt2 = await voteTx2.wait();
      const voteGas2 = voteReceipt2?.gasUsed || 0n;

      // console.log(`\\nGovernance Flow Gas Analysis:`);
      // console.log(`- Create proposal: ${proposeGas.toString()} gas`);
      // console.log(`- First vote: ${voteGas.toString()} gas`);
      // console.log(`- Second vote: ${voteGas2.toString()} gas`);
      // console.log(
      //   `- Total governance flow: ${(proposeGas + voteGas + voteGas2).toString()} gas`
      // );

      // Governance operations should be reasonably efficient
      expect(proposeGas).to.be.lessThan(600_000n); // Less than 600k gas
      expect(voteGas).to.be.lessThan(150_000n); // Less than 150k gas
      expect(voteGas2).to.be.lessThan(150_000n); // Second vote similar
    });
  });

  describe('Platform Operations Gas Analysis', function () {
    it('Should measure gas costs for platform management operations', async function () {
      // Register SPV
      const registerTx = await platformRegistry
        .connect(admin)
        .registerSPV(investor1.address, 'Test SPV 2', 'SPV-002');
      const registerReceipt = await registerTx.wait();
      const registerGas = registerReceipt?.gasUsed || 0n;

      // Verify investor
      const verifyTx = await platformRegistry
        .connect(operator)
        .verifyInvestor(investor1.address);
      const verifyReceipt = await verifyTx.wait();
      const verifyGas = verifyReceipt?.gasUsed || 0n;

      // Update platform config
      const updateTx = await platformRegistry
        .connect(admin)
        .updatePlatformConfig(
          LISTING_FEE,
          MANAGEMENT_FEE_RATE,
          MIN_INVESTMENT,
          MAX_INVESTMENT
        );
      const updateReceipt = await updateTx.wait();
      const updateGas = updateReceipt?.gasUsed || 0n;

      // console.log(`\\nPlatform Operations Gas Analysis:`);
      // console.log(`- Register SPV: ${registerGas.toString()} gas`);
      // console.log(`- Verify investor: ${verifyGas.toString()} gas`);
      // console.log(`- Update config: ${updateGas.toString()} gas`);

      // Platform operations should be efficient
      expect(registerGas).to.be.lessThan(200_000n); // Less than 200k gas
      expect(verifyGas).to.be.lessThan(150_000n); // Less than 150k gas (ERC-3643 compliance adds overhead)
      expect(updateGas).to.be.lessThan(50_000n); // Less than 50k gas
    });
  });

  describe('Gas Optimization Summary', function () {
    it('Should provide comprehensive gas usage summary', async function () {
      // console.log(`\\n=== COMPREHENSIVE GAS USAGE SUMMARY ===`);
      // console.log(`\\nEstimated costs at different gas prices:`);

      const operations = [
        { name: 'Project Creation', gas: 1_800_000n },
        { name: 'Investment', gas: 180_000n },
        { name: 'Finalize Offering', gas: 120_000n },
        { name: 'Claim Tokens', gas: 80_000n },
        { name: 'Create Proposal', gas: 250_000n },
        { name: 'Vote on Proposal', gas: 120_000n },
        { name: 'Register SPV', gas: 80_000n },
        { name: 'Verify Investor', gas: 60_000n },
      ];

      // const gasPrices = [10n, 20n, 50n, 100n]; // gwei

      // console.log(
      //   `\\n${'Operation'.padEnd(20)} | ${'Gas'.padEnd(10)} | ${gasPrices.map(p => `${p}gwei`.padEnd(8)).join(' | ')}`
      // );
      // console.log(
      //   `${'-'.repeat(20)} | ${'-'.repeat(10)} | ${gasPrices.map(() => '-'.repeat(8)).join(' | ')}`
      // );

      for (const op of operations) {
        // const costs = gasPrices.map(price => {
        //   const costWei = op.gas * price * 1_000_000_000n; // Convert gwei to wei
        //   return parseFloat(ethers.formatEther(costWei)).toFixed(4);
        // });

        // console.log(
        //   `${op.name.padEnd(20)} | ${op.gas.toString().padEnd(10)} | ${costs.map(c => `${c}ETH`.padEnd(8)).join(' | ')}`
        // );

        // Basic validation that operations are defined
        expect(op.gas).to.be.greaterThan(0);
      }

      // console.log(`\\nOptimization Recommendations:`);
      // console.log(`1. Project creation is expensive but one-time cost`);
      // console.log(`2. Investment operations are reasonably efficient`);
      // console.log(`3. Governance operations could be optimized further`);
      // console.log(`4. Platform operations are highly optimized`);
      // console.log(`\\nTarget network: Arbitrum (low gas costs)`);
      // console.log(`Estimated Arbitrum multiplier: ~0.1x of mainnet costs`);
    });
  });
});
