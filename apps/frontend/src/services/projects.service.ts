/**
 * Projects Service
 * Handles project-related API calls
 */

import { apiClient } from '../lib/api-client';

export interface Project {
  id: string;
  name: string;
  description: string;
  spvAddress: string;
  status: 'draft' | 'pending_approval' | 'active' | 'completed' | 'cancelled';
  totalSupply: number;
  tokenPrice: number;
  currency: 'IDR' | 'USD' | 'ETH';
  minimumInvestment: number;
  maximumInvestment: number;
  offeringStartDate: string;
  offeringEndDate: string;
  projectType: string;
  location: string;
  expectedReturn: number;
  riskLevel: 'low' | 'medium' | 'high';
  documents: ProjectDocument[];
  contracts: ProjectContracts;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface ProjectDocument {
  id: string;
  type:
    | 'prospectus'
    | 'financial_statement'
    | 'legal_document'
    | 'technical_report';
  name: string;
  url: string;
  uploadedAt: string;
}

export interface ProjectContracts {
  tokenAddress?: string;
  offeringAddress?: string;
  treasuryAddress?: string;
  governanceAddress?: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  totalSupply: number;
  tokenPrice: number;
  currency: 'IDR' | 'USD' | 'ETH';
  minimumInvestment: number;
  maximumInvestment: number;
  offeringStartDate: string;
  offeringEndDate: string;
  projectType: string;
  location: string;
  expectedReturn: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: Project['status'];
}

export interface ProjectMetrics {
  totalRaised: number;
  totalInvestors: number;
  tokensSold: number;
  tokensRemaining: number;
  fundingProgress: number;
  averageInvestment: number;
  recentTransactions: number;
}

export interface ProjectInvestment {
  id: string;
  projectId: string;
  investorId: string;
  investorAddress: string;
  amount: number;
  tokensReceived: number;
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  investedAt: string;
}

export interface ProjectsListResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class ProjectsService {
  private readonly BASE_PATH = '/api/projects';

