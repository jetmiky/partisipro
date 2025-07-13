# Data Models & Schemas

## Overview

This document defines all data models, database schemas, and validation rules
required for the Partisipro platform. It covers both frontend state management
and backend data persistence.

## Core Data Models

### User Management

#### User Entity

```typescript
interface User {
  id: string; // UUID
  email: string; // Unique, validated email
  passwordHash?: string; // For email/password auth
  role: 'investor' | 'spv' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;

  // Profile Information
  profile: UserProfile;

  // Authentication
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;

  // Security
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  loginAttempts: number;
  lockUntil?: Date;

  // Preferences
  preferences: UserPreferences;
}

interface UserProfile {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  nationality?: string;
  dateOfBirth?: Date;
  address?: Address;
  profilePicture?: string; // URL to profile image

  // For SPV users
  companyName?: string;
  companyRegistration?: string;
  companyAddress?: Address;

  // For institutional users
  institutionType?: 'bank' | 'fund' | 'insurance' | 'pension' | 'other';
  aum?: number; // Assets under management
}

interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface UserPreferences {
  language: 'id' | 'en';
  currency: 'IDR' | 'USD';
  timezone: string;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
}

interface NotificationPreferences {
  email: {
    portfolioUpdates: boolean;
    governanceProposals: boolean;
    marketNews: boolean;
    systemUpdates: boolean;
  };
  push: {
    priceAlerts: boolean;
    governanceDeadlines: boolean;
    claimAvailable: boolean;
  };
  sms: {
    securityAlerts: boolean;
    largeTransactions: boolean;
  };
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'connections';
  dataSharing: boolean;
  analyticsOptOut: boolean;
}
```

#### Database Schema (PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(20) NOT NULL CHECK (role IN ('investor', 'spv', 'admin')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(255),
  login_attempts INTEGER DEFAULT 0,
  lock_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);

-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_number VARCHAR(20),
  nationality VARCHAR(3), -- ISO 3166-1 alpha-3
  date_of_birth DATE,
  profile_picture VARCHAR(500),

  -- Company information (for SPVs)
  company_name VARCHAR(255),
  company_registration VARCHAR(100),

  -- Institution information
  institution_type VARCHAR(20),
  aum DECIMAL(20, 2),

  -- Address
  street VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(3),

  -- Company address (for SPVs)
  company_street VARCHAR(255),
  company_city VARCHAR(100),
  company_state VARCHAR(100),
  company_postal_code VARCHAR(20),
  company_country VARCHAR(3),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(5) DEFAULT 'id',
  currency VARCHAR(3) DEFAULT 'IDR',
  timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',

  -- Notification preferences (JSON)
  email_notifications JSONB DEFAULT '{"portfolioUpdates": true, "governanceProposals": true, "marketNews": false, "systemUpdates": true}',
  push_notifications JSONB DEFAULT '{"priceAlerts": true, "governanceDeadlines": true, "claimAvailable": true}',
  sms_notifications JSONB DEFAULT '{"securityAlerts": true, "largeTransactions": true}',

  -- Privacy settings (JSON)
  privacy_settings JSONB DEFAULT '{"profileVisibility": "private", "dataSharing": false, "analyticsOptOut": false}',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

### Identity & KYC Management

#### Identity Verification

