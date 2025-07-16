/**
 * Investments Service
 * Handles investment-related API calls and blockchain interactions
 */

import { apiClient } from '../lib/api-client';

export interface Investment {
  id: string;
  projectId: string;
  investorId: string;
  investorAddress: string;
  amount: number;
  tokensReceived: number;
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  transactionHash?: string;
  paymentMethod: string;
  paymentReference?: string;
  investedAt: string;
  confirmedAt?: string;
  failedAt?: string;
  failureReason?: string;
}

export interface InvestmentRequest {
  projectId: string;
  amount: number;
  paymentMethod: string;
  acceptTerms: boolean;
  acceptRisks: boolean;
}

export interface InvestmentEligibility {
  eligible: boolean;
  reason?: string;
  identityVerified: boolean;
  kycApproved: boolean;
  minimumInvestmentMet: boolean;
  maximumInvestmentExceeded: boolean;
  offeringActive: boolean;
  tokensAvailable: boolean;
}

export interface PaymentDetails {
  paymentReference: string;
  paymentInstructions: {
    method: string;
    accountNumber?: string;
    virtualAccount?: string;
    qrCode?: string;
    deepLink?: string;
    expiresAt: string;
  };
  amount: number;
  fees: number;
  totalAmount: number;
}

export interface InvestmentStatus {
  id: string;
  status: Investment['status'];
  progress: {
    step: 'payment' | 'verification' | 'blockchain' | 'complete';
    message: string;
    timestamp: string;
  }[];
  estimatedCompletion?: string;
  transactionHash?: string;
}

export interface Portfolio {
  totalInvestments: number;
  totalTokens: number;
  totalValue: number;
  totalReturns: number;
  investments: {
    id: string;
    projectName: string;
    projectId: string;
    amount: number;
    tokens: number;
    currentValue: number;
    returns: number;
    returnPercentage: number;
    status: Investment['status'];
    investedAt: string;
  }[];
}

export interface ProfitClaim {
  id: string;
  projectId: string;
  investmentId: string;
  amount: number;
  distributionDate: string;
  status: 'available' | 'claimed' | 'processing';
  claimedAt?: string;
  transactionHash?: string;
}

class InvestmentsService {
  private readonly BASE_PATH = '/api/investments';

  /**
   * Check investment eligibility for a project
   */
  async checkEligibility(
    projectId: string,
    amount: number
  ): Promise<InvestmentEligibility> {
    return apiClient.get(`${this.BASE_PATH}/eligibility`, {
      projectId,
      amount,
    });
  }

  /**
   * Create new investment
   */
  async createInvestment(request: InvestmentRequest): Promise<{
    investment: Investment;
    paymentDetails: PaymentDetails;
  }> {
    return apiClient.post(this.BASE_PATH, request);
  }

  /**
   * Get investment by ID
   */
  async getInvestment(id: string): Promise<Investment> {
    return apiClient.get(`${this.BASE_PATH}/${id}`);
  }

  /**
   * Get investment status with progress tracking
   */
  async getInvestmentStatus(id: string): Promise<InvestmentStatus> {
    return apiClient.get(`${this.BASE_PATH}/${id}/status`);
  }

  /**
   * Confirm payment for investment (after external payment)
   */
  async confirmPayment(
    investmentId: string,
    paymentReference: string
  ): Promise<Investment> {
    return apiClient.post(`${this.BASE_PATH}/${investmentId}/confirm-payment`, {
      paymentReference,
    });
  }

  /**
   * Cancel pending investment
   */
  async cancelInvestment(id: string): Promise<{ success: boolean }> {
    return apiClient.delete(`${this.BASE_PATH}/${id}`);
  }

  /**
   * Get user's portfolio
   */
  async getPortfolio(): Promise<Portfolio> {
    return apiClient.get(`${this.BASE_PATH}/portfolio`);
  }

  /**
   * Get user's investments list
   */
  async getInvestments(params?: {
    page?: number;
    limit?: number;
    status?: Investment['status'];
    projectId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    investments: Investment[];
    total: number;
    page: number;
    limit: number;
  }> {
    return apiClient.get(this.BASE_PATH, params);
  }

  /**
   * Get available profit claims
   */
  async getAvailableClaims(): Promise<ProfitClaim[]> {
    return apiClient.get(`${this.BASE_PATH}/claims/available`);
  }

  /**
   * Claim profit distribution
   */
  async claimProfit(claimId: string): Promise<ProfitClaim> {
    return apiClient.post(`${this.BASE_PATH}/claims/${claimId}/claim`);
  }

  /**
   * Get claim history
   */
  async getClaimHistory(params?: {
    page?: number;
    limit?: number;
    projectId?: string;
  }): Promise<{
    claims: ProfitClaim[];
    total: number;
    page: number;
    limit: number;
  }> {
    return apiClient.get(`${this.BASE_PATH}/claims/history`, params);
  }

  /**
   * Get investment analytics
   */
  async getInvestmentAnalytics(
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<{
    totalInvested: Array<{ date: string; amount: number }>;
    portfolioValue: Array<{ date: string; value: number }>;
    returns: Array<{ date: string; amount: number }>;
    topPerformingProjects: Array<{
      projectId: string;
      projectName: string;
      returns: number;
      returnPercentage: number;
    }>;
  }> {
    return apiClient.get(`${this.BASE_PATH}/analytics`, { period });
  }

  /**
   * Export investment data
   */
  async exportInvestmentData(
    format: 'csv' | 'pdf' | 'excel',
    params?: {
      dateFrom?: string;
      dateTo?: string;
      projectId?: string;
    }
  ): Promise<Blob> {
    const queryParams = new URLSearchParams({
      format,
      ...(params || {}),
    });

    const response = await fetch(
      `${apiClient.getBaseURL()}${this.BASE_PATH}/export?${queryParams}`,
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
   * Get investment tax documents
   */
  async getTaxDocuments(year: number): Promise<{
    documents: Array<{
      id: string;
      type: 'tax_certificate' | 'investment_summary' | 'profit_report';
      year: number;
      url: string;
      generatedAt: string;
    }>;
  }> {
    return apiClient.get(`${this.BASE_PATH}/tax-documents`, { year });
  }

  /**
   * Request tax document generation
   */
  async generateTaxDocument(
    year: number,
    type: 'tax_certificate' | 'investment_summary' | 'profit_report'
  ): Promise<{ success: boolean; documentId: string }> {
    return apiClient.post(`${this.BASE_PATH}/tax-documents/generate`, {
      year,
      type,
    });
  }
}

// Create singleton instance
export const investmentsService = new InvestmentsService();

// Export the class for potential custom instances
export { InvestmentsService };
