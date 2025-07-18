'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  DollarSign,
  TrendingUp,
  Settings,
  History,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Download,
  RefreshCw,
  Edit,
  Save,
  X,
  Info,
  BarChart3,
  Wallet,
  Receipt,
} from 'lucide-react';
import { StatsCard, DashboardLayout, DataTable } from '@/components/ui';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { PageTransition } from '@/components/ui/PageTransition';
import { ScrollReveal, StaggeredList } from '@/components/ui/ScrollAnimations';
import { toast } from '@/components/ui/AnimatedNotification';
import type { Column } from '@/components/ui/DataTable';
import type { FeeConfig, FeeRevenue } from '@/types';

interface FeeStats {
  totalRevenue: number;
  monthlyRevenue: number;
  platformFees: number;
  transactionFees: number;
  serviceFees: number;
  monthlyGrowth: number;
  averageFeePerProject: number;
  totalTransactions: number;
}

// Mock data
const mockFeeConfigs: FeeConfig[] = [
  {
    id: 'listing_fee',
    name: 'Project Listing Fee',
    description: 'Fee charged when SPV creates a new tokenized project',
    type: 'percentage',
    currentValue: 2.0,
    currency: 'percentage',
    category: 'platform',
    lastUpdated: '2024-12-15',
    updatedBy: 'Admin User',
    status: 'active',
    minValue: 1.0,
    maxValue: 5.0,
  },
  {
    id: 'management_fee',
    name: 'Project Management Fee',
    description: 'Monthly fee taken from project profits',
    type: 'percentage',
    currentValue: 5.0,
    currency: 'percentage',
    category: 'platform',
    lastUpdated: '2024-11-20',
    updatedBy: 'Admin User',
    status: 'active',
    minValue: 2.0,
    maxValue: 10.0,
  },
  {
    id: 'transaction_fee',
    name: 'Investment Transaction Fee',
    description: 'Fee per investment transaction',
    type: 'fixed',
    currentValue: 5000,
    currency: 'IDR',
    category: 'transaction',
    lastUpdated: '2024-10-10',
    updatedBy: 'Admin User',
    status: 'active',
    minValue: 1000,
    maxValue: 10000,
  },
  {
    id: 'kyc_fee',
    name: 'KYC Verification Fee',
    description: 'Fee for third-party KYC verification service',
    type: 'fixed',
    currentValue: 15000,
    currency: 'IDR',
    category: 'service',
    lastUpdated: '2024-09-05',
    updatedBy: 'Admin User',
    status: 'active',
    minValue: 10000,
    maxValue: 25000,
  },
  {
    id: 'withdrawal_fee',
    name: 'Profit Withdrawal Fee',
    description: 'Fee for withdrawing profits to bank account',
    type: 'percentage',
    currentValue: 0.5,
    proposedValue: 0.3,
    currency: 'percentage',
    category: 'transaction',
    lastUpdated: '2024-08-20',
    updatedBy: 'Admin User',
    status: 'pending',
    minValue: 0.1,
    maxValue: 2.0,
  },
];

const mockRevenueData: FeeRevenue[] = [
  {
    id: 'rev_001',
    feeType: 'Project Listing Fee',
    projectName: 'Jakarta-Surabaya Toll Road Extension',
    amount: 50000000000, // 50B IDR (2% of 2.5T)
    date: '2025-01-08',
    transactionId: 'TX_20250108_001',
    status: 'collected',
  },
  {
    id: 'rev_002',
    feeType: 'Project Management Fee',
    projectName: 'Bandung Smart Water Management',
    amount: 1562500000, // 1.56B IDR (5% of monthly profit)
    date: '2025-01-07',
    transactionId: 'TX_20250107_002',
    status: 'collected',
  },
  {
    id: 'rev_003',
    feeType: 'Investment Transaction Fee',
    projectName: 'Medan Port Modernization',
    amount: 6250000, // 6.25M IDR (1250 investors * 5000 IDR)
    date: '2025-01-06',
    transactionId: 'TX_20250106_003',
    status: 'collected',
  },
  {
    id: 'rev_004',
    feeType: 'KYC Verification Fee',
    projectName: 'Platform Services',
    amount: 18750000, // 18.75M IDR (1250 users * 15000 IDR)
    date: '2025-01-05',
    transactionId: 'TX_20250105_004',
    status: 'collected',
  },
];

