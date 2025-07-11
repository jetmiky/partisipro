import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { time } from '@nomicfoundation/hardhat-network-helpers';
import {
  IdentityRegistryAdvanced,
  ClaimTopicsRegistry,
  TrustedIssuersRegistry,
} from '../typechain-types';

describe('IdentityRegistryAdvanced', function () {
  let identityRegistry: IdentityRegistryAdvanced;
  let claimTopicsRegistry: ClaimTopicsRegistry;
  let trustedIssuersRegistry: TrustedIssuersRegistry;
  let admin: SignerWithAddress;
  let operator: SignerWithAddress;
  let issuer: SignerWithAddress;
  let investor1: SignerWithAddress;
  let investor2: SignerWithAddress;
  let investor3: SignerWithAddress;
  let other: SignerWithAddress;

  const DEFAULT_EXPIRATION_PERIOD = 365 * 24 * 60 * 60; // 1 year
  const RENEWAL_GRACE_PERIOD = 30 * 24 * 60 * 60; // 30 days
  const CACHE_VALIDITY_PERIOD = 24 * 60 * 60; // 24 hours

  beforeEach(async function () {
    [admin, operator, issuer, investor1, investor2, investor3, other] =
      await ethers.getSigners();

    // Deploy ClaimTopicsRegistry
    const ClaimTopicsRegistry = await ethers.getContractFactory(
      'ClaimTopicsRegistry'
    );
    claimTopicsRegistry = await ClaimTopicsRegistry.deploy(admin.address);
    await claimTopicsRegistry.waitForDeployment();

    // Deploy TrustedIssuersRegistry
    const TrustedIssuersRegistry = await ethers.getContractFactory(
      'TrustedIssuersRegistry'
    );
    trustedIssuersRegistry = await TrustedIssuersRegistry.deploy(
      admin.address,
      await claimTopicsRegistry.getAddress()
    );
    await trustedIssuersRegistry.waitForDeployment();

    // Deploy IdentityRegistryAdvanced as upgradeable
    const IdentityRegistryAdvanced = await ethers.getContractFactory(
      'IdentityRegistryAdvanced'
    );
    identityRegistry = (await upgrades.deployProxy(
      IdentityRegistryAdvanced,
      [
        admin.address,
        await claimTopicsRegistry.getAddress(),
        await trustedIssuersRegistry.getAddress(),
        DEFAULT_EXPIRATION_PERIOD,
        RENEWAL_GRACE_PERIOD,
        CACHE_VALIDITY_PERIOD,
      ],
      {
        initializer: 'initialize',
        kind: 'uups',
      }
    )) as unknown as IdentityRegistryAdvanced;

    await identityRegistry.waitForDeployment();

    // Grant roles
    const OPERATOR_ROLE = await identityRegistry.OPERATOR_ROLE();
    const ISSUER_ROLE = await identityRegistry.ISSUER_ROLE();

    await identityRegistry.grantRole(OPERATOR_ROLE, operator.address);
    await identityRegistry.grantRole(ISSUER_ROLE, issuer.address);

    // Setup trusted issuer
    const kycTopic = await claimTopicsRegistry.KYC_APPROVED();
    await trustedIssuersRegistry.addTrustedIssuer(issuer.address, [kycTopic]);
  });

  describe('Deployment & Initialization', function () {
    it('Should initialize with correct parameters', async function () {
      const config = await identityRegistry.getExpirationConfig();
      expect(config.defaultExpirationPeriod).to.equal(
        DEFAULT_EXPIRATION_PERIOD
      );
      expect(config.renewalGracePeriod).to.equal(RENEWAL_GRACE_PERIOD);
      expect(config.autoExpirationEnabled).to.be.true;
      expect(config.batchExpirationCheckLimit).to.equal(50);
    });

    it('Should set correct admin roles', async function () {
      const DEFAULT_ADMIN_ROLE = await identityRegistry.DEFAULT_ADMIN_ROLE();
      const ADMIN_ROLE = await identityRegistry.ADMIN_ROLE();
      const UPGRADER_ROLE = await identityRegistry.UPGRADER_ROLE();

      expect(await identityRegistry.hasRole(DEFAULT_ADMIN_ROLE, admin.address))
        .to.be.true;
      expect(await identityRegistry.hasRole(ADMIN_ROLE, admin.address)).to.be
        .true;
      expect(await identityRegistry.hasRole(UPGRADER_ROLE, admin.address)).to.be
        .true;
    });

    it('Should initialize with KYC as required claim topic', async function () {
      const requiredTopics = await identityRegistry.getRequiredClaimTopics();
      const kycTopic = await claimTopicsRegistry.KYC_APPROVED();
      expect(requiredTopics.length).to.equal(1);
      expect(requiredTopics[0]).to.equal(kycTopic);
    });
  });

  describe('Batch Identity Registration', function () {
    it('Should register multiple identities in batch', async function () {
      const identities = [
        investor1.address,
        investor2.address,
        investor3.address,
      ];

      const batchId = await identityRegistry
        .connect(operator)
        .batchRegisterIdentities.staticCall(identities);
      await identityRegistry
        .connect(operator)
        .batchRegisterIdentities(identities);

      const result = await identityRegistry.getBatchResult(batchId);
      expect(result.successCount).to.equal(3);
      expect(result.failureCount).to.equal(0);

      // Check that all identities are registered
      for (const identity of identities) {
        const info = await identityRegistry.getIdentityInfo(identity);
        expect(info.exists).to.be.true;
      }
    });

    it('Should handle batch registration with some failures', async function () {
      const identities = [
        investor1.address,
        ethers.ZeroAddress,
        investor2.address,
      ];

      const batchId = await identityRegistry
        .connect(operator)
        .batchRegisterIdentities.staticCall(identities);
      await identityRegistry
        .connect(operator)
        .batchRegisterIdentities(identities);

      const result = await identityRegistry.getBatchResult(batchId);
      expect(result.successCount).to.equal(2);
      expect(result.failureCount).to.equal(1);
      expect(result.failedIndices.length).to.equal(1);
      expect(result.failedIndices[0]).to.equal(1);
    });

    it('Should enforce batch size limits', async function () {
      const identities = new Array(101).fill(investor1.address);

      await expect(
        identityRegistry.connect(operator).batchRegisterIdentities(identities)
      ).to.be.revertedWith('Invalid batch size');
    });

    it('Should prevent non-operators from batch registration', async function () {
      const identities = [investor1.address, investor2.address];

      await expect(
        identityRegistry.connect(other).batchRegisterIdentities(identities)
      ).to.be.revertedWith('AccessControl:');
    });
  });

  describe('Advanced Claim Management', function () {
    beforeEach(async function () {
      // Register identities
      await identityRegistry
        .connect(operator)
        .registerIdentity(investor1.address);
      await identityRegistry
        .connect(operator)
        .registerIdentity(investor2.address);
    });

    it('Should add claim with auto-renewal enabled', async function () {
      const kycTopic = await claimTopicsRegistry.KYC_APPROVED();
      const claimData = ethers.toUtf8Bytes('KYC_APPROVED');
      const expirationTime = (await time.latest()) + 30 * 24 * 60 * 60; // 30 days

      await expect(
        identityRegistry.connect(issuer).addClaim(
          investor1.address,
          kycTopic,
          claimData,
          expirationTime,
          true // auto-renewal enabled
        )
      )
        .to.emit(identityRegistry, 'ClaimAdded')
        .withArgs(
          investor1.address,
          kycTopic,
          issuer.address,
          claimData,
          expirationTime
        );

      const claim = await identityRegistry.getClaim(
        investor1.address,
        kycTopic
      );
      expect(claim.autoRenewal).to.be.true;
      expect(claim.expiresAt).to.equal(expirationTime);
    });

    it('Should use default expiration period when not specified', async function () {
      const kycTopic = await claimTopicsRegistry.KYC_APPROVED();
      const claimData = ethers.toUtf8Bytes('KYC_APPROVED');
      const currentTime = await time.latest();

      await identityRegistry.connect(issuer).addClaim(
        investor1.address,
        kycTopic,
        claimData,
        0, // Use default expiration
        false
      );

      const claim = await identityRegistry.getClaim(
        investor1.address,
        kycTopic
      );
      expect(claim.expiresAt).to.be.greaterThan(currentTime);
      expect(claim.expiresAt).to.be.lessThanOrEqual(
        currentTime + DEFAULT_EXPIRATION_PERIOD + 100
      );
    });

    it('Should batch add multiple claims', async function () {
      const kycTopic = await claimTopicsRegistry.KYC_APPROVED();
      const claimData = ethers.toUtf8Bytes('KYC_APPROVED');
      const expirationTime = (await time.latest()) + 30 * 24 * 60 * 60;

      const requests = [
        {
          identity: investor1.address,
          topicId: kycTopic,
          data: claimData,
          expiresAt: expirationTime,
          autoRenewal: true,
        },
        {
          identity: investor2.address,
          topicId: kycTopic,
          data: claimData,
          expiresAt: expirationTime,
          autoRenewal: false,
        },
      ];

      const batchId = await identityRegistry
        .connect(issuer)
        .batchAddClaims.staticCall(requests);
      await identityRegistry.connect(issuer).batchAddClaims(requests);

      const result = await identityRegistry.getBatchResult(batchId);
      expect(result.successCount).to.equal(2);
      expect(result.failureCount).to.equal(0);

      // Verify claims were added
      const claim1 = await identityRegistry.getClaim(
        investor1.address,
        kycTopic
      );
      const claim2 = await identityRegistry.getClaim(
        investor2.address,
        kycTopic
      );

      expect(claim1.autoRenewal).to.be.true;
      expect(claim2.autoRenewal).to.be.false;
    });
  });

  describe('Automated Claim Expiration', function () {
    beforeEach(async function () {
      await identityRegistry
        .connect(operator)
        .registerIdentity(investor1.address);
      await identityRegistry
        .connect(operator)
        .registerIdentity(investor2.address);
    });

    it('Should track expiring claims', async function () {
      const kycTopic = await claimTopicsRegistry.KYC_APPROVED();
      const claimData = ethers.toUtf8Bytes('KYC_APPROVED');
      const shortExpirationTime = (await time.latest()) + 1 * 24 * 60 * 60; // 1 day

      // Add claims that will expire soon
      await identityRegistry
        .connect(issuer)
        .addClaim(
          investor1.address,
          kycTopic,
          claimData,
          shortExpirationTime,
          false
        );

      await identityRegistry
        .connect(issuer)
        .addClaim(
          investor2.address,
          kycTopic,
          claimData,
          shortExpirationTime,
          false
        );

      // Check expiring identities
      const expiringIdentities = await identityRegistry.getExpiringIdentities(
        2 * 24 * 60 * 60
      ); // 2 days
      expect(expiringIdentities.length).to.equal(2);
      expect(expiringIdentities).to.include(investor1.address);
      expect(expiringIdentities).to.include(investor2.address);
    });

    it('Should process expired claims automatically', async function () {
      const kycTopic = await claimTopicsRegistry.KYC_APPROVED();
      const claimData = ethers.toUtf8Bytes('KYC_APPROVED');
      const shortExpirationTime = (await time.latest()) + 1000; // Expires in 1000 seconds

      // Add claim that will expire soon
      await identityRegistry
        .connect(issuer)
        .addClaim(
          investor1.address,
          kycTopic,
          claimData,
          shortExpirationTime,
          false
        );

      // Verify identity is verified initially
      expect(await identityRegistry.isIdentityVerified(investor1.address)).to.be
        .true;

      // Move time forward past expiration
      await time.increaseTo(shortExpirationTime + 1);

      // Process expired claims
      await expect(identityRegistry.connect(operator).processExpiredClaims(10))
        .to.emit(identityRegistry, 'ClaimExpired')
        .withArgs(investor1.address, kycTopic, shortExpirationTime);

      // Verify identity is no longer verified
      expect(await identityRegistry.isIdentityVerified(investor1.address)).to.be
        .false;
    });

    it('Should auto-renew claims when enabled', async function () {
      const kycTopic = await claimTopicsRegistry.KYC_APPROVED();
      const claimData = ethers.toUtf8Bytes('KYC_APPROVED');
      const shortExpirationTime = (await time.latest()) + 1000;

      // Add claim with auto-renewal enabled
      await identityRegistry
        .connect(issuer)
        .addClaim(
          investor1.address,
          kycTopic,
          claimData,
          shortExpirationTime,
          true
        );

      // Enable auto-renewal for the identity
      await identityRegistry
        .connect(investor1)
        .setAutoRenewal(investor1.address, true);

      // Move time forward past expiration
      await time.increaseTo(shortExpirationTime + 1);

      // Process expired claims
      await expect(identityRegistry.connect(operator).processExpiredClaims(10))
        .to.emit(identityRegistry, 'ClaimRenewed')
        .withArgs(
          investor1.address,
          kycTopic,
          shortExpirationTime + DEFAULT_EXPIRATION_PERIOD
        );

      // Verify identity is still verified
      expect(await identityRegistry.isIdentityVerified(investor1.address)).to.be
        .true;

      // Verify claim was renewed
      const claim = await identityRegistry.getClaim(
        investor1.address,
        kycTopic
      );
      expect(claim.renewalCount).to.equal(1);
      expect(claim.expiresAt).to.be.greaterThan(shortExpirationTime);
    });

    it('Should handle batch expiration processing', async function () {
      const kycTopic = await claimTopicsRegistry.KYC_APPROVED();
      const claimData = ethers.toUtf8Bytes('KYC_APPROVED');
      const shortExpirationTime = (await time.latest()) + 1000;

      // Add multiple claims that will expire
      const identities = [investor1.address, investor2.address];
      for (const identity of identities) {
        await identityRegistry
          .connect(issuer)
          .addClaim(identity, kycTopic, claimData, shortExpirationTime, false);
      }

      // Move time forward past expiration
      await time.increaseTo(shortExpirationTime + 1);

      // Process expired claims
      const processedCount = await identityRegistry
        .connect(operator)
        .processExpiredClaims.staticCall(10);
      await identityRegistry.connect(operator).processExpiredClaims(10);

      expect(processedCount).to.be.greaterThan(0);

      // Verify all identities are no longer verified
      for (const identity of identities) {
        expect(await identityRegistry.isIdentityVerified(identity)).to.be.false;
      }
    });
  });

  describe('Auto-Renewal Management', function () {
    beforeEach(async function () {
      await identityRegistry
        .connect(operator)
        .registerIdentity(investor1.address);
    });

    it('Should allow identity owner to enable auto-renewal', async function () {
      await expect(
        identityRegistry
          .connect(investor1)
          .setAutoRenewal(investor1.address, true)
      )
        .to.emit(identityRegistry, 'AutoRenewalStatusChanged')
        .withArgs(investor1.address, true);

      // Note: autoRenewalEnabled is not in the public struct, so we test through behavior
    });

    it('Should allow admin to enable auto-renewal', async function () {
      await expect(
        identityRegistry.connect(admin).setAutoRenewal(investor1.address, true)
      )
        .to.emit(identityRegistry, 'AutoRenewalStatusChanged')
        .withArgs(investor1.address, true);
    });

    it('Should prevent unauthorized auto-renewal changes', async function () {
      await expect(
        identityRegistry.connect(other).setAutoRenewal(investor1.address, true)
      ).to.be.revertedWith('Not authorized to change auto-renewal');
    });

    it('Should require existing identity for auto-renewal', async function () {
      await expect(
        identityRegistry.connect(investor1).setAutoRenewal(other.address, true)
      ).to.be.revertedWith('Identity does not exist');
    });
  });

  describe('Expiration Configuration', function () {
    it('Should allow admin to update expiration configuration', async function () {
      const newDefaultPeriod = 180 * 24 * 60 * 60; // 180 days
      const newGracePeriod = 15 * 24 * 60 * 60; // 15 days
      const newBatchLimit = 25;
      const newAutoEnabled = false;

      await expect(
        identityRegistry
          .connect(admin)
          .updateExpirationConfig(
            newDefaultPeriod,
            newGracePeriod,
            newBatchLimit,
            newAutoEnabled
          )
      )
        .to.emit(identityRegistry, 'ExpirationConfigUpdated')
        .withArgs(newDefaultPeriod, newGracePeriod, newAutoEnabled);

      const config = await identityRegistry.getExpirationConfig();
      expect(config.defaultExpirationPeriod).to.equal(newDefaultPeriod);
      expect(config.renewalGracePeriod).to.equal(newGracePeriod);
      expect(config.batchExpirationCheckLimit).to.equal(newBatchLimit);
      expect(config.autoExpirationEnabled).to.equal(newAutoEnabled);
    });

    it('Should prevent invalid expiration configuration', async function () {
      await expect(
        identityRegistry.connect(admin).updateExpirationConfig(
          0, // Invalid default period
          RENEWAL_GRACE_PERIOD,
          50,
          true
        )
      ).to.be.revertedWith('Invalid expiration period');

      await expect(
        identityRegistry.connect(admin).updateExpirationConfig(
          DEFAULT_EXPIRATION_PERIOD,
          0, // Invalid grace period
          50,
          true
        )
      ).to.be.revertedWith('Invalid grace period');

      await expect(
        identityRegistry.connect(admin).updateExpirationConfig(
          DEFAULT_EXPIRATION_PERIOD,
          RENEWAL_GRACE_PERIOD,
          101, // Invalid batch limit
          true
        )
      ).to.be.revertedWith('Invalid batch limit');
    });

    it('Should prevent non-admin from updating configuration', async function () {
      await expect(
        identityRegistry
          .connect(other)
          .updateExpirationConfig(
            DEFAULT_EXPIRATION_PERIOD,
            RENEWAL_GRACE_PERIOD,
            50,
            true
          )
      ).to.be.revertedWith('AccessControl:');
    });
  });

  describe('Batch Operations Results', function () {
    it('Should track batch operation results', async function () {
      const identities = [investor1.address, investor2.address];

      const batchId = await identityRegistry
        .connect(operator)
        .batchRegisterIdentities.staticCall(identities);
      await identityRegistry
        .connect(operator)
        .batchRegisterIdentities(identities);

      const result = await identityRegistry.getBatchResult(batchId);
      expect(result.successCount).to.equal(2);
      expect(result.failureCount).to.equal(0);
      expect(result.failedIndices.length).to.equal(0);
      expect(result.failureReasons.length).to.equal(0);
    });

    it('Should provide detailed failure information', async function () {
      const identities = [investor1.address, ethers.ZeroAddress];

      const batchId = await identityRegistry
        .connect(operator)
        .batchRegisterIdentities.staticCall(identities);
      await identityRegistry
        .connect(operator)
        .batchRegisterIdentities(identities);

      const result = await identityRegistry.getBatchResult(batchId);
      expect(result.successCount).to.equal(1);
      expect(result.failureCount).to.equal(1);
      expect(result.failedIndices.length).to.equal(1);
      expect(result.failureReasons.length).to.equal(1);
      expect(result.failedIndices[0]).to.equal(1);
      expect(result.failureReasons[0]).to.not.be.empty;
    });
  });

  describe('UUPS Upgradeability', function () {
    it('Should allow admin to upgrade contract', async function () {
      const IdentityRegistryAdvancedV2 = await ethers.getContractFactory(
        'IdentityRegistryAdvanced'
      );

      await expect(
        upgrades.upgradeProxy(
          identityRegistry.target,
          IdentityRegistryAdvancedV2
        )
      ).to.not.be.reverted;
    });

    it('Should prevent non-admin from upgrading', async function () {
      const IdentityRegistryAdvancedV2 = await ethers.getContractFactory(
        'IdentityRegistryAdvanced',
        other
      );

      await expect(
        upgrades.upgradeProxy(
          identityRegistry.target,
          IdentityRegistryAdvancedV2
        )
      ).to.be.revertedWith('AccessControl:');
    });
  });

  describe('Pause/Unpause Functionality', function () {
    it('Should allow pauser to pause contract', async function () {
      await identityRegistry.connect(admin).pause();

      await expect(
        identityRegistry.connect(operator).registerIdentity(investor1.address)
      ).to.be.revertedWith('Pausable: paused');
    });

    it('Should allow pauser to unpause contract', async function () {
      await identityRegistry.connect(admin).pause();
      await identityRegistry.connect(admin).unpause();

      await expect(
        identityRegistry.connect(operator).registerIdentity(investor1.address)
      ).to.not.be.reverted;
    });

    it('Should prevent non-pauser from pausing', async function () {
      await expect(identityRegistry.connect(other).pause()).to.be.revertedWith(
        'AccessControl:'
      );
    });
  });

  describe('Performance Optimizations', function () {
    it('Should provide efficient batch verification', async function () {
      // Register and verify multiple identities
      const identities = [
        investor1.address,
        investor2.address,
        investor3.address,
      ];
      const kycTopic = await claimTopicsRegistry.KYC_APPROVED();
      const claimData = ethers.toUtf8Bytes('KYC_APPROVED');

      for (const identity of identities) {
        await identityRegistry.connect(operator).registerIdentity(identity);
        await identityRegistry
          .connect(issuer)
          .addClaim(identity, kycTopic, claimData, 0, false);
      }

      // Batch check verification
      const verificationStatuses =
        await identityRegistry.batchCheckVerification(identities);
      expect(verificationStatuses.length).to.equal(3);
      expect(verificationStatuses.every(status => status === true)).to.be.true;
    });

    it('Should handle large batch verification efficiently', async function () {
      const identities = new Array(50).fill(investor1.address);

      const verificationStatuses =
        await identityRegistry.batchCheckVerification(identities);
      expect(verificationStatuses.length).to.equal(50);
    });
  });

  describe('Edge Cases', function () {
    it('Should handle empty batch operations', async function () {
      await expect(
        identityRegistry.connect(operator).batchRegisterIdentities([])
      ).to.be.revertedWith('Invalid batch size');
    });

    it('Should handle processing expired claims when none exist', async function () {
      const processedCount = await identityRegistry
        .connect(operator)
        .processExpiredClaims.staticCall(10);
      expect(processedCount).to.equal(0);
    });

    it('Should handle expiring identities query when none exist', async function () {
      const expiringIdentities = await identityRegistry.getExpiringIdentities(
        30 * 24 * 60 * 60
      );
      expect(expiringIdentities.length).to.equal(0);
    });

    it('Should handle auto-renewal when issuer is no longer trusted', async function () {
      const kycTopic = await claimTopicsRegistry.KYC_APPROVED();
      const claimData = ethers.toUtf8Bytes('KYC_APPROVED');
      const shortExpirationTime = (await time.latest()) + 1000;

      await identityRegistry
        .connect(operator)
        .registerIdentity(investor1.address);
      await identityRegistry
        .connect(issuer)
        .addClaim(
          investor1.address,
          kycTopic,
          claimData,
          shortExpirationTime,
          true
        );

      await identityRegistry
        .connect(investor1)
        .setAutoRenewal(investor1.address, true);

      // Remove issuer from trusted list
      await trustedIssuersRegistry.removeTrustedIssuer(
        issuer.address,
        kycTopic
      );

      // Move time forward past expiration
      await time.increaseTo(shortExpirationTime + 1);

      // Process expired claims - should expire instead of renew
      await expect(identityRegistry.connect(operator).processExpiredClaims(10))
        .to.emit(identityRegistry, 'ClaimExpired')
        .withArgs(investor1.address, kycTopic, shortExpirationTime);
    });
  });
});
