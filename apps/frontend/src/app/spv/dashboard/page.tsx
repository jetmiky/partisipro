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
import { DashboardLayout } from '@/components/ui';
import { DataTable } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { ScrollReveal, StaggeredList } from '@/components/ui/ScrollAnimations';
import { PageTransition } from '@/components/ui/PageTransition';
import { toast } from '@/components/ui/AnimatedNotification';
import type { SPVProject } from '@/types';

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
    riskLevel: 'medium',
    createdDate: '2024-01-15',
    launchDate: '2024-02-01',
    lastActivity: '2025-01-09',
    complianceStatus: 'compliant',
    monthlyRevenue: 0,
    totalRevenue: 0,
    profitMargin: 0,
    currentRevenue: 0,
    expectedRevenue: 0,
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
    riskLevel: 'low',
    createdDate: '2023-06-10',
    launchDate: '2023-07-01',
    lastActivity: '2025-01-09',
    complianceStatus: 'compliant',
    monthlyRevenue: 125000000000, // 125B IDR annually
    totalRevenue: 31250000000, // 31.25B IDR (Q1)
    profitMargin: 25,
    currentRevenue: 0,
    expectedRevenue: 0,
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
    riskLevel: 'high',
    createdDate: '2023-03-20',
    launchDate: '2023-04-15',
    lastActivity: '2025-01-07',
    complianceStatus: 'compliant',
    monthlyRevenue: 180000000000, // 180B IDR annually
    totalRevenue: 135000000000, // 135B IDR (3 quarters)
    profitMargin: 30,
    currentRevenue: 0,
    expectedRevenue: 0,
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
    case 'approved':
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
    case 'approved':
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

    toast.success('Dashboard Refreshed', {
      message: 'Project data has been updated successfully',
      duration: 3000,
    });
  };

  const handleViewProject = (projectId: string) => {
    // TODO: Navigate to project detail page
    // console.log('View project:', projectId);

    toast.info('Opening Project Details', {
      message: 'Navigating to project details page...',
      duration: 2000,
    });

    projectId;
  };

  const handleEditProject = (projectId: string) => {
    // TODO: Navigate to project edit page
    // console.log('Edit project:', projectId);

    toast.info('Opening Project Editor', {
      message: 'Navigating to project editor...',
      duration: 2000,
    });

    projectId;
  };

  const projectColumns: Column<SPVProject>[] = [
    {
      key: 'projectName',
      label: 'Project',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-primary-800">
            {row.projectName}
          </span>
          <span className="text-sm text-muted-foreground">
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
          <AnimatedButton
            variant="outline"
            size="sm"
            onClick={() => handleViewProject(row.id)}
            ripple
          >
            <Eye className="h-4 w-4" />
          </AnimatedButton>
          <AnimatedButton
            variant="outline"
            size="sm"
            onClick={() => handleEditProject(row.id)}
            ripple
          >
            Edit
          </AnimatedButton>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Fluid Background Shapes */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="fluid-shape-1 top-20 right-16"></div>
        <div className="fluid-shape-2 top-1/2 left-10"></div>
        <div className="fluid-shape-3 bottom-32 right-1/4"></div>
        <div className="fluid-shape-1 bottom-10 left-16"></div>
      </div>

      <DashboardLayout userType="spv">
        <PageTransition type="fade" duration={300}>
          <div className="space-y-8 relative z-10">
            {/* Header */}
            <ScrollReveal animation="slide-up" delay={0}>
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gradient mb-2">
                    SPV Dashboard
                  </h1>
                  <p className="text-muted-foreground">
                    Manage your infrastructure projects and track performance
                  </p>
                </div>
                <div className="flex gap-3">
                  <AnimatedButton
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    loading={isLoading}
                    ripple
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                    />
                    Refresh
                  </AnimatedButton>
                  <Link href="/spv/create">
                    <AnimatedButton ripple>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </AnimatedButton>
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            {/* Stats Cards */}
            <StaggeredList
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              itemDelay={150}
              animation="slide-up"
            >
              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-muted-foreground">+0%</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    {mockStats.totalProjects}
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    Total Projects
                  </p>
                  <p className="text-xs text-muted-foreground">
                    All projects created
                  </p>
                </div>
              </div>

              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center">
                    <PlayCircle className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-muted-foreground">+0%</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    {mockStats.activeProjects}
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    Active Projects
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Currently operational
                  </p>
                </div>
              </div>

              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-success-600 font-medium">
                    +18.2%
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    {formatCurrency(mockStats.totalFundingRaised)}
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    Total Funding Raised
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Across all projects
                  </p>
                </div>
              </div>

              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-success-600 font-medium">
                    +8.5%
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    {formatCurrency(mockStats.monthlyRevenue)}
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    Monthly Revenue
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Average monthly
                  </p>
                </div>
              </div>
            </StaggeredList>

            {/* Projects Table */}
            <ScrollReveal animation="slide-up" delay={300}>
              <div className="mt-10 glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-xl font-semibold text-gradient mb-2">
                      Project Portfolio
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Track and manage all your infrastructure projects
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <AnimatedButton
                      variant="outline"
                      size="sm"
                      onClick={() => toast.info('Filter feature coming soon')}
                      ripple
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </AnimatedButton>
                    <AnimatedButton
                      variant="outline"
                      size="sm"
                      onClick={() => toast.info('Export feature coming soon')}
                      ripple
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </AnimatedButton>
                  </div>
                </div>

                <DataTable columns={projectColumns} data={mockProjects} />
              </div>
            </ScrollReveal>

            {/* Quick Actions */}
            <StaggeredList
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              itemDelay={150}
              animation="slide-up"
            >
              <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                <div className="flex items-start mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mr-4">
                    <Plus className="h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gradient mb-2">
                      Create New Project
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Start tokenizing a new infrastructure project
                    </p>
                  </div>
                </div>
                <Link href="/spv/create">
                  <AnimatedButton className="w-full" ripple>
                    Get Started
                  </AnimatedButton>
                </Link>
              </div>

              <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                <div className="flex items-start mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center mr-4">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gradient mb-2">
                      Analytics & Reports
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      View detailed performance analytics
                    </p>
                  </div>
                </div>
                <AnimatedButton
                  variant="outline"
                  className="w-full"
                  onClick={() => toast.info('Analytics feature coming soon')}
                  ripple
                >
                  View Analytics
                </AnimatedButton>
              </div>

              <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                <div className="flex items-start mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-support-500 to-support-600 rounded-xl flex items-center justify-center mr-4">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gradient mb-2">
                      Upcoming Events
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Project milestones and deadlines
                    </p>
                  </div>
                </div>
                <AnimatedButton
                  variant="outline"
                  className="w-full"
                  onClick={() => toast.info('Calendar feature coming soon')}
                  ripple
                >
                  View Calendar
                </AnimatedButton>
              </div>
            </StaggeredList>
          </div>
        </PageTransition>
      </DashboardLayout>
    </div>
  );
}