  /**
   * Get all projects with filtering and pagination
   */
  async getProjects(params?: {
    page?: number;
    limit?: number;
    status?: Project['status'];
    projectType?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ProjectsListResponse> {
    return apiClient.get(this.BASE_PATH, params);
  }

  /**
   * Get project by ID
   */
  async getProject(id: string): Promise<Project> {
    return apiClient.get(`${this.BASE_PATH}/${id}`);
  }

  /**
   * Create new project (SPV only)
   */
  async createProject(request: CreateProjectRequest): Promise<Project> {
    // return apiClient.post(this.BASE_PATH, request);
    request;

    return new Promise(resolve => {
      setTimeout(
        () =>
          resolve({
            id: 'PROJECT-011',
            name: request.name,
            description: request.description,
            totalSupply: request.totalSupply,
            tokenPrice: request.tokenPrice,
            currency: request.currency,
            minimumInvestment: request.minimumInvestment,
            maximumInvestment: request.maximumInvestment,
            offeringStartDate: request.offeringStartDate,
            offeringEndDate: request.offeringEndDate,
            projectType: request.projectType,
            location: request.location,
            riskLevel: request.riskLevel,
            expectedReturn: request.expectedReturn,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'pending_approval',
            documents: [],
            spvAddress: '0x123',
            contracts: {
              tokenAddress: '0x123',
              offeringAddress: '0x123',
              treasuryAddress: '0x123',
              governanceAddress: '0x123',
            },
          }),
        1000
      );
    });
  }

  /**
   * Update project (SPV only)
   */
  async updateProject(
    id: string,
    request: UpdateProjectRequest
  ): Promise<Project> {
    return apiClient.patch(`${this.BASE_PATH}/${id}`, request);
  }

  /**
   * Delete project (SPV/Admin only)
   */
  async deleteProject(id: string): Promise<{ success: boolean }> {
    return apiClient.delete(`${this.BASE_PATH}/${id}`);
  }

  /**
   * Approve project (Admin only)
   */
  async approveProject(id: string, comments?: string): Promise<Project> {
    return apiClient.post(`${this.BASE_PATH}/${id}/approve`, { comments });
  }

  /**
   * Reject project (Admin only)
   */
  async rejectProject(id: string, reason: string): Promise<Project> {
    return apiClient.post(`${this.BASE_PATH}/${id}/reject`, { reason });
  }

  /**
   * Get project metrics
   */
  async getProjectMetrics(id: string): Promise<ProjectMetrics> {
    return apiClient.get(`${this.BASE_PATH}/${id}/metrics`);
  }

  /**
   * Get project investments
   */
  async getProjectInvestments(
    id: string,
    params?: {
      page?: number;
      limit?: number;
      status?: ProjectInvestment['status'];
    }
  ): Promise<{
    investments: ProjectInvestment[];
    total: number;
    page: number;
    limit: number;
  }> {
    return apiClient.get(`${this.BASE_PATH}/${id}/investments`, params);
  }

  /**
   * Upload project document
   */
  async uploadDocument(
    projectId: string,
    file: File,
    type: ProjectDocument['type']
  ): Promise<ProjectDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return apiClient.upload(
      `${this.BASE_PATH}/${projectId}/documents`,
      formData
    );
  }

  /**
   * Delete project document
   */
  async deleteDocument(
    projectId: string,
    documentId: string
  ): Promise<{ success: boolean }> {
    return apiClient.delete(
      `${this.BASE_PATH}/${projectId}/documents/${documentId}`
    );
  }

  /**
   * Get project documents
   */
  async getDocuments(projectId: string): Promise<ProjectDocument[]> {
    return apiClient.get(`${this.BASE_PATH}/${projectId}/documents`);
  }

  /**
   * Deploy project contracts (SPV only)
   */
  async deployContracts(
    projectId: string
  ): Promise<{ transactionHash: string }> {
    return apiClient.post(`${this.BASE_PATH}/${projectId}/deploy`);
  }

  /**
   * Get project contract addresses
   */
  async getContractAddresses(projectId: string): Promise<ProjectContracts> {
    return apiClient.get(`${this.BASE_PATH}/${projectId}/contracts`);
  }

  /**
   * Start project offering (SPV only)
   */
  async startOffering(projectId: string): Promise<Project> {
    return apiClient.post(`${this.BASE_PATH}/${projectId}/start-offering`);
  }

  /**
   * End project offering (SPV only)
   */
  async endOffering(projectId: string): Promise<Project> {
    return apiClient.post(`${this.BASE_PATH}/${projectId}/end-offering`);
  }

  /**
   * Get similar projects
   */
  async getSimilarProjects(
    projectId: string,
    limit: number = 5
  ): Promise<Project[]> {
    return apiClient.get(`${this.BASE_PATH}/${projectId}/similar`, { limit });
  }

  /**
   * Get project analytics
   */
  async getProjectAnalytics(
    projectId: string,
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<{
    investments: Array<{ date: string; amount: number; count: number }>;
    topInvestors: Array<{
      address: string;
      totalInvestment: number;
      percentage: number;
    }>;
    geographicDistribution: Array<{
      country: string;
      count: number;
      percentage: number;
    }>;
    tokenDistribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
  }> {
    return apiClient.get(`${this.BASE_PATH}/${projectId}/analytics`, {
      period,
    });
  }

  /**
   * Search projects
   */
  async searchProjects(
    query: string,
    filters?: {
      projectType?: string;
      riskLevel?: Project['riskLevel'];
      minReturn?: number;
      maxReturn?: number;
      minInvestment?: number;
      maxInvestment?: number;
    }
  ): Promise<Project[]> {
    const params = { q: query, ...filters };
    return apiClient.get(`${this.BASE_PATH}/search`, params);
  }

  /**
   * Get project categories/types
   */
  async getProjectTypes(): Promise<
    Array<{
      id: string;
      name: string;
      description: string;
      count: number;
    }>
  > {
    return apiClient.get(`${this.BASE_PATH}/types`);
  }

  /**
   * Get featured projects
   */
  async getFeaturedProjects(limit: number = 6): Promise<Project[]> {
    return apiClient.get(`${this.BASE_PATH}/featured`, { limit });
  }

  /**
   * Get trending projects
   */
  async getTrendingProjects(limit: number = 6): Promise<Project[]> {
    return apiClient.get(`${this.BASE_PATH}/trending`, { limit });
  }

  /**
   * Get recently completed projects
   */
  async getRecentlyCompleted(limit: number = 6): Promise<Project[]> {
    return apiClient.get(`${this.BASE_PATH}/completed`, { limit });
  }

  /**
   * Export project data
   */
  async exportProjectData(
    projectId: string,
    format: 'csv' | 'pdf' | 'excel'
  ): Promise<Blob> {
    const response = await fetch(
      `${apiClient.getBaseURL()}${this.BASE_PATH}/${projectId}/export?format=${format}`,
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
   * Get listing fee information for project creation
   */
  async getListingFee(projectData: {
    totalSupply: number;
    tokenPrice: number;
    currency: string;
  }): Promise<{
    amount: number;
    currency: 'IDR' | 'ETH';
    feePercentage: number;
    estimatedTotal: number;
    paymentMethods: string[];
  }> {
    projectData;

    // return apiClient.post(
    //   `${this.BASE_PATH}/listing-fee/calculate`,
    //   projectData
    // );

    return new Promise(resolve => {
      setTimeout(
        () =>
          resolve({
            amount: 5000000000,
            currency: 'IDR',
            feePercentage: 0.5,
            estimatedTotal: 1000,
            paymentMethods: ['BRI'],
          }),
        1000
      );
    });
  }

  /**
   * Process listing fee payment
   */
  async payListingFee(
    projectId: string,
    paymentData: {
      amount: number;
      currency: 'IDR' | 'ETH';
      paymentMethod: string;
      paymentReference?: string;
    }
  ): Promise<{
    paymentId: string;
    status: 'pending' | 'confirmed' | 'failed';
    transactionHash?: string;
    receipt?: unknown;
  }> {
    projectId;
    paymentData;

    // return apiClient.post(
    //   `${this.BASE_PATH}/${projectId}/listing-fee/pay`,
    //   paymentData
    // );

    return new Promise(resolve => {
      setTimeout(
        () =>
          resolve({
            paymentId: '001/LISTING-FEE/PARTISIPRO/2025',
            status: 'confirmed',
            transactionHash: '0x00123',
          }),
        1000
      );
    });
  }

  /**
   * Check listing fee payment status
   */
  async getListingFeeStatus(projectId: string): Promise<{
    paid: boolean;
    amount: number;
    currency: 'IDR' | 'ETH';
    paymentDate?: string;
    transactionHash?: string;
    status: 'pending' | 'confirmed' | 'failed';
  }> {
    return apiClient.get(`${this.BASE_PATH}/${projectId}/listing-fee/status`);
  }

  /**
   * Get listing fee payment history
   */
  async getListingFeeHistory(projectId: string): Promise<
    Array<{
      paymentId: string;
      amount: number;
      currency: 'IDR' | 'ETH';
      paymentMethod: string;
      status: 'pending' | 'confirmed' | 'failed';
      createdAt: string;
      transactionHash?: string;
    }>
  > {
    return apiClient.get(`${this.BASE_PATH}/${projectId}/listing-fee/history`);
  }
}

// Create singleton instance
export const projectsService = new ProjectsService();

// Export the class for potential custom instances
export { ProjectsService };
