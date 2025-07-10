'use client';

import { useState } from 'react';
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

interface PlatformStats {
  totalProjects: number;
  totalUsers: number;
  totalFundingVolume: number;
  platformRevenue: number;
  monthlyGrowth: {
    projects: number;
    users: number;
    funding: number;
    revenue: number;
  };
}

interface RecentActivity {
  id: string;
  type:
    | 'spv_registration'
    | 'project_launch'
    | 'large_investment'
    | 'user_signup'
    | 'system_alert';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  user?: string;
  project?: string;
}

interface TopProject {
  id: string;
  name: string;
  spv: string;
  totalFunding: number;
  investorCount: number;
  status: 'funding' | 'active' | 'operational';
  roi: number;
}

interface SystemHealth {
  activeProjects: number;
  pendingApprovals: number;
  systemUptime: number;
  transactionVolume24h: number;
}

const mockPlatformStats: PlatformStats = {
  totalProjects: 156,
  totalUsers: 2347,
  totalFundingVolume: 45200000000000, // 45.2T IDR
  platformRevenue: 2100000000000, // 2.1T IDR
  monthlyGrowth: {
    projects: 12.5,
    users: 18.3,
    funding: 24.7,
    revenue: 15.8,
  },
};

const mockRecentActivity: RecentActivity[] = [
  {
    id: '1',
    type: 'spv_registration',
    title: 'New SPV Registration',
    description: 'PT Infrastruktur Nusantara applied for platform access',
    timestamp: '2025-01-10T08:30:00Z',
    user: 'PT Infrastruktur Nusantara',
  },
  {
    id: '2',
    type: 'project_launch',
    title: 'Project Launched',
    description: 'Bali-Lombok Bridge project went live for investment',
    timestamp: '2025-01-10T07:15:00Z',
    project: 'Bali-Lombok Bridge',
    amount: 3500000000000, // 3.5T IDR
  },
  {
    id: '3',
    type: 'large_investment',
    title: 'Large Investment',
    description:
      'Institutional investor committed ₹250B to Jakarta MRT Phase 3',
    timestamp: '2025-01-10T06:45:00Z',
    amount: 250000000000, // 250B IDR
    project: 'Jakarta MRT Phase 3',
  },
  {
    id: '4',
    type: 'user_signup',
    title: 'User Milestone',
    description: '500 new users registered in the last 24 hours',
    timestamp: '2025-01-10T06:00:00Z',
  },
  {
    id: '5',
    type: 'system_alert',
    title: 'System Maintenance',
    description: 'Scheduled maintenance completed successfully',
    timestamp: '2025-01-10T02:00:00Z',
  },
];

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

const mockSystemHealth: SystemHealth = {
  activeProjects: 89,
  pendingApprovals: 12,
  systemUptime: 99.8,
  transactionVolume24h: 1250000000000, // 1.25T IDR
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

  const handleRefresh = async () => {
    setIsLoading(true);
    // Mock API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  const topProjectColumns: Column[] = [
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

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Projects"
            value={mockPlatformStats.totalProjects.toString()}
            icon={<Building className="w-4 h-4" />}
            change={mockPlatformStats.monthlyGrowth.projects}
            changeType="increase"
            description="Active platform projects"
          />
          <StatsCard
            title="Total Users"
            value={mockPlatformStats.totalUsers.toLocaleString()}
            icon={<Users className="w-4 h-4" />}
            change={mockPlatformStats.monthlyGrowth.users}
            changeType="increase"
            description="Registered investors"
          />
          <StatsCard
            title="Funding Volume"
            value={formatCurrency(mockPlatformStats.totalFundingVolume)}
            icon={<DollarSign className="w-4 h-4" />}
            change={mockPlatformStats.monthlyGrowth.funding}
            changeType="increase"
            description="Total platform funding"
          />
          <StatsCard
            title="Platform Revenue"
            value={formatCurrency(mockPlatformStats.platformRevenue)}
            icon={<TrendingUp className="w-4 h-4" />}
            change={mockPlatformStats.monthlyGrowth.revenue}
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
                  {mockSystemHealth.activeProjects}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending Approvals</span>
                <span className="font-medium text-primary-500">
                  {mockSystemHealth.pendingApprovals}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">System Uptime</span>
                <span className="font-medium text-support-500">
                  {mockSystemHealth.systemUptime}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">24h Volume</span>
                <span className="font-medium">
                  {formatCurrency(mockSystemHealth.transactionVolume24h)}
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
              {mockRecentActivity.map(activity => (
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
              ))}
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

          <DataTable
            columns={topProjectColumns}
            data={mockTopProjects}
            searchPlaceholder="Search projects..."
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
