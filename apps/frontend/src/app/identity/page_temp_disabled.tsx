'use client';

// Force dynamic rendering for presentation mode compatibility
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button, DashboardLayout } from '@/components/ui';
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
  // IdentityClaim,
  IdentityVerificationStatus,
  TrustedIssuer,
} from '@/services';

import { PageTransition } from '@/components/ui/PageTransition';
import { ScrollReveal, StaggeredList } from '@/components/ui/ScrollAnimations';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { ToastProvider, toast } from '@/components/ui/AnimatedNotification';

export default function IdentityPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const {
    // user,
    isAuthenticated,
    // isKYCApproved,
    // isIdentityVerified
  } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [identityStatus, setIdentityStatus] =
    useState<IdentityVerificationStatus | null>(null);
  const [trustedIssuers, setTrustedIssuers] = useState<TrustedIssuer[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  trustedIssuers;

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
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Fluid Background Shapes */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="fluid-shape-1 top-20 right-16"></div>
          <div className="fluid-shape-2 top-1/2 left-10"></div>
          <div className="fluid-shape-3 bottom-32 right-1/4"></div>
          <div className="fluid-shape-1 bottom-10 left-16"></div>
        </div>

        <DashboardLayout>
          <div className="animate-pulse space-y-8 p-6 relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div className="space-y-2">
                <div className="glass-feature h-8 w-64 rounded-xl"></div>
                <div className="glass-feature h-4 w-96 rounded-lg"></div>
              </div>
              <div className="flex gap-3">
                <div className="glass-feature h-10 w-24 rounded-xl"></div>
                <div className="glass-feature h-10 w-24 rounded-xl"></div>
                <div className="glass-feature h-10 w-24 rounded-xl"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="glass-feature h-32 rounded-2xl"></div>
              ))}
            </div>
            <div className="glass-feature h-96 rounded-2xl"></div>
          </div>
        </DashboardLayout>
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="fluid-shape-1 top-20 right-16"></div>
          <div className="fluid-shape-2 top-1/2 left-10"></div>
          <div className="fluid-shape-3 bottom-32 right-1/4"></div>
        </div>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-96 relative z-10">
            <div className="text-center">
              <p className="text-primary-600">Redirecting to login...</p>
            </div>
          </div>
        </DashboardLayout>
      </div>
    );
  }

  if (!identityStatus) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="fluid-shape-1 top-20 right-16"></div>
          <div className="fluid-shape-2 top-1/2 left-10"></div>
          <div className="fluid-shape-3 bottom-32 right-1/4"></div>
        </div>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-96 relative z-10">
            <div className="text-center">
              <div className="w-16 h-16 feature-icon mx-auto mb-6 hover-scale">
                <AlertTriangle className="w-8 h-8 text-accent-500" />
              </div>
              <h3 className="text-xl font-semibold text-gradient mb-3">
                No Identity Data
              </h3>
              <p className="text-primary-600 mb-6">
                Unable to load your identity verification status.
              </p>
              <Button
                onClick={loadIdentityData}
                className="btn-modern btn-modern-primary hover-lift"
              >
                Try Again
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </div>
    );
  }

  // Use real claims from identity status
  // const claims = identityStatus.claims;

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

  // const handleReVerification = async () => {
  //   setIsLoading(true);
  //   // TODO: Implement re-verification workflow
  //   setTimeout(() => {
  //     setIsLoading(false);
  //     alert(
  //       'Re-verification process initiated. You will be redirected to the KYC provider.'
  //     );
  //   }, 1000);
  // };

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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Toast Provider for notifications */}
      <ToastProvider />

      {/* Page Transition Wrapper */}
      <PageTransition type="fade" duration={300} transitionKey="identity">
        {/* Fluid Background Shapes */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="fluid-shape-1 top-20 right-16"></div>
          <div className="fluid-shape-2 top-1/2 left-10"></div>
          <div className="fluid-shape-3 bottom-32 right-1/4"></div>
          <div className="fluid-shape-1 bottom-10 left-16"></div>
        </div>

        <DashboardLayout>
          <div className="space-y-8 p-6 relative z-10">
            {/* Header */}
            <ScrollReveal animation="fade" delay={0}>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gradient mb-2">
                    {t('identity.title')}
                  </h1>
                  <p className="text-muted-foreground">
                    {t('identity.subtitle')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <AnimatedButton
                    onClick={handleRefreshStatus}
                    disabled={refreshing}
                    variant="outline"
                    className="flex items-center gap-2"
                    ripple
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                    />
                    {refreshing
                      ? t('identity.refreshing')
                      : t('identity.refreshStatus')}
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={() => handleExportData('pdf')}
                    variant="outline"
                    className="flex items-center gap-2"
                    ripple
                  >
                    <Download className="w-4 h-4" />
                    {t('identity.exportData')}
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={() => router.push('/kyc')}
                    className="flex items-center gap-2"
                    ripple
                  >
                    <Settings className="w-4 h-4" />
                    {t('identity.manageKyc')}
                  </AnimatedButton>
                </div>
              </div>
            </ScrollReveal>

            {/* Identity Status Overview */}
            <ScrollReveal animation="slide-up" delay={100}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 ${identityStatus.isVerified ? 'bg-gradient-to-br from-success-500 to-success-600' : 'bg-gradient-to-br from-accent-500 to-accent-600'} rounded-xl flex items-center justify-center`}
                    >
                      {identityStatus.isVerified ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <XCircle className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${identityStatus.isVerified ? 'text-success-600' : 'text-accent-600'}`}
                    >
                      {identityStatus.isVerified ? 'Active' : 'Pending'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gradient">
                      {identityStatus.isVerified ? 'Verified' : 'Not Verified'}
                    </h3>
                    <p className="text-sm font-medium text-primary-700">
                      Verification Status
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {identityStatus.isVerified
                        ? 'Identity confirmed'
                        : 'Verification needed'}
                    </p>
                  </div>
                </div>

                <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 ${identityStatus.kycStatus === 'approved' ? 'bg-gradient-to-br from-primary-500 to-primary-600' : 'bg-gradient-to-br from-secondary-500 to-secondary-600'} rounded-xl flex items-center justify-center`}
                    >
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <span
                      className={`text-xs font-medium ${identityStatus.kycStatus === 'approved' ? 'text-success-600' : 'text-secondary-600'}`}
                    >
                      {identityStatus.completedAt
                        ? formatDate(identityStatus.completedAt)
                        : 'Not completed'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gradient">
                      {identityStatus.kycStatus.toUpperCase()}
                    </h3>
                    <p className="text-sm font-medium text-primary-700">
                      KYC Status
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Know Your Customer verification
                    </p>
                  </div>
                </div>

                <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 ${identityStatus.verificationLevel !== 'none' ? 'bg-gradient-to-br from-support-500 to-support-600' : 'bg-gradient-to-br from-muted-500 to-muted-600'} rounded-xl flex items-center justify-center`}
                    >
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {identityStatus.claims.length} claims
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gradient">
                      {identityStatus.verificationLevel.toUpperCase()}
                    </h3>
                    <p className="text-sm font-medium text-primary-700">
                      Verification Level
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Active identity claims
                    </p>
                  </div>
                </div>

                <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 ${daysUntilExpiry > 30 ? 'bg-gradient-to-br from-success-500 to-success-600' : 'bg-gradient-to-br from-accent-500 to-accent-600'} rounded-xl flex items-center justify-center`}
                    >
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <span
                      className={`text-xs font-medium ${daysUntilExpiry > 30 ? 'text-success-600' : 'text-accent-600'}`}
                    >
                      {identityStatus.expiresAt
                        ? formatDate(identityStatus.expiresAt)
                        : 'No expiry'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gradient">
                      {daysUntilExpiry} days
                    </h3>
                    <p className="text-sm font-medium text-primary-700">
                      Expires In
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Time until renewal needed
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Identity Status Card */}
            <ScrollReveal animation="slide-up" delay={200}>
              <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gradient mb-2">
                      Identity Status
                    </h2>
                    <p className="text-primary-600">
                      Your current identity verification status and eligibility
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="glass-modern rounded-xl p-6 hover-lift transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                          {getStatusIcon(identityStatus.kycStatus)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-primary-800 mb-1">
                            KYC Verification
                          </h3>
                          <p className="text-sm text-primary-600">
                            Completed on{' '}
                            {identityStatus.completedAt
                              ? formatDate(identityStatus.completedAt)
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-4 py-2 rounded-xl text-sm font-bold ${getStatusColor(
                          identityStatus.kycStatus
                        )
                          .replace('bg-', 'bg-gradient-to-r from-')
                          .replace(
                            '-50',
                            '-100 to-' +
                              getStatusColor(identityStatus.kycStatus).split(
                                '-'
                              )[1] +
                              '-200'
                          )}`}
                      >
                        {identityStatus.kycStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="glass-modern rounded-xl p-6 hover-lift transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-600 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-primary-800 mb-1">
                            Investment Eligibility
                          </h3>
                          <p className="text-sm text-primary-600">
                            Eligible for all platform investments
                          </p>
                        </div>
                      </div>
                      <span className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-success-100 to-success-200 text-success-700">
                        ELIGIBLE
                      </span>
                    </div>
                  </div>

                  <div className="glass-modern rounded-xl p-6 hover-lift transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 ${daysUntilExpiry > 30 ? 'bg-gradient-to-br from-primary-500 to-primary-600' : 'bg-gradient-to-br from-accent-500 to-accent-600'} rounded-lg flex items-center justify-center`}
                        >
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-primary-800 mb-1">
                            Verification Expiry
                          </h3>
                          <p className="text-sm text-primary-600">
                            {identityStatus.expiresAt
                              ? `Expires on ${formatDate(identityStatus.expiresAt)}`
                              : 'No expiry date'}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-4 py-2 rounded-xl text-sm font-bold ${daysUntilExpiry > 30 ? 'bg-gradient-to-r from-success-100 to-success-200 text-success-700' : 'bg-gradient-to-r from-accent-100 to-accent-200 text-accent-700'}`}
                      >
                        {daysUntilExpiry > 0
                          ? `${daysUntilExpiry} DAYS`
                          : 'EXPIRED'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Active Claims */}
            <ScrollReveal animation="slide-up" delay={300}>
              <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-semibold text-gradient mb-2">
                      Active Claims
                    </h2>
                    <p className="text-primary-600">
                      Your current identity claims and certifications
                    </p>
                  </div>
                  <AnimatedButton
                    variant="outline"
                    onClick={() => (window.location.href = '/identity/claims')}
                    className="flex items-center gap-2"
                    ripple
                  >
                    <FileText className="w-4 h-4" />
                    View All Claims
                  </AnimatedButton>
                </div>

                <StaggeredList itemDelay={100}>
                  {identityStatus.claims.map(claim => (
                    <div
                      key={claim.id}
                      className="glass-modern rounded-xl p-6 hover-lift transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                            {getStatusIcon(claim.status)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-primary-800 mb-1">
                              {claim.type.replace('_', ' ')}
                            </h3>
                            <p className="text-sm text-primary-600">
                              Issued by {claim.issuer} on{' '}
                              {formatDate(claim.issuedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-4 py-2 rounded-xl text-sm font-bold ${getStatusColor(
                              claim.status
                            )
                              .replace('bg-', 'bg-gradient-to-r from-')
                              .replace(
                                '-50',
                                '-100 to-' +
                                  getStatusColor(claim.status).split('-')[1] +
                                  '-200'
                              )}`}
                          >
                            {claim.status.toUpperCase()}
                          </span>
                          <p className="text-sm text-primary-600 mt-2">
                            Expires:{' '}
                            {claim.expiresAt
                              ? formatDate(claim.expiresAt)
                              : 'Never'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </StaggeredList>
              </div>
            </ScrollReveal>

            {/* Investment Eligibility */}
            <ScrollReveal animation="slide-up" delay={400}>
              <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gradient mb-2">
                      Investment Eligibility
                    </h2>
                    <p className="text-primary-600">
                      Projects and investment opportunities available to you
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="glass-hero rounded-xl p-6 hover-lift transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-success-800 mb-1">
                          All Platform Projects
                        </h3>
                        <p className="text-sm text-success-700">
                          Access to all tokenized infrastructure projects
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-gradient-to-br from-success-500 to-success-600 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="glass-hero rounded-xl p-6 hover-lift transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-success-800 mb-1">
                          Accredited Investor Benefits
                        </h3>
                        <p className="text-sm text-success-700">
                          Higher investment limits and exclusive projects
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-gradient-to-br from-success-500 to-success-600 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="glass-hero rounded-xl p-6 hover-lift transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-success-800 mb-1">
                          Governance Participation
                        </h3>
                        <p className="text-sm text-success-700">
                          Vote on project proposals and platform governance
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-gradient-to-br from-success-500 to-success-600 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Verification Timeline */}
            <ScrollReveal animation="slide-up" delay={500}>
              <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                <h2 className="text-2xl font-semibold text-gradient mb-8">
                  Verification Timeline
                </h2>
                <StaggeredList itemDelay={100}>
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary-800 mb-1">
                        KYC Verification Completed
                      </h3>
                      <p className="text-sm text-primary-600">
                        {identityStatus.completedAt
                          ? formatDate(identityStatus.completedAt)
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary-800 mb-1">
                        Identity Claims Issued
                      </h3>
                      <p className="text-sm text-primary-600">
                        {identityStatus.claims.length} claims added to your
                        identity
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-support-500 to-support-600 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary-800 mb-1">
                        Investment Access Granted
                      </h3>
                      <p className="text-sm text-primary-600">
                        Full access to all platform investments
                      </p>
                    </div>
                  </div>
                </StaggeredList>
              </div>
            </ScrollReveal>
          </div>
        </DashboardLayout>
      </PageTransition>
    </div>
  );
}
