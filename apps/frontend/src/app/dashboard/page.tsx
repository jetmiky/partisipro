'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Plus,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  PieChart,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui';
import { StatsCard } from '@/components/ui';
import { DashboardLayout } from '@/components/ui';

interface Portfolio {
  id: string;
  projectTitle: string;
  investmentAmount: number;
  currentValue: number;
  returnAmount: number;
  returnPercentage: number;
  status: 'active' | 'completed' | 'claiming';
  investmentDate: string;
  lastUpdate: string;
  nextPayment: string;
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface Transaction {
  id: string;
  type: 'investment' | 'return' | 'claim';
  projectTitle: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  transactionId: string;
}

const mockPortfolio: Portfolio[] = [
  {
    id: '1',
    projectTitle: 'Jakarta-Bandung High-Speed Rail Extension',
    investmentAmount: 5000000,
    currentValue: 5750000,
    returnAmount: 750000,
    returnPercentage: 15.0,
    status: 'active',
    investmentDate: '2024-01-15',
    lastUpdate: '2024-01-10',
    nextPayment: '2024-02-15',
    category: 'Transportation',
    riskLevel: 'medium',
  },
  {
    id: '2',
    projectTitle: 'Soekarno-Hatta Airport Terminal 4',
    investmentAmount: 3000000,
    currentValue: 3240000,
    returnAmount: 240000,
    returnPercentage: 8.0,
    status: 'active',
    investmentDate: '2023-11-20',
    lastUpdate: '2024-01-08',
    nextPayment: '2024-02-20',
    category: 'Transportation',
    riskLevel: 'low',
  },
  {
    id: '3',
    projectTitle: 'Bali Renewable Energy Plant',
    investmentAmount: 2000000,
    currentValue: 2280000,
    returnAmount: 280000,
    returnPercentage: 14.0,
    status: 'claiming',
    investmentDate: '2023-12-01',
    lastUpdate: '2024-01-05',
    nextPayment: '2024-02-01',
    category: 'Energy',
    riskLevel: 'medium',
  },
  {
    id: '4',
    projectTitle: 'Jakarta Smart Water Management',
    investmentAmount: 1500000,
    currentValue: 1665000,
    returnAmount: 165000,
    returnPercentage: 11.0,
    status: 'completed',
    investmentDate: '2023-08-15',
    lastUpdate: '2024-01-01',
    nextPayment: '-',
    category: 'Infrastructure',
    riskLevel: 'low',
  },
];

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'return',
    projectTitle: 'Jakarta-Bandung High-Speed Rail Extension',
    amount: 125000,
    date: '2024-01-10',
    status: 'completed',
    transactionId: 'TXN-001234567',
  },
  {
    id: '2',
    type: 'investment',
    projectTitle: 'Bali Renewable Energy Plant',
    amount: 2000000,
    date: '2023-12-01',
    status: 'completed',
    transactionId: 'TXN-001234566',
  },
  {
    id: '3',
    type: 'claim',
    projectTitle: 'Jakarta Smart Water Management',
    amount: 165000,
    date: '2024-01-01',
    status: 'pending',
    transactionId: 'TXN-001234565',
  },
  {
    id: '4',
    type: 'return',
    projectTitle: 'Soekarno-Hatta Airport Terminal 4',
    amount: 80000,
    date: '2023-12-20',
    status: 'completed',
    transactionId: 'TXN-001234564',
  },
];

