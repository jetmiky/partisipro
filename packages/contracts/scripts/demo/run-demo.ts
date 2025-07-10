import { execSync } from 'child_process';

/**
 * Script to run different demo scenarios
 */
async function main() {
  const args = process.argv.slice(2);
  const demoType = args[0] || 'full';

  console.log('🚀 Partisipro Demo Runner');
  console.log('='.repeat(30));

  const demos = {
    full: {
      script: 'scripts/demo/full-demo.ts',
      description: 'Complete end-to-end platform demonstration',
    },
    lifecycle: {
      script: 'scripts/demo/project-lifecycle.ts',
      description: 'Project creation and investment lifecycle',
    },
    governance: {
      script: 'scripts/demo/governance-demo.ts',
      description: 'Governance system with voting and proposals',
    },
  };

  if (!demos[demoType as keyof typeof demos]) {
    console.log('❌ Invalid demo type. Available demos:');
    Object.keys(demos).forEach(key => {
      console.log(
        `  - ${key}: ${demos[key as keyof typeof demos].description}`
      );
    });
    console.log(
      '\\nUsage: npx hardhat run scripts/demo/run-demo.ts --network hardhat [demo-type]'
    );
    return;
  }

  const demo = demos[demoType as keyof typeof demos];

  console.log(`🎯 Running: ${demo.description}`);
  console.log(`📁 Script: ${demo.script}`);
  console.log('-'.repeat(30));

  try {
    // Run the demo script
    execSync(`npx hardhat run ${demo.script} --network hardhat`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    console.log('\\n✅ Demo completed successfully!');
  } catch (error) {
    console.error('\\n❌ Demo failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Demo runner failed:', error);
    process.exit(1);
  });
