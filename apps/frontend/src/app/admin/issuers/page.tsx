'use client';

import { useState } from 'react';
import DataTable, { Column } from '@/components/ui/DataTable';
import {
  TrustedIssuer,
  TrustedIssuerTableRow,
  IssuerActivity,
  ClaimType,
} from '@/types';

export default function TrustedIssuersPage() {
  const [selectedIssuer, setSelectedIssuer] = useState<TrustedIssuer | null>(
    null
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [view, setView] = useState<'issuers' | 'activity' | 'claimTypes'>(
    'issuers'
  );

  // Mock data for trusted issuers
  const trustedIssuers: TrustedIssuer[] = [
    {
      id: 'issuer-1',
      name: 'Verihubs Indonesia',
      address: '0x742d35Cc6bC8C8F98436e7a08B2A9a77C2de2b71',
      description: 'Leading KYC verification provider in Indonesia',
      website: 'https://verihubs.com',
      email: 'contact@verihubs.com',
      phone: '+62-21-12345678',
      country: 'Indonesia',
      registrationNumber: 'PT-001-2020',
      claimTypes: ['KYC_APPROVED', 'IDENTITY_VERIFIED', 'PHONE_VERIFIED'],
      status: 'active',
      addedDate: '2024-01-15T00:00:00Z',
      addedBy: 'admin@partisipro.com',
      lastActivity: '2024-07-13T14:30:00Z',
      verificationsIssued: 12456,
      activeVerifications: 11890,
      successRate: 98.7,
      averageProcessingTime: 24,
      complianceScore: 95.5,
      permissions: {
        canIssueKYC: true,
        canIssueAccredited: false,
        canRevokeClaims: true,
        canBatchProcess: true,
      },
    },
    {
      id: 'issuer-2',
      name: 'Sumsub Global',
      address: '0x8ba1f109551bD432803012645Hac136c22C71B',
      description: 'Global identity verification and compliance platform',
      website: 'https://sumsub.com',
      email: 'support@sumsub.com',
      country: 'Estonia',
      registrationNumber: 'EU-SUM-2019',
      claimTypes: ['KYC_APPROVED', 'ACCREDITED_INVESTOR', 'AML_VERIFIED'],
      status: 'active',
      addedDate: '2024-02-01T00:00:00Z',
      addedBy: 'admin@partisipro.com',
      lastActivity: '2024-07-13T12:15:00Z',
      verificationsIssued: 8745,
      activeVerifications: 8234,
      successRate: 99.2,
      averageProcessingTime: 18,
      complianceScore: 98.1,
      permissions: {
        canIssueKYC: true,
        canIssueAccredited: true,
        canRevokeClaims: true,
        canBatchProcess: true,
      },
    },
    {
      id: 'issuer-3',
      name: 'IDology Asia',
      address: '0x123def456789abc012345def678901abc234567',
      description: 'Digital identity verification for Southeast Asia',
      email: 'info@idology.asia',
      country: 'Singapore',
      registrationNumber: 'SG-IDO-2021',
      claimTypes: ['IDENTITY_VERIFIED', 'RESIDENCY_VERIFIED'],
      status: 'pending',
      addedDate: '2024-07-10T00:00:00Z',
      addedBy: 'admin@partisipro.com',
      lastActivity: '2024-07-10T09:00:00Z',
      verificationsIssued: 0,
      activeVerifications: 0,
      successRate: 0,
      averageProcessingTime: 0,
      complianceScore: 0,
      permissions: {
        canIssueKYC: false,
        canIssueAccredited: false,
        canRevokeClaims: false,
        canBatchProcess: false,
      },
    },
  ];

  // Mock issuer activity data
  const issuerActivity: IssuerActivity[] = [
    {
      id: 'activity-1',
      issuerId: 'issuer-1',
      issuerName: 'Verihubs Indonesia',
      action: 'claim_issued',
      details: 'KYC verification completed for user',
      claimType: 'KYC_APPROVED',
      userAddress: '0xuser123...789',
      timestamp: '2024-07-13T14:30:00Z',
      status: 'success',
      transactionHash: '0xtx123...abc',
    },
    {
      id: 'activity-2',
      issuerId: 'issuer-2',
      issuerName: 'Sumsub Global',
      action: 'batch_process',
      details: 'Processed 50 KYC verifications',
      timestamp: '2024-07-13T12:15:00Z',
      status: 'success',
      transactionHash: '0xtx456...def',
    },
    {
      id: 'activity-3',
      issuerId: 'issuer-1',
      issuerName: 'Verihubs Indonesia',
      action: 'claim_revoked',
      details: 'KYC claim revoked due to compliance violation',
      claimType: 'KYC_APPROVED',
      userAddress: '0xuser456...123',
      timestamp: '2024-07-13T10:45:00Z',
      status: 'success',
      transactionHash: '0xtx789...ghi',
    },
  ];

  // Mock claim types data
  const claimTypes: ClaimType[] = [
    {
      id: 'claim-1',
      topicId: 1,
      name: 'KYC_APPROVED',
      description: 'Know Your Customer verification completed',
      schema:
        '{"verified": "boolean", "level": "string", "timestamp": "number"}',
      isRequired: true,
      expirationPeriod: 365,
      renewalPeriod: 30,
      authorizedIssuers: ['issuer-1', 'issuer-2'],
      createdDate: '2024-01-01T00:00:00Z',
      modifiedDate: '2024-06-15T00:00:00Z',
      usage: {
        totalIssued: 21201,
        currentActive: 20124,
        averageValidityPeriod: 340,
      },
    },
    {
      id: 'claim-2',
      topicId: 2,
      name: 'ACCREDITED_INVESTOR',
      description: 'Accredited investor status verification',
      schema:
        '{"accredited": "boolean", "netWorth": "number", "income": "number"}',
      isRequired: false,
      expirationPeriod: 180,
      renewalPeriod: 30,
      authorizedIssuers: ['issuer-2'],
      createdDate: '2024-01-01T00:00:00Z',
      modifiedDate: '2024-05-20T00:00:00Z',
      usage: {
        totalIssued: 3456,
        currentActive: 3321,
        averageValidityPeriod: 165,
      },
    },
  ];

  // Create table data for issuers
  const issuersTableData: TrustedIssuerTableRow[] = trustedIssuers.map(
    issuer => ({
      id: issuer.id,
      name: issuer.name,
      address: issuer.address,
      status: issuer.status,
      claimTypes: issuer.claimTypes,
      verificationsIssued: issuer.verificationsIssued,
      successRate: issuer.successRate,
      lastActivity: issuer.lastActivity,
      complianceScore: issuer.complianceScore,
    })
  );

  // Column definitions for issuers table
  const issuersColumns: Column<TrustedIssuerTableRow>[] = [
    {
      key: 'name',
      label: 'Issuer Name',
      sortable: true,
      render: (value, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{value as string}</span>
          <span className="text-sm text-gray-500">
            {row.address.substring(0, 10)}...
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: value => {
        const status = value as string;
        const statusColors = {
          active: 'bg-green-100 text-green-800',
          suspended: 'bg-red-100 text-red-800',
          pending: 'bg-yellow-100 text-yellow-800',
          revoked: 'bg-gray-100 text-gray-800',
        };
        return (
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[status as keyof typeof statusColors]}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    {
      key: 'claimTypes',
      label: 'Claim Types',
      render: value => {
        const types = value as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {types.slice(0, 2).map((type, index) => (
              <span
                key={index}
                className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
              >
                {type}
              </span>
            ))}
            {types.length > 2 && (
              <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                +{types.length - 2} more
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'verificationsIssued',
      label: 'Verifications',
      sortable: true,
      render: value => (
        <span className="font-medium text-gray-900">
          {(value as number).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'successRate',
      label: 'Success Rate',
      sortable: true,
      render: value => (
        <span className="font-medium text-gray-900">
          {(value as number).toFixed(1)}%
        </span>
      ),
    },
    {
      key: 'complianceScore',
      label: 'Compliance',
      sortable: true,
      render: value => {
        const score = value as number;
        const color =
          score >= 90
            ? 'text-green-600'
            : score >= 70
              ? 'text-yellow-600'
              : 'text-red-600';
        return (
          <span className={`font-medium ${color}`}>{score.toFixed(1)}</span>
        );
      },
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          <button
            onClick={() =>
              setSelectedIssuer(
                trustedIssuers.find(issuer => issuer.id === row.id) || null
              )
            }
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View
          </button>
          <button
            onClick={() => handleSuspendIssuer(row.id)}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            {row.status === 'active' ? 'Suspend' : 'Activate'}
          </button>
        </div>
      ),
    },
  ];

  // Column definitions for activity table
  const activityColumns: Column<IssuerActivity>[] = [
    {
      key: 'timestamp',
      label: 'Time',
      sortable: true,
      render: value => new Date(value as string).toLocaleString(),
    },
    {
      key: 'issuerName',
      label: 'Issuer',
      sortable: true,
    },
    {
      key: 'action',
      label: 'Action',
      render: value => {
        const action = value as string;
        const actionLabels = {
          claim_issued: 'Claim Issued',
          claim_revoked: 'Claim Revoked',
          batch_process: 'Batch Process',
          status_update: 'Status Update',
        };
        return actionLabels[action as keyof typeof actionLabels] || action;
      },
    },
    {
      key: 'details',
      label: 'Details',
    },
    {
      key: 'status',
      label: 'Status',
      render: value => {
        const status = value as string;
        const statusColors = {
          success: 'text-green-600',
          failed: 'text-red-600',
          pending: 'text-yellow-600',
        };
        return (
          <span
            className={`font-medium ${statusColors[status as keyof typeof statusColors]}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
  ];

  // Column definitions for claim types table
  const claimTypesColumns: Column<ClaimType>[] = [
    {
      key: 'name',
      label: 'Claim Type',
      sortable: true,
      render: (value, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{value as string}</span>
          <span className="text-sm text-gray-500">{row.description}</span>
        </div>
      ),
    },
    {
      key: 'isRequired',
      label: 'Required',
      render: value => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            value ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {value ? 'Required' : 'Optional'}
        </span>
      ),
    },
    {
      key: 'expirationPeriod',
      label: 'Validity',
      render: value => `${value} days`,
    },
    {
      key: 'usage',
      label: 'Usage',
      render: value => {
        const usage = value as ClaimType['usage'];
        return (
          <div className="text-sm">
            <div>{usage.totalIssued.toLocaleString()} issued</div>
            <div className="text-gray-500">
              {usage.currentActive.toLocaleString()} active
            </div>
          </div>
        );
      },
    },
    {
      key: 'authorizedIssuers',
      label: 'Authorized Issuers',
      render: value => {
        const issuers = value as string[];
        return `${issuers.length} issuer${issuers.length !== 1 ? 's' : ''}`;
      },
    },
  ];

  const handleAddIssuer = () => {
    setShowAddModal(true);
  };

  const handleSuspendIssuer = (issuerId: string) => {
    // TODO: Implement issuer suspension logic
    // This would call TrustedIssuersRegistry contract to suspend/activate issuer
    void issuerId; // Temporary to avoid unused parameter warning
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      revoked: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trusted Issuers</h1>
          <p className="text-gray-600">
            Manage KYC providers and identity verification issuers
          </p>
        </div>
        <button
          onClick={handleAddIssuer}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          Add Issuer
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Active Issuers
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {trustedIssuers.filter(i => i.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Verifications
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {trustedIssuers
                  .reduce((sum, issuer) => sum + issuer.verificationsIssued, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Avg Success Rate
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {(
                  trustedIssuers
                    .filter(i => i.status === 'active')
                    .reduce((sum, issuer) => sum + issuer.successRate, 0) /
                  trustedIssuers.filter(i => i.status === 'active').length
                ).toFixed(1)}
                %
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Avg Processing Time
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {(
                  trustedIssuers
                    .filter(i => i.status === 'active')
                    .reduce(
                      (sum, issuer) => sum + issuer.averageProcessingTime,
                      0
                    ) / trustedIssuers.filter(i => i.status === 'active').length
                ).toFixed(0)}
                h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'issuers', label: 'Issuers', count: trustedIssuers.length },
            { id: 'activity', label: 'Activity', count: issuerActivity.length },
            {
              id: 'claimTypes',
              label: 'Claim Types',
              count: claimTypes.length,
            },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id as typeof view)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                view === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className="ml-2 py-0.5 px-2 text-xs bg-gray-100 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content based on selected view */}
      <div className="bg-white rounded-lg border border-gray-200">
        {view === 'issuers' && (
          <DataTable
            data={issuersTableData}
            columns={issuersColumns}
            searchable={true}
          />
        )}

        {view === 'activity' && (
          <DataTable
            data={issuerActivity}
            columns={activityColumns}
            searchable={true}
          />
        )}

        {view === 'claimTypes' && (
          <DataTable
            data={claimTypes}
            columns={claimTypesColumns}
            searchable={true}
          />
        )}
      </div>

      {/* Issuer Detail Modal */}
      {selectedIssuer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedIssuer.name}
                  </h2>
                  <p className="text-gray-600">{selectedIssuer.description}</p>
                </div>
                <button
                  onClick={() => setSelectedIssuer(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Basic Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(selectedIssuer.status)}`}
                      >
                        {selectedIssuer.status.charAt(0).toUpperCase() +
                          selectedIssuer.status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Wallet Address
                      </label>
                      <p className="text-sm text-gray-900 font-mono">
                        {selectedIssuer.address}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedIssuer.email}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Country
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedIssuer.country}
                      </p>
                    </div>
                    {selectedIssuer.website && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Website
                        </label>
                        <a
                          href={selectedIssuer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {selectedIssuer.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Performance Metrics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Verifications Issued
                      </span>
                      <span className="text-sm text-gray-900">
                        {selectedIssuer.verificationsIssued.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Active Verifications
                      </span>
                      <span className="text-sm text-gray-900">
                        {selectedIssuer.activeVerifications.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Success Rate
                      </span>
                      <span className="text-sm text-gray-900">
                        {selectedIssuer.successRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Avg Processing Time
                      </span>
                      <span className="text-sm text-gray-900">
                        {selectedIssuer.averageProcessingTime}h
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Compliance Score
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          selectedIssuer.complianceScore >= 90
                            ? 'text-green-600'
                            : selectedIssuer.complianceScore >= 70
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}
                      >
                        {selectedIssuer.complianceScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Claim Types */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Authorized Claim Types
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedIssuer.claimTypes.map((type, index) => (
                      <span
                        key={index}
                        className="inline-flex px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Permissions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Permissions
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(selectedIssuer.permissions).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-gray-700">
                            {key
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/^./, str => str.toUpperCase())}
                          </span>
                          <span
                            className={`text-sm font-medium ${value ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {value ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedIssuer(null)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => handleSuspendIssuer(selectedIssuer.id)}
                  className={`px-4 py-2 rounded-lg text-white ${
                    selectedIssuer.status === 'active'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {selectedIssuer.status === 'active'
                    ? 'Suspend Issuer'
                    : 'Activate Issuer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Issuer Modal - TODO: Implement form */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Add Trusted Issuer
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="text-center py-8">
                <p className="text-gray-500">
                  Add Issuer form implementation pending...
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  This will include fields for issuer details, permissions, and
                  claim type authorization.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
