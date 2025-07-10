import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { PlatformRegistry, PlatformTreasury } from '../../typechain-types';

describe('PlatformRegistry', function () {
  let platformRegistry: PlatformRegistry;
  let platformTreasury: PlatformTreasury;
  let admin: SignerWithAddress;
  let operator: SignerWithAddress;
  let spv: SignerWithAddress;
  let investor: SignerWithAddress;
  let treasury: SignerWithAddress;
  let other: SignerWithAddress;

  const LISTING_FEE = ethers.parseEther('0.1');
  const MANAGEMENT_FEE_RATE = 500; // 5%
  const MIN_INVESTMENT = ethers.parseEther('0.01');
  const MAX_INVESTMENT = ethers.parseEther('10');
  const EMERGENCY_THRESHOLD = ethers.parseEther('1');

  beforeEach(async function () {
    [admin, operator, spv, investor, treasury, other] =
      await ethers.getSigners();

    // Deploy PlatformTreasury first
    const PlatformTreasury =
      await ethers.getContractFactory('PlatformTreasury');
    platformTreasury = await PlatformTreasury.deploy(
      admin.address,
      admin.address, // registry will be updated later
      treasury.address,
      EMERGENCY_THRESHOLD
    );

    // Deploy PlatformRegistry
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

    // Update treasury with correct registry address
    await platformTreasury
      .connect(admin)
      .updatePlatformRegistry(await platformRegistry.getAddress());
  });

  describe('Deployment', function () {
    it('Should set the correct admin', async function () {
      expect(
        await platformRegistry.hasRole(
          await platformRegistry.ADMIN_ROLE(),
          admin.address
        )
      ).to.be.true;
    });

    it('Should set the correct platform treasury', async function () {
      expect(await platformRegistry.platformTreasury()).to.equal(
        await platformTreasury.getAddress()
      );
    });

    it('Should set the correct platform configuration', async function () {
      const config = await platformRegistry.getPlatformConfig();
      expect(config.listingFee).to.equal(LISTING_FEE);
      expect(config.managementFeeRate).to.equal(MANAGEMENT_FEE_RATE);
      expect(config.minimumInvestment).to.equal(MIN_INVESTMENT);
      expect(config.maximumInvestment).to.equal(MAX_INVESTMENT);
      expect(config.platformActive).to.be.true;
    });
  });

  describe('SPV Management', function () {
    it('Should allow admin to register SPV', async function () {
      await expect(
        platformRegistry
          .connect(admin)
          .registerSPV(spv.address, 'Test SPV', 'SPV123456')
      )
        .to.emit(platformRegistry, 'SPVRegistered')
        .withArgs(spv.address, 'Test SPV', 'SPV123456');

      const spvInfo = await platformRegistry.getSPVInfo(spv.address);
      expect(spvInfo.name).to.equal('Test SPV');
      expect(spvInfo.registrationNumber).to.equal('SPV123456');
      expect(spvInfo.walletAddress).to.equal(spv.address);
      expect(spvInfo.isActive).to.be.true;
    });

    it('Should not allow non-admin to register SPV', async function () {
      await expect(
        platformRegistry
          .connect(other)
          .registerSPV(spv.address, 'Test SPV', 'SPV123456')
      ).to.be.reverted;
    });

    it('Should allow admin to deactivate SPV', async function () {
      await platformRegistry
        .connect(admin)
        .registerSPV(spv.address, 'Test SPV', 'SPV123456');

      await expect(platformRegistry.connect(admin).deactivateSPV(spv.address))
        .to.emit(platformRegistry, 'SPVDeactivated')
        .withArgs(spv.address);

      const spvInfo = await platformRegistry.getSPVInfo(spv.address);
      expect(spvInfo.isActive).to.be.false;
    });

    it('Should check SPV authorization correctly', async function () {
      // Initially not authorized
      expect(await platformRegistry.isSPVAuthorized(spv.address)).to.be.false;

      // Register SPV
      await platformRegistry
        .connect(admin)
        .registerSPV(spv.address, 'Test SPV', 'SPV123456');

      // Now authorized
      expect(await platformRegistry.isSPVAuthorized(spv.address)).to.be.true;

      // Deactivate SPV
      await platformRegistry.connect(admin).deactivateSPV(spv.address);

      // Not authorized anymore
      expect(await platformRegistry.isSPVAuthorized(spv.address)).to.be.false;
    });
  });

  describe('Investor Management', function () {
    beforeEach(async function () {
      // Grant operator role to operator
      await platformRegistry
        .connect(admin)
        .grantRole(await platformRegistry.OPERATOR_ROLE(), operator.address);
    });

    it('Should allow operator to verify investor', async function () {
      await expect(
        platformRegistry.connect(operator).verifyInvestor(investor.address)
      )
        .to.emit(platformRegistry, 'InvestorVerified')
        .withArgs(investor.address);

      const investorInfo = await platformRegistry.getInvestorInfo(
        investor.address
      );
      expect(investorInfo.walletAddress).to.equal(investor.address);
      expect(investorInfo.kycVerified).to.be.true;
      expect(investorInfo.isActive).to.be.true;
    });

    it('Should not allow non-operator to verify investor', async function () {
      await expect(
        platformRegistry.connect(other).verifyInvestor(investor.address)
      ).to.be.reverted;
    });

    it('Should allow admin to deactivate investor', async function () {
      await platformRegistry.connect(operator).verifyInvestor(investor.address);

      await expect(
        platformRegistry.connect(admin).deactivateInvestor(investor.address)
      )
        .to.emit(platformRegistry, 'InvestorDeactivated')
        .withArgs(investor.address);

      const investorInfo = await platformRegistry.getInvestorInfo(
        investor.address
      );
      expect(investorInfo.isActive).to.be.false;
    });

    it('Should check investor authorization correctly', async function () {
      // Initially not authorized
      expect(await platformRegistry.isInvestorAuthorized(investor.address)).to
        .be.false;

      // Verify investor
      await platformRegistry.connect(operator).verifyInvestor(investor.address);

      // Now authorized
      expect(await platformRegistry.isInvestorAuthorized(investor.address)).to
        .be.true;

      // Deactivate investor
      await platformRegistry
        .connect(admin)
        .deactivateInvestor(investor.address);

      // Not authorized anymore
      expect(await platformRegistry.isInvestorAuthorized(investor.address)).to
        .be.false;
    });
  });

  describe('Platform Configuration', function () {
    it('Should allow admin to update platform config', async function () {
      const newListingFee = ethers.parseEther('0.2');
      const newManagementFeeRate = 600; // 6%
      const newMinInvestment = ethers.parseEther('0.02');
      const newMaxInvestment = ethers.parseEther('20');

      await expect(
        platformRegistry
          .connect(admin)
          .updatePlatformConfig(
            newListingFee,
            newManagementFeeRate,
            newMinInvestment,
            newMaxInvestment
          )
      )
        .to.emit(platformRegistry, 'PlatformConfigUpdated')
        .withArgs(newListingFee, newManagementFeeRate);

      const config = await platformRegistry.getPlatformConfig();
      expect(config.listingFee).to.equal(newListingFee);
      expect(config.managementFeeRate).to.equal(newManagementFeeRate);
      expect(config.minimumInvestment).to.equal(newMinInvestment);
      expect(config.maximumInvestment).to.equal(newMaxInvestment);
    });

    it('Should not allow management fee rate above 10%', async function () {
      await expect(
        platformRegistry.connect(admin).updatePlatformConfig(
          LISTING_FEE,
          1001, // 10.01%
          MIN_INVESTMENT,
          MAX_INVESTMENT
        )
      ).to.be.revertedWith('Management fee too high');
    });

    it('Should not allow invalid investment limits', async function () {
      await expect(
        platformRegistry.connect(admin).updatePlatformConfig(
          LISTING_FEE,
          MANAGEMENT_FEE_RATE,
          ethers.parseEther('20'), // min > max
          ethers.parseEther('10')
        )
      ).to.be.revertedWith('Invalid investment limits');
    });

    it('Should allow admin to set platform active status', async function () {
      await expect(platformRegistry.connect(admin).setPlatformActive(false))
        .to.emit(platformRegistry, 'PlatformStatusChanged')
        .withArgs(false);

      const config = await platformRegistry.getPlatformConfig();
      expect(config.platformActive).to.be.false;
    });
  });

  describe('Factory Authorization', function () {
    it('Should allow admin to authorize factory', async function () {
      await expect(
        platformRegistry.connect(admin).authorizeFactory(other.address)
      )
        .to.emit(platformRegistry, 'FactoryAuthorized')
        .withArgs(other.address);

      expect(await platformRegistry.authorizedFactories(other.address)).to.be
        .true;
    });

    it('Should allow admin to deauthorize factory', async function () {
      await platformRegistry.connect(admin).authorizeFactory(other.address);

      await expect(
        platformRegistry.connect(admin).deauthorizeFactory(other.address)
      )
        .to.emit(platformRegistry, 'FactoryDeauthorized')
        .withArgs(other.address);

      expect(await platformRegistry.authorizedFactories(other.address)).to.be
        .false;
    });
  });
});
