'use client';

import { useState, useEffect } from 'react';
import { usePortfolioWebSocket } from '@/hooks/useWebSocket';
import Link from 'next/link';
import {
  TrendingUp,
  Plus,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  PieChart,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Search,
  Shield,
  CheckCircle,
  UserCheck,
  Award,
  BarChart3,
  Target,
  Lightbulb,
  AlertTriangle,
  Zap,
  Users,
  Activity,
  ChevronUp,
  ChevronDown,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui';
import { StatsCard } from '@/components/ui';
import { DashboardLayout } from '@/components/ui';
import { PortfolioChart } from '@/components/ui';
import { PortfolioExport } from '@/components/ui';
import { PortfolioUpdates } from '@/components/ui';
import {
  CrossProjectMetrics,
  PortfolioComparison,
  PlatformBenchmarks,
  IdentityInsights,
  CrossProjectTrends,
  EnhancedPortfolioAnalytics,
} from '@/types';

interface Portfolio {
  id: string;
  projectTitle: string;
  investmentAmount: number;
  currentValue: number;
  returnAmount: number;
  returnPercentage: number;
  status: 'active' | 'completed' | 'claiming';
  investmentDate: string;
  lastUpdate: string;
  nextPayment: string;
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface Transaction {
  id: string;
  type: 'investment' | 'return' | 'claim';
  projectTitle: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  transactionId: string;
}

const mockPortfolio: Portfolio[] = [
  {
    id: '1',
    projectTitle: 'Jakarta-Bandung High-Speed Rail Extension',
    investmentAmount: 5000000,
    currentValue: 5750000,
    returnAmount: 750000,
    returnPercentage: 15.0,
    status: 'active',
    investmentDate: '2024-01-15',
    lastUpdate: '2024-01-10',
    nextPayment: '2024-02-15',
    category: 'Transportation',
    riskLevel: 'medium',
  },
  {
    id: '2',
    projectTitle: 'Soekarno-Hatta Airport Terminal 4',
    investmentAmount: 3000000,
    currentValue: 3240000,
    returnAmount: 240000,
    returnPercentage: 8.0,
    status: 'active',
    investmentDate: '2023-11-20',
    lastUpdate: '2024-01-08',
    nextPayment: '2024-02-20',
    category: 'Transportation',
    riskLevel: 'low',
  },
  {
    id: '3',
    projectTitle: 'Bali Renewable Energy Plant',
    investmentAmount: 2000000,
    currentValue: 2280000,
    returnAmount: 280000,
    returnPercentage: 14.0,
    status: 'claiming',
    investmentDate: '2023-12-01',
    lastUpdate: '2024-01-05',
    nextPayment: '2024-02-01',
    category: 'Energy',
    riskLevel: 'medium',
  },
  {
    id: '4',
    projectTitle: 'Jakarta Smart Water Management',
    investmentAmount: 1500000,
    currentValue: 1665000,
    returnAmount: 165000,
    returnPercentage: 11.0,
    status: 'completed',
    investmentDate: '2023-08-15',
    lastUpdate: '2024-01-01',
    nextPayment: '-',
    category: 'Infrastructure',
    riskLevel: 'low',
  },
];

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'return',
    projectTitle: 'Jakarta-Bandung High-Speed Rail Extension',
    amount: 125000,
    date: '2024-01-10',
    status: 'completed',
    transactionId: 'TXN-001234567',
  },
  {
    id: '2',
    type: 'investment',
    projectTitle: 'Bali Renewable Energy Plant',
    amount: 2000000,
    date: '2023-12-01',
    status: 'completed',
    transactionId: 'TXN-001234566',
  },
  {
    id: '3',
    type: 'claim',
    projectTitle: 'Jakarta Smart Water Management',
    amount: 165000,
    date: '2024-01-01',
    status: 'pending',
    transactionId: 'TXN-001234565',
  },
  {
    id: '4',
    type: 'return',
    projectTitle: 'Soekarno-Hatta Airport Terminal 4',
    amount: 80000,
    date: '2023-12-20',
    status: 'completed',
    transactionId: 'TXN-001234564',
  },
];

