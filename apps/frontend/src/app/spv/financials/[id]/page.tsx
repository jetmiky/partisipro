'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  FileText,
  Download,
  Upload,
  Calculator,
  PieChart,
  BarChart3,
  Receipt,
  Wallet,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  Plus,
  Send,
  Eye,
  Edit3,
  Trash2,
} from 'lucide-react';
import { Button, Card, DashboardLayout, StatsCard, Modal, Input } from '@/components/ui';

interface ProjectFinancials {
  projectId: string;
  projectTitle: string;
  currentPeriod: {
    revenue: number;
    expenses: number;
    netProfit: number;
    distributionAmount: number;
  };
  treasuryBalance: {
    operational: number;
    distribution: number;
    reserve: number;
    total: number;
  };
  distributionHistory: {
    id: string;
    period: string;
    amount: number;
    recipientCount: number;
    status: 'pending' | 'executed' | 'failed';
    executionDate: string;
    transactionHash?: string;
  }[];
  expenses: {
    id: string;
    category: string;
    amount: number;
    description: string;
    date: string;
    status: 'approved' | 'pending' | 'rejected';
    receipt?: string;
    submittedBy: string;
  }[];
  tokenHolders: {
    address: string;
    tokenBalance: number;
    sharePercentage: number;
    expectedDistribution: number;
  }[];
  performanceMetrics: {
    totalRevenue: number;
    totalDistributed: number;
    averageROI: number;
    operationalEfficiency: number;
  };
}

interface ExpenseForm {
  category: string;
  amount: string;
  description: string;
  date: string;
  receipt?: File;
}

const mockFinancials: ProjectFinancials = {
  projectId: '1',
  projectTitle: 'Jakarta-Bandung High-Speed Rail Extension',
  currentPeriod: {
    revenue: 1250000000, // 1.25 billion IDR
    expenses: 450000000,  // 450 million IDR
    netProfit: 800000000, // 800 million IDR
    distributionAmount: 720000000, // 720 million IDR (90% of profit)
  },
  treasuryBalance: {
    operational: 2500000000,  // 2.5 billion IDR
    distribution: 720000000,  // 720 million IDR
    reserve: 500000000,       // 500 million IDR
    total: 3720000000,        // 3.72 billion IDR
  },
  distributionHistory: [
    {
      id: '1',
      period: 'Q4 2023',
      amount: 680000000,
      recipientCount: 245,
      status: 'executed',
      executionDate: '2024-01-15T10:00:00Z',
      transactionHash: '0x1234567890abcdef',
    },
    {
      id: '2',
      period: 'Q3 2023',
      amount: 620000000,
      recipientCount: 238,
      status: 'executed',
      executionDate: '2023-10-15T10:00:00Z',
      transactionHash: '0xabcdef1234567890',
    },
    {
      id: '3',
      period: 'Q1 2024',
      amount: 720000000,
      recipientCount: 252,
      status: 'pending',
      executionDate: '2024-04-15T10:00:00Z',
    },
  ],
  expenses: [
    {
      id: '1',
      category: 'Maintenance',
      amount: 150000000,
      description: 'Monthly track maintenance and inspection',
      date: '2024-01-01',
      status: 'approved',
      receipt: 'receipt_001.pdf',
      submittedBy: 'Operations Team',
    },
    {
      id: '2',
      category: 'Operations',
      amount: 200000000,
      description: 'Staff salaries and operational costs',
      date: '2024-01-01',
      status: 'approved',
      submittedBy: 'HR Department',
    },
    {
      id: '3',
      category: 'Marketing',
      amount: 75000000,
      description: 'Q1 marketing and promotional activities',
      date: '2024-01-15',
      status: 'pending',
      receipt: 'receipt_003.pdf',
      submittedBy: 'Marketing Team',
    },
    {
      id: '4',
      category: 'Technology',
      amount: 25000000,
      description: 'System upgrades and IT infrastructure',
      date: '2024-01-20',
      status: 'rejected',
      submittedBy: 'IT Department',
    },
  ],
  tokenHolders: [
    {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      tokenBalance: 50000,
      sharePercentage: 2.0,
      expectedDistribution: 14400000, // 14.4 million IDR
    },
    {
      address: '0xabcdef1234567890abcdef1234567890abcdef12',
      tokenBalance: 30000,
      sharePercentage: 1.2,
      expectedDistribution: 8640000, // 8.64 million IDR
    },
    {
      address: '0x567890abcdef1234567890abcdef1234567890ab',
      tokenBalance: 75000,
      sharePercentage: 3.0,
      expectedDistribution: 21600000, // 21.6 million IDR
    },
  ],
  performanceMetrics: {
    totalRevenue: 15750000000, // 15.75 billion IDR
    totalDistributed: 12800000000, // 12.8 billion IDR
    averageROI: 12.5, // 12.5%
    operationalEfficiency: 85.7, // 85.7%
  },
};

