export enum ProfitDistributionStatus {
  CALCULATED = 'calculated',
  DISTRIBUTED = 'distributed',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ProfitClaimStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface ProfitDistribution {
  id: string;
  projectId: string;
  period: {
    startDate: Date;
    endDate: Date;
    quarter: number;
    year: number;
  };
  totalProfit: number;
  platformFee: number;
  distributedProfit: number;
  profitPerToken: number;
  status: ProfitDistributionStatus;
  transactionHash: string;
  createdAt: Date;
  distributedAt: Date;
  adminId: string;
  notes?: string;
}

export interface ProfitClaim {
  id: string;
  userId: string;
  projectId: string;
  distributionId: string;
  tokenAmount: number;
  claimableAmount: number;
  claimedAmount: number;
  status: ProfitClaimStatus;
  paymentDetails: {
    paymentId: string;
    bankAccount: string;
    processedAt: Date;
  };
  createdAt: Date;
  claimedAt: Date | null;
}
