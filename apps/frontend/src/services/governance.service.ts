/**
 * Governance Service
 * Handles governance-related API calls and voting functionality
 */

import { apiClient } from '../lib/api-client';

export interface GovernanceProposal {
  id: string;
  projectId: string;
  title: string;
  description: string;
  proposer: string;
  proposerName?: string;
  status:
    | 'pending'
    | 'active'
    | 'passed'
    | 'rejected'
    | 'executed'
    | 'cancelled';
  type:
    | 'revenue_distribution'
    | 'investment_decision'
    | 'operational_change'
    | 'governance_change'
    | 'other';
  category: 'financial' | 'investment' | 'operations' | 'governance' | 'other';
  priority: 'high' | 'medium' | 'low';
  votingPeriod: {
    start: string;
    end: string;
    duration: number; // in hours
  };
  votes: {
    for: number;
    against: number;
    abstain: number;
    total: number;
  };
  quorum: {
    required: number;
    current: number;
    percentage: number;
    met: boolean;
  };
  tokenSupply: {
    total: number;
    eligible: number; // Only verified token holders
  };
  userVote?: {
    choice: 'for' | 'against' | 'abstain';
    votingPower: number;
    timestamp: string;
    transactionHash?: string;
  };
  execution?: {
    executable: boolean;
    executedAt?: string;
    executedBy?: string;
    transactionHash?: string;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    tags: string[];
    attachments?: {
      id: string;
      name: string;
      url: string;
      type: string;
    }[];
  };
}

export interface CreateProposalRequest {
  projectId: string;
  title: string;
  description: string;
  type: GovernanceProposal['type'];
  category: GovernanceProposal['category'];
  priority: GovernanceProposal['priority'];
  votingDuration: number; // in hours
  tags?: string[];
  attachments?: File[];
}

export interface VoteRequest {
  proposalId: string;
  choice: 'for' | 'against' | 'abstain';
  reason?: string;
}

export interface VotingPower {
  projectId: string;
  projectName: string;
  totalTokens: number;
  votingPower: number;
  percentage: number;
  lastUpdate: string;
}

export interface GovernanceStats {
  totalProposals: number;
  activeProposals: number;
  userParticipation: {
    totalVotes: number;
    proposalsVoted: number;
    participationRate: number;
  };
  platformStats: {
    averageParticipation: number;
    totalVoters: number;
    proposalsExecuted: number;
  };
}

export interface ProposalVoters {
  voters: {
    address: string;
    name?: string;
    choice: 'for' | 'against' | 'abstain';
    votingPower: number;
    percentage: number;
    timestamp: string;
  }[];
  totalVoters: number;
  breakdown: {
    for: { count: number; power: number };
    against: { count: number; power: number };
    abstain: { count: number; power: number };
  };
}

export interface GovernanceActivity {
  id: string;
  type:
    | 'proposal_created'
    | 'vote_cast'
    | 'proposal_executed'
    | 'quorum_reached';
  proposalId: string;
  proposalTitle: string;
  projectId: string;
  projectName: string;
  actor: {
    address: string;
    name?: string;
  };
  details: Record<string, unknown>;
  timestamp: string;
}

class GovernanceService {
  private readonly BASE_PATH = '/api/governance';

