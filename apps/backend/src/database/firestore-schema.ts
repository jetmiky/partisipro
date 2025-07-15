/**
 * Firestore Database Schema for Partisipro Platform
 * ERC-3643 Enhanced Identity-Centric Model
 */

import {
  // FieldValue,
  Timestamp,
} from 'firebase-admin/firestore';

// User Profile and Identity Management
export interface UserDocument {
  id: string;
  email: string;
  walletAddress?: string;
  role: 'investor' | 'spv' | 'admin';

  // Profile Information
  profile: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    nationality?: string;
    address?: {
      street: string;
      city: string;
      province: string;
      postalCode: string;
      country: string;
    };
  };

  // ERC-3643 Identity Status
  identity: {
    verified: boolean;
    verificationDate?: Timestamp;
    kycStatus: 'pending' | 'approved' | 'rejected' | 'expired';
    kycProvider?: string;
    kycDocumentId?: string;
    claims: ClaimDocument[];
  };

  // Authentication and Security
  auth: {
    web3AuthId?: string;
    lastLogin?: Timestamp;
    mfaEnabled: boolean;
    mfaSecret?: string;
    backupCodes?: string[];
    sessionId?: string;
    deviceFingerprint?: string;
  };

  // Preferences and Settings
  preferences: {
    language: string;
    timezone: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    twoFactorAuth: boolean;
  };

  // Audit Fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy?: string;
}

// ERC-3643 Claims Management
export interface ClaimDocument {
  id: string;
  userId: string;
  claimType: number; // 1: KYC_APPROVED, 2: ACCREDITED_INVESTOR, etc.
  claimValue: boolean;
  issuer: string; // Trusted issuer address
  signature: string;
  issuedAt: Timestamp;
  expiresAt?: Timestamp;
  revokedAt?: Timestamp;
  metadata?: Record<string, any>;
}

// Trusted Issuers Registry
export interface TrustedIssuerDocument {
  id: string;
  name: string;
  address: string; // Blockchain address
  publicKey: string;

  // Issuer Information
  info: {
    companyName: string;
    website: string;
    contactEmail: string;
    licenseNumber?: string;
    jurisdiction: string;
  };

  // Capabilities
  authorizedClaims: number[]; // Claim types this issuer can issue
  isActive: boolean;

  // Audit
  addedAt: Timestamp;
  addedBy: string;
  lastActivity?: Timestamp;
}

// Project Tokenization
export interface ProjectDocument {
  id: string;

  // Basic Information
  name: string;
  symbol: string;
  description: string;
  category: string;

  // SPV Information
  spv: {
    companyName: string;
    registrationNumber: string;
    address: string;
    contactPerson: string;
    walletAddress: string;
  };

  // Tokenization Details
  tokenization: {
    totalSupply: number;
    tokenPrice: number; // in IDR
    currency: 'IDR';
    minimumInvestment: number;
    maximumInvestment?: number;

    // Contract Addresses
    tokenContract: string;
    offeringContract: string;
    treasuryContract: string;
    governanceContract: string;
  };

  // Offering Information
  offering: {
    startDate: Timestamp;
    endDate: Timestamp;
    softCap: number;
    hardCap: number;
    currentRaised: number;
    investorCount: number;
    status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  };

  // Legal and Compliance
  legal: {
    prospectusUrl?: string;
    legalDocuments: string[];
    riskFactors: string[];
    complianceStatus: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedAt?: Timestamp;
  };

  // Financial Information
  financial: {
    projectValue: number;
    expectedReturn: number;
    projectDuration: number; // in months
    revenueModel: string;
    financialProjections: Record<string, number>;
  };

  // Platform Fees
  fees: {
    listingFee: number;
    managementFeeRate: number; // percentage
    platformFeeRate: number; // percentage
    paidAt?: Timestamp;
  };

  // Status and Metadata
  status:
    | 'draft'
    | 'submitted'
    | 'approved'
    | 'active'
    | 'completed'
    | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  approvedBy?: string;
}

