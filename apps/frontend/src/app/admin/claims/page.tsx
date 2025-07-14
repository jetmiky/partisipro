'use client';

import { useState } from 'react';
import {
  DashboardLayout,
  DataTable,
  StatsCard,
  Card,
  Button,
  Input,
} from '@/components/ui';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  FileText,
  Clock,
  TrendingUp,
  Eye,
  Settings,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Column } from '@/components/ui/DataTable';

interface ClaimTopic {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalClaims: number;
  activeClaims: number;
  requirements: string[];
  validityPeriod: number; // in months
  autoRenewal: boolean;
  issuerRestricted: boolean;
  category: 'identity' | 'qualification' | 'compliance' | 'authorization';
}

interface ClaimTopicTableRow extends Record<string, unknown> {
  id: string;
  name: string;
  description: string;
  category: 'identity' | 'qualification' | 'compliance' | 'authorization';
  totalClaims: number;
  activeClaims: number;
  validityPeriod: number;
  isActive: boolean;
  updatedAt: string;
  actions: ClaimTopic;
}

// interface ClaimTemplate {
//   id: string;
//   topicId: string;
//   name: string;
//   description: string;
//   requiredFields: string[];
//   validationRules: string[];
//   issuanceFlow: string;
//   approvalRequired: boolean;
// }

