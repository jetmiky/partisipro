'use client';

// Force dynamic rendering for presentation mode compatibility
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  TrendingUp,
  Users,
  Building,
  DollarSign,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Bell,
  UserPlus,
  FolderPlus,
  Activity,
} from 'lucide-react';
import { DashboardLayout, DataTable } from '@/components/ui';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { PageTransition } from '@/components/ui/PageTransition';
import { ScrollReveal, StaggeredList } from '@/components/ui/ScrollAnimations';
import { toast } from '@/components/ui/AnimatedNotification';
import type { Column } from '@/components/ui/DataTable';
import { adminService } from '@/services/admin.service';
import type {
  PlatformStats,
  SystemHealth,
  RecentActivity,
} from '@/services/admin.service';

interface TopProject extends Record<string, unknown> {
  id: string;
  name: string;
  spv: string;
  totalFunding: number;
  investorCount: number;
  status: 'funding' | 'active' | 'operational';
  roi: number;
}

// SystemHealth interface now imported from admin.service.ts

// Removed unused mock data - now using real API data from adminService

const mockTopProjects: TopProject[] = [
  {
    id: '1',
    name: 'Jakarta-Surabaya High Speed Rail',
    spv: 'PT Kereta Cepat Indonesia',
    totalFunding: 12500000000000, // 12.5T IDR
    investorCount: 3250,
    status: 'operational',
    roi: 15.2,
  },
  {
    id: '2',
    name: 'Bali-Lombok Bridge',
    spv: 'PT Jembatan Nusantara',
    totalFunding: 8750000000000, // 8.75T IDR
    investorCount: 2100,
    status: 'funding',
    roi: 12.8,
  },
  {
    id: '3',
    name: 'Medan Port Expansion',
    spv: 'PT Pelabuhan Modern',
    totalFunding: 5200000000000, // 5.2T IDR
    investorCount: 1800,
    status: 'active',
    roi: 13.5,
  },
];

// Removed unused mock system health data - now using real API data

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

