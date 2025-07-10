'use client';

import { useState } from 'react';
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
import {
  Button,
  Card,
  StatsCard,
  DashboardLayout,
  DataTable,
} from '@/components/ui';
import type { Column } from '@/components/ui/DataTable';

interface FeeConfig {
  id: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed';
  currentValue: number;
  proposedValue?: number;
  currency: 'IDR' | 'percentage';
  category: 'platform' | 'transaction' | 'service';
  lastUpdated: string;
  updatedBy: string;
  status: 'active' | 'pending' | 'inactive';
  minValue: number;
  maxValue: number;
}

interface FeeRevenue {
  id: string;
  feeType: string;
  projectName: string;
  amount: number;
  date: string;
  transactionId: string;
  status: 'collected' | 'pending' | 'failed';
}

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
  const [isLoading, setIsLoading] = useState(false);
  const [editingFee, setEditingFee] = useState<string | null>(null);
  const [feeValues, setFeeValues] = useState<Record<string, number>>({});

  const handleRefresh = async () => {
    setIsLoading(true);
    // TODO: Fetch latest fee configuration and revenue data
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  const handleEditFee = (feeId: string, currentValue: number) => {
    setEditingFee(feeId);
    setFeeValues({ ...feeValues, [feeId]: currentValue });
  };

  const handleSaveFee = async (_feeId: string) => {
    // TODO: Update fee configuration on blockchain/backend
    // console.log('Updating fee:', feeId, 'to value:', feeValues[feeId]);
    setEditingFee(null);
  };

  const handleCancelEdit = (feeId: string) => {
    setEditingFee(null);
    const { [feeId]: _removed, ...rest } = feeValues;
    setFeeValues(rest);
  };

  const handleApplyPendingFee = (_feeId: string) => {
    // TODO: Apply pending fee change
    // console.log('Apply pending fee change:', feeId);
  };

  const feeConfigColumns: Column[] = [
    {
      key: 'name',
      label: 'Fee Configuration',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.name}</span>
          <span className="text-sm text-gray-500">{row.description}</span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium mt-1 w-fit ${getCategoryColor(row.category)}`}>
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
                onChange={(e) => setFeeValues({ ...feeValues, [row.id]: parseFloat(e.target.value) })}
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
            Range: {formatFeeValue(row.minValue, row.currency)} - {formatFeeValue(row.maxValue, row.currency)}
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
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(row.status)}`}>
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
              <Button
                size="sm"
                onClick={() => handleSaveFee(row.id)}
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCancelEdit(row.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditFee(row.id, row.currentValue)}
                disabled={row.status === 'inactive'}
              >
                <Edit className="h-4 w-4" />
              </Button>
              {row.status === 'pending' && (
                <Button
                  size="sm"
                  onClick={() => handleApplyPendingFee(row.id)}
                >
                  Apply
                </Button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  const revenueColumns: Column[] = [
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
        <span className="font-medium text-gray-900">{formatCurrency(row.amount)}</span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (_, row) => (
        <span className="text-sm">{new Date(row.date).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'transactionId',
      label: 'Transaction ID',
      render: (_, row) => (
        <span className="text-sm font-mono text-gray-600">{row.transactionId}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => (
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          row.status === 'collected' ? 'text-support-600 bg-support-50' :
          row.status === 'pending' ? 'text-primary-600 bg-primary-50' :
          'text-accent-600 bg-accent-50'
        }`}>
          {row.status.toUpperCase()}
        </span>
      ),
    },
  ];

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
            <p className="text-gray-600">
              Configure platform fees and track revenue
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

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        </div>

        {/* Fee Category Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>

        {/* Fee Configuration */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Fee Configuration
              </h2>
              <p className="text-sm text-gray-600">
                Manage platform fee structure and rates
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Config
              </Button>
            </div>
          </div>

          <DataTable columns={feeConfigColumns} data={mockFeeConfigs} />
        </Card>

        {/* Recent Revenue */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Revenue
              </h2>
              <p className="text-sm text-gray-600">
                Latest fee collections and transactions
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-2" />
                View All
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <DataTable columns={revenueColumns} data={mockRevenueData} />
        </Card>

        {/* Fee Management Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <BarChart3 className="h-8 w-8 text-primary-500 bg-primary-50 rounded-lg p-2" />
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Revenue Analytics
                </h3>
                <p className="text-sm text-gray-600">
                  Detailed revenue analysis and forecasting
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              View Analytics
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Calendar className="h-8 w-8 text-secondary-500 bg-secondary-50 rounded-lg p-2" />
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Fee Schedule
                </h3>
                <p className="text-sm text-gray-600">
                  Plan and schedule fee changes
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Manage Schedule
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-8 w-8 text-support-500 bg-support-50 rounded-lg p-2" />
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Fee Audit
                </h3>
                <p className="text-sm text-gray-600">
                  Audit trail and compliance reporting
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Generate Audit
            </Button>
          </Card>
        </div>

        {/* Important Notice */}
        <Card className="p-6 bg-primary-50 border-primary-200">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-primary-900 mb-2">
                Fee Change Policy
              </h3>
              <p className="text-sm text-primary-800 mb-2">
                All fee changes require a 30-day notice period and must be approved by the platform governance council. 
                Changes will be applied to new projects only, existing projects maintain their original fee structure.
              </p>
              <ul className="text-sm text-primary-800 space-y-1">
                <li>• Platform fees: 1-5% range for sustainability</li>
                <li>• Transaction fees: Fixed amounts to cover operational costs</li>
                <li>• Service fees: Third-party service cost pass-through</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* TODO: Mock Implementation Notes */}
        <Card className="p-6 bg-primary-50 border-primary-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-primary-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-primary-900 mb-2">
                TODO: Mock Implementation Notes
              </h3>
              <ul className="text-sm text-primary-800 space-y-1">
                <li>• Mock blockchain fee configuration updates via smart contracts</li>
                <li>• Mock automated fee collection and revenue tracking</li>
                <li>• Mock fee change approval workflow with governance voting</li>
                <li>• Mock real-time revenue analytics and reporting dashboard</li>
                <li>• Mock fee audit trail and compliance reporting system</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}