export enum IdentityStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REVOKED = 'revoked',
}

export enum ClaimStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

export enum ClaimTopic {
  KYC_APPROVED = 'KYC_APPROVED',
  ACCREDITED_INVESTOR = 'ACCREDITED_INVESTOR',
  AUTHORIZED_SPV = 'AUTHORIZED_SPV',
  GOVERNANCE_ELIGIBLE = 'GOVERNANCE_ELIGIBLE',
  INSTITUTIONAL_INVESTOR = 'INSTITUTIONAL_INVESTOR',
}

export enum ClaimCategory {
  KYC = 'kyc',
  ACCREDITATION = 'accreditation',
  GOVERNANCE = 'governance',
  COMPLIANCE = 'compliance',
}

export enum IssuerStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked',
}

export interface ClaimReference {
  claimId: string;
  claimTopic: ClaimTopic;
  issuedAt: Date;
  expiresAt?: Date;
  status: ClaimStatus;
}

export interface IdentityRegistry {
  id: string; // User wallet address as ID
  userId: string; // Reference to existing users collection
  identityKey: string; // On-chain identity key
  status: IdentityStatus;
  claims: ClaimReference[];
  trustedIssuers: string[];
  createdAt: Date;
  verifiedAt?: Date;
  lastUpdated: Date;
  metadata?: Record<string, any>;
}

export interface Claim {
  id: string; // Unique claim ID
  identityId: string; // Reference to identity (wallet address)
  claimTopic: ClaimTopic;
  issuer: string; // Trusted issuer address/ID
  data: Record<string, any>; // Claim data
  issuedAt: Date;
  expiresAt?: Date;
  status: ClaimStatus;
  verificationHash: string; // On-chain verification hash
  revocationReason?: string;
  updatedAt: Date;
}

export interface ClaimTopicDefinition {
  id: string; // Topic identifier (same as ClaimTopic enum)
  name: string; // Human-readable name
  description: string; // Topic description
  required: boolean; // Required for platform participation
  category: ClaimCategory;
  defaultExpiry?: number; // Default expiry in days
  renewable: boolean; // Whether claim can be renewed
  createdAt: Date;
  updatedAt: Date;
}

export interface IssuerMetadata {
  companyName?: string;
  website?: string;
  contactEmail?: string;
  apiEndpoint?: string;
  webhookUrl?: string;
  supportedRegions?: string[];
  verificationMethods?: string[];
}

export interface TrustedIssuer {
  id: string; // Issuer address/ID
  name: string; // KYC provider name (e.g., 'Verihubs', 'Sumsub')
  authorizedClaims: ClaimTopic[];
  status: IssuerStatus;
  registeredAt: Date;
  lastActivity: Date;
  metadata: IssuerMetadata;
  issuedClaimsCount: number;
  activeClaimsCount: number;
}

// DTOs for API requests
export interface CreateIdentityDto {
  userAddress: string;
  userId: string;
  identityKey?: string;
  metadata?: Record<string, any>;
}

export interface UpdateIdentityStatusDto {
  status: IdentityStatus;
  reason?: string;
}

export interface CreateClaimDto {
  identityId: string;
  claimTopic: ClaimTopic;
  issuer: string;
  data: Record<string, any>;
  expiresAt?: Date;
  verificationHash?: string;
}

export interface UpdateClaimDto {
  claimId: string;
  status?: ClaimStatus;
  expiresAt?: Date;
  data?: Record<string, any>;
  revocationReason?: string;
}

export interface CreateTrustedIssuerDto {
  issuerAddress: string;
  name: string;
  authorizedClaims: ClaimTopic[];
  metadata: IssuerMetadata;
}

export interface UpdateTrustedIssuerDto {
  name?: string;
  authorizedClaims?: ClaimTopic[];
  status?: IssuerStatus;
  metadata?: Partial<IssuerMetadata>;
}

export interface VerifyIdentityDto {
  userAddress: string;
  requiredClaims?: ClaimTopic[];
}

export interface BatchRegisterIdentitiesDto {
  identities: CreateIdentityDto[];
}

export interface BatchUpdateClaimsDto {
  updates: UpdateClaimDto[];
}

// Response types
export interface IdentityVerificationResult {
  isVerified: boolean;
  identity?: IdentityRegistry;
  missingClaims?: ClaimTopic[];
  expiredClaims?: ClaimReference[];
  reason?: string;
}

export interface ClaimVerificationResult {
  isValid: boolean;
  claim?: Claim;
  reason?: string;
  expiresIn?: number; // Days until expiration
}

export interface ComplianceCheckResult {
  isCompliant: boolean;
  checkedAt: Date;
  violations: string[];
  requiredActions: string[];
  nextCheckDue?: Date;
}

// Audit and tracking types
export interface IdentityAuditLog {
  id: string;
  timestamp: Date;
  operation:
    | 'register'
    | 'verify'
    | 'revoke'
    | 'claim_issue'
    | 'claim_revoke'
    | 'status_update';
  identityId: string;
  operatorId: string;
  changes: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface ComplianceReport {
  generatedAt: Date;
  totalIdentities: number;
  verifiedIdentities: number;
  pendingIdentities: number;
  revokedIdentities: number;
  totalClaims: number;
  activeClaims: number;
  expiredClaims: number;
  revokedClaims: number;
  expiredClaimsCount: number;
  invalidTransfersCount: number;
  unauthorizedOperationsCount: number;
  complianceScore: number; // 0-100
  recommendations: string[];
}
