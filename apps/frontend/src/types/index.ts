// Re-export shared types
export * from '@partisipro/shared';

// Frontend-specific types
export interface WalletConnection {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string | null;
}

export interface UIState {
  loading: boolean;
  error: string | null;
  success: string | null;
}

export interface NavigationItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  current: boolean;
}

export interface FormState<T = Record<string, unknown>> {
  data: T;
  errors: Record<string, string>;
  isDirty: boolean;
  isSubmitting: boolean;
}

export interface FinancialProjection {
  revenue: number;
  profit: number;
  returnRate: number;
}

export interface ProjectRisk {
  level: 'Low' | 'Medium' | 'High';
  description: string;
  probability: number;
}

export interface LegalDocument {
  name: string;
  size: string;
  type: string;
}

export interface ProjectUpdate {
  date: string;
  title: string;
  description: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category:
    | 'transportation'
    | 'energy'
    | 'water'
    | 'telecommunications'
    | 'buildings';
  location: string;
  province: string;
  totalValue: number;
  targetAmount: number;
  raisedAmount: number;
  minimumInvestment: number;
  expectedReturn: number;
  duration: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'coming_soon' | 'fully_funded' | 'completed';
  investorCount: number;
  riskLevel: 'low' | 'medium' | 'high';
  image: string;
  highlights: string[];
  financialProjections?: Record<string, FinancialProjection>;
  detailedDescription?: string;
  risks?: ProjectRisk[];
  legalDocuments?: LegalDocument[];
  updates?: ProjectUpdate[];
  keyMetrics?: {
    irr: number;
    roiProjected: number;
    paybackPeriod: number;
    [key: string]: number;
  };
}

export interface IdentityVerification {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  verifiedAt?: string;
  rejectedReason?: string;
  documentStatus: 'pending' | 'approved' | 'rejected';
  claims: IdentityClaim[];
}

export interface IdentityClaim {
  id: string;
  type:
    | 'KYC_APPROVED'
    | 'ACCREDITED_INVESTOR'
    | 'Indonesian_CITIZEN'
    | 'PROFESSIONAL_INVESTOR';
  value: string;
  issuer: string;
  issuedAt: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'revoked';
}

export interface InvestmentFlow {
  step: 'identity' | 'amount' | 'payment' | 'confirmation';
  identityVerified: boolean;
  amount: string;
  paymentMethod: string;
  transactionId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Admin Fee Management interfaces
export interface FeeConfig extends Record<string, unknown> {
  id: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed';
  currentValue: number;
  proposedValue?: number;
  currency: 'IDR' | 'percentage';
  category: 'platform' | 'transaction' | 'service';
  lastUpdated: string;
  updatedBy: string;
  status: 'active' | 'pending' | 'inactive';
  minValue: number;
  maxValue: number;
}

export interface FeeRevenue extends Record<string, unknown> {
  id: string;
  feeType: string;
  projectName: string;
  amount: number;
  date: string;
  transactionId: string;
  status: 'collected' | 'pending' | 'failed';
}

export interface AdminProject extends Record<string, unknown> {
  id: string;
  projectName: string;
  spvName: string;
  projectType: string;
  location: string;
  totalValue: number;
  fundingProgress: number;
  fundingTarget: number;
  investorCount: number;
  status:
    | 'draft'
    | 'review'
    | 'approved'
    | 'funding'
    | 'active'
    | 'operational'
    | 'completed'
    | 'suspended';
  riskLevel: 'low' | 'medium' | 'high';
  createdDate: string;
  launchDate?: string;
  lastActivity: string;
  complianceStatus: 'compliant' | 'review_required' | 'non_compliant';
  flags: string[];
}

export interface Identity extends Record<string, unknown> {
  id: string;
  address: string;
  kycStatus: 'approved' | 'rejected' | 'pending' | 'expired';
  verificationLevel: 'none' | 'basic' | 'advanced' | 'institutional';
  verifiedAt: string;
  expiresAt: string;
  claimsCount: number;
  activeClaims: number;
  lastActivity: string;
  country: string;
  investmentCount: number;
  totalInvested: number;
}

// Enhanced KYC Provider Integration Types
export interface KYCProvider {
  id: 'verihubs' | 'sumsub' | 'jumio' | 'onfido';
  name: string;
  description: string;
  processingTime: string;
  supportedCountries: string[];
  documentTypes: string[];
  features: string[];
  logo: string;
  status: 'active' | 'maintenance' | 'inactive';
}

export interface KYCSession {
  id: string;
  provider: KYCProvider['id'];
  status:
    | 'created'
    | 'initialized'
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'expired';
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  webhookUrl?: string;
  redirectUrl?: string;
  applicantId?: string;
  reviewId?: string;
  checks: KYCCheck[];
  documents: KYCDocument[];
  riskScore?: number;
  failReason?: string;
  reviewNotes?: string;
}

export interface KYCCheck {
  id: string;
  type:
    | 'document'
    | 'facial_similarity'
    | 'liveness'
    | 'aml'
    | 'sanctions'
    | 'identity';
  status:
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'requires_manual_review';
  result?: 'approved' | 'rejected' | 'manual_review';
  confidence?: number;
  errorCode?: string;
  errorMessage?: string;
  completedAt?: string;
}

export interface KYCDocument {
  id: string;
  type:
    | 'id_card'
    | 'passport'
    | 'driving_license'
    | 'selfie'
    | 'proof_of_address'
    | 'bank_statement';
  country?: string;
  status: 'uploaded' | 'processing' | 'verified' | 'rejected';
  extractedData?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    documentNumber?: string;
    dateOfBirth?: string;
    expirationDate?: string;
    issuedDate?: string;
    nationality?: string;
    address?: string;
  };
  verificationResult?: {
    authentic: boolean;
    readability: 'high' | 'medium' | 'low';
    validity: 'valid' | 'expired' | 'invalid';
    tampered: boolean;
  };
  uploadedAt: string;
  processedAt?: string;
}

