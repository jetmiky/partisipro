# Smart Contract Interface Definitions

## Overview

This document defines all smart contract interfaces required for frontend
integration with the Partisipro blockchain platform. All contracts follow the
ERC-3643 standard for identity-centric compliance.

## Core Contract Addresses

### Arbitrum Sepolia (Testnet)

```typescript
export const CONTRACT_ADDRESSES = {
  // Core Infrastructure
  PROJECT_FACTORY: '0x1234567890123456789012345678901234567890',
  PLATFORM_REGISTRY: '0x2345678901234567890123456789012345678901',
  PLATFORM_TREASURY: '0x3456789012345678901234567890123456789012',

  // ERC-3643 Identity Infrastructure
  CLAIM_TOPICS_REGISTRY: '0x4567890123456789012345678901234567890123',
  TRUSTED_ISSUERS_REGISTRY: '0x5678901234567890123456789012345678901234',
  IDENTITY_REGISTRY: '0x6789012345678901234567890123456789012345',

  // Project Garuda IDR Stablecoin
  GARUDA_IDR: '0x7890123456789012345678901234567890123456',
};
```

### Arbitrum One (Mainnet)

```typescript
export const MAINNET_ADDRESSES = {
  // To be deployed
};
```

## Core Infrastructure Contracts

### 1. ProjectFactory.sol

**Purpose**: Factory contract for deploying isolated project contract sets

#### Key Functions

```typescript
interface IProjectFactory {
  // Create new project with ERC-3643 integration
  function createProject(
    string calldata projectName,
    string calldata projectSymbol,
    uint256 totalSupply,
    uint256 offeringPrice,
    address identityRegistry,
    uint256 listingFee
  ) external returns (
    address projectToken,
    address offering,
    address treasury,
    address governance
  );

  // Get project contracts by project ID
  function getProjectContracts(uint256 projectId) external view returns (
    address projectToken,
    address offering,
    address treasury,
    address governance
  );

  // Get total number of projects
  function getProjectCount() external view returns (uint256);

  // Check if address is authorized SPV
  function isAuthorizedSPV(address spv) external view returns (bool);
}
```

#### Events

```solidity
event ProjectCreated(
  uint256 indexed projectId,
  address indexed spv,
  address projectToken,
  address offering,
  address treasury,
  address governance,
  string projectName,
  uint256 totalSupply
);

event SPVAuthorized(address indexed spv, uint256 timestamp);
event SPVRevoked(address indexed spv, uint256 timestamp);
```

### 2. PlatformRegistry.sol

**Purpose**: Access control and platform configuration management

#### Key Functions

```typescript
interface IPlatformRegistry {
  // SPV Management
  function registerSPV(address spv) external;
  function revokeSPV(address spv) external;
  function isAuthorizedSPV(address spv) external view returns (bool);

  // Fee Management
  function setListingFee(uint256 fee) external;
  function setManagementFeeRate(uint256 rate) external;
  function getListingFee() external view returns (uint256);
  function getManagementFeeRate() external view returns (uint256);

  // Platform Configuration
  function setPlatformTreasury(address treasury) external;
  function setIdentityRegistry(address registry) external;
  function getPlatformTreasury() external view returns (address);
  function getIdentityRegistry() external view returns (address);
}
```

### 3. PlatformTreasury.sol

**Purpose**: Platform revenue collection and management

#### Key Functions

```typescript
interface IPlatformTreasury {
  // Revenue Collection
  function collectListingFee(uint256 projectId, uint256 amount) external;
  function collectManagementFee(uint256 projectId, uint256 amount) external;

  // Revenue Distribution
  function distributePlatformRevenue(address[] calldata recipients, uint256[] calldata amounts) external;

  // Treasury Management
  function getTotalRevenue() external view returns (uint256);
  function getProjectRevenue(uint256 projectId) external view returns (uint256);
  function withdrawFunds(address token, uint256 amount, address to) external;
}
```

## ERC-3643 Identity Contracts

### 1. IdentityRegistry.sol

**Purpose**: Central identity verification and claims management

#### Key Functions