```typescript
interface IdentityVerification {
  id: string;
  userId: string;

  // Verification Details
  verificationLevel: 'basic' | 'advanced' | 'institutional';
  status: 'not_started' | 'pending' | 'in_review' | 'approved' | 'rejected';

  // KYC Session Information
  sessionId?: string;
  provider: 'verihubs' | 'sumsubstance' | 'jumio' | 'manual';
  providerSessionId?: string;

  // Verification Progress
  progress: number; // 0-100
  completedChecks: KYCCheckType[];
  pendingChecks: KYCCheckType[];
  failedChecks: KYCCheckType[];

  // Documents
  documents: KYCDocument[];

  // Results
  verificationResults?: KYCResults;
  rejectionReason?: string;
  rejectionDetails?: string;

  // Timestamps
  startedAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;

  // Blockchain Integration
  identityAddress?: string; // On-chain identity contract address
  claims: IdentityClaim[];

  // Audit Trail
  createdAt: Date;
  updatedAt: Date;
}

type KYCCheckType =
  | 'document_verification'
  | 'facial_recognition'
  | 'liveness_detection'
  | 'aml_screening'
  | 'sanctions_check'
  | 'pep_check'
  | 'address_verification';

interface KYCDocument {
  id: string;
  type:
    | 'national_id'
    | 'passport'
    | 'driving_license'
    | 'utility_bill'
    | 'bank_statement'
    | 'selfie';
  status: 'pending' | 'processing' | 'approved' | 'rejected';
  url?: string;
  extractedData?: Record<string, any>;
  verificationDetails?: {
    confidence: number;
    checks: string[];
    issues?: string[];
  };
  uploadedAt: Date;
  processedAt?: Date;
}

interface KYCResults {
  overallScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  checks: {
    [key in KYCCheckType]?: {
      status: 'passed' | 'failed' | 'warning';
      score: number;
      details?: string;
    };
  };
  extractedInformation: {
    fullName?: string;
    dateOfBirth?: Date;
    nationality?: string;
    documentNumber?: string;
    documentExpiry?: Date;
    address?: Address;
  };
}

interface IdentityClaim {
  id: string;
  type: ClaimType;
  issuer: string; // Ethereum address
  value?: string;
  issuedAt: Date;
  expiresAt?: Date;
  status: 'active' | 'expired' | 'revoked';
  transactionHash?: string;

  // Claim-specific data
  metadata?: Record<string, any>;
}

enum ClaimType {
  KYC_APPROVED = 1,
  ACCREDITED_INVESTOR = 2,
  INSTITUTIONAL_INVESTOR = 3,
  RETAIL_INVESTOR = 4,
  HIGH_RISK_INVESTOR = 5,
  SUSPENDED_INVESTOR = 6,
  AML_CLEARED = 7,
  SANCTIONS_CLEARED = 8,
}
```

#### Database Schema

```sql
-- Identity verifications table
CREATE TABLE identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verification_level VARCHAR(20) NOT NULL CHECK (verification_level IN ('basic', 'advanced', 'institutional')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('not_started', 'pending', 'in_review', 'approved', 'rejected')),
  session_id VARCHAR(255),
  provider VARCHAR(20) NOT NULL,
  provider_session_id VARCHAR(255),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed_checks TEXT[], -- Array of check types
  pending_checks TEXT[],
  failed_checks TEXT[],
  verification_results JSONB,
  rejection_reason TEXT,
  rejection_details TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP,
  identity_address VARCHAR(42), -- Ethereum address
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KYC documents table
CREATE TABLE kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES identity_verifications(id) ON DELETE CASCADE,
  document_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'approved', 'rejected')),
  file_url VARCHAR(500),
  extracted_data JSONB,
  verification_details JSONB,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

-- Identity claims table
CREATE TABLE identity_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES identity_verifications(id) ON DELETE CASCADE,
  claim_type INTEGER NOT NULL,
  issuer VARCHAR(42) NOT NULL, -- Ethereum address
  claim_value TEXT,
  issued_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  transaction_hash VARCHAR(66), -- Ethereum transaction hash
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_identity_verifications_user_id ON identity_verifications(user_id);
CREATE INDEX idx_identity_verifications_status ON identity_verifications(status);
CREATE INDEX idx_identity_verifications_provider ON identity_verifications(provider);
CREATE INDEX idx_kyc_documents_verification_id ON kyc_documents(verification_id);
CREATE INDEX idx_identity_claims_verification_id ON identity_claims(verification_id);
CREATE INDEX idx_identity_claims_type ON identity_claims(claim_type);
CREATE INDEX idx_identity_claims_issuer ON identity_claims(issuer);
```

### Project Management

#### Project Entity

