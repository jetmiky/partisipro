/**
 * Presentation Mode Service Clients
 * Mock services that replace real API calls for demo purposes
 */

import { mockApiClient } from '../lib/mock-api-client';
import {
  getMockProjectById,
  getMockInvestmentsByUserId,
  type MockUser,
  type MockProject,
  type MockGovernanceProposal,
} from '../lib/mock-data';

// Simulate the original auth service structure
export class PresentationAuthService {
  async login(data: { idToken: string; walletAddress?: string }) {
    return mockApiClient.login(data);
  }

  async refreshToken(_data: { refreshToken: string }) {
    return mockApiClient.refreshToken();
  }

  async logout() {
    return mockApiClient.logout();
  }

  async checkAuthStatus() {
    return mockApiClient.checkAuthStatus();
  }

  async updateProfile(updates: Partial<MockUser>) {
    return mockApiClient.updateProfile(updates);
  }

  async setupMfa() {
    // Simulate MFA setup
    await new Promise(resolve => setTimeout(resolve, 1200));
    return {
      secret: 'PRESENTATION_MODE_MFA_SECRET',
      qrCode: 'data:image/png;base64,mock-qr-code',
      backupCodes: ['123456', '789012', '345678'],
    };
  }

  isAuthenticated(): boolean {
    // In presentation mode, always authenticated
    return true;
  }

  async autoRefreshToken(): Promise<boolean> {
    // In presentation mode, always succeed
    return true;
  }

  async verifyMfa(_data: { token: string; secret?: string }) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true };
  }

  async disableMfa(_token: string) {
    await new Promise(resolve => setTimeout(resolve, 600));
    return { success: true };
  }

  // Token management (presentation mode always has valid tokens)
  getAccessToken(): string | null {
    return 'presentation-mode-access-token';
  }

  getRefreshToken(): string | null {
    return 'presentation-mode-refresh-token';
  }

  setTokens(_accessToken: string, _refreshToken: string) {
    // No-op in presentation mode
  }

  clearTokens() {
    // No-op in presentation mode
  }

  initializeAuth() {
    // No-op in presentation mode
  }
}

// Projects service
export class PresentationProjectsService {
  async getProjects(params?: any) {
    return mockApiClient.getProjects(params);
  }

  async getProject(id: string) {
    return mockApiClient.getProject(id);
  }

  async createProject(projectData: Partial<MockProject>) {
    return mockApiClient.createProject(projectData);
  }

  async updateProject(_id: string, updates: Partial<MockProject>) {
    // Simulate update delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const project = getMockProjectById(_id);
    if (!project) {
      throw new Error('Project not found');
    }

    const updatedProject = { ...project, ...updates };

    return {
      success: true,
      data: updatedProject,
    };
  }

  async approveProject(_id: string) {
    // Simulate admin approval
    await new Promise(resolve => setTimeout(resolve, 1200));

    return {
      success: true,
      data: { approved: true },
    };
  }

  async getProjectAnalytics(_id: string) {
    await new Promise(resolve => setTimeout(resolve, 700));

    return {
      success: true,
      data: {
        totalRaised: 11500000000000, // IDR 11.5 trillion
        investorGrowth: [
          { month: 'Jan', investors: 3200 },
          { month: 'Feb', investors: 3850 },
          { month: 'Mar', investors: 4200 },
          { month: 'Current', investors: 4823 },
        ],
        performanceMetrics: {
          fundingVelocity: 76.7,
          investorSatisfaction: 4.7,
          complianceScore: 98.5,
        },
      },
    };
  }
}

// Investments service
export class PresentationInvestmentsService {
  async getInvestments(params?: any) {
    return mockApiClient.getInvestments(params);
  }

  async createInvestment(data: {
    projectId: string;
    amount: number;
    paymentMethod?: string;
  }) {
    return mockApiClient.createInvestment(data);
  }