```typescript
interface IIdentityRegistry {
  // Identity Management
  function registerIdentity(address user, address identity, uint16 country) external;
  function updateIdentity(address user, address identity) external;
  function deleteIdentity(address user) external;

  // Identity Verification
  function isVerified(address user) external view returns (bool);
  function getIdentity(address user) external view returns (address);
  function getCountry(address user) external view returns (uint16);

  // Batch Operations
  function batchRegisterIdentity(
    address[] calldata users,
    address[] calldata identities,
    uint16[] calldata countries
  ) external;

  // Transfer Restrictions
  function canTransfer(address from, address to, uint256 value) external view returns (bool);
  function getTransferRestrictions(address user) external view returns (uint256[] memory);
}
```

#### Events

```solidity
event IdentityRegistered(
  address indexed user,
  address indexed identity,
  uint16 country
);
event IdentityUpdated(
  address indexed user,
  address indexed oldIdentity,
  address indexed newIdentity
);
event IdentityDeleted(address indexed user, address indexed identity);
event CountryUpdated(
  address indexed user,
  uint16 oldCountry,
  uint16 newCountry
);
```

### 2. ClaimTopicsRegistry.sol

**Purpose**: Registry of claim types and their definitions

#### Key Functions

```typescript
interface IClaimTopicsRegistry {
  // Claim Topic Management
  function addClaimTopic(uint256 topic, string calldata description) external;
  function removeClaimTopic(uint256 topic) external;
  function updateClaimTopic(uint256 topic, string calldata description) external;

  // Claim Topic Queries
  function isClaimTopicRegistered(uint256 topic) external view returns (bool);
  function getClaimTopicDescription(uint256 topic) external view returns (string memory);
  function getAllClaimTopics() external view returns (uint256[] memory);
}
```

#### Standard Claim Topics

```typescript
export const CLAIM_TOPICS = {
  KYC_APPROVED: 1,
  ACCREDITED_INVESTOR: 2,
  INSTITUTIONAL_INVESTOR: 3,
  RETAIL_INVESTOR: 4,
  HIGH_RISK_INVESTOR: 5,
  SUSPENDED_INVESTOR: 6,
  AML_CLEARED: 7,
  SANCTIONS_CLEARED: 8,
};
```

### 3. TrustedIssuersRegistry.sol

**Purpose**: Management of authorized claim issuers

#### Key Functions

```typescript
interface ITrustedIssuersRegistry {
  // Issuer Management
  function addTrustedIssuer(address issuer, uint256[] calldata claimTopics) external;
  function removeTrustedIssuer(address issuer) external;
  function updateIssuerClaimTopics(address issuer, uint256[] calldata claimTopics) external;

  // Issuer Verification
  function isTrustedIssuer(address issuer) external view returns (bool);
  function hasClaimTopic(address issuer, uint256 topic) external view returns (bool);
  function getTrustedIssuers() external view returns (address[] memory);
  function getIssuerClaimTopics(address issuer) external view returns (uint256[] memory);
}
```

## Project-Specific Contracts

### 1. ProjectToken.sol (ERC-3643 Compliant)

**Purpose**: ERC-20 token representing project ownership with identity
verification

#### Key Functions

```typescript
interface IProjectToken {
  // ERC-20 Standard Functions
  function totalSupply() external view returns (uint256);
  function balanceOf(address account) external view returns (uint256);
  function transfer(address to, uint256 amount) external returns (bool);
  function allowance(address owner, address spender) external view returns (uint256);
  function approve(address spender, uint256 amount) external returns (bool);
  function transferFrom(address from, address to, uint256 amount) external returns (bool);

  // ERC-3643 Compliance Functions
  function identityRegistry() external view returns (address);
  function isVerified(address user) external view returns (bool);
  function canTransfer(address from, address to, uint256 value) external view returns (bool);

  // Project-Specific Functions
  function mint(address to, uint256 amount) external;
  function burn(address from, uint256 amount) external;
  function pause() external;
  function unpause() external;

  // Dividend Functions
  function distributeDividends(uint256 amount) external;
  function claimDividend() external;
  function getDividendBalance(address user) external view returns (uint256);
}
```

### 2. ProjectOffering.sol

**Purpose**: Token sale management with identity verification

#### Key Functions