```typescript
interface Project {
  id: string;
  spvId: string; // Reference to SPV user

  // Basic Information
  title: string;
  description: string;
  detailedDescription?: string;
  category: ProjectCategory;
  location: string;
  province: string;

  // Visual Assets
  image: string;
  gallery?: string[];
  documents?: ProjectDocument[];

  // Financial Information
  totalValue: number; // Total project value in IDR
  targetAmount: number; // Funding target in IDR
  raisedAmount: number; // Amount raised so far
  minimumInvestment: number;
  expectedReturn: number; // Expected annual return percentage

  // Timeline
  duration: number; // Duration in months
  startDate: Date;
  endDate: Date;

  // Status
  status: ProjectStatus;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  riskLevel: 'low' | 'medium' | 'high';

  // Metrics
  investorCount: number;
  highlights: string[];

  // Financial Projections
  financialProjections?: Record<string, FinancialProjection>;
  keyMetrics?: ProjectMetrics;

  // Risk Assessment
  risks?: ProjectRisk[];

  // Legal Documents
  legalDocuments?: LegalDocument[];

  // Updates
  updates?: ProjectUpdate[];

  // Blockchain Integration
  contractAddresses?: ProjectContracts;
  tokenomics?: ProjectTokenomics;

  // Audit Trail
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  launchedAt?: Date;
}

enum ProjectCategory {
  TRANSPORTATION = 'transportation',
  ENERGY = 'energy',
  WATER = 'water',
  TELECOMMUNICATIONS = 'telecommunications',
  BUILDINGS = 'buildings',
}

enum ProjectStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  ACTIVE = 'active',
  COMING_SOON = 'coming_soon',
  FULLY_FUNDED = 'fully_funded',
  OPERATIONAL = 'operational',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

interface FinancialProjection {
  revenue: number;
  profit: number;
  returnRate: number;
  expenses?: number;
  cashFlow?: number;
}

interface ProjectMetrics {
  irr: number; // Internal Rate of Return
  roiProjected: number; // Projected ROI
  paybackPeriod: number; // In years
  netPresentValue?: number;
  breakEvenPoint?: number;
}

interface ProjectRisk {
  level: 'Low' | 'Medium' | 'High';
  description: string;
  probability: number; // 0-100
  impact: 'low' | 'medium' | 'high';
  mitigation?: string;
}

interface ProjectDocument {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'excel' | 'image';
  size: number; // in bytes
  url: string;
  category:
    | 'feasibility'
    | 'legal'
    | 'financial'
    | 'technical'
    | 'environmental';
  uploadedAt: Date;
  isPublic: boolean;
}

interface LegalDocument {
  name: string;
  size: string; // Human readable size
  type: string;
  url: string;
  category: string;
  lastModified: Date;
}

interface ProjectUpdate {
  id: string;
  date: Date;
  title: string;
  description: string;
  type: 'milestone' | 'financial' | 'regulatory' | 'technical' | 'general';
  attachments?: string[];
  isPublic: boolean;
}

interface ProjectContracts {
  projectToken: string; // ERC-3643 token address
  offering: string; // Offering contract address
  treasury: string; // Treasury contract address
  governance: string; // Governance contract address
}

interface ProjectTokenomics {
  tokenSymbol: string;
  totalSupply: number;
  tokenPrice: number; // Price in IDR
  vestingSchedule?: VestingSchedule[];
  distributionPlan: TokenDistribution;
}

interface VestingSchedule {
  recipient: 'team' | 'advisors' | 'ecosystem' | 'public';
  percentage: number;
  cliff: number; // in months
  vesting: number; // in months
}

interface TokenDistribution {
  publicSale: number; // percentage
  team: number;
  advisors: number;
  ecosystem: number;
  reserve: number;
}
```

#### Database Schema

