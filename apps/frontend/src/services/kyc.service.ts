/**
 * KYC Service
 * Handles Know Your Customer verification through multiple providers
 */

import { apiClient } from '../lib/api-client';

export interface KYCProvider {
  id: 'verihubs' | 'sumsub' | 'jumio';
  name: string;
  description: string;
  features: string[];
  supportedDocuments: string[];
  processingTime: string;
  accuracy: number;
  isAvailable: boolean;
  pricing: {
    basic: number;
    premium: number;
    currency: string;
  };
  regions: string[];
  languages: string[];
  logo?: string;
}

export interface KYCSession {
  id: string;
  userId: string;
  provider: KYCProvider['id'];
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  level: 'basic' | 'advanced' | 'institutional';
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  sessionUrl?: string;
  webhookEvents: KYCWebhookEvent[];
  results?: KYCResults;
  documents: KYCDocument[];
  checks: KYCCheck[];
}

export interface KYCWebhookEvent {
  id: string;
  event: string;
  timestamp: string;
  data: any;
  processed: boolean;
}

export interface KYCResults {
  overall: 'approved' | 'rejected' | 'needs_review';
  score: number; // 0-100
  confidence: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  completedAt: string;
  expiresAt: string;
  checks: {
    identity: KYCCheckResult;
    document: KYCCheckResult;
    address: KYCCheckResult;
    sanctions: KYCCheckResult;
    pep: KYCCheckResult; // Politically Exposed Person
    aml: KYCCheckResult; // Anti-Money Laundering
  };
  extractedData: {
    personalInfo: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      nationality: string;
      gender?: string;
    };
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    document: {
      type: string;
      number: string;
      issuedBy: string;
      issuedAt: string;
      expiresAt: string;
    };
  };
  notes?: string;
  reviewRequired?: boolean;
  reviewer?: {
    id: string;
    name: string;
    reviewedAt: string;
    decision: string;
    comments: string;
  };
}

export interface KYCCheckResult {
  status: 'passed' | 'failed' | 'warning' | 'not_performed';
  score: number;
  details: string;
  evidence?: any[];
}

export interface KYCDocument {
  id: string;
  type: 'passport' | 'drivers_license' | 'national_id' | 'utility_bill' | 'bank_statement' | 'other';
  name: string;
  uploadedAt: string;
  status: 'uploaded' | 'processing' | 'verified' | 'rejected';
  url?: string;
  extractedData?: any;
  verificationScore?: number;
  issues?: string[];
}

export interface KYCCheck {
  id: string;
  type: 'identity' | 'document' | 'address' | 'sanctions' | 'pep' | 'aml';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result: KYCCheckResult;
  performedAt: string;
  provider: string;
}

export interface KYCInitiationRequest {
  provider: KYCProvider['id'];
  level: KYCSession['level'];
  investorType: 'retail' | 'accredited' | 'institutional';
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: string;
    nationality: string;
    residenceCountry: string;
    phoneNumber: string;
  };
  preferredLanguage?: string;
  callbackUrl?: string;
}

export interface AutomatedClaimsIssuance {
  enabled: boolean;
  trigger: 'on_approval' | 'on_completion' | 'manual';
  claimTypes: string[];
  issuerAddress: string;
  expirationPeriod: number; // days
  conditions: {
    minimumScore: number;
    requiredChecks: string[];
  };
}

export interface KYCErrorHandling {
  retryPolicy: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
    retryDelay: number; // seconds
  };
  fallbackProviders: KYCProvider['id'][];
  escalationThreshold: number; // failure count
  notificationChannels: ('email' | 'webhook' | 'sms')[];
}

export interface KYCAnalytics {
  totalSessions: number;
  completionRate: number;
  averageProcessingTime: number; // hours
  approvalRate: number;
  providerPerformance: Array<{
    provider: string;
    sessions: number;
    successRate: number;
    averageTime: number;
    score: number;
  }>;
  riskDistribution: Record<string, number>;
  topRejectionReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    sessions: number;
    approvals: number;
    rejections: number;
  }>;
}

class KYCService {
  private readonly BASE_PATH = '/api/kyc';

  /**
   * Get available KYC providers
   */
  async getProviders(): Promise<KYCProvider[]> {
    return apiClient.get(`${this.BASE_PATH}/providers`);
  }

  /**
   * Get specific provider details
   */
  async getProvider(providerId: KYCProvider['id']): Promise<KYCProvider> {
    return apiClient.get(`${this.BASE_PATH}/providers/${providerId}`);
  }

  /**
   * Initiate KYC verification process
   */
  async initiateKYC(request: KYCInitiationRequest): Promise<{
    sessionId: string;
    sessionUrl: string;
    status: 'created';
    expiresAt: string;
  }> {
    return apiClient.post(`${this.BASE_PATH}/initiate`, request);
  }

  /**
   * Get KYC session status
   */
  async getSessionStatus(sessionId: string): Promise<KYCSession> {
    return apiClient.get(`${this.BASE_PATH}/sessions/${sessionId}`);
  }

  /**
   * Get user's KYC sessions
   */
  async getUserSessions(params?: {
    status?: KYCSession['status'];
    provider?: KYCProvider['id'];
    limit?: number;
    offset?: number;
  }): Promise<{
    sessions: KYCSession[];
    total: number;
    hasMore: boolean;
  }> {
    return apiClient.get(`${this.BASE_PATH}/sessions`, params);
  }

  /**
   * Get current user's KYC status
   */
  async getCurrentKYCStatus(): Promise<{
    hasActiveSession: boolean;
    currentSession?: KYCSession;
    latestResults?: KYCResults;
    verificationLevel: 'none' | 'basic' | 'advanced' | 'institutional';
    expiresAt?: string;
  }> {
    return apiClient.get(`${this.BASE_PATH}/status`);
  }

