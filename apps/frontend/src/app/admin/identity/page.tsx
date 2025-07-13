'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  DashboardLayout,
  DataTable,
  Input,
  StatsCard,
} from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import type { Identity, IdentityTableRow } from '@/types';
import {
  Search,
  Filter,
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
} from 'lucide-react';

export default function AdminIdentityPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedIdentity, setSelectedIdentity] = useState<Identity | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

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
      alert('Identity approved successfully');
    }, 1000);
  };

  const handleRejectIdentity = async (identityId: string) => {
    identityId;

    setIsLoading(true);
    // TODO: Implement identity rejection via IdentityRegistry contract
    setTimeout(() => {
      setIsLoading(false);
      alert('Identity rejected successfully');
    }, 1000);
  };

  const handleBulkOperation = async (
    operation: string,
    identityIds: string[]
  ) => {
    setIsLoading(true);
    // TODO: Implement bulk operations via IdentityRegistry contract
    setTimeout(() => {
      setIsLoading(false);
      alert(`Bulk ${operation} completed for ${identityIds.length} identities`);
    }, 2000);
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
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setSelectedIdentity(
                filteredIdentities.find(i => i.id === row.id) || null
              )
            }
            className="flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            View
          </Button>
          {row.kycStatus === 'pending' && (
            <>
              <Button
                size="sm"
                onClick={() => handleApproveIdentity(row.id)}
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                <CheckCircle className="w-3 h-3" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRejectIdentity(row.id)}
                disabled={isLoading}
                className="flex items-center gap-1 text-red-600 hover:text-red-700"
              >
                <XCircle className="w-3 h-3" />
                Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Identity Registry Management
            </h1>
            <p className="text-gray-600">
              Manage all platform identities and verification statuses
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => alert('Export functionality coming soon')}
            >
              <Download className="w-4 h-4" />
              Export Data
            </Button>
            <Button
              className="flex items-center gap-2"
              onClick={() => alert('Add identity functionality coming soon')}
            >
              <Plus className="w-4 h-4" />
              Add Identity
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Identities"
            value={totalIdentities.toString()}
            icon={<Users className="w-4 h-4" />}
            change={approvedIdentities}
            changeType="increase"
          />
          <StatsCard
            title="Approved"
            value={approvedIdentities.toString()}
            icon={<UserCheck className="w-4 h-4" />}
            change={Math.round((approvedIdentities / totalIdentities) * 100)}
            changeType="increase"
          />
          <StatsCard
            title="Pending Review"
            value={pendingIdentities.toString()}
            icon={<Clock className="w-4 h-4" />}
            change={pendingIdentities}
            changeType="decrease"
          />
          <StatsCard
            title="Total Investments"
            value={formatCurrency(totalInvestments)}
            icon={<Shield className="w-4 h-4" />}
            description="All verified users"
            changeType="increase"
          />
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by address or country..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
              <Button
                variant="outline"
                onClick={() =>
                  handleBulkOperation(
                    'approve',
                    filteredIdentities.map(i => i.id)
                  )
                }
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Bulk Actions
              </Button>
            </div>
          </div>
        </Card>

        {/* Identity Table */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Identity Registry
            </h2>
            <p className="text-gray-600">
              Showing {filteredIdentities.length} of {totalIdentities}{' '}
              identities
            </p>
          </div>
          <DataTable<IdentityTableRow>
            data={identityTableData}
            columns={columns}
            searchable={false}
          />
        </Card>

        {/* Identity Detail Modal */}
        {selectedIdentity && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Identity Details
                </h2>
                <Button
                  variant="outline"
                  onClick={() => setSelectedIdentity(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wallet Address
                    </label>
                    <p className="text-gray-900 font-mono text-sm bg-gray-50 p-2 rounded">
                      {selectedIdentity.address}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        KYC Status
                      </label>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedIdentity.kycStatus)}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedIdentity.kycStatus)}`}
                        >
                          {selectedIdentity.kycStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Verification Level
                      </label>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(selectedIdentity.verificationLevel)}`}
                      >
                        {selectedIdentity.verificationLevel.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Verified At
                      </label>
                      <p className="text-gray-900">
                        {formatDate(selectedIdentity.verifiedAt)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expires At
                      </label>
                      <p className="text-gray-900">
                        {formatDate(selectedIdentity.expiresAt)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <p className="text-gray-900">{selectedIdentity.country}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Claims
                      </label>
                      <p className="text-gray-900">
                        {selectedIdentity.claimsCount}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Active Claims
                      </label>
                      <p className="text-gray-900">
                        {selectedIdentity.activeClaims}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Investment Count
                      </label>
                      <p className="text-gray-900">
                        {selectedIdentity.investmentCount}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Invested
                      </label>
                      <p className="text-gray-900">
                        {formatCurrency(selectedIdentity.totalInvested)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Activity
                    </label>
                    <p className="text-gray-900">
                      {formatDate(selectedIdentity.lastActivity)}
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Actions
                    </h3>
                    <div className="space-y-2">
                      {selectedIdentity.kycStatus === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() =>
                              handleApproveIdentity(selectedIdentity.id)
                            }
                            disabled={isLoading}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve Identity
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              handleRejectIdentity(selectedIdentity.id)
                            }
                            disabled={isLoading}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject Identity
                          </Button>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        onClick={() =>
                          alert('Edit identity functionality coming soon')
                        }
                        className="flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Identity
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
