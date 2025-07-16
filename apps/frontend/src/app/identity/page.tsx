'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, DashboardLayout, StatsCard } from '@/components/ui';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Shield,
  User,
  Calendar,
  RefreshCw,
  Download,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  identityService,
  IdentityClaim,
  IdentityVerificationStatus,
  TrustedIssuer,
} from '@/services';

// Simple toast replacement for now
const toast = {
  success: (message: string) => {
    alert(`✅ ${message}`);
  },
  error: (message: string) => {
    alert(`❌ ${message}`);
  },
  info: (message: string) => {
    alert(`ℹ️ ${message}`);
  },
};

export default function IdentityPage() {
  const router = useRouter();
  const { user, isAuthenticated, isKYCApproved, isIdentityVerified } =
    useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [identityStatus, setIdentityStatus] =
    useState<IdentityVerificationStatus | null>(null);
  const [trustedIssuers, setTrustedIssuers] = useState<TrustedIssuer[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?redirectTo=/identity');
      return;
    }

    loadIdentityData();
  }, [isAuthenticated, router]);

  const loadIdentityData = async () => {
    try {
      setIsLoading(true);

      // Load identity status and trusted issuers in parallel
      const [statusResult, issuersResult] = await Promise.all([
        identityService.getIdentityStatus(),
        identityService.getTrustedIssuers(),
      ]);

      setIdentityStatus(statusResult);
      setTrustedIssuers(issuersResult);
    } catch (error: any) {
      // Error is handled by toast notification
      toast.error('Failed to load identity data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      setRefreshing(true);
      const result = await identityService.refreshIdentityStatus();
      setIdentityStatus(result.newStatus);
      toast.success(
        `Status refreshed. Updated ${result.updatedClaims} claims.`
      );
    } catch (error: any) {
      // Error is handled by toast notification
      toast.error('Failed to refresh status. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportData = async (format: 'json' | 'pdf') => {
    try {
      const blob = await identityService.exportIdentityData(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `identity-data.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Identity data exported as ${format.toUpperCase()}`);
    } catch (error: any) {
      // Error is handled by toast notification
      toast.error('Failed to export data. Please try again.');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading identity data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <p className="text-gray-600">Redirecting to login...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!identityStatus) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Identity Data
            </h3>
            <p className="text-gray-600 mb-4">
              Unable to load your identity verification status.
            </p>
            <Button onClick={loadIdentityData}>Try Again</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Use real claims from identity status
  const claims = identityStatus.claims;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
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
      case 'approved':
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'rejected':
      case 'revoked':
        return 'text-red-600 bg-red-50';
      case 'expired':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleReVerification = async () => {
    setIsLoading(true);
    // TODO: Implement re-verification workflow
    setTimeout(() => {
      setIsLoading(false);
      alert(
        'Re-verification process initiated. You will be redirected to the KYC provider.'
      );
    }, 1000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const daysUntilExpiry = identityStatus.expiresAt
    ? Math.ceil(
        (new Date(identityStatus.expiresAt).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Identity Verification
            </h1>
            <p className="text-gray-600">
              Manage your identity status and verification claims
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefreshStatus}
              disabled={refreshing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              />
              {refreshing ? 'Refreshing...' : 'Refresh Status'}
            </Button>
            <Button
              onClick={() => handleExportData('pdf')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Data
            </Button>
            <Button
              onClick={() => router.push('/kyc')}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Manage KYC
            </Button>
          </div>
        </div>

        {/* Identity Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Verification Status"
            value={identityStatus.isVerified ? 'Verified' : 'Not Verified'}
            icon={
              identityStatus.isVerified ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )
            }
            description={identityStatus.isVerified ? 'Active' : 'Pending'}
            changeType={identityStatus.isVerified ? 'increase' : 'decrease'}
          />
          <StatsCard
            title="KYC Status"
            value={identityStatus.kycStatus.toUpperCase()}
            icon={<Shield className="w-4 h-4" />}
            description={
              identityStatus.completedAt
                ? formatDate(identityStatus.completedAt)
                : 'Not completed'
            }
            changeType={
              identityStatus.kycStatus === 'approved' ? 'increase' : 'decrease'
            }
          />
          <StatsCard
            title="Verification Level"
            value={identityStatus.verificationLevel.toUpperCase()}
            icon={<User className="w-4 h-4" />}
            description={`${identityStatus.claims.length} active claims`}
            changeType={
              identityStatus.verificationLevel !== 'none'
                ? 'increase'
                : 'decrease'
            }
          />
          <StatsCard
            title="Expires In"
            value={`${daysUntilExpiry} days`}
            icon={<Calendar className="w-4 h-4" />}
            description={
              identityStatus.expiresAt
                ? formatDate(identityStatus.expiresAt)
                : 'No expiry'
            }
            changeType={daysUntilExpiry > 30 ? 'increase' : 'decrease'}
          />
        </div>

        {/* Identity Status Card */}
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-primary-50 rounded-lg">
              <Shield className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Identity Status
              </h2>
              <p className="text-gray-600">
                Your current identity verification status and eligibility
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(identityStatus.kycStatus)}
                <div>
                  <h3 className="font-medium text-gray-900">
                    KYC Verification
                  </h3>
                  <p className="text-sm text-gray-600">
                    Completed on{' '}
                    {identityStatus.completedAt
                      ? formatDate(identityStatus.completedAt)
                      : 'N/A'}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(identityStatus.kycStatus)}`}
              >
                {identityStatus.kycStatus.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <h3 className="font-medium text-gray-900">
                    Investment Eligibility
                  </h3>
                  <p className="text-sm text-gray-600">
                    Eligible for all platform investments
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-sm font-medium text-green-600 bg-green-50">
                ELIGIBLE
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="font-medium text-gray-900">
                    Verification Expiry
                  </h3>
                  <p className="text-sm text-gray-600">
                    {identityStatus.expiresAt
                      ? `Expires on ${formatDate(identityStatus.expiresAt)}`
                      : 'No expiry date'}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${daysUntilExpiry > 30 ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50'}`}
              >
                {daysUntilExpiry > 0 ? `${daysUntilExpiry} DAYS` : 'EXPIRED'}
              </span>
            </div>
          </div>
        </Card>

        {/* Active Claims */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Active Claims
              </h2>
              <p className="text-gray-600">
                Your current identity claims and certifications
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/identity/claims')}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              View All Claims
            </Button>
          </div>

          <div className="space-y-4">
            {identityStatus.claims.map(claim => (
              <div
                key={claim.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(claim.status)}
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {claim.type.replace('_', ' ')}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Issued by {claim.issuer} on {formatDate(claim.issuedAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(claim.status)}`}
                  >
                    {claim.status.toUpperCase()}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    Expires:{' '}
                    {claim.expiresAt ? formatDate(claim.expiresAt) : 'Never'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Investment Eligibility */}
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Investment Eligibility
              </h2>
              <p className="text-gray-600">
                Projects and investment opportunities available to you
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <h3 className="font-medium text-green-900">
                  All Platform Projects
                </h3>
                <p className="text-sm text-green-700">
                  Access to all tokenized infrastructure projects
                </p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <h3 className="font-medium text-green-900">
                  Accredited Investor Benefits
                </h3>
                <p className="text-sm text-green-700">
                  Higher investment limits and exclusive projects
                </p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <h3 className="font-medium text-green-900">
                  Governance Participation
                </h3>
                <p className="text-sm text-green-700">
                  Vote on project proposals and platform governance
                </p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Verification Timeline */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Verification Timeline
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  KYC Verification Completed
                </h3>
                <p className="text-sm text-gray-600">
                  {identityStatus.completedAt
                    ? formatDate(identityStatus.completedAt)
                    : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  Identity Claims Issued
                </h3>
                <p className="text-sm text-gray-600">
                  {identityStatus.claims.length} claims added to your identity
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  Investment Access Granted
                </h3>
                <p className="text-sm text-gray-600">
                  Full access to all platform investments
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