  /**
   * Get all governance proposals with filtering
   */
  async getProposals(params?: {
    page?: number;
    limit?: number;
    status?: GovernanceProposal['status'];
    projectId?: string;
    category?: GovernanceProposal['category'];
    type?: GovernanceProposal['type'];
    search?: string;
    sortBy?: 'created' | 'votes' | 'ending';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    proposals: GovernanceProposal[];
    total: number;
    page: number;
    limit: number;
  }> {
    return apiClient.get(this.BASE_PATH, params);
  }

  /**
   * Get proposal by ID
   */
  async getProposal(id: string): Promise<GovernanceProposal> {
    return apiClient.get(`${this.BASE_PATH}/${id}`);
  }

  /**
   * Create new governance proposal (Token holders only)
   */
  async createProposal(
    request: CreateProposalRequest
  ): Promise<GovernanceProposal> {
    const formData = new FormData();

    // Add basic fields
    Object.entries(request).forEach(([key, value]) => {
      if (key !== 'attachments' && value !== undefined) {
        formData.append(
          key,
          typeof value === 'object' ? JSON.stringify(value) : String(value)
        );
      }
    });

    // Add attachments
    if (request.attachments) {
      request.attachments.forEach(file => {
        formData.append(`attachments`, file);
      });
    }

    return apiClient.upload(this.BASE_PATH, formData);
  }

  /**
   * Vote on a proposal
   */
  async vote(request: VoteRequest): Promise<{
    success: boolean;
    transactionHash: string;
    votingPower: number;
  }> {
    return apiClient.post(`${this.BASE_PATH}/${request.proposalId}/vote`, {
      choice: request.choice,
      reason: request.reason,
    });
  }

  /**
   * Get user's voting power across projects
   */
  async getVotingPower(): Promise<VotingPower[]> {
    return apiClient.get(`${this.BASE_PATH}/voting-power`);
  }

  /**
   * Get user's governance statistics
   */
  async getGovernanceStats(): Promise<GovernanceStats> {
    return apiClient.get(`${this.BASE_PATH}/stats`);
  }

  /**
   * Get proposal voters and voting breakdown
   */
  async getProposalVoters(proposalId: string): Promise<ProposalVoters> {
    return apiClient.get(`${this.BASE_PATH}/${proposalId}/voters`);
  }

  /**
   * Execute a passed proposal (Authorized users only)
   */
  async executeProposal(proposalId: string): Promise<{
    success: boolean;
    transactionHash: string;
  }> {
    return apiClient.post(`${this.BASE_PATH}/${proposalId}/execute`);
  }

  /**
   * Cancel a pending proposal (Proposer only)
   */
  async cancelProposal(
    proposalId: string,
    reason: string
  ): Promise<{
    success: boolean;
  }> {
    return apiClient.post(`${this.BASE_PATH}/${proposalId}/cancel`, { reason });
  }

  /**
   * Get governance activity feed
   */
  async getActivity(params?: {
    page?: number;
    limit?: number;
    projectId?: string;
    types?: GovernanceActivity['type'][];
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{
    activities: GovernanceActivity[];
    total: number;
    page: number;
    limit: number;
  }> {
    return apiClient.get(`${this.BASE_PATH}/activity`, params);
  }

  /**
   * Get user's governance notifications
   */
  async getNotifications(): Promise<{
    notifications: {
      id: string;
      type:
        | 'proposal_created'
        | 'voting_reminder'
        | 'quorum_reached'
        | 'proposal_executed';
      proposalId: string;
      proposalTitle: string;
      message: string;
      read: boolean;
      createdAt: string;
    }[];
    unreadCount: number;
  }> {
    return apiClient.get(`${this.BASE_PATH}/notifications`);
  }

  /**
   * Mark notifications as read
   */
  async markNotificationsRead(notificationIds: string[]): Promise<{
    success: boolean;
  }> {
    return apiClient.patch(`${this.BASE_PATH}/notifications/read`, {
      notificationIds,
    });
  }

  /**
   * Delegate voting power (Advanced feature)
   */
  async delegateVotingPower(
    projectId: string,
    delegateAddress: string,
    percentage: number
  ): Promise<{
    success: boolean;
    transactionHash: string;
  }> {
    return apiClient.post(`${this.BASE_PATH}/delegate`, {
      projectId,
      delegateAddress,
      percentage,
    });
  }

  /**
   * Get delegation information
   */
  async getDelegations(): Promise<{
    outgoing: {
      projectId: string;
      projectName: string;
      delegateAddress: string;
      delegateName?: string;
      percentage: number;
      createdAt: string;
    }[];
    incoming: {
      projectId: string;
      projectName: string;
      delegatorAddress: string;
      delegatorName?: string;
      percentage: number;
      votingPower: number;
      createdAt: string;
    }[];
  }> {
    return apiClient.get(`${this.BASE_PATH}/delegations`);
  }

  /**
   * Get proposal analytics
   */
  async getProposalAnalytics(proposalId: string): Promise<{
    timeline: Array<{
      timestamp: string;
      votes: { for: number; against: number; abstain: number };
      participation: number;
    }>;
    demographics: {
      voterTypes: Array<{ type: string; count: number; percentage: number }>;
      votingPowerDistribution: Array<{
        range: string;
        count: number;
        power: number;
      }>;
      geographicDistribution: Array<{
        region: string;
        count: number;
        percentage: number;
      }>;
    };
    predictions: {
      estimatedOutcome: 'pass' | 'fail' | 'uncertain';
      confidence: number;
      timeToQuorum?: number;
    };
  }> {
    return apiClient.get(`${this.BASE_PATH}/${proposalId}/analytics`);
  }

  /**
   * Export governance data
   */
  async exportGovernanceData(
    format: 'csv' | 'pdf' | 'excel',
    params?: {
      projectId?: string;
      dateFrom?: string;
      dateTo?: string;
      includeVotes?: boolean;
      includeProposals?: boolean;
    }
  ): Promise<Blob> {
    const queryParamsObj: Record<string, string> = { format };
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParamsObj[key] = String(value);
        }
      });
    }
    const queryParams = new URLSearchParams(queryParamsObj);

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
}

// Create singleton instance
export const governanceService = new GovernanceService();

// Export the class for potential custom instances
export { GovernanceService };
