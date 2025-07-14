'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  Filter,
  Download,
  RefreshCw,
  Search,
  Pause,
  Play,
  Ban,
  Shield,
  FileText,
  BarChart3,
} from 'lucide-react';
import {
  Button,
  Card,
  StatsCard,
  DashboardLayout,
  DataTable,
} from '@/components/ui';
import type { Column } from '@/components/ui/DataTable';
import type { AdminProject } from '@/types';

interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  pendingReview: number;
  suspendedProjects: number;
  totalFundingVolume: number;
  averageProjectSize: number;
  complianceRate: number;
  monthlyGrowth: number;
}

// Mock data
const mockProjects: AdminProject[] = [
  {
    id: '1',
    projectName: 'Jakarta-Surabaya Toll Road Extension',
    spvName: 'Jakarta Toll Management',
    projectType: 'Infrastructure',
    location: 'East Java',
    totalValue: 2500000000000, // 2.5T IDR
    fundingProgress: 1875000000000, // 1.875T IDR (75%)
    fundingTarget: 2500000000000,
    investorCount: 1250,
    status: 'funding',
    riskLevel: 'medium',
    createdDate: '2024-01-15',
    launchDate: '2024-02-01',
    lastActivity: '2025-01-09',
    complianceStatus: 'compliant',
    flags: [],
  },
  {
    id: '2',
    projectName: 'Bandung Smart Water Management',
    spvName: 'Bandung Water Solutions',
    projectType: 'Utilities',
    location: 'West Java',
    totalValue: 850000000000, // 850B IDR
    fundingProgress: 850000000000, // Fully funded
    fundingTarget: 850000000000,
    investorCount: 425,
    status: 'operational',
    riskLevel: 'low',
    createdDate: '2023-06-10',
    launchDate: '2023-07-01',
    lastActivity: '2025-01-08',
    complianceStatus: 'compliant',
    flags: [],
  },
  {
    id: '3',
    projectName: 'Medan Port Modernization',
    spvName: 'Medan Port Authority',
    projectType: 'Transportation',
    location: 'North Sumatra',
    totalValue: 1200000000000, // 1.2T IDR
    fundingProgress: 1200000000000, // Fully funded
    fundingTarget: 1200000000000,
    investorCount: 600,
    status: 'active',
    riskLevel: 'low',
    createdDate: '2023-03-20',
    launchDate: '2023-04-15',
    lastActivity: '2025-01-07',
    complianceStatus: 'compliant',
    flags: [],
  },
  {
    id: '4',
    projectName: 'Bali Renewable Energy Grid',
    spvName: 'Bali Green Energy',
    projectType: 'Energy',
    location: 'Bali',
    totalValue: 750000000000, // 750B IDR
    fundingProgress: 0,
    fundingTarget: 750000000000,
    investorCount: 0,
    status: 'review',
    riskLevel: 'high',
    createdDate: '2025-01-05',
    lastActivity: '2025-01-05',
    complianceStatus: 'review_required',
    flags: ['environmental_assessment_pending', 'regulatory_approval_needed'],
  },
  {
    id: '5',
    projectName: 'Surabaya Digital Infrastructure',
    spvName: 'East Java Tech Hub',
    projectType: 'Technology',
    location: 'East Java',
    totalValue: 500000000000, // 500B IDR
    fundingProgress: 100000000000, // 20%
    fundingTarget: 500000000000,
    investorCount: 150,
    status: 'suspended',
    riskLevel: 'high',
    createdDate: '2024-09-15',
    launchDate: '2024-10-01',
    lastActivity: '2024-12-20',
    complianceStatus: 'non_compliant',
    flags: ['kyc_violations', 'financial_irregularities'],
  },
];

const mockStats: ProjectStats = {
  totalProjects: 5,
  activeProjects: 3,
  pendingReview: 1,
  suspendedProjects: 1,
  totalFundingVolume: 4050000000000, // 4.05T IDR
  averageProjectSize: 960000000000, // 960B IDR
  complianceRate: 80, // 80%
  monthlyGrowth: 12.5,
};

