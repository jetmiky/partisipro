'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
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
import { StatsCard, DashboardLayout, DataTable } from '@/components/ui';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { PageTransition } from '@/components/ui/PageTransition';
import { ScrollReveal, StaggeredList } from '@/components/ui/ScrollAnimations';
import { toast } from '@/components/ui/AnimatedNotification';
import type { Column } from '@/components/ui/DataTable';
import { adminService } from '@/services/admin.service';

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

interface AdminProject extends Record<string, unknown> {
  id: string;
  projectName: string;
  spvName: string;
  projectType: string;
  location: string;
  totalValue: number;
  fundingProgress: number;
  fundingTarget: number;
  investorCount: number;
  status:
    | 'draft'
    | 'review'
    | 'approved'
    | 'funding'
    | 'active'
    | 'operational'
    | 'completed'
    | 'suspended';
  riskLevel: 'low' | 'medium' | 'high';
  createdDate: string;
  launchDate?: string;
  lastActivity: string;
  complianceStatus: 'compliant' | 'review_required' | 'non_compliant';
  flags: string[];
}

// Removed unused mock data - now using real API data from adminService

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
  const { isAuthenticated, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Authentication guard
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      window.location.href = '/auth/signin';
      return;
    }
  }, [isAuthenticated, isAdmin]);

  // State for API data
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);

  // Load project oversight data
  const loadProjectData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [oversightData, statsData] = await Promise.all([
        adminService.getProjectOversight({
          status: statusFilter === 'all' ? undefined : statusFilter,
          limit: 100,
        }),
        adminService.getPlatformStats(),
      ]);

      // Transform oversight data to match AdminProject interface
      const transformedProjects: AdminProject[] = oversightData.projects.map(
        p => ({
          id: p.id,
          projectName: p.name,
          spvName: p.spvName,
          projectType: 'Infrastructure', // Default type
          location: 'Various', // Default location
          totalValue: p.totalFunding,
          fundingProgress: p.totalFunding,
          fundingTarget: p.totalFunding,
          investorCount: p.investorCount,
          status: p.status as AdminProject['status'],
          riskLevel: p.riskLevel,
          createdDate: new Date().toISOString().split('T')[0],
          lastActivity: p.lastActivity,
          complianceStatus:
            p.complianceScore > 80 ? 'compliant' : 'review_required',
          flags: [],
        })
      );

      setProjects(transformedProjects);

      // Calculate project stats from platform stats
      const calculatedStats: ProjectStats = {
        totalProjects: statsData.totalProjects,
        activeProjects: oversightData.projects.filter(
          p => p.status === 'active'
        ).length,
        pendingReview: oversightData.projects.filter(p => p.status === 'review')
          .length,
        suspendedProjects: oversightData.projects.filter(
          p => p.status === 'suspended'
        ).length,
        totalFundingVolume: statsData.totalFundingVolume,
        averageProjectSize:
          statsData.totalFundingVolume / Math.max(statsData.totalProjects, 1),
        complianceRate: 85, // Mock compliance rate
        monthlyGrowth: statsData.monthlyGrowth.projects,
      };

      setProjectStats(calculatedStats);
    } catch (err) {
      setError('Failed to load project data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount and when filter changes
  useEffect(() => {
    loadProjectData();
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    toast.info('Refreshing project data...');
    await loadProjectData();
    toast.success('Project data refreshed successfully!');
  };

  const handleViewProject = (_projectId: string) => {
    // TODO: Navigate to project detail page
    _projectId;
    toast.info('Opening project details...');
  };

  const handleSuspendProject = (_projectId: string) => {
    // TODO: Suspend project and notify stakeholders
    // console.log('Suspend project:', projectId);
    _projectId;
    toast.info('Suspending project...');
  };

  const handleApproveProject = (_projectId: string) => {
    // TODO: Approve project for funding
    // console.log('Approve project:', projectId);
    _projectId;
    toast.success('Project approved for funding!');
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
          <AnimatedButton
            variant="outline"
            size="sm"
            onClick={() => handleViewProject(row.id)}
            ripple
          >
            <Eye className="h-4 w-4" />
          </AnimatedButton>
          {row.status === 'review' && (
            <AnimatedButton
              size="sm"
              onClick={() => handleApproveProject(row.id)}
              ripple
            >
              Approve
            </AnimatedButton>
          )}
          {(row.status === 'funding' || row.status === 'active') && (
            <AnimatedButton
              variant="outline"
              size="sm"
              onClick={() => handleSuspendProject(row.id)}
              ripple
            >
              <Pause className="h-4 w-4" />
            </AnimatedButton>
          )}
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

      <DashboardLayout userType="admin">
        <PageTransition type="fade" duration={300}>
          <div className="space-y-8 relative z-10">
            {/* Header */}
            <ScrollReveal animation="fade" delay={0} duration={800}>
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gradient mb-2">
                    Project Oversight
                  </h1>
                  <p className="text-muted-foreground">
                    Monitor and manage all platform projects
                  </p>
                </div>
                <div className="flex gap-3">
                  <AnimatedButton
                    onClick={handleRefresh}
                    disabled={isLoading}
                    loading={isLoading}
                    ripple
                    className="btn-modern btn-modern-secondary hover-lift"
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                    />
                    Refresh
                  </AnimatedButton>
                </div>
              </div>
            </ScrollReveal>

            {/* Error Display */}
            {error && (
              <div className="glass-modern p-4 rounded-xl bg-gradient-to-br from-accent-50 to-accent-100 border border-accent-200">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-accent-800">
                      Error
                    </h3>
                    <div className="mt-2 text-sm text-accent-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <StaggeredList
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              itemDelay={150}
              animation="slide-up"
            >
              <StatsCard
                title="Total Projects"
                value={projectStats?.totalProjects.toString() || '0'}
                icon={<Building className="w-4 h-4" />}
                change={projectStats?.monthlyGrowth || 0}
                changeType="increase"
                description="All time projects"
              />
              <StatsCard
                title="Active Projects"
                value={projectStats?.activeProjects.toString() || '0'}
                icon={<Play className="w-4 h-4" />}
                change={0}
                changeType="neutral"
                description="Currently operational"
              />
              <StatsCard
                title="Pending Review"
                value={projectStats?.pendingReview.toString() || '0'}
                icon={<Eye className="w-4 h-4" />}
                change={0}
                changeType="neutral"
                description="Awaiting approval"
              />
              <StatsCard
                title="Compliance Rate"
                value={`${projectStats?.complianceRate || 0}%`}
                icon={<Shield className="w-4 h-4" />}
                change={5.2}
                changeType="increase"
                description="Regulatory compliance"
              />
            </StaggeredList>

            {/* Additional Stats */}
            <StaggeredList
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              itemDelay={150}
              animation="slide-up"
            >
              <StatsCard
                title="Total Funding Volume"
                value={formatCurrency(projectStats?.totalFundingVolume || 0)}
                icon={<DollarSign className="w-4 h-4" />}
                change={15.8}
                changeType="increase"
                description="Across all projects"
              />
              <StatsCard
                title="Average Project Size"
                value={formatCurrency(projectStats?.averageProjectSize || 0)}
                icon={<BarChart3 className="w-4 h-4" />}
                change={-3.2}
                changeType="decrease"
                description="Project value average"
              />
              <StatsCard
                title="Suspended Projects"
                value={projectStats?.suspendedProjects.toString() || '0'}
                icon={<Ban className="w-4 h-4" />}
                change={0}
                changeType="neutral"
                description="Due to compliance issues"
              />
            </StaggeredList>

            {/* Search and Filters */}
            <ScrollReveal animation="slide-up" delay={200} duration={600}>
              <div className="glass-modern p-6 rounded-xl">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <AnimatedInput
                        placeholder="Search projects, SPVs, or locations..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10"
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
                    <AnimatedButton variant="outline" size="sm" ripple>
                      <Filter className="h-4 w-4 mr-2" />
                      More Filters
                    </AnimatedButton>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Projects Table */}
            <ScrollReveal animation="slide-up" delay={300} duration={600}>
              <div className="glass-modern p-6 rounded-xl">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                      All Projects
                    </h2>
                    <p className="text-gray-600">
                      Comprehensive oversight of platform projects
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <AnimatedButton
                      ripple
                      className="btn-modern bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </AnimatedButton>
                  </div>
                </div>

                <DataTable<AdminProject>
                  columns={projectColumns}
                  data={projects}
                />
              </div>
            </ScrollReveal>

            {/* Quick Actions */}
            <StaggeredList
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              itemDelay={150}
              animation="slide-up"
            >
              <div className="glass-modern p-6 rounded-xl">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-bold text-gray-900">
                      Compliance Reports
                    </h3>
                    <p className="text-sm text-gray-600">
                      Generate regulatory compliance reports
                    </p>
                  </div>
                </div>
                <AnimatedButton
                  ripple
                  className="btn-modern bg-gradient-to-r from-gray-500 to-gray-600 text-white w-full"
                >
                  Generate Report
                </AnimatedButton>
              </div>

              <div className="glass-modern p-6 rounded-xl">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-bold text-gray-900">
                      Platform Analytics
                    </h3>
                    <p className="text-sm text-gray-600">
                      View detailed platform performance metrics
                    </p>
                  </div>
                </div>
                <Link href="/admin/dashboard">
                  <AnimatedButton
                    ripple
                    className="btn-modern bg-gradient-to-r from-gray-500 to-gray-600 text-white w-full"
                  >
                    View Analytics
                  </AnimatedButton>
                </Link>
              </div>

              <div className="glass-modern p-6 rounded-xl">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-bold text-gray-900">
                      Risk Management
                    </h3>
                    <p className="text-sm text-gray-600">
                      Monitor and manage project risks
                    </p>
                  </div>
                </div>
                <AnimatedButton
                  ripple
                  className="btn-modern bg-gradient-to-r from-gray-500 to-gray-600 text-white w-full"
                >
                  Risk Dashboard
                </AnimatedButton>
              </div>
            </StaggeredList>

            {/* TODO: Mock Implementation Notes */}
            <div className="glass-modern p-6 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-primary-900 mb-2">
                    TODO: Mock Implementation Notes
                  </h3>
                  <ul className="text-sm text-primary-800 space-y-1">
                    <li>
                      • Mock project monitoring API with real-time status
                      updates
                    </li>
                    <li>
                      • Mock risk assessment algorithms and compliance checking
                    </li>
                    <li>
                      • Mock project approval workflow with multi-step
                      verification
                    </li>
                    <li>• Mock notification system for flagged projects</li>
                    <li>
                      • Mock automated compliance reporting and audit trails
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </PageTransition>
      </DashboardLayout>
    </div>
  );
}