const getActivityIcon = (type: RecentActivity['type']) => {
  switch (type) {
    case 'spv_registration':
      return <UserPlus className="h-4 w-4" />;
    case 'project_launch':
      return <FolderPlus className="h-4 w-4" />;
    case 'large_investment':
      return <DollarSign className="h-4 w-4" />;
    case 'user_signup':
      return <Users className="h-4 w-4" />;
    case 'system_alert':
      return <Bell className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

// const getActivityColor = (type: RecentActivity['type']) => {
//   switch (type) {
//     case 'spv_registration':
//       return 'text-secondary-500 bg-secondary-50';
//     case 'project_launch':
//       return 'text-primary-500 bg-primary-50';
//     case 'large_investment':
//       return 'text-support-500 bg-support-50';
//     case 'user_signup':
//       return 'text-secondary-500 bg-secondary-50';
//     case 'system_alert':
//       return 'text-gray-500 bg-gray-50';
//     default:
//       return 'text-gray-500 bg-gray-50';
//   }
// };

const getStatusColor = (status: TopProject['status']) => {
  switch (status) {
    case 'funding':
      return 'text-primary-500';
    case 'active':
      return 'text-secondary-500';
    case 'operational':
      return 'text-support-500';
    default:
      return 'text-gray-500';
  }
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor(
    (now.getTime() - time.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h ago`;
  } else {
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }
};

export default function AdminDashboardPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(
    null
  );
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Authentication guard
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      window.location.href = '/auth/signin';
      return;
    }
  }, [isAuthenticated, isAdmin]);

  // Load dashboard data
  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [statsData, healthData, activityData] = await Promise.all([
        adminService.getPlatformStats(),
        adminService.getSystemHealth(),
        adminService.getRecentActivity(5),
      ]);

      setPlatformStats(statsData);
      setSystemHealth(healthData);
      setRecentActivity(activityData);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = async () => {
    toast.info('Refreshing dashboard data...');
    await loadDashboardData();
    toast.success('Dashboard data refreshed successfully!');
  };

  const topProjectColumns: Column<TopProject>[] = [
    {
      key: 'project',
      label: 'Project',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.name}</span>
          <span className="text-sm text-gray-500">{row.spv}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => (
        <span
          className={`capitalize font-medium ${getStatusColor(row.status)}`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'totalFunding',
      label: 'Total Funding',
      render: (_, row) => (
        <span className="font-medium">{formatCurrency(row.totalFunding)}</span>
      ),
    },
    {
      key: 'investorCount',
      label: 'Investors',
      render: (_, row) => <span>{row.investorCount.toLocaleString()}</span>,
    },
    {
      key: 'roi',
      label: 'ROI',
      render: (_, row) => (
        <span className="text-support-600 font-medium">{row.roi}%</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: () => (
        <AnimatedButton
          variant="outline"
          size="sm"
          className="btn-modern btn-modern-secondary hover-lift"
          onClick={() => toast.info('Viewing project details...')}
        >
          <Eye className="h-4 w-4" />
        </AnimatedButton>
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
                    Platform Administration
                  </h1>
                  <p className="text-muted-foreground">
                    Monitor platform performance and manage operations
                  </p>
                </div>
                <div className="flex gap-3">
                  <AnimatedButton
                    variant="outline"
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
                  <Link href="/admin/spv">
                    <AnimatedButton
                      variant="primary"
                      ripple
                      className="btn-modern btn-modern-primary hover-lift"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Manage SPVs
                    </AnimatedButton>
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            {/* Error Display */}
            {error && (
              <ScrollReveal animation="slide-up" delay={200} duration={600}>
                <div className="glass-feature rounded-2xl p-6 border border-error-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-error-500 to-error-600 rounded-xl flex items-center justify-center">
                      <Bell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-primary-800 mb-2">
                        Error Loading Dashboard
                      </h3>
                      <p className="text-primary-600">{error}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            )}

            {/* Main Stats */}
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
                  <span className="text-xs text-success-600 font-medium">
                    +{platformStats?.monthlyGrowth.projects || 0}%
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    {platformStats?.totalProjects.toString() || '0'}
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    Total Projects
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Active platform projects
                  </p>
                </div>
              </div>

              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-success-600 font-medium">
                    +{platformStats?.monthlyGrowth.users || 0}%
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    {platformStats?.totalUsers.toLocaleString() || '0'}
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    Total Users
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Registered investors
                  </p>
                </div>
              </div>

              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-success-600 font-medium">
                    +{platformStats?.monthlyGrowth.funding || 0}%
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    {formatCurrency(platformStats?.totalFundingVolume || 0)}
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    Funding Volume
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total platform funding
                  </p>
                </div>
              </div>

              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-support-500 to-support-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-success-600 font-medium">
                    +{platformStats?.monthlyGrowth.revenue || 0}%
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    {formatCurrency(platformStats?.platformRevenue || 0)}
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    Platform Revenue
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total platform earnings
                  </p>
                </div>
              </div>
            </StaggeredList>

            {/* System Health & Recent Activity */}
            <ScrollReveal animation="slide-up" delay={400} duration={800}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* System Health */}
                <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                  <h3 className="text-xl font-semibold text-gradient mb-6">
                    System Health
                  </h3>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center p-4 glass-modern rounded-xl">
                      <span className="text-sm font-medium text-primary-700">
                        Active Projects
                      </span>
                      <span className="text-lg font-bold text-gradient">
                        {systemHealth?.activeProjects || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 glass-modern rounded-xl">
                      <span className="text-sm font-medium text-primary-700">
                        Pending Approvals
                      </span>
                      <span className="text-lg font-bold text-primary-600">
                        {systemHealth?.pendingApprovals || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 glass-modern rounded-xl">
                      <span className="text-sm font-medium text-primary-700">
                        System Uptime
                      </span>
                      <span className="text-lg font-bold text-success-600">
                        {systemHealth?.systemUptime || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 glass-modern rounded-xl">
                      <span className="text-sm font-medium text-primary-700">
                        24h Volume
                      </span>
                      <span className="text-lg font-bold text-gradient">
                        {formatCurrency(
                          systemHealth?.transactionVolume24h || 0
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="glass-feature rounded-2xl p-8 lg:col-span-2 hover-lift transition-all duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gradient">
                      Recent Activity
                    </h3>
                    <AnimatedButton
                      variant="outline"
                      size="sm"
                      ripple
                      className="btn-modern btn-modern-secondary hover-lift"
                      onClick={() =>
                        toast.info('Viewing all recent activity...')
                      }
                    >
                      View All
                    </AnimatedButton>
                  </div>
                  <div className="space-y-4">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity, index) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-4 p-4 glass-modern rounded-xl hover-glow transition-all duration-300"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              activity.type === 'spv_registration'
                                ? 'bg-gradient-to-br from-secondary-500 to-secondary-600'
                                : activity.type === 'project_launch'
                                  ? 'bg-gradient-to-br from-primary-500 to-primary-600'
                                  : activity.type === 'large_investment'
                                    ? 'bg-gradient-to-br from-success-500 to-success-600'
                                    : activity.type === 'user_signup'
                                      ? 'bg-gradient-to-br from-secondary-500 to-secondary-600'
                                      : 'bg-gradient-to-br from-muted-500 to-muted-600'
                            }`}
                          >
                            <div className="text-white">
                              {getActivityIcon(activity.type)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-primary-800 mb-1">
                                  {activity.title}
                                </p>
                                <p className="text-sm text-primary-600 mb-2">
                                  {activity.description}
                                </p>
                                {activity.amount && (
                                  <p className="text-sm font-semibold text-gradient">
                                    {formatCurrency(activity.amount)}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground glass-modern px-2 py-1 rounded-full">
                                {formatTimeAgo(activity.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 feature-icon mx-auto mb-4 hover-scale">
                          <Activity className="w-8 h-8" />
                        </div>
                        <p className="text-muted-foreground">
                          {isLoading
                            ? 'Loading recent activity...'
                            : 'No recent activity'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Top Performing Projects */}
            <ScrollReveal animation="slide-up" delay={500} duration={800}>
              <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-semibold text-gradient mb-2">
                      Top Performing Projects
                    </h2>
                    <p className="text-primary-600">
                      Highest performing projects by ROI and funding volume
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <AnimatedButton
                      variant="outline"
                      size="sm"
                      ripple
                      className="btn-modern btn-modern-secondary hover-lift"
                      onClick={() => toast.info('Opening project filters...')}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </AnimatedButton>
                    <AnimatedButton
                      variant="outline"
                      size="sm"
                      ripple
                      className="btn-modern btn-modern-secondary hover-lift"
                      onClick={() => toast.success('Exporting project data...')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </AnimatedButton>
                  </div>
                </div>

                <div className="glass-modern rounded-xl overflow-hidden">
                  <DataTable<TopProject>
                    columns={topProjectColumns}
                    data={mockTopProjects}
                  />
                </div>
              </div>
            </ScrollReveal>

            {/* Quick Actions */}
            <StaggeredList
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              itemDelay={200}
              animation="slide-up"
            >
              <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                <div className="flex items-start mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center mr-4">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gradient mb-2">
                      SPV Management
                    </h3>
                    <p className="text-sm text-primary-600">
                      Review and approve SPV applications
                    </p>
                  </div>
                </div>
                <Link href="/admin/spv">
                  <AnimatedButton
                    variant="primary"
                    ripple
                    className="w-full btn-modern btn-modern-primary hover-lift"
                  >
                    Manage SPVs
                  </AnimatedButton>
                </Link>
              </div>

              <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                <div className="flex items-start mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mr-4">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gradient mb-2">
                      Project Oversight
                    </h3>
                    <p className="text-sm text-primary-600">
                      Monitor all platform projects
                    </p>
                  </div>
                </div>
                <Link href="/admin/projects">
                  <AnimatedButton
                    variant="outline"
                    ripple
                    className="w-full btn-modern btn-modern-secondary hover-lift"
                  >
                    View Projects
                  </AnimatedButton>
                </Link>
              </div>

              <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                <div className="flex items-start mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center mr-4">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gradient mb-2">
                      Fee Management
                    </h3>
                    <p className="text-sm text-primary-600">
                      Configure platform fees and revenue
                    </p>
                  </div>
                </div>
                <Link href="/admin/fees">
                  <AnimatedButton
                    variant="outline"
                    ripple
                    className="w-full btn-modern btn-modern-secondary hover-lift"
                  >
                    Manage Fees
                  </AnimatedButton>
                </Link>
              </div>
            </StaggeredList>
          </div>
        </PageTransition>
      </DashboardLayout>
    </div>
  );
}