export default function AdminClaimsPage() {
  const [activeTab, setActiveTab] = useState<
    'topics' | 'templates' | 'analytics'
  >('topics');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedClaim, setSelectedClaim] = useState<ClaimTopic | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // TODO: Mock claim topics data - replace with actual ClaimTopicsRegistry contract integration
  const claimTopics: ClaimTopic[] = [
    {
      id: '1',
      name: 'KYC_APPROVED',
      description: 'Know Your Customer verification completed successfully',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      totalClaims: 1250,
      activeClaims: 1180,
      requirements: [
        'Government ID',
        'Proof of Address',
        'Biometric Verification',
      ],
      validityPeriod: 12,
      autoRenewal: false,
      issuerRestricted: true,
      category: 'identity',
    },
    {
      id: '2',
      name: 'ACCREDITED_INVESTOR',
      description: 'Qualified as accredited investor per regulation',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-20T14:15:00Z',
      totalClaims: 450,
      activeClaims: 425,
      requirements: [
        'Income Certificate',
        'Asset Verification',
        'Investment Experience',
      ],
      validityPeriod: 24,
      autoRenewal: true,
      issuerRestricted: true,
      category: 'qualification',
    },
    {
      id: '3',
      name: 'INDONESIAN_RESIDENT',
      description: 'Verified Indonesian resident status',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-18T09:45:00Z',
      totalClaims: 1100,
      activeClaims: 1050,
      requirements: ['Indonesian ID', 'Proof of Residence', 'Tax Number'],
      validityPeriod: 36,
      autoRenewal: false,
      issuerRestricted: true,
      category: 'identity',
    },
    {
      id: '4',
      name: 'QUALIFIED_INVESTOR',
      description: 'OJK qualified investor certification',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-22T16:20:00Z',
      totalClaims: 125,
      activeClaims: 120,
      requirements: ['OJK Certificate', 'Financial Assessment', 'Risk Profile'],
      validityPeriod: 12,
      autoRenewal: false,
      issuerRestricted: true,
      category: 'qualification',
    },
    {
      id: '5',
      name: 'COMPLIANCE_VERIFIED',
      description: 'Platform compliance requirements verified',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-25T11:30:00Z',
      totalClaims: 980,
      activeClaims: 950,
      requirements: ['AML Check', 'Sanctions Screening', 'PEP Verification'],
      validityPeriod: 6,
      autoRenewal: true,
      issuerRestricted: false,
      category: 'compliance',
    },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'identity':
        return 'text-blue-600 bg-blue-50';
      case 'qualification':
        return 'text-purple-600 bg-purple-50';
      case 'compliance':
        return 'text-green-600 bg-green-50';
      case 'authorization':
        return 'text-orange-600 bg-orange-50';
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

  const handleCreateClaim = () => {
    setShowCreateModal(true);
  };

  const handleEditClaim = (claim: ClaimTopic) => {
    setSelectedClaim(claim);
    setShowCreateModal(true);
  };

  const handleDeleteClaim = async (claimId: string) => {
    claimId;

    if (
      confirm(
        'Are you sure you want to delete this claim topic? This action cannot be undone.'
      )
    ) {
      setIsLoading(true);
      // TODO: Implement claim topic deletion via ClaimTopicsRegistry contract
      setTimeout(() => {
        setIsLoading(false);
        alert('Claim topic deleted successfully');
      }, 1000);
    }
  };

  const handleToggleActive = async (claimId: string) => {
    claimId;

    setIsLoading(true);
    // TODO: Implement claim topic activation/deactivation via ClaimTopicsRegistry contract
    setTimeout(() => {
      setIsLoading(false);
      alert('Claim topic status updated successfully');
    }, 1000);
  };

  const filteredClaims = claimTopics.filter(claim => {
    const matchesSearch =
      claim.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || claim.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalClaims = claimTopics.reduce(
    (sum, claim) => sum + claim.totalClaims,
    0
  );
  const activeClaims = claimTopics.reduce(
    (sum, claim) => sum + claim.activeClaims,
    0
  );
  const activeTopics = claimTopics.filter(claim => claim.isActive).length;

  const claimsTableData: ClaimTopicTableRow[] = filteredClaims.map(claim => ({
    id: claim.id,
    name: claim.name,
    description: claim.description,
    category: claim.category,
    totalClaims: claim.totalClaims,
    activeClaims: claim.activeClaims,
    validityPeriod: claim.validityPeriod,
    isActive: claim.isActive,
    updatedAt: formatDate(claim.updatedAt),
    actions: claim,
  }));

  const columns: Column<ClaimTopicTableRow>[] = [
    {
      label: 'Claim Topic',
      key: 'name',
      render: (_, row) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-gray-500">{row.description}</div>
        </div>
      ),
    },
    {
      label: 'Category',
      key: 'category',
      render: (_, row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(row.category)}`}
        >
          {row.category.toUpperCase()}
        </span>
      ),
    },
    {
      label: 'Usage',
      key: 'totalClaims',
      render: (_, row) => (
        <div className="text-center">
          <div className="font-medium">{row.activeClaims}</div>
          <div className="text-xs text-gray-500">{row.totalClaims} total</div>
        </div>
      ),
    },
    {
      label: 'Validity',
      key: 'validityPeriod',
      render: (_, row) => (
        <div className="text-center">
          <div className="font-medium">{row.validityPeriod} months</div>
        </div>
      ),
    },
    {
      label: 'Status',
      key: 'isActive',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.isActive ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-gray-500" />
          )}
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              row.isActive
                ? 'text-green-600 bg-green-50'
                : 'text-gray-600 bg-gray-50'
            }`}
          >
            {row.isActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>
      ),
    },
    {
      label: 'Last Updated',
      key: 'updatedAt',
      render: (_, row) => <div className="text-sm">{row.updatedAt}</div>,
    },
    {
      label: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedClaim(row.actions)}
            className="flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditClaim(row.actions)}
            className="flex items-center gap-1"
          >
            <Edit className="w-3 h-3" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleToggleActive(row.actions.id)}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <Settings className="w-3 h-3" />
            {row.isActive ? 'Deactivate' : 'Activate'}
          </Button>
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
              Claims Management
            </h1>
            <p className="text-gray-600">
              Manage claim topics and issuance policies
            </p>
          </div>
          <Button
            onClick={handleCreateClaim}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Claim Topic
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Claims"
            value={totalClaims.toLocaleString()}
            icon={<Shield className="h-4 w-4" />}
            description={`${activeClaims.toLocaleString()} active`}
            changeType="increase"
          />
          <StatsCard
            title="Active Topics"
            value={activeTopics.toString()}
            icon={<FileText className="h-4 w-4" />}
            description={`${claimTopics.length} total topics`}
            changeType="increase"
          />
          <StatsCard
            title="Issuance Rate"
            value="95.2%"
            icon={<TrendingUp className="h-4 w-4" />}
            description="Last 30 days"
            changeType="increase"
          />
          <StatsCard
            title="Avg. Validity"
            value="18 months"
            icon={<Clock className="h-4 w-4" />}
            description="All claim types"
            changeType="increase"
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('topics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'topics'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Claim Topics
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Issuance Templates
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'topics' && (
          <>
            {/* Filters */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search claim topics..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="identity">Identity</option>
                    <option value="qualification">Qualification</option>
                    <option value="compliance">Compliance</option>
                    <option value="authorization">Authorization</option>
                  </select>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filter
                  </Button>
                </div>
              </div>
            </Card>

            {/* Claims Table */}
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Claim Topics
                </h2>
                <p className="text-gray-600">
                  Showing {filteredClaims.length} of {claimTopics.length} claim
                  topics
                </p>
              </div>
              <DataTable
                data={claimsTableData}
                columns={columns}
                searchable={false}
              />
            </Card>
          </>
        )}

        {activeTab === 'templates' && (
          <Card className="p-6">
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Issuance Templates
              </h3>
              <p className="text-gray-600 mb-4">
                Manage claim issuance templates and workflows
              </p>
              <Button onClick={() => alert('Template management coming soon')}>
                Create Template
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'analytics' && (
          <Card className="p-6">
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Claims Analytics
              </h3>
              <p className="text-gray-600 mb-4">
                Detailed analytics and reporting for claim issuance
              </p>
              <Button onClick={() => alert('Analytics dashboard coming soon')}>
                View Analytics
              </Button>
            </div>
          </Card>
        )}

        {/* Claim Detail Modal */}
        {selectedClaim && !showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Claim Topic Details
                </h2>
                <Button
                  variant="outline"
                  onClick={() => setSelectedClaim(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Claim Name
                    </label>
                    <p className="text-gray-900 font-medium">
                      {selectedClaim.name}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <p className="text-gray-900">{selectedClaim.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedClaim.category)}`}
                      >
                        {selectedClaim.category.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedClaim.isActive
                            ? 'text-green-600 bg-green-50'
                            : 'text-gray-600 bg-gray-50'
                        }`}
                      >
                        {selectedClaim.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requirements
                    </label>
                    <ul className="list-disc list-inside text-gray-900 space-y-1">
                      {selectedClaim.requirements.map((req, index) => (
                        <li key={index} className="text-sm">
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Validity Period
                      </label>
                      <p className="text-gray-900">
                        {selectedClaim.validityPeriod} months
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Auto Renewal
                      </label>
                      <p className="text-gray-900">
                        {selectedClaim.autoRenewal ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Claims
                      </label>
                      <p className="text-gray-900">
                        {selectedClaim.totalClaims.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Active Claims
                      </label>
                      <p className="text-gray-900">
                        {selectedClaim.activeClaims.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Issuer Restricted
                    </label>
                    <p className="text-gray-900">
                      {selectedClaim.issuerRestricted
                        ? 'Yes - Only trusted issuers'
                        : 'No - Any issuer'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Created
                      </label>
                      <p className="text-gray-900">
                        {formatDate(selectedClaim.createdAt)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Updated
                      </label>
                      <p className="text-gray-900">
                        {formatDate(selectedClaim.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditClaim(selectedClaim)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Topic
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleToggleActive(selectedClaim.id)}
                        disabled={isLoading}
                        className="flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        {selectedClaim.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDeleteClaim(selectedClaim.id)}
                        disabled={isLoading}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedClaim ? 'Edit Claim Topic' : 'Create Claim Topic'}
                </h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedClaim(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </Button>
              </div>

              <div className="text-center py-8">
                <Plus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedClaim
                    ? 'Edit Claim Topic'
                    : 'Create New Claim Topic'}
                </h3>
                <p className="text-gray-600 mb-4">
                  Claim topic creation/editing interface coming soon
                </p>
                <Button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedClaim(null);
                    alert('Claim topic management functionality coming soon');
                  }}
                >
                  {selectedClaim ? 'Update Topic' : 'Create Topic'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
