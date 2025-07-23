/**
 * Mock API Client for Presentation Mode
 * Simulates realistic network delays and API responses for demos
 */

import {
  MOCK_PROJECTS,
  MOCK_GOVERNANCE_PROPOSALS,
  PRESENTATION_USER,
  getMockProjectById,
  getMockInvestmentsByUserId,
  getMockProposalsByProjectId,
  calculatePortfolioSummary,
  type MockUser,
  type MockProject,
  type MockInvestment,
  type MockGovernanceProposal,
} from './mock-data';

// Simulate network delays for realistic UX
const delay = (ms: number = 800) =>
  new Promise(resolve => setTimeout(resolve, ms));

// Mock API responses with realistic structure
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

interface LoginResponse {
  user: MockUser;
  accessToken: string;
  refreshToken: string;
}

class MockApiClient {
  private currentUser: MockUser = PRESENTATION_USER;
  private isAuthenticated: boolean = true; // Always authenticated in presentation mode

  // Authentication endpoints
  async login(
    _credentials: Record<string, unknown>
  ): Promise<ApiResponse<LoginResponse>> {
    await delay(1200); // Longer delay for auth

    return {
      success: true,
      data: {
        user: this.currentUser,
        accessToken: 'mock-jwt-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
      },
    };
  }

  async refreshToken(): Promise<ApiResponse<{ accessToken: string }>> {
    await delay(600);
    return {
      success: true,
      data: {
        accessToken: 'mock-jwt-token-refreshed-' + Date.now(),
      },
    };
  }

  async logout(): Promise<ApiResponse<null>> {
    await delay(400);
    this.isAuthenticated = false;
    return {
      success: true,
      data: null,
    };
  }

  async checkAuthStatus(): Promise<
    ApiResponse<{ authenticated: boolean; user: MockUser | null }>
  > {
    await delay(500);
    return {
      success: true,
      data: {
        authenticated: this.isAuthenticated,
        user: this.isAuthenticated ? this.currentUser : null,
      },
    };
  }

  // User management
  async updateProfile(
    updates: Partial<MockUser>
  ): Promise<ApiResponse<MockUser>> {
    await delay(1000);
    this.currentUser = { ...this.currentUser, ...updates };
    return {
      success: true,
      data: this.currentUser,
    };
  }

  async getUserProfile(): Promise<ApiResponse<MockUser>> {
    await delay(600);
    return {
      success: true,
      data: this.currentUser,
    };
  }