  async getInvestmentHistory(userId?: string) {
    await new Promise(resolve => setTimeout(resolve, 650));

    const investments = getMockInvestmentsByUserId(userId || 'investor-rina');

    return {
      success: true,
      data: investments.map(inv => {
        const project = getMockProjectById(inv.projectId);
        return {
          ...inv,
          projectName: project?.name || 'Unknown Project',
          projectShortName: project?.shortName || 'Unknown',
        };
      }),
    };
  }

  async simulatePayment(data: { amount: number; method: string }) {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    return {
      success: true,
      data: {
        transactionId: 'pay_' + Date.now(),
        status: 'completed',
        amount: data.amount,
        method: data.method,
        processedAt: new Date().toISOString(),
      },
    };
  }
}

// Portfolio service
export class PresentationPortfolioService {
  async getPortfolioSummary(userId?: string) {
    return mockApiClient.getPortfolioSummary(userId);
  }

  async getPortfolioHistory(userId?: string) {
    return mockApiClient.getPortfolioHistory(userId);
  }

  async getPortfolioBreakdown(userId?: string) {
    await new Promise(resolve => setTimeout(resolve, 700));

    const investments = getMockInvestmentsByUserId(userId || 'investor-rina');

    const breakdown = investments.map(inv => {
      const project = getMockProjectById(inv.projectId);
      return {
        projectId: inv.projectId,
        projectName: project?.name || 'Unknown Project',
        investmentAmount: inv.investmentAmount,
        currentValue: inv.investmentAmount + inv.totalReturns,
        tokenAmount: inv.tokenAmount,
        roi:
          inv.investmentAmount > 0
            ? (inv.totalReturns / inv.investmentAmount) * 100
            : 0,
        status: inv.status,
      };
    });

    return {
      success: true,
      data: breakdown,
    };
  }

