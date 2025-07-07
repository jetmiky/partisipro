import { type Address } from 'viem';

export const CONTRACT_ADDRESSES = {
  // Core Infrastructure Contracts
  PROJECT_FACTORY: process.env.CONTRACT_PROJECT_FACTORY as Address,
  PLATFORM_REGISTRY: process.env.CONTRACT_PLATFORM_REGISTRY as Address,
  PLATFORM_TREASURY: process.env.CONTRACT_PLATFORM_TREASURY as Address,
  
  // Stablecoin (Project Garuda IDR)
  GARUDA_IDR_TOKEN: process.env.GARUDA_IDR_TOKEN_ADDRESS as Address,
  
  // Chainlink Contracts
  CHAINLINK_PRICE_FEED_IDR_USD: process.env.CHAINLINK_PRICE_FEED_IDR_USD as Address,
  CHAINLINK_AUTOMATION_REGISTRY: process.env.CHAINLINK_AUTOMATION_REGISTRY as Address,
  CHAINLINK_FUNCTIONS_ROUTER: process.env.CHAINLINK_FUNCTIONS_ROUTER as Address,
} as const;

export const CONTRACT_NAMES = {
  PROJECT_FACTORY: 'ProjectFactory',
  PLATFORM_REGISTRY: 'PlatformRegistry',
  PLATFORM_TREASURY: 'PlatformTreasury',
  PROJECT_TOKEN: 'ProjectToken',
  OFFERING: 'Offering',
  TREASURY: 'Treasury',
  GOVERNANCE: 'Governance',
} as const;

export const GAS_LIMITS = {
  // Factory operations
  CREATE_PROJECT: 2000000n,
  
  // Token operations
  TRANSFER: 65000n,
  APPROVE: 55000n,
  MINT: 70000n,
  BURN: 60000n,
  
  // Offering operations
  INVEST: 150000n,
  CLAIM_TOKENS: 120000n,
  REFUND: 100000n,
  
  // Treasury operations
  DEPOSIT_PROFITS: 180000n,
  CLAIM_DIVIDENDS: 140000n,
  FINAL_BUYBACK: 200000n,
  
  // Governance operations
  CREATE_PROPOSAL: 250000n,
  VOTE: 80000n,
  EXECUTE_PROPOSAL: 300000n,
} as const;

export const CONTRACT_EVENTS = {
  // ProjectFactory events
  PROJECT_CREATED: 'ProjectCreated',
  DEPLOYMENT_FEE_UPDATED: 'DeploymentFeeUpdated',
  
  // ProjectToken events
  TRANSFERS_ENABLED: 'TransfersEnabled',
  TRANSFERS_DISABLED: 'TransfersDisabled',
  PROJECT_INFO_UPDATED: 'ProjectInfoUpdated',
  
  // Offering events
  INVESTMENT_MADE: 'InvestmentMade',
  TOKENS_CLAIMED: 'TokensClaimed',
  REFUND_ISSUED: 'RefundIssued',
  OFFERING_FINALIZED: 'OfferingFinalized',
  
  // Treasury events
  PROFITS_DEPOSITED: 'ProfitsDeposited',
  DIVIDENDS_CLAIMED: 'DividendsClaimed',
  BUYBACK_EXECUTED: 'BuybackExecuted',
  
  // Standard ERC20 events
  TRANSFER: 'Transfer',
  APPROVAL: 'Approval',
} as const;