const expenseCategories = [
  'Maintenance', 'Operations', 'Marketing', 'Technology', 'Legal',
  'Insurance', 'Utilities', 'Security', 'Training', 'Consulting'
];

export default function SPVFinancialsPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [activeTab, setActiveTab] = useState('overview');
  const [financials] = useState<ProjectFinancials>(mockFinancials);
  const [distributionModalOpen, setDistributionModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [distributionAmount, setDistributionAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>({
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'executed':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'executed':
        return 'Executed';
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  const handleDistribution = () => {
    // TODO: Implement Treasury contract integration for profit distribution
    console.log('Distributing', distributionAmount, 'IDR to token holders');
    setDistributionModalOpen(false);
    setDistributionAmount('');
  };

  const handleExpenseSubmit = () => {
    // TODO: Implement expense submission with file upload
    console.log('Submitting expense:', expenseForm);
    setExpenseModalOpen(false);
    setExpenseForm({
      category: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setExpenseForm(prev => ({ ...prev, receipt: file }));
    }
  };

  const filteredExpenses = financials.expenses.filter(expense => {
    const matchesStatus = filterStatus === 'all' || expense.status === filterStatus;
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const tabs = [
    { id: 'overview', label: 'Financial Overview' },
    { id: 'distribution', label: 'Profit Distribution' },
    { id: 'expenses', label: 'Expense Management' },
    { id: 'treasury', label: 'Treasury Management' },
    { id: 'reports', label: 'Reports & Analytics' },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Current Period Revenue"
          value={formatCurrency(financials.currentPeriod.revenue)}
          icon={<DollarSign className="w-5 h-5" />}
          trend={{ value: 15.2, isPositive: true }}
        />
        <StatsCard
          title="Operating Expenses"
          value={formatCurrency(financials.currentPeriod.expenses)}
          icon={<TrendingDown className="w-5 h-5" />}
          trend={{ value: 8.3, isPositive: false }}
        />
        <StatsCard
          title="Net Profit"
          value={formatCurrency(financials.currentPeriod.netProfit)}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={{ value: 22.7, isPositive: true }}
        />
        <StatsCard
          title="Distribution Ready"
          value={formatCurrency(financials.currentPeriod.distributionAmount)}
          icon={<Users className="w-5 h-5" />}
          trend={{ value: 18.5, isPositive: true }}
        />
      </div>

      {/* Treasury Balance */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Treasury Balance</h3>
          <Button variant="secondary" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Manage Treasury
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(financials.treasuryBalance.operational)}
            </div>
            <div className="text-sm text-blue-800">Operational Fund</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(financials.treasuryBalance.distribution)}
            </div>
            <div className="text-sm text-green-800">Distribution Fund</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(financials.treasuryBalance.reserve)}
            </div>
            <div className="text-sm text-purple-800">Reserve Fund</div>
          </div>
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <div className="text-2xl font-bold text-primary-600">
              {formatCurrency(financials.treasuryBalance.total)}
            </div>
            <div className="text-sm text-primary-800">Total Balance</div>
          </div>
        </div>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Key Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Revenue (All Time)</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(financials.performanceMetrics.totalRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Distributed</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(financials.performanceMetrics.totalDistributed)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average ROI</span>
              <span className="font-medium text-green-600">
                {financials.performanceMetrics.averageROI}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Operational Efficiency</span>
              <span className="font-medium text-blue-600">
                {financials.performanceMetrics.operationalEfficiency}%
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Distribution History</h3>
          <div className="space-y-3">
            {financials.distributionHistory.slice(0, 3).map(distribution => (
              <div key={distribution.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{distribution.period}</p>
                  <p className="text-sm text-gray-500">
                    {distribution.recipientCount} recipients
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(distribution.amount)}
                  </p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(distribution.status)}`}>
                    {getStatusLabel(distribution.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderDistribution = () => (
    <div className="space-y-6">
      {/* Distribution Control */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Execute Profit Distribution</h3>
          <Button
            variant="primary"
            onClick={() => setDistributionModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Distribute Profits
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(financials.currentPeriod.distributionAmount)}
            </div>
            <div className="text-sm text-green-800">Available for Distribution</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">
              {financials.tokenHolders.length}
            </div>
            <div className="text-sm text-blue-800">Token Holders</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-xl font-bold text-purple-600">
              90%
            </div>
            <div className="text-sm text-purple-800">Distribution Rate</div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Distribution Notice</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Profit distribution requires multi-signature approval and will be executed on-chain. 
                Platform management fee (10%) will be automatically deducted.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Token Holders Preview */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Distribution Preview</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Holder Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Token Balance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Share %
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distribution Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {financials.tokenHolders.slice(0, 5).map((holder, index) => (
                <tr key={index}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm text-gray-900">
                      {holder.address.slice(0, 8)}...{holder.address.slice(-6)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">
                      {holder.tokenBalance.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">
                      {holder.sharePercentage.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="font-medium text-green-600">
                      {formatCurrency(holder.expectedDistribution)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-center">
          <Button variant="secondary" className="text-sm">
            View All {financials.tokenHolders.length} Holders
          </Button>
        </div>
      </Card>

      {/* Distribution History */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Distribution History</h3>
        <div className="space-y-4">
          {financials.distributionHistory.map(distribution => (
            <div key={distribution.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{distribution.period} Distribution</p>
                  <p className="text-sm text-gray-600">
                    {distribution.recipientCount} recipients • {formatDateTime(distribution.executionDate)}
                  </p>
                  {distribution.transactionHash && (
                    <p className="text-xs text-gray-500 font-mono">
                      TX: {distribution.transactionHash}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {formatCurrency(distribution.amount)}
                </p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(distribution.status)}`}>
                  {getStatusLabel(distribution.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderExpenses = () => (
    <div className="space-y-6">
      {/* Expense Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Expense Management</h2>
          <p className="text-gray-600">Track and manage project operational expenses</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setExpenseModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </div>

      {/* Expense Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(financials.currentPeriod.expenses)}
          </div>
          <div className="text-sm text-gray-600">Total Expenses</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-xl font-bold text-green-600">
            {financials.expenses.filter(e => e.status === 'approved').length}
          </div>
          <div className="text-sm text-gray-600">Approved</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-xl font-bold text-yellow-600">
            {financials.expenses.filter(e => e.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-xl font-bold text-red-600">
            {financials.expenses.filter(e => e.status === 'rejected').length}
          </div>
          <div className="text-sm text-gray-600">Rejected</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
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
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </Card>

      {/* Expenses Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expense Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.map(expense => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">{expense.description}</p>
                      <p className="text-sm text-gray-500">By {expense.submittedBy}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">
                      {formatCurrency(expense.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-900">{formatDate(expense.date)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}>
                      {getStatusLabel(expense.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" className="text-sm p-2">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {expense.status === 'pending' && (
                        <>
                          <Button variant="secondary" className="text-sm p-2">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button variant="accent" className="text-sm p-2">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {expense.receipt && (
                        <Button variant="secondary" className="text-sm">
                          <Receipt className="w-4 h-4 mr-1" />
                          Receipt
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderTreasury = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Treasury Management</h2>
        <p className="text-gray-600">Monitor and manage project treasury funds</p>
      </div>

      {/* Treasury Overview */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Treasury Balance Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <Wallet className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(financials.treasuryBalance.operational)}
            </div>
            <div className="text-sm text-blue-800 font-medium">Operational Fund</div>
            <div className="text-xs text-blue-600 mt-1">For daily operations</div>
          </div>
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(financials.treasuryBalance.distribution)}
            </div>
            <div className="text-sm text-green-800 font-medium">Distribution Fund</div>
            <div className="text-xs text-green-600 mt-1">Ready for investors</div>
          </div>
          <div className="text-center p-6 bg-purple-50 rounded-lg">
            <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(financials.treasuryBalance.reserve)}
            </div>
            <div className="text-sm text-purple-800 font-medium">Reserve Fund</div>
            <div className="text-xs text-purple-600 mt-1">Emergency reserves</div>
          </div>
          <div className="text-center p-6 bg-primary-50 rounded-lg">
            <Calculator className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-primary-600">
              {formatCurrency(financials.treasuryBalance.total)}
            </div>
            <div className="text-sm text-primary-800 font-medium">Total Balance</div>
            <div className="text-xs text-primary-600 mt-1">Combined funds</div>
          </div>
        </div>
      </Card>

      {/* Fund Allocation */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Fund Allocation</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Operational (67%)</span>
              <span className="text-sm text-gray-600">{formatCurrency(financials.treasuryBalance.operational)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '67%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Distribution (19%)</span>
              <span className="text-sm text-gray-600">{formatCurrency(financials.treasuryBalance.distribution)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '19%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Reserve (14%)</span>
              <span className="text-sm text-gray-600">{formatCurrency(financials.treasuryBalance.reserve)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '14%' }}></div>
            </div>
          </div>
        </div>
      </Card>

      {/* Treasury Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Fund Transfer</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="operational">Operational Fund</option>
                <option value="reserve">Reserve Fund</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="distribution">Distribution Fund</option>
                <option value="operational">Operational Fund</option>
                <option value="reserve">Reserve Fund</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount (IDR)</label>
              <Input type="number" placeholder="Enter amount" />
            </div>
            <Button variant="primary" className="w-full">
              Transfer Funds
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button variant="secondary" className="w-full justify-start">
              <Upload className="w-4 h-4 mr-2" />
              Deposit Revenue
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              <Download className="w-4 h-4 mr-2" />
              Withdraw Funds
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Fees
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600">Generate and download financial reports</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setReportModalOpen(true)}
          className="flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Generate Report
        </Button>
      </div>

      {/* Performance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue Trends</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Q1 2024</span>
              <span className="font-medium text-green-600">{formatCurrency(1250000000)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Q4 2023</span>
              <span className="font-medium text-green-600">{formatCurrency(1180000000)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Q3 2023</span>
              <span className="font-medium text-green-600">{formatCurrency(1050000000)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Q2 2023</span>
              <span className="font-medium text-green-600">{formatCurrency(980000000)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Maintenance</span>
              <span className="font-medium">33%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '33%' }}></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Operations</span>
              <span className="font-medium">44%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '44%' }}></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Marketing</span>
              <span className="font-medium">17%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '17%' }}></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Technology</span>
              <span className="font-medium">6%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '6%' }}></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Available Reports */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Available Reports</h3>
        <div className="space-y-3">
          {[
            { title: 'Q1 2024 Financial Statement', type: 'Financial', date: '2024-04-01', status: 'ready' },
            { title: 'Annual Distribution Report 2023', type: 'Distribution', date: '2024-01-31', status: 'ready' },
            { title: 'Expense Audit Report', type: 'Audit', date: '2024-03-15', status: 'processing' },
            { title: 'Treasury Balance Report', type: 'Treasury', date: '2024-03-31', status: 'ready' },
            { title: 'Regulatory Compliance Report', type: 'Compliance', date: '2024-02-28', status: 'ready' },
          ].map((report, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{report.title}</p>
                  <p className="text-sm text-gray-500">{report.type} • Generated on {formatDate(report.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  report.status === 'ready' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {report.status === 'ready' ? 'Ready' : 'Processing'}
                </span>
                {report.status === 'ready' && (
                  <Button variant="secondary" className="text-sm flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  return (
    <DashboardLayout userType="spv">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{financials.projectTitle}</h1>
          <p className="text-gray-600">Financial management and reporting dashboard</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
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
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'distribution' && renderDistribution()}
        {activeTab === 'expenses' && renderExpenses()}
        {activeTab === 'treasury' && renderTreasury()}
        {activeTab === 'reports' && renderReports()}

        {/* Distribution Modal */}
        {distributionModalOpen && (
          <Modal
            isOpen={distributionModalOpen}
            onClose={() => setDistributionModalOpen(false)}
            title="Execute Profit Distribution"
          >
            <div className="p-6">
              <div className="mb-6">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">Distribution Summary</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>Available for distribution: {formatCurrency(financials.currentPeriod.distributionAmount)}</p>
                    <p>Number of recipients: {financials.tokenHolders.length}</p>
                    <p>Platform fee (10%): {formatCurrency(financials.currentPeriod.distributionAmount * 0.1)}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distribution Amount (IDR)
                  </label>
                  <Input
                    type="number"
                    value={distributionAmount}
                    onChange={(e) => setDistributionAmount(e.target.value)}
                    placeholder={financials.currentPeriod.distributionAmount.toString()}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum available: {formatCurrency(financials.currentPeriod.distributionAmount)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setDistributionModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDistribution}
                  className="flex-1"
                >
                  Execute Distribution
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Expense Modal */}
        {expenseModalOpen && (
          <Modal
            isOpen={expenseModalOpen}
            onClose={() => setExpenseModalOpen(false)}
            title="Add New Expense"
          >
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select category</option>
                  {expenseCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (IDR)</label>
                <Input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter expense description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <Input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Receipt (optional)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {expenseForm.receipt && (
                  <p className="text-sm text-green-600 mt-1">
                    File selected: {expenseForm.receipt.name}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setExpenseModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleExpenseSubmit}
                  className="flex-1"
                >
                  Submit Expense
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Report Generation Modal */}
        {reportModalOpen && (
          <Modal
            isOpen={reportModalOpen}
            onClose={() => setReportModalOpen(false)}
            title="Generate Financial Report"
          >
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="financial">Financial Statement</option>
                  <option value="distribution">Distribution Report</option>
                  <option value="expenses">Expense Report</option>
                  <option value="treasury">Treasury Report</option>
                  <option value="compliance">Compliance Report</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="current-quarter">Current Quarter</option>
                  <option value="last-quarter">Last Quarter</option>
                  <option value="ytd">Year to Date</option>
                  <option value="last-year">Last Year</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="pdf">PDF Report</option>
                  <option value="excel">Excel Spreadsheet</option>
                  <option value="csv">CSV Data</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setReportModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                >
                  Generate Report
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}