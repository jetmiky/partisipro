/**
 * Cross-Project Analytics and Portfolio Types
 * Enhanced types for comprehensive portfolio analytics and insights
 */

// Core Portfolio Metrics
export interface CrossProjectMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalInvested: number;
  totalCurrentValue: number;
  totalReturns: number;
  averageROI: number;
  portfolioDiversification: CategoryDistribution[];
  riskDistribution: RiskDistribution[];
  monthlyPerformance: MonthlyPerformance[];
  governanceParticipation: GovernanceMetrics;
}

// Portfolio Diversification by Category
export interface CategoryDistribution {
  category: string;
  count: number;
  investedAmount: number;
  currentValue: number;
  percentage: number;
  averageROI: number;
}

// Risk Distribution Analysis
export interface RiskDistribution {
  riskLevel: 'low' | 'medium' | 'high';
  count: number;
  investedAmount: number;
  currentValue: number;
  percentage: number;
  averageROI: number;
}

// Monthly Performance Tracking
export interface MonthlyPerformance {
  month: string;
  totalValue: number;
  returns: number;
  roi: number;
  newInvestments: number;
  claimedReturns: number;
}

// Governance Participation Metrics
export interface GovernanceMetrics {
  totalProposals: number;
  votedProposals: number;
  participationRate: number;
  votingPower: number;
  governanceRewards: number;
  crossProjectVotes: ProjectGovernanceParticipation[];
}

export interface ProjectGovernanceParticipation {
  projectId: string;
  projectName: string;
  totalProposals: number;
  votedProposals: number;
  votingPower: number;
  lastVoteDate: string;
  participationRate: number;
}

// Portfolio Comparison and Ranking
export interface PortfolioComparison {
  projectId: string;
  projectName: string;
  category: string;
  investedAmount: number;
  currentValue: number;
  roi: number;
  riskLevel: 'low' | 'medium' | 'high';
  duration: number;
  status: 'active' | 'completed' | 'claiming';
  lastUpdate: string;
  performanceRank: number;
  diversificationScore: number;
}

// Platform Benchmarks
export interface PlatformBenchmarks {
  averageROI: number;
  averageInvestmentSize: number;
  averageProjectDuration: number;
  topPerformingCategory: string;
  platformGrowthRate: number;
  userPerformancePercentile: number;
}

// Identity-Based Insights
export interface IdentityInsights {
  verificationLevel: 'basic' | 'advanced' | 'institutional';
  claimsCount: number;
  identityScore: number;
  accessibleProjects: number;
  restrictedProjects: number;
  identityBenefits: string[];
  upgradeRecommendations: string[];
  identityUtilization: {
    investmentVolume: number;
    governanceParticipation: number;
    platformEngagement: number;
  };
}

// Cross-Project Trends Analysis
export interface CrossProjectTrends {
  investmentTrend: 'increasing' | 'decreasing' | 'stable';
  returnsTrend: 'increasing' | 'decreasing' | 'stable';
  diversificationTrend: 'improving' | 'declining' | 'stable';
  riskTrend: 'increasing' | 'decreasing' | 'stable';
  governanceTrend: 'increasing' | 'decreasing' | 'stable';
  recommendations: TrendRecommendation[];
}

export interface TrendRecommendation {
  type: 'diversification' | 'governance' | 'performance' | 'risk_management';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionUrl?: string;
}

// Predictive Analytics
export interface PredictiveInsights {
  expectedReturns12Months: number;
  recommendedInvestments: string[];
  riskAdjustments: string[];
  optimizationScore: number;
}

// Enhanced Portfolio Analytics Container
export interface EnhancedPortfolioAnalytics {
  crossProjectMetrics: CrossProjectMetrics;
  portfolioComparison: PortfolioComparison[];
  platformBenchmarks: PlatformBenchmarks;
  identityInsights: IdentityInsights;
  trends: CrossProjectTrends;
  predictiveInsights: PredictiveInsights;
}

// Real-time Portfolio Updates
export interface PortfolioUpdate {
  timestamp: string;
  type: 'investment' | 'return' | 'governance' | 'market_change';
  projectId: string;
  projectName: string;
  impact: {
    valueChange: number;
    percentageChange: number;
    newROI: number;
  };
  description: string;
}

// Advanced Analytics Filters
export interface AnalyticsFilters {
  timeRange: '1M' | '3M' | '6M' | '1Y' | 'ALL';
  categories: string[];
  riskLevels: ('low' | 'medium' | 'high')[];
  projectStatus: ('active' | 'completed' | 'claiming')[];
  performanceMetric: 'roi' | 'absolute_return' | 'diversification_score';
  sortBy: 'performance' | 'investment_date' | 'project_name' | 'risk_level';
  sortOrder: 'asc' | 'desc';
}

// Export Summary for External Use
export interface PortfolioExportData {
  generatedAt: string;
  portfolioSummary: CrossProjectMetrics;
  detailedInvestments: PortfolioComparison[];
  performanceAnalysis: {
    monthlyData: MonthlyPerformance[];
    benchmarkComparison: PlatformBenchmarks;
    trendAnalysis: CrossProjectTrends;
  };
  identityProfile: IdentityInsights;
  governanceActivity: GovernanceMetrics;
  predictiveOutlook: PredictiveInsights;
}