export default function DashboardPage() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'claiming':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'claiming':
        return 'Claiming';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'investment':
        return <ArrowDownRight className="w-4 h-4 text-red-600" />;
      case 'return':
        return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case 'claim':
        return <DollarSign className="w-4 h-4 text-blue-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  // Calculate dashboard stats
  const totalInvested = mockPortfolio.reduce(
    (sum, item) => sum + item.investmentAmount,
    0
  );
  const totalCurrentValue = mockPortfolio.reduce(
    (sum, item) => sum + item.currentValue,
    0
  );
  const totalReturns = totalCurrentValue - totalInvested;
  const totalReturnPercentage = (totalReturns / totalInvested) * 100;
  const activeProjects = mockPortfolio.filter(
    p => p.status === 'active'
  ).length;
  const claimableAmount = mockPortfolio
    .filter(p => p.status === 'claiming')
    .reduce((sum, item) => sum + item.returnAmount, 0);

  const filteredPortfolio = mockPortfolio.filter(item => {
    const matchesStatus =
      filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch =
      item.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'analytics', label: 'Analytics' },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Invested"
          value={formatCurrency(totalInvested)}
          icon={<DollarSign className="w-5 h-5" />}
          changeType="increase"
          change={15.2}
        />
        <StatsCard
          title="Current Value"
          value={formatCurrency(totalCurrentValue)}
          icon={<TrendingUp className="w-5 h-5" />}
          changeType="increase"
          change={8.7}
        />
        <StatsCard
          title="Total Returns"
          value={formatCurrency(totalReturns)}
          icon={<ArrowUpRight className="w-5 h-5" />}
          changeType={totalReturns > 0 ? 'increase' : 'decrease'}
          change={totalReturnPercentage}
        />
        <StatsCard
          title="Active Projects"
          value={activeProjects.toString()}
          icon={<PieChart className="w-5 h-5" />}
          changeType="increase"
          change={2}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Quick Actions</h3>
            <Plus className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <Link href="/marketplace">
              <Button variant="primary" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Browse New Projects
              </Button>
            </Link>
            <Link href="/claim">
              <Button variant="secondary" className="w-full justify-start">
                <DollarSign className="w-4 h-4 mr-2" />
                Claim Returns ({formatCurrency(claimableAmount)})
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="secondary" className="w-full justify-start">
                <Eye className="w-4 h-4 mr-2" />
                View Profile
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              Portfolio Performance
            </h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">This Month</span>
              <span className="font-medium text-green-600">
                +{formatCurrency(185000)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">This Year</span>
              <span className="font-medium text-green-600">
                +{formatCurrency(totalReturns)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Return Rate</span>
              <span className="font-medium text-primary-600">
                {totalReturnPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Upcoming Payments</h3>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-3">
            {mockPortfolio
              .filter(p => p.status === 'active')
              .slice(0, 3)
              .map(project => (
                <div
                  key={project.id}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {project.projectTitle}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(project.nextPayment)}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(project.returnAmount / 12)}
                  </span>
                </div>
              ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          <Link href="/transactions">
            <Button variant="secondary" className="text-sm">
              View All
            </Button>
          </Link>
        </div>
        <div className="space-y-4">
          {mockTransactions.slice(0, 5).map(transaction => (
            <div
              key={transaction.id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    {transaction.type}
                  </p>
                  <p className="text-sm text-gray-500">
                    {transaction.projectTitle}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-medium ${
                    transaction.type === 'investment'
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {transaction.type === 'investment' ? '-' : '+'}
                  {formatCurrency(transaction.amount)}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDate(transaction.date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderPortfolio = () => (
    <div className="space-y-6">
      {/* Portfolio Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Investment Portfolio
          </h2>
          <p className="text-gray-600">
            Manage your investments and track performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="secondary" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
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
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="claiming">Claiming</option>
        </select>
        <Button variant="secondary" className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          More Filters
        </Button>
      </div>

      {/* Portfolio Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Your Investments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Returns
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPortfolio.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.projectTitle}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.category} • {item.riskLevel} risk
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(item.investmentAmount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(item.investmentDate)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(item.currentValue)}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p
                        className={`font-medium ${item.returnAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {formatCurrency(item.returnAmount)} (
                        {item.returnPercentage.toFixed(1)}%)
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.returnAmount >= 0 ? 'Profit' : 'Loss'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Link href={`/projects/${item.id}`}>
                        <Button variant="secondary" className="text-sm">
                          View
                        </Button>
                      </Link>
                      {item.status === 'claiming' && (
                        <Link href="/claim">
                          <Button variant="primary" className="text-sm">
                            Claim
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Transaction History
          </h2>
          <p className="text-gray-600">View all your investment transactions</p>
        </div>
        <Button variant="secondary" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">All Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
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
                  Transaction ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockTransactions.map(transaction => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.type)}
                      <span className="capitalize font-medium text-gray-900">
                        {transaction.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-medium text-gray-900">
                      {transaction.projectTitle}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p
                      className={`font-medium ${
                        transaction.type === 'investment'
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {transaction.type === 'investment' ? '-' : '+'}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-gray-900">
                      {formatDate(transaction.date)}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}
                    >
                      {getStatusLabel(transaction.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-500 font-mono">
                      {transaction.transactionId}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Portfolio Analytics
        </h2>
        <p className="text-gray-600">
          Detailed insights into your investment performance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Asset Allocation</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Transportation</span>
              <span className="font-medium">65%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: '65%' }}
              ></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Energy</span>
              <span className="font-medium">20%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: '20%' }}
              ></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Infrastructure</span>
              <span className="font-medium">15%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: '15%' }}
              ></div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Risk Distribution
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Low Risk</span>
              <span className="font-medium">40%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: '40%' }}
              ></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Medium Risk</span>
              <span className="font-medium">50%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full"
                style={{ width: '50%' }}
              ></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">High Risk</span>
              <span className="font-medium">10%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full"
                style={{ width: '10%' }}
              ></div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {totalReturnPercentage.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Total Return Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">11.2%</div>
            <div className="text-sm text-gray-600">Average Annual Return</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">1.8</div>
            <div className="text-sm text-gray-600">Sharpe Ratio</div>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <DashboardLayout userType="investor">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Investment Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back! Here&apos;s your portfolio overview.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
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
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'portfolio' && renderPortfolio()}
        {selectedTab === 'transactions' && renderTransactions()}
        {selectedTab === 'analytics' && renderAnalytics()}
      </div>
    </DashboardLayout>
  );
}
