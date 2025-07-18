'use client';

import { useState } from 'react';
import { Button, DashboardLayout, DataTable } from '@/components/ui';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { PageTransition } from '@/components/ui/PageTransition';
import { ScrollReveal, StaggeredList } from '@/components/ui/ScrollAnimations';
import { toast } from '@/components/ui/AnimatedNotification';
import { Column } from '@/components/ui/DataTable';
import type { Identity, IdentityTableRow, BatchOperation } from '@/types';
import {
  Search,
  UserCheck,
  Shield,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Download,
  Plus,
  Upload,
  Settings,
  Play,
  Pause,
  RotateCcw,
  AlertCircle,
  FileText,
  Archive,
} from 'lucide-react';

export default function AdminIdentityPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedIdentity, setSelectedIdentity] = useState<Identity | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchTab, setBatchTab] = useState<
    'register' | 'verify' | 'claims' | 'status' | 'monitor'
  >('register');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [batchOperations, setBatchOperations] = useState<BatchOperation[]>([]);
  const [selectedOperation, setSelectedOperation] =
    useState<BatchOperation | null>(null);

  // TODO: Mock identity data - replace with actual IdentityRegistry contract integration
  const identities: Identity[] = [
    {
      id: '1',
      address: '0x742d35Cc6634C0532925a3b8D22Ad6dDe36Cd12C',
      kycStatus: 'approved',
      verificationLevel: 'advanced',
      verifiedAt: '2024-01-15T10:30:00Z',
      expiresAt: '2025-01-15T10:30:00Z',
      claimsCount: 4,
      activeClaims: 4,
      lastActivity: '2024-01-20T14:30:00Z',
      country: 'Indonesia',
      investmentCount: 3,
      totalInvested: 50000000,
    },
    {
      id: '2',
      address: '0x123a456b789c012d345e678f901a234b567c890d',
      kycStatus: 'pending',
      verificationLevel: 'basic',
      verifiedAt: '2024-01-18T09:15:00Z',
      expiresAt: '2025-01-18T09:15:00Z',
      claimsCount: 2,
      activeClaims: 2,
      lastActivity: '2024-01-21T11:20:00Z',
      country: 'Indonesia',
      investmentCount: 1,
      totalInvested: 10000000,
    },
    {
      id: '3',
      address: '0x456a789b012c345d678e901f234a567b890c123d',
      kycStatus: 'approved',
      verificationLevel: 'institutional',
      verifiedAt: '2024-01-10T16:45:00Z',
      expiresAt: '2025-01-10T16:45:00Z',
      claimsCount: 6,
      activeClaims: 5,
      lastActivity: '2024-01-22T08:10:00Z',
      country: 'Indonesia',
      investmentCount: 8,
      totalInvested: 250000000,
    },
    {
      id: '4',
      address: '0x789b012c345d678e901f234a567b890c123d456a',
      kycStatus: 'rejected',
      verificationLevel: 'none',
      verifiedAt: '2024-01-12T13:20:00Z',
      expiresAt: '2025-01-12T13:20:00Z',
      claimsCount: 1,
      activeClaims: 0,
      lastActivity: '2024-01-19T15:45:00Z',
      country: 'Indonesia',
      investmentCount: 0,
      totalInvested: 0,
    },
  ];

  // TODO: Mock batch operations data - replace with actual backend API
  const mockBatchOperations: BatchOperation[] = [
    {
      id: 'batch-001',
      type: 'user_registration',
      status: 'completed',
      totalItems: 250,
      processedItems: 250,
      successfulItems: 247,
      failedItems: 3,
      startedAt: '2024-01-22T10:00:00Z',
      completedAt: '2024-01-22T10:15:00Z',
      createdBy: 'admin@partisipro.com',
      operationData: {
        operationType: 'Bulk User Registration',
        parameters: { verificationLevel: 'basic', country: 'Indonesia' },
      },
      errors: [
        {
          itemIndex: 45,
          itemId: 'user-045',
          errorMessage: 'Invalid wallet address format',
          errorCode: 'INVALID_ADDRESS',
          timestamp: '2024-01-22T10:05:00Z',
        },
        {
          itemIndex: 128,
          itemId: 'user-128',
          errorMessage: 'Duplicate email address',
          errorCode: 'DUPLICATE_EMAIL',
          timestamp: '2024-01-22T10:08:00Z',
        },
      ],
    },
    {
      id: 'batch-002',
      type: 'claim_assignment',
      status: 'processing',
      totalItems: 150,
      processedItems: 89,
      successfulItems: 87,
      failedItems: 2,
      startedAt: '2024-01-22T14:30:00Z',
      estimatedCompletion: '2024-01-22T14:45:00Z',
      createdBy: 'admin@partisipro.com',
      operationData: {
        operationType: 'Bulk KYC Approval',
        parameters: { claimType: 'KYC_APPROVED', issuer: 'Verihubs' },
      },
      errors: [
        {
          itemIndex: 23,
          itemId: 'identity-023',
          errorMessage: 'Identity not found in registry',
          errorCode: 'IDENTITY_NOT_FOUND',
          timestamp: '2024-01-22T14:35:00Z',
        },
      ],
    },
    {
      id: 'batch-003',
      type: 'verification',
      status: 'failed',
      totalItems: 75,
      processedItems: 32,
      successfulItems: 28,
      failedItems: 4,
      startedAt: '2024-01-22T09:15:00Z',
      completedAt: '2024-01-22T09:45:00Z',
      createdBy: 'admin@partisipro.com',
      operationData: {
        operationType: 'Bulk Identity Verification',
        parameters: { provider: 'Sumsub', level: 'advanced' },
      },
      errors: [
        {
          itemIndex: 8,
          itemId: 'identity-008',
          errorMessage: 'Provider API timeout',
          errorCode: 'API_TIMEOUT',
          timestamp: '2024-01-22T09:25:00Z',
        },
      ],
    },
  ];

  // CSV File Handling Functions
  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = e => {
        const text = e.target?.result as string;
        const rows = text.split('\n').map(row => row.split(','));
        setCsvData(rows);
      };
      reader.readAsText(file);
    }
  };

  const downloadCsvTemplate = (type: string) => {
    let template = '';
    switch (type) {
      case 'register':
        template =
          'wallet_address,email,country,verification_level,kyc_provider,reference_id\n0x123...,user@example.com,Indonesia,basic,Verihubs,REF001';
        break;
      case 'claims':
        template =
          'identity_id,wallet_address,claim_type,claim_value,expires_at,issuer\nid-001,0x123...,KYC_APPROVED,verified,2025-01-22,Verihubs';
        break;
      case 'verify':
        template =
          'identity_id,wallet_address,new_status,verification_level,notes\nid-001,0x123...,approved,advanced,Manual review completed';
        break;
      default:
        template = 'identity_id,wallet_address,action\nid-001,0x123...,approve';
    }

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Batch Operation Functions
  const handleStartBatchOperation = async (type: string) => {
    setIsLoading(true);

    // TODO: Replace with actual batch operation API call
    const newOperation: BatchOperation = {
      id: `batch-${Date.now()}`,
      type: type as BatchOperation['type'],
      status: 'processing',
      totalItems: csvData.length - 1, // Exclude header row
      processedItems: 0,
      successfulItems: 0,
      failedItems: 0,
      startedAt: new Date().toISOString(),
      createdBy: 'admin@partisipro.com',
      operationData: {
        operationType: `Bulk ${type}`,
        parameters: {},
        csvData: csvData,
      },
      errors: [],
    };

    setBatchOperations(prev => [newOperation, ...prev]);

    // Simulate processing
    setTimeout(() => {
      setIsLoading(false);
      setBatchOperations(prev =>
        prev.map(op =>
          op.id === newOperation.id
            ? {
                ...op,
                status: 'completed',
                processedItems: op.totalItems,
                successfulItems: op.totalItems,
              }
            : op
        )
      );
      toast.success(`Batch ${type} operation started successfully!`);
    }, 2000);
  };

  const handlePauseBatchOperation = (operationId: string) => {
    setBatchOperations(prev =>
      prev.map(op => (op.id === operationId ? { ...op, status: 'paused' } : op))
    );
  };

  const handleResumeBatchOperation = (operationId: string) => {
    setBatchOperations(prev =>
      prev.map(op =>
        op.id === operationId ? { ...op, status: 'processing' } : op
      )
    );
  };

  const handleRetryBatchOperation = (operationId: string) => {
    setBatchOperations(prev =>
      prev.map(op =>
        op.id === operationId
          ? { ...op, status: 'processing', failedItems: 0, errors: [] }
          : op
      )
    );
  };

  // Initialize batch operations with mock data
  if (batchOperations.length === 0) {
    setBatchOperations(mockBatchOperations);
  }

  // Batch Operation Utility Functions
  const getBatchStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getBatchStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'paused':
        return 'text-yellow-600 bg-yellow-50';
      case 'pending':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getProgressPercentage = (operation: BatchOperation) => {
    return operation.totalItems > 0
      ? Math.round((operation.processedItems / operation.totalItems) * 100)
      : 0;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'expired':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'institutional':
        return 'text-purple-600 bg-purple-50';
      case 'advanced':
        return 'text-blue-600 bg-blue-50';
      case 'basic':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleApproveIdentity = async (identityId: string) => {
    identityId;

    setIsLoading(true);
    // TODO: Implement identity approval via IdentityRegistry contract
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Identity approved successfully');
    }, 1000);
  };

  const handleRejectIdentity = async (identityId: string) => {
    identityId;

    setIsLoading(true);
    // TODO: Implement identity rejection via IdentityRegistry contract
    setTimeout(() => {
      setIsLoading(false);
      toast.error('Identity rejected successfully');
    }, 1000);
  };

  const filteredIdentities = identities.filter(identity => {
    const matchesSearch =
      identity.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      identity.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === 'all' || identity.kycStatus === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalIdentities = identities.length;
  const approvedIdentities = identities.filter(
    i => i.kycStatus === 'approved'
  ).length;
  const pendingIdentities = identities.filter(
    i => i.kycStatus === 'pending'
  ).length;
  const totalInvestments = identities.reduce(
    (sum, i) => sum + i.totalInvested,
    0
  );

  const identityTableData = filteredIdentities.map(identity => ({
    id: identity.id,
    address: identity.address,
    kycStatus: identity.kycStatus,
    verificationLevel: identity.verificationLevel,
    verifiedAt: formatDate(identity.verifiedAt),
    claimsCount: identity.claimsCount,
    activeClaims: identity.activeClaims,
    lastActivity: formatDate(identity.lastActivity),
    country: identity.country,
    investmentCount: identity.investmentCount,
    totalInvested: formatCurrency(identity.totalInvested),
  }));

  const columns: Column<IdentityTableRow>[] = [
    {
      label: 'Address',
      key: 'address',
      render: (_, row) => (
        <div className="font-mono text-sm">
          {row.address.slice(0, 10)}...{row.address.slice(-6)}
        </div>
      ),
    },
    {
      label: 'KYC Status',
      key: 'kycStatus',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(row.kycStatus)}
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.kycStatus)}`}
          >
            {row.kycStatus.toUpperCase()}
          </span>
        </div>
      ),
    },
    {
      label: 'Verification Level',
      key: 'verificationLevel',
      render: (_, row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(row.verificationLevel)}`}
        >
          {row.verificationLevel.toUpperCase()}
        </span>
      ),
    },
    {
      label: 'Claims',
      key: 'claimsCount',
      render: (_, row) => (
        <div className="text-center">
          <div className="font-medium">
            {row.activeClaims}/{row.claimsCount}
          </div>
          <div className="text-xs text-gray-500">Active/Total</div>
        </div>
      ),
    },
    {
      label: 'Investments',
      key: 'investmentCount',
      render: (_, row) => (
        <div>
          <div className="font-medium">{row.investmentCount}</div>
          <div className="text-xs text-gray-500">{row.totalInvested}</div>
        </div>
      ),
    },
    {
      label: 'Last Activity',
      key: 'lastActivity',
      render: (_, row) => <div className="text-sm">{row.lastActivity}</div>,
    },
    {
      label: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <AnimatedButton
            size="sm"
            variant="outline"
            ripple
            onClick={() =>
              setSelectedIdentity(
                filteredIdentities.find(i => i.id === row.id) || null
              )
            }
            className="flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            View
          </AnimatedButton>
          {row.kycStatus === 'pending' && (
            <>
              <AnimatedButton
                size="sm"
                variant="primary"
                ripple
                onClick={() => handleApproveIdentity(row.id)}
                disabled={isLoading}
                loading={isLoading}
                className="flex items-center gap-1"
              >
                <CheckCircle className="w-3 h-3" />
                Approve
              </AnimatedButton>
              <AnimatedButton
                size="sm"
                variant="outline"
                ripple
                onClick={() => handleRejectIdentity(row.id)}
                disabled={isLoading}
                loading={isLoading}
                className="flex items-center gap-1 text-red-600 hover:text-red-700"
              >
                <XCircle className="w-3 h-3" />
                Reject
              </AnimatedButton>
            </>
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

      <DashboardLayout>
        <PageTransition type="fade" duration={300}>
          <div className="space-y-8 relative z-10">
            {/* Header */}
            <ScrollReveal animation="fade" delay={0} duration={800}>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gradient mb-2">
                    Identity Registry Management
                  </h1>
                  <p className="text-muted-foreground">
                    Manage all platform identities and verification statuses
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <AnimatedButton
                    variant="outline"
                    ripple
                    className="btn-modern btn-modern-secondary hover-lift flex items-center gap-2"
                    onClick={() =>
                      toast.info('Export functionality coming soon')
                    }
                  >
                    <Download className="w-4 h-4" />
                    Export Data
                  </AnimatedButton>
                  <AnimatedButton
                    variant="primary"
                    ripple
                    className="btn-modern btn-modern-primary hover-lift flex items-center gap-2"
                    onClick={() =>
                      toast.info('Add identity functionality coming soon')
                    }
                  >
                    <Plus className="w-4 h-4" />
                    Add Identity
                  </AnimatedButton>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Statistics */}
          <StaggeredList
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            itemDelay={150}
            animation="slide-up"
          >
            <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-success-600 font-medium">
                  +{approvedIdentities}%
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gradient">
                  {totalIdentities}
                </h3>
                <p className="text-sm font-medium text-primary-700">
                  Total Identities
                </p>
                <p className="text-xs text-muted-foreground">
                  All registered users
                </p>
              </div>
            </div>

            <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-success-600 font-medium">
                  +{Math.round((approvedIdentities / totalIdentities) * 100)}%
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gradient">
                  {approvedIdentities}
                </h3>
                <p className="text-sm font-medium text-primary-700">Approved</p>
                <p className="text-xs text-muted-foreground">
                  Verified identities
                </p>
              </div>
            </div>

            <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-muted-foreground">
                  -{pendingIdentities}
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gradient">
                  {pendingIdentities}
                </h3>
                <p className="text-sm font-medium text-primary-700">
                  Pending Review
                </p>
                <p className="text-xs text-muted-foreground">
                  Awaiting verification
                </p>
              </div>
            </div>

            <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-support-500 to-support-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-success-600 font-medium">
                  +15.2%
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gradient">
                  {formatCurrency(totalInvestments)}
                </h3>
                <p className="text-sm font-medium text-primary-700">
                  Total Investments
                </p>
                <p className="text-xs text-muted-foreground">
                  All verified users
                </p>
              </div>
            </div>
          </StaggeredList>

          {/* Filters */}
          <ScrollReveal animation="slide-up" delay={300} duration={800}>
            <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400 w-4 h-4" />
                    <AnimatedInput
                      placeholder="Search by address or country..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10 glass-modern border-primary-200 focus:border-primary-400 focus:ring-primary-100 hover-glow"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 glass-modern border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400 hover-glow transition-all duration-300"
                  >
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                    <option value="expired">Expired</option>
                  </select>
                  <AnimatedButton
                    variant="outline"
                    ripple
                    onClick={() => setShowBatchModal(true)}
                    className="btn-modern btn-modern-secondary hover-lift flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Batch Operations
                  </AnimatedButton>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Identity Table */}
          <ScrollReveal animation="slide-up" delay={400} duration={800}>
            <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gradient mb-2">
                  Identity Registry
                </h2>
                <p className="text-primary-600">
                  Showing {filteredIdentities.length} of {totalIdentities}{' '}
                  identities
                </p>
              </div>
              <div className="glass-modern rounded-xl overflow-hidden">
                <DataTable<IdentityTableRow>
                  data={identityTableData}
                  columns={columns}
                  searchable={false}
                />
              </div>
            </div>
          </ScrollReveal>

          {/* Identity Detail Modal */}
          {selectedIdentity && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="glass-feature rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-primary-200 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-semibold text-gradient">
                    Identity Details
                  </h2>
                  <AnimatedButton
                    variant="outline"
                    ripple
                    onClick={() => setSelectedIdentity(null)}
                    className="btn-modern btn-modern-secondary hover-lift text-xl w-10 h-10 rounded-xl"
                  >
                    ×
                  </AnimatedButton>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="glass-modern rounded-xl p-4">
                      <label className="block text-sm font-medium text-primary-700 mb-2">
                        Wallet Address
                      </label>
                      <p className="text-primary-900 font-mono text-sm glass-modern p-3 rounded-lg border border-primary-200">
                        {selectedIdentity.address}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="glass-modern rounded-xl p-4">
                        <label className="block text-sm font-medium text-primary-700 mb-2">
                          KYC Status
                        </label>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(selectedIdentity.kycStatus)}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedIdentity.kycStatus)}`}
                          >
                            {selectedIdentity.kycStatus.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="glass-modern rounded-xl p-4">
                        <label className="block text-sm font-medium text-primary-700 mb-2">
                          Verification Level
                        </label>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(selectedIdentity.verificationLevel)}`}
                        >
                          {selectedIdentity.verificationLevel.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="glass-modern rounded-xl p-4">
                        <label className="block text-sm font-medium text-primary-700 mb-2">
                          Verified At
                        </label>
                        <p className="text-primary-900 font-medium">
                          {formatDate(selectedIdentity.verifiedAt)}
                        </p>
                      </div>
                      <div className="glass-modern rounded-xl p-4">
                        <label className="block text-sm font-medium text-primary-700 mb-2">
                          Expires At
                        </label>
                        <p className="text-primary-900 font-medium">
                          {formatDate(selectedIdentity.expiresAt)}
                        </p>
                      </div>
                    </div>

                    <div className="glass-modern rounded-xl p-4">
                      <label className="block text-sm font-medium text-primary-700 mb-2">
                        Country
                      </label>
                      <p className="text-primary-900 font-medium">
                        {selectedIdentity.country}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="glass-modern rounded-xl p-4">
                        <label className="block text-sm font-medium text-primary-700 mb-2">
                          Total Claims
                        </label>
                        <p className="text-2xl font-bold text-gradient">
                          {selectedIdentity.claimsCount}
                        </p>
                      </div>
                      <div className="glass-modern rounded-xl p-4">
                        <label className="block text-sm font-medium text-primary-700 mb-2">
                          Active Claims
                        </label>
                        <p className="text-2xl font-bold text-gradient">
                          {selectedIdentity.activeClaims}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="glass-modern rounded-xl p-4">
                        <label className="block text-sm font-medium text-primary-700 mb-2">
                          Investment Count
                        </label>
                        <p className="text-2xl font-bold text-gradient">
                          {selectedIdentity.investmentCount}
                        </p>
                      </div>
                      <div className="glass-modern rounded-xl p-4">
                        <label className="block text-sm font-medium text-primary-700 mb-2">
                          Total Invested
                        </label>
                        <p className="text-lg font-bold text-gradient">
                          {formatCurrency(selectedIdentity.totalInvested)}
                        </p>
                      </div>
                    </div>

                    <div className="glass-modern rounded-xl p-4">
                      <label className="block text-sm font-medium text-primary-700 mb-2">
                        Last Activity
                      </label>
                      <p className="text-primary-900 font-medium">
                        {formatDate(selectedIdentity.lastActivity)}
                      </p>
                    </div>

                    <div className="glass-modern rounded-xl p-6 border-t border-primary-200">
                      <h3 className="text-lg font-semibold text-gradient mb-4">
                        Actions
                      </h3>
                      <div className="space-y-3">
                        {selectedIdentity.kycStatus === 'pending' && (
                          <div className="flex gap-3">
                            <AnimatedButton
                              variant="primary"
                              ripple
                              onClick={() =>
                                handleApproveIdentity(selectedIdentity.id)
                              }
                              disabled={isLoading}
                              loading={isLoading}
                              className="btn-modern btn-modern-primary hover-lift flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve Identity
                            </AnimatedButton>
                            <AnimatedButton
                              variant="outline"
                              ripple
                              onClick={() =>
                                handleRejectIdentity(selectedIdentity.id)
                              }
                              disabled={isLoading}
                              loading={isLoading}
                              className="btn-modern btn-modern-secondary hover-lift flex items-center gap-2 text-error-600 hover:text-error-700 border-error-200"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject Identity
                            </AnimatedButton>
                          </div>
                        )}
                        <AnimatedButton
                          variant="outline"
                          ripple
                          onClick={() =>
                            toast.info(
                              'Edit identity functionality coming soon'
                            )
                          }
                          className="btn-modern btn-modern-secondary hover-lift flex items-center gap-2 w-full"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Identity
                        </AnimatedButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Batch Operations Modal */}
          {showBatchModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="glass-feature rounded-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-primary-200 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-semibold text-gradient">
                    Batch Operations Center
                  </h2>
                  <Button
                    variant="outline"
                    onClick={() => setShowBatchModal(false)}
                    className="btn-modern btn-modern-secondary hover-lift text-xl w-10 h-10 rounded-xl"
                  >
                    ×
                  </Button>
                </div>

                {/* Tab Navigation */}
                <div className="glass-modern rounded-xl p-2 mb-8">
                  <nav className="flex space-x-2">
                    {[
                      {
                        key: 'register',
                        label: 'User Registration',
                        icon: <Plus className="w-4 h-4" />,
                      },
                      {
                        key: 'verify',
                        label: 'Verification',
                        icon: <UserCheck className="w-4 h-4" />,
                      },
                      {
                        key: 'claims',
                        label: 'Claim Assignment',
                        icon: <Shield className="w-4 h-4" />,
                      },
                      {
                        key: 'status',
                        label: 'Status Updates',
                        icon: <Edit className="w-4 h-4" />,
                      },
                      {
                        key: 'monitor',
                        label: 'Operation Monitor',
                        icon: <Archive className="w-4 h-4" />,
                      },
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() =>
                          setBatchTab(
                            tab.key as
                              | 'register'
                              | 'verify'
                              | 'claims'
                              | 'status'
                              | 'monitor'
                          )
                        }
                        className={`px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-2 transition-all duration-300 hover-lift ${
                          batchTab === tab.key
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                            : 'text-primary-600 hover:text-primary-700 hover:bg-primary-50'
                        }`}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                  {/* User Registration Tab */}
                  {batchTab === 'register' && (
                    <div className="space-y-6">
                      <div className="glass-modern rounded-xl p-6 border border-primary-200">
                        <h3 className="text-xl font-semibold text-gradient mb-3">
                          Bulk User Registration
                        </h3>
                        <p className="text-primary-700">
                          Register multiple users at once with identity creation
                          and initial verification setup.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* CSV Upload Section */}
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900">
                            CSV Data Upload
                          </h4>

                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 mb-2">
                              Upload CSV file with user registration data
                            </p>
                            <input
                              type="file"
                              accept=".csv"
                              onChange={handleCsvUpload}
                              className="hidden"
                              id="csv-upload-register"
                            />
                            <label
                              htmlFor="csv-upload-register"
                              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                            >
                              Choose CSV File
                            </label>
                          </div>

                          {csvFile && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-sm text-green-800">
                                <strong>File loaded:</strong> {csvFile.name}
                              </p>
                              <p className="text-sm text-green-700">
                                {csvData.length > 0
                                  ? `${csvData.length - 1} users ready for registration`
                                  : 'Processing...'}
                              </p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => downloadCsvTemplate('register')}
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download Template
                            </Button>
                            <Button
                              onClick={() =>
                                handleStartBatchOperation('user_registration')
                              }
                              disabled={!csvFile || isLoading}
                              className="flex items-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              Start Registration
                            </Button>
                          </div>
                        </div>

                        {/* Preview Section */}
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900">
                            Data Preview
                          </h4>

                          {csvData.length > 0 ? (
                            <div className="border rounded-lg overflow-hidden">
                              <div className="max-h-64 overflow-y-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      {csvData[0]?.map((header, index) => (
                                        <th
                                          key={index}
                                          className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                                        >
                                          {header}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {csvData
                                      .slice(1, 6)
                                      .map((row, rowIndex) => (
                                        <tr key={rowIndex}>
                                          {row.map((cell, cellIndex) => (
                                            <td
                                              key={cellIndex}
                                              className="px-3 py-2 text-sm text-gray-900 font-mono"
                                            >
                                              {cell.length > 20
                                                ? `${cell.substring(0, 20)}...`
                                                : cell}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                              {csvData.length > 6 && (
                                <div className="bg-gray-50 px-3 py-2 text-sm text-gray-500">
                                  ... and {csvData.length - 6} more rows
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">
                                Upload a CSV file to see data preview
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Verification Tab */}
                  {batchTab === 'verify' && (
                    <div className="space-y-6">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-green-900 mb-2">
                          Bulk Identity Verification
                        </h3>
                        <p className="text-green-700 text-sm">
                          Process identity verification for multiple users
                          simultaneously.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900">
                            Verification Options
                          </h4>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Verification Provider
                              </label>
                              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <option>Verihubs</option>
                                <option>Sumsub</option>
                                <option>Manual Review</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Verification Level
                              </label>
                              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <option>Basic</option>
                                <option>Advanced</option>
                                <option>Institutional</option>
                              </select>
                            </div>
                          </div>

                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <input
                              type="file"
                              accept=".csv"
                              onChange={handleCsvUpload}
                              className="hidden"
                              id="csv-upload-verify"
                            />
                            <label
                              htmlFor="csv-upload-verify"
                              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Identity List
                            </label>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => downloadCsvTemplate('verify')}
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Template
                            </Button>
                            <Button
                              onClick={() =>
                                handleStartBatchOperation('verification')
                              }
                              disabled={!csvFile || isLoading}
                              className="flex items-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              Start Verification
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900">
                            Verification Stats
                          </h4>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">
                                {
                                  identities.filter(
                                    i => i.kycStatus === 'pending'
                                  ).length
                                }
                              </div>
                              <div className="text-sm text-blue-700">
                                Pending Review
                              </div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">
                                {
                                  identities.filter(
                                    i => i.kycStatus === 'approved'
                                  ).length
                                }
                              </div>
                              <div className="text-sm text-green-700">
                                Approved Today
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Claims Assignment Tab */}
                  {batchTab === 'claims' && (
                    <div className="space-y-6">
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-purple-900 mb-2">
                          Bulk Claim Assignment
                        </h3>
                        <p className="text-purple-700 text-sm">
                          Assign identity claims to multiple users for
                          compliance and access control.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900">
                            Claim Configuration
                          </h4>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Claim Type
                              </label>
                              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <option>KYC_APPROVED</option>
                                <option>ACCREDITED_INVESTOR</option>
                                <option>Indonesian_CITIZEN</option>
                                <option>PROFESSIONAL_INVESTOR</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Claim Issuer
                              </label>
                              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <option>Verihubs</option>
                                <option>Sumsub</option>
                                <option>Platform Admin</option>
                                <option>External Authority</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expiration Date (Optional)
                              </label>
                              <input
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                            </div>
                          </div>

                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <input
                              type="file"
                              accept=".csv"
                              onChange={handleCsvUpload}
                              className="hidden"
                              id="csv-upload-claims"
                            />
                            <label
                              htmlFor="csv-upload-claims"
                              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Recipient List
                            </label>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => downloadCsvTemplate('claims')}
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Template
                            </Button>
                            <Button
                              onClick={() =>
                                handleStartBatchOperation('claim_assignment')
                              }
                              disabled={!csvFile || isLoading}
                              className="flex items-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              Assign Claims
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900">
                            Claim Statistics
                          </h4>

                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm font-medium">
                                KYC_APPROVED
                              </span>
                              <span className="text-sm text-gray-600">
                                {
                                  identities.filter(
                                    i => i.kycStatus === 'approved'
                                  ).length
                                }{' '}
                                users
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm font-medium">
                                ACCREDITED_INVESTOR
                              </span>
                              <span className="text-sm text-gray-600">
                                {
                                  identities.filter(
                                    i => i.verificationLevel === 'institutional'
                                  ).length
                                }{' '}
                                users
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm font-medium">
                                Indonesian_CITIZEN
                              </span>
                              <span className="text-sm text-gray-600">
                                {
                                  identities.filter(
                                    i => i.country === 'Indonesia'
                                  ).length
                                }{' '}
                                users
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Updates Tab */}
                  {batchTab === 'status' && (
                    <div className="space-y-6">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-yellow-900 mb-2">
                          Bulk Status Updates
                        </h3>
                        <p className="text-yellow-700 text-sm">
                          Update identity verification status for multiple users
                          at once.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900">
                            Status Update Options
                          </h4>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                New Status
                              </label>
                              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <option>approved</option>
                                <option>rejected</option>
                                <option>pending</option>
                                <option>expired</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reason/Notes
                              </label>
                              <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                rows={3}
                                placeholder="Optional reason for status change..."
                              />
                            </div>
                          </div>

                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <input
                              type="file"
                              accept=".csv"
                              onChange={handleCsvUpload}
                              className="hidden"
                              id="csv-upload-status"
                            />
                            <label
                              htmlFor="csv-upload-status"
                              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Identity List
                            </label>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => downloadCsvTemplate('status')}
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Template
                            </Button>
                            <Button
                              onClick={() =>
                                handleStartBatchOperation('status_update')
                              }
                              disabled={!csvFile || isLoading}
                              className="flex items-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              Update Status
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900">
                            Current Status Distribution
                          </h4>

                          <div className="space-y-2">
                            {['approved', 'pending', 'rejected', 'expired'].map(
                              status => {
                                const count = identities.filter(
                                  i => i.kycStatus === status
                                ).length;
                                const percentage = Math.round(
                                  (count / identities.length) * 100
                                );
                                return (
                                  <div
                                    key={status}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                  >
                                    <div className="flex items-center gap-2">
                                      {getStatusIcon(status)}
                                      <span className="text-sm font-medium capitalize">
                                        {status}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {count} ({percentage}%)
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Operation Monitor Tab */}
                  {batchTab === 'monitor' && (
                    <div className="space-y-6">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Batch Operation Monitor
                        </h3>
                        <p className="text-gray-700 text-sm">
                          Monitor the progress and manage running batch
                          operations.
                        </p>
                      </div>

                      {/* Active Operations */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">
                          Active Operations
                        </h4>

                        {batchOperations.filter(
                          op =>
                            op.status === 'processing' || op.status === 'paused'
                        ).length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Archive className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p>No active batch operations</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {batchOperations
                              .filter(
                                op =>
                                  op.status === 'processing' ||
                                  op.status === 'paused'
                              )
                              .map(operation => (
                                <div
                                  key={operation.id}
                                  className="border rounded-lg p-4"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      {getBatchStatusIcon(operation.status)}
                                      <div>
                                        <h5 className="font-medium text-gray-900">
                                          {
                                            operation.operationData
                                              .operationType
                                          }
                                        </h5>
                                        <p className="text-sm text-gray-600">
                                          Started{' '}
                                          {formatDateTime(operation.startedAt)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {operation.status === 'processing' && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handlePauseBatchOperation(
                                              operation.id
                                            )
                                          }
                                        >
                                          <Pause className="w-3 h-3" />
                                        </Button>
                                      )}
                                      {operation.status === 'paused' && (
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            handleResumeBatchOperation(
                                              operation.id
                                            )
                                          }
                                        >
                                          <Play className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span>Progress</span>
                                      <span>
                                        {getProgressPercentage(operation)}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{
                                          width: `${getProgressPercentage(operation)}%`,
                                        }}
                                      />
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                      <span>
                                        {operation.processedItems} /{' '}
                                        {operation.totalItems} processed
                                      </span>
                                      <span>
                                        {operation.successfulItems} successful,{' '}
                                        {operation.failedItems} failed
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Recent Operations */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">
                          Recent Operations
                        </h4>

                        <div className="overflow-hidden border rounded-lg">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Operation
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Progress
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Started
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {batchOperations.slice(0, 10).map(operation => (
                                <tr key={operation.id}>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {operation.operationData.operationType}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      {getBatchStatusIcon(operation.status)}
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${getBatchStatusColor(operation.status)}`}
                                      >
                                        {operation.status.toUpperCase()}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {operation.processedItems} /{' '}
                                    {operation.totalItems}
                                    {operation.failedItems > 0 && (
                                      <span className="text-red-600 ml-2">
                                        ({operation.failedItems} failed)
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {formatDateTime(operation.startedAt)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          setSelectedOperation(operation)
                                        }
                                      >
                                        <Eye className="w-3 h-3" />
                                      </Button>
                                      {operation.status === 'failed' && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleRetryBatchOperation(
                                              operation.id
                                            )
                                          }
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                        </Button>
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
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Operation Detail Modal */}
          {selectedOperation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Operation Details
                  </h2>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedOperation(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Operation Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Operation Summary
                      </h3>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Operation ID:
                          </span>
                          <span className="text-sm text-gray-900 font-mono">
                            {selectedOperation.id}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Type:
                          </span>
                          <span className="text-sm text-gray-900">
                            {selectedOperation.operationData.operationType}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Status:
                          </span>
                          <div className="flex items-center gap-2">
                            {getBatchStatusIcon(selectedOperation.status)}
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getBatchStatusColor(selectedOperation.status)}`}
                            >
                              {selectedOperation.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Started:
                          </span>
                          <span className="text-sm text-gray-900">
                            {formatDateTime(selectedOperation.startedAt)}
                          </span>
                        </div>
                        {selectedOperation.completedAt && (
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              Completed:
                            </span>
                            <span className="text-sm text-gray-900">
                              {formatDateTime(selectedOperation.completedAt)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Created By:
                          </span>
                          <span className="text-sm text-gray-900">
                            {selectedOperation.createdBy}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Progress Statistics
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {selectedOperation.totalItems}
                          </div>
                          <div className="text-sm text-blue-700">
                            Total Items
                          </div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {selectedOperation.successfulItems}
                          </div>
                          <div className="text-sm text-green-700">
                            Successful
                          </div>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">
                            {selectedOperation.processedItems}
                          </div>
                          <div className="text-sm text-yellow-700">
                            Processed
                          </div>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">
                            {selectedOperation.failedItems}
                          </div>
                          <div className="text-sm text-red-700">Failed</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Overall Progress</span>
                          <span>
                            {getProgressPercentage(selectedOperation)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-600 h-3 rounded-full"
                            style={{
                              width: `${getProgressPercentage(selectedOperation)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Error Details */}
                  {selectedOperation.errors.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        Error Details ({selectedOperation.errors.length})
                      </h3>

                      <div className="overflow-hidden border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Item Index
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Item ID
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Error Code
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Error Message
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Timestamp
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedOperation.errors.map((error, index) => (
                              <tr key={index}>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {error.itemIndex}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                                  {error.itemId || 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                                    {error.errorCode}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {error.errorMessage}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {formatDateTime(error.timestamp)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </PageTransition>
      </DashboardLayout>
    </div>
  );
}