const getStatusIcon = (status: AdminProject['status']) => {
  switch (status) {
    case 'draft':
      return <Clock className="h-4 w-4" />;
    case 'review':
      return <Eye className="h-4 w-4" />;
    case 'approved':
      return <CheckCircle className="h-4 w-4" />;
    case 'funding':
      return <DollarSign className="h-4 w-4" />;
    case 'active':
      return <Play className="h-4 w-4" />;
    case 'operational':
      return <CheckCircle className="h-4 w-4" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'suspended':
      return <Pause className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
};

const getStatusColor = (status: AdminProject['status']) => {
  switch (status) {
    case 'draft':
      return 'text-gray-500';
    case 'review':
      return 'text-primary-500';
    case 'approved':
      return 'text-support-500';
    case 'funding':
      return 'text-secondary-500';
    case 'active':
      return 'text-support-600';
    case 'operational':
      return 'text-support-700';
    case 'completed':
      return 'text-support-800';
    case 'suspended':
      return 'text-accent-500';
    default:
      return 'text-gray-500';
  }
};

const getRiskColor = (risk: AdminProject['riskLevel']) => {
  switch (risk) {
    case 'low':
      return 'text-support-600 bg-support-50';
    case 'medium':
      return 'text-primary-600 bg-primary-50';
    case 'high':
      return 'text-accent-600 bg-accent-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const getComplianceColor = (status: AdminProject['complianceStatus']) => {
  switch (status) {
    case 'compliant':
      return 'text-support-600 bg-support-50';
    case 'review_required':
      return 'text-primary-600 bg-primary-50';
    case 'non_compliant':
      return 'text-accent-600 bg-accent-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const formatCurrency = (amount: number) => {
  if (amount >= 1000000000000) {
    return `Rp ${(amount / 1000000000000).toFixed(1)}T`;
  } else if (amount >= 1000000000) {
    return `Rp ${(amount / 1000000000).toFixed(1)}B`;
  } else if (amount >= 1000000) {
    return `Rp ${(amount / 1000000).toFixed(1)}M`;
  }
  return `Rp ${amount.toLocaleString()}`;
};

const formatPercentage = (current: number, target: number) => {
  return ((current / target) * 100).toFixed(1);
};

export default function AdminProjectsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleRefresh = async () => {
    setIsLoading(true);
    // TODO: Fetch latest project data from API
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  const handleViewProject = (_projectId: string) => {
    // TODO: Navigate to project detail page
    // console.log('View project:', projectId);
    _projectId;
  };

  const handleSuspendProject = (_projectId: string) => {
    // TODO: Suspend project and notify stakeholders
    // console.log('Suspend project:', projectId);
    _projectId;
  };

  const handleApproveProject = (_projectId: string) => {
    // TODO: Approve project for funding
    // console.log('Approve project:', projectId);
    _projectId;
  };

  const projectColumns: Column<AdminProject>[] = [
    {
      key: 'projectName',
      label: 'Project',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.projectName}</span>
          <span className="text-sm text-gray-500">
            {row.projectType} • {row.location}
          </span>
          <span className="text-xs text-gray-400">SPV: {row.spvName}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => (
        <div className="flex flex-col gap-1">
          <div
            className={`flex items-center gap-2 ${getStatusColor(row.status)}`}
          >
            {getStatusIcon(row.status)}
            <span className="capitalize font-medium">{row.status}</span>
          </div>
          {row.flags.length > 0 && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-accent-500" />
              <span className="text-xs text-accent-600">
                {row.flags.length} flag{row.flags.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'funding',
      label: 'Funding Progress',
      render: (_, row) => (
        <div className="flex flex-col">
          <div className="flex justify-between text-sm">
            <span>{formatCurrency(row.fundingProgress)}</span>
            <span className="text-gray-500">
              {formatPercentage(row.fundingProgress, row.fundingTarget)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div
              className="bg-primary-500 h-2 rounded-full"
              style={{
                width: `${Math.min((row.fundingProgress / row.fundingTarget) * 100, 100)}%`,
              }}
            ></div>
          </div>
          <span className="text-xs text-gray-500 mt-1">
            Target: {formatCurrency(row.fundingTarget)}
          </span>
        </div>
      ),
    },
    {
      key: 'risk',
      label: 'Risk & Compliance',
      render: (_, row) => (
        <div className="flex flex-col gap-1">
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${getRiskColor(row.riskLevel)}`}
          >
            {row.riskLevel.toUpperCase()} RISK
          </span>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${getComplianceColor(row.complianceStatus)}`}
          >
            {row.complianceStatus.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      ),
    },
    {
      key: 'investors',
      label: 'Investors',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="font-medium">
            {row.investorCount.toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewProject(row.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {row.status === 'review' && (
            <Button size="sm" onClick={() => handleApproveProject(row.id)}>
              Approve
            </Button>
          )}
          {(row.status === 'funding' || row.status === 'active') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSuspendProject(row.id)}
            >
              <Pause className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Project Oversight
            </h1>
            <p className="text-gray-600">
              Monitor and manage all platform projects
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Projects"
            value={mockStats.totalProjects.toString()}
            icon={<Building className="w-4 h-4" />}
            change={mockStats.monthlyGrowth}
            changeType="increase"
            description="All time projects"
          />
          <StatsCard
            title="Active Projects"
            value={mockStats.activeProjects.toString()}
            icon={<Play className="w-4 h-4" />}
            change={0}
            changeType="neutral"
            description="Currently operational"
          />
          <StatsCard
            title="Pending Review"
            value={mockStats.pendingReview.toString()}
            icon={<Eye className="w-4 h-4" />}
            change={0}
            changeType="neutral"
            description="Awaiting approval"
          />
          <StatsCard
            title="Compliance Rate"
            value={`${mockStats.complianceRate}%`}
            icon={<Shield className="w-4 h-4" />}
            change={5.2}
            changeType="increase"
            description="Regulatory compliance"
          />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Total Funding Volume"
            value={formatCurrency(mockStats.totalFundingVolume)}
            icon={<DollarSign className="w-4 h-4" />}
            change={15.8}
            changeType="increase"
            description="Across all projects"
          />
          <StatsCard
            title="Average Project Size"
            value={formatCurrency(mockStats.averageProjectSize)}
            icon={<BarChart3 className="w-4 h-4" />}
            change={-3.2}
            changeType="decrease"
            description="Project value average"
          />
          <StatsCard
            title="Suspended Projects"
            value={mockStats.suspendedProjects.toString()}
            icon={<Ban className="w-4 h-4" />}
            change={0}
            changeType="neutral"
            description="Due to compliance issues"
          />
        </div>

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search projects, SPVs, or locations..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="review">Under Review</option>
                <option value="funding">Funding</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Projects Table */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                All Projects
              </h2>
              <p className="text-sm text-gray-600">
                Comprehensive oversight of platform projects
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <DataTable<AdminProject>
            columns={projectColumns}
            data={mockProjects}
          />
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-8 w-8 text-primary-500 bg-primary-50 rounded-lg p-2" />
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Compliance Reports
                </h3>
                <p className="text-sm text-gray-600">
                  Generate regulatory compliance reports
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Generate Report
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-8 w-8 text-secondary-500 bg-secondary-50 rounded-lg p-2" />
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Platform Analytics
                </h3>
                <p className="text-sm text-gray-600">
                  View detailed platform performance metrics
                </p>
              </div>
            </div>
            <Link href="/admin/dashboard">
              <Button variant="outline" className="w-full">
                View Analytics
              </Button>
            </Link>
          </Card>

          <Card className="p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-8 w-8 text-accent-500 bg-accent-50 rounded-lg p-2" />
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Risk Management
                </h3>
                <p className="text-sm text-gray-600">
                  Monitor and manage project risks
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Risk Dashboard
            </Button>
          </Card>
        </div>

        {/* TODO: Mock Implementation Notes */}
        <Card className="p-6 bg-primary-50 border-primary-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-primary-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-primary-900 mb-2">
                TODO: Mock Implementation Notes
              </h3>
              <ul className="text-sm text-primary-800 space-y-1">
                <li>
                  • Mock project monitoring API with real-time status updates
                </li>
                <li>
                  • Mock risk assessment algorithms and compliance checking
                </li>
                <li>
                  • Mock project approval workflow with multi-step verification
                </li>
                <li>• Mock notification system for flagged projects</li>
                <li>• Mock automated compliance reporting and audit trails</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
