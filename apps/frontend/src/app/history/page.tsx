/* eslint-disable no-case-declarations */
'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Download,
  Search,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { DashboardLayout } from '@/components/ui';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { ScrollReveal } from '@/components/ui/ScrollAnimations';
import { PageTransition } from '@/components/ui/PageTransition';
import { toast } from '@/components/ui/AnimatedNotification';

interface Transaction {
  id: string;
  type: 'investment' | 'return' | 'claim' | 'withdrawal' | 'fee';
  projectTitle: string;
  projectId: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed' | 'processing';
  transactionId: string;
  description: string;
  blockchainHash?: string;
  feeAmount?: number;
  exchangeRate?: number;
  paymentMethod?: string;
  category: string;
}

interface TransactionFilter {
  type: string;
  status: string;
  dateRange: string;
  project: string;
  amountRange: {
    min: string;
    max: string;
  };
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'return',
    projectTitle: 'Jakarta-Bandung High-Speed Rail Extension',
    projectId: '1',
    amount: 125000,
    date: '2024-01-10T14:30:00Z',
    status: 'completed',
    transactionId: 'TXN-001234567',
    description: 'Monthly profit distribution for January 2024',
    blockchainHash: '0x1234567890abcdef',
    feeAmount: 2500,
    exchangeRate: 15750,
    paymentMethod: 'Bank Transfer',
    category: 'Revenue',
  },
  {
    id: '2',
    type: 'investment',
    projectTitle: 'Bali Renewable Energy Plant',
    projectId: '3',
    amount: 2000000,
    date: '2023-12-01T10:15:00Z',
    status: 'completed',
    transactionId: 'TXN-001234566',
    description: 'Initial investment in renewable energy project',
    blockchainHash: '0xabcdef1234567890',
    feeAmount: 40000,
    exchangeRate: 15680,
    paymentMethod: 'Bank Transfer',
    category: 'Investment',
  },
  {
    id: '3',
    type: 'claim',
    projectTitle: 'Jakarta Smart Water Management',
    projectId: '4',
    amount: 165000,
    date: '2024-01-01T16:45:00Z',
    status: 'pending',
    transactionId: 'TXN-001234565',
    description: 'Claim final project buyback amount',
    blockchainHash: '0x567890abcdef1234',
    feeAmount: 3300,
    exchangeRate: 15800,
    paymentMethod: 'Bank Transfer',
    category: 'Withdrawal',
  },
  {
    id: '4',
    type: 'return',
    projectTitle: 'Soekarno-Hatta Airport Terminal 4',
    projectId: '2',
    amount: 80000,
    date: '2023-12-20T12:00:00Z',
    status: 'completed',
    transactionId: 'TXN-001234564',
    description: 'Quarterly profit distribution Q4 2023',
    blockchainHash: '0xdef1234567890abc',
    feeAmount: 1600,
    exchangeRate: 15720,
    paymentMethod: 'Bank Transfer',
    category: 'Revenue',
  },
  {
    id: '5',
    type: 'fee',
    projectTitle: 'Platform Management Fee',
    projectId: 'platform',
    amount: 15000,
    date: '2023-12-15T09:30:00Z',
    status: 'completed',
    transactionId: 'TXN-001234563',
    description: 'Platform management and maintenance fee',
    feeAmount: 0,
    exchangeRate: 15700,
    paymentMethod: 'Auto Deduction',
    category: 'Platform',
  },
  {
    id: '6',
    type: 'investment',
    projectTitle: 'Jakarta-Bandung High-Speed Rail Extension',
    projectId: '1',
    amount: 5000000,
    date: '2024-01-15T08:20:00Z',
    status: 'processing',
    transactionId: 'TXN-001234562',
    description: 'Additional investment in high-speed rail project',
    paymentMethod: 'Bank Transfer',
    category: 'Investment',
  },
  {
    id: '7',
    type: 'withdrawal',
    projectTitle: 'Portfolio Withdrawal',
    projectId: 'portfolio',
    amount: 500000,
    date: '2023-11-28T15:10:00Z',
    status: 'failed',
    transactionId: 'TXN-001234561',
    description: 'Partial portfolio withdrawal - insufficient funds',
    feeAmount: 10000,
    exchangeRate: 15650,
    paymentMethod: 'Bank Transfer',
    category: 'Withdrawal',
  },
  {
    id: '8',
    type: 'return',
    projectTitle: 'Bali Renewable Energy Plant',
    projectId: '3',
    amount: 95000,
    date: '2023-11-15T11:45:00Z',
    status: 'completed',
    transactionId: 'TXN-001234560',
    description: 'Monthly profit distribution November 2023',
    blockchainHash: '0x890abcdef1234567',
    feeAmount: 1900,
    exchangeRate: 15630,
    paymentMethod: 'Bank Transfer',
    category: 'Revenue',
  },
];

