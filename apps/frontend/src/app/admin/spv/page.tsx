'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Check,
  X,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Filter,
  RefreshCw,
  Building,
  Users,
  Shield,
} from 'lucide-react';
import {
  Button,
  Card,
  StatsCard,
  DashboardLayout,
  DataTable,
  Modal,
} from '@/components/ui';
import type { Column } from '@/components/ui/DataTable';
import { adminService } from '@/services/admin.service';
import type {
  SPVApplication,
  ApprovedSPV,
  SPVStats,
} from '@/services/admin.service';

// SPVStats interface now imported from admin.service.ts

// Removed unused mock data - now using real API data from adminService

const formatCurrency = (amount: number) => {
  if (amount >= 1000000000000) {
    return `Rp ${(amount / 1000000000000).toFixed(1)}T`;
  } else if (amount >= 1000000000) {
    return `Rp ${(amount / 1000000000).toFixed(1)}B`;
  } else if (amount >= 1000000) {
    return `Rp ${(amount / 1000000).toFixed(1)}M`;
  }
  return `Rp ${amount.toLocaleString()}`;
};

const getStatusIcon = (status: SPVApplication['status']) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'under_review':
      return <AlertTriangle className="h-4 w-4" />;
    case 'approved':
      return <CheckCircle className="h-4 w-4" />;
    case 'rejected':
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getStatusColor = (status: SPVApplication['status']) => {
  switch (status) {
    case 'pending':
      return 'text-gray-500';
    case 'under_review':
      return 'text-primary-500';
    case 'approved':
      return 'text-support-500';
    case 'rejected':
      return 'text-accent-500';
    default:
      return 'text-gray-500';
  }
};

const getApprovedStatusColor = (status: ApprovedSPV['status']) => {
  switch (status) {
    case 'active':
      return 'text-support-500';
    case 'suspended':
      return 'text-accent-500';
    case 'inactive':
      return 'text-gray-500';
    default:
      return 'text-gray-500';
  }
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInHours = Math.floor(
    (now.getTime() - time.getTime()) / (1000 * 60 * 60)
  );

  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
};

