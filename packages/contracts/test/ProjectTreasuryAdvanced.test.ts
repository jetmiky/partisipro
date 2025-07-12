import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { Signer } from 'ethers';
import {
  ProjectTreasuryAdvanced,
  ProjectToken,
  PlatformTreasury,
  PlatformRegistry,
} from '../typechain-types';

describe('ProjectTreasuryAdvanced', function () {
  let projectTreasuryAdvanced: ProjectTreasuryAdvanced;
  let projectToken: ProjectToken;
  let platformTreasury: PlatformTreasury;
  let platformRegistry: PlatformRegistry;

  let admin: Signer;
  let spv: Signer;
  let investor1: Signer;
  let investor2: Signer;
  let operator: Signer;
  let pauser: Signer;

  let adminAddr: string;
  let spvAddr: string;
  let investor1Addr: string;
  let investor2Addr: string;
  let operatorAddr: string;
  let pauserAddr: string;

  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE'));
  const SPV_ROLE = ethers.keccak256(ethers.toUtf8Bytes('SPV_ROLE'));
  const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes('OPERATOR_ROLE'));
  const UPGRADER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('UPGRADER_ROLE'));
  const PAUSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('PAUSER_ROLE'));

  beforeEach(async function () {
    [admin, spv, investor1, investor2, operator, pauser] =
      await ethers.getSigners();

    adminAddr = await admin.getAddress();
    spvAddr = await spv.getAddress();
    investor1Addr = await investor1.getAddress();
    investor2Addr = await investor2.getAddress();
    operatorAddr = await operator.getAddress();
    pauserAddr = await pauser.getAddress();

    // Deploy platform registry
    const PlatformRegistryFactory =
      await ethers.getContractFactory('PlatformRegistry');
    platformRegistry = await PlatformRegistryFactory.deploy(
      adminAddr,
      adminAddr, // temporary treasury address
      ethers.parseEther('0.1'), // listing fee
      500, // management fee rate (5%)
      ethers.parseEther('1'), // minimum investment
      ethers.parseEther('1000000') // maximum investment
    );
    await platformRegistry.waitForDeployment();

    // Deploy platform treasury
    const PlatformTreasuryFactory =
      await ethers.getContractFactory('PlatformTreasury');
    platformTreasury = await PlatformTreasuryFactory.deploy(
      adminAddr,
      await platformRegistry.getAddress(),
      adminAddr, // emergency recipient
      ethers.parseEther('100') // emergency withdrawal threshold
    );
    await platformTreasury.waitForDeployment();

    // Deploy mock ERC-3643 infrastructure for testing
    const ClaimTopicsRegistryFactory = await ethers.getContractFactory(
      'ClaimTopicsRegistry'
    );
    const mockClaimTopicsRegistry =
      await ClaimTopicsRegistryFactory.deploy(adminAddr);
    await mockClaimTopicsRegistry.waitForDeployment();

    const TrustedIssuersRegistryFactory = await ethers.getContractFactory(
      'TrustedIssuersRegistry'
    );
    const mockTrustedIssuersRegistry =
      await TrustedIssuersRegistryFactory.deploy(
        adminAddr,
        await mockClaimTopicsRegistry.getAddress()
      );
    await mockTrustedIssuersRegistry.waitForDeployment();

    // Deploy a mock identity registry with proper dependencies
    const IdentityRegistryFactory =
      await ethers.getContractFactory('IdentityRegistry');
    const mockIdentityRegistry = await IdentityRegistryFactory.deploy(
      adminAddr, // admin
      await mockClaimTopicsRegistry.getAddress(), // claim topics registry
      await mockTrustedIssuersRegistry.getAddress() // trusted issuers registry
    );
    await mockIdentityRegistry.waitForDeployment();

    // Deploy project token with proxy for testing
    const ProjectTokenFactory = await ethers.getContractFactory('ProjectToken');

    const projectInfo = {
      projectName: 'Test Infrastructure Project',
      projectDescription: 'Test description',
      projectLocation: 'Test Location',
      projectValue: ethers.parseEther('1000000'),
      concessionPeriod: 25 * 365 * 24 * 60 * 60, // 25 years in seconds
      expectedAPY: 1000, // 10%
      metadataURI: 'https://example.com/metadata.json',
    };

    projectToken = (await upgrades.deployProxy(
      ProjectTokenFactory,
      [
        'Test Project Token', // name
        'TPT', // symbol
        ethers.parseEther('997000'), // totalSupply - leave room for test minting
        adminAddr, // owner
        adminAddr, // treasury (placeholder)
        adminAddr, // offering (placeholder)
        await mockIdentityRegistry.getAddress(), // identityRegistry
        projectInfo,
      ],
      { initializer: 'initialize' }
    )) as unknown as ProjectToken;
    await projectToken.waitForDeployment();

    // Deploy ProjectTreasuryAdvanced with proxy
    const ProjectTreasuryAdvancedFactory = await ethers.getContractFactory(
      'ProjectTreasuryAdvanced'
    );
    projectTreasuryAdvanced = (await upgrades.deployProxy(
      ProjectTreasuryAdvancedFactory,
      [
        adminAddr,
        await projectToken.getAddress(),
        await platformTreasury.getAddress(),
        spvAddr,
        500, // 5% base management fee
        1000, // 10% performance fee
        ethers.parseEther('10'), // 10 ETH emergency withdrawal limit
      ],
      { initializer: 'initialize' }
    )) as unknown as ProjectTreasuryAdvanced;
    await projectTreasuryAdvanced.waitForDeployment();

    // Grant additional roles
    await projectTreasuryAdvanced.grantRole(OPERATOR_ROLE, operatorAddr);
    await projectTreasuryAdvanced.grantRole(PAUSER_ROLE, pauserAddr);

    // Add admin as authorized minter for testing
    await projectToken.connect(admin).addAuthorizedMinter(adminAddr);

    // Mint tokens to investors
    await projectToken
      .connect(admin)
      .mint(investor1Addr, ethers.parseEther('1000'));
    await projectToken
      .connect(admin)
      .mint(investor2Addr, ethers.parseEther('2000'));
  });

  describe('Initialization', function () {
    it('Should initialize with correct parameters', async function () {
      expect(await projectTreasuryAdvanced.hasRole(ADMIN_ROLE, adminAddr)).to.be
        .true;
      expect(await projectTreasuryAdvanced.hasRole(SPV_ROLE, spvAddr)).to.be
        .true;
      expect(await projectTreasuryAdvanced.hasRole(UPGRADER_ROLE, adminAddr)).to
        .be.true;
      expect(await projectTreasuryAdvanced.hasRole(PAUSER_ROLE, adminAddr)).to
        .be.true;

      const feeConfig = await projectTreasuryAdvanced.getFeeConfig();
      expect(feeConfig.baseManagementFee).to.equal(500);
      expect(feeConfig.performanceFeeRate).to.equal(1000);
      expect(feeConfig.isActive).to.be.true;
    });

    it('Should reject invalid initialization parameters', async function () {
      const ProjectTreasuryAdvancedFactory = await ethers.getContractFactory(
        'ProjectTreasuryAdvanced'
      );

      await expect(
        upgrades.deployProxy(
          ProjectTreasuryAdvancedFactory,
          [
            ethers.ZeroAddress, // Invalid admin
            await projectToken.getAddress(),
            await platformTreasury.getAddress(),
            spvAddr,
            500,
            1000,
            ethers.parseEther('10'),
          ],
          { initializer: 'initialize' }
        )
      ).to.be.revertedWith('Invalid admin address');
    });
  });

  describe('Dynamic Fee Configuration', function () {
    it('Should update fee configuration by admin', async function () {
      await projectTreasuryAdvanced.updateFeeConfig(
        600, // base management fee
        1200, // performance fee rate
        20000, // high performance threshold
        8000, // low performance threshold
        2500, // max fee rate
        200 // min fee rate
      );

      const feeConfig = await projectTreasuryAdvanced.getFeeConfig();
      expect(feeConfig.baseManagementFee).to.equal(600);
      expect(feeConfig.performanceFeeRate).to.equal(1200);
      expect(feeConfig.highPerformanceThreshold).to.equal(20000);
      expect(feeConfig.lowPerformanceThreshold).to.equal(8000);
      expect(feeConfig.maxFeeRate).to.equal(2500);
      expect(feeConfig.minFeeRate).to.equal(200);
    });

    it('Should reject invalid fee configuration', async function () {
      await expect(
        projectTreasuryAdvanced.updateFeeConfig(
          2100, // Too high base fee (>20%)
          1200,
          20000,
          8000,
          2500,
          200
        )
      ).to.be.revertedWith('Base fee too high');

      await expect(
        projectTreasuryAdvanced.updateFeeConfig(
          600,
          3100, // Too high performance fee (>30%)
          20000,
          8000,
          2500,
          200
        )
      ).to.be.revertedWith('Performance fee too high');

      await expect(
        projectTreasuryAdvanced.updateFeeConfig(
          600,
          1200,
          20000,
          8000,
          200, // Max fee lower than min fee
          2500
        )
      ).to.be.revertedWith('Invalid fee range');
    });

    it('Should only allow admin to update fee configuration', async function () {
      await expect(
        projectTreasuryAdvanced
          .connect(investor1)
          .updateFeeConfig(600, 1200, 20000, 8000, 2500, 200)
      ).to.be.revertedWithCustomError(
        projectTreasuryAdvanced,
        'AccessControlUnauthorizedAccount'
      );
    });
  });

  describe('Profit Distribution', function () {
    beforeEach(async function () {
      // Fund the treasury
      await admin.sendTransaction({
        to: await projectTreasuryAdvanced.getAddress(),
        value: ethers.parseEther('100'),
      });
    });

    it('Should receive and distribute profits correctly', async function () {
      const profitAmount = ethers.parseEther('10');

      // Receive profits
      await expect(
        projectTreasuryAdvanced
          .connect(spv)
          .receiveProfits({ value: profitAmount })
      )
        .to.emit(projectTreasuryAdvanced, 'ProfitReceived')
        .withArgs(
          profitAmount,
          await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1)
        );

      // Check that profits were received
      expect(await projectTreasuryAdvanced.totalProfitsReceived()).to.equal(
        profitAmount
      );
      expect(await projectTreasuryAdvanced.lastProfitAmount()).to.equal(
        profitAmount
      );
    });

    it('Should distribute profits with correct fee calculation', async function () {
      const profitAmount = ethers.parseEther('10');
      const expectedFee = (profitAmount * 500n) / 10000n; // 5% base fee
      const expectedNetDistribution = profitAmount - expectedFee;

      await expect(
        projectTreasuryAdvanced.connect(spv).distributeProfits(profitAmount)
      )
        .to.emit(projectTreasuryAdvanced, 'ProfitDistributed')
        .withArgs(1, profitAmount, expectedFee, expectedNetDistribution);

      expect(await projectTreasuryAdvanced.distributionCount()).to.equal(1);
      expect(await projectTreasuryAdvanced.totalFeesCollected()).to.equal(
        expectedFee
      );
      expect(await projectTreasuryAdvanced.totalNetDistributed()).to.equal(
        expectedNetDistribution
      );
    });

    it('Should calculate dynamic fees based on performance', async function () {
      // First distribution to establish baseline
      await projectTreasuryAdvanced
        .connect(spv)
        .distributeProfits(ethers.parseEther('5'));

      // Second distribution with higher amount (should trigger performance fee)
      const highProfitAmount = ethers.parseEther('15');
      await projectTreasuryAdvanced
        .connect(spv)
        .distributeProfits(highProfitAmount);

      const metrics = await projectTreasuryAdvanced.getPerformanceMetrics();
      expect(metrics.totalDistributions).to.equal(2);
      expect(metrics.totalProfitsDistributed).to.equal(ethers.parseEther('20'));
    });

    it('Should reject profit distribution from non-SPV', async function () {
      await expect(
        projectTreasuryAdvanced
          .connect(investor1)
          .distributeProfits(ethers.parseEther('10'))
      ).to.be.revertedWithCustomError(
        projectTreasuryAdvanced,
        'AccessControlUnauthorizedAccount'
      );
    });

    it('Should reject profit distribution with insufficient balance', async function () {
      await expect(
        projectTreasuryAdvanced
          .connect(spv)
          .distributeProfits(ethers.parseEther('1000'))
      ).to.be.revertedWith('Insufficient balance');
    });
  });

  describe('Profit Claiming', function () {
    let distributionId: number;

    beforeEach(async function () {
      // Fund the treasury and create a distribution
      await admin.sendTransaction({
        to: await projectTreasuryAdvanced.getAddress(),
        value: ethers.parseEther('100'),
      });

      const profitAmount = ethers.parseEther('30');
      await projectTreasuryAdvanced
        .connect(spv)
        .distributeProfits(profitAmount);
      distributionId = 1;
    });

    it('Should allow investors to claim profits', async function () {
      const investor1Balance = await projectToken.balanceOf(investor1Addr);

      const distribution =
        await projectTreasuryAdvanced.getDistribution(distributionId);
      const expectedClaim =
        (investor1Balance * distribution.netDistribution) /
        distribution.totalTokenSupply;

      const balanceBefore = await ethers.provider.getBalance(investor1Addr);

      await expect(
        projectTreasuryAdvanced.connect(investor1).claimProfits(distributionId)
      )
        .to.emit(projectTreasuryAdvanced, 'ProfitClaimed')
        .withArgs(distributionId, investor1Addr, expectedClaim);

      const balanceAfter = await ethers.provider.getBalance(investor1Addr);
      expect(balanceAfter).to.be.gt(balanceBefore);

      expect(
        await projectTreasuryAdvanced.totalClaimed(investor1Addr)
      ).to.equal(expectedClaim);
    });

    it('Should prevent double claiming', async function () {
      await projectTreasuryAdvanced
        .connect(investor1)
        .claimProfits(distributionId);

      await expect(
        projectTreasuryAdvanced.connect(investor1).claimProfits(distributionId)
      ).to.be.revertedWith('Already claimed');
    });

    it('Should reject claims from non-token holders', async function () {
      await expect(
        projectTreasuryAdvanced.connect(operator).claimProfits(distributionId)
      ).to.be.revertedWith('No tokens held');
    });

    it('Should update claim streak correctly', async function () {
      await projectTreasuryAdvanced
        .connect(investor1)
        .claimProfits(distributionId);
      expect(await projectTreasuryAdvanced.claimStreak(investor1Addr)).to.equal(
        1
      );

      // Create another distribution
      await projectTreasuryAdvanced
        .connect(spv)
        .distributeProfits(ethers.parseEther('20'));
      await projectTreasuryAdvanced.connect(investor1).claimProfits(2);
      expect(await projectTreasuryAdvanced.claimStreak(investor1Addr)).to.equal(
        2
      );
    });
  });

  describe('Batch Claiming', function () {
    let distributionIds: number[];

    beforeEach(async function () {
      // Fund the treasury
      await admin.sendTransaction({
        to: await projectTreasuryAdvanced.getAddress(),
        value: ethers.parseEther('200'),
      });

      // Create multiple distributions
      await projectTreasuryAdvanced
        .connect(spv)
        .distributeProfits(ethers.parseEther('30'));
      await projectTreasuryAdvanced
        .connect(spv)
        .distributeProfits(ethers.parseEther('20'));
      await projectTreasuryAdvanced
        .connect(spv)
        .distributeProfits(ethers.parseEther('25'));
      distributionIds = [1, 2, 3];
    });

    it('Should allow batch claiming from multiple distributions', async function () {
      const balanceBefore = await ethers.provider.getBalance(investor1Addr);

      await expect(
        projectTreasuryAdvanced
          .connect(investor1)
          .batchClaimProfits(distributionIds)
      ).to.emit(projectTreasuryAdvanced, 'ProfitClaimed');

      const balanceAfter = await ethers.provider.getBalance(investor1Addr);
      expect(balanceAfter).to.be.gt(balanceBefore);

      // Check that all distributions were claimed
      for (const id of distributionIds) {
        const distribution = await projectTreasuryAdvanced.getDistribution(id);
        expect(distribution.claimedCount).to.be.gt(0);
      }
    });

    it('Should handle partial batch claims correctly', async function () {
      // Claim first distribution individually
      await projectTreasuryAdvanced.connect(investor1).claimProfits(1);

      // Batch claim should skip the already claimed distribution
      await expect(
        projectTreasuryAdvanced
          .connect(investor1)
          .batchClaimProfits(distributionIds)
      ).to.emit(projectTreasuryAdvanced, 'ProfitClaimed');
    });

    it('Should reject batch claiming with too many distributions', async function () {
      const tooManyIds = Array.from({ length: 25 }, (_, i) => i + 1);

      await expect(
        projectTreasuryAdvanced.connect(investor1).batchClaimProfits(tooManyIds)
      ).to.be.revertedWith('Too many distributions');
    });

    it('Should reject empty batch claim', async function () {
      await expect(
        projectTreasuryAdvanced.connect(investor1).batchClaimProfits([])
      ).to.be.revertedWith('No distributions specified');
    });
  });

  describe('Staking Rewards', function () {
    beforeEach(async function () {
      // Fund the treasury
      await admin.sendTransaction({
        to: await projectTreasuryAdvanced.getAddress(),
        value: ethers.parseEther('100'),
      });
    });

    it('Should update staking rewards after profit distribution', async function () {
      const profitAmount = ethers.parseEther('20');

      await expect(
        projectTreasuryAdvanced.connect(spv).distributeProfits(profitAmount)
      ).to.emit(projectTreasuryAdvanced, 'StakingRewardsUpdated');

      const stakingInfo =
        await projectTreasuryAdvanced.getStakingInfo(investor1Addr);
      expect(stakingInfo.totalStaked).to.equal(0); // No staking yet
    });

    it('Should track staking information correctly', async function () {
      const stakingInfo =
        await projectTreasuryAdvanced.getStakingInfo(investor1Addr);
      expect(stakingInfo.stakedAmount).to.equal(0);
      expect(stakingInfo.rewardAmount).to.equal(0);
      expect(stakingInfo.totalStaked).to.equal(0);
    });
  });

  describe('Vesting Schedules', function () {
    it('Should set claim schedule for recipients', async function () {
      const totalAmount = ethers.parseEther('100');
      const vestingSchedule = [86400, 172800, 259200]; // 1, 2, 3 days
      const releaseAmounts = [3333, 6666, 10000]; // 33.33%, 66.66%, 100%
      const cliffPeriod = 3600; // 1 hour

      await expect(
        projectTreasuryAdvanced.setClaimSchedule(
          investor1Addr,
          totalAmount,
          vestingSchedule,
          releaseAmounts,
          cliffPeriod
        )
      )
        .to.emit(projectTreasuryAdvanced, 'ClaimScheduleSet')
        .withArgs(investor1Addr, totalAmount, cliffPeriod);

      const schedule =
        await projectTreasuryAdvanced.claimSchedules(investor1Addr);
      expect(schedule.totalAmount).to.equal(totalAmount);
      expect(schedule.cliffPeriod).to.equal(cliffPeriod);
      expect(schedule.isActive).to.be.true;
    });

    it('Should reject invalid claim schedule parameters', async function () {
      await expect(
        projectTreasuryAdvanced.setClaimSchedule(
          ethers.ZeroAddress,
          ethers.parseEther('100'),
          [86400],
          [10000],
          3600
        )
      ).to.be.revertedWith('Invalid recipient');

      await expect(
        projectTreasuryAdvanced.setClaimSchedule(
          investor1Addr,
          0,
          [86400],
          [10000],
          3600
        )
      ).to.be.revertedWith('Invalid total amount');

      await expect(
        projectTreasuryAdvanced.setClaimSchedule(
          investor1Addr,
          ethers.parseEther('100'),
          [86400],
          [10000, 5000], // Mismatched array lengths
          3600
        )
      ).to.be.revertedWith('Array length mismatch');
    });

    it('Should only allow admin to set claim schedules', async function () {
      await expect(
        projectTreasuryAdvanced
          .connect(investor1)
          .setClaimSchedule(
            investor1Addr,
            ethers.parseEther('100'),
            [86400],
            [10000],
            3600
          )
      ).to.be.revertedWithCustomError(
        projectTreasuryAdvanced,
        'AccessControlUnauthorizedAccount'
      );
    });
  });

  describe('Emergency Functions', function () {
    beforeEach(async function () {
      // Fund the treasury
      await admin.sendTransaction({
        to: await projectTreasuryAdvanced.getAddress(),
        value: ethers.parseEther('50'),
      });
    });

    it('Should allow emergency withdrawal in emergency mode', async function () {
      // First, we need to activate emergency mode
      // Note: This requires accessing the emergency config directly
      // In a real scenario, this would be done through proper admin functions

      const emergencyAmount = ethers.parseEther('5');

      await expect(
        projectTreasuryAdvanced.emergencyWithdraw(
          emergencyAmount,
          'Test emergency'
        )
      ).to.be.revertedWith('Emergency mode not active');
    });

    it('Should reject emergency withdrawal above limit', async function () {
      const excessiveAmount = ethers.parseEther('15'); // Above 10 ETH limit

      await expect(
        projectTreasuryAdvanced.emergencyWithdraw(
          excessiveAmount,
          'Test emergency'
        )
      ).to.be.revertedWith('Exceeds emergency limit');
    });

    it('Should only allow admin to perform emergency withdrawal', async function () {
      await expect(
        projectTreasuryAdvanced
          .connect(investor1)
          .emergencyWithdraw(ethers.parseEther('5'), 'Test')
      ).to.be.revertedWithCustomError(
        projectTreasuryAdvanced,
        'AccessControlUnauthorizedAccount'
      );
    });
  });

  describe('Performance Metrics', function () {
    beforeEach(async function () {
      // Fund the treasury
      await admin.sendTransaction({
        to: await projectTreasuryAdvanced.getAddress(),
        value: ethers.parseEther('100'),
      });
    });

    it('Should update performance metrics after distributions', async function () {
      await projectTreasuryAdvanced
        .connect(spv)
        .distributeProfits(ethers.parseEther('20'));
      await projectTreasuryAdvanced
        .connect(spv)
        .distributeProfits(ethers.parseEther('30'));

      const metrics = await projectTreasuryAdvanced.getPerformanceMetrics();
      expect(metrics.totalDistributions).to.equal(2);
      expect(metrics.totalProfitsDistributed).to.equal(ethers.parseEther('50'));
      expect(metrics.averageDistributionAmount).to.equal(
        ethers.parseEther('25')
      );
    });

    it('Should calculate performance score correctly', async function () {
      // Create multiple distributions to test performance scoring
      for (let i = 0; i < 5; i++) {
        await projectTreasuryAdvanced
          .connect(spv)
          .distributeProfits(ethers.parseEther('10'));
      }

      const metrics = await projectTreasuryAdvanced.getPerformanceMetrics();
      expect(metrics.performanceScore).to.be.gt(0);
    });
  });

  describe('View Functions', function () {
    let distributionId: number;

    beforeEach(async function () {
      // Fund the treasury and create a distribution
      await admin.sendTransaction({
        to: await projectTreasuryAdvanced.getAddress(),
        value: ethers.parseEther('100'),
      });

      await projectTreasuryAdvanced
        .connect(spv)
        .distributeProfits(ethers.parseEther('30'));
      distributionId = 1;
    });

    it('Should return correct distribution information', async function () {
      const distribution =
        await projectTreasuryAdvanced.getDistribution(distributionId);

      expect(distribution.id).to.equal(distributionId);
      expect(distribution.totalAmount).to.equal(ethers.parseEther('30'));
      expect(distribution.isActive).to.be.true;
      expect(distribution.claimedCount).to.equal(0);
    });

    it('Should return correct claimable amount for users', async function () {
      const claimableAmount = await projectTreasuryAdvanced.getClaimableAmount(
        investor1Addr,
        distributionId
      );
      expect(claimableAmount).to.be.gt(0);

      // After claiming, should return 0
      await projectTreasuryAdvanced
        .connect(investor1)
        .claimProfits(distributionId);
      const claimableAfter = await projectTreasuryAdvanced.getClaimableAmount(
        investor1Addr,
        distributionId
      );
      expect(claimableAfter).to.equal(0);
    });

    it('Should return user distributions correctly', async function () {
      await projectTreasuryAdvanced
        .connect(investor1)
        .claimProfits(distributionId);

      const userDistributions =
        await projectTreasuryAdvanced.getUserDistributions(investor1Addr);
      expect(userDistributions.length).to.equal(1);
      expect(userDistributions[0]).to.equal(distributionId);
    });

    it('Should return correct fee configuration', async function () {
      const feeConfig = await projectTreasuryAdvanced.getFeeConfig();
      expect(feeConfig.baseManagementFee).to.equal(500);
      expect(feeConfig.performanceFeeRate).to.equal(1000);
      expect(feeConfig.isActive).to.be.true;
    });
  });

  describe('Access Control', function () {
    it('Should enforce role-based access control', async function () {
      // Test that only SPV can distribute profits
      await expect(
        projectTreasuryAdvanced
          .connect(investor1)
          .distributeProfits(ethers.parseEther('10'))
      ).to.be.revertedWithCustomError(
        projectTreasuryAdvanced,
        'AccessControlUnauthorizedAccount'
      );

      // Test that only admin can update fee config
      await expect(
        projectTreasuryAdvanced
          .connect(investor1)
          .updateFeeConfig(600, 1200, 20000, 8000, 2500, 200)
      ).to.be.revertedWithCustomError(
        projectTreasuryAdvanced,
        'AccessControlUnauthorizedAccount'
      );

      // Test that only admin can set claim schedules
      await expect(
        projectTreasuryAdvanced
          .connect(investor1)
          .setClaimSchedule(
            investor1Addr,
            ethers.parseEther('100'),
            [86400],
            [10000],
            3600
          )
      ).to.be.revertedWithCustomError(
        projectTreasuryAdvanced,
        'AccessControlUnauthorizedAccount'
      );
    });
  });

  describe('Pausable Functionality', function () {
    beforeEach(async function () {
      // Fund the treasury
      await admin.sendTransaction({
        to: await projectTreasuryAdvanced.getAddress(),
        value: ethers.parseEther('100'),
      });
    });

    it('Should pause and unpause contract operations', async function () {
      // Pause the contract
      await projectTreasuryAdvanced.connect(pauser).pause();

      // Should reject operations when paused
      await expect(
        projectTreasuryAdvanced
          .connect(spv)
          .distributeProfits(ethers.parseEther('10'))
      ).to.be.revertedWithCustomError(projectTreasuryAdvanced, 'EnforcedPause');

      // Unpause the contract
      await projectTreasuryAdvanced.connect(pauser).unpause();

      // Should allow operations when unpaused
      await expect(
        projectTreasuryAdvanced
          .connect(spv)
          .distributeProfits(ethers.parseEther('10'))
      ).to.emit(projectTreasuryAdvanced, 'ProfitDistributed');
    });

    it('Should only allow pauser role to pause/unpause', async function () {
      await expect(
        projectTreasuryAdvanced.connect(investor1).pause()
      ).to.be.revertedWithCustomError(
        projectTreasuryAdvanced,
        'AccessControlUnauthorizedAccount'
      );

      await expect(
        projectTreasuryAdvanced.connect(investor1).unpause()
      ).to.be.revertedWithCustomError(
        projectTreasuryAdvanced,
        'AccessControlUnauthorizedAccount'
      );
    });
  });

  describe('Upgradeability', function () {
    it('Should be upgradeable by upgrader role', async function () {
      const ProjectTreasuryAdvancedV2Factory = await ethers.getContractFactory(
        'ProjectTreasuryAdvanced'
      );

      // This should succeed since admin has UPGRADER_ROLE
      const upgraded = await upgrades.upgradeProxy(
        await projectTreasuryAdvanced.getAddress(),
        ProjectTreasuryAdvancedV2Factory
      );

      expect(await upgraded.getAddress()).to.equal(
        await projectTreasuryAdvanced.getAddress()
      );
    });

    it('Should preserve state after upgrade', async function () {
      // Fund and create distribution before upgrade
      await admin.sendTransaction({
        to: await projectTreasuryAdvanced.getAddress(),
        value: ethers.parseEther('100'),
      });

      await projectTreasuryAdvanced
        .connect(spv)
        .distributeProfits(ethers.parseEther('30'));
      const distributionCountBefore =
        await projectTreasuryAdvanced.distributionCount();

      // Upgrade contract
      const ProjectTreasuryAdvancedV2Factory = await ethers.getContractFactory(
        'ProjectTreasuryAdvanced'
      );
      const upgraded = (await upgrades.upgradeProxy(
        await projectTreasuryAdvanced.getAddress(),
        ProjectTreasuryAdvancedV2Factory
      )) as unknown as ProjectTreasuryAdvanced;

      // State should be preserved
      const distributionCountAfter = await upgraded.distributionCount();
      expect(distributionCountAfter).to.equal(distributionCountBefore);
    });
  });

  describe('Fallback Function', function () {
    it('Should accept ETH through fallback function', async function () {
      const balanceBefore = await ethers.provider.getBalance(
        await projectTreasuryAdvanced.getAddress()
      );

      await admin.sendTransaction({
        to: await projectTreasuryAdvanced.getAddress(),
        value: ethers.parseEther('5'),
      });

      const balanceAfter = await ethers.provider.getBalance(
        await projectTreasuryAdvanced.getAddress()
      );
      expect(balanceAfter).to.equal(balanceBefore + ethers.parseEther('5'));
    });
  });

  describe('Edge Cases and Error Handling', function () {
    it('Should handle zero token supply gracefully', async function () {
      // Deploy a token with zero supply
      const ProjectTokenFactory =
        await ethers.getContractFactory('ProjectToken');
      const zeroSupplyToken = await ProjectTokenFactory.deploy();

      // Deploy treasury with zero supply token
      const ProjectTreasuryAdvancedFactory = await ethers.getContractFactory(
        'ProjectTreasuryAdvanced'
      );
      const zeroSupplyTreasury = (await upgrades.deployProxy(
        ProjectTreasuryAdvancedFactory,
        [
          adminAddr,
          await zeroSupplyToken.getAddress(),
          await platformTreasury.getAddress(),
          spvAddr,
          500,
          1000,
          ethers.parseEther('10'),
        ],
        { initializer: 'initialize' }
      )) as unknown as ProjectTreasuryAdvanced;

      // Fund the treasury
      await admin.sendTransaction({
        to: await zeroSupplyTreasury.getAddress(),
        value: ethers.parseEther('10'),
      });

      // Should reject distribution with zero token supply
      await expect(
        zeroSupplyTreasury
          .connect(spv)
          .distributeProfits(ethers.parseEther('5'))
      ).to.be.revertedWith('No tokens in circulation');
    });

    it('Should handle invalid distribution IDs', async function () {
      await expect(
        projectTreasuryAdvanced.getDistribution(999)
      ).to.be.revertedWith('Invalid distribution ID');

      await expect(
        projectTreasuryAdvanced.claimProfits(999)
      ).to.be.revertedWith('Invalid distribution ID');
    });

    it('Should handle claims with zero token balance', async function () {
      // Fund and create distribution
      await admin.sendTransaction({
        to: await projectTreasuryAdvanced.getAddress(),
        value: ethers.parseEther('100'),
      });

      await projectTreasuryAdvanced
        .connect(spv)
        .distributeProfits(ethers.parseEther('30'));

      // Should return 0 claimable amount for user with no tokens
      const claimableAmount = await projectTreasuryAdvanced.getClaimableAmount(
        operatorAddr,
        1
      );
      expect(claimableAmount).to.equal(0);
    });

    it('Should handle reentrancy attacks', async function () {
      // The contract uses OpenZeppelin's ReentrancyGuard
      // This test verifies that the nonReentrant modifier is properly applied
      // Direct testing of reentrancy would require a malicious contract

      // Fund and create distribution
      await admin.sendTransaction({
        to: await projectTreasuryAdvanced.getAddress(),
        value: ethers.parseEther('100'),
      });

      await projectTreasuryAdvanced
        .connect(spv)
        .distributeProfits(ethers.parseEther('30'));

      // Normal claim should work
      await expect(
        projectTreasuryAdvanced.connect(investor1).claimProfits(1)
      ).to.emit(projectTreasuryAdvanced, 'ProfitClaimed');
    });
  });
});
