export interface ProjectInfo {
  id: string;
  name: string;
  description: string;
  location: string;
  projectValue: bigint;
  concessionPeriod: number;
  expectedAPY: number;
  metadataURI: string;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum ProjectStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  OFFERING_ACTIVE = 'offering_active',
  OFFERING_COMPLETED = 'offering_completed',
  OPERATIONAL = 'operational',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface ProjectToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  maxSupply: bigint;
  transfersEnabled: boolean;
}

export interface ProjectOffering {
  address: string;
  tokenPrice: bigint;
  minInvestment: bigint;
  maxInvestment: bigint;
  softCap: bigint;
  hardCap: bigint;
  startTime: Date;
  endTime: Date;
  totalRaised: bigint;
  isActive: boolean;
}

export interface ProjectTreasury {
  address: string;
  totalBalance: bigint;
  availableForDistribution: bigint;
  lastDistributionTime: Date;
  distributionFrequency: number;
}

export interface ProjectDeployment {
  projectId: string;
  projectToken: string;
  offering: string;
  treasury: string;
  governance: string;
  creator: string;
  createdAt: Date;
  isActive: boolean;
}

export interface ProjectMetrics {
  totalInvestors: number;
  totalInvestment: bigint;
  currentAPY: number;
  totalDividendsPaid: bigint;
  performanceScore: number;
}