const mockStats: FeeStats = {
  totalRevenue: 76562500000, // 76.56B IDR
  monthlyRevenue: 12500000000, // 12.5B IDR
  platformFees: 51562500000, // 51.56B IDR
  transactionFees: 6250000000, // 6.25B IDR
  serviceFees: 18750000000, // 18.75B IDR
  monthlyGrowth: 8.5,
  averageFeePerProject: 15312500000, // 15.31B IDR
  totalTransactions: 2875,
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

const formatFeeValue = (value: number, currency: string) => {
  if (currency === 'percentage') {
    return `${value}%`;
  }
  return formatCurrency(value);
};

const getCategoryColor = (category: FeeConfig['category']) => {
  switch (category) {
    case 'platform':
      return 'text-primary-600 bg-primary-50';
    case 'transaction':
      return 'text-secondary-600 bg-secondary-50';
    case 'service':
      return 'text-support-600 bg-support-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const getStatusColor = (status: FeeConfig['status']) => {
  switch (status) {
    case 'active':
      return 'text-support-600 bg-support-50';
    case 'pending':
      return 'text-primary-600 bg-primary-50';
    case 'inactive':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export default function AdminFeesPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [editingFee, setEditingFee] = useState<string | null>(null);
  const [feeValues, setFeeValues] = useState<Record<string, number>>({});

  // Authentication guard
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      window.location.href = '/auth/signin';
      return;
    }
  }, [isAuthenticated, isAdmin]);

  const handleRefresh = async () => {
    setIsLoading(true);
    // TODO: Fetch latest fee configuration and revenue data
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    toast.success('Data refreshed successfully', {
      message: 'Fee configuration and revenue data updated.',
    });
  };

  const handleEditFee = (feeId: string, currentValue: number) => {
    setEditingFee(feeId);
    setFeeValues({ ...feeValues, [feeId]: currentValue });
  };

  const handleSaveFee = async (_feeId: string) => {
    // TODO: Update fee configuration on blockchain/backend
    // console.log('Updating fee:', feeId, 'to value:', feeValues[feeId]);
    _feeId;
    setEditingFee(null);
    toast.success('Fee configuration updated', {
      message: 'Changes have been saved successfully.',
    });
  };

  const handleCancelEdit = (feeId: string) => {
    setEditingFee(null);
    const { [feeId]: _removed, ...rest } = feeValues;

    _removed;
    setFeeValues(rest);
  };

  const handleApplyPendingFee = (_feeId: string) => {
    // TODO: Apply pending fee change
    // console.log('Apply pending fee change:', feeId);
    _feeId;
    toast.success('Pending fee change applied', {
      message: 'Fee configuration is now active.',
    });
  };

  const feeConfigColumns: Column<FeeConfig>[] = [
    {
      key: 'name',
      label: 'Fee Configuration',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.name}</span>
          <span className="text-sm text-gray-500">{row.description}</span>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium mt-1 w-fit ${getCategoryColor(row.category)}`}
          >
            {row.category.toUpperCase()}
          </span>
        </div>
      ),
    },
    {
      key: 'currentValue',
      label: 'Current Value',
      render: (_, row) => (
        <div className="flex flex-col">
          {editingFee === row.id ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={feeValues[row.id] || row.currentValue}
                onChange={e =>
                  setFeeValues({
                    ...feeValues,
                    [row.id]: parseFloat(e.target.value),
                  })
                }
                min={row.minValue}
                max={row.maxValue}
                step={row.type === 'percentage' ? 0.1 : 1000}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <span className="text-sm text-gray-500">
                {row.currency === 'percentage' ? '%' : 'IDR'}
              </span>
            </div>
          ) : (
            <span className="font-medium text-gray-900">
              {formatFeeValue(row.currentValue, row.currency)}
            </span>
          )}
          <span className="text-xs text-gray-500">
            Range: {formatFeeValue(row.minValue, row.currency)} -{' '}
            {formatFeeValue(row.maxValue, row.currency)}
          </span>
          {row.proposedValue && (
            <span className="text-xs text-primary-600">
              Proposed: {formatFeeValue(row.proposedValue, row.currency)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => (
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(row.status)}`}
        >
          {row.status.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'lastUpdated',
      label: 'Last Updated',
      render: (_, row) => (
        <div className="flex flex-col text-sm">
          <span>{new Date(row.lastUpdated).toLocaleDateString()}</span>
          <span className="text-gray-500">by {row.updatedBy}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          {editingFee === row.id ? (
            <>
              <AnimatedButton
                size="sm"
                onClick={() => handleSaveFee(row.id)}
                ripple
              >
                <Save className="h-4 w-4" />
              </AnimatedButton>
              <AnimatedButton
                variant="outline"
                size="sm"
                onClick={() => handleCancelEdit(row.id)}
                ripple
              >
                <X className="h-4 w-4" />
              </AnimatedButton>
            </>
          ) : (
            <>
              <AnimatedButton
                variant="outline"
                size="sm"
                onClick={() => handleEditFee(row.id, row.currentValue)}
                disabled={row.status === 'inactive'}
                ripple
              >
                <Edit className="h-4 w-4" />
              </AnimatedButton>
              {row.status === 'pending' && (
                <AnimatedButton
                  size="sm"
                  onClick={() => handleApplyPendingFee(row.id)}
                  ripple
                >
                  Apply
                </AnimatedButton>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  const revenueColumns: Column<FeeRevenue>[] = [
    {
      key: 'feeType',
      label: 'Fee Type',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.feeType}</span>
          <span className="text-sm text-gray-500">{row.projectName}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (_, row) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (_, row) => (
        <span className="text-sm">
          {new Date(row.date).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'transactionId',
      label: 'Transaction ID',
      render: (_, row) => (
        <span className="text-sm font-mono text-gray-600">
          {row.transactionId}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => (
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            row.status === 'collected'
              ? 'text-support-600 bg-support-50'
              : row.status === 'pending'
                ? 'text-primary-600 bg-primary-50'
                : 'text-accent-600 bg-accent-50'
          }`}
        >
          {row.status.toUpperCase()}
        </span>
      ),
    },
  ];

  return (
    <DashboardLayout userType="admin">
      <PageTransition type="fade" duration={300}>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 relative overflow-hidden">
          {/* Fluid background shapes */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full opacity-20 animate-[float_3s_ease-in-out_infinite] blur-sm"></div>
            <div className="absolute top-1/4 right-20 w-48 h-48 bg-gradient-to-br from-primary-300 to-primary-400 rounded-full opacity-15 animate-[float_4s_ease-in-out_infinite_reverse] blur-sm"></div>
            <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full opacity-25 animate-[float_5s_ease-in-out_infinite] blur-sm"></div>
            <div className="absolute bottom-10 right-10 w-36 h-36 bg-gradient-to-br from-primary-300 to-primary-400 rounded-full opacity-20 animate-[float_6s_ease-in-out_infinite_reverse] blur-sm"></div>
          </div>

          <div className="space-y-6 p-6 relative z-10">
            {/* Header */}
            <ScrollReveal animation="slide-up" delay={0}>
              <div className="glass-modern p-6 rounded-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                      Fee Management
                    </h1>
                    <p className="text-gray-600 text-lg">
                      Configure platform fees and track revenue
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <AnimatedButton
                      variant="secondary"
                      size="lg"
                      onClick={handleRefresh}
                      loading={isLoading}
                      ripple
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </AnimatedButton>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Revenue Stats */}
            <StaggeredList
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              itemDelay={100}
            >
              <StatsCard
                title="Total Revenue"
                value={formatCurrency(mockStats.totalRevenue)}
                icon={<DollarSign className="w-4 h-4" />}
                change={mockStats.monthlyGrowth}
                changeType="increase"
                description="All time platform revenue"
              />
              <StatsCard
                title="Monthly Revenue"
                value={formatCurrency(mockStats.monthlyRevenue)}
                icon={<TrendingUp className="w-4 h-4" />}
                change={mockStats.monthlyGrowth}
                changeType="increase"
                description="Current month revenue"
              />
              <StatsCard
                title="Avg. Fee per Project"
                value={formatCurrency(mockStats.averageFeePerProject)}
                icon={<BarChart3 className="w-4 h-4" />}
                change={0}
                changeType="neutral"
                description="Average revenue per project"
              />
              <StatsCard
                title="Total Transactions"
                value={mockStats.totalTransactions.toLocaleString()}
                icon={<Receipt className="w-4 h-4" />}
                change={12.3}
                changeType="increase"
                description="Fee-generating transactions"
              />
            </StaggeredList>

            {/* Fee Category Breakdown */}
            <StaggeredList
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              itemDelay={150}
            >
              <StatsCard
                title="Platform Fees"
                value={formatCurrency(mockStats.platformFees)}
                icon={<Wallet className="w-4 h-4" />}
                change={15.2}
                changeType="increase"
                description="Listing & management fees"
              />
              <StatsCard
                title="Transaction Fees"
                value={formatCurrency(mockStats.transactionFees)}
                icon={<Receipt className="w-4 h-4" />}
                change={8.7}
                changeType="increase"
                description="Investment & withdrawal fees"
              />
              <StatsCard
                title="Service Fees"
                value={formatCurrency(mockStats.serviceFees)}
                icon={<Settings className="w-4 h-4" />}
                change={5.1}
                changeType="increase"
                description="KYC & other services"
              />
            </StaggeredList>

            {/* Fee Configuration */}
            <ScrollReveal animation="slide-up" delay={200}>
              <div className="glass-modern p-6 rounded-xl">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                      Fee Configuration
                    </h2>
                    <p className="text-gray-600">
                      Manage platform fee structure and rates
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <AnimatedButton
                      variant="secondary"
                      onClick={() =>
                        toast.info('Exporting fee configuration', {
                          message: 'Download will start shortly...',
                        })
                      }
                      ripple
                    >
                      <Download className="h-4 w-4" />
                      Export Config
                    </AnimatedButton>
                  </div>
                </div>

                <DataTable<FeeConfig>
                  columns={feeConfigColumns}
                  data={mockFeeConfigs}
                />
              </div>
            </ScrollReveal>

            {/* Recent Revenue */}
            <ScrollReveal animation="slide-up" delay={300}>
              <div className="glass-modern p-6 rounded-xl">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                      Recent Revenue
                    </h2>
                    <p className="text-gray-600">
                      Latest fee collections and transactions
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <AnimatedButton
                      variant="secondary"
                      onClick={() =>
                        toast.info('Viewing all revenue history', {
                          message: 'Loading complete history...',
                        })
                      }
                      ripple
                    >
                      <History className="h-4 w-4" />
                      View All
                    </AnimatedButton>
                    <AnimatedButton
                      variant="secondary"
                      onClick={() =>
                        toast.info('Exporting revenue data', {
                          message: 'Download will start shortly...',
                        })
                      }
                      ripple
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </AnimatedButton>
                  </div>
                </div>

                <DataTable<FeeRevenue>
                  columns={revenueColumns}
                  data={mockRevenueData}
                />
              </div>
            </ScrollReveal>

            {/* Fee Management Actions */}
            <StaggeredList
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              itemDelay={200}
            >
              <div className="glass-modern p-6 rounded-xl hover-lift">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-bold text-gray-900">
                      Revenue Analytics
                    </h3>
                    <p className="text-sm text-gray-600">
                      Detailed revenue analysis and forecasting
                    </p>
                  </div>
                </div>
                <AnimatedButton
                  variant="secondary"
                  className="w-full"
                  onClick={() =>
                    toast.info('Opening revenue analytics', {
                      message: 'Loading analytics dashboard...',
                    })
                  }
                  ripple
                >
                  View Analytics
                </AnimatedButton>
              </div>

              <div className="glass-modern p-6 rounded-xl hover-lift">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-bold text-gray-900">
                      Fee Schedule
                    </h3>
                    <p className="text-sm text-gray-600">
                      Plan and schedule fee changes
                    </p>
                  </div>
                </div>
                <AnimatedButton
                  variant="secondary"
                  className="w-full"
                  onClick={() =>
                    toast.info('Opening fee scheduler', {
                      message: 'Loading schedule management...',
                    })
                  }
                  ripple
                >
                  Manage Schedule
                </AnimatedButton>
              </div>

              <div className="glass-modern p-6 rounded-xl hover-lift">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-support-500 to-support-600 rounded-xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-bold text-gray-900">
                      Fee Audit
                    </h3>
                    <p className="text-sm text-gray-600">
                      Audit trail and compliance reporting
                    </p>
                  </div>
                </div>
                <AnimatedButton
                  variant="secondary"
                  className="w-full"
                  onClick={() =>
                    toast.info('Generating audit report', {
                      message: 'Preparing compliance report...',
                    })
                  }
                  ripple
                >
                  Generate Audit
                </AnimatedButton>
              </div>
            </StaggeredList>

            {/* Important Notice */}
            <ScrollReveal animation="fade" delay={400}>
              <div className="glass-modern p-6 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
                    <Info className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary-900 mb-2">
                      Fee Change Policy
                    </h3>
                    <p className="text-sm text-primary-800 mb-2">
                      All fee changes require a 30-day notice period and must be
                      approved by the platform governance council. Changes will
                      be applied to new projects only, existing projects
                      maintain their original fee structure.
                    </p>
                    <ul className="text-sm text-primary-800 space-y-1">
                      <li>• Platform fees: 1-5% range for sustainability</li>
                      <li>
                        • Transaction fees: Fixed amounts to cover operational
                        costs
                      </li>
                      <li>
                        • Service fees: Third-party service cost pass-through
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* TODO: Mock Implementation Notes */}
            <ScrollReveal animation="fade" delay={500}>
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
                        • Mock blockchain fee configuration updates via smart
                        contracts
                      </li>
                      <li>
                        • Mock automated fee collection and revenue tracking
                      </li>
                      <li>
                        • Mock fee change approval workflow with governance
                        voting
                      </li>
                      <li>
                        • Mock real-time revenue analytics and reporting
                        dashboard
                      </li>
                      <li>
                        • Mock fee audit trail and compliance reporting system
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
