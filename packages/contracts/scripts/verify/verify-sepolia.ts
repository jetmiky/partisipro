import { run } from 'hardhat';
import { parseEther } from 'ethers';

async function main() {
  console.log('=== Verifying Contracts on Arbitrum Sepolia ===');

  // Contract addresses (update these with your deployed contract addresses)
  const PLATFORM_REGISTRY = '0x...'; // Update with deployed address
  const PLATFORM_TREASURY = '0x...'; // Update with deployed address
  const PROJECT_FACTORY = '0x...'; // Update with deployed address
  const PROJECT_TOKEN_IMPL = '0x...'; // Update with deployed address
  const PROJECT_OFFERING_IMPL = '0x...'; // Update with deployed address
  const PROJECT_TREASURY_IMPL = '0x...'; // Update with deployed address
  const PROJECT_GOVERNANCE_IMPL = '0x...'; // Update with deployed address

  // Configuration used during deployment
  const LISTING_FEE = parseEther('0.001');
  const MANAGEMENT_FEE_RATE = 500;
  const MIN_INVESTMENT = parseEther('0.0001');
  const MAX_INVESTMENT = parseEther('1');
  const EMERGENCY_THRESHOLD = parseEther('0.1');
  const DEPLOYER_ADDRESS = '0x...'; // Update with deployer address

  try {
    // 1. Verify PlatformTreasury
    console.log('1. Verifying PlatformTreasury...');
    await run('verify:verify', {
      address: PLATFORM_TREASURY,
      constructorArguments: [
        DEPLOYER_ADDRESS,
        DEPLOYER_ADDRESS,
        DEPLOYER_ADDRESS,
        EMERGENCY_THRESHOLD,
      ],
    });
    console.log('PlatformTreasury verified ✓');

    // 2. Verify PlatformRegistry
    console.log('2. Verifying PlatformRegistry...');
    await run('verify:verify', {
      address: PLATFORM_REGISTRY,
      constructorArguments: [
        DEPLOYER_ADDRESS,
        PLATFORM_TREASURY,
        LISTING_FEE,
        MANAGEMENT_FEE_RATE,
        MIN_INVESTMENT,
        MAX_INVESTMENT,
      ],
    });
    console.log('PlatformRegistry verified ✓');

    // 3. Verify ProjectToken Implementation
    console.log('3. Verifying ProjectToken implementation...');
    await run('verify:verify', {
      address: PROJECT_TOKEN_IMPL,
      constructorArguments: [],
    });
    console.log('ProjectToken implementation verified ✓');

    // 4. Verify ProjectOffering Implementation
    console.log('4. Verifying ProjectOffering implementation...');
    await run('verify:verify', {
      address: PROJECT_OFFERING_IMPL,
      constructorArguments: [],
    });
    console.log('ProjectOffering implementation verified ✓');

    // 5. Verify ProjectTreasury Implementation
    console.log('5. Verifying ProjectTreasury implementation...');
    await run('verify:verify', {
      address: PROJECT_TREASURY_IMPL,
      constructorArguments: [],
    });
    console.log('ProjectTreasury implementation verified ✓');

    // 6. Verify ProjectGovernance Implementation
    console.log('6. Verifying ProjectGovernance implementation...');
    await run('verify:verify', {
      address: PROJECT_GOVERNANCE_IMPL,
      constructorArguments: [],
    });
    console.log('ProjectGovernance implementation verified ✓');

    // 7. Verify ProjectFactory
    console.log('7. Verifying ProjectFactory...');
    await run('verify:verify', {
      address: PROJECT_FACTORY,
      constructorArguments: [
        DEPLOYER_ADDRESS,
        PLATFORM_REGISTRY,
        PLATFORM_TREASURY,
        PROJECT_TOKEN_IMPL,
        PROJECT_OFFERING_IMPL,
        PROJECT_TREASURY_IMPL,
        PROJECT_GOVERNANCE_IMPL,
      ],
    });
    console.log('ProjectFactory verified ✓');

    console.log('\n=== All Contracts Verified Successfully! ===');
    console.log('You can now view the contracts on Arbiscan Sepolia:');
    console.log(
      `- PlatformRegistry: https://sepolia.arbiscan.io/address/${PLATFORM_REGISTRY}`
    );
    console.log(
      `- PlatformTreasury: https://sepolia.arbiscan.io/address/${PLATFORM_TREASURY}`
    );
    console.log(
      `- ProjectFactory: https://sepolia.arbiscan.io/address/${PROJECT_FACTORY}`
    );
    console.log(
      `- ProjectToken Implementation: https://sepolia.arbiscan.io/address/${PROJECT_TOKEN_IMPL}`
    );
    console.log(
      `- ProjectOffering Implementation: https://sepolia.arbiscan.io/address/${PROJECT_OFFERING_IMPL}`
    );
    console.log(
      `- ProjectTreasury Implementation: https://sepolia.arbiscan.io/address/${PROJECT_TREASURY_IMPL}`
    );
    console.log(
      `- ProjectGovernance Implementation: https://sepolia.arbiscan.io/address/${PROJECT_GOVERNANCE_IMPL}`
    );
  } catch (error) {
    console.error('Verification failed:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
