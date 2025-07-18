'use client';

import { useState } from 'react';
import { Card, DashboardLayout, DataTable } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { ScrollReveal, StaggeredList } from '@/components/ui/ScrollAnimations';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { ToastProvider, toast } from '@/components/ui/AnimatedNotification';

interface ClaimDetail {
  id: string;
  type: string;
  description: string;
  value: string;
  issuer: string;
  issuerAddress: string;
  issuedAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'revoked' | 'pending';
  verified: boolean;
  proofHash: string;
  renewalRequired: boolean;
}

export default function ClaimsPage() {
  const [selectedClaim, setSelectedClaim] = useState<ClaimDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Mock claims data - replace with actual ClaimTopicsRegistry contract integration
  const claims: ClaimDetail[] = [
    {
      id: '1',
      type: 'KYC_APPROVED',
      description: 'Know Your Customer verification completed',
      value: 'true',
      issuer: 'Verihubs Indonesia',
      issuerAddress: '0x742d35Cc6634C0532925a3b8D22Ad6dDe36Cd12C',
      issuedAt: '2024-01-15T10:30:00Z',
      expiresAt: '2025-01-15T10:30:00Z',
      status: 'active',
      verified: true,
      proofHash:
        '0x8a7b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
      renewalRequired: false,
    },
    {
      id: '2',
      type: 'ACCREDITED_INVESTOR',
      description: 'Qualified as accredited investor',
      value: 'true',
      issuer: 'Partisipro Platform',
      issuerAddress: '0x123a456b789c012d345e678f901a234b567c890d',
      issuedAt: '2024-01-15T10:35:00Z',
      expiresAt: '2025-01-15T10:35:00Z',
      status: 'active',
      verified: true,
      proofHash:
        '0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      renewalRequired: false,
    },
    {
      id: '3',
      type: 'INDONESIAN_RESIDENT',
      description: 'Verified Indonesian resident',
      value: 'true',
      issuer: 'Verihubs Indonesia',
      issuerAddress: '0x742d35Cc6634C0532925a3b8D22Ad6dDe36Cd12C',
      issuedAt: '2024-01-15T10:30:00Z',
      expiresAt: '2025-01-15T10:30:00Z',
      status: 'active',
      verified: true,
      proofHash:
        '0x2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
      renewalRequired: false,
    },
    {
      id: '4',
      type: 'QUALIFIED_INVESTOR',
      description: 'Qualified investor certification',
      value: 'true',
      issuer: 'OJK (Otoritas Jasa Keuangan)',
      issuerAddress: '0x456a789b012c345d678e901f234a567b890c123d',
      issuedAt: '2024-02-01T14:20:00Z',
      expiresAt: '2024-12-31T23:59:59Z',
      status: 'active',
      verified: true,
      proofHash:
        '0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
      renewalRequired: true,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'revoked':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'expired':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'revoked':
        return 'text-red-600 bg-red-50';
      case 'expired':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const days = Math.ceil(
      (new Date(expiryDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const handleRenewal = async (claimId: string) => {
    claimId;

    setIsLoading(true);
    // TODO: Implement claim renewal workflow
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Renewal Initiated', {
        message:
          'Claim renewal process initiated. You will be contacted by the issuer.',
        duration: 4000,
      });
    }, 1000);
  };

  const handleViewProof = (claim: ClaimDetail) => {
    setSelectedClaim(claim);
  };

  const claimsTableData = claims.map(claim => ({
    id: claim.id,
    type: claim.type.replace('_', ' '),
    issuer: claim.issuer,
    issuerAddress: claim.issuerAddress,
    issuedAt: formatDate(claim.issuedAt),
    expiresAt: claim.expiresAt,
    status: claim.status,
    renewalRequired: claim.renewalRequired,
    verified: claim.verified,
    proofHash: claim.proofHash,
    actions: claim,
  }));

  const columns: Column<(typeof claimsTableData)[0]>[] = [
    {
      label: 'Claim Type',
      key: 'type',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary-600" />
          <span className="font-medium">{row.type as string}</span>
        </div>
      ),
    },
    {
      label: 'Issuer',
      key: 'issuer',
      render: (_, row) => (
        <div>
          <div className="font-medium">{row.issuer as string}</div>
          <div className="text-sm text-gray-500">
            {row.issuerAddress.slice(0, 10)}...
          </div>
        </div>
      ),
    },
    {
      label: 'Issued',
      key: 'issuedAt',
      render: (_, row) => (
        <div className="text-sm">{row.issuedAt as string}</div>
      ),
    },
    {
      label: 'Expires',
      key: 'expiresAt',
      render: (_, row) => {
        const days = getDaysUntilExpiry(row.expiresAt);
        return (
          <div>
            <div className="text-sm">{row.expiresAt as string}</div>
            <div
              className={`text-xs ${days <= 30 ? 'text-yellow-600' : 'text-gray-500'}`}
            >
              {days > 0 ? `${days} days remaining` : 'Expired'}
            </div>
          </div>
        );
      },
    },
    {
      label: 'Status',
      key: 'status',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(row.status as string)}
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status as string)}`}
          >
            {(row.status as string).toUpperCase()}
          </span>
        </div>
      ),
    },
    {
      label: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <AnimatedButton
            size="sm"
            variant="outline"
            onClick={() => handleViewProof(row.actions)}
            className="flex items-center gap-1"
            ripple
          >
            <Eye className="w-3 h-3" />
            View
          </AnimatedButton>
          {row.renewalRequired && (
            <AnimatedButton
              size="sm"
              variant="outline"
              onClick={() => handleRenewal(row.id)}
              disabled={isLoading}
              loading={isLoading}
              className="flex items-center gap-1"
              ripple
            >
              <RefreshCw className="w-3 h-3" />
              Renew
            </AnimatedButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Toast Provider for notifications */}
      <ToastProvider />

      {/* Page Transition Wrapper */}
      <PageTransition
        type="fade"
        duration={300}
        transitionKey="identity-claims"
      >
        {/* Fluid Background Shapes */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="fluid-shape-1 top-20 right-16"></div>
          <div className="fluid-shape-2 top-1/2 left-10"></div>
          <div className="fluid-shape-3 bottom-32 right-1/4"></div>
          <div className="fluid-shape-1 bottom-10 left-16"></div>
        </div>

        <DashboardLayout>
          <div className="space-y-6 p-6 relative z-10">
            {/* Header */}
            <ScrollReveal animation="fade" delay={0}>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gradient mb-2">
                    Identity Claims
                  </h1>
                  <p className="text-muted-foreground">
                    Manage your identity claims and certifications
                  </p>
                </div>
                <AnimatedButton
                  onClick={() => (window.location.href = '/identity')}
                  variant="outline"
                  className="flex items-center gap-2"
                  ripple
                >
                  <Shield className="w-4 h-4" />
                  Back to Identity
                </AnimatedButton>
              </div>
            </ScrollReveal>

            {/* Claims Statistics */}
            <ScrollReveal animation="slide-up" delay={100}>
              <StaggeredList
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
                itemDelay={100}
              >
                <Card className="glass-feature p-6 hover-lift transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary-600">
                        Active Claims
                      </p>
                      <p className="text-2xl font-bold text-gradient">
                        {claims.filter(c => c.status === 'active').length}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="glass-feature p-6 hover-lift transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary-600">
                        Expiring Soon
                      </p>
                      <p className="text-2xl font-bold text-gradient">
                        {
                          claims.filter(
                            c => getDaysUntilExpiry(c.expiresAt) <= 30
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="glass-feature p-6 hover-lift transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-support-500 to-support-600 rounded-xl flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary-600">
                        Renewal Required
                      </p>
                      <p className="text-2xl font-bold text-gradient">
                        {claims.filter(c => c.renewalRequired).length}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="glass-feature p-6 hover-lift transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary-600">
                        Verified Claims
                      </p>
                      <p className="text-2xl font-bold text-gradient">
                        {claims.filter(c => c.verified).length}
                      </p>
                    </div>
                  </div>
                </Card>
              </StaggeredList>
            </ScrollReveal>

            {/* Claims Table */}
            <ScrollReveal animation="slide-up" delay={200}>
              <Card className="glass-feature p-8 hover-lift transition-all duration-300">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gradient mb-2">
                    All Claims
                  </h2>
                  <p className="text-primary-600">
                    Complete list of your identity claims and their status
                  </p>
                </div>
                <DataTable data={claimsTableData} columns={columns} />
              </Card>
            </ScrollReveal>

            {/* Claim Detail Modal */}
            {selectedClaim && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="glass-feature rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-up">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gradient">
                      Claim Details
                    </h2>
                    <AnimatedButton
                      variant="outline"
                      onClick={() => setSelectedClaim(null)}
                      className="text-primary-500 hover:text-primary-700"
                      ripple
                    >
                      ×
                    </AnimatedButton>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Claim Type
                        </label>
                        <p className="text-gray-900">
                          {selectedClaim.type.replace('_', ' ')}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(selectedClaim.status)}
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedClaim.status)}`}
                          >
                            {selectedClaim.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <p className="text-gray-900">
                        {selectedClaim.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Issuer
                        </label>
                        <p className="text-gray-900">{selectedClaim.issuer}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Issuer Address
                        </label>
                        <p className="text-gray-900 font-mono text-sm">
                          {selectedClaim.issuerAddress}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Issued At
                        </label>
                        <p className="text-gray-900">
                          {formatDate(selectedClaim.issuedAt)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expires At
                        </label>
                        <p className="text-gray-900">
                          {formatDate(selectedClaim.expiresAt)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Proof Hash
                      </label>
                      <p className="text-gray-900 font-mono text-sm break-all bg-gray-50 p-3 rounded-lg">
                        {selectedClaim.proofHash}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700">Verified</span>
                      </div>
                      {selectedClaim.renewalRequired && (
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-gray-700">
                            Renewal Required
                          </span>
                        </div>
                      )}
                    </div>

                    {selectedClaim.renewalRequired && (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <span className="font-medium text-yellow-800">
                            Renewal Required
                          </span>
                        </div>
                        <p className="text-sm text-yellow-700 mb-3">
                          This claim requires renewal before it expires. Contact
                          the issuer to begin the renewal process.
                        </p>
                        <AnimatedButton
                          onClick={() => handleRenewal(selectedClaim.id)}
                          disabled={isLoading}
                          loading={isLoading}
                          className="flex items-center gap-2"
                          ripple
                        >
                          <RefreshCw className="w-4 h-4" />
                          {isLoading ? 'Processing...' : 'Start Renewal'}
                        </AnimatedButton>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DashboardLayout>
      </PageTransition>
    </div>
  );
}