const ITEMS_PER_PAGE = 10;

export default function HistoryPage() {
  const { t } = useTranslation('common');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportDateRange, setExportDateRange] = useState('all');

  const [filters, setFilters] = useState<TransactionFilter>({
    type: 'all',
    status: 'all',
    dateRange: 'all',
    project: 'all',
    amountRange: {
      min: '',
      max: '',
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return t('historyPage.statuses.completed');
      case 'pending':
        return t('historyPage.statuses.pending');
      case 'failed':
        return t('historyPage.statuses.failed');
      case 'processing':
        return t('historyPage.statuses.processing');
      default:
        return t('historyPage.statuses.unknown');
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
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-purple-600" />;
      case 'fee':
        return <DollarSign className="w-4 h-4 text-orange-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'investment':
        return t('historyPage.types.investment');
      case 'return':
        return t('historyPage.types.return');
      case 'claim':
        return t('historyPage.types.claim');
      case 'withdrawal':
        return t('historyPage.types.withdrawal');
      case 'fee':
        return t('historyPage.types.fee');
      default:
        return t('historyPage.types.unknown');
    }
  };

  const isDateInRange = (dateString: string, range: string) => {
    const date = new Date(dateString);
    const now = new Date();

    switch (range) {
      case 'today':
        return date.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return date >= monthAgo;
      case 'year':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        return date >= yearAgo;
      default:
        return true;
    }
  };

  const isAmountInRange = (amount: number, minStr: string, maxStr: string) => {
    const min = minStr ? parseFloat(minStr) : 0;
    const max = maxStr ? parseFloat(maxStr) : Infinity;
    return amount >= min && amount <= max;
  };

  const filteredTransactions = mockTransactions.filter(transaction => {
    const matchesSearch =
      transaction.projectTitle
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.transactionId
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesType =
      filters.type === 'all' || transaction.type === filters.type;
    const matchesStatus =
      filters.status === 'all' || transaction.status === filters.status;
    const matchesDateRange =
      filters.dateRange === 'all' ||
      isDateInRange(transaction.date, filters.dateRange);
    const matchesProject =
      filters.project === 'all' || transaction.projectId === filters.project;
    const matchesAmount = isAmountInRange(
      transaction.amount,
      filters.amountRange.min,
      filters.amountRange.max
    );

    return (
      matchesSearch &&
      matchesType &&
      matchesStatus &&
      matchesDateRange &&
      matchesProject &&
      matchesAmount
    );
  });

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const uniqueProjects = Array.from(
    new Set(mockTransactions.map(t => t.projectId))
  )
    .map(id => ({
      id,
      title:
        mockTransactions.find(t => t.projectId === id)?.projectTitle ||
        'Unknown',
    }))
    .filter(p => p.id !== 'platform' && p.id !== 'portfolio');

  const handleExport = () => {
    // TODO: Implement actual export logic
    // console.log(
    //   `Exporting ${exportFormat} for ${exportDateRange} transactions`
    // );
    setExportModalOpen(false);
    toast.success(t('historyPage.messages.exportStarted'), {
      message: t('historyPage.messages.exportProcessing', {
        format: exportFormat.toUpperCase(),
      }),
      duration: 4000,
    });
  };

  const resetFilters = () => {
    setFilters({
      type: 'all',
      status: 'all',
      dateRange: 'all',
      project: 'all',
      amountRange: { min: '', max: '' },
    });
    setSearchTerm('');
    setCurrentPage(1);
    toast.info('Filters Reset', {
      message: 'All filters have been cleared.',
      duration: 3000,
    });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Fluid Background Shapes */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="fluid-shape-1 top-20 right-16"></div>
        <div className="fluid-shape-2 top-1/2 left-10"></div>
        <div className="fluid-shape-3 bottom-32 right-1/4"></div>
        <div className="fluid-shape-1 bottom-10 left-16"></div>
      </div>

      <DashboardLayout userType="investor">
        <PageTransition type="fade" duration={300}>
          <div className="space-y-8 p-6 relative z-10">
            {/* Header */}
            <ScrollReveal animation="slide-up" delay={0}>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gradient mb-2">
                    {t('historyPage.overview.title')}
                  </h1>
                  <p className="text-muted-foreground">
                    {t('historyPage.overview.subtitle')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <AnimatedButton
                    variant="outline"
                    onClick={() => setExportModalOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {t('historyPage.export.exportButton')}
                  </AnimatedButton>
                  <AnimatedButton
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() =>
                      toast.info('Refreshing data...', { duration: 2000 })
                    }
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t('historyPage.filters.refreshButton')}
                  </AnimatedButton>
                </div>
              </div>
            </ScrollReveal>

            {/* Search and Filter Bar */}
            <ScrollReveal animation="slide-up" delay={200}>
              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400" />
                    <AnimatedInput
                      type="text"
                      placeholder={t('historyPage.search.placeholder')}
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10"
                    />
                  </div>
                  <AnimatedButton
                    variant={showFilters ? 'primary' : 'outline'}
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    {t('historyPage.filters.filtersButton')}
                  </AnimatedButton>
                  {(searchTerm ||
                    Object.values(filters).some(
                      v => v !== 'all' && v !== ''
                    )) && (
                    <AnimatedButton variant="outline" onClick={resetFilters}>
                      Clear All
                    </AnimatedButton>
                  )}
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                  <ScrollReveal animation="slide-down" delay={100}>
                    <div className="mt-6 pt-6 border-t border-primary-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-primary-700 mb-3">
                            Type
                          </label>
                          <select
                            value={filters.type}
                            onChange={e =>
                              setFilters({ ...filters, type: e.target.value })
                            }
                            className="w-full px-3 py-2 glass-modern border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400 hover-glow transition-all duration-300"
                          >
                            <option value="all">All Types</option>
                            <option value="investment">Investment</option>
                            <option value="return">Return</option>
                            <option value="claim">Claim</option>
                            <option value="withdrawal">Withdrawal</option>
                            <option value="fee">Fee</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-primary-700 mb-3">
                            Status
                          </label>
                          <select
                            value={filters.status}
                            onChange={e =>
                              setFilters({ ...filters, status: e.target.value })
                            }
                            className="w-full px-3 py-2 glass-modern border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400 hover-glow transition-all duration-300"
                          >
                            <option value="all">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="failed">Failed</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-primary-700 mb-3">
                            Date Range
                          </label>
                          <select
                            value={filters.dateRange}
                            onChange={e =>
                              setFilters({
                                ...filters,
                                dateRange: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 glass-modern border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400 hover-glow transition-all duration-300"
                          >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">Last Week</option>
                            <option value="month">Last Month</option>
                            <option value="year">Last Year</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-primary-700 mb-3">
                            Project
                          </label>
                          <select
                            value={filters.project}
                            onChange={e =>
                              setFilters({
                                ...filters,
                                project: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 glass-modern border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400 hover-glow transition-all duration-300"
                          >
                            <option value="all">All Projects</option>
                            {uniqueProjects.map(project => (
                              <option key={project.id} value={project.id}>
                                {project.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-primary-700 mb-3">
                            Amount Range (IDR)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder="Min amount"
                              value={filters.amountRange.min}
                              onChange={e =>
                                setFilters({
                                  ...filters,
                                  amountRange: {
                                    ...filters.amountRange,
                                    min: e.target.value,
                                  },
                                })
                              }
                              className="flex-1 px-3 py-2 glass-modern border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400 hover-glow transition-all duration-300"
                            />
                            <span className="text-primary-600 font-medium">
                              to
                            </span>
                            <input
                              type="number"
                              placeholder="Max amount"
                              value={filters.amountRange.max}
                              onChange={e =>
                                setFilters({
                                  ...filters,
                                  amountRange: {
                                    ...filters.amountRange,
                                    max: e.target.value,
                                  },
                                })
                              }
                              className="flex-1 px-3 py-2 glass-modern border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400 hover-glow transition-all duration-300"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                )}
              </div>
            </ScrollReveal>

            {/* Results Summary */}
            <ScrollReveal animation="fade" delay={300}>
              <div className="mb-6 flex items-center justify-between text-sm">
                <span className="text-primary-600 font-medium">
                  Showing {paginatedTransactions.length} of{' '}
                  {filteredTransactions.length} transactions
                </span>
                <span className="text-primary-600 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            </ScrollReveal>

            {/* Transactions Table */}
            <ScrollReveal animation="slide-up" delay={400}>
              <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gradient mb-2">
                    {t('historyPage.overview.title')}
                  </h2>
                  <p className="text-primary-600">
                    {t('historyPage.overview.completeRecord')}
                  </p>
                </div>
                <div className="glass-modern rounded-xl overflow-hidden">
                  {paginatedTransactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-primary-50 to-primary-100">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">
                              {t('historyPage.table.type')}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">
                              {t('historyPage.table.project')}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">
                              {t('historyPage.table.amount')}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">
                              {t('historyPage.table.date')}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">
                              {t('historyPage.table.status')}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">
                              {t('historyPage.table.actions')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-primary-100">
                          {paginatedTransactions.map(transaction => (
                            <tr
                              key={transaction.id}
                              className="hover:bg-primary-50/30 hover-glow transition-all duration-300"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  {getTransactionIcon(transaction.type)}
                                  <div>
                                    <div className="font-semibold text-primary-800">
                                      {getTransactionTypeLabel(
                                        transaction.type
                                      )}
                                    </div>
                                    <div className="text-sm text-primary-600 font-mono">
                                      {transaction.transactionId}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="font-semibold text-primary-800">
                                    {transaction.projectTitle}
                                  </div>
                                  <div className="text-sm text-primary-600">
                                    {transaction.category}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div
                                    className={`font-bold ${
                                      [
                                        'investment',
                                        'fee',
                                        'withdrawal',
                                      ].includes(transaction.type)
                                        ? 'text-accent-600'
                                        : 'text-success-600'
                                    }`}
                                  >
                                    {[
                                      'investment',
                                      'fee',
                                      'withdrawal',
                                    ].includes(transaction.type)
                                      ? '-'
                                      : '+'}
                                    {formatCurrency(transaction.amount)}
                                  </div>
                                  {transaction.feeAmount && (
                                    <div className="text-sm text-primary-600">
                                      Fee:{' '}
                                      {formatCurrency(transaction.feeAmount)}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-primary-800 font-semibold">
                                    {formatDate(transaction.date)}
                                  </div>
                                  <div className="text-sm text-primary-600">
                                    {new Date(
                                      transaction.date
                                    ).toLocaleTimeString('id-ID', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-3 py-2 rounded-xl text-xs font-bold ${getStatusColor(transaction.status)}`}
                                >
                                  {getStatusLabel(transaction.status)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <AnimatedButton
                                  variant="outline"
                                  onClick={() =>
                                    setSelectedTransaction(transaction)
                                  }
                                  className="text-sm flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  Details
                                </AnimatedButton>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-16 text-center">
                      <div className="w-20 h-20 feature-icon mx-auto mb-8 hover-scale">
                        <FileText className="w-10 h-10" />
                      </div>
                      <h3 className="text-2xl font-bold text-gradient mb-4">
                        No Transactions Found
                      </h3>
                      <p className="text-primary-600 mb-8 max-w-md mx-auto">
                        {searchTerm ||
                        Object.values(filters).some(
                          v => v !== 'all' && v !== ''
                        )
                          ? 'Try adjusting your search or filter criteria.'
                          : "You haven't made any transactions yet."}
                      </p>
                      {!searchTerm &&
                        !Object.values(filters).some(
                          v => v !== 'all' && v !== ''
                        ) && (
                          <Link href="/marketplace">
                            <AnimatedButton>Browse Projects</AnimatedButton>
                          </Link>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </ScrollReveal>

            {/* Pagination */}
            {totalPages > 1 && (
              <ScrollReveal animation="slide-up" delay={500}>
                <div className="mt-8 flex items-center justify-between glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                  <div className="text-sm text-primary-600 font-medium">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredTransactions.length
                    )}{' '}
                    of {filteredTransactions.length} results
                  </div>
                  <div className="flex items-center gap-3">
                    <AnimatedButton
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </AnimatedButton>
                    <div className="flex items-center gap-2">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          const page = i + 1;
                          return (
                            <AnimatedButton
                              key={page}
                              variant={
                                currentPage === page ? 'primary' : 'outline'
                              }
                              onClick={() => setCurrentPage(page)}
                              className="w-10 h-10 p-0"
                            >
                              {page}
                            </AnimatedButton>
                          );
                        }
                      )}
                      {totalPages > 5 && (
                        <span className="text-primary-500 font-medium">
                          ...
                        </span>
                      )}
                    </div>
                    <AnimatedButton
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-2"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </AnimatedButton>
                  </div>
                </div>
              </ScrollReveal>
            )}

            {/* Transaction Details Modal */}
            {selectedTransaction && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="glass-feature rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gradient mb-2">
                        Transaction Details
                      </h2>
                      <p className="text-primary-600">
                        Complete transaction information and blockchain data
                      </p>
                    </div>
                    <AnimatedButton
                      variant="outline"
                      onClick={() => setSelectedTransaction(null)}
                      className="w-10 h-10 p-0 text-lg"
                    >
                      ×
                    </AnimatedButton>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-4 pb-6 border-b border-primary-200">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                        {getTransactionIcon(selectedTransaction.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gradient mb-1">
                          {getTransactionTypeLabel(selectedTransaction.type)}
                        </h3>
                        <p className="text-primary-600">
                          {selectedTransaction.description}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-2 rounded-xl text-sm font-bold ${getStatusColor(selectedTransaction.status)}`}
                      >
                        {getStatusLabel(selectedTransaction.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="glass-modern rounded-xl p-6">
                        <label className="block text-sm font-semibold text-primary-700 mb-3">
                          Transaction ID
                        </label>
                        <p className="text-primary-800 font-mono font-bold">
                          {selectedTransaction.transactionId}
                        </p>
                      </div>
                      <div className="glass-modern rounded-xl p-6">
                        <label className="block text-sm font-semibold text-primary-700 mb-3">
                          Date & Time
                        </label>
                        <p className="text-primary-800 font-medium">
                          {formatDateTime(selectedTransaction.date)}
                        </p>
                      </div>
                      <div className="glass-modern rounded-xl p-6">
                        <label className="block text-sm font-semibold text-primary-700 mb-3">
                          Project
                        </label>
                        <p className="text-primary-800 font-medium">
                          {selectedTransaction.projectTitle}
                        </p>
                      </div>
                      <div className="glass-modern rounded-xl p-6">
                        <label className="block text-sm font-semibold text-primary-700 mb-3">
                          Category
                        </label>
                        <p className="text-primary-800 font-medium">
                          {selectedTransaction.category}
                        </p>
                      </div>
                      <div className="glass-modern rounded-xl p-6">
                        <label className="block text-sm font-semibold text-primary-700 mb-3">
                          Amount
                        </label>
                        <p
                          className={`text-xl font-bold ${
                            ['investment', 'fee', 'withdrawal'].includes(
                              selectedTransaction.type
                            )
                              ? 'text-accent-600'
                              : 'text-success-600'
                          }`}
                        >
                          {['investment', 'fee', 'withdrawal'].includes(
                            selectedTransaction.type
                          )
                            ? '-'
                            : '+'}
                          {formatCurrency(selectedTransaction.amount)}
                        </p>
                      </div>
                      {selectedTransaction.feeAmount && (
                        <div className="glass-modern rounded-xl p-6">
                          <label className="block text-sm font-semibold text-primary-700 mb-3">
                            Fee
                          </label>
                          <p className="text-primary-800 font-medium">
                            {formatCurrency(selectedTransaction.feeAmount)}
                          </p>
                        </div>
                      )}
                      {selectedTransaction.exchangeRate && (
                        <div className="glass-modern rounded-xl p-6">
                          <label className="block text-sm font-semibold text-primary-700 mb-3">
                            Exchange Rate
                          </label>
                          <p className="text-primary-800 font-medium">
                            IDR{' '}
                            {selectedTransaction.exchangeRate.toLocaleString()}
                          </p>
                        </div>
                      )}
                      {selectedTransaction.paymentMethod && (
                        <div className="glass-modern rounded-xl p-6">
                          <label className="block text-sm font-semibold text-primary-700 mb-3">
                            Payment Method
                          </label>
                          <p className="text-primary-800 font-medium">
                            {selectedTransaction.paymentMethod}
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedTransaction.blockchainHash && (
                      <div className="glass-modern rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-sm font-semibold text-primary-700">
                            Blockchain Hash
                          </label>
                          <AnimatedButton
                            variant="outline"
                            className="text-xs flex items-center gap-2"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {t('historyPage.details.viewOnExplorer')}
                          </AnimatedButton>
                        </div>
                        <p className="text-sm font-mono text-primary-800 break-all bg-primary-50 p-3 rounded-lg">
                          {selectedTransaction.blockchainHash}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Export Modal */}
            {exportModalOpen && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="glass-feature rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gradient mb-2">
                        {t('historyPage.export.title')}
                      </h2>
                      <p className="text-primary-600">
                        {t('historyPage.export.description')}
                      </p>
                    </div>
                    <AnimatedButton
                      variant="outline"
                      onClick={() => setExportModalOpen(false)}
                      className="w-10 h-10 p-0 text-lg"
                    >
                      ×
                    </AnimatedButton>
                  </div>

                  <div className="space-y-6">
                    <div className="glass-modern rounded-xl p-6">
                      <label className="block text-sm font-semibold text-primary-700 mb-4">
                        {t('historyPage.export.format')}
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 glass-hero rounded-lg hover-glow transition-all duration-300 cursor-pointer">
                          <input
                            type="radio"
                            name="format"
                            value="csv"
                            checked={exportFormat === 'csv'}
                            onChange={e => setExportFormat(e.target.value)}
                            className="text-primary-600"
                          />
                          <span className="text-primary-800 font-medium">
                            CSV (Excel Compatible)
                          </span>
                        </label>
                        <label className="flex items-center gap-3 p-3 glass-hero rounded-lg hover-glow transition-all duration-300 cursor-pointer">
                          <input
                            type="radio"
                            name="format"
                            value="pdf"
                            checked={exportFormat === 'pdf'}
                            onChange={e => setExportFormat(e.target.value)}
                            className="text-primary-600"
                          />
                          <span className="text-primary-800 font-medium">
                            PDF Report
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="glass-modern rounded-xl p-6">
                      <label className="block text-sm font-semibold text-primary-700 mb-4">
                        Date Range
                      </label>
                      <select
                        value={exportDateRange}
                        onChange={e => setExportDateRange(e.target.value)}
                        className="w-full px-3 py-2 glass-modern border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400 hover-glow transition-all duration-300"
                      >
                        <option value="all">All Transactions</option>
                        <option value="year">Last Year</option>
                        <option value="month">Last Month</option>
                        <option value="week">Last Week</option>
                      </select>
                    </div>

                    <div className="glass-modern rounded-xl p-6">
                      <p className="text-primary-600 mb-6 text-center">
                        This will export{' '}
                        <span className="font-bold text-gradient">
                          {filteredTransactions.length} transactions
                        </span>{' '}
                        matching your current filters.
                      </p>
                      <div className="flex items-center gap-4">
                        <AnimatedButton
                          variant="outline"
                          onClick={() => setExportModalOpen(false)}
                          className="flex-1"
                        >
                          Cancel
                        </AnimatedButton>
                        <AnimatedButton
                          onClick={handleExport}
                          className="flex-1 flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          {t('historyPage.export.exportButton')}{' '}
                          {exportFormat.toUpperCase()}
                        </AnimatedButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </PageTransition>
      </DashboardLayout>
    </div>
  );
}
