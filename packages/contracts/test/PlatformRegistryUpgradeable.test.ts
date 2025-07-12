import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { PlatformRegistryUpgradeable } from '../typechain-types';

describe('PlatformRegistryUpgradeable', function () {
  let platformRegistry: PlatformRegistryUpgradeable;
  let admin: SignerWithAddress;
  let operator: SignerWithAddress;
  let spv: SignerWithAddress;
  let investor: SignerWithAddress;
  let treasury: SignerWithAddress;
  let other: SignerWithAddress;

  const CONFIG = {
    listingFee: ethers.parseEther('0.001'),
    managementFeeRate: 500,
    minimumInvestment: ethers.parseEther('0.0001'),
    maximumInvestment: ethers.parseEther('1'),
    emergencyWithdrawalThreshold: ethers.parseEther('0.1'),
  };

  beforeEach(async function () {
    [admin, operator, spv, investor, treasury, other] =
      await ethers.getSigners();

    const PlatformRegistryUpgradeable = await ethers.getContractFactory(
      'PlatformRegistryUpgradeable'
    );

    platformRegistry = (await upgrades.deployProxy(
      PlatformRegistryUpgradeable,
      [
        admin.address,
        treasury.address,
        CONFIG.listingFee,
        CONFIG.managementFeeRate,
        CONFIG.minimumInvestment,
        CONFIG.maximumInvestment,
        CONFIG.emergencyWithdrawalThreshold,
      ],
      {
        initializer: 'initialize',
        kind: 'uups',
      }
    )) as unknown as PlatformRegistryUpgradeable;

    await platformRegistry.waitForDeployment();

    // Grant operator role
    const OPERATOR_ROLE = await platformRegistry.OPERATOR_ROLE();
    await platformRegistry.grantRole(OPERATOR_ROLE, operator.address);
  });

  describe('Deployment', function () {
    it('Should set the correct initial configuration', async function () {
      const config = await platformRegistry.getPlatformConfig();
      expect(config.listingFee).to.equal(CONFIG.listingFee);
      expect(config.managementFeeRate).to.equal(CONFIG.managementFeeRate);
      expect(config.minimumInvestment).to.equal(CONFIG.minimumInvestment);
      expect(config.maximumInvestment).to.equal(CONFIG.maximumInvestment);
      expect(config.platformActive).to.be.true;
    });

    it('Should set the correct admin roles', async function () {
      const DEFAULT_ADMIN_ROLE = await platformRegistry.DEFAULT_ADMIN_ROLE();
      const ADMIN_ROLE = await platformRegistry.ADMIN_ROLE();
      const UPGRADER_ROLE = await platformRegistry.UPGRADER_ROLE();

      expect(await platformRegistry.hasRole(DEFAULT_ADMIN_ROLE, admin.address))
        .to.be.true;
      expect(await platformRegistry.hasRole(ADMIN_ROLE, admin.address)).to.be
        .true;
      expect(await platformRegistry.hasRole(UPGRADER_ROLE, admin.address)).to.be
        .true;
    });

    it('Should initialize emergency mode as false', async function () {
      const [emergencyMode, emergencyActivatedAt] =
        await platformRegistry.getEmergencyStatus();
      expect(emergencyMode).to.be.false;
      expect(emergencyActivatedAt).to.equal(0);
    });
  });

  describe('UUPS Upgradeability', function () {
    it('Should allow admin to upgrade contract', async function () {
      const PlatformRegistryUpgradeableV2 = await ethers.getContractFactory(
        'PlatformRegistryUpgradeable'
      );

      // This should not revert
      await expect(
        upgrades.upgradeProxy(
          platformRegistry.target,
          PlatformRegistryUpgradeableV2
        )
      ).to.not.be.reverted;
    });

    it('Should prevent non-admin from upgrading', async function () {
      const PlatformRegistryUpgradeableV2 = await ethers.getContractFactory(
        'PlatformRegistryUpgradeable',
        other
      );

      await expect(
        upgrades.upgradeProxy(
          platformRegistry.target,
          PlatformRegistryUpgradeableV2
        )
      ).to.be.revertedWithCustomError(
        platformRegistry,
        'AccessControlUnauthorizedAccount'
      );
    });
  });

  describe('Emergency Controls', function () {
    it('Should allow admin to activate emergency mode', async function () {
      await expect(platformRegistry.activateEmergencyMode())
        .to.emit(platformRegistry, 'EmergencyModeActivated')
        .withArgs(admin.address);

      const [emergencyMode, emergencyActivatedAt] =
        await platformRegistry.getEmergencyStatus();
      expect(emergencyMode).to.be.true;
      expect(emergencyActivatedAt).to.be.greaterThan(0);
    });

    it('Should allow admin to deactivate emergency mode', async function () {
      await platformRegistry.activateEmergencyMode();

      await expect(platformRegistry.deactivateEmergencyMode())
        .to.emit(platformRegistry, 'EmergencyModeDeactivated')
        .withArgs(admin.address);

      const [emergencyMode, emergencyActivatedAt] =
        await platformRegistry.getEmergencyStatus();
      expect(emergencyMode).to.be.false;
      expect(emergencyActivatedAt).to.equal(0);
    });

    it('Should prevent non-admin from activating emergency mode', async function () {
      await expect(
        platformRegistry.connect(other).activateEmergencyMode()
      ).to.be.revertedWithCustomError(
        platformRegistry,
        'AccessControlUnauthorizedAccount'
      );
    });

    it('Should prevent operations in emergency mode', async function () {
      await platformRegistry.activateEmergencyMode();

      // Emergency mode pauses the contract, so we expect EnforcedPause error
      await expect(
        platformRegistry.registerSPV(spv.address, 'Test SPV', 'REG123')
      ).to.be.revertedWithCustomError(platformRegistry, 'EnforcedPause');
    });
  });

  describe('Pause/Unpause Functionality', function () {
    it('Should allow pauser to pause contract', async function () {
      await platformRegistry.pause();

      await expect(
        platformRegistry.registerSPV(spv.address, 'Test SPV', 'REG123')
      ).to.be.revertedWithCustomError(platformRegistry, 'EnforcedPause');
    });

    it('Should allow pauser to unpause contract', async function () {
      await platformRegistry.pause();
      await platformRegistry.unpause();

      // Should work after unpause
      await expect(
        platformRegistry.registerSPV(spv.address, 'Test SPV', 'REG123')
      ).to.not.be.reverted;
    });

    it('Should prevent non-pauser from pausing', async function () {
      await expect(
        platformRegistry.connect(other).pause()
      ).to.be.revertedWithCustomError(
        platformRegistry,
        'AccessControlUnauthorizedAccount'
      );
    });
  });

  describe('Activity Tracking', function () {
    it('Should track activity timestamps', async function () {
      await platformRegistry.registerSPV(spv.address, 'Test SPV', 'REG123');

      const lastActivity = await platformRegistry.getLastActivity(
        admin.address
      );
      expect(lastActivity).to.be.greaterThan(0);
    });

    it('Should update activity on each interaction', async function () {
      await platformRegistry.registerSPV(spv.address, 'Test SPV', 'REG123');
      const firstActivity = await platformRegistry.getLastActivity(
        admin.address
      );

      // Wait a bit and perform another action
      await new Promise(resolve => setTimeout(resolve, 1000));
      await platformRegistry.deactivateSPV(spv.address);

      const secondActivity = await platformRegistry.getLastActivity(
        admin.address
      );
      expect(secondActivity).to.be.greaterThan(firstActivity);
    });
  });

  describe('Emergency Withdrawal', function () {
    beforeEach(async function () {
      // Send some ETH to the contract
      await admin.sendTransaction({
        to: platformRegistry.target,
        value: ethers.parseEther('0.2'),
      });
    });

    it('Should allow emergency withdrawal in emergency mode', async function () {
      // Fund the contract with some ETH
      await admin.sendTransaction({
        to: await platformRegistry.getAddress(),
        value: ethers.parseEther('1'),
      });

      await platformRegistry.activateEmergencyMode();

      const withdrawalAmount = ethers.parseEther('0.1');
      await expect(
        platformRegistry.emergencyWithdraw(other.address, withdrawalAmount)
      )
        .to.emit(platformRegistry, 'EmergencyWithdrawal')
        .withArgs(other.address, withdrawalAmount);
    });

    it('Should prevent emergency withdrawal when not in emergency mode', async function () {
      const withdrawalAmount = ethers.parseEther('0.1');
      await expect(
        platformRegistry.emergencyWithdraw(other.address, withdrawalAmount)
      ).to.be.revertedWith('Platform not in emergency mode');
    });

    it('Should enforce withdrawal threshold', async function () {
      // Fund the contract with some ETH
      await admin.sendTransaction({
        to: await platformRegistry.getAddress(),
        value: ethers.parseEther('1'),
      });

      await platformRegistry.activateEmergencyMode();

      // Try to withdraw more than threshold (0.1 ETH)
      const excessiveAmount = ethers.parseEther('0.2');
      await expect(
        platformRegistry.emergencyWithdraw(other.address, excessiveAmount)
      ).to.be.revertedWith('Amount exceeds threshold');
    });
  });

  describe('SPV Management with Emergency Controls', function () {
    it('Should register SPV normally when not in emergency', async function () {
      await expect(
        platformRegistry.registerSPV(spv.address, 'Test SPV', 'REG123')
      )
        .to.emit(platformRegistry, 'SPVRegistered')
        .withArgs(spv.address, 'Test SPV', 'REG123');

      const spvInfo = await platformRegistry.getSPVInfo(spv.address);
      expect(spvInfo.isActive).to.be.true;
      expect(spvInfo.name).to.equal('Test SPV');
    });

    it('Should prevent SPV registration in emergency mode', async function () {
      await platformRegistry.activateEmergencyMode();

      // Emergency mode pauses the contract, so we expect EnforcedPause error
      await expect(
        platformRegistry.registerSPV(spv.address, 'Test SPV', 'REG123')
      ).to.be.revertedWithCustomError(platformRegistry, 'EnforcedPause');
    });

    it('Should prevent SPV deactivation during emergency mode', async function () {
      await platformRegistry.registerSPV(spv.address, 'Test SPV', 'REG123');
      await platformRegistry.activateEmergencyMode();

      // Emergency mode pauses contract, so deactivation should fail
      await expect(
        platformRegistry.deactivateSPV(spv.address)
      ).to.be.revertedWithCustomError(platformRegistry, 'EnforcedPause');
    });
  });

  describe('Investor Management with Emergency Controls', function () {
    it('Should verify investor normally when not in emergency', async function () {
      await expect(
        platformRegistry.connect(operator).verifyInvestor(investor.address)
      )
        .to.emit(platformRegistry, 'InvestorVerified')
        .withArgs(investor.address);

      const investorInfo = await platformRegistry.getInvestorInfo(
        investor.address
      );
      expect(investorInfo.isActive).to.be.true;
      expect(investorInfo.kycVerified).to.be.true;
    });

    it('Should prevent investor verification in emergency mode', async function () {
      await platformRegistry.activateEmergencyMode();

      // Emergency mode pauses the contract, so we expect EnforcedPause error
      await expect(
        platformRegistry.connect(operator).verifyInvestor(investor.address)
      ).to.be.revertedWithCustomError(platformRegistry, 'EnforcedPause');
    });
  });

  describe('Authorization Checks with Emergency Mode', function () {
    beforeEach(async function () {
      await platformRegistry.registerSPV(spv.address, 'Test SPV', 'REG123');
      await platformRegistry.connect(operator).verifyInvestor(investor.address);
    });

    it('Should authorize SPV when platform is active and not in emergency', async function () {
      expect(await platformRegistry.isSPVAuthorized(spv.address)).to.be.true;
    });

    it('Should not authorize SPV in emergency mode', async function () {
      await platformRegistry.activateEmergencyMode();
      expect(await platformRegistry.isSPVAuthorized(spv.address)).to.be.false;
    });

    it('Should authorize investor when platform is active and not in emergency', async function () {
      expect(await platformRegistry.isInvestorAuthorized(investor.address)).to
        .be.true;
    });

    it('Should not authorize investor in emergency mode', async function () {
      await platformRegistry.activateEmergencyMode();
      expect(await platformRegistry.isInvestorAuthorized(investor.address)).to
        .be.false;
    });
  });

  describe('Configuration Updates', function () {
    it('Should update platform configuration', async function () {
      const newConfig = {
        listingFee: ethers.parseEther('0.002'),
        managementFeeRate: 600,
        minimumInvestment: ethers.parseEther('0.0002'),
        maximumInvestment: ethers.parseEther('2'),
        emergencyWithdrawalThreshold: ethers.parseEther('0.2'),
      };

      await expect(
        platformRegistry.updatePlatformConfig(
          newConfig.listingFee,
          newConfig.managementFeeRate,
          newConfig.minimumInvestment,
          newConfig.maximumInvestment,
          newConfig.emergencyWithdrawalThreshold
        )
      )
        .to.emit(platformRegistry, 'PlatformConfigUpdated')
        .withArgs(newConfig.listingFee, newConfig.managementFeeRate);

      const config = await platformRegistry.getPlatformConfig();
      expect(config.listingFee).to.equal(newConfig.listingFee);
      expect(config.managementFeeRate).to.equal(newConfig.managementFeeRate);
      expect(config.emergencyWithdrawalThreshold).to.equal(
        newConfig.emergencyWithdrawalThreshold
      );
    });

    it('Should prevent configuration updates when paused', async function () {
      await platformRegistry.pause();

      await expect(
        platformRegistry.updatePlatformConfig(
          ethers.parseEther('0.002'),
          600,
          ethers.parseEther('0.0002'),
          ethers.parseEther('2'),
          ethers.parseEther('0.2')
        )
      ).to.be.revertedWithCustomError(platformRegistry, 'EnforcedPause');
    });
  });

  describe('Edge Cases and Error Handling', function () {
    it('Should handle multiple emergency mode activations', async function () {
      await platformRegistry.activateEmergencyMode();

      await expect(platformRegistry.activateEmergencyMode()).to.be.revertedWith(
        'Emergency mode already active'
      );
    });

    it('Should handle emergency mode deactivation when not active', async function () {
      await expect(
        platformRegistry.deactivateEmergencyMode()
      ).to.be.revertedWith('Emergency mode not active');
    });

    it('Should handle emergency withdrawal with insufficient balance', async function () {
      await platformRegistry.activateEmergencyMode();

      await expect(
        platformRegistry.emergencyWithdraw(
          other.address,
          ethers.parseEther('10')
        )
      ).to.be.revertedWith('Insufficient balance');
    });
  });
});
