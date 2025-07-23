/**
 * Admin Service
 * Handles admin-related API calls for SPV management, platform oversight, and compliance
 */

import { apiClient } from '../lib/api-client';

export interface PlatformStats {
  totalProjects: number;
  totalUsers: number;
  totalFundingVolume: number;
  platformRevenue: number;
  monthlyGrowth: {
    projects: number;
    users: number;
    funding: number;
    revenue: number;
  };
}

export interface SystemHealth {
  activeProjects: number;
  pendingApprovals: number;
  systemUptime: number;
  transactionVolume24h: number;
}

export interface RecentActivity {
  id: string;
  type:
    | 'spv_registration'
    | 'project_launch'
    | 'large_investment'
    | 'user_signup'
    | 'system_alert';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  user?: string;
  project?: string;
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
  estimatedProjectValue: number;
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

export interface SPVStats {
  pendingApplications: number;
  approvedSPVs: number;
  totalProjectsCreated: number;
  totalFundingFacilitated: number;
}

export interface PlatformConfiguration {
  id: string;
  category: 'fees' | 'limits' | 'kyc' | 'blockchain' | 'payments' | 'system';
  key: string;
  value: unknown;
  description: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateFeesRequest {
  listingFeePercentage?: number;
  managementFeePercentage?: number;
  transactionFee?: number;
  minimumInvestment?: number;
  maximumInvestment?: number;
}

export interface WhitelistSPVRequest {
  spvAddress: string;
  companyName: string;
  registrationNumber: string;
  contactEmail: string;
  contactPhone: string;
  notes?: string;
}

export interface ReviewSPVRequest {
  applicationId: string;
  action: 'approve' | 'reject';
  reviewNotes?: string;
}

export interface MaintenanceModeRequest {
  enabled: boolean;
  message?: string;
  estimatedEndTime?: string;
  reason?: string;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  listingFees: number;
  managementFees: number;
  transactionFees: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
}

export interface UserManagementData {
  id: string;
  email: string;
  role: 'investor' | 'spv' | 'admin';
  kycStatus: 'pending' | 'approved' | 'rejected';
  totalInvestments?: number;
  totalInvestedAmount?: number;
  totalProjects?: number;
  totalFundsRaised?: number;
  joinedAt: string;
  lastActive: string;
}

export interface IdentityRegistryStats {
  totalIdentities: number;
  verifiedIdentities: number;
  pendingVerifications: number;
  activeClaimsIssuers: number;
}

export interface ComplianceMetrics {
  kycApprovalRate: number;
  averageKycTime: number;
  complianceIssues: number;
  auditTrailEvents: number;
}

export interface InitializePlatformRequest {
  adminEmail: string;
  adminWalletAddress: string;
  platformName?: string;
  defaultConfiguration?: {
    listingFeePercentage?: number;
    managementFeePercentage?: number;
    minimumInvestment?: number;
    maximumInvestment?: number;
  };
}

export interface InitializePlatformResponse {
  success: boolean;
  message: string;
  adminUser: {
    id: string;
    email: string;
    walletAddress: string;
    role: 'admin';
  };
  platformConfiguration: PlatformConfiguration[];
}

class AdminService {
  private readonly BASE_PATH = '/api/admin';

  /**
   * Initialize platform with first admin user
   */
  async initializePlatform(
    request: InitializePlatformRequest
  ): Promise<InitializePlatformResponse> {
    return apiClient.post(
      `${this.BASE_PATH}/initialization/initialize`,
      request
    );
  }

  /**
   * Get platform dashboard statistics
   */
  async getPlatformStats(): Promise<PlatformStats> {
    return apiClient.get(`${this.BASE_PATH}/stats`);
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth(): Promise<SystemHealth> {
    return apiClient.get(`${this.BASE_PATH}/health`);
  }

  /**
   * Get recent platform activity
   */
  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    return apiClient.get(`${this.BASE_PATH}/activity`, { limit });
  }

  /**
   * Get SPV applications (pending/under review)
   */
  async getSPVApplications(params?: {
    status?: SPVApplication['status'];
    limit?: number;
    offset?: number;
  }): Promise<{
    applications: SPVApplication[];
    total: number;
  }> {
    return apiClient.get(`${this.BASE_PATH}/spv/applications`, params);
  }

  /**
   * Get approved SPVs
   */
  async getApprovedSPVs(params?: {
    status?: ApprovedSPV['status'];
    limit?: number;
    offset?: number;
  }): Promise<{
    spvs: ApprovedSPV[];
    total: number;
  }> {
    return apiClient.get(`${this.BASE_PATH}/spv/approved`, params);
  }

  /**
   * Get SPV statistics
   */
  async getSPVStats(): Promise<SPVStats> {
    return apiClient.get(`${this.BASE_PATH}/spv/stats`);
  }