export default function AdminSPVPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'applications' | 'approved'>(
    'applications'
  );
  const [selectedApplication, setSelectedApplication] =
    useState<SPVApplication | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(
    null
  );
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authentication guard
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      window.location.href = '/auth/signin';
      return;
    }
  }, [isAuthenticated, isAdmin]);

  // State for API data
  const [spvStats, setSpvStats] = useState<SPVStats | null>(null);
  const [applications, setApplications] = useState<SPVApplication[]>([]);
  const [approvedSPVs, setApprovedSPVs] = useState<ApprovedSPV[]>([]);

  // Load SPV data
  const loadSPVData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [statsData, applicationsData, approvedData] = await Promise.all([
        adminService.getSPVStats(),
        adminService.getSPVApplications(),
        adminService.getApprovedSPVs(),
      ]);

      setSpvStats(statsData);
      setApplications(applicationsData.applications);
      setApprovedSPVs(approvedData.spvs);
    } catch (err) {
      setError('Failed to load SPV data');
      // Error logged for debugging
      if (err instanceof Error) {
        setError(`Failed to load SPV data: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadSPVData();
  }, []);

  const handleViewApplication = (application: SPVApplication) => {
    setSelectedApplication(application);
    setIsReviewModalOpen(true);
    setReviewAction(null);
    setReviewNotes(application.reviewNotes || '');
  };

  const handleReviewAction = async (action: 'approve' | 'reject') => {
    if (!selectedApplication) return;

    setReviewAction(action);
    setIsSubmitting(true);

    try {
      await adminService.reviewSPVApplication({
        applicationId: selectedApplication.id,
        action,
        reviewNotes,
      });

      // Refresh data after successful review
      await loadSPVData();
    } catch (err) {
      setError(`Failed to ${action} SPV application`);
    } finally {
      setIsSubmitting(false);
      setIsReviewModalOpen(false);
      setSelectedApplication(null);
      setReviewAction(null);
      setReviewNotes('');
    }
  };

  const handleSuspendSPV = async (spvId: string) => {
    try {
      setIsLoading(true);
      await adminService.suspendSPV(spvId, 'Suspended by admin');
      await loadSPVData();
    } catch (err) {
      setError('Failed to suspend SPV');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateSPV = async (spvId: string) => {
    try {
      setIsLoading(true);
      await adminService.activateSPV(spvId);
      await loadSPVData();
    } catch (err) {
      setError('Failed to activate SPV');
    } finally {
      setIsLoading(false);
    }
  };

  const applicationColumns: Column<SPVApplication>[] = [
    {
      key: 'companyName',
      label: 'Company',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.companyName}</span>
          <span className="text-sm text-gray-500">{row.businessType}</span>
        </div>
      ),
    },
    {
      key: 'contactPerson',
      label: 'Contact',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="text-sm text-gray-900">{row.contactPerson}</span>
          <span className="text-xs text-gray-500">{row.email}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => (
        <div
          className={`flex items-center gap-2 ${getStatusColor(row.status)}`}
        >
          {getStatusIcon(row.status)}
          <span className="capitalize font-medium">
            {row.status.replace('_', ' ')}
          </span>
        </div>
      ),
    },
    {
      key: 'documents',
      label: 'Documents',
      render: (_, row) => {
        const docs = row.documents;
        const completed = Object.values(docs).filter(Boolean).length;
        const total = Object.keys(docs).length;

        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {completed}/{total} Complete
            </span>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div
                className="bg-primary-500 h-1.5 rounded-full"
                style={{ width: `${(completed / total) * 100}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'submittedDate',
      label: 'Submitted',
      render: (_, row) => (
        <span className="text-sm text-gray-600">
          {formatTimeAgo(row.submittedDate)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewApplication(row)}
        >
          <Eye className="h-4 w-4 mr-1" />
          Review
        </Button>
      ),
    },
  ];

  const approvedSPVColumns: Column<ApprovedSPV>[] = [
    {
      key: 'companyName',
      label: 'Company',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.companyName}</span>
          <span className="text-sm text-gray-500 font-mono">
            {row.walletAddress}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => (
        <span
          className={`capitalize font-medium ${getApprovedStatusColor(row.status)}`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'projectsCreated',
      label: 'Projects',
      render: (_, row) => (
        <span className="font-medium">{row.projectsCreated}</span>
      ),
    },
    {
      key: 'totalFundingRaised',
      label: 'Total Funding',
      render: (_, row) => (
        <span className="font-medium">
          {formatCurrency(row.totalFundingRaised)}
        </span>
      ),
    },
    {
      key: 'performanceScore',
      label: 'Performance',
      render: (_, row) => (
        <span className="text-support-600 font-medium">
          {row.performanceScore}/10
        </span>
      ),
    },
    {
      key: 'lastActivity',
      label: 'Last Activity',
      render: (_, row) => (
        <span className="text-sm text-gray-600">
          {formatTimeAgo(row.lastActivity)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-1">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          {row.status === 'active' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSuspendSPV(row.id)}
            >
              Suspend
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleActivateSPV(row.id)}
            >
              Activate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SPV Management</h1>
            <p className="text-gray-600">
              Review applications and manage approved SPVs
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={loadSPVData}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Pending Applications"
            value={spvStats?.pendingApplications.toString() || '0'}
            icon={<Clock className="w-4 h-4" />}
            change={0}
            changeType="neutral"
            description="Awaiting review"
          />
          <StatsCard
            title="Approved SPVs"
            value={spvStats?.approvedSPVs.toString() || '0'}
            icon={<Shield className="w-4 h-4" />}
            change={8.3}
            changeType="increase"
            description="Active on platform"
          />
          <StatsCard
            title="Projects Created"
            value={spvStats?.totalProjectsCreated.toString() || '0'}
            icon={<Building className="w-4 h-4" />}
            change={12.5}
            changeType="increase"
            description="By approved SPVs"
          />
          <StatsCard
            title="Funding Facilitated"
            value={formatCurrency(spvStats?.totalFundingFacilitated || 0)}
            icon={<Users className="w-4 h-4" />}
            change={24.7}
            changeType="increase"
            description="Total platform volume"
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'applications'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('applications')}
            >
              Pending Applications ({spvStats?.pendingApplications || 0})
            </button>
            <button
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'approved'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('approved')}
            >
              Approved SPVs ({spvStats?.approvedSPVs || 0})
            </button>
          </nav>
        </div>

        {/* Content */}
        <Card className="p-6">
          {activeTab === 'applications' ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    SPV Applications
                  </h2>
                  <p className="text-sm text-gray-600">
                    Review and approve new SPV applications
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>

              <DataTable<SPVApplication>
                columns={applicationColumns}
                data={applications}
              />
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Approved SPVs
                  </h2>
                  <p className="text-sm text-gray-600">
                    Manage and monitor approved SPV performance
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>

              <DataTable<ApprovedSPV>
                columns={approvedSPVColumns}
                data={approvedSPVs}
              />
            </div>
          )}
        </Card>

        {/* Review Modal */}
        <Modal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          title="SPV Application Review"
        >
          {selectedApplication && (
            <div className="space-y-6">
              {/* Company Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedApplication.companyName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Legal Entity Type
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedApplication.legalEntityType}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Registration Number
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedApplication.registrationNumber}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Years of Operation
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedApplication.yearsOfOperation} years
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contact Person
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedApplication.contactPerson}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedApplication.email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedApplication.phone}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedApplication.website || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Document Checklist */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Document Verification
                </label>
                <div className="space-y-2">
                  {Object.entries(selectedApplication.documents).map(
                    ([key, completed]) => (
                      <div key={key} className="flex items-center">
                        {completed ? (
                          <CheckCircle className="h-5 w-5 text-support-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-accent-500" />
                        )}
                        <span className="ml-2 text-sm text-gray-900 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Review Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Notes
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add review notes..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleReviewAction('reject')}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  {isSubmitting && reviewAction === 'reject'
                    ? 'Rejecting...'
                    : 'Reject'}
                </Button>
                <Button
                  onClick={() => handleReviewAction('approve')}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {isSubmitting && reviewAction === 'approve'
                    ? 'Approving...'
                    : 'Approve'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