```typescript
interface IProjectOffering {
  // Offering Configuration
  function setOfferingPrice(uint256 price) external;
  function setOfferingPeriod(uint256 startTime, uint256 endTime) external;
  function setMinimumInvestment(uint256 minimum) external;
  function setMaximumInvestment(uint256 maximum) external;

  // Investment Functions
  function buyTokens(uint256 amount, bytes calldata authorizationVoucher) external;
  function getTokenPrice() external view returns (uint256);
  function getInvestmentLimits() external view returns (uint256 min, uint256 max);

  // Offering Management
  function finalizeOffering() external;
  function pauseOffering() external;
  function resumeOffering() external;

  // Offering Status
  function isOfferingActive() external view returns (bool);
  function getTotalRaised() external view returns (uint256);
  function getInvestorCount() external view returns (uint256);
  function getUserInvestment(address user) external view returns (uint256);
}
```

#### Events

```solidity
event TokensPurchased(
  address indexed investor,
  uint256 amount,
  uint256 tokens,
  uint256 timestamp
);

event OfferingFinalized(
  uint256 totalRaised,
  uint256 investorCount,
  uint256 timestamp
);
```

### 3. ProjectTreasury.sol

**Purpose**: Project fund management and profit distribution

#### Key Functions

```typescript
interface IProjectTreasury {
  // Fund Management
  function depositFunds(uint256 amount) external;
  function withdrawFunds(uint256 amount, address to) external;
  function getTotalFunds() external view returns (uint256);
  function getAvailableFunds() external view returns (uint256);

  // Profit Distribution
  function distributeProfits(uint256 amount) external;
  function calculateDistribution(address user) external view returns (uint256);
  function claimProfits() external;
  function getClaimableAmount(address user) external view returns (uint256);

  // Final Buyback
  function activateFinalBuyback(uint256 buybackPrice) external;
  function claimFinalBuyback() external;
  function isFinalBuybackActive() external view returns (bool);
  function getFinalBuybackPrice() external view returns (uint256);

  // Fee Management
  function deductManagementFee(uint256 amount) external returns (uint256);
  function getManagementFeeRate() external view returns (uint256);
}
```

### 4. ProjectGovernance.sol

**Purpose**: Token holder governance with identity verification

#### Key Functions

```typescript
interface IProjectGovernance {
  // Proposal Management
  function createProposal(
    string calldata description,
    bytes calldata executionData,
    uint256 votingPeriod
  ) external returns (uint256 proposalId);

  function executeProposal(uint256 proposalId) external;
  function cancelProposal(uint256 proposalId) external;

  // Voting Functions
  function vote(uint256 proposalId, bool support, string calldata reason) external;
  function delegate(address to) external;
  function getVotingPower(address user) external view returns (uint256);

  // Proposal Queries
  function getProposal(uint256 proposalId) external view returns (
    string memory description,
    uint256 startTime,
    uint256 endTime,
    uint256 forVotes,
    uint256 againstVotes,
    uint256 totalVotes,
    bool executed,
    bool cancelled
  );

  function hasVoted(uint256 proposalId, address user) external view returns (bool);
  function getUserVote(uint256 proposalId, address user) external view returns (bool support);

  // Governance Parameters
  function setVotingPeriod(uint256 period) external;
  function setQuorumPercentage(uint256 percentage) external;
  function getQuorumPercentage() external view returns (uint256);
}
```

## Integration Helper Functions

### Contract Interaction Utilities

```typescript
// Contract instance creation
export function getContractInstance(
  address: string,
  abi: any[],
  provider: Provider
): Contract {
  return new Contract(address, abi, provider);
}

// Multi-call for batch operations
export async function multicall(
  calls: Array<{
    target: string;
    callData: string;
  }>,
  provider: Provider
): Promise<string[]> {
  // Implementation for batch contract calls
}

// Identity verification check
export async function isUserVerified(
  userAddress: string,
  identityRegistry: Contract
): Promise<boolean> {
  return await identityRegistry.isVerified(userAddress);
}

// Token balance with decimals
export async function getTokenBalance(
  userAddress: string,
  tokenContract: Contract
): Promise<{
  balance: BigNumber;
  formatted: string;
}> {
  const balance = await tokenContract.balanceOf(userAddress);
  const decimals = await tokenContract.decimals();
  return {
    balance,
    formatted: formatUnits(balance, decimals),
  };
}

// Gas estimation for transactions
export async function estimateGasWithBuffer(
  contract: Contract,
  method: string,
  params: any[],
  bufferPercentage: number = 20
): Promise<BigNumber> {
  const estimated = await contract.estimateGas[method](...params);
  return estimated.mul(100 + bufferPercentage).div(100);
}
```