```sql
-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spv_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  detailed_description TEXT,
  category VARCHAR(50) NOT NULL,
  location VARCHAR(255) NOT NULL,
  province VARCHAR(100) NOT NULL,
  image VARCHAR(500),
  gallery TEXT[], -- Array of image URLs

  -- Financial information
  total_value DECIMAL(20, 2) NOT NULL,
  target_amount DECIMAL(20, 2) NOT NULL,
  raised_amount DECIMAL(20, 2) DEFAULT 0,
  minimum_investment DECIMAL(20, 2) NOT NULL,
  expected_return DECIMAL(5, 2) NOT NULL,

  -- Timeline
  duration INTEGER NOT NULL, -- months
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Status
  status VARCHAR(30) NOT NULL,
  approval_status VARCHAR(20) DEFAULT 'pending',
  risk_level VARCHAR(10) NOT NULL,

  -- Metrics
  investor_count INTEGER DEFAULT 0,
  highlights TEXT[],

  -- JSON data
  financial_projections JSONB,
  key_metrics JSONB,
  risks JSONB,

  -- Blockchain
  contract_addresses JSONB,
  tokenomics JSONB,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,
  launched_at TIMESTAMP
);

-- Project documents table
CREATE TABLE project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  document_type VARCHAR(20) NOT NULL,
  file_size BIGINT NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  category VARCHAR(50) NOT NULL,
  is_public BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project updates table
CREATE TABLE project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  update_type VARCHAR(20) NOT NULL,
  attachments TEXT[],
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_projects_spv_id ON projects(spv_id);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_approval_status ON projects(approval_status);
CREATE INDEX idx_project_documents_project_id ON project_documents(project_id);
CREATE INDEX idx_project_updates_project_id ON project_updates(project_id);
```

### Investment Management

#### Investment Entity

```typescript
interface Investment {
  id: string;
  userId: string;
  projectId: string;

  // Investment Details
  amount: number; // Investment amount in IDR
  tokenAmount: number; // Tokens received
  tokenPrice: number; // Price per token at time of investment

  // Status
  status: InvestmentStatus;
  paymentStatus: PaymentStatus;

  // Payment Information
  paymentMethod: 'bank_transfer' | 'digital_wallet' | 'crypto';
  paymentReference?: string;
  paymentInstructions?: PaymentInstructions;

  // Blockchain Information
  transactionHash?: string;
  blockNumber?: number;
  tokenAddress: string;

  // Performance
  currentValue: number; // Current value in IDR
  returnAmount: number; // Total returns received
  returnPercentage: number; // Percentage return

  // Dates
  investmentDate: Date;
  paymentDueDate?: Date;
  lastUpdate: Date;
  nextPaymentDate?: Date;

  // Audit Trail
  createdAt: Date;
  updatedAt: Date;
}

enum InvestmentStatus {
  PENDING_PAYMENT = 'pending_payment',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  TOKENS_MINTED = 'tokens_minted',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

interface PaymentInstructions {
  method: string;
  bankAccount?: {
    accountNumber: string;
    bankName: string;
    accountName: string;
    swiftCode?: string;
  };
  digitalWallet?: {
    provider: string;
    accountId: string;
    qrCode?: string;
  };
  crypto?: {
    address: string;
    network: string;
    minimumAmount: number;
  };
  referenceNumber: string;
  expiresAt: Date;
  instructions: string[];
}
```

#### Database Schema

```sql
-- Investments table
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  project_id UUID NOT NULL REFERENCES projects(id),

  -- Investment details
  amount DECIMAL(20, 2) NOT NULL,
  token_amount DECIMAL(20, 8) NOT NULL,
  token_price DECIMAL(20, 8) NOT NULL,

  -- Status
  status VARCHAR(30) NOT NULL,
  payment_status VARCHAR(20) NOT NULL,

  -- Payment information
  payment_method VARCHAR(20) NOT NULL,
  payment_reference VARCHAR(100),
  payment_instructions JSONB,

  -- Blockchain information
  transaction_hash VARCHAR(66),
  block_number BIGINT,
  token_address VARCHAR(42) NOT NULL,

  -- Performance
  current_value DECIMAL(20, 2) DEFAULT 0,
  return_amount DECIMAL(20, 2) DEFAULT 0,
  return_percentage DECIMAL(8, 4) DEFAULT 0,

  -- Dates
  investment_date TIMESTAMP NOT NULL,
  payment_due_date TIMESTAMP,
  last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  next_payment_date TIMESTAMP,

  -- Audit trail
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_project_id ON investments(project_id);
CREATE INDEX idx_investments_status ON investments(status);
CREATE INDEX idx_investments_payment_status ON investments(payment_status);
CREATE INDEX idx_investments_transaction_hash ON investments(transaction_hash);
```