// Investment Management
export interface InvestmentDocument {
  id: string;
  userId: string;
  projectId: string;

  // Investment Details
  investment: {
    amount: number; // in IDR
    tokenAmount: number;
    tokenPrice: number;
    currency: 'IDR';

    // Transaction Information
    transactionHash?: string;
    paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
    paymentMethod: string;
    paymentReference?: string;
  };

  // Compliance Check
  compliance: {
    identityVerified: boolean;
    kycApproved: boolean;
    claimsValidated: boolean;
    eligibilityChecked: boolean;
    verificationDate: Timestamp;
  };

  // Investment Status
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';

  // Audit
  createdAt: Timestamp;
  confirmedAt?: Timestamp;
  createdBy: string;
}

// Profit Distribution
export interface ProfitDistributionDocument {
  id: string;
  projectId: string;

  // Distribution Details
  distribution: {
    quarter: string; // "2024-Q1"
    totalProfit: number;
    platformFee: number;
    distributedAmount: number;

    // Distribution Calculation
    totalTokens: number;
    profitPerToken: number;
    distributionDate: Timestamp;
  };

  // Claims Status
  claims: {
    totalClaims: number;
    claimedAmount: number;
    pendingAmount: number;
    claimDeadline: Timestamp;
  };

  // Metadata
  createdAt: Timestamp;
  createdBy: string;
  finalizedAt?: Timestamp;
}

// Individual Profit Claims
export interface ProfitClaimDocument {
  id: string;
  userId: string;
  projectId: string;
  distributionId: string;

  // Claim Details
  claim: {
    tokenBalance: number;
    profitShare: number;
    platformFee: number;
    netAmount: number;

    // Payment Information
    paymentMethod: 'bank_transfer' | 'digital_wallet';
    paymentDetails: Record<string, string>;
    paymentStatus: 'pending' | 'processing' | 'completed' | 'failed';
    paymentReference?: string;
  };

  // Compliance
  compliance: {
    identityVerified: boolean;
    claimsValid: boolean;
    eligibilityConfirmed: boolean;
  };

  // Status
  status: 'pending' | 'approved' | 'paid' | 'cancelled';

  // Audit
  claimedAt: Timestamp;
  processedAt?: Timestamp;
  paidAt?: Timestamp;
}

// Governance Management
export interface GovernanceProposalDocument {
  id: string;
  projectId: string;

  // Proposal Details
  proposal: {
    title: string;
    description: string;
    category: 'financial' | 'operational' | 'strategic' | 'technical';
    proposalType: 'standard' | 'emergency' | 'amendment';

    // Voting Parameters
    votingStartDate: Timestamp;
    votingEndDate: Timestamp;
    quorumRequired: number;
    supportRequired: number; // percentage

    // Execution Details
    executionData?: string;
    executionTarget?: string;
  };

  // Voting Status
  voting: {
    totalVotes: number;
    yesVotes: number;
    noVotes: number;
    abstainVotes: number;

    // Participation
    votersCount: number;
    totalEligibleVoters: number;
    participationRate: number;
  };

  // Proposal Status
  status: 'draft' | 'active' | 'passed' | 'rejected' | 'executed' | 'cancelled';

  // Audit
  createdAt: Timestamp;
  createdBy: string;
  executedAt?: Timestamp;
  executedBy?: string;
}

// Individual Votes
export interface VoteDocument {
  id: string;
  userId: string;
  proposalId: string;
  projectId: string;

  // Vote Details
  vote: {
    choice: 'yes' | 'no' | 'abstain';
    votingPower: number;
    reason?: string;

    // Delegation
    isDelegated: boolean;
    delegatedBy?: string;
    delegatedTo?: string;
  };

  // Compliance
  compliance: {
    identityVerified: boolean;
    eligibilityConfirmed: boolean;
    tokenBalanceVerified: boolean;
  };