### Transaction Management

```typescript
// Transaction status tracking
export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  gasUsed?: BigNumber;
  blockNumber?: number;
  timestamp?: number;
}

// Transaction submission with retry
export async function submitTransaction(
  contract: Contract,
  method: string,
  params: any[],
  options: {
    gasLimit?: BigNumber;
    gasPrice?: BigNumber;
    maxRetries?: number;
  } = {}
): Promise<TransactionResponse> {
  // Implementation with retry logic
}

// Wait for transaction confirmation
export async function waitForConfirmation(
  txHash: string,
  provider: Provider,
  confirmations: number = 1
): Promise<TransactionReceipt> {
  return await provider.waitForTransaction(txHash, confirmations);
}
```

## Error Handling

### Contract Error Types

```typescript
// Standard contract errors
export const CONTRACT_ERRORS = {
  // Identity Errors
  IDENTITY_NOT_VERIFIED: 'IdentityNotVerified',
  INVALID_IDENTITY: 'InvalidIdentity',
  CLAIMS_EXPIRED: 'ClaimsExpired',

  // Transfer Restrictions
  TRANSFER_RESTRICTED: 'TransferRestricted',
  INSUFFICIENT_BALANCE: 'InsufficientBalance',
  INVALID_RECIPIENT: 'InvalidRecipient',

  // Offering Errors
  OFFERING_NOT_ACTIVE: 'OfferingNotActive',
  INVESTMENT_BELOW_MINIMUM: 'InvestmentBelowMinimum',
  INVESTMENT_ABOVE_MAXIMUM: 'InvestmentAboveMaximum',
  INVALID_PAYMENT: 'InvalidPayment',

  // Governance Errors
  PROPOSAL_NOT_ACTIVE: 'ProposalNotActive',
  ALREADY_VOTED: 'AlreadyVoted',
  INSUFFICIENT_VOTING_POWER: 'InsufficientVotingPower',
  PROPOSAL_EXECUTION_FAILED: 'ProposalExecutionFailed',

  // Treasury Errors
  INSUFFICIENT_FUNDS: 'InsufficientFunds',
  DISTRIBUTION_FAILED: 'DistributionFailed',
  CLAIM_NOT_AVAILABLE: 'ClaimNotAvailable',

  // Access Control
  UNAUTHORIZED: 'Unauthorized',
  ONLY_SPV: 'OnlySPV',
  ONLY_ADMIN: 'OnlyAdmin',
};

// Error parsing utility
export function parseContractError(error: any): {
  code: string;
  message: string;
  details?: any;
} {
  // Implementation for parsing contract errors
}
```

## Gas Optimization Strategies

### Batch Operations

```typescript
// Batch identity registration
export async function batchRegisterIdentities(
  identityRegistry: Contract,
  users: string[],
  identities: string[],
  countries: number[]
): Promise<TransactionResponse> {
  return await identityRegistry.batchRegisterIdentity(
    users,
    identities,
    countries
  );
}

// Batch claim assignment
export async function batchAddClaims(
  trustedIssuer: Contract,
  users: string[],
  claimTopics: number[],
  claimData: string[]
): Promise<TransactionResponse> {
  // Implementation for batch claim operations
}
```

### Event Filtering

```typescript
// Efficient event filtering
export async function getProjectEvents(
  projectToken: Contract,
  fromBlock: number,
  toBlock: number,
  eventTypes: string[]
): Promise<Event[]> {
  const filters = eventTypes.map(eventType =>
    projectToken.filters[eventType]()
  );

  const events = await Promise.all(
    filters.map(filter => projectToken.queryFilter(filter, fromBlock, toBlock))
  );

  return events
    .flat()
    .sort((a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex);
}
```

This comprehensive smart contract interface specification provides all the
necessary definitions for seamless frontend integration with the blockchain
layer.