  async exportPortfolio(format: 'pdf' | 'csv' | 'excel') {
    // Simulate export processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      data: {
        downloadUrl: `/mock-exports/portfolio-${Date.now()}.${format}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    };
  }
}

// Governance service
export class PresentationGovernanceService {
  async getProposals(projectId?: string) {
    return mockApiClient.getGovernanceProposals(projectId);
  }

  async voteOnProposal(
    proposalId: string,
    vote: 'for' | 'against' | 'abstain'
  ) {
    return mockApiClient.voteOnProposal(proposalId, vote);
  }

  async createProposal(data: {
    projectId: string;
    title: string;
    description: string;
    votingDuration: number;
  }) {
    // Simulate proposal creation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newProposal: MockGovernanceProposal = {
      id: 'prop-' + Date.now(),
      projectId: data.projectId,
      title: data.title,
      description: data.description,
      proposer: mockApiClient.getCurrentUser().name,
      createdAt: new Date().toISOString(),
      votingStart: new Date().toISOString(),
      votingEnd: new Date(
        Date.now() + data.votingDuration * 24 * 60 * 60 * 1000
      ).toISOString(),
      status: 'active',
      votesFor: 0,
      votesAgainst: 0,
      votesAbstain: 0,
      totalVotingPower: 0,
      quorumReached: false,
    };

    return {
      success: true,
      data: newProposal,
    };
  }

  async getVotingPower(userId?: string, projectId?: string) {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock voting power calculation
    const investments = getMockInvestmentsByUserId(userId || 'investor-rina');
    const projectInvestment = projectId
      ? investments.find(inv => inv.projectId === projectId)
      : null;

    return {
      success: true,
      data: {
        votingPower: projectInvestment?.tokenAmount || 0,
        percentage: projectId ? 15.2 : 0, // Mock percentage
      },
    };
  }
}

// KYC service
export class PresentationKYCService {
  async getStatus() {
    return mockApiClient.getKYCStatus();
  }

  async initiate(provider: string) {
    return mockApiClient.initiateKYC(provider);
  }

  async uploadDocument(_file: File, _type: string) {
    // Simulate file upload
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      data: {
        documentId: 'doc_' + Date.now(),
        status: 'uploaded',
        uploadedAt: new Date().toISOString(),
      },
    };
  }

  async simulateKYCApproval() {
    // Simulate KYC processing time
    await new Promise(resolve => setTimeout(resolve, 3000));

    return {
      success: true,
      data: {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        documents: [
          { type: 'id_card', status: 'approved' },
          { type: 'bank_statement', status: 'approved' },
        ],
      },
    };
  }
}

// Identity service (ERC-3643)
export class PresentationIdentityService {
  async getIdentityStatus(_userId?: string) {
    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      success: true,
      data: {
        isVerified: true,
        claims: [
          {
            id: 'claim-1',
            type: 'KYC_APPROVED',
            issuer: 'Verihubs Indonesia',
            issuedAt: '2024-06-15T10:30:00Z',
            expiresAt: '2025-06-15T10:30:00Z',
            status: 'active',
          },
          {
            id: 'claim-2',
            type: 'ACCREDITED_INVESTOR',
            issuer: 'OJK Authorized Verifier',
            issuedAt: '2024-06-20T14:15:00Z',
            expiresAt: '2025-06-20T14:15:00Z',
            status: 'active',
          },
        ],
        verificationLevel: 'full',
      },
    };
  }

  async requestVerification(_data: { documentType: string; provider: string }) {
    await new Promise(resolve => setTimeout(resolve, 1800));

    return {
      success: true,
      data: {
        requestId: 'req_' + Date.now(),
        status: 'pending',
        estimatedTime: '24-48 hours',
      },
    };
  }

  async getClaims(_userId?: string) {
    await new Promise(resolve => setTimeout(resolve, 550));

    return {
      success: true,
      data: [
        {
          id: 'claim-1',
          type: 'KYC_APPROVED',
          issuer: 'Verihubs Indonesia',
          issuedAt: '2024-06-15T10:30:00Z',
          expiresAt: '2025-06-15T10:30:00Z',
          status: 'active',
          metadata: {
            verificationLevel: 'enhanced',
            documentTypes: ['national_id', 'bank_statement'],
          },
        },
      ],
    };
  }
}

// Admin service
export class PresentationAdminService {
  async getStats() {
    return mockApiClient.getAdminStats();
  }

  async getRecentActivity() {
    return mockApiClient.getRecentActivity();
  }

  async whitelistSPV(address: string, _details: any) {
    await new Promise(resolve => setTimeout(resolve, 1200));

    return {
      success: true,
      data: {
        address,
        whitelistedAt: new Date().toISOString(),
        status: 'active',
      },
    };
  }

  async updatePlatformFees(fees: any) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      data: {
        listingFee: fees.listingFee,
        managementFee: fees.managementFee,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  async getSystemHealth() {
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      success: true,
      data: {
        status: 'healthy',
        uptime: 99.97,
        services: {
          database: 'healthy',
          blockchain: 'healthy',
          websocket: 'healthy',
          kyc_providers: 'healthy',
        },
        metrics: {
          avgResponseTime: 245, // ms
          errorRate: 0.02, // %
          activeUsers: 1247,
        },
      },
    };
  }
}

// Export presentation mode services
export const presentationServices = {
  authService: new PresentationAuthService(),
  projectsService: new PresentationProjectsService(),
  investmentsService: new PresentationInvestmentsService(),
  portfolioService: new PresentationPortfolioService(),
  governanceService: new PresentationGovernanceService(),
  kycService: new PresentationKYCService(),
  identityService: new PresentationIdentityService(),
  adminService: new PresentationAdminService(),
};

// Helper function to check if presentation mode is enabled
export const isPresentationMode = (): boolean => {
  return (
    process.env.NEXT_PUBLIC_PRESENTATION_MODE === 'true' ||
    (typeof window !== 'undefined' &&
      window.location.search.includes('presentation=true'))
  );
};
