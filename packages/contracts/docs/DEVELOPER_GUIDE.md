# Partisipro Platform Developer Guide

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Architecture](#architecture)
4. [Smart Contracts](#smart-contracts)
5. [SDK Usage](#sdk-usage)
6. [Development Tools](#development-tools)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Monitoring & Analytics](#monitoring--analytics)
10. [Security](#security)
11. [Troubleshooting](#troubleshooting)
12. [API Reference](#api-reference)
13. [Best Practices](#best-practices)
14. [Contributing](#contributing)

## Overview

The Partisipro Platform is a comprehensive blockchain-based solution for Public
Private Partnership (PPP) funding that tokenizes large-scale infrastructure
projects in Indonesia. The platform enables retail investors to participate
through fractional ownership using ERC-3643 compliant tokens.

### Key Features

- **ERC-3643 Compliance**: Industry-standard regulatory compliance for token
  transfers
- **Identity-Centric Architecture**: One-time KYC verification for all platform
  projects
- **Factory Pattern**: Isolated contract deployment for each project
- **UUPS Upgradeability**: Production-ready upgrade mechanisms
- **Comprehensive Monitoring**: Real-time health monitoring and analytics
- **Automated Compliance**: Built-in regulatory reporting and violation
  detection

### Platform Components

- **Core Infrastructure**: PlatformRegistry, PlatformTreasury, ProjectFactory
- **ERC-3643 Compliance**: IdentityRegistry, ClaimTopicsRegistry,
  TrustedIssuersRegistry
- **Per-Project Contracts**: ProjectToken, ProjectOffering, ProjectTreasury,
  ProjectGovernance
- **Advanced Features (Phase 2)**:
  - IdentityRegistryAdvanced: Automated claim management, batch operations
  - ProjectGovernanceAdvanced: Proposal templates, voting incentives, delegation
  - ProjectTreasuryAdvanced: Dynamic fees, vesting schedules, batch operations
- **Upgradeable Infrastructure (Phase 1)**:
  - PlatformRegistryUpgradeable: UUPS upgradeable registry with emergency
    controls
  - PlatformTreasuryUpgradeable: UUPS upgradeable treasury with circuit breakers
- **Development Tools**: Enhanced deployment, monitoring, analytics, compliance
  reporting, TypeScript SDK

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn package manager
- Git for version control
- A code editor (VSCode recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/partisipro/blockchain-platform.git
cd blockchain-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Environment Variables

```bash
# Network Configuration
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
ARBITRUM_ONE_RPC_URL=https://arb1.arbitrum.io/rpc
PRIVATE_KEY=your_private_key_here

# API Keys
ARBISCAN_API_KEY=your_arbiscan_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key

# Database (for backend integration)
DB_HOST=localhost
DB_NAME=partisipro
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password

# External Services
KYC_PROVIDER_API_KEY=your_kyc_provider_key
PAYMENT_GATEWAY_API_KEY=your_payment_gateway_key
```

### Quick Start

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to local network
npm run deploy:local

# Deploy to Arbitrum Sepolia testnet
npm run deploy:sepolia

# Start development server
npm run dev
```

## Architecture

### System Architecture

The platform uses a hybrid on-chain/off-chain architecture:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Off-Chain Components                             │
├─────────────────────────────────────────────────────────────────────┤
│ Frontend (Next.js)  │ Backend (NestJS)  │ External Services      │
│ - User Interface    │ - API Gateway     │ - KYC Providers       │
│ - Web3 Integration  │ - Authentication  │ - Payment Gateways     │
│ - State Management  │ - Data Processing │ - Notification Systems │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     On-Chain Components                             │
├─────────────────────────────────────────────────────────────────────┤
│ Core Infrastructure                                                 │
│ ├─ PlatformRegistry (SPV management, configuration)                │
│ ├─ PlatformTreasury (fee collection, emergency controls)           │
│ └─ ProjectFactory (project deployment with compliance)             │
│                                                                     │
│ ERC-3643 Compliance Infrastructure                                  │
│ ├─ IdentityRegistry (central identity management)                  │
│ ├─ ClaimTopicsRegistry (standardized claim types)                  │
│ └─ TrustedIssuersRegistry (authorized KYC providers)               │
│                                                                     │
│ Per-Project Contracts (Deployed via Factory)                       │
│ ├─ ProjectToken (ERC-3643 compliant tokens)                       │
│ ├─ ProjectOffering (token sale with identity verification)         │
│ ├─ ProjectTreasury (profit distribution)                          │
│ └─ ProjectGovernance (token holder voting)                        │
└─────────────────────────────────────────────────────────────────────┘
```

### ERC-3643 Compliance Model

The platform implements a sophisticated identity-centric compliance model:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Identity Verification Flow                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 1. KYC Verification                                                 │
│    └─ Third-party KYC providers verify investor identity           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. Claim Issuance                                                   │
│    └─ Trusted issuers add claims to IdentityRegistry               │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. Identity Registration                                            │
│    └─ Investor identity registered with verification status        │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. Token Transfers                                                  │
│    └─ All transfers automatically check identity verification       │
└─────────────────────────────────────────────────────────────────────┘
```

## Smart Contracts

### Core Infrastructure Contracts

#### PlatformRegistry

The central registry for SPV management and platform configuration.

```solidity
// Key Functions
function registerSPV(address spvAddress) external;
function updatePlatformConfig(
  uint256 listingFee,
  uint256 managementFeeRate
) external;
function activateEmergencyMode() external;
function deactivateEmergencyMode() external;
function pause() external;
function unpause() external;

// View Functions
function getPlatformConfig() external view returns (PlatformConfig memory);
function isSPVRegistered(address spvAddress) external view returns (bool);
function getEmergencyStatus()
  external
  view
  returns (bool emergencyMode, uint256 activatedAt);
```

#### PlatformTreasury

Secure treasury management with emergency controls.

```solidity
// Key Functions
function collectFees(uint256 amount) external;
function emergencyWithdraw(address recipient, uint256 amount) external;
function updateWithdrawalLimits(uint256 dailyLimit, uint256 maxSingle) external;
function activateEmergencyMode() external;

// View Functions
function getTreasuryBalance() external view returns (uint256);
function getWithdrawalLimits()
  external
  view
  returns (uint256 daily, uint256 maxSingle);
function getEmergencyStatus() external view returns (bool);
```

#### ProjectFactory

Factory pattern for deploying isolated project contracts.

```solidity
// Key Functions
function createProject(
  string memory tokenName,
  string memory tokenSymbol,
  uint256 totalSupply,
  uint256 offeringPrice,
  uint256 offeringDuration
) external payable returns (uint256 projectId);

function updateImplementations(
  address tokenImpl,
  address offeringImpl,
  address treasuryImpl,
  address governanceImpl
) external;

// View Functions
function getProjectCount() external view returns (uint256);
function getProjectAddress(uint256 projectId) external view returns (address);
function getProjectData(
  uint256 projectId
) external view returns (ProjectData memory);
```

### ERC-3643 Compliance Contracts

#### IdentityRegistry

Central identity management with claim verification.

```solidity
// Key Functions
function registerIdentity(
  address userAddress,
  string memory identityId,
  Claim[] memory claims
) external;

function addClaim(address userAddress, Claim memory claim) external;
function updateClaim(
  address userAddress,
  uint256 claimIndex,
  Claim memory claim
) external;
function removeClaim(address userAddress, uint256 claimIndex) external;
function batchRegisterIdentities(IdentityData[] memory identities) external;

// View Functions
function isVerified(address userAddress) external view returns (bool);
function getClaims(address userAddress) external view returns (Claim[] memory);
function getClaimsByTopic(
  address userAddress,
  uint256 topic
) external view returns (Claim[] memory);
function isClaimValid(
  address userAddress,
  uint256 claimIndex
) external view returns (bool);
```

#### ClaimTopicsRegistry

Standardized claim types for compliance.

```solidity
// Predefined Claim Topics
uint256 public constant KYC_APPROVED = 1;
uint256 public constant ACCREDITED_INVESTOR = 2;
uint256 public constant INSTITUTIONAL_INVESTOR = 3;
uint256 public constant COUNTRY_RESTRICTION = 4;
uint256 public constant INVESTMENT_LIMIT = 5;

// Key Functions
function addClaimTopic(uint256 topic, string memory description) external;
function updateClaimTopic(uint256 topic, string memory description) external;
function removeClaimTopic(uint256 topic) external;

// View Functions
function getClaimTopicDescription(uint256 topic) external view returns (string memory);
function getAllClaimTopics() external view returns (uint256[] memory);
```

#### TrustedIssuersRegistry

Management of authorized claim issuers.

```solidity
// Key Functions
function addTrustedIssuer(
  address issuer,
  uint256[] memory allowedClaimTopics
) external;
function removeTrustedIssuer(address issuer) external;
function updateIssuerClaimTopics(
  address issuer,
  uint256[] memory allowedClaimTopics
) external;

// View Functions
function isTrustedIssuer(address issuer) external view returns (bool);
function getIssuerClaimTopics(
  address issuer
) external view returns (uint256[] memory);
function getTrustedIssuers() external view returns (address[] memory);
```

### Per-Project Contracts

#### ProjectToken (ERC-3643)

Compliant token with identity-based transfer restrictions.

```solidity
// ERC-20 + ERC-3643 Functions
function transfer(address to, uint256 amount) external returns (bool);
function approve(address spender, uint256 amount) external returns (bool);
function mint(address to, uint256 amount) external;
function burn(uint256 amount) external;

// Governance Functions
function getVotes(address account) external view returns (uint256);
function delegate(address delegatee) external;
function delegateBySig(
  address delegatee,
  uint256 nonce,
  uint256 expiry,
  uint8 v,
  bytes32 r,
  bytes32 s
) external;

// Compliance Functions
function canTransfer(
  address from,
  address to,
  uint256 amount
) external view returns (bool);
function getIdentityRegistry() external view returns (address);
```

#### ProjectOffering

Token sale with identity verification enforcement.

```solidity
// Key Functions
function buyTokens(uint256 amount) external payable;
function claimTokens() external;
function finalizeOffering() external;
function setOfferingParameters(
  uint256 price,
  uint256 duration,
  uint256 minInvestment
) external;

// View Functions
function getOfferingInfo() external view returns (OfferingInfo memory);
function getInvestorData(
  address investor
) external view returns (InvestorData memory);
function getRemainingTokens() external view returns (uint256);
```

#### ProjectTreasury

Automated profit distribution with platform fee deduction.

```solidity
// Key Functions
function distributeProfits(uint256 amount) external;
function claimProfits() external;
function setVestingSchedule(uint256 cliff, uint256 vesting) external;
function emergencyWithdraw(address recipient, uint256 amount) external;

// View Functions
function getClaimableAmount(address investor) external view returns (uint256);
function getTotalDistributed() external view returns (uint256);
function getVestingInfo(
  address investor
) external view returns (VestingInfo memory);
```

#### ProjectGovernance

Token-weighted voting with proposal management.

```solidity
// Key Functions
function propose(
  address[] memory targets,
  uint256[] memory values,
  bytes[] memory calldatas,
  string memory description
) external returns (uint256);
function castVote(uint256 proposalId, uint8 support) external returns (uint256);
function castVoteWithReason(
  uint256 proposalId,
  uint8 support,
  string memory reason
) external returns (uint256);
function execute(uint256 proposalId) external;

// View Functions
function getProposal(
  uint256 proposalId
) external view returns (Proposal memory);
function getVotes(
  address account,
  uint256 blockNumber
) external view returns (uint256);
function hasVoted(
  uint256 proposalId,
  address account
) external view returns (bool);
function proposalDeadline(uint256 proposalId) external view returns (uint256);
function proposalSnapshot(uint256 proposalId) external view returns (uint256);
```

## SDK Usage

### Installation

```bash
npm install @partisipro/blockchain-sdk
```

### Basic Usage

```typescript
import {
  createPartisiproSDK,
  NETWORK_CONFIGS,
} from '@partisipro/blockchain-sdk';
import { ethers } from 'ethers';

// Create wallet
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!);

// Create SDK instance
const sdk = createPartisiproSDK(NETWORK_CONFIGS.arbitrumSepolia, wallet);

// Initialize SDK
await sdk.initialize();

// Register SPV
const txHash = await sdk.registerSPV(
  '0x1234567890123456789012345678901234567890'
);
console.log('SPV registered:', txHash);

// Register identity
const identityData = {
  userAddress: '0x1234567890123456789012345678901234567890',
  identityId: 'user-123',
  claims: [
    {
      topic: 1, // KYC_APPROVED
      issuer: '0x5678901234567890123456789012345678901234',
      signature: '0x...',
      data: '0x...',
      validity: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year
    },
  ],
};

const identityTxHash = await sdk.registerIdentity(identityData);
console.log('Identity registered:', identityTxHash);

// Create project
const projectParams = {
  tokenName: 'Jakarta Metro Project',
  tokenSymbol: 'JMP',
  totalSupply: ethers.parseEther('1000000'),
  offeringPrice: ethers.parseEther('0.1'),
  offeringDuration: 30 * 24 * 60 * 60, // 30 days
  projectMetadata: {
    name: 'Jakarta Metro Line Extension',
    description: 'Extension of Jakarta Metro Line 1',
    location: 'Jakarta, Indonesia',
    category: 'Transportation',
    expectedROI: 8.5,
    riskLevel: 'medium' as const,
  },
};

const { projectId, projectAddress } = await sdk.createProject(projectParams);
console.log('Project created:', projectId, projectAddress);

// Invest in project
const investmentData = {
  projectAddress,
  amount: ethers.parseEther('1'),
  investorAddress: wallet.address,
  paymentMethod: 'crypto' as const,
};

const investmentTxHash = await sdk.investInProject(investmentData);
console.log('Investment made:', investmentTxHash);
```

### Advanced Usage

```typescript
// Enable monitoring
const sdkWithMonitoring = createPartisiproSDK(
  {
    ...NETWORK_CONFIGS.arbitrumSepolia,
    monitoring: {
      enabled: true,
      checkInterval: 30000,
      alertThresholds: {
        responseTime: 5000,
        gasPrice: 50,
        errorRate: 5,
      },
    },
  },
  wallet
);

await sdkWithMonitoring.initialize();

// Start health monitoring
await sdkWithMonitoring.startHealthMonitoring();

// Listen for health updates
sdkWithMonitoring.on('healthUpdate', status => {
  console.log('Health status:', status.overallStatus);
});

// Generate analytics report
const analyticsReport = await sdkWithMonitoring.generateAnalyticsReport();
console.log('Analytics report:', analyticsReport);

// Generate compliance report
const complianceReport = await sdkWithMonitoring.generateComplianceReport();
console.log('Compliance score:', complianceReport.overallComplianceScore);
```

### Event Handling

```typescript
// Listen for contract events
sdk.listenToContractEvents('PlatformRegistry', 'SPVRegistered', event => {
  console.log('New SPV registered:', event.args.spvAddress);
});

sdk.listenToContractEvents('IdentityRegistry', 'IdentityRegistered', event => {
  console.log('New identity registered:', event.args.userAddress);
});

sdk.listenToContractEvents('ProjectFactory', 'ProjectCreated', event => {
  console.log('New project created:', event.args.projectId);
});

// Listen for SDK events
sdk.on('spvRegistered', data => {
  console.log('SPV registered via SDK:', data.spvAddress);
});

sdk.on('projectCreated', data => {
  console.log('Project created via SDK:', data.projectId);
});

sdk.on('investmentMade', data => {
  console.log('Investment made via SDK:', data.amount);
});
```

## Advanced Contract Features (Phase 2)

### Identity Registry Advanced

The `IdentityRegistryAdvanced` contract provides enhanced identity management
capabilities:

```typescript
// Get advanced identity registry contract
const identityAdvanced = sdk.getContract('IdentityRegistryAdvanced');

// Batch register multiple identities
const userAddresses = ['0x123...', '0x456...', '0x789...'];
const identityIds = ['user-1', 'user-2', 'user-3'];
await identityAdvanced.batchRegisterIdentities(userAddresses, identityIds);

// Auto-renew claims
await identityAdvanced.autoRenewClaim(
  '0x123...', // user address
  1, // KYC_APPROVED topic
  Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60 // new expiration
);

// Batch process expired claims
const expiredUsers = ['0x123...', '0x456...'];
const expiredTopics = [1, 1]; // KYC_APPROVED for both
await identityAdvanced.batchProcessExpiredClaims(expiredUsers, expiredTopics);

// Check verification cache
const cache = await identityAdvanced.getVerificationCache('0x123...');
console.log(
  'Verification status:',
  cache.isVerified,
  'Last update:',
  cache.lastUpdate
);
```

### Project Governance Advanced

Enhanced governance with voting incentives and delegation:

```typescript
const governanceAdvanced = sdk.getContract('ProjectGovernanceAdvanced');

// Create proposal from template
await governanceAdvanced.createProposalFromTemplate(
  1, // template ID for fee adjustment
  ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [250]) // 2.5% fee
);

// Delegate voting power
await governanceAdvanced.delegateVotingPower('0x456...'); // delegate address

// Cast vote with incentive
await governanceAdvanced.castVoteWithIncentive(
  1, // proposal ID
  1 // support (1 = for, 0 = against, 2 = abstain)
);

// Check voting incentives
const incentives = await governanceAdvanced.getVotingIncentives('0x123...');
console.log('Rewards:', incentives.rewards, 'Streak:', incentives.streak);
```

### Project Treasury Advanced

Advanced treasury features with vesting and dynamic fees:

```typescript
const treasuryAdvanced = sdk.getContract('ProjectTreasuryAdvanced');

// Create vesting schedule
await treasuryAdvanced.createVestingSchedule(
  '0x123...', // beneficiary
  ethers.parseEther('1000'), // amount
  365 * 24 * 60 * 60, // cliff duration (1 year)
  4 * 365 * 24 * 60 * 60 // vesting duration (4 years)
);

// Claim vested tokens
await treasuryAdvanced.claimVestedTokens();

// Update dynamic fee rate (admin only)
await treasuryAdvanced.updateDynamicFeeRate(275); // 2.75%

// Batch claim profits for multiple beneficiaries
const beneficiaries = ['0x123...', '0x456...', '0x789...'];
await treasuryAdvanced.batchClaimProfits(beneficiaries);
```

### Upgradeable Contracts (Phase 1)

Working with UUPS upgradeable contracts:

```typescript
// Platform Registry Upgradeable
const registryUpgradeable = sdk.getContract('PlatformRegistryUpgradeable');

// Emergency mode management
await registryUpgradeable.activateEmergencyMode();
await registryUpgradeable.deactivateEmergencyMode();

// Upgrade contract (admin only)
await registryUpgradeable.upgradeTo('0x789...'); // new implementation address

// Platform Treasury Upgradeable
const treasuryUpgradeable = sdk.getContract('PlatformTreasuryUpgradeable');

// Set daily withdrawal limits
await treasuryUpgradeable.setDailyWithdrawalLimit(ethers.parseEther('1000'));

// Emergency withdrawal (admin only)
await treasuryUpgradeable.emergencyWithdraw(ethers.parseEther('500'));
```

## Development Tools

### Enhanced Deployment

```bash
# Deploy with enhanced features
npx hardhat run scripts/deploy-enhanced.ts --network arbitrumSepolia

# Deploy with rollback capability
npx hardhat run scripts/deploy-enhanced.ts --network arbitrumSepolia --rollback-target deployment-2024-01-01.json

# Verify deployment
npx hardhat verify --network arbitrumSepolia DEPLOYED_CONTRACT_ADDRESS "constructor" "arguments"
```

### Contract Interaction Utilities

```typescript
import { ContractInteractionUtils } from './scripts/utils/ContractInteractionUtils';

const utils = new ContractInteractionUtils(provider, signer);

// Load contracts from deployment
const configs = await utils.loadDeploymentConfig(
  './deployments/latest-deployment.json'
);
configs.forEach(config => utils.registerContract(config));

// Execute single function
const result = await utils.executeFunction('PlatformRegistry', 'registerSPV', [
  spvAddress,
]);

// Execute batch operations
const operations = [
  {
    contractName: 'PlatformRegistry',
    functionName: 'registerSPV',
    args: [spv1],
  },
  {
    contractName: 'PlatformRegistry',
    functionName: 'registerSPV',
    args: [spv2],
  },
];
const batchResult = await utils.executeBatchOperations(operations);

// Generate interaction report
const reportPath = utils.generateInteractionReport();
```

### Health Monitoring

```typescript
import { PlatformHealthMonitor } from './scripts/utils/PlatformHealthMonitor';

const monitor = new PlatformHealthMonitor(provider, {
  checkInterval: 30000,
  alertThresholds: {
    responseTime: 5000,
    gasPrice: 50,
    errorRate: 5,
  },
  contracts: deployedContracts,
});

await monitor.startMonitoring();

monitor.on('healthUpdate', status => {
  console.log('Platform health:', status.overallStatus);
});

monitor.on('error', error => {
  console.error('Monitoring error:', error);
});
```

### Analytics & Reporting

```typescript
import { OnChainAnalytics } from './scripts/utils/OnChainAnalytics';
import { ComplianceReporting } from './scripts/utils/ComplianceReporting';

// Generate analytics report
const analytics = new OnChainAnalytics(provider, analyticsConfig);
const analyticsReport = await analytics.generateAnalyticsReport();
analytics.saveAnalyticsReport(analyticsReport);

// Generate compliance report
const compliance = new ComplianceReporting(provider, complianceConfig);
const complianceReport = await compliance.generateComplianceReport();
compliance.saveComplianceReport(complianceReport);
```

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test test/PlatformRegistry.test.ts

# Run tests with coverage
npm run test:coverage

# Run tests with gas reporting
npm run test:gas

# Run integration tests
npm run test:integration
```

### Test Structure

```typescript
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';

describe('PlatformRegistry', function () {
  async function deployPlatformRegistryFixture() {
    const [owner, spv1, spv2] = await ethers.getSigners();

    const PlatformRegistry =
      await ethers.getContractFactory('PlatformRegistry');
    const registry = await PlatformRegistry.deploy();

    return { registry, owner, spv1, spv2 };
  }

  it('Should register SPV successfully', async function () {
    const { registry, owner, spv1 } = await loadFixture(
      deployPlatformRegistryFixture
    );

    await expect(registry.registerSPV(spv1.address))
      .to.emit(registry, 'SPVRegistered')
      .withArgs(spv1.address, anyValue);

    expect(await registry.isSPVRegistered(spv1.address)).to.be.true;
  });

  it('Should reject duplicate SPV registration', async function () {
    const { registry, owner, spv1 } = await loadFixture(
      deployPlatformRegistryFixture
    );

    await registry.registerSPV(spv1.address);

    await expect(registry.registerSPV(spv1.address)).to.be.revertedWith(
      'SPV already registered'
    );
  });
});
```

### Integration Tests

```typescript
describe('End-to-End Project Flow', function () {
  it('Should complete full project lifecycle', async function () {
    // Deploy all contracts
    const contracts = await deployFullPlatform();

    // Register SPV
    await contracts.registry.registerSPV(spv.address);

    // Register investor identity
    await contracts.identityRegistry.registerIdentity(
      investor.address,
      'investor-123',
      [kycClaim]
    );

    // Create project
    const tx = await contracts.factory.createProject(
      'Test Project',
      'TEST',
      ethers.parseEther('1000'),
      ethers.parseEther('0.1'),
      30 * 24 * 60 * 60
    );

    const receipt = await tx.wait();
    const projectAddress = getProjectAddressFromReceipt(receipt);

    // Invest in project
    const projectOffering = await ethers.getContractAt(
      'ProjectOffering',
      projectAddress
    );
    await projectOffering.connect(investor).buyTokens(ethers.parseEther('1'), {
      value: ethers.parseEther('0.1'),
    });

    // Verify investment
    const investorBalance = await projectOffering.getInvestorData(
      investor.address
    );
    expect(investorBalance.tokenAmount).to.equal(ethers.parseEther('1'));
  });
});
```

## Deployment

### Local Development

```bash
# Start local Hardhat network
npx hardhat node

# Deploy to local network
npm run deploy:local

# Verify deployment
npm run verify:local
```

### Testnet Deployment

```bash
# Deploy to Arbitrum Sepolia
npm run deploy:sepolia

# Verify contracts
npm run verify:sepolia

# Run post-deployment tests
npm run test:sepolia
```

### Production Deployment

```bash
# Deploy to Arbitrum One (mainnet)
npm run deploy:mainnet

# Verify contracts
npm run verify:mainnet

# Start monitoring
npm run monitor:mainnet
```

### Deployment Configuration

```javascript
// hardhat.config.js
const config = {
  networks: {
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 421614,
      gasPrice: 100000000, // 0.1 gwei
    },
    arbitrumOne: {
      url: process.env.ARBITRUM_ONE_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 42161,
      gasPrice: 100000000, // 0.1 gwei
    },
  },
  etherscan: {
    apiKey: {
      arbitrumSepolia: process.env.ARBISCAN_API_KEY,
      arbitrumOne: process.env.ARBISCAN_API_KEY,
    },
  },
};
```

## Monitoring & Analytics

### Real-time Monitoring

```typescript
// Set up monitoring
const monitor = new PlatformHealthMonitor(provider, {
  checkInterval: 30000,
  contracts: deployedContracts,
});

await monitor.startMonitoring();

// Monitor specific metrics
monitor.on('healthUpdate', status => {
  if (status.overallStatus === 'critical') {
    // Send alert
    sendAlert(`Platform health critical: ${status.alerts.length} alerts`);
  }
});
```

### Analytics Dashboard

```typescript
// Generate regular reports
setInterval(
  async () => {
    const analytics = new OnChainAnalytics(provider, analyticsConfig);
    const report = await analytics.generateAnalyticsReport();

    // Save to database or send to dashboard
    await saveAnalyticsReport(report);
  },
  60 * 60 * 1000
); // Every hour
```

### Compliance Monitoring

```typescript
// Automated compliance checking
const compliance = new ComplianceReporting(provider, complianceConfig);

setInterval(
  async () => {
    const report = await compliance.generateComplianceReport();

    if (report.overallComplianceScore < 85) {
      // Send compliance alert
      sendComplianceAlert(report);
    }
  },
  24 * 60 * 60 * 1000
); // Daily
```

## Security

### Access Control

The platform implements comprehensive role-based access control:

```solidity
// Role Definitions
bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

// Role Management
function grantRole(bytes32 role, address account) external;
function revokeRole(bytes32 role, address account) external;
function hasRole(bytes32 role, address account) external view returns (bool);
```

### Emergency Mechanisms

```typescript
// Emergency pause
await platformRegistry.pause();

// Emergency mode activation
await platformRegistry.activateEmergencyMode();

// Emergency withdrawal
await platformTreasury.emergencyWithdraw(recipient, amount);
```

### Security Best Practices

1. **Multi-signature Wallets**: Use multi-sig for all admin operations
2. **Time Locks**: Implement time delays for critical operations
3. **Access Control**: Strictly control role assignments
4. **Monitoring**: Continuous monitoring of all activities
5. **Upgrades**: Use UUPS pattern for secure upgrades
6. **Testing**: Comprehensive testing including edge cases

## Troubleshooting

### Common Issues

#### Contract Deployment Failures

```bash
# Check network configuration
npx hardhat verify --list-networks

# Check gas settings
npx hardhat run scripts/check-gas.ts --network arbitrumSepolia

# Verify account balance
npx hardhat run scripts/check-balance.ts --network arbitrumSepolia
```

#### Transaction Failures

```typescript
// Check transaction status
const tx = await contract.someFunction();
const receipt = await tx.wait();

if (receipt.status === 0) {
  console.error('Transaction failed');
  // Check revert reason
  const reason = await provider.call(tx, tx.blockNumber);
  console.error('Revert reason:', reason);
}
```

#### Identity Verification Issues

```typescript
// Check identity status
const isVerified = await identityRegistry.isVerified(userAddress);
console.log('Identity verified:', isVerified);

// Check claims
const claims = await identityRegistry.getClaims(userAddress);
console.log('Claims:', claims);

// Check trusted issuers
const issuers = await trustedIssuersRegistry.getTrustedIssuers();
console.log('Trusted issuers:', issuers);
```

### Debug Mode

```typescript
// Enable debug logging
const sdk = createPartisiproSDK(config, signer);
sdk.on('debug', message => {
  console.log('Debug:', message);
});
```

## Best Practices

### Development

1. **Use TypeScript**: Leverage type safety for better development experience
2. **Follow Patterns**: Use established patterns (factory, proxy, etc.)
3. **Test Thoroughly**: Write comprehensive tests for all scenarios
4. **Document Code**: Maintain clear documentation for all functions
5. **Security First**: Always consider security implications

### Smart Contract Development

1. **Gas Optimization**: Optimize for gas efficiency
2. **Upgradeability**: Plan for future upgrades
3. **Event Logging**: Emit events for all state changes
4. **Input Validation**: Validate all inputs thoroughly
5. **Error Handling**: Provide clear error messages

### Integration

1. **SDK Usage**: Use the official SDK for all integrations
2. **Error Handling**: Implement proper error handling
3. **Monitoring**: Monitor all integrations
4. **Testing**: Test all integration scenarios
5. **Documentation**: Document all API usage

## Contributing

### Development Setup

```bash
# Fork the repository
git clone https://github.com/your-username/partisipro-blockchain.git
cd partisipro-blockchain

# Install dependencies
npm install

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
npm run test
npm run lint

# Commit changes
git commit -m "feat: your feature description"

# Push to your fork
git push origin feature/your-feature-name

# Create pull request
```

### Code Standards

- Follow TypeScript/Solidity best practices
- Use conventional commit messages
- Add tests for all new features
- Update documentation for changes
- Ensure all CI checks pass

### Review Process

1. Create detailed pull request description
2. Ensure all tests pass
3. Request review from maintainers
4. Address feedback promptly
5. Merge after approval

## Support

For support and questions:

- Documentation: [docs.partisipro.com](https://docs.partisipro.com)
- GitHub Issues:
  [github.com/partisipro/blockchain/issues](https://github.com/partisipro/blockchain/issues)
- Developer Chat: [discord.gg/partisipro](https://discord.gg/partisipro)
- Email: developers@partisipro.com

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for
details.
