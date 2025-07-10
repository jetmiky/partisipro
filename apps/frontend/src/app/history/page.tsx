'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Download,
  Filter,
  Search,
  Calendar,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Button, Card, DashboardLayout, Modal } from '@/components/ui';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
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
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'processing':
        return 'Processing';
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
        return 'Investment';
      case 'return':
        return 'Return';
      case 'claim':
        return 'Claim';
      case 'withdrawal':
        return 'Withdrawal';
      case 'fee':
        return 'Fee';
      default:
        return 'Unknown';
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
      transaction.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filters.type === 'all' || transaction.type === filters.type;
    const matchesStatus = filters.status === 'all' || transaction.status === filters.status;
    const matchesDateRange = filters.dateRange === 'all' || isDateInRange(transaction.date, filters.dateRange);
    const matchesProject = filters.project === 'all' || transaction.projectId === filters.project;
    const matchesAmount = isAmountInRange(transaction.amount, filters.amountRange.min, filters.amountRange.max);

    return matchesSearch && matchesType && matchesStatus && matchesDateRange && matchesProject && matchesAmount;
  });

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const uniqueProjects = Array.from(new Set(mockTransactions.map(t => t.projectId)))
    .map(id => ({
      id,
      title: mockTransactions.find(t => t.projectId === id)?.projectTitle || 'Unknown',
    }))
    .filter(p => p.id !== 'platform' && p.id !== 'portfolio');

  const handleExport = () => {
    // TODO: Implement actual export logic
    console.log(`Exporting ${exportFormat} for ${exportDateRange} transactions`);
    setExportModalOpen(false);
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
  };

  return (
    <DashboardLayout userType="investor">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
            <p className="text-gray-600">
              View and manage all your investment transactions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary" 
              onClick={() => setExportModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button variant="secondary" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions, projects, or transaction IDs..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <Button
              variant={showFilters ? "primary" : "secondary"}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </Button>
            {(searchTerm || Object.values(filters).some(v => v !== 'all' && v !== '')) && (
              <Button variant="secondary" onClick={resetFilters}>
                Clear All
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={filters.type}
                    onChange={e => setFilters({ ...filters, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={e => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <select
                    value={filters.dateRange}
                    onChange={e => setFilters({ ...filters, dateRange: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                    <option value="year">Last Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <select
                    value={filters.project}
                    onChange={e => setFilters({ ...filters, project: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Range (IDR)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min amount"
                      value={filters.amountRange.min}
                      onChange={e => setFilters({ 
                        ...filters, 
                        amountRange: { ...filters.amountRange, min: e.target.value }
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="number"
                      placeholder="Max amount"
                      value={filters.amountRange.max}
                      onChange={e => setFilters({ 
                        ...filters, 
                        amountRange: { ...filters.amountRange, max: e.target.value }
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Results Summary */}
        <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
          </span>
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {/* Transactions Table */}
        <Card className="overflow-hidden">
          {paginatedTransactions.length > 0 ? (
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTransactions.map(transaction => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <div className="font-medium text-gray-900">
                              {getTransactionTypeLabel(transaction.type)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transaction.transactionId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            {transaction.projectTitle}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.category}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className={`font-medium ${
                            ['investment', 'fee', 'withdrawal'].includes(transaction.type)
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}>
                            {['investment', 'fee', 'withdrawal'].includes(transaction.type) ? '-' : '+'}
                            {formatCurrency(transaction.amount)}
                          </div>
                          {transaction.feeAmount && (
                            <div className="text-sm text-gray-500">
                              Fee: {formatCurrency(transaction.feeAmount)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-gray-900">
                            {formatDate(transaction.date)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(transaction.date).toLocaleTimeString('id-ID', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {getStatusLabel(transaction.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          variant="secondary"
                          onClick={() => setSelectedTransaction(transaction)}
                          className="text-sm flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || Object.values(filters).some(v => v !== 'all' && v !== '')
                  ? 'Try adjusting your search or filter criteria.'
                  : 'You haven\'t made any transactions yet.'}
              </p>
              {!searchTerm && !Object.values(filters).some(v => v !== 'all' && v !== '') && (
                <Link href="/marketplace">
                  <Button variant="primary">Browse Projects</Button>
                </Link>
              )}
            </div>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} of {filteredTransactions.length} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "primary" : "secondary"}
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  );
                })}
                {totalPages > 5 && <span className="text-gray-500">...</span>}
              </div>
              <Button
                variant="secondary"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Transaction Details Modal */}
        {selectedTransaction && (
          <Modal
            isOpen={!!selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
            title="Transaction Details"
          >
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b">
                  {getTransactionIcon(selectedTransaction.type)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {getTransactionTypeLabel(selectedTransaction.type)}
                    </h3>
                    <p className="text-sm text-gray-500">{selectedTransaction.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTransaction.status)}`}>
                    {getStatusLabel(selectedTransaction.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Transaction ID:</span>
                    <span className="ml-2 font-mono">{selectedTransaction.transactionId}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Date & Time:</span>
                    <span className="ml-2">{formatDateTime(selectedTransaction.date)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Project:</span>
                    <span className="ml-2">{selectedTransaction.projectTitle}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <span className="ml-2">{selectedTransaction.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Amount:</span>
                    <span className={`ml-2 font-medium ${
                      ['investment', 'fee', 'withdrawal'].includes(selectedTransaction.type)
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}>
                      {['investment', 'fee', 'withdrawal'].includes(selectedTransaction.type) ? '-' : '+'}
                      {formatCurrency(selectedTransaction.amount)}
                    </span>
                  </div>
                  {selectedTransaction.feeAmount && (
                    <div>
                      <span className="text-gray-500">Fee:</span>
                      <span className="ml-2">{formatCurrency(selectedTransaction.feeAmount)}</span>
                    </div>
                  )}
                  {selectedTransaction.exchangeRate && (
                    <div>
                      <span className="text-gray-500">Exchange Rate:</span>
                      <span className="ml-2">IDR {selectedTransaction.exchangeRate.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedTransaction.paymentMethod && (
                    <div>
                      <span className="text-gray-500">Payment Method:</span>
                      <span className="ml-2">{selectedTransaction.paymentMethod}</span>
                    </div>
                  )}
                </div>

                {selectedTransaction.blockchainHash && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Blockchain Hash:</span>
                      <Button variant="secondary" className="text-xs flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        View on Explorer
                      </Button>
                    </div>
                    <p className="text-sm font-mono text-gray-900 mt-1 break-all">
                      {selectedTransaction.blockchainHash}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Modal>
        )}

        {/* Export Modal */}
        {exportModalOpen && (
          <Modal
            isOpen={exportModalOpen}
            onClose={() => setExportModalOpen(false)}
            title="Export Transaction History"
          >
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="format"
                        value="csv"
                        checked={exportFormat === 'csv'}
                        onChange={e => setExportFormat(e.target.value)}
                        className="text-primary-600"
                      />
                      <span>CSV (Excel Compatible)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="format"
                        value="pdf"
                        checked={exportFormat === 'pdf'}
                        onChange={e => setExportFormat(e.target.value)}
                        className="text-primary-600"
                      />
                      <span>PDF Report</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    value={exportDateRange}
                    onChange={e => setExportDateRange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Transactions</option>
                    <option value="year">Last Year</option>
                    <option value="month">Last Month</option>
                    <option value="week">Last Week</option>
                  </select>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-4">
                    This will export {filteredTransactions.length} transactions matching your current filters.
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => setExportModalOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleExport}
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export {exportFormat.toUpperCase()}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}