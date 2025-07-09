import { ethers } from 'hardhat';
import { parseEther } from 'ethers';

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);
  console.log(
    'Account balance:',
    (await deployer.provider.getBalance(deployer.address)).toString()
  );

  // Configuration for Arbitrum Sepolia
  const LISTING_FEE = parseEther('0.001'); // 0.001 ETH (lower for testnet)
  const MANAGEMENT_FEE_RATE = 500; // 5%
  const MIN_INVESTMENT = parseEther('0.0001'); // 0.0001 ETH (lower for testnet)
  const MAX_INVESTMENT = parseEther('1'); // 1 ETH (lower for testnet)
  const EMERGENCY_THRESHOLD = parseEther('0.1'); // 0.1 ETH (lower for testnet)

  console.log(
    '\n=== Deploying Core Infrastructure Contracts on Arbitrum Sepolia ==='
  );

  // 1. Deploy PlatformTreasury
  console.log('1. Deploying PlatformTreasury...');
  const PlatformTreasury = await ethers.getContractFactory('PlatformTreasury');
  const platformTreasury = await PlatformTreasury.deploy(
    deployer.address, // admin
    deployer.address, // registry (will be updated later)
    deployer.address, // emergency recipient
    EMERGENCY_THRESHOLD
  );
  await platformTreasury.waitForDeployment();
  console.log(
    'PlatformTreasury deployed to:',
    await platformTreasury.getAddress()
  );

  // 2. Deploy PlatformRegistry
  console.log('2. Deploying PlatformRegistry...');
  const PlatformRegistry = await ethers.getContractFactory('PlatformRegistry');
  const platformRegistry = await PlatformRegistry.deploy(
    deployer.address, // admin
    await platformTreasury.getAddress(),
    LISTING_FEE,
    MANAGEMENT_FEE_RATE,
    MIN_INVESTMENT,
    MAX_INVESTMENT
  );
  await platformRegistry.waitForDeployment();
  console.log(
    'PlatformRegistry deployed to:',
    await platformRegistry.getAddress()
  );

  // Update treasury with correct registry address
  await platformTreasury.updatePlatformRegistry(
    await platformRegistry.getAddress()
  );
  console.log('PlatformTreasury updated with registry address');

  // 3. Deploy Project Token Implementation
  console.log('3. Deploying ProjectToken implementation...');
  const ProjectToken = await ethers.getContractFactory('ProjectToken');
  const projectTokenImpl = await ProjectToken.deploy();
  await projectTokenImpl.waitForDeployment();
  console.log(
    'ProjectToken implementation deployed to:',
    await projectTokenImpl.getAddress()
  );

  // 4. Deploy Project Offering Implementation
  console.log('4. Deploying ProjectOffering implementation...');
  const ProjectOffering = await ethers.getContractFactory('ProjectOffering');
  const projectOfferingImpl = await ProjectOffering.deploy();
  await projectOfferingImpl.waitForDeployment();
  console.log(
    'ProjectOffering implementation deployed to:',
    await projectOfferingImpl.getAddress()
  );

  // 5. Deploy Project Treasury Implementation
  console.log('5. Deploying ProjectTreasury implementation...');
  const ProjectTreasury = await ethers.getContractFactory('ProjectTreasury');
  const projectTreasuryImpl = await ProjectTreasury.deploy();
  await projectTreasuryImpl.waitForDeployment();
  console.log(
    'ProjectTreasury implementation deployed to:',
    await projectTreasuryImpl.getAddress()
  );

  // 6. Deploy Project Governance Implementation
  console.log('6. Deploying ProjectGovernance implementation...');
  const ProjectGovernance =
    await ethers.getContractFactory('ProjectGovernance');
  const projectGovernanceImpl = await ProjectGovernance.deploy();
  await projectGovernanceImpl.waitForDeployment();
  console.log(
    'ProjectGovernance implementation deployed to:',
    await projectGovernanceImpl.getAddress()
  );

  // 7. Deploy ProjectFactory
  console.log('7. Deploying ProjectFactory...');
  const ProjectFactory = await ethers.getContractFactory('ProjectFactory');
  const projectFactory = await ProjectFactory.deploy(
    deployer.address, // admin
    await platformRegistry.getAddress(),
    await platformTreasury.getAddress(),
    await projectTokenImpl.getAddress(),
    await projectOfferingImpl.getAddress(),
    await projectTreasuryImpl.getAddress(),
    await projectGovernanceImpl.getAddress()
  );
  await projectFactory.waitForDeployment();
  console.log('ProjectFactory deployed to:', await projectFactory.getAddress());

  // Authorize factory in registry
  await platformRegistry.authorizeFactory(await projectFactory.getAddress());
  console.log('ProjectFactory authorized in registry');

  console.log('\n=== Deployment Summary ===');
  console.log('Network: Arbitrum Sepolia');
  console.log('PlatformRegistry:', await platformRegistry.getAddress());
  console.log('PlatformTreasury:', await platformTreasury.getAddress());
  console.log('ProjectFactory:', await projectFactory.getAddress());
  console.log(
    'ProjectToken Implementation:',
    await projectTokenImpl.getAddress()
  );
  console.log(
    'ProjectOffering Implementation:',
    await projectOfferingImpl.getAddress()
  );
  console.log(
    'ProjectTreasury Implementation:',
    await projectTreasuryImpl.getAddress()
  );
  console.log(
    'ProjectGovernance Implementation:',
    await projectGovernanceImpl.getAddress()
  );

  // Save deployment addresses
  const deploymentInfo = {
    network: 'arbitrumSepolia',
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      PlatformRegistry: await platformRegistry.getAddress(),
      PlatformTreasury: await platformTreasury.getAddress(),
      ProjectFactory: await projectFactory.getAddress(),
      ProjectTokenImpl: await projectTokenImpl.getAddress(),
      ProjectOfferingImpl: await projectOfferingImpl.getAddress(),
      ProjectTreasuryImpl: await projectTreasuryImpl.getAddress(),
      ProjectGovernanceImpl: await projectGovernanceImpl.getAddress(),
    },
    config: {
      listingFee: LISTING_FEE.toString(),
      managementFeeRate: MANAGEMENT_FEE_RATE,
      minInvestment: MIN_INVESTMENT.toString(),
      maxInvestment: MAX_INVESTMENT.toString(),
      emergencyThreshold: EMERGENCY_THRESHOLD.toString(),
    },
  };

  console.log('\n=== Deployment Info ===');
  console.log(JSON.stringify(deploymentInfo, null, 2));

  console.log('\n=== Next Steps ===');
  console.log('1. Run verification script: npm run verify:sepolia');
  console.log('2. Update frontend configuration with contract addresses');
  console.log(
    '3. Test the deployment with sample SPV and investor registration'
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
