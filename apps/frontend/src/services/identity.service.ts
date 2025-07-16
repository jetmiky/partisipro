/**
 * Identity Service
 * Handles ERC-3643 identity verification and claims management
 */

import { apiClient } from '../lib/api-client';

export interface IdentityClaim {
  id: string;
  type: 'KYC_APPROVED' | 'ACCREDITED_INVESTOR' | 'AML_CLEARED' | 'INSTITUTIONAL_INVESTOR' | 'RETAIL_QUALIFIED';
  value: string;
  issuer: string;
  issuerName?: string;
  issuedAt: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'revoked' | 'pending';
  verified: boolean;
  metadata?: {
    transactionHash?: string;
    blockNumber?: number;
    verificationScore?: number;
    documents?: string[];
  };
}

export interface IdentityVerificationStatus {
  isVerified: boolean;
  walletAddress: string;
  verificationLevel: 'none' | 'basic' | 'advanced' | 'institutional';
  kycStatus: 'pending' | 'processing' | 'approved' | 'rejected' | 'expired';
  completedAt?: string;
  expiresAt?: string;
  claims: IdentityClaim[];
  eligibleProjects: string[];
  restrictions?: {
    investmentLimit?: number;
    restrictedRegions?: string[];
    requiresAdditionalVerification?: boolean;
  };
}

export interface IdentityRegistration {
  walletAddress: string;
  email: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    residenceCountry: string;
    phoneNumber: string;
  };
  kycProvider: 'verihubs' | 'sumsub' | 'jumio';
  investorType: 'retail' | 'accredited' | 'institutional';
}

export interface ClaimIssuanceRequest {
  userAddress: string;
  claimType: IdentityClaim['type'];
  claimValue: string;
  issuerAddress: string;
  expirationDate?: string;
  metadata?: any;
}

export interface TrustedIssuer {
  address: string;
  name: string;
  organization: string;
  authorizedClaims: IdentityClaim['type'][];
  isActive: boolean;
  verificationScore: number;
  registeredAt: string;
  website?: string;
  certificateUrl?: string;
}

export interface IdentityAnalytics {
  totalVerifiedUsers: number;
  verificationsByLevel: Record<string, number>;
  claimsByType: Record<string, number>;
  averageVerificationTime: number; // in hours
  expiringClaims: {
    count: number;
    nextExpirationDate: string;
  };
  trustedIssuersStats: {
    totalIssuers: number;
    activeIssuers: number;
    mostActiveIssuer: string;
  };
}

class IdentityService {
  private readonly BASE_PATH = '/api/identity';

  /**
   * Get current user's identity verification status
   */
  async getIdentityStatus(): Promise<IdentityVerificationStatus> {
    return apiClient.get(`${this.BASE_PATH}/status`);
  }

  /**
   * Register user identity in the ERC-3643 system
   */
  async registerIdentity(registration: IdentityRegistration): Promise<{
    success: boolean;
    identityId: string;
    transactionHash: string;
  }> {
    return apiClient.post(`${this.BASE_PATH}/register`, registration);
  }

  /**
   * Update identity information
   */
  async updateIdentity(updates: Partial<IdentityRegistration>): Promise<{
    success: boolean;
    transactionHash?: string;
  }> {
    return apiClient.patch(`${this.BASE_PATH}/update`, updates);
  }

  /**
   * Get user's identity claims
   */
  async getClaims(): Promise<IdentityClaim[]> {
    return apiClient.get(`${this.BASE_PATH}/claims`);
  }

  /**
   * Get specific claim details
   */
  async getClaim(claimId: string): Promise<IdentityClaim> {
    return apiClient.get(`${this.BASE_PATH}/claims/${claimId}`);
  }

  /**
   * Request a new claim from a trusted issuer
   */
  async requestClaim(request: ClaimIssuanceRequest): Promise<{
    success: boolean;
    claimId: string;
    status: 'pending' | 'issued';
    transactionHash?: string;
  }> {
    return apiClient.post(`${this.BASE_PATH}/claims/request`, request);
  }

  /**
   * Revoke a claim (user or issuer can revoke)
   */
  async revokeClaim(claimId: string, reason: string): Promise<{
    success: boolean;
    transactionHash: string;
  }> {
    return apiClient.post(`${this.BASE_PATH}/claims/${claimId}/revoke`, { reason });
  }

  /**
   * Verify a claim's authenticity
   */
  async verifyClaim(claimId: string): Promise<{
    isValid: boolean;
    issuer: TrustedIssuer;
    verificationDetails: {
      onChainVerified: boolean;
      issuerAuthorized: boolean;
      notExpired: boolean;
      notRevoked: boolean;
    };
  }> {
    return apiClient.get(`${this.BASE_PATH}/claims/${claimId}/verify`);
  }