export interface KYCProviderResponse {
  success: boolean;
  sessionId?: string;
  redirectUrl?: string;
  status?: KYCSession['status'];
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  data?: {
    checks?: KYCCheck[];
    documents?: KYCDocument[];
    riskScore?: number;
    extractedData?: Record<string, unknown>;
  };
}

export interface KYCWebhookEvent {
  id: string;
  sessionId: string;
  provider: KYCProvider['id'];
  eventType:
    | 'session_created'
    | 'check_completed'
    | 'session_completed'
    | 'session_failed'
    | 'manual_review_required';
  timestamp: string;
  data: {
    status: KYCSession['status'];
    checks?: KYCCheck[];
    riskScore?: number;
    failReason?: string;
  };
}

export interface AutomatedClaimsIssuance {
  sessionId: string;
  identityAddress: string;
  claimsToIssue: {
    type: IdentityClaim['type'];
    value: string;
    issuer: string;
    expiresIn?: number; // seconds
  }[];
  issuanceStatus: 'pending' | 'processing' | 'completed' | 'failed';
  transactionHash?: string;
  issuedAt?: string;
  failReason?: string;
}

export interface KYCRetryPolicy {
  maxRetries: number;
  retryDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
  retryableErrors: string[];
}

export interface KYCErrorHandling {
  errorCode: string;
  errorType: 'network' | 'validation' | 'provider' | 'system' | 'user';
  message: string;
  userMessage: string;
  retryable: boolean;
  suggestedAction:
    | 'retry'
    | 'contact_support'
    | 'update_documents'
    | 'manual_review';
  supportReference?: string;
}

export interface IdentityTableRow extends Record<string, unknown> {
  id: string;
  address: string;
  kycStatus: 'approved' | 'rejected' | 'pending' | 'expired';
  verificationLevel: 'none' | 'basic' | 'advanced' | 'institutional';
  verifiedAt: string;
  claimsCount: number;
  activeClaims: number;
  lastActivity: string;
  country: string;
  investmentCount: number;
  totalInvested: string; // formatted currency
}

export interface SPVApplication extends Record<string, unknown> {
  id: string;
  companyName: string;
  legalEntityType: string;
  registrationNumber: string;
  contactPerson: string;
  email: string;
  phone: string;
  website?: string;
  businessType: string;
  yearsOfOperation: number;
  submittedDate: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  documents: {
    businessLicense: boolean;
    taxCertificate: boolean;
    auditedFinancials: boolean;
    companyProfile: boolean;
    bankReference: boolean;
  };
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  estimatedProjectValue?: number;
}

export interface ApprovedSPV extends Record<string, unknown> {
  id: string;
  companyName: string;
  approvedDate: string;
  walletAddress: string;
  projectsCreated: number;
  totalFundingRaised: number;
  status: 'active' | 'suspended' | 'inactive';
  lastActivity: string;
  performanceScore: number;
}

// Batch Operations Types
export interface BatchOperation extends Record<string, unknown> {
  id: string;
  type:
    | 'user_registration'
    | 'verification'
    | 'claim_assignment'
    | 'status_update';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  startedAt: string;
  completedAt?: string;
  estimatedCompletion?: string;
  createdBy: string;
  operationData: BatchOperationData;
  errors: BatchOperationError[];
}

export interface BatchOperationData extends Record<string, unknown> {
  operationType: string;
  parameters: Record<string, unknown>;
  targetIdentities?: string[];
  csvData?: string[][];
  claimType?: string;
  newStatus?: string;
}

export interface BatchOperationError extends Record<string, unknown> {
  itemIndex: number;
  itemId?: string;
  errorMessage: string;
  errorCode: string;
  timestamp: string;
}

export interface BatchUserRegistration extends Record<string, unknown> {
  walletAddress: string;
  email?: string;
  country: string;
  verificationLevel: 'basic' | 'advanced' | 'institutional';
  kycProvider?: string;
  referenceId?: string;
}

