'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import {
  Button,
  Card,
  StatsCard,
  DashboardLayout,
  DataTable,
} from '@/components/ui';
import type { Column } from '@/components/ui/DataTable';
import { adminService } from '@/services/admin.service';
import type {
  PlatformStats,
  SystemHealth,
  RecentActivity,
} from '@/services/admin.service';

// Remove duplicate interfaces - using types from admin.service.ts

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

const getActivityColor = (type: RecentActivity['type']) => {
  switch (type) {
    case 'spv_registration':
      return 'text-secondary-500 bg-secondary-50';
    case 'project_launch':
      return 'text-primary-500 bg-primary-50';
    case 'large_investment':
      return 'text-support-500 bg-support-50';
    case 'user_signup':
      return 'text-secondary-500 bg-secondary-50';
    case 'system_alert':
      return 'text-gray-500 bg-gray-50';
    default:
      return 'text-gray-500 bg-gray-50';
  }
};

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
  const [isLoading, setIsLoading] = useState(false);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(
    null
  );
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    await loadDashboardData();
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
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
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
              Platform Administration
            </h1>
            <p className="text-gray-600">
              Monitor platform performance and manage operations
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
            <Link href="/admin/spv">
              <Button>
                <Users className="h-4 w-4 mr-2" />
                Manage SPVs
              </Button>
            </Link>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error Loading Dashboard
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Projects"
            value={platformStats?.totalProjects.toString() || '0'}
            icon={<Building className="w-4 h-4" />}
            change={platformStats?.monthlyGrowth.projects || 0}
            changeType="increase"
            description="Active platform projects"
          />
          <StatsCard
            title="Total Users"
            value={platformStats?.totalUsers.toLocaleString() || '0'}
            icon={<Users className="w-4 h-4" />}
            change={platformStats?.monthlyGrowth.users || 0}
            changeType="increase"
            description="Registered investors"
          />
          <StatsCard
            title="Funding Volume"
            value={formatCurrency(platformStats?.totalFundingVolume || 0)}
            icon={<DollarSign className="w-4 h-4" />}
            change={platformStats?.monthlyGrowth.funding || 0}
            changeType="increase"
            description="Total platform funding"
          />
          <StatsCard
            title="Platform Revenue"
            value={formatCurrency(platformStats?.platformRevenue || 0)}
            icon={<TrendingUp className="w-4 h-4" />}
            change={platformStats?.monthlyGrowth.revenue || 0}
            changeType="increase"
            description="Total platform earnings"
          />
        </div>

        {/* System Health & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* System Health */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              System Health
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Projects</span>
                <span className="font-medium">
                  {systemHealth?.activeProjects || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending Approvals</span>
                <span className="font-medium text-primary-500">
                  {systemHealth?.pendingApprovals || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">System Uptime</span>
                <span className="font-medium text-support-500">
                  {systemHealth?.systemUptime || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">24h Volume</span>
                <span className="font-medium">
                  {formatCurrency(systemHealth?.transactionVolume24h || 0)}
                </span>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h3>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50"
                  >
                    <div
                      className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}
                    >
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {activity.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {activity.description}
                          </p>
                          {activity.amount && (
                            <p className="text-sm font-medium text-primary-600">
                              {formatCurrency(activity.amount)}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {isLoading
                    ? 'Loading recent activity...'
                    : 'No recent activity'}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Top Performing Projects */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Top Performing Projects
              </h2>
              <p className="text-sm text-gray-600">
                Highest performing projects by ROI and funding volume
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

          <DataTable<TopProject>
            columns={topProjectColumns}
            data={mockTopProjects}
          />
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Users className="h-8 w-8 text-secondary-500 bg-secondary-50 rounded-lg p-2" />
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  SPV Management
                </h3>
                <p className="text-sm text-gray-600">
                  Review and approve SPV applications
                </p>
              </div>
            </div>
            <Link href="/admin/spv">
              <Button className="w-full">Manage SPVs</Button>
            </Link>
          </Card>

          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Building className="h-8 w-8 text-primary-500 bg-primary-50 rounded-lg p-2" />
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Project Oversight
                </h3>
                <p className="text-sm text-gray-600">
                  Monitor all platform projects
                </p>
              </div>
            </div>
            <Link href="/admin/projects">
              <Button variant="outline" className="w-full">
                View Projects
              </Button>
            </Link>
          </Card>

          <Card className="p-6">
            <div className="flex items-center mb-4">
              <DollarSign className="h-8 w-8 text-support-500 bg-support-50 rounded-lg p-2" />
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Fee Management
                </h3>
                <p className="text-sm text-gray-600">
                  Configure platform fees and revenue
                </p>
              </div>
            </div>
            <Link href="/admin/fees">
              <Button variant="outline" className="w-full">
                Manage Fees
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