  // Project endpoints
  async getProjects(params?: {
    status?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<MockProject[]>> {
    await delay(900);

    let filteredProjects = [...MOCK_PROJECTS];

    if (params?.status) {
      filteredProjects = filteredProjects.filter(
        p => p.status === params.status
      );
    }

    if (params?.category) {
      filteredProjects = filteredProjects.filter(
        p => p.category === params.category
      );
    }

    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;
    const paginatedProjects = filteredProjects.slice(start, start + limit);

    return {
      success: true,
      data: paginatedProjects,
      pagination: {
        page,
        limit,
        total: filteredProjects.length,
        hasNext: start + limit < filteredProjects.length,
      },
    };
  }

  async getProject(id: string): Promise<ApiResponse<MockProject | null>> {
    await delay(750);
    const project = getMockProjectById(id);
    return {
      success: true,
      data: project || null,
    };
  }

  async createProject(
    projectData: Partial<MockProject>
  ): Promise<ApiResponse<MockProject>> {
    await delay(1500); // Longer delay for creation

    const newProject: MockProject = {
      id: 'new-project-' + Date.now(),
      name: projectData.name || 'New Project',
      shortName: projectData.shortName || 'New Project',
      description: projectData.description || '',
      longDescription: projectData.longDescription || '',
      category: projectData.category || 'Infrastructure',
      location: projectData.location || '',
      province: projectData.province || '',
      totalValue: projectData.totalValue || 0,
      tokenPrice: projectData.tokenPrice || 1000000,
      totalSupply: projectData.totalSupply || 0,
      availableSupply: projectData.availableSupply || 0,
      minimumInvestment: projectData.minimumInvestment || 5000000,
      expectedReturn: projectData.expectedReturn || 10,
      projectDuration: projectData.projectDuration || 20,
      status: 'draft',
      spvName: projectData.spvName || '',
      spvAddress: projectData.spvAddress || '',
      offeringStart: projectData.offeringStart || new Date().toISOString(),
      offeringEnd:
        projectData.offeringEnd ||
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      fundedPercentage: 0,
      investorCount: 0,
      images: [],
      documents: [],
      keyMetrics: {
        irr: projectData.expectedReturn || 10,
        paybackPeriod: 10,
        riskLevel: 'medium',
        governmentSupport: true,
      },
      milestones: [],
      profitDistributions: [],
      governance: {
        totalProposals: 0,
        activeProposals: 0,
        votingPower: 0,
      },
    };

    return {
      success: true,
      data: newProject,
    };
  }

  // Investment endpoints
  async getInvestments(params?: {
    userId?: string;
  }): Promise<ApiResponse<MockInvestment[]>> {
    await delay(800);
    const userId = params?.userId || this.currentUser.id;
    const investments = getMockInvestmentsByUserId(userId);

    return {
      success: true,
      data: investments,
    };
  }

  async createInvestment(investmentData: {
    projectId: string;
    amount: number;
    paymentMethod?: string;
  }): Promise<ApiResponse<MockInvestment>> {
    await delay(2000); // Longer delay for blockchain transaction simulation

    const project = getMockProjectById(investmentData.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const tokenAmount = Math.floor(investmentData.amount / project.tokenPrice);

    const newInvestment: MockInvestment = {
      id: 'inv-' + Date.now(),
      projectId: investmentData.projectId,
      investorId: this.currentUser.id,
      tokenAmount,
      investmentAmount: investmentData.amount,
      transactionHash: '0x' + Math.random().toString(16).substr(2, 40),
      timestamp: new Date().toISOString(),
      status: 'completed',
      claimableReturns: 0,
      totalReturns: 0,
    };

    return {
      success: true,
      data: newInvestment,
    };
  }

  // Portfolio endpoints
  async getPortfolioSummary(userId?: string): Promise<ApiResponse<any>> {
    await delay(700);
    const targetUserId = userId || this.currentUser.id;
    const summary = calculatePortfolioSummary(targetUserId);

    return {
      success: true,
      data: summary,
    };
  }

  async getPortfolioHistory(_userId?: string): Promise<ApiResponse<any[]>> {
    await delay(650);
    // Mock portfolio history data
    const history = [
      {
        date: '2025-01-22',
        totalValue: 132500000,
        dailyChange: 425000,
        dailyChangePercent: 0.32,
      },
      {
        date: '2025-01-21',
        totalValue: 132075000,
        dailyChange: -180000,
        dailyChangePercent: -0.14,
      },
      {
        date: '2025-01-20',
        totalValue: 132255000,
        dailyChange: 350000,
        dailyChangePercent: 0.27,
      },
      // ... more historical data
    ];

    return {
      success: true,
      data: history,
    };
  }

  // Profit distribution endpoints
  async getClaimableReturns(
    userId?: string
  ): Promise<ApiResponse<{ totalClaimable: number; distributions: any[] }>> {
    await delay(600);
    const targetUserId = userId || this.currentUser.id;
    const investments = getMockInvestmentsByUserId(targetUserId);
    const totalClaimable = investments.reduce(
      (sum, inv) => sum + inv.claimableReturns,
      0
    );

    const distributions = investments
      .filter(inv => inv.claimableReturns > 0)
      .map(inv => {
        const project = getMockProjectById(inv.projectId);
        return {
          investmentId: inv.id,
          projectName: project?.name || 'Unknown Project',
          amount: inv.claimableReturns,
          quarter: 'Q4 2024',
        };
      });

    return {
      success: true,
      data: {
        totalClaimable,
        distributions,
      },
    };
  }

  async claimReturns(
    investmentIds: string[]
  ): Promise<ApiResponse<{ totalClaimed: number }>> {
    await delay(1800); // Longer delay for blockchain transaction

    // Calculate total being claimed
    const investments = getMockInvestmentsByUserId(this.currentUser.id);
    let totalClaimed = 0;

    investments.forEach(inv => {
      if (investmentIds.includes(inv.id)) {
        totalClaimed += inv.claimableReturns;
        inv.claimableReturns = 0; // Mark as claimed
      }
    });

    return {
      success: true,
      data: {
        totalClaimed,
      },
    };
  }

  // Governance endpoints
  async getGovernanceProposals(
    projectId?: string
  ): Promise<ApiResponse<MockGovernanceProposal[]>> {
    await delay(700);

    let proposals = [...MOCK_GOVERNANCE_PROPOSALS];
    if (projectId) {
      proposals = getMockProposalsByProjectId(projectId);
    }

    return {
      success: true,
      data: proposals,
    };
  }

  async voteOnProposal(
    proposalId: string,
    vote: 'for' | 'against' | 'abstain'
  ): Promise<ApiResponse<{ success: boolean }>> {
    await delay(1500); // Blockchain transaction delay

    // Find and update the proposal (mock)
    const proposal = MOCK_GOVERNANCE_PROPOSALS.find(p => p.id === proposalId);
    if (proposal) {
      proposal.userVote = vote;

      // Simulate adding vote weight (assuming user has voting power)
      const voteWeight = 1000; // Mock voting power
      switch (vote) {
        case 'for':
          proposal.votesFor += voteWeight;
          break;
        case 'against':
          proposal.votesAgainst += voteWeight;
          break;
        case 'abstain':
          proposal.votesAbstain += voteWeight;
          break;
      }
    }

    return {
      success: true,
      data: { success: true },
    };
  }

  // KYC endpoints
  async getKYCStatus(): Promise<
    ApiResponse<{ status: string; documents: any[] }>
  > {
    await delay(600);
    return {
      success: true,
      data: {
        status: this.currentUser.kycStatus,
        documents: [
          {
            type: 'id_card',
            status: 'approved',
            uploadedAt: '2024-06-15T10:30:00Z',
          },
          {
            type: 'bank_statement',
            status: 'approved',
            uploadedAt: '2024-06-15T11:15:00Z',
          },
        ],
      },
    };
  }

  async initiateKYC(
    _provider: string
  ): Promise<ApiResponse<{ redirectUrl: string }>> {
    await delay(1000);
    return {
      success: true,
      data: {
        redirectUrl: `https://mock-kyc-provider.com/verify?token=mock-token-${Date.now()}`,
      },
    };
  }

  // Admin endpoints
  async getAdminStats(): Promise<ApiResponse<any>> {
    await delay(800);
    return {
      success: true,
      data: {
        totalProjects: MOCK_PROJECTS.length,
        activeProjects: MOCK_PROJECTS.filter(p => p.status === 'active').length,
        totalInvestors: 7845,
        totalValueLocked: 32500000000000, // IDR 32.5 trillion
        totalReturnsDistributed: 245000000000, // IDR 245 billion
        platformRevenue: 12250000000, // IDR 12.25 billion
        monthlyGrowth: 18.5,
      },
    };
  }

  async getRecentActivity(): Promise<ApiResponse<any[]>> {
    await delay(650);
    return {
      success: true,
      data: [
        {
          id: 1,
          type: 'investment',
          description: 'New investment in Jakarta MRT Extension',
          amount: 25000000,
          timestamp: '2025-01-22T09:45:00Z',
          user: 'investor-xyz',
        },
        {
          id: 2,
          type: 'project_created',
          description: 'New project: Yogyakarta BRT System',
          timestamp: '2025-01-22T08:30:00Z',
          user: 'spv-yogya',
        },
        {
          id: 3,
          type: 'governance_vote',
          description: 'Vote cast on MRT upgrade proposal',
          timestamp: '2025-01-22T07:15:00Z',
          user: 'investor-abc',
        },
      ],
    };
  }

  // WebSocket simulation (for real-time updates)
  simulateWebSocketConnection() {
    // This would normally establish a WebSocket connection
    // For presentation mode, we can simulate periodic updates
    // Mock WebSocket connection established - removing console.log for lint compliance

    // Simulate periodic portfolio updates
    setInterval(() => {
      // Emit mock portfolio update event
      const event = new CustomEvent('portfolio-update', {
        detail: {
          userId: this.currentUser.id,
          totalValue: 132500000 + Math.random() * 100000 - 50000, // Small random fluctuation
          dailyChange: Math.random() * 500000 - 250000,
        },
      });
      window.dispatchEvent(event);
    }, 30000); // Every 30 seconds
  }

  // Utility methods
  setCurrentUser(user: MockUser) {
    this.currentUser = user;
  }

  getCurrentUser(): MockUser {
    return this.currentUser;
  }

  switchUserRole(role: 'admin' | 'spv' | 'investor') {
    // Switch to different demo users based on role
    const usersByRole = {
      admin: {
        ...PRESENTATION_USER,
        role: 'admin' as const,
        name: 'Platform Administrator',
      },
      spv: {
        ...PRESENTATION_USER,
        role: 'spv' as const,
        name: 'Dr. Ahmad Susanto',
      },
      investor: PRESENTATION_USER,
    };

    this.currentUser = usersByRole[role];
    return this.currentUser;
  }
}

// Export singleton instance
export const mockApiClient = new MockApiClient();

// Export types for use in components
export type { ApiResponse, LoginResponse };
