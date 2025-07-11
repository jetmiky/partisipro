import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { PlatformTreasuryUpgradeable } from '../typechain-types';
import { time } from '@nomicfoundation/hardhat-network-helpers';

describe('PlatformTreasuryUpgradeable', function () {
  let platformTreasury: PlatformTreasuryUpgradeable;
  let admin: SignerWithAddress;
  let operator: SignerWithAddress;
  let collector: SignerWithAddress;
  let registry: SignerWithAddress;
  let project: SignerWithAddress;
  let emergencyRecipient: SignerWithAddress;
  let other: SignerWithAddress;

  const CONFIG = {
    emergencyWithdrawalThreshold: ethers.parseEther('0.1'),
    dailyWithdrawalLimit: ethers.parseEther('10'),
    maxSingleWithdrawal: ethers.parseEther('5'),
    circuitBreakerThreshold: ethers.parseEther('2'),
  };

  beforeEach(async function () {
    [admin, operator, collector, registry, project, emergencyRecipient, other] =
      await ethers.getSigners();

    const PlatformTreasuryUpgradeable = await ethers.getContractFactory(
      'PlatformTreasuryUpgradeable'
    );

    platformTreasury = (await upgrades.deployProxy(
      PlatformTreasuryUpgradeable,
      [
        admin.address,
        registry.address,
        emergencyRecipient.address,
        CONFIG.emergencyWithdrawalThreshold,
        CONFIG.dailyWithdrawalLimit,
        CONFIG.maxSingleWithdrawal,
        CONFIG.circuitBreakerThreshold,
      ],
      {
        initializer: 'initialize',
        kind: 'uups',
      }
    )) as unknown as PlatformTreasuryUpgradeable;

    await platformTreasury.waitForDeployment();

    // Grant roles
    const OPERATOR_ROLE = await platformTreasury.OPERATOR_ROLE();
    const COLLECTOR_ROLE = await platformTreasury.COLLECTOR_ROLE();

    await platformTreasury.grantRole(OPERATOR_ROLE, operator.address);
    await platformTreasury.grantRole(COLLECTOR_ROLE, collector.address);
  });

  describe('Deployment', function () {
    it('Should set the correct initial configuration', async function () {
      expect(await platformTreasury.platformRegistry()).to.equal(
        registry.address
      );
      expect(await platformTreasury.emergencyRecipient()).to.equal(
        emergencyRecipient.address
      );

      const [emergencyMode, emergencyActivatedAt] =
        await platformTreasury.getEmergencyStatus();
      expect(emergencyMode).to.be.false;
      expect(emergencyActivatedAt).to.equal(0);
    });

    it('Should set the correct emergency limits', async function () {
      const emergencyLimits = await platformTreasury.getEmergencyLimits();
      expect(emergencyLimits.dailyWithdrawalLimit).to.equal(
        CONFIG.dailyWithdrawalLimit
      );
      expect(emergencyLimits.maxSingleWithdrawal).to.equal(
        CONFIG.maxSingleWithdrawal
      );
      expect(emergencyLimits.emergencyThreshold).to.equal(
        CONFIG.emergencyWithdrawalThreshold
      );
    });

    it('Should set the correct admin roles', async function () {
      const DEFAULT_ADMIN_ROLE = await platformTreasury.DEFAULT_ADMIN_ROLE();
      const ADMIN_ROLE = await platformTreasury.ADMIN_ROLE();
      const UPGRADER_ROLE = await platformTreasury.UPGRADER_ROLE();

      expect(await platformTreasury.hasRole(DEFAULT_ADMIN_ROLE, admin.address))
        .to.be.true;
      expect(await platformTreasury.hasRole(ADMIN_ROLE, admin.address)).to.be
        .true;
      expect(await platformTreasury.hasRole(UPGRADER_ROLE, admin.address)).to.be
        .true;
    });
  });

  describe('Fee Collection', function () {
    it('Should collect listing fee', async function () {
      const feeAmount = ethers.parseEther('0.001');

      await expect(
        platformTreasury.collectListingFee(project.address, {
          value: feeAmount,
        })
      )
        .to.emit(platformTreasury, 'ListingFeeCollected')
        .withArgs(project.address, feeAmount);

      const ethFees = await platformTreasury.getEthFees();
      expect(ethFees.listingFees).to.equal(feeAmount);
      expect(ethFees.totalCollected).to.equal(feeAmount);
    });

    it('Should collect management fee', async function () {
      const feeAmount = ethers.parseEther('0.05');

      await expect(
        platformTreasury.collectManagementFee(project.address, {
          value: feeAmount,
        })
      )
        .to.emit(platformTreasury, 'ManagementFeeCollected')
        .withArgs(project.address, feeAmount);

      const ethFees = await platformTreasury.getEthFees();
      expect(ethFees.managementFees).to.equal(feeAmount);
      expect(ethFees.totalCollected).to.equal(feeAmount);
    });

    it('Should prevent fee collection in emergency mode', async function () {
      await platformTreasury.activateEmergencyMode();

      await expect(
        platformTreasury.collectListingFee(project.address, {
          value: ethers.parseEther('0.001'),
        })
      ).to.be.revertedWith('Contract in emergency mode');
    });

    it('Should prevent fee collection when paused', async function () {
      await platformTreasury.pause();

      await expect(
        platformTreasury.collectListingFee(project.address, {
          value: ethers.parseEther('0.001'),
        })
      ).to.be.revertedWith('Pausable: paused');
    });
  });

  describe('Emergency Controls', function () {
    it('Should allow admin to activate emergency mode', async function () {
      await expect(platformTreasury.activateEmergencyMode())
        .to.emit(platformTreasury, 'EmergencyModeActivated')
        .withArgs(admin.address);

      const [emergencyMode, emergencyActivatedAt] =
        await platformTreasury.getEmergencyStatus();
      expect(emergencyMode).to.be.true;
      expect(emergencyActivatedAt).to.be.greaterThan(0);
    });

    it('Should allow admin to deactivate emergency mode', async function () {
      await platformTreasury.activateEmergencyMode();

      await expect(platformTreasury.deactivateEmergencyMode())
        .to.emit(platformTreasury, 'EmergencyModeDeactivated')
        .withArgs(admin.address);

      const [emergencyMode, emergencyActivatedAt] =
        await platformTreasury.getEmergencyStatus();
      expect(emergencyMode).to.be.false;
      expect(emergencyActivatedAt).to.equal(0);
    });

    it('Should prevent non-admin from activating emergency mode', async function () {
      await expect(
        platformTreasury.connect(other).activateEmergencyMode()
      ).to.be.revertedWith('AccessControl:');
    });
  });

  describe('Withdrawal Requests', function () {
    beforeEach(async function () {
      // Add some balance to the contract
      await platformTreasury.collectListingFee(project.address, {
        value: ethers.parseEther('1'),
      });
    });

    it('Should allow operator to request withdrawal', async function () {
      const amount = ethers.parseEther('0.5');

      await expect(
        platformTreasury
          .connect(operator)
          .requestWithdrawal(amount, other.address, 'Test withdrawal')
      )
        .to.emit(platformTreasury, 'WithdrawalRequested')
        .withArgs(1, other.address, amount);

      const request = await platformTreasury.getWithdrawalRequest(1);
      expect(request.amount).to.equal(amount);
      expect(request.recipient).to.equal(other.address);
      expect(request.reason).to.equal('Test withdrawal');
      expect(request.executed).to.be.false;
    });

    it('Should prevent withdrawal request exceeding single withdrawal limit', async function () {
      const amount = ethers.parseEther('10'); // Exceeds maxSingleWithdrawal

      await expect(
        platformTreasury
          .connect(operator)
          .requestWithdrawal(amount, other.address, 'Test withdrawal')
      ).to.be.revertedWith('Amount exceeds single withdrawal limit');
    });

    it('Should prevent withdrawal request in emergency mode', async function () {
      await platformTreasury.activateEmergencyMode();

      await expect(
        platformTreasury
          .connect(operator)
          .requestWithdrawal(
            ethers.parseEther('0.5'),
            other.address,
            'Test withdrawal'
          )
      ).to.be.revertedWith('Contract in emergency mode');
    });
  });

  describe('Withdrawal Execution', function () {
    beforeEach(async function () {
      // Add balance and create withdrawal request
      await platformTreasury.collectListingFee(project.address, {
        value: ethers.parseEther('1'),
      });
      await platformTreasury
        .connect(operator)
        .requestWithdrawal(
          ethers.parseEther('0.5'),
          other.address,
          'Test withdrawal'
        );
    });

    it('Should execute withdrawal after delay', async function () {
      // Increase time by 24 hours + 1 second
      await time.increase(24 * 60 * 60 + 1);

      const initialBalance = await ethers.provider.getBalance(other.address);

      await expect(platformTreasury.executeWithdrawal(1))
        .to.emit(platformTreasury, 'WithdrawalExecuted')
        .withArgs(1, other.address, ethers.parseEther('0.5'));

      const finalBalance = await ethers.provider.getBalance(other.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther('0.5'));

      const request = await platformTreasury.getWithdrawalRequest(1);
      expect(request.executed).to.be.true;
    });

    it('Should prevent withdrawal execution before delay', async function () {
      await expect(platformTreasury.executeWithdrawal(1)).to.be.revertedWith(
        'Withdrawal delay not met'
      );
    });

    it('Should prevent withdrawal execution in emergency mode', async function () {
      await time.increase(24 * 60 * 60 + 1);
      await platformTreasury.activateEmergencyMode();

      await expect(platformTreasury.executeWithdrawal(1)).to.be.revertedWith(
        'Contract in emergency mode'
      );
    });
  });

  describe('Daily Withdrawal Limits', function () {
    beforeEach(async function () {
      // Add sufficient balance
      await platformTreasury.collectListingFee(project.address, {
        value: ethers.parseEther('20'),
      });
    });

    it('Should enforce daily withdrawal limits', async function () {
      // Request and execute first withdrawal
      await platformTreasury
        .connect(operator)
        .requestWithdrawal(
          ethers.parseEther('5'),
          other.address,
          'First withdrawal'
        );
      await time.increase(24 * 60 * 60 + 1);
      await platformTreasury.executeWithdrawal(1);

      // Request second withdrawal that would exceed daily limit
      await platformTreasury
        .connect(operator)
        .requestWithdrawal(
          ethers.parseEther('8'),
          other.address,
          'Second withdrawal'
        );
      await time.increase(24 * 60 * 60 + 1);

      await expect(platformTreasury.executeWithdrawal(2)).to.be.revertedWith(
        'Daily withdrawal limit exceeded'
      );
    });

    it('Should reset daily limits after 24 hours', async function () {
      // First withdrawal
      await platformTreasury
        .connect(operator)
        .requestWithdrawal(
          ethers.parseEther('5'),
          other.address,
          'First withdrawal'
        );
      await time.increase(24 * 60 * 60 + 1);
      await platformTreasury.executeWithdrawal(1);

      // Wait for daily reset and make another withdrawal
      await time.increase(24 * 60 * 60 + 1);
      await platformTreasury
        .connect(operator)
        .requestWithdrawal(
          ethers.parseEther('5'),
          other.address,
          'Second withdrawal'
        );
      await time.increase(24 * 60 * 60 + 1);

      await expect(platformTreasury.executeWithdrawal(2)).to.not.be.reverted;
    });

    it('Should track remaining daily limit', async function () {
      const initialLimit = await platformTreasury.getRemainingDailyLimit();
      expect(initialLimit).to.equal(CONFIG.dailyWithdrawalLimit);

      // Execute a withdrawal
      await platformTreasury
        .connect(operator)
        .requestWithdrawal(
          ethers.parseEther('3'),
          other.address,
          'Test withdrawal'
        );
      await time.increase(24 * 60 * 60 + 1);
      await platformTreasury.executeWithdrawal(1);

      const remainingLimit = await platformTreasury.getRemainingDailyLimit();
      expect(remainingLimit).to.equal(
        CONFIG.dailyWithdrawalLimit - ethers.parseEther('3')
      );
    });
  });

  describe('Circuit Breaker', function () {
    beforeEach(async function () {
      await platformTreasury.collectListingFee(project.address, {
        value: ethers.parseEther('10'),
      });
    });

    it('Should prevent withdrawal request when circuit breaker is triggered', async function () {
      await platformTreasury.triggerCircuitBreaker();

      await expect(
        platformTreasury
          .connect(operator)
          .requestWithdrawal(
            ethers.parseEther('3'),
            other.address,
            'Test withdrawal'
          )
      ).to.be.revertedWith('Circuit breaker triggered');
    });

    it('Should allow circuit breaker reset', async function () {
      await platformTreasury.triggerCircuitBreaker();
      expect(await platformTreasury.isCircuitBreakerActive()).to.be.true;

      await expect(platformTreasury.resetCircuitBreaker())
        .to.emit(platformTreasury, 'CircuitBreakerReset')
        .withArgs(admin.address);

      expect(await platformTreasury.isCircuitBreakerActive()).to.be.false;
    });

    it('Should automatically reset circuit breaker after window', async function () {
      await platformTreasury.triggerCircuitBreaker();
      expect(await platformTreasury.isCircuitBreakerActive()).to.be.true;

      // Wait for circuit breaker window to pass (1 hour)
      await time.increase(60 * 60 + 1);

      expect(await platformTreasury.isCircuitBreakerActive()).to.be.false;
    });
  });

  describe('Emergency Withdrawal', function () {
    beforeEach(async function () {
      await platformTreasury.collectListingFee(project.address, {
        value: ethers.parseEther('1'),
      });
    });

    it('Should allow emergency withdrawal in emergency mode', async function () {
      await platformTreasury.activateEmergencyMode();

      const amount = ethers.parseEther('0.2');
      await expect(
        platformTreasury.emergencyWithdraw(amount, 'Critical emergency')
      )
        .to.emit(platformTreasury, 'EmergencyWithdrawal')
        .withArgs(emergencyRecipient.address, amount, 'Critical emergency');
    });

    it('Should prevent emergency withdrawal when not in emergency mode', async function () {
      await expect(
        platformTreasury.emergencyWithdraw(
          ethers.parseEther('0.2'),
          'Test emergency'
        )
      ).to.be.revertedWith('Contract not in emergency mode');
    });

    it('Should enforce emergency withdrawal threshold', async function () {
      await platformTreasury.activateEmergencyMode();

      const smallAmount = ethers.parseEther('0.05'); // Below threshold
      await expect(
        platformTreasury.emergencyWithdraw(smallAmount, 'Test emergency')
      ).to.be.revertedWith('Below emergency threshold');
    });
  });

  describe('Configuration Updates', function () {
    it('Should update emergency limits', async function () {
      const newLimits = {
        dailyLimit: ethers.parseEther('20'),
        maxSingle: ethers.parseEther('10'),
        emergencyThreshold: ethers.parseEther('0.2'),
      };

      await platformTreasury.updateEmergencyLimits(
        newLimits.dailyLimit,
        newLimits.maxSingle,
        newLimits.emergencyThreshold
      );

      const emergencyLimits = await platformTreasury.getEmergencyLimits();
      expect(emergencyLimits.dailyWithdrawalLimit).to.equal(
        newLimits.dailyLimit
      );
      expect(emergencyLimits.maxSingleWithdrawal).to.equal(newLimits.maxSingle);
      expect(emergencyLimits.emergencyThreshold).to.equal(
        newLimits.emergencyThreshold
      );
    });

    it('Should update circuit breaker parameters', async function () {
      const newThreshold = ethers.parseEther('5');
      const newWindow = 2 * 60 * 60; // 2 hours

      await platformTreasury.updateCircuitBreaker(newThreshold, newWindow);

      expect(await platformTreasury.circuitBreakerThreshold()).to.equal(
        newThreshold
      );
      expect(await platformTreasury.circuitBreakerWindow()).to.equal(newWindow);
    });

    it('Should update withdrawal delay', async function () {
      const newDelay = 48 * 60 * 60; // 48 hours

      await expect(platformTreasury.updateWithdrawalDelay(newDelay))
        .to.emit(platformTreasury, 'WithdrawalDelayUpdated')
        .withArgs(24 * 60 * 60, newDelay);

      expect(await platformTreasury.withdrawalDelay()).to.equal(newDelay);
    });

    it('Should prevent invalid withdrawal delay', async function () {
      const invalidDelay = 8 * 24 * 60 * 60; // 8 days (too long)

      await expect(
        platformTreasury.updateWithdrawalDelay(invalidDelay)
      ).to.be.revertedWith('Invalid delay');
    });
  });

  describe('UUPS Upgradeability', function () {
    it('Should allow admin to upgrade contract', async function () {
      const PlatformTreasuryUpgradeableV2 = await ethers.getContractFactory(
        'PlatformTreasuryUpgradeable'
      );

      // This should not revert
      await expect(
        upgrades.upgradeProxy(
          platformTreasury.target,
          PlatformTreasuryUpgradeableV2
        )
      ).to.not.be.reverted;
    });

    it('Should prevent non-admin from upgrading', async function () {
      const PlatformTreasuryUpgradeableV2 = await ethers.getContractFactory(
        'PlatformTreasuryUpgradeable',
        other
      );

      await expect(
        upgrades.upgradeProxy(
          platformTreasury.target,
          PlatformTreasuryUpgradeableV2
        )
      ).to.be.revertedWith('AccessControl:');
    });
  });

  describe('Edge Cases', function () {
    it('Should handle zero balance withdrawal attempts', async function () {
      await expect(
        platformTreasury
          .connect(operator)
          .requestWithdrawal(ethers.parseEther('0.1'), other.address, 'Test')
      ).to.be.revertedWith('Insufficient balance');
    });

    it('Should handle invalid withdrawal request IDs', async function () {
      await expect(platformTreasury.executeWithdrawal(999)).to.be.revertedWith(
        'Invalid request ID'
      );
    });

    it('Should handle double execution attempts', async function () {
      await platformTreasury.collectListingFee(project.address, {
        value: ethers.parseEther('1'),
      });
      await platformTreasury
        .connect(operator)
        .requestWithdrawal(ethers.parseEther('0.5'), other.address, 'Test');

      await time.increase(24 * 60 * 60 + 1);
      await platformTreasury.executeWithdrawal(1);

      await expect(platformTreasury.executeWithdrawal(1)).to.be.revertedWith(
        'Already executed'
      );
    });

    it('Should handle receive function correctly', async function () {
      const amount = ethers.parseEther('0.5');

      await admin.sendTransaction({
        to: platformTreasury.target,
        value: amount,
      });

      const ethFees = await platformTreasury.getEthFees();
      expect(ethFees.totalCollected).to.equal(amount);
    });
  });
});