export default function DashboardPage() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // WebSocket integration for real-time portfolio updates
  const { portfolioData, lastUpdate, isConnected } = usePortfolioWebSocket();
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'disconnected' | 'connecting'
  >('disconnected');

  useEffect(() => {
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
  }, [isConnected]);

  useEffect(() => {
    if (portfolioData) {
      // Real-time portfolio update received
      // Here we would update the portfolio state with real data
      // For now, we'll just skip logging since we're using mock data
    }
  }, [portfolioData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'claiming':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'claiming':
        return 'Claiming';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'investment':
        return <ArrowDownRight className="w-4 h-4 text-red-600" />;
      case 'return':
        return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case 'claim':
        return <DollarSign className="w-4 h-4 text-blue-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  // Calculate dashboard stats
  const totalInvested = mockPortfolio.reduce(
    (sum, item) => sum + item.investmentAmount,
    0
  );
  const totalCurrentValue = mockPortfolio.reduce(
    (sum, item) => sum + item.currentValue,
    0
  );
  const totalReturns = totalCurrentValue - totalInvested;
  const totalReturnPercentage = (totalReturns / totalInvested) * 100;
  const activeProjects = mockPortfolio.filter(
    p => p.status === 'active'
  ).length;
  const claimableAmount = mockPortfolio
    .filter(p => p.status === 'claiming')
    .reduce((sum, item) => sum + item.returnAmount, 0);

  const filteredPortfolio = mockPortfolio.filter(item => {
    const matchesStatus =
      filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch =
      item.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'insights', label: 'Cross-Project Insights' },
    { id: 'governance', label: 'Governance Tracking' },
  ];

  // Mock cross-project analytics data
  const mockCrossProjectMetrics: CrossProjectMetrics = {
    totalProjects: mockPortfolio.length,
    activeProjects: mockPortfolio.filter(p => p.status === 'active').length,
    completedProjects: mockPortfolio.filter(p => p.status === 'completed')
      .length,
    totalInvested,
    totalCurrentValue,
    totalReturns,
    averageROI: totalReturnPercentage,
    portfolioDiversification: [
      {
        category: 'transportation',
        count: 2,
        investedAmount: 8000000,
        currentValue: 8990000,
        percentage: 72.7,
        averageROI: 12.4,
      },
      {
        category: 'energy',
        count: 1,
        investedAmount: 2000000,
        currentValue: 2280000,
        percentage: 18.2,
        averageROI: 14.0,
      },
      {
        category: 'water',
        count: 1,
        investedAmount: 1500000,
        currentValue: 1665000,
        percentage: 13.6,
        averageROI: 11.0,
      },
    ],
    riskDistribution: [
      {
        riskLevel: 'low',
        count: 2,
        investedAmount: 4500000,
        currentValue: 4905000,
        percentage: 40.9,
        averageROI: 9.0,
      },
      {
        riskLevel: 'medium',
        count: 2,
        investedAmount: 7000000,
        currentValue: 8030000,
        percentage: 59.1,
        averageROI: 14.7,
      },
      {
        riskLevel: 'high',
        count: 0,
        investedAmount: 0,
        currentValue: 0,
        percentage: 0,
        averageROI: 0,
      },
    ],
    monthlyPerformance: [
      {
        month: '2024-01',
        totalValue: 12935000,
        returns: 1435000,
        roi: 12.5,
        newInvestments: 0,
        claimedReturns: 185000,
      },
      {
        month: '2023-12',
        totalValue: 11750000,
        returns: 1250000,
        roi: 11.9,
        newInvestments: 2000000,
        claimedReturns: 0,
      },
      {
        month: '2023-11',
        totalValue: 9500000,
        returns: 1000000,
        roi: 11.8,
        newInvestments: 3000000,
        claimedReturns: 80000,
      },
    ],
    governanceParticipation: {
      totalProposals: 12,
      votedProposals: 8,
      participationRate: 66.7,
      votingPower: 2.3,
      governanceRewards: 25000,
      crossProjectVotes: [
        {
          projectId: '1',
          projectName: 'Jakarta-Bandung High-Speed Rail Extension',
          totalProposals: 4,
          votedProposals: 3,
          votingPower: 1.2,
          lastVoteDate: '2024-01-08',
          participationRate: 75.0,
        },
        {
          projectId: '2',
          projectName: 'Soekarno-Hatta Airport Terminal 4',
          totalProposals: 3,
          votedProposals: 2,
          votingPower: 0.8,
          lastVoteDate: '2024-01-05',
          participationRate: 66.7,
        },
      ],
    },
  };

  const mockPortfolioComparison: PortfolioComparison[] = mockPortfolio.map(
    (project, index) => ({
      projectId: project.id,
      projectName: project.projectTitle,
      category: project.category.toLowerCase(),
      investedAmount: project.investmentAmount,
      currentValue: project.currentValue,
      roi: project.returnPercentage,
      riskLevel: project.riskLevel,
      duration: Math.floor(
        (new Date().getTime() - new Date(project.investmentDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      status: project.status,
      lastUpdate: project.lastUpdate,
      performanceRank: index + 1,
      diversificationScore: 75 + Math.random() * 20,
    })
  );

  const mockPlatformBenchmarks: PlatformBenchmarks = {
    averageROI: 11.8,
    averageInvestmentSize: 2875000,
    averageProjectDuration: 18,
    topPerformingCategory: 'energy',
    platformGrowthRate: 24.7,
    userPerformancePercentile: 78,
  };

  const mockIdentityInsights: IdentityInsights = {
    verificationLevel: 'advanced',
    claimsCount: 4,
    identityScore: 95,
    accessibleProjects: 156,
    restrictedProjects: 0,
    identityBenefits: [
      'One-time verification for all projects',
      'Instant investment approval',
      'Access to premium projects',
      'Enhanced governance participation',
    ],
    upgradeRecommendations: [
      'Consider institutional verification for higher investment limits',
    ],
    identityUtilization: {
      investmentVolume: 88,
      governanceParticipation: 67,
      platformEngagement: 82,
    },
  };

  const mockTrends: CrossProjectTrends = {
    investmentTrend: 'increasing',
    returnsTrend: 'increasing',
    diversificationTrend: 'improving',
    riskTrend: 'stable',
    governanceTrend: 'increasing',
    recommendations: [
      {
        type: 'diversification',
        priority: 'medium',
        title: 'Consider Energy Sector Expansion',
        description:
          'Your portfolio shows strong performance in energy. Consider increasing allocation.',
        actionUrl: '/marketplace?category=energy',
      },
      {
        type: 'governance',
        priority: 'high',
        title: 'Increase Governance Participation',
        description:
          'You have voting power in 2 projects with pending proposals.',
        actionUrl: '/governance',
      },
      {
        type: 'performance',
        priority: 'low',
        title: 'Portfolio Optimization Available',
        description: 'Consider rebalancing for improved risk-adjusted returns.',
      },
    ],
  };

  const mockEnhancedAnalytics: EnhancedPortfolioAnalytics = {
    crossProjectMetrics: mockCrossProjectMetrics,
    portfolioComparison: mockPortfolioComparison,
    platformBenchmarks: mockPlatformBenchmarks,
    identityInsights: mockIdentityInsights,
    trends: mockTrends,
    predictiveInsights: {
      expectedReturns12Months: 1650000,
      recommendedInvestments: [
        'Renewable Energy Portfolio',
        'Smart City Infrastructure',
      ],
      riskAdjustments: [
        'Consider low-risk telecommunications projects',
        'Diversify into water infrastructure',
      ],
      optimizationScore: 82,
    },
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Identity Status Section */}
      <Card className="p-6 border-green-200 bg-green-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Shield className="w-6 h-6 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                Identity Verification Status
              </h3>
              <p className="text-green-700">
                Your ERC-3643 identity is active and verified
              </p>
            </div>
          </div>
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <UserCheck className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-green-900">KYC Status</p>
              <p className="text-xs text-green-700">Verified</p>
            </div>
          </div>
          <div className="flex items-center">
            <Award className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-green-900">
                Active Claims
              </p>
              <p className="text-xs text-green-700">4 of 4 claims</p>
            </div>
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-green-900">
                Investment Eligible
              </p>
              <p className="text-xs text-green-700">All projects available</p>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-green-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-green-700">
              <span className="font-medium">Identity Benefits:</span> One-time
              verification, instant investment approval, automated profit
              distribution
            </p>
            <Link href="/identity">
              <Button
                variant="secondary"
                className="text-green-700 border-green-300 hover:bg-green-100 text-sm"
              >
                Manage Identity
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Invested"
          value={formatCurrency(totalInvested)}
          icon={<DollarSign className="w-5 h-5" />}
          changeType="increase"
          change={15.2}
        />
        <StatsCard
          title="Current Value"
          value={formatCurrency(totalCurrentValue)}
          icon={<TrendingUp className="w-5 h-5" />}
          changeType="increase"
          change={8.7}
        />
        <StatsCard
          title="Total Returns"
          value={formatCurrency(totalReturns)}
          icon={<ArrowUpRight className="w-5 h-5" />}
          changeType={totalReturns > 0 ? 'increase' : 'decrease'}
          change={totalReturnPercentage}
        />
        <StatsCard
          title="Active Projects"
          value={activeProjects.toString()}
          icon={<PieChart className="w-5 h-5" />}
          changeType="increase"
          change={2}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Quick Actions</h3>
            <Plus className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <Link href="/marketplace">
              <Button variant="primary" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Browse New Projects
              </Button>
            </Link>
            <Link href="/claim">
              <Button variant="secondary" className="w-full justify-start">
                <DollarSign className="w-4 h-4 mr-2" />
                Claim Returns ({formatCurrency(claimableAmount)})
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="secondary" className="w-full justify-start">
                <Eye className="w-4 h-4 mr-2" />
                View Profile
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              Portfolio Performance
            </h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">This Month</span>
              <span className="font-medium text-green-600">
                +{formatCurrency(185000)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">This Year</span>
              <span className="font-medium text-green-600">
                +{formatCurrency(totalReturns)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Return Rate</span>
              <span className="font-medium text-primary-600">
                {totalReturnPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Upcoming Payments</h3>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-3">
            {mockPortfolio
              .filter(p => p.status === 'active')
              .slice(0, 3)
              .map(project => (
                <div
                  key={project.id}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {project.projectTitle}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(project.nextPayment)}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(project.returnAmount / 12)}
                  </span>
                </div>
              ))}
          </div>
        </Card>
      </div>

      {/* Real-time Portfolio Updates */}
      <PortfolioUpdates />

      {/* Recent Activity */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          <Link href="/transactions">
            <Button variant="secondary" className="text-sm">
              View All
            </Button>
          </Link>
        </div>
        <div className="space-y-4">
          {mockTransactions.slice(0, 5).map(transaction => (
            <div
              key={transaction.id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    {transaction.type}
                  </p>
                  <p className="text-sm text-gray-500">
                    {transaction.projectTitle}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-medium ${
                    transaction.type === 'investment'
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {transaction.type === 'investment' ? '-' : '+'}
                  {formatCurrency(transaction.amount)}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDate(transaction.date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderPortfolio = () => (
    <div className="space-y-6">
      {/* Portfolio Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Investment Portfolio
          </h2>
          <p className="text-gray-600">
            Manage your investments and track performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="secondary" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="claiming">Claiming</option>
        </select>
        <Button variant="secondary" className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          More Filters
        </Button>
      </div>

      {/* Portfolio Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Your Investments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Returns
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPortfolio.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.projectTitle}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.category} • {item.riskLevel} risk
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(item.investmentAmount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(item.investmentDate)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(item.currentValue)}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p
                        className={`font-medium ${item.returnAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {formatCurrency(item.returnAmount)} (
                        {item.returnPercentage.toFixed(1)}%)
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.returnAmount >= 0 ? 'Profit' : 'Loss'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Link href={`/projects/${item.id}`}>
                        <Button variant="secondary" className="text-sm">
                          View
                        </Button>
                      </Link>
                      {item.status === 'claiming' && (
                        <Link href="/claim">
                          <Button variant="primary" className="text-sm">
                            Claim
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Transaction History
          </h2>
          <p className="text-gray-600">View all your investment transactions</p>
        </div>
        <Button variant="secondary" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">All Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockTransactions.map(transaction => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.type)}
                      <span className="capitalize font-medium text-gray-900">
                        {transaction.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-medium text-gray-900">
                      {transaction.projectTitle}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p
                      className={`font-medium ${
                        transaction.type === 'investment'
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {transaction.type === 'investment' ? '-' : '+'}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-gray-900">
                      {formatDate(transaction.date)}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}
                    >
                      {getStatusLabel(transaction.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-500 font-mono">
                      {transaction.transactionId}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
      case 'improving':
        return <ChevronUp className="w-4 h-4 text-green-600" />;
      case 'decreasing':
      case 'declining':
        return <ChevronDown className="w-4 h-4 text-red-600" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
      case 'improving':
        return 'text-green-600';
      case 'decreasing':
      case 'declining':
        return 'text-red-600';
      case 'stable':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Portfolio Analytics
          </h2>
          <p className="text-gray-600">
            Detailed insights into your investment performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Data
          </Button>
          <Button variant="secondary" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PortfolioChart
          data={mockCrossProjectMetrics.monthlyPerformance}
          type="performance"
          height={250}
          showTrend={true}
        />
        <PortfolioChart
          data={mockCrossProjectMetrics.monthlyPerformance}
          type="returns"
          height={250}
          showTrend={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Asset Allocation</h3>
          <div className="space-y-3">
            {mockCrossProjectMetrics.portfolioDiversification.map(item => (
              <div key={item.category}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-600 capitalize">
                    {item.category}
                  </span>
                  <div className="text-right">
                    <span className="font-medium">
                      {item.percentage.toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({item.averageROI.toFixed(1)}% ROI)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      item.category === 'transportation'
                        ? 'bg-blue-500'
                        : item.category === 'energy'
                          ? 'bg-green-500'
                          : 'bg-purple-500'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Risk Distribution
          </h3>
          <div className="space-y-3">
            {mockCrossProjectMetrics.riskDistribution.map(item => (
              <div key={item.riskLevel}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-600 capitalize">
                    {item.riskLevel} Risk
                  </span>
                  <div className="text-right">
                    <span className="font-medium">
                      {item.percentage.toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({item.averageROI.toFixed(1)}% ROI)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      item.riskLevel === 'low'
                        ? 'bg-green-500'
                        : item.riskLevel === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {totalReturnPercentage.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Total Return Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {mockCrossProjectMetrics.averageROI.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Average ROI</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {mockPlatformBenchmarks.userPerformancePercentile}th
            </div>
            <div className="text-sm text-gray-600">Performance Percentile</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {mockEnhancedAnalytics.predictiveInsights.optimizationScore}
            </div>
            <div className="text-sm text-gray-600">Optimization Score</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Monthly Performance Trend
          </h3>
          <div className="space-y-3">
            {mockCrossProjectMetrics.monthlyPerformance
              .slice()
              .reverse()
              .map(month => (
                <div
                  key={month.month}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(month.month).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      ROI: {month.roi.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      +{formatCurrency(month.returns)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Value: {formatCurrency(month.totalValue)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Platform Benchmarks
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Your ROI vs Platform Avg</span>
              <div className="text-right">
                <span className="font-medium text-green-600">
                  {totalReturnPercentage.toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  vs {mockPlatformBenchmarks.averageROI.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Investment Size vs Avg</span>
              <div className="text-right">
                <span className="font-medium text-blue-600">
                  {formatCurrency(totalInvested / mockPortfolio.length)}
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  vs{' '}
                  {formatCurrency(mockPlatformBenchmarks.averageInvestmentSize)}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Performance Percentile</span>
              <span className="font-medium text-primary-600">
                {mockPlatformBenchmarks.userPerformancePercentile}th percentile
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Top Category</span>
              <span className="font-medium text-purple-600 capitalize">
                {mockPlatformBenchmarks.topPerformingCategory}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderCrossProjectInsights = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Cross-Project Insights
          </h2>
          <p className="text-gray-600">
            Comprehensive analytics across your entire portfolio
          </p>
        </div>
        <Button variant="secondary" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Identity Insights */}
      <Card className="p-6 border-blue-200 bg-blue-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Shield className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                Identity Utilization Insights
              </h3>
              <p className="text-blue-700">
                Your ERC-3643 identity performance across the platform
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {mockIdentityInsights.identityScore}/100
            </div>
            <div className="text-sm text-blue-700">Identity Score</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-100 rounded-lg">
            <div className="text-lg font-bold text-blue-900">
              {mockIdentityInsights.identityUtilization.investmentVolume}%
            </div>
            <div className="text-sm text-blue-700">Investment Volume</div>
          </div>
          <div className="text-center p-3 bg-blue-100 rounded-lg">
            <div className="text-lg font-bold text-blue-900">
              {mockIdentityInsights.identityUtilization.governanceParticipation}
              %
            </div>
            <div className="text-sm text-blue-700">
              Governance Participation
            </div>
          </div>
          <div className="text-center p-3 bg-blue-100 rounded-lg">
            <div className="text-lg font-bold text-blue-900">
              {mockIdentityInsights.identityUtilization.platformEngagement}%
            </div>
            <div className="text-sm text-blue-700">Platform Engagement</div>
          </div>
        </div>

        <div className="border-t border-blue-200 pt-4">
          <h4 className="font-medium text-blue-900 mb-2">Active Benefits:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {mockIdentityInsights.identityBenefits.map((benefit, index) => (
              <div key={index} className="flex items-center text-blue-800">
                <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Portfolio Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Portfolio Trends Analysis
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 text-gray-600 mr-3" />
                <span className="text-gray-700">Investment Trend</span>
              </div>
              <div className="flex items-center">
                {getTrendIcon(mockTrends.investmentTrend)}
                <span
                  className={`ml-2 font-medium capitalize ${getTrendColor(mockTrends.investmentTrend)}`}
                >
                  {mockTrends.investmentTrend}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-gray-600 mr-3" />
                <span className="text-gray-700">Returns Trend</span>
              </div>
              <div className="flex items-center">
                {getTrendIcon(mockTrends.returnsTrend)}
                <span
                  className={`ml-2 font-medium capitalize ${getTrendColor(mockTrends.returnsTrend)}`}
                >
                  {mockTrends.returnsTrend}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <PieChart className="w-5 h-5 text-gray-600 mr-3" />
                <span className="text-gray-700">Diversification</span>
              </div>
              <div className="flex items-center">
                {getTrendIcon(mockTrends.diversificationTrend)}
                <span
                  className={`ml-2 font-medium capitalize ${getTrendColor(mockTrends.diversificationTrend)}`}
                >
                  {mockTrends.diversificationTrend}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Activity className="w-5 h-5 text-gray-600 mr-3" />
                <span className="text-gray-700">Governance Activity</span>
              </div>
              <div className="flex items-center">
                {getTrendIcon(mockTrends.governanceTrend)}
                <span
                  className={`ml-2 font-medium capitalize ${getTrendColor(mockTrends.governanceTrend)}`}
                >
                  {mockTrends.governanceTrend}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Project Performance Comparison
          </h3>
          <div className="space-y-3">
            {mockPortfolioComparison
              .sort((a, b) => b.roi - a.roi)
              .map((project, index) => (
                <div
                  key={project.projectId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        index === 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : index === 1
                            ? 'bg-gray-100 text-gray-800'
                            : index === 2
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <span className="text-sm font-bold">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {project.projectName.length > 25
                          ? `${project.projectName.slice(0, 25)}...`
                          : project.projectName}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {project.category} • {project.riskLevel} risk
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-medium ${
                        project.roi >= 12
                          ? 'text-green-600'
                          : project.roi >= 8
                            ? 'text-blue-600'
                            : 'text-gray-600'
                      }`}
                    >
                      {project.roi.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(project.currentValue)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <Lightbulb className="w-6 h-6 text-yellow-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">
            AI-Powered Recommendations
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockTrends.recommendations.map((recommendation, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg ${getPriorityColor(recommendation.priority)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                    recommendation.priority === 'high'
                      ? 'bg-red-200 text-red-800'
                      : recommendation.priority === 'medium'
                        ? 'bg-yellow-200 text-yellow-800'
                        : 'bg-green-200 text-green-800'
                  }`}
                >
                  {recommendation.priority} priority
                </span>
                <div
                  className={`p-1 rounded ${
                    recommendation.type === 'diversification'
                      ? 'bg-blue-100'
                      : recommendation.type === 'governance'
                        ? 'bg-purple-100'
                        : recommendation.type === 'performance'
                          ? 'bg-green-100'
                          : 'bg-gray-100'
                  }`}
                >
                  {recommendation.type === 'diversification' && (
                    <PieChart className="w-4 h-4 text-blue-600" />
                  )}
                  {recommendation.type === 'governance' && (
                    <Users className="w-4 h-4 text-purple-600" />
                  )}
                  {recommendation.type === 'performance' && (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  )}
                  {recommendation.type === 'risk_management' && (
                    <Shield className="w-4 h-4 text-orange-600" />
                  )}
                </div>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">
                {recommendation.title}
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                {recommendation.description}
              </p>
              {recommendation.actionUrl && (
                <Link href={recommendation.actionUrl}>
                  <Button variant="secondary" className="w-full text-sm">
                    Take Action
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Predictive Insights */}
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <Target className="w-6 h-6 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">
            12-Month Predictive Insights
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(
                mockEnhancedAnalytics.predictiveInsights.expectedReturns12Months
              )}
            </div>
            <div className="text-sm text-green-700">Expected Returns</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">
              {mockEnhancedAnalytics.predictiveInsights.optimizationScore}/100
            </div>
            <div className="text-sm text-blue-700">Optimization Score</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-xl font-bold text-purple-600">
              {
                mockEnhancedAnalytics.predictiveInsights.recommendedInvestments
                  .length
              }
            </div>
            <div className="text-sm text-purple-700">Recommended Projects</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-xl font-bold text-orange-600">
              {mockEnhancedAnalytics.predictiveInsights.riskAdjustments.length}
            </div>
            <div className="text-sm text-orange-700">Risk Adjustments</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              Recommended Investments
            </h4>
            <div className="space-y-2">
              {mockEnhancedAnalytics.predictiveInsights.recommendedInvestments.map(
                (investment, index) => (
                  <div
                    key={index}
                    className="flex items-center p-2 bg-green-50 rounded"
                  >
                    <Zap className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-sm text-green-800">{investment}</span>
                  </div>
                )
              )}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Risk Adjustments</h4>
            <div className="space-y-2">
              {mockEnhancedAnalytics.predictiveInsights.riskAdjustments.map(
                (adjustment, index) => (
                  <div
                    key={index}
                    className="flex items-center p-2 bg-orange-50 rounded"
                  >
                    <AlertTriangle className="w-4 h-4 text-orange-600 mr-2" />
                    <span className="text-sm text-orange-800">
                      {adjustment}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Portfolio Export */}
      <PortfolioExport portfolioData={mockEnhancedAnalytics} />
    </div>
  );

  const renderGovernanceTracking = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Cross-Project Governance Tracking
          </h2>
          <p className="text-gray-600">
            Monitor your governance participation across all investments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            View All Proposals
          </Button>
          <Button variant="primary" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Vote Now
          </Button>
        </div>
      </div>

      {/* Governance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Proposals"
          value={mockCrossProjectMetrics.governanceParticipation.totalProposals.toString()}
          icon={<BarChart3 className="w-5 h-5" />}
          changeType="increase"
          change={12}
        />
        <StatsCard
          title="Voted Proposals"
          value={mockCrossProjectMetrics.governanceParticipation.votedProposals.toString()}
          icon={<CheckCircle className="w-5 h-5" />}
          changeType="increase"
          change={8}
        />
        <StatsCard
          title="Participation Rate"
          value={`${mockCrossProjectMetrics.governanceParticipation.participationRate.toFixed(1)}%`}
          icon={<Activity className="w-5 h-5" />}
          changeType="increase"
          change={5.3}
        />
        <StatsCard
          title="Voting Power"
          value={`${mockCrossProjectMetrics.governanceParticipation.votingPower.toFixed(1)}%`}
          icon={<Target className="w-5 h-5" />}
          changeType="increase"
          change={0.3}
        />
      </div>

      {/* Project Governance Breakdown */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Project-by-Project Governance Participation
        </h3>
        <div className="space-y-4">
          {mockCrossProjectMetrics.governanceParticipation.crossProjectVotes.map(
            project => (
              <div
                key={project.projectId}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {project.projectName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Last vote: {formatDate(project.lastVoteDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary-600">
                      {project.participationRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Participation</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      {project.votedProposals}/{project.totalProposals}
                    </div>
                    <div className="text-sm text-blue-700">Proposals Voted</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {project.votingPower.toFixed(1)}%
                    </div>
                    <div className="text-sm text-green-700">Voting Power</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      {project.totalProposals - project.votedProposals}
                    </div>
                    <div className="text-sm text-purple-700">Pending Votes</div>
                  </div>
                </div>

                <div className="mt-3 flex justify-between items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2 mr-4">
                    <div
                      className="bg-primary-500 h-2 rounded-full"
                      style={{ width: `${project.participationRate}%` }}
                    ></div>
                  </div>
                  <Link href={`/governance?project=${project.projectId}`}>
                    <Button variant="secondary" className="text-sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            )
          )}
        </div>
      </Card>

      {/* Governance Rewards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Governance Rewards
          </h3>
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(
                mockCrossProjectMetrics.governanceParticipation
                  .governanceRewards
              )}
            </div>
            <div className="text-sm text-gray-600">Total Rewards Earned</div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-green-700">Participation Bonus</span>
              <span className="font-medium text-green-600">
                {formatCurrency(15000)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-700">Proposal Voting</span>
              <span className="font-medium text-blue-600">
                {formatCurrency(10000)}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/claim">
              <Button variant="primary" className="w-full">
                Claim Governance Rewards
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Upcoming Governance Events
          </h3>
          <div className="space-y-3">
            <div className="border-l-4 border-red-500 pl-4 py-2">
              <h4 className="font-medium text-gray-900">High Priority Vote</h4>
              <p className="text-sm text-gray-600">
                Contract upgrade proposal for Jakarta-Bandung Rail
              </p>
              <p className="text-xs text-red-600 mt-1">
                Ends in 2 days • Your vote needed
              </p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4 py-2">
              <h4 className="font-medium text-gray-900">
                Medium Priority Vote
              </h4>
              <p className="text-sm text-gray-600">
                Fee adjustment proposal for Airport Terminal 4
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Ends in 5 days • Consider voting
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <h4 className="font-medium text-gray-900">Information</h4>
              <p className="text-sm text-gray-600">
                New proposal creation for renewable energy project
              </p>
              <p className="text-xs text-green-600 mt-1">
                Voting starts in 3 days
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/governance">
              <Button variant="secondary" className="w-full">
                View All Governance Activity
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <DashboardLayout userType="investor">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Investment Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back! Here&apos;s your portfolio overview.
              </p>
            </div>

            {/* Real-time Status Indicator */}
            <div className="flex items-center space-x-4">
              {lastUpdate && (
                <div className="text-sm text-gray-500">
                  Last update: {lastUpdate.toLocaleTimeString()}
                </div>
              )}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected'
                      ? 'bg-green-500'
                      : connectionStatus === 'connecting'
                        ? 'bg-yellow-500 animate-pulse'
                        : 'bg-red-500'
                  }`}
                />
                <span className="text-sm text-gray-600 capitalize">
                  {connectionStatus === 'connected' ? 'Live' : connectionStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'portfolio' && renderPortfolio()}
        {selectedTab === 'transactions' && renderTransactions()}
        {selectedTab === 'analytics' && renderAnalytics()}
        {selectedTab === 'insights' && renderCrossProjectInsights()}
        {selectedTab === 'governance' && renderGovernanceTracking()}
      </div>
    </DashboardLayout>
  );
}
