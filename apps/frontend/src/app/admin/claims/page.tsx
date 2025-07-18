'use client';

import { useState } from 'react';
import { DashboardLayout, DataTable } from '@/components/ui';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { PageTransition } from '@/components/ui/PageTransition';
import { ScrollReveal, StaggeredList } from '@/components/ui/ScrollAnimations';
import { toast } from '@/components/ui/AnimatedNotification';
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
        toast.success('Claim topic deleted successfully');
      }, 1000);
    }
  };

  const handleToggleActive = async (claimId: string) => {
    claimId;

    setIsLoading(true);
    // TODO: Implement claim topic activation/deactivation via ClaimTopicsRegistry contract
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Claim topic status updated successfully');
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
          <AnimatedButton
            size="sm"
            variant="outline"
            onClick={() => setSelectedClaim(row.actions)}
            ripple
            className="flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            View
          </AnimatedButton>
          <AnimatedButton
            size="sm"
            variant="outline"
            onClick={() => handleEditClaim(row.actions)}
            ripple
            className="flex items-center gap-1"
          >
            <Edit className="w-3 h-3" />
            Edit
          </AnimatedButton>
          <AnimatedButton
            size="sm"
            variant="outline"
            onClick={() => handleToggleActive(row.actions.id)}
            disabled={isLoading}
            ripple
            className="flex items-center gap-1"
          >
            <Settings className="w-3 h-3" />
            {row.isActive ? 'Deactivate' : 'Activate'}
          </AnimatedButton>
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
                    Claims Management
                  </h1>
                  <p className="text-muted-foreground">
                    Manage claim topics and issuance policies
                  </p>
                </div>
                <AnimatedButton
                  onClick={handleCreateClaim}
                  ripple
                  className="btn-modern btn-modern-primary hover-lift flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Claim Topic
                </AnimatedButton>
              </div>
            </ScrollReveal>

            {/* Statistics */}
            <StaggeredList
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              itemDelay={150}
              animation="slide-up"
            >
              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-success-600 font-medium">
                    +12.5%
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    {totalClaims.toLocaleString()}
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    Total Claims
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activeClaims.toLocaleString()} active
                  </p>
                </div>
              </div>

              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-success-600 font-medium">
                    +8.3%
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    {activeTopics}
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    Active Topics
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {claimTopics.length} total topics
                  </p>
                </div>
              </div>

              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-success-600 font-medium">
                    +2.1%
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">95.2%</h3>
                  <p className="text-sm font-medium text-primary-700">
                    Issuance Rate
                  </p>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </div>
              </div>

              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-support-500 to-support-600 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-muted-foreground">~18mo</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    18 months
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    Avg. Validity
                  </p>
                  <p className="text-xs text-muted-foreground">
                    All claim types
                  </p>
                </div>
              </div>
            </StaggeredList>

            {/* Tabs */}
            <ScrollReveal animation="slide-up" delay={200} duration={600}>
              <div className="glass-modern rounded-xl p-2">
                <nav className="flex space-x-2">
                  <button
                    onClick={() => setActiveTab('topics')}
                    className={`px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 hover-lift ${
                      activeTab === 'topics'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                        : 'text-primary-600 hover:text-primary-700 hover:bg-primary-50'
                    }`}
                  >
                    Claim Topics
                  </button>
                  <button
                    onClick={() => setActiveTab('templates')}
                    className={`px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 hover-lift ${
                      activeTab === 'templates'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                        : 'text-primary-600 hover:text-primary-700 hover:bg-primary-50'
                    }`}
                  >
                    Issuance Templates
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 hover-lift ${
                      activeTab === 'analytics'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                        : 'text-primary-600 hover:text-primary-700 hover:bg-primary-50'
                    }`}
                  >
                    Analytics
                  </button>
                </nav>
              </div>
            </ScrollReveal>

            {/* Content based on active tab */}
            {activeTab === 'topics' && (
              <>
                {/* Filters */}
                <ScrollReveal animation="slide-up" delay={300} duration={600}>
                  <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400 w-4 h-4" />
                          <AnimatedInput
                            placeholder="Search claim topics..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 glass-modern border-primary-200 focus:border-primary-400 focus:ring-primary-100 hover-glow"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={selectedCategory}
                          onChange={e => setSelectedCategory(e.target.value)}
                          className="px-3 py-2 glass-modern border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400 hover-glow transition-all duration-300"
                        >
                          <option value="all">All Categories</option>
                          <option value="identity">Identity</option>
                          <option value="qualification">Qualification</option>
                          <option value="compliance">Compliance</option>
                          <option value="authorization">Authorization</option>
                        </select>
                        <AnimatedButton
                          variant="outline"
                          ripple
                          className="btn-modern btn-modern-secondary hover-lift flex items-center gap-2"
                        >
                          <Filter className="w-4 h-4" />
                          Filter
                        </AnimatedButton>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Claims Table */}
                <ScrollReveal animation="slide-up" delay={400} duration={600}>
                  <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                    <div className="mb-8">
                      <h2 className="text-2xl font-semibold text-gradient mb-2">
                        Claim Topics
                      </h2>
                      <p className="text-primary-600">
                        Showing {filteredClaims.length} of {claimTopics.length}{' '}
                        claim topics
                      </p>
                    </div>
                    <div className="glass-modern rounded-xl overflow-hidden">
                      <DataTable
                        data={claimsTableData}
                        columns={columns}
                        searchable={false}
                      />
                    </div>
                  </div>
                </ScrollReveal>
              </>
            )}

            {activeTab === 'templates' && (
              <ScrollReveal animation="slide-up" delay={300} duration={600}>
                <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 feature-icon mx-auto mb-6 hover-scale">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gradient mb-3">
                      Issuance Templates
                    </h3>
                    <p className="text-primary-600 mb-6">
                      Manage claim issuance templates and workflows
                    </p>
                    <AnimatedButton
                      onClick={() =>
                        toast.info('Template management coming soon')
                      }
                      ripple
                      className="btn-modern btn-modern-primary hover-lift"
                    >
                      Create Template
                    </AnimatedButton>
                  </div>
                </div>
              </ScrollReveal>
            )}

            {activeTab === 'analytics' && (
              <ScrollReveal animation="slide-up" delay={300} duration={600}>
                <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 feature-icon mx-auto mb-6 hover-scale">
                      <TrendingUp className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gradient mb-3">
                      Claims Analytics
                    </h3>
                    <p className="text-primary-600 mb-6">
                      Detailed analytics and reporting for claim issuance
                    </p>
                    <AnimatedButton
                      onClick={() =>
                        toast.info('Analytics dashboard coming soon')
                      }
                      ripple
                      className="btn-modern btn-modern-primary hover-lift"
                    >
                      View Analytics
                    </AnimatedButton>
                  </div>
                </div>
              </ScrollReveal>
            )}

            {/* Claim Detail Modal */}
            {selectedClaim && !showCreateModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="glass-feature rounded-3xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gradient mb-2">
                        Claim Topic Details
                      </h2>
                      <p className="text-primary-600">
                        Complete claim topic information and configuration
                      </p>
                    </div>
                    <AnimatedButton
                      variant="outline"
                      onClick={() => setSelectedClaim(null)}
                      ripple
                      className="btn-modern btn-modern-secondary hover-lift w-10 h-10 p-0 text-lg"
                    >
                      ×
                    </AnimatedButton>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="glass-modern rounded-xl p-6">
                        <label className="block text-sm font-semibold text-primary-700 mb-3">
                          Claim Name
                        </label>
                        <p className="text-xl font-bold text-gradient">
                          {selectedClaim.name}
                        </p>
                      </div>

                      <div className="glass-modern rounded-xl p-6">
                        <label className="block text-sm font-semibold text-primary-700 mb-3">
                          Description
                        </label>
                        <p className="text-primary-800 leading-relaxed">
                          {selectedClaim.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="glass-modern rounded-xl p-6">
                          <label className="block text-sm font-semibold text-primary-700 mb-3">
                            Category
                          </label>
                          <span
                            className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-bold ${getCategoryColor(selectedClaim.category)}`}
                          >
                            {selectedClaim.category.toUpperCase()}
                          </span>
                        </div>
                        <div className="glass-modern rounded-xl p-6">
                          <label className="block text-sm font-semibold text-primary-700 mb-3">
                            Status
                          </label>
                          <span
                            className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-bold ${
                              selectedClaim.isActive
                                ? 'text-success-700 bg-success-100'
                                : 'text-muted-700 bg-muted-100'
                            }`}
                          >
                            {selectedClaim.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                      </div>

                      <div className="glass-modern rounded-xl p-6">
                        <label className="block text-sm font-semibold text-primary-700 mb-3">
                          Requirements
                        </label>
                        <div className="space-y-2">
                          {selectedClaim.requirements.map((req, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-3 glass-hero rounded-lg"
                            >
                              <div className="w-2 h-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"></div>
                              <span className="text-primary-800 font-medium">
                                {req}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="glass-modern rounded-xl p-6">
                          <label className="block text-sm font-semibold text-primary-700 mb-3">
                            Validity Period
                          </label>
                          <p className="text-xl font-bold text-gradient">
                            {selectedClaim.validityPeriod} months
                          </p>
                        </div>
                        <div className="glass-modern rounded-xl p-6">
                          <label className="block text-sm font-semibold text-primary-700 mb-3">
                            Auto Renewal
                          </label>
                          <p className="text-xl font-bold text-gradient">
                            {selectedClaim.autoRenewal ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="glass-modern rounded-xl p-6">
                          <label className="block text-sm font-semibold text-primary-700 mb-3">
                            Total Claims
                          </label>
                          <p className="text-xl font-bold text-gradient">
                            {selectedClaim.totalClaims.toLocaleString()}
                          </p>
                        </div>
                        <div className="glass-modern rounded-xl p-6">
                          <label className="block text-sm font-semibold text-primary-700 mb-3">
                            Active Claims
                          </label>
                          <p className="text-xl font-bold text-gradient">
                            {selectedClaim.activeClaims.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="glass-modern rounded-xl p-6">
                        <label className="block text-sm font-semibold text-primary-700 mb-3">
                          Issuer Restricted
                        </label>
                        <p className="text-primary-800 font-medium">
                          {selectedClaim.issuerRestricted
                            ? 'Yes - Only trusted issuers'
                            : 'No - Any issuer'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="glass-modern rounded-xl p-6">
                          <label className="block text-sm font-semibold text-primary-700 mb-3">
                            Created
                          </label>
                          <p className="text-primary-800 font-medium">
                            {formatDate(selectedClaim.createdAt)}
                          </p>
                        </div>
                        <div className="glass-modern rounded-xl p-6">
                          <label className="block text-sm font-semibold text-primary-700 mb-3">
                            Last Updated
                          </label>
                          <p className="text-primary-800 font-medium">
                            {formatDate(selectedClaim.updatedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="glass-modern rounded-xl p-6">
                        <div className="flex flex-wrap gap-3">
                          <AnimatedButton
                            onClick={() => handleEditClaim(selectedClaim)}
                            ripple
                            className="btn-modern btn-modern-primary hover-lift flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit Topic
                          </AnimatedButton>
                          <AnimatedButton
                            variant="outline"
                            onClick={() => handleToggleActive(selectedClaim.id)}
                            disabled={isLoading}
                            ripple
                            className="btn-modern btn-modern-secondary hover-lift flex items-center gap-2"
                          >
                            <Settings className="w-4 h-4" />
                            {selectedClaim.isActive ? 'Deactivate' : 'Activate'}
                          </AnimatedButton>
                          <AnimatedButton
                            variant="outline"
                            onClick={() => handleDeleteClaim(selectedClaim.id)}
                            disabled={isLoading}
                            ripple
                            className="btn-modern hover-lift flex items-center gap-2 text-error-600 hover:text-error-700 border-error-200 hover:border-error-300"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </AnimatedButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Create/Edit Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="glass-feature rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gradient mb-2">
                        {selectedClaim
                          ? 'Edit Claim Topic'
                          : 'Create Claim Topic'}
                      </h2>
                      <p className="text-primary-600">
                        {selectedClaim
                          ? 'Modify claim topic configuration'
                          : 'Define new claim topic parameters'}
                      </p>
                    </div>
                    <AnimatedButton
                      variant="outline"
                      onClick={() => {
                        setShowCreateModal(false);
                        setSelectedClaim(null);
                      }}
                      ripple
                      className="btn-modern btn-modern-secondary hover-lift w-10 h-10 p-0 text-lg"
                    >
                      ×
                    </AnimatedButton>
                  </div>

                  <div className="text-center py-16">
                    <div className="w-20 h-20 feature-icon mx-auto mb-8 hover-scale">
                      <Plus className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-gradient mb-4">
                      {selectedClaim
                        ? 'Edit Claim Topic'
                        : 'Create New Claim Topic'}
                    </h3>
                    <p className="text-primary-600 mb-8 max-w-md mx-auto">
                      Comprehensive claim topic management interface will be
                      available in the next platform update
                    </p>
                    <div className="flex gap-4 justify-center">
                      <AnimatedButton
                        variant="outline"
                        onClick={() => {
                          setShowCreateModal(false);
                          setSelectedClaim(null);
                        }}
                        ripple
                        className="btn-modern btn-modern-secondary hover-lift"
                      >
                        Cancel
                      </AnimatedButton>
                      <AnimatedButton
                        onClick={() => {
                          setShowCreateModal(false);
                          setSelectedClaim(null);
                          toast.info(
                            'Claim topic management functionality coming soon'
                          );
                        }}
                        ripple
                        className="btn-modern btn-modern-primary hover-lift"
                      >
                        {selectedClaim ? 'Update Topic' : 'Create Topic'}
                      </AnimatedButton>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </PageTransition>
      </DashboardLayout>
    </div>
  );
}
