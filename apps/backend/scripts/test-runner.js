#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
const { spawn } = require('child_process');

// Test runner configuration
const TEST_COMMANDS = {
  unit: 'npm run test',
  e2e: 'npm run test:e2e',
  coverage: 'npm run test:cov',
  watch: 'npm run test:watch',
  all: 'npm run test && npm run test:e2e',
};

// const EMULATOR_COMMANDS = {
//   start: 'firebase emulators:start --only auth,firestore,storage',
//   kill: 'firebase emulators:exec "echo Stopping emulators"',
// };

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Logging utilities
const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const logSuccess = message => log(`✅ ${message}`, colors.green);
const logError = message => log(`❌ ${message}`, colors.red);
const logInfo = message => log(`ℹ️  ${message}`, colors.blue);
const logWarning = message => log(`⚠️  ${message}`, colors.yellow);

// Execute command and return promise
const executeCommand = (command, options = {}) => {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: true,
      ...options,
    });

    child.on('close', code => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', reject);
  });
};

// Check if Firebase emulators are running
const checkEmulatorsRunning = async () => {
  try {
    const response = await fetch('http://localhost:4000');
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Start Firebase emulators
const startEmulators = async () => {
  logInfo('Starting Firebase emulators...');

  const emulatorProcess = spawn(
    'firebase',
    ['emulators:start', '--only', 'auth,firestore,storage'],
    {
      stdio: 'pipe',
      shell: true,
    }
  );

  return new Promise((resolve, reject) => {
    let resolved = false;

    emulatorProcess.stdout.on('data', data => {
      const output = data.toString();
      if (output.includes('All emulators ready!') && !resolved) {
        resolved = true;
        logSuccess('Firebase emulators started successfully');
        resolve(emulatorProcess);
      }
    });

    emulatorProcess.stderr.on('data', data => {
      const error = data.toString();
      if (error.includes('Error') && !resolved) {
        resolved = true;
        logError('Failed to start Firebase emulators');
        reject(new Error(error));
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        logError('Timeout waiting for Firebase emulators to start');
        reject(new Error('Emulator start timeout'));
      }
    }, 30000);
  });
};

// Stop Firebase emulators
const stopEmulators = emulatorProcess => {
  if (emulatorProcess) {
    logInfo('Stopping Firebase emulators...');
    emulatorProcess.kill('SIGTERM');
    logSuccess('Firebase emulators stopped');
  }
};

// Main test runner function
const runTests = async (testType = 'unit', withEmulators = false) => {
  let emulatorProcess = null;

  try {
    logInfo(`Running ${testType} tests...`);

    // Start emulators if needed
    if (withEmulators) {
      const emulatorsRunning = await checkEmulatorsRunning();
      if (!emulatorsRunning) {
        emulatorProcess = await startEmulators();
        // Wait a bit for emulators to be fully ready
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        logInfo('Firebase emulators already running');
      }
    }

    // Run tests
    const testCommand = TEST_COMMANDS[testType];
    if (!testCommand) {
      throw new Error(`Unknown test type: ${testType}`);
    }

    await executeCommand(testCommand);
    logSuccess(`${testType} tests completed successfully`);
  } catch (error) {
    logError(`Tests failed: ${error.message}`);
    process.exit(1);
  } finally {
    // Clean up emulators if we started them
    if (emulatorProcess) {
      stopEmulators(emulatorProcess);
    }
  }
};

// Setup test environment
const setupTestEnvironment = async () => {
  logInfo('Setting up test environment...');

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env._FIREBASE_PROJECT_ID = 'partisipro-test';
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  process.env.JWT_SECRET = 'test-jwt-secret';

  logSuccess('Test environment setup complete');
};

// Clean up test environment
const cleanupTestEnvironment = async () => {
  logInfo('Cleaning up test environment...');

  try {
    // Clear test data if needed
    await executeCommand('firebase emulators:exec "echo Clearing test data"');
  } catch (error) {
    logWarning('Failed to clear test data (this is usually okay)');
  }

  logSuccess('Test environment cleanup complete');
};

// Generate test report
const generateTestReport = async () => {
  logInfo('Generating test report...');

  try {
    // Generate coverage report
    await executeCommand('npm run test:cov');

    // Generate E2E report
    await executeCommand('npm run test:e2e');

    logSuccess('Test report generated successfully');
    logInfo('Coverage report: ./coverage/lcov-report/index.html');
    logInfo('E2E report: ./coverage-e2e/lcov-report/index.html');
  } catch (error) {
    logError(`Failed to generate test report: ${error.message}`);
  }
};

// Main CLI handler
const main = async () => {
  const args = process.argv.slice(2);
  const testType = args[0] || 'unit';
  const withEmulators = args.includes('--with-emulators') || testType === 'e2e';
  const generateReport = args.includes('--report');

  await setupTestEnvironment();

  try {
    if (generateReport) {
      await generateTestReport();
    } else {
      await runTests(testType, withEmulators);
    }
  } finally {
    await cleanupTestEnvironment();
  }
};

// Help text
const showHelp = () => {
  console.log(`
${colors.bright}Partisipro Backend Test Runner${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node scripts/test-runner.js [test-type] [options]

${colors.cyan}Test Types:${colors.reset}
  unit        Run unit tests (default)
  e2e         Run end-to-end tests
  coverage    Run tests with coverage
  watch       Run tests in watch mode
  all         Run both unit and e2e tests

${colors.cyan}Options:${colors.reset}
  --with-emulators    Start Firebase emulators before running tests
  --report            Generate comprehensive test report
  --help              Show this help message

${colors.cyan}Examples:${colors.reset}
  node scripts/test-runner.js unit
  node scripts/test-runner.js e2e --with-emulators
  node scripts/test-runner.js all --report
  node scripts/test-runner.js watch

${colors.cyan}Available Commands:${colors.reset}
  ${Object.keys(TEST_COMMANDS)
    .map(cmd => `  ${cmd}`)
    .join('\n')}
`);
};

// Handle CLI arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run main function
main().catch(error => {
  logError(`Test runner failed: ${error.message}`);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  logInfo('Test runner interrupted');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logInfo('Test runner terminated');
  process.exit(0);
});