  /**
   * Get list of trusted issuers
   */
  async getTrustedIssuers(): Promise<TrustedIssuer[]> {
    return apiClient.get(`${this.BASE_PATH}/trusted-issuers`);
  }

  /**
   * Get trusted issuer details
   */
  async getTrustedIssuer(issuerAddress: string): Promise<TrustedIssuer> {
    return apiClient.get(`${this.BASE_PATH}/trusted-issuers/${issuerAddress}`);
  }

  /**
   * Check if user is eligible for specific project investment
   */
  async checkProjectEligibility(projectId: string): Promise<{
    eligible: boolean;
    requiredClaims: string[];
    missingClaims: string[];
    restrictions?: {
      maxInvestment?: number;
      additionalVerificationRequired?: boolean;
    };
  }> {
    return apiClient.get(`${this.BASE_PATH}/eligibility/project/${projectId}`);
  }

  /**
   * Get user's investment eligibility across all projects
   */
  async getInvestmentEligibility(): Promise<{
    eligibleProjects: string[];
    restrictedProjects: Array<{
      projectId: string;
      reason: string;
      requiredActions: string[];
    }>;
    overallStatus: 'eligible' | 'partially_eligible' | 'not_eligible';
  }> {
    return apiClient.get(`${this.BASE_PATH}/eligibility`);
  }

  /**
   * Get identity verification analytics (Admin only)
   */
  async getIdentityAnalytics(dateRange?: {
    from: string;
    to: string;
  }): Promise<IdentityAnalytics> {
    const params = dateRange ? { from: dateRange.from, to: dateRange.to } : undefined;
    return apiClient.get(`${this.BASE_PATH}/analytics`, params);
  }

  /**
   * Refresh identity status from blockchain
   */
  async refreshIdentityStatus(): Promise<{
    success: boolean;
    updatedClaims: number;
    newStatus: IdentityVerificationStatus;
  }> {
    return apiClient.post(`${this.BASE_PATH}/refresh`);
  }

  /**
   * Get identity verification history
   */
  async getVerificationHistory(): Promise<Array<{
    id: string;
    action: 'registration' | 'claim_issued' | 'claim_revoked' | 'status_updated';
    timestamp: string;
    details: any;
    transactionHash?: string;
  }>> {
    return apiClient.get(`${this.BASE_PATH}/history`);
  }

  /**
   * Export identity data (GDPR compliance)
   */
  async exportIdentityData(format: 'json' | 'pdf'): Promise<Blob> {
    const response = await fetch(
      `${apiClient.getBaseURL()}${this.BASE_PATH}/export?format=${format}`,
      {
        headers: {
          Authorization: `Bearer ${apiClient.getAuthToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }

  /**
   * Delete identity data (GDPR compliance - careful operation)
   */
  async deleteIdentity(confirmation: string): Promise<{
    success: boolean;
    deletedAt: string;
    recoveryPeriod: number; // days before permanent deletion
  }> {
    return apiClient.delete(`${this.BASE_PATH}/delete`, { confirmation });
  }

  /**
   * Batch operations for multiple claims (Admin/Issuer only)
   */
  async batchIssueClaims(requests: ClaimIssuanceRequest[]): Promise<{
    successful: Array<{ claimId: string; transactionHash: string }>;
    failed: Array<{ request: ClaimIssuanceRequest; error: string }>;
    totalProcessed: number;
  }> {
    return apiClient.post(`${this.BASE_PATH}/claims/batch-issue`, { requests });
  }

  /**
   * Get claim renewal suggestions
   */
  async getClaimRenewalSuggestions(): Promise<Array<{
    claimId: string;
    claimType: string;
    expiresAt: string;
    daysUntilExpiry: number;
    renewalRequired: boolean;
    recommendedAction: string;
  }>> {
    return apiClient.get(`${this.BASE_PATH}/claims/renewal-suggestions`);
  }

  /**
   * Set up automatic claim renewal
   */
  async setupAutoRenewal(claimId: string, settings: {
    autoRenew: boolean;
    renewBeforeDays: number;
    maxRenewals?: number;
  }): Promise<{
    success: boolean;
    renewalSchedule: {
      nextRenewalDate: string;
      renewalCount: number;
    };
  }> {
    return apiClient.post(`${this.BASE_PATH}/claims/${claimId}/auto-renewal`, settings);
  }
}

// Create singleton instance
export const identityService = new IdentityService();

// Export the class for potential custom instances
export { IdentityService };