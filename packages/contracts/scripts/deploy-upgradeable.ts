import { ethers, upgrades } from 'hardhat';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function main() {
  console.log('🚀 Starting deployment of upgradeable contracts...');

  const [deployer] = await ethers.getSigners();
  console.log('🔑 Deploying contracts with account:', deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log('💰 Account balance:', ethers.formatEther(balance), 'ETH');

  if (balance < ethers.parseEther('0.1')) {
    throw new Error('❌ Insufficient balance for deployment');
  }

  const deploymentAddresses: Record<string, string> = {};

  // Configuration parameters
  const CONFIG = {
    listingFee: ethers.parseEther('0.001'), // 0.001 ETH
    managementFeeRate: 500, // 5% (500 basis points)
    minimumInvestment: ethers.parseEther('0.0001'), // 0.0001 ETH
    maximumInvestment: ethers.parseEther('1'), // 1 ETH
    emergencyWithdrawalThreshold: ethers.parseEther('0.1'), // 0.1 ETH
    dailyWithdrawalLimit: ethers.parseEther('10'), // 10 ETH
    maxSingleWithdrawal: ethers.parseEther('5'), // 5 ETH
    circuitBreakerThreshold: ethers.parseEther('2'), // 2 ETH
  };

  try {
    // Step 1: Deploy PlatformTreasuryUpgradeable
    console.log('\n📦 Deploying PlatformTreasuryUpgradeable...');
    const PlatformTreasuryUpgradeable = await ethers.getContractFactory(
      'PlatformTreasuryUpgradeable'
    );

    const platformTreasury = await upgrades.deployProxy(
      PlatformTreasuryUpgradeable,
      [
        deployer.address, // admin
        deployer.address, // initial registry (will be updated)
        deployer.address, // emergency recipient
        CONFIG.emergencyWithdrawalThreshold,
        CONFIG.dailyWithdrawalLimit,
        CONFIG.maxSingleWithdrawal,
        CONFIG.circuitBreakerThreshold,
      ],
      {
        initializer: 'initialize',
        kind: 'uups',
      }
    );

    await platformTreasury.waitForDeployment();
    const treasuryAddress = await platformTreasury.getAddress();
    deploymentAddresses.PlatformTreasury = treasuryAddress;

    console.log('✅ PlatformTreasuryUpgradeable deployed to:', treasuryAddress);

    // Step 2: Deploy PlatformRegistryUpgradeable
    console.log('\n📦 Deploying PlatformRegistryUpgradeable...');
    const PlatformRegistryUpgradeable = await ethers.getContractFactory(
      'PlatformRegistryUpgradeable'
    );

    const platformRegistry = await upgrades.deployProxy(
      PlatformRegistryUpgradeable,
      [
        deployer.address, // admin
        treasuryAddress, // platform treasury
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
    );

    await platformRegistry.waitForDeployment();
    const registryAddress = await platformRegistry.getAddress();
    deploymentAddresses.PlatformRegistry = registryAddress;

    console.log('✅ PlatformRegistryUpgradeable deployed to:', registryAddress);

    // Step 3: Update PlatformTreasury with correct registry address
    console.log('\n🔄 Updating PlatformTreasury with registry address...');
    const updateTx =
      await platformTreasury.updatePlatformRegistry(registryAddress);
    await updateTx.wait();
    console.log('✅ PlatformTreasury updated with registry address');

    // Step 4: Verify initial configurations
    console.log('\n🔍 Verifying initial configurations...');

    // Check PlatformRegistry configuration
    const platformConfig = await platformRegistry.getPlatformConfig();
    console.log('📋 Platform Configuration:');
    console.log(
      '  - Listing Fee:',
      ethers.formatEther(platformConfig.listingFee),
      'ETH'
    );
    console.log(
      '  - Management Fee Rate:',
      platformConfig.managementFeeRate,
      'basis points'
    );
    console.log(
      '  - Min Investment:',
      ethers.formatEther(platformConfig.minimumInvestment),
      'ETH'
    );
    console.log(
      '  - Max Investment:',
      ethers.formatEther(platformConfig.maximumInvestment),
      'ETH'
    );
    console.log('  - Platform Active:', platformConfig.platformActive);

    // Check PlatformTreasury configuration
    const treasuryRegistry = await platformTreasury.platformRegistry();
    console.log('📋 Treasury Configuration:');
    console.log('  - Registry Address:', treasuryRegistry);
    console.log(
      '  - Emergency Recipient:',
      await platformTreasury.emergencyRecipient()
    );

    // Check emergency status
    const [emergencyMode, emergencyActivatedAt] =
      await platformRegistry.getEmergencyStatus();
    console.log('🚨 Emergency Status:');
    console.log('  - Emergency Mode:', emergencyMode);
    console.log('  - Activated At:', emergencyActivatedAt);

    // Step 5: Test emergency functions
    console.log('\n🧪 Testing emergency functions...');

    // Test pause/unpause
    console.log('Testing pause functionality...');
    const pauseTx = await platformRegistry.pause();
    await pauseTx.wait();
    console.log('✅ Contract paused successfully');

    const unpauseTx = await platformRegistry.unpause();
    await unpauseTx.wait();
    console.log('✅ Contract unpaused successfully');

    // Test emergency mode (activate and deactivate)
    console.log('Testing emergency mode...');
    const emergencyActivateTx = await platformRegistry.activateEmergencyMode();
    await emergencyActivateTx.wait();
    console.log('✅ Emergency mode activated successfully');

    const emergencyDeactivateTx =
      await platformRegistry.deactivateEmergencyMode();
    await emergencyDeactivateTx.wait();
    console.log('✅ Emergency mode deactivated successfully');

    // Step 6: Save deployment addresses
    const deploymentData = {
      network: 'hardhat',
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: deploymentAddresses,
      configuration: {
        listingFee: CONFIG.listingFee.toString(),
        managementFeeRate: CONFIG.managementFeeRate,
        minimumInvestment: CONFIG.minimumInvestment.toString(),
        maximumInvestment: CONFIG.maximumInvestment.toString(),
        emergencyWithdrawalThreshold:
          CONFIG.emergencyWithdrawalThreshold.toString(),
        dailyWithdrawalLimit: CONFIG.dailyWithdrawalLimit.toString(),
        maxSingleWithdrawal: CONFIG.maxSingleWithdrawal.toString(),
        circuitBreakerThreshold: CONFIG.circuitBreakerThreshold.toString(),
      },
    };

    const deploymentPath = join(
      __dirname,
      '../deployments/upgradeable-contracts.json'
    );
    writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));

    console.log('\n✅ Deployment completed successfully!');
    console.log('📝 Deployment data saved to:', deploymentPath);
    console.log('\n📋 Deployed Contract Addresses:');
    console.log(
      '  - PlatformRegistryUpgradeable:',
      deploymentAddresses.PlatformRegistry
    );
    console.log(
      '  - PlatformTreasuryUpgradeable:',
      deploymentAddresses.PlatformTreasury
    );

    console.log('\n🎯 Phase 1 Security Features:');
    console.log('  ✅ UUPS Upgradeability implemented');
    console.log('  ✅ Emergency pause/unpause functionality');
    console.log('  ✅ Emergency mode with circuit breaker');
    console.log('  ✅ Daily withdrawal limits');
    console.log('  ✅ Emergency withdrawal capabilities');
    console.log('  ✅ Activity tracking and monitoring');

    return deploymentAddresses;
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export default main;
