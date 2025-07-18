import {
  ProfileFormData,
  InvestorProfile,
  ProfileSubmissionResponse,
  ProfileAnalytics,
  RiskAssessmentResult,
  InvestmentRecommendation,
} from '@/types/profiling';
import { apiClient } from '@/lib/api-client';

class ProfilingService {
  private readonly baseUrl = '/api/profiling';

  /**
   * Submit investor profile data
   */
  async submitProfile(
    data: ProfileFormData
  ): Promise<ProfileSubmissionResponse> {
    const response = await apiClient.post<ProfileSubmissionResponse>(
      `${this.baseUrl}/submit`,
      data
    );

    return response;
  }

  /**
   * Get investor profile by user ID
   */
  async getProfile(userId: string): Promise<InvestorProfile> {
    const response = await apiClient.get<InvestorProfile>(
      `${this.baseUrl}/profile/${userId}`
    );

    return response;
  }

  /**
   * Update investor profile
   */
  async updateProfile(
    userId: string,
    data: Partial<ProfileFormData>
  ): Promise<ProfileSubmissionResponse> {
    const response = await apiClient.patch<ProfileSubmissionResponse>(
      `${this.baseUrl}/profile/${userId}`,
      data
    );

    return response;
  }

  /**
   * Get risk assessment for a profile
   */
  async getRiskAssessment(userId: string): Promise<RiskAssessmentResult> {
    const response = await apiClient.get<RiskAssessmentResult>(
      `${this.baseUrl}/risk-assessment/${userId}`
    );

    return response;
  }

  /**
   * Get investment recommendations
   */
  async getInvestmentRecommendations(
    userId: string
  ): Promise<InvestmentRecommendation[]> {
    const response = await apiClient.get<InvestmentRecommendation[]>(
      `${this.baseUrl}/recommendations/${userId}`
    );

    return response;
  }

  /**
   * Get profile analytics
   */
  async getProfileAnalytics(userId: string): Promise<ProfileAnalytics> {
    const response = await apiClient.get<ProfileAnalytics>(
      `${this.baseUrl}/analytics/${userId}`
    );

    return response;
  }

  /**
   * Check if profile is complete
   */
  async checkProfileCompletion(userId: string): Promise<boolean> {
    const response = await apiClient.get<{ completed: boolean }>(
      `${this.baseUrl}/completion/${userId}`
    );

    return response.completed;
  }

  /**
   * Delete investor profile
   */
  async deleteProfile(userId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/profile/${userId}`);
  }

  /**
   * Get profile statistics (for admin)
   */
  async getProfileStatistics(): Promise<{
    totalProfiles: number;
    completedProfiles: number;
    riskDistribution: Record<string, number>;
    popularInvestmentTypes: Record<string, number>;
  }> {
    const response = await apiClient.get(`${this.baseUrl}/admin/statistics`);

    return response;
  }

  /**
   * Export profile data (for compliance)
   */
  async exportProfileData(
    userId: string,
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<Blob> {
    const response = await apiClient.get(
      `${this.baseUrl}/export/${userId}?format=${format}`
    );

    return response;
  }

  /**
   * Bulk import profiles (for admin)
   */
  async bulkImportProfiles(
    file: File,
    format: 'csv' | 'json' = 'csv'
  ): Promise<{
    success: boolean;
    imported: number;
    failed: number;
    errors: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);

    const response = await apiClient.post(
      `${this.baseUrl}/admin/bulk-import`,
      formData
    );

    return response;
  }

  /**
   * Get profile completion funnel data
   */
  async getCompletionFunnel(): Promise<{
    started: number;
    section1Completed: number;
    section2Completed: number;
    fullyCompleted: number;
    conversionRate: number;
  }> {
    const response = await apiClient.get(
      `${this.baseUrl}/admin/completion-funnel`
    );

    return response;
  }

  /**
   * Generate profile report
   */
  async generateProfileReport(
    userId: string,
    includeRecommendations: boolean = true
  ): Promise<{
    profile: InvestorProfile;
    riskAssessment: RiskAssessmentResult;
    recommendations?: InvestmentRecommendation[];
    analytics: ProfileAnalytics;
  }> {
    const response = await apiClient.get(
      `${this.baseUrl}/report/${userId}?includeRecommendations=${includeRecommendations}`
    );

    return response;
  }

  /**
   * Mock implementation for development
   */
  async mockSubmitProfile(
    data: ProfileFormData
  ): Promise<ProfileSubmissionResponse> {
    data;
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock successful response
    return {
      success: true,
      message: 'Profil investor berhasil disimpan',
      profileId: `profile_${Date.now()}`,
      nextStep: '/kyc',
    };
  }

  /**
   * Mock get profile for development
   */
  async mockGetProfile(userId: string): Promise<InvestorProfile> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      id: `profile_${userId}`,
      userId,
      age: '26-35' as any,
      income: '10.1-20M' as any,
      experience: '1-3years' as any,
      knownInvestments: ['savings', 'stocks'] as any,
      investmentGoal: 'long_term_growth' as any,
      riskTolerance: 'moderate' as any,
      marketReaction: 'worry_wait' as any,
      holdingPeriod: '3-5years' as any,
      projectDetailImportance: 'important' as any,
      tokenTypes: ['debt_token', 'hybrid_token'] as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: new Date(),
    };
  }
}

export const profilingService = new ProfilingService();
