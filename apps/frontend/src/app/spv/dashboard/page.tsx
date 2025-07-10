'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Plus,
  Eye,
  DollarSign,
  Building,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  PlayCircle,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui';
import { StatsCard } from '@/components/ui';
import { DashboardLayout } from '@/components/ui';
import { DataTable } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';

interface SPVProject {
  id: string;
  projectName: string;
  projectType: string;
  location: string;
  totalValue: number;
  fundingProgress: number;
  fundingTarget: number;
  investorCount: number;
  status: 'planning' | 'funding' | 'active' | 'operational' | 'completed';
  createdDate: string;
  launchDate: string;
  expectedRevenue: number;
  currentRevenue: number;
  lastUpdate: string;
}

interface SPVStats {
  totalProjects: number;
  activeProjects: number;
  totalFundingRaised: number;
  monthlyRevenue: number;
  completionRate: number;
  averageROI: number;
}

const mockProjects: SPVProject[] = [
  {
    id: '1',
    projectName: 'Jakarta-Surabaya Toll Road Extension',
    projectType: 'Infrastructure',
    location: 'East Java',
    totalValue: 2500000000000, // 2.5T IDR
    fundingProgress: 1875000000000, // 1.875T IDR (75%)
    fundingTarget: 2500000000000,
    investorCount: 1250,
    status: 'funding',
    createdDate: '2024-01-15',
    launchDate: '2024-02-01',
    expectedRevenue: 450000000000, // 450B IDR annually
    currentRevenue: 0,
    lastUpdate: '2025-01-09',
  },
  {
    id: '2',
    projectName: 'Bandung Smart Water Management',
    projectType: 'Utilities',
    location: 'West Java',
    totalValue: 850000000000, // 850B IDR
    fundingProgress: 850000000000, // Fully funded
    fundingTarget: 850000000000,
    investorCount: 425,
    status: 'operational',
    createdDate: '2023-06-10',
    launchDate: '2023-07-01',
    expectedRevenue: 125000000000, // 125B IDR annually
    currentRevenue: 31250000000, // 31.25B IDR (Q1)
    lastUpdate: '2025-01-08',
  },
  {
    id: '3',
    projectName: 'Medan Port Modernization',
    projectType: 'Transportation',
    location: 'North Sumatra',
    totalValue: 1200000000000, // 1.2T IDR
    fundingProgress: 1200000000000, // Fully funded
    fundingTarget: 1200000000000,
    investorCount: 600,
    status: 'active',
    createdDate: '2023-03-20',
    launchDate: '2023-04-15',
    expectedRevenue: 180000000000, // 180B IDR annually
    currentRevenue: 135000000000, // 135B IDR (3 quarters)
    lastUpdate: '2025-01-07',
  },
];

const mockStats: SPVStats = {
  totalProjects: 3,
  activeProjects: 2,
  totalFundingRaised: 4425000000000, // 4.425T IDR
  monthlyRevenue: 13854166667, // ~13.85B IDR monthly average
  completionRate: 66.7,
  averageROI: 12.5,
};

const getStatusIcon = (status: SPVProject['status']) => {
  switch (status) {
    case 'planning':
      return <Clock className="h-4 w-4" />;
    case 'funding':
      return <DollarSign className="h-4 w-4" />;
    case 'active':
      return <PlayCircle className="h-4 w-4" />;
    case 'operational':
      return <CheckCircle className="h-4 w-4" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
};

const getStatusColor = (status: SPVProject['status']) => {
  switch (status) {
    case 'planning':
      return 'text-gray-500';
    case 'funding':
      return 'text-primary-500';
    case 'active':
      return 'text-secondary-500';
    case 'operational':
      return 'text-support-500';
    case 'completed':
      return 'text-support-600';
    default:
      return 'text-accent-500';
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

export default function SPVDashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  // const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Mock API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  const handleViewProject = (projectId: string) => {
    // TODO: Navigate to project detail page
    // console.log('View project:', projectId);

    projectId;
  };

  const handleEditProject = (projectId: string) => {
    // TODO: Navigate to project edit page
    // console.log('Edit project:', projectId);

    projectId;
  };

  const projectColumns: Column[] = [
    {
      key: 'projectName',
      label: 'Project',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.projectName}</span>
          <span className="text-sm text-gray-500">
            {row.projectType} • {row.location}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => (
        <div
          className={`flex items-center gap-2 ${getStatusColor(row.status)}`}
        >
          {getStatusIcon(row.status)}
          <span className="capitalize font-medium">{row.status}</span>
        </div>
      ),
    },
    {
      key: 'fundingProgress',
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
      key: 'investorCount',
      label: 'Investors',
      render: (_, row) => (
        <span className="font-medium">
          {row.investorCount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'currentRevenue',
      label: 'Revenue',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {formatCurrency(row.currentRevenue)}
          </span>
          <span className="text-sm text-gray-500">
            Expected: {formatCurrency(row.expectedRevenue)}
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditProject(row.id)}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout userType="spv">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SPV Dashboard</h1>
            <p className="text-gray-600">
              Manage your infrastructure projects and track performance
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
            <Link href="/spv/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Projects"
            value={mockStats.totalProjects.toString()}
            icon={<Building className="w-4 h-4" />}
            change={0}
            changeType="neutral"
            description="All projects created"
          />
          <StatsCard
            title="Active Projects"
            value={mockStats.activeProjects.toString()}
            icon={<PlayCircle className="w-4 h-4" />}
            change={0}
            changeType="neutral"
            description="Currently operational"
          />
          <StatsCard
            title="Total Funding Raised"
            value={formatCurrency(mockStats.totalFundingRaised)}
            icon={<DollarSign className="w-4 h-4" />}
            change={18.2}
            changeType="increase"
            description="Across all projects"
          />
          <StatsCard
            title="Monthly Revenue"
            value={formatCurrency(mockStats.monthlyRevenue)}
            icon={<TrendingUp className="w-4 h-4" />}
            change={8.5}
            changeType="increase"
            description="Average monthly"
          />
        </div>

        {/* Projects Table */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Project Portfolio
              </h2>
              <p className="text-sm text-gray-600">
                Track and manage all your infrastructure projects
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <DataTable columns={projectColumns} data={mockProjects} />
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Plus className="h-8 w-8 text-primary-500 bg-primary-50 rounded-lg p-2" />
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Create New Project
                </h3>
                <p className="text-sm text-gray-600">
                  Start tokenizing a new infrastructure project
                </p>
              </div>
            </div>
            <Link href="/spv/create">
              <Button className="w-full">Get Started</Button>
            </Link>
          </Card>

          <Card className="p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-8 w-8 text-secondary-500 bg-secondary-50 rounded-lg p-2" />
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Analytics & Reports
                </h3>
                <p className="text-sm text-gray-600">
                  View detailed performance analytics
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              View Analytics
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Calendar className="h-8 w-8 text-support-500 bg-support-50 rounded-lg p-2" />
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Upcoming Events
                </h3>
                <p className="text-sm text-gray-600">
                  Project milestones and deadlines
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              View Calendar
            </Button>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