export interface BatchClaimAssignment extends Record<string, unknown> {
  identityId: string;
  walletAddress: string;
  claimType:
    | 'KYC_APPROVED'
    | 'ACCREDITED_INVESTOR'
    | 'Indonesian_CITIZEN'
    | 'PROFESSIONAL_INVESTOR';
  claimValue: string;
  expiresAt?: string;
  issuer: string;
}

export interface GovernanceProposal extends Record<string, unknown> {
  id: string;
  title: string;
  description: string;
  type:
    | 'contract_upgrade'
    | 'parameter_change'
    | 'fund_allocation'
    | 'operational_change';
  status: 'draft' | 'active' | 'passed' | 'rejected' | 'executed';
  createdDate: string;
  votingStart: string;
  votingEnd: string;
  totalVotes: number;
  votesFor: number;
  votesAgainst: number;
  quorumRequired: number;
  quorumMet: boolean;
  proposer: string;
  executionDate?: string;
}

// Trusted Issuer Management interfaces
export interface TrustedIssuer extends Record<string, unknown> {
  id: string;
  name: string;
  address: string;
  description: string;
  website?: string;
  email: string;
  phone?: string;
  country: string;
  registrationNumber?: string;
  claimTypes: string[];
  status: 'active' | 'suspended' | 'pending' | 'revoked';
  addedDate: string;
  addedBy: string;
  lastActivity: string;
  verificationsIssued: number;
  activeVerifications: number;
  successRate: number;
  averageProcessingTime: number; // hours
  complianceScore: number;
  permissions: {
    canIssueKYC: boolean;
    canIssueAccredited: boolean;
    canRevokeClaims: boolean;
    canBatchProcess: boolean;
  };
}

export interface TrustedIssuerTableRow extends Record<string, unknown> {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'suspended' | 'pending' | 'revoked';
  claimTypes: string[];
  verificationsIssued: number;
  successRate: number;
  lastActivity: string;
  complianceScore: number;
}

export interface IssuerActivity extends Record<string, unknown> {
  id: string;
  issuerId: string;
  issuerName: string;
  action: 'claim_issued' | 'claim_revoked' | 'batch_process' | 'status_update';
  details: string;
  claimType?: string;
  userAddress?: string;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
  transactionHash?: string;
}

export interface ClaimType extends Record<string, unknown> {
  id: string;
  topicId: number;
  name: string;
  description: string;
  schema: string;
  isRequired: boolean;
  expirationPeriod: number; // days
  renewalPeriod: number; // days before expiration to allow renewal
  authorizedIssuers: string[];
  createdDate: string;
  modifiedDate: string;
  usage: {
    totalIssued: number;
    currentActive: number;
    averageValidityPeriod: number;
  };
}

// Admin System Management interfaces
export interface SystemHealth extends Record<string, unknown> {
  component: string;
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastCheck: string;
  details: string;
  metrics?: {
    cpu?: number;
    memory?: number;
    disk?: number;
    network?: number;
    connections?: number;
  };
}

export interface SystemConfig extends Record<string, unknown> {
  id: string;
  category: string;
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'select' | 'password';
  currentValue: string | number | boolean;
  defaultValue: string | number | boolean;
  isModified: boolean;
  lastUpdated: string;
  updatedBy: string;
  options?: string[];
  requiresRestart: boolean;
}

export interface SystemLog extends Record<string, unknown> {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  component: string;
  message: string;
  details?: string;
  userId?: string;
  ipAddress?: string;
}

export interface UserRole extends Record<string, unknown> {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  lastModified: string;
  isSystemRole: boolean;
}

// SPV interfaces
export interface SPVProject extends Record<string, unknown> {
  id: string;
  projectName: string;
  projectType: string;
  location: string;
  totalValue: number;
  fundingProgress: number;
  fundingTarget: number;
  investorCount: number;
  status:
    | 'draft'
    | 'review'
    | 'approved'
    | 'funding'
    | 'active'
    | 'operational'
    | 'completed'
    | 'suspended';
  riskLevel: 'low' | 'medium' | 'high';
  createdDate: string;
  launchDate?: string;
  lastActivity: string;
  complianceStatus: 'compliant' | 'review_required' | 'non_compliant';
  upcomingPayments?: number;
  monthlyRevenue?: number;
  totalRevenue?: number;
  profitMargin?: number;
  currentRevenue: number;
  expectedRevenue: number;
}

// SPV Compliance interfaces
export interface ComplianceProject extends Record<string, unknown> {
  id: string;
  name: string;
  verifiedInvestors: number;
  totalInvestors: number;
  complianceScore: number;
  pendingVerification: number;
  status: 'compliant' | 'review_required' | 'non_compliant';
  lastAudit: string;
  lastUpdated: string;
}

export interface InvestorProfile extends Record<string, unknown> {
  id: string;
  address: string;
  verificationStatus: 'verified' | 'pending' | 'rejected';
  investmentAmount: number;
  joinDate: string;
  lastActivity: string;
  activeClaims: number;
  claimsCount: number;
  riskLevel: 'low' | 'medium' | 'high';
  complianceNotes?: string;
}