## Validation Schemas

### Zod Validation Schemas

```typescript
import { z } from 'zod';

// User registration schema
export const userRegistrationSchema = z
  .object({
    email: z.string().email('Invalid email format'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain uppercase, lowercase, number and special character'
      ),
    confirmPassword: z.string(),
    userType: z.enum(['investor', 'spv']),
    acceptTerms: z.boolean().refine(val => val === true, 'Must accept terms'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// User profile schema
export const userProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phoneNumber: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format'),
  dateOfBirth: z.date().refine(date => {
    const age = new Date().getFullYear() - date.getFullYear();
    return age >= 18;
  }, 'Must be at least 18 years old'),
  nationality: z.string().length(3, 'Invalid country code'),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().length(3, 'Invalid country code'),
  }),
});

// Project creation schema
export const projectCreationSchema = z
  .object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(255),
    description: z
      .string()
      .min(50, 'Description must be at least 50 characters'),
    category: z.enum([
      'transportation',
      'energy',
      'water',
      'telecommunications',
      'buildings',
    ]),
    location: z.string().min(1, 'Location is required'),
    province: z.string().min(1, 'Province is required'),
    totalValue: z
      .number()
      .min(1000000, 'Total value must be at least 1 million IDR'),
    targetAmount: z
      .number()
      .min(100000, 'Target amount must be at least 100,000 IDR'),
    minimumInvestment: z
      .number()
      .min(100000, 'Minimum investment must be at least 100,000 IDR'),
    expectedReturn: z
      .number()
      .min(0)
      .max(100, 'Expected return must be between 0-100%'),
    duration: z
      .number()
      .min(1)
      .max(240, 'Duration must be between 1-240 months'),
    startDate: z
      .date()
      .refine(date => date > new Date(), 'Start date must be in the future'),
    endDate: z.date(),
    riskLevel: z.enum(['low', 'medium', 'high']),
  })
  .refine(data => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  })
  .refine(data => data.targetAmount <= data.totalValue, {
    message: 'Target amount cannot exceed total value',
    path: ['targetAmount'],
  });

// Investment schema
export const investmentSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  amount: z.number().min(100000, 'Minimum investment is 100,000 IDR'),
  paymentMethod: z.enum(['bank_transfer', 'digital_wallet']),
  acceptRisks: z.boolean().refine(val => val === true, 'Must accept risks'),
  acceptTerms: z.boolean().refine(val => val === true, 'Must accept terms'),
});

// Governance proposal schema
export const governanceProposalSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200),
  description: z
    .string()
    .min(100, 'Description must be at least 100 characters'),
  executionData: z.string().optional(),
  votingPeriod: z
    .number()
    .min(86400, 'Voting period must be at least 1 day')
    .max(2592000, 'Voting period cannot exceed 30 days'),
});
```

### API Request/Response Schemas

```typescript
// API Response wrapper
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
    })
    .optional(),
  message: z.string().optional(),
  timestamp: z.string().datetime(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Filter schemas
export const projectFilterSchema = z.object({
  category: z
    .enum([
      'transportation',
      'energy',
      'water',
      'telecommunications',
      'buildings',
    ])
    .optional(),
  status: z
    .enum(['active', 'coming_soon', 'fully_funded', 'completed'])
    .optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).optional(),
  minInvestment: z.number().min(0).optional(),
  maxInvestment: z.number().min(0).optional(),
  search: z.string().optional(),
});
```

This comprehensive data model specification provides the foundation for
consistent data handling across the entire Partisipro platform.