  /**
   * Upload additional documents
   */
  async uploadDocument(
    sessionId: string,
    documentType: KYCDocument['type'],
    file: File
  ): Promise<{
    documentId: string;
    uploadUrl?: string;
    status: 'uploaded';
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', documentType);

    return apiClient.upload(`${this.BASE_PATH}/sessions/${sessionId}/documents`, formData);
  }

  /**
   * Get document verification results
   */
  async getDocumentResults(sessionId: string, documentId: string): Promise<KYCDocument> {
    return apiClient.get(`${this.BASE_PATH}/sessions/${sessionId}/documents/${documentId}`);
  }

  /**
   * Request manual review
   */
  async requestManualReview(sessionId: string, reason: string): Promise<{
    success: boolean;
    reviewId: string;
    estimatedReviewTime: string;
  }> {
    return apiClient.post(`${this.BASE_PATH}/sessions/${sessionId}/review`, { reason });
  }

  /**
   * Cancel KYC session
   */
  async cancelSession(sessionId: string, reason: string): Promise<{
    success: boolean;
    cancelledAt: string;
  }> {
    return apiClient.post(`${this.BASE_PATH}/sessions/${sessionId}/cancel`, { reason });
  }

  /**
   * Retry failed KYC session
   */
  async retrySession(sessionId: string, newProvider?: KYCProvider['id']): Promise<{
    newSessionId: string;
    sessionUrl: string;
    retryCount: number;
  }> {
    return apiClient.post(`${this.BASE_PATH}/sessions/${sessionId}/retry`, { newProvider });
  }

  /**
   * Get KYC analytics (Admin only)
   */
  async getKYCAnalytics(dateRange?: {
    from: string;
    to: string;
  }): Promise<KYCAnalytics> {
    const params = dateRange ? { from: dateRange.from, to: dateRange.to } : undefined;
    return apiClient.get(`${this.BASE_PATH}/analytics`, params);
  }

  /**
   * Configure automated claims issuance
   */
  async configureAutomatedClaims(config: AutomatedClaimsIssuance): Promise<{
    success: boolean;
    configurationId: string;
  }> {
    return apiClient.post(`${this.BASE_PATH}/automated-claims`, config);
  }

  /**
   * Get automated claims configuration
   */
  async getAutomatedClaimsConfig(): Promise<AutomatedClaimsIssuance[]> {
    return apiClient.get(`${this.BASE_PATH}/automated-claims`);
  }

  /**
   * Configure error handling settings
   */
  async configureErrorHandling(config: KYCErrorHandling): Promise<{
    success: boolean;
  }> {
    return apiClient.post(`${this.BASE_PATH}/error-handling`, config);
  }

  /**
   * Test provider connectivity
   */
  async testProviderConnection(providerId: KYCProvider['id']): Promise<{
    connected: boolean;
    responseTime: number;
    version: string;
    features: string[];
    lastChecked: string;
  }> {
    return apiClient.get(`${this.BASE_PATH}/providers/${providerId}/test`);
  }

  /**
   * Get KYC compliance report
   */
  async getComplianceReport(params: {
    dateRange: { from: string; to: string };
    format: 'json' | 'pdf' | 'csv';
    includeDetails: boolean;
  }): Promise<Blob | any> {
    const { format, ...otherParams } = params;
    
    if (format === 'json') {
      return apiClient.get(`${this.BASE_PATH}/compliance-report`, otherParams);
    }

    const queryParams = new URLSearchParams({
      format,
      ...otherParams,
    });

    const response = await fetch(
      `${apiClient.getBaseURL()}${this.BASE_PATH}/compliance-report?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${apiClient.getAuthToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Report generation failed');
    }

    return response.blob();
  }

  /**
   * Get KYC session webhooks
   */
  async getSessionWebhooks(sessionId: string): Promise<KYCWebhookEvent[]> {
    return apiClient.get(`${this.BASE_PATH}/sessions/${sessionId}/webhooks`);
  }

  /**
   * Bulk approve KYC sessions (Admin only)
   */
  async bulkApprove(sessionIds: string[], reviewerComments?: string): Promise<{
    successful: string[];
    failed: Array<{ sessionId: string; error: string }>;
    totalProcessed: number;
  }> {
    return apiClient.post(`${this.BASE_PATH}/bulk-approve`, {
      sessionIds,
      reviewerComments,
    });
  }

  /**
   * Get KYC verification certificate
   */
  async getVerificationCertificate(sessionId: string, format: 'pdf' | 'json'): Promise<Blob | any> {
    if (format === 'json') {
      return apiClient.get(`${this.BASE_PATH}/sessions/${sessionId}/certificate`);
    }

    const response = await fetch(
      `${apiClient.getBaseURL()}${this.BASE_PATH}/sessions/${sessionId}/certificate?format=${format}`,
      {
        headers: {
          Authorization: `Bearer ${apiClient.getAuthToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Certificate generation failed');
    }

    return response.blob();
  }

  /**
   * Set up KYC renewal notifications
   */
  async setupRenewalNotifications(settings: {
    enabled: boolean;
    notifyBeforeDays: number[];
    channels: ('email' | 'sms' | 'webhook')[];
    customMessage?: string;
  }): Promise<{
    success: boolean;
    notificationSchedule: Array<{
      date: string;
      channel: string;
      message: string;
    }>;
  }> {
    return apiClient.post(`${this.BASE_PATH}/renewal-notifications`, settings);
  }
}

// Create singleton instance
export const kycService = new KYCService();

// Export the class for potential custom instances
export { KYCService };