  // Audit
  votedAt: Timestamp;
  blockNumber?: number;
  transactionHash?: string;
}

// Platform Analytics and Metrics
export interface AnalyticsDocument {
  id: string;
  date: string; // YYYY-MM-DD

  // Platform Metrics
  platform: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    verifiedUsers: number;

    // Projects
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;

    // Investments
    totalInvestments: number;
    totalInvestmentValue: number;
    averageInvestmentSize: number;
  };

  // Financial Metrics
  financial: {
    totalRevenue: number;
    listingFees: number;
    managementFees: number;
    platformFees: number;

    // Volume
    tradingVolume: number;
    distributedProfits: number;
  };

  // Governance Metrics
  governance: {
    totalProposals: number;
    activeProposals: number;
    averageParticipation: number;
    governanceActivity: number;
  };

  // Generated timestamp
  generatedAt: Timestamp;
}

// System Configuration
export interface SystemConfigDocument {
  id: string;

  // Platform Settings
  platform: {
    maintenanceMode: boolean;
    maintenanceMessage?: string;

    // Feature Flags
    features: {
      newUserRegistration: boolean;
      projectCreation: boolean;
      investments: boolean;
      profitClaims: boolean;
      governance: boolean;
    };
  };

  // Fee Configuration
  fees: {
    listingFeeRate: number;
    managementFeeRate: number;
    platformFeeRate: number;
    minimumListingFee: number;

    // Payment Processing
    paymentProcessingFee: number;
    withdrawalFee: number;
  };

  // Compliance Settings
  compliance: {
    kycRequired: boolean;
    minimumAge: number;
    allowedCountries: string[];
    blockedCountries: string[];

    // Investment Limits
    minimumInvestment: number;
    maximumInvestment: number;
    accreditedInvestorLimit: number;
  };

  // Integration Settings
  integrations: {
    kycProviders: string[];
    paymentGateways: string[];
    emailProvider: string;

    // Blockchain
    supportedNetworks: string[];
    defaultNetwork: string;
  };

  // Updated tracking
  updatedAt: Timestamp;
  updatedBy: string;
}

// File Management
export interface FileMetadataDocument {
  id: string;

  // File Information
  originalName: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  bucketPath: string;

  // Upload Information
  uploadedBy: string;
  uploadedAt: Timestamp;

  // Organization
  category:
    | 'kyc'
    | 'identity'
    | 'profile'
    | 'project-legal'
    | 'project-financial'
    | 'project-marketing'
    | 'platform'
    | 'temp';
  projectId?: string;

  // Access Control
  downloadUrl?: string;
  isPublic: boolean;

  // Metadata
  metadata?: Record<string, any>;

  // Audit
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Collection Names (for consistency)
export const COLLECTIONS = {
  USERS: 'users',
  CLAIMS: 'claims',
  TRUSTED_ISSUERS: 'trusted_issuers',
  PROJECTS: 'projects',
  INVESTMENTS: 'investments',
  PROFIT_DISTRIBUTIONS: 'profit_distributions',
  PROFIT_CLAIMS: 'profit_claims',
  GOVERNANCE_PROPOSALS: 'governance_proposals',
  VOTES: 'votes',
  ANALYTICS: 'analytics',
  SYSTEM_CONFIG: 'system_config',
  FILE_METADATA: 'file_metadata',
} as const;

// Subcollections for users
export const USER_SUBCOLLECTIONS = {
  INVESTMENTS: 'investments',
  CLAIMS: 'claims',
  VOTES: 'votes',
  NOTIFICATIONS: 'notifications',
  SESSIONS: 'sessions',
  FILES: 'files',
} as const;

// Subcollections for projects
export const PROJECT_SUBCOLLECTIONS = {
  INVESTMENTS: 'investments',
  DISTRIBUTIONS: 'distributions',
  PROPOSALS: 'proposals',
  UPDATES: 'updates',
} as const;