  /**
   * Review SPV application (approve/reject)
   */
  async reviewSPVApplication(
    request: ReviewSPVRequest
  ): Promise<SPVApplication> {
    return apiClient.post(`${this.BASE_PATH}/spv/review`, request);
  }

  /**
   * Suspend SPV
   */
  async suspendSPV(spvId: string, reason?: string): Promise<ApprovedSPV> {
    return apiClient.post(`${this.BASE_PATH}/spv/${spvId}/suspend`, { reason });
  }

  /**
   * Activate SPV
   */
  async activateSPV(spvId: string): Promise<ApprovedSPV> {
    return apiClient.post(`${this.BASE_PATH}/spv/${spvId}/activate`);
  }

  /**
   * Whitelist SPV address
   */
  async whitelistSPV(request: WhitelistSPVRequest): Promise<ApprovedSPV> {
    return apiClient.post(`${this.BASE_PATH}/spv/whitelist`, request);
  }

  /**
   * Remove SPV from whitelist
   */
  async removeFromWhitelist(spvAddress: string): Promise<{ success: boolean }> {
    return apiClient.delete(`${this.BASE_PATH}/spv/whitelist/${spvAddress}`);
  }

  /**
   * Get platform configurations
   */
  async getPlatformConfigurations(): Promise<PlatformConfiguration[]> {
    return apiClient.get(`${this.BASE_PATH}/config`);
  }

  /**
   * Update platform fees
   */
  async updatePlatformFees(
    request: UpdateFeesRequest
  ): Promise<PlatformConfiguration[]> {
    return apiClient.put(`${this.BASE_PATH}/config/fees`, request);
  }

  /**
   * Set maintenance mode
   */
  async setMaintenanceMode(
    request: MaintenanceModeRequest
  ): Promise<PlatformConfiguration> {
    return apiClient.post(`${this.BASE_PATH}/maintenance`, request);
  }

  /**
   * Get maintenance mode status
   */
  async getMaintenanceMode(): Promise<{
    enabled: boolean;
    message?: string;
    estimatedEndTime?: string;
    reason?: string;
  }> {
    return apiClient.get(`${this.BASE_PATH}/maintenance`);
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(): Promise<RevenueAnalytics> {
    return apiClient.get(`${this.BASE_PATH}/revenue`);
  }

  /**
   * Get user management data
   */
  async getUserManagementData(params?: {
    role?: UserManagementData['role'];
    kycStatus?: UserManagementData['kycStatus'];
    limit?: number;
    offset?: number;
  }): Promise<{
    users: UserManagementData[];
    total: number;
  }> {
    return apiClient.get(`${this.BASE_PATH}/users`, params);
  }

  /**
   * Get identity registry statistics
   */
  async getIdentityRegistryStats(): Promise<IdentityRegistryStats> {
    return apiClient.get(`${this.BASE_PATH}/identity/stats`);
  }

  /**
   * Get compliance metrics
   */
  async getComplianceMetrics(): Promise<ComplianceMetrics> {
    return apiClient.get(`${this.BASE_PATH}/compliance/metrics`);
  }

  /**
   * Get platform audit trail
   */
  async getAuditTrail(params?: {
    startDate?: string;
    endDate?: string;
    action?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    events: Array<{
      id: string;
      action: string;
      userId: string;
      userEmail: string;
      timestamp: string;
      details: Record<string, unknown>;
      ipAddress: string;
      userAgent: string;
    }>;
    total: number;
  }> {
    return apiClient.get(`${this.BASE_PATH}/audit`, params);
  }

  /**
   * Get project oversight data
   */
  async getProjectOversight(params?: {
    status?: string;
    spvId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    projects: Array<{
      id: string;
      name: string;
      spvName: string;
      status: string;
      totalFunding: number;
      investorCount: number;
      complianceScore: number;
      lastActivity: string;
      riskLevel: 'low' | 'medium' | 'high';
    }>;
    total: number;
  }> {
    return apiClient.get(`${this.BASE_PATH}/projects/oversight`, params);
  }

  /**
   * Get platform performance metrics
   */
  async getPerformanceMetrics(): Promise<{
    responseTime: number;
    uptime: number;
    errorRate: number;
    activeUsers: number;
    transactionThroughput: number;
    databasePerformance: number;
  }> {
    return apiClient.get(`${this.BASE_PATH}/performance`);
  }

  /**
   * Export platform data
   */
  async exportPlatformData(
    type: 'users' | 'projects' | 'investments' | 'revenue' | 'audit',
    format: 'csv' | 'pdf' | 'excel',
    params?: {
      startDate?: string;
      endDate?: string;
      filters?: Record<string, unknown>;
    }
  ): Promise<Blob> {
    const response = await fetch(
      `${apiClient.getBaseURL()}${this.BASE_PATH}/export/${type}?format=${format}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiClient.getAuthToken()}`,
        },
        body: JSON.stringify(params || {}),
      }
    );

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }
}

// Create singleton instance
export const adminService = new AdminService();

// Export the class for potential custom instances
export { AdminService };
