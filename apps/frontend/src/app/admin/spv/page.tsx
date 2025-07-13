'use client';

import { useState } from 'react';
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
import type { SPVApplication, ApprovedSPV } from '@/types';

interface SPVStats {
  pendingApplications: number;
  approvedSPVs: number;
  totalProjectsCreated: number;
  totalFundingFacilitated: number;
}

const mockSPVStats: SPVStats = {
  pendingApplications: 12,
  approvedSPVs: 45,
  totalProjectsCreated: 156,
  totalFundingFacilitated: 45200000000000, // 45.2T IDR
};

const mockPendingApplications: SPVApplication[] = [
  {
    id: '1',
    companyName: 'PT Infrastruktur Nusantara',
    legalEntityType: 'PT (Perseroan Terbatas)',
    registrationNumber: 'AHU-123456789',
    contactPerson: 'Budi Santoso',
    email: 'budi.santoso@infranus.co.id',
    phone: '+62-21-5551-2345',
    website: 'https://infranus.co.id',
    businessType: 'Infrastructure Development',
    yearsOfOperation: 8,
    submittedDate: '2025-01-08T10:30:00Z',
    status: 'pending',
    documents: {
      businessLicense: true,
      taxCertificate: true,
      auditedFinancials: true,
      companyProfile: true,
      bankReference: false,
    },
    estimatedProjectValue: 2500000000000, // 2.5T IDR
  },
  {
    id: '2',
    companyName: 'PT Jembatan Modern',
    legalEntityType: 'PT (Perseroan Terbatas)',
    registrationNumber: 'AHU-987654321',
    contactPerson: 'Sari Dewi',
    email: 'sari.dewi@jembatanmodern.com',
    phone: '+62-31-7770-8888',
    businessType: 'Bridge & Transportation Infrastructure',
    yearsOfOperation: 12,
    submittedDate: '2025-01-07T14:15:00Z',
    status: 'under_review',
    documents: {
      businessLicense: true,
      taxCertificate: true,
      auditedFinancials: true,
      companyProfile: true,
      bankReference: true,
    },
    reviewNotes: 'Strong financial profile, reviewing regulatory compliance.',
    reviewedBy: 'Admin Team',
    estimatedProjectValue: 4200000000000, // 4.2T IDR
  },
  {
    id: '3',
    companyName: 'PT Energi Hijau Indonesia',
    legalEntityType: 'PT (Perseroan Terbatas)',
    registrationNumber: 'AHU-555666777',
    contactPerson: 'Ahmad Rahman',
    email: 'ahmad.rahman@energihijau.id',
    phone: '+62-21-9999-1111',
    website: 'https://energihijau.id',
    businessType: 'Renewable Energy Infrastructure',
    yearsOfOperation: 5,
    submittedDate: '2025-01-06T09:20:00Z',
    status: 'pending',
    documents: {
      businessLicense: true,
      taxCertificate: true,
      auditedFinancials: false,
      companyProfile: true,
      bankReference: true,
    },
    estimatedProjectValue: 1800000000000, // 1.8T IDR
  },
];

const mockApprovedSPVs: ApprovedSPV[] = [
  {
    id: '1',
    companyName: 'PT Kereta Cepat Indonesia',
    approvedDate: '2023-06-15',
    walletAddress: '0x1234...5678',
    projectsCreated: 3,
    totalFundingRaised: 12500000000000, // 12.5T IDR
    status: 'active',
    lastActivity: '2025-01-09T16:30:00Z',
    performanceScore: 9.2,
  },
  {
    id: '2',
    companyName: 'PT Pelabuhan Modern',
    approvedDate: '2023-08-22',
    walletAddress: '0xABCD...EFGH',
    projectsCreated: 2,
    totalFundingRaised: 5200000000000, // 5.2T IDR
    status: 'active',
    lastActivity: '2025-01-08T11:15:00Z',
    performanceScore: 8.7,
  },
  {
    id: '3',
    companyName: 'PT Smart City Solutions',
    approvedDate: '2024-01-10',
    walletAddress: '0x9876...4321',
    projectsCreated: 1,
    totalFundingRaised: 850000000000, // 850B IDR
    status: 'active',
    lastActivity: '2025-01-07T14:45:00Z',
    performanceScore: 8.1,
  },
];

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

    // Mock API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // TODO: Implement actual API call to update SPV status
    // console.log(`${action} SPV:`, selectedApplication.id);
    // console.log('Review notes:', reviewNotes);

    setIsSubmitting(false);
    setIsReviewModalOpen(false);
    setSelectedApplication(null);
    setReviewAction(null);
    setReviewNotes('');
  };

  const handleSuspendSPV = async (spvId: string) => {
    // TODO: Implement SPV suspension logic
    // console.log('Suspend SPV:', spvId);

    spvId;
  };

  const handleActivateSPV = async (spvId: string) => {
    // TODO: Implement SPV activation logic
    // console.log('Activate SPV:', spvId);

    spvId;
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
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Pending Applications"
            value={mockSPVStats.pendingApplications.toString()}
            icon={<Clock className="w-4 h-4" />}
            change={0}
            changeType="neutral"
            description="Awaiting review"
          />
          <StatsCard
            title="Approved SPVs"
            value={mockSPVStats.approvedSPVs.toString()}
            icon={<Shield className="w-4 h-4" />}
            change={8.3}
            changeType="increase"
            description="Active on platform"
          />
          <StatsCard
            title="Projects Created"
            value={mockSPVStats.totalProjectsCreated.toString()}
            icon={<Building className="w-4 h-4" />}
            change={12.5}
            changeType="increase"
            description="By approved SPVs"
          />
          <StatsCard
            title="Funding Facilitated"
            value={formatCurrency(mockSPVStats.totalFundingFacilitated)}
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
              Pending Applications ({mockSPVStats.pendingApplications})
            </button>
            <button
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'approved'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('approved')}
            >
              Approved SPVs ({mockSPVStats.approvedSPVs})
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
                data={mockPendingApplications}
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
                data={mockApprovedSPVs}
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
