'use client';

import { useState } from 'react';
import { DashboardLayout, DataTable } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { ScrollReveal, StaggeredList } from '@/components/ui/ScrollAnimations';
import { PageTransition } from '@/components/ui/PageTransition';
import { toast } from '@/components/ui/AnimatedNotification';
import type { ComplianceProject, InvestorProfile } from '@/types';
import {
  Shield,
  Users,
  CheckCircle,
  AlertTriangle,
  Eye,
  Download,
  BarChart3,
  Clock,
  UserCheck,
} from 'lucide-react';

export default function SPVCompliancePage() {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedInvestor, setSelectedInvestor] =
    useState<InvestorProfile | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'projects' | 'investors' | 'analytics'
  >('overview');

  // TODO: Mock SPV compliance data - replace with actual project compliance API
  const projectsCompliance: ComplianceProject[] = [
    {
      id: '1',
      name: 'Jakarta-Bandung High Speed Rail',
      totalInvestors: 1250,
      verifiedInvestors: 1180,
      pendingVerification: 70,
      complianceScore: 94.4,
      lastAudit: '2024-01-25T10:30:00Z',
      lastUpdated: '2024-01-25T10:30:00Z',
      status: 'compliant',
    },
    {
      id: '2',
      name: 'Surabaya Port Expansion',
      totalInvestors: 890,
      verifiedInvestors: 820,
      pendingVerification: 70,
      complianceScore: 92.1,
      lastAudit: '2024-01-24T14:15:00Z',
      lastUpdated: '2024-01-24T14:15:00Z',
      status: 'compliant',
    },
    {
      id: '3',
      name: 'Medan Airport Terminal',
      totalInvestors: 650,
      verifiedInvestors: 580,
      pendingVerification: 70,
      complianceScore: 89.2,
      lastAudit: '2024-01-23T09:45:00Z',
      lastUpdated: '2024-01-23T09:45:00Z',
      status: 'review_required',
    },
  ];

  const investorProfiles: InvestorProfile[] = [
    {
      id: '1',
      address: '0x742d35Cc6634C0532925a3b8D22Ad6dDe36Cd12C',
      verificationStatus: 'verified',
      investmentAmount: 50000000,
      joinDate: '2024-01-15T10:30:00Z',
      lastActivity: '2024-01-25T08:15:00Z',
      activeClaims: 3,
      claimsCount: 5,
      riskLevel: 'low',
      complianceNotes: 'Fully compliant investor with active KYC',
    },
    {
      id: '2',
      address: '0x123a456b789c012d345e678f901a234b567c890d',
      verificationStatus: 'pending',
      investmentAmount: 25000000,
      joinDate: '2024-01-18T09:15:00Z',
      lastActivity: '2024-01-24T16:30:00Z',
      activeClaims: 1,
      claimsCount: 2,
      riskLevel: 'medium',
      complianceNotes: 'Verification pending - documents under review',
    },
    {
      id: '3',
      address: '0x456a789b012c345d678e901f234a567b890c123d',
      verificationStatus: 'verified',
      investmentAmount: 100000000,
      joinDate: '2024-01-10T16:45:00Z',
      lastActivity: '2024-01-25T14:20:00Z',
      activeClaims: 4,
      claimsCount: 6,
      riskLevel: 'low',
      complianceNotes: 'High-value investor with excellent compliance record',
    },
    {
      id: '4',
      address: '0x789b012c345d678e901f234a567b890c123d456a',
      verificationStatus: 'rejected',
      investmentAmount: 15000000,
      joinDate: '2024-01-05T13:20:00Z',
      lastActivity: '2024-01-05T13:20:00Z',
      activeClaims: 0,
      claimsCount: 1,
      riskLevel: 'high',
      complianceNotes: 'Identity verification failed - documents incomplete',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'verified':
        return 'text-green-600 bg-green-50';
      case 'partial':
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'non_compliant':
      case 'rejected':
      case 'expired':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'high':
        return 'text-red-600 bg-red-50';
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

  const handleExportCompliance = () => {
    // TODO: Implement compliance report export for SPV
    toast.info('Export feature coming soon', {
      message: 'SPV compliance report export functionality is being developed',
      duration: 3000,
    });
  };

  const totalInvestors = projectsCompliance.reduce(
    (sum, project) => sum + project.totalInvestors,
    0
  );
  const totalVerified = projectsCompliance.reduce(
    (sum, project) => sum + project.verifiedInvestors,
    0
  );
  const totalPending = projectsCompliance.reduce(
    (sum, project) => sum + project.pendingVerification,
    0
  );
  const avgComplianceScore =
    projectsCompliance.reduce(
      (sum, project) => sum + project.complianceScore,
      0
    ) / projectsCompliance.length;

  const projectsTableData = projectsCompliance.map(project => ({
    id: project.id,
    name: project.name,
    totalInvestors: project.totalInvestors,
    verifiedInvestors: project.verifiedInvestors,
    pendingVerification: project.pendingVerification,
    complianceScore: project.complianceScore,
    lastAudit: formatDate(project.lastAudit),
    lastUpdated: formatDate(project.lastUpdated),
    status: project.status,
    actions: project,
  }));

  const investorsTableData = investorProfiles.map(investor => ({
    id: investor.id,
    address: investor.address,
    verificationStatus: investor.verificationStatus,
    investmentAmount: investor.investmentAmount,
    joinDate: investor.joinDate,
    lastActivity: investor.lastActivity,
    activeClaims: investor.activeClaims,
    claimsCount: investor.claimsCount,
    riskLevel: investor.riskLevel,
    complianceNotes: investor.complianceNotes,
    actions: investor,
  }));

  const projectColumns: Column<ComplianceProject>[] = [
    {
      label: 'Project Name',
      key: 'name',
      render: (_, row) => <div className="font-medium">{row.name}</div>,
    },
    {
      label: 'Total Investors',
      key: 'totalInvestors',
      render: (_, row) => (
        <div className="text-center font-medium">{row.totalInvestors}</div>
      ),
    },
    {
      label: 'Verified',
      key: 'verifiedInvestors',
      render: (_, row) => (
        <div className="text-center">
          <div className="font-medium text-green-600">
            {row.verifiedInvestors}
          </div>
          <div className="text-xs text-gray-500">
            {Math.round((row.verifiedInvestors / row.totalInvestors) * 100)}%
          </div>
        </div>
      ),
    },
    {
      label: 'Pending',
      key: 'pendingVerification',
      render: (_, row) => (
        <div className="text-center">
          <div className="font-medium text-yellow-600">
            {row.pendingVerification}
          </div>
        </div>
      ),
    },
    {
      label: 'Compliance Score',
      key: 'complianceScore',
      render: (_, row) => (
        <div className="text-center">
          <div className="font-medium">{row.complianceScore}%</div>
          <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
            <div
              className={`h-1 rounded-full ${row.complianceScore >= 95 ? 'bg-green-500' : row.complianceScore >= 90 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${row.complianceScore}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      label: 'Status',
      key: 'status',
      render: (_, row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}
        >
          {row.status.toUpperCase()}
        </span>
      ),
    },
    {
      label: 'Actions',
      key: 'actions',
      render: () => (
        <AnimatedButton
          size="sm"
          variant="outline"
          onClick={() =>
            toast.info('Project compliance details coming soon', {
              message: 'Feature is being developed',
              duration: 3000,
            })
          }
          ripple
        >
          <Eye className="w-3 h-3 mr-2" />
          View Details
        </AnimatedButton>
      ),
    },
  ];

  const investorColumns: Column<InvestorProfile>[] = [
    {
      label: 'Investor Address',
      key: 'address',
      render: (_, row) => (
        <div className="font-mono text-sm">
          {row.address.slice(0, 10)}...{row.address.slice(-6)}
        </div>
      ),
    },
    {
      label: 'Verification Status',
      key: 'verificationStatus',
      render: (_, row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.verificationStatus)}`}
        >
          {row.verificationStatus.toUpperCase()}
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
      label: 'Investment',
      key: 'investmentAmount',
      render: (_, row) => (
        <div className="text-right font-medium">{row.investmentAmount}</div>
      ),
    },
    {
      label: 'Risk Level',
      key: 'riskLevel',
      render: (_, row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(row.riskLevel)}`}
        >
          {row.riskLevel.toUpperCase()}
        </span>
      ),
    },
    {
      label: 'Last Activity',
      key: 'lastActivity',
      render: (_, row) => <div className="text-sm">{row.joinDate}</div>,
    },
    {
      label: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <AnimatedButton
          size="sm"
          variant="outline"
          onClick={() => setSelectedInvestor(row)}
          ripple
        >
          <Eye className="w-3 h-3 mr-2" />
          View Profile
        </AnimatedButton>
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

      <DashboardLayout userType="spv">
        <PageTransition type="fade" duration={300}>
          <div className="space-y-8 relative z-10">
            {/* Header */}
            <ScrollReveal animation="slide-up" delay={0}>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gradient mb-2">
                    SPV Compliance Dashboard
                  </h1>
                  <p className="text-muted-foreground">
                    Monitor investor compliance and identity verification for
                    your projects
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedProject}
                    onChange={e => setSelectedProject(e.target.value)}
                    className="px-4 py-3 glass-modern rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 hover-glow transition-all"
                  >
                    <option value="all">All Projects</option>
                    {projectsCompliance.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <AnimatedButton
                    variant="outline"
                    onClick={handleExportCompliance}
                    ripple
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </AnimatedButton>
                </div>
              </div>
            </ScrollReveal>

            {/* Key Metrics */}
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
                    +12.3%
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    {totalInvestors.toLocaleString()}
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    Total Investors
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {totalVerified} verified
                  </p>
                </div>
              </div>

              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-success-600 font-medium">
                    +2.5%
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    {Math.round((totalVerified / totalInvestors) * 100)}%
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    Verification Rate
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Industry leading
                  </p>
                </div>
              </div>

              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-warning-600 font-medium">
                    -5.2%
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    {totalPending.toString()}
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    Pending Verification
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Requires attention
                  </p>
                </div>
              </div>

              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <span
                    className={`text-xs font-medium ${avgComplianceScore >= 90 ? 'text-success-600' : 'text-warning-600'}`}
                  >
                    {avgComplianceScore >= 90 ? '+' : '-'}3.1%
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    {avgComplianceScore.toFixed(1)}%
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    Compliance Score
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Across all projects
                  </p>
                </div>
              </div>
            </StaggeredList>

            {/* Tabs */}
            <ScrollReveal animation="slide-up" delay={200}>
              <div className="glass-feature rounded-2xl p-2">
                <nav className="flex space-x-2">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 rounded-xl font-medium text-sm transition-all hover-lift ${
                      activeTab === 'overview'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                        : 'text-primary-600 hover:bg-primary-50 hover:text-primary-700'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('projects')}
                    className={`px-6 py-3 rounded-xl font-medium text-sm transition-all hover-lift ${
                      activeTab === 'projects'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                        : 'text-primary-600 hover:bg-primary-50 hover:text-primary-700'
                    }`}
                  >
                    Projects ({projectsCompliance.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('investors')}
                    className={`px-6 py-3 rounded-xl font-medium text-sm transition-all hover-lift ${
                      activeTab === 'investors'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                        : 'text-primary-600 hover:bg-primary-50 hover:text-primary-700'
                    }`}
                  >
                    Investors ({investorProfiles.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-6 py-3 rounded-xl font-medium text-sm transition-all hover-lift ${
                      activeTab === 'analytics'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                        : 'text-primary-600 hover:bg-primary-50 hover:text-primary-700'
                    }`}
                  >
                    Analytics
                  </button>
                </nav>
              </div>
            </ScrollReveal>

            {/* Content based on active tab */}
            {activeTab === 'overview' && (
              <ScrollReveal animation="slide-up" delay={300}>
                <div className="space-y-8">
                  {/* Compliance Requirements */}
                  <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                    <h2 className="text-xl font-semibold text-gradient mb-6">
                      Identity Verification Requirements
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-4 p-4 glass-modern rounded-xl hover-glow transition-all border border-success-200">
                        <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-primary-800 mb-1">
                            KYC Verification
                          </p>
                          <p className="text-sm text-primary-600">
                            Required for all investors
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 glass-modern rounded-xl hover-glow transition-all border border-success-200">
                        <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-primary-800 mb-1">
                            Indonesian Resident
                          </p>
                          <p className="text-sm text-primary-600">
                            Verified residence status
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 glass-modern rounded-xl hover-glow transition-all border border-primary-200">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-primary-800 mb-1">
                            AML Compliance
                          </p>
                          <p className="text-sm text-primary-600">
                            Automated screening active
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 glass-modern rounded-xl hover-glow transition-all border border-secondary-200">
                        <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center">
                          <UserCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-primary-800 mb-1">
                            Accredited Investor
                          </p>
                          <p className="text-sm text-primary-600">
                            Optional for higher limits
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Project Compliance Summary */}
                  <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                    <h2 className="text-xl font-semibold text-gradient mb-6">
                      Project Compliance Summary
                    </h2>
                    <div className="space-y-4">
                      {projectsCompliance.map((project, index) => (
                        <div
                          key={project.id}
                          className="glass-modern rounded-xl p-6 hover-glow transition-all duration-300 border border-primary-100"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-primary-800 mb-2">
                                {project.name}
                              </h3>
                              <p className="text-sm text-primary-600">
                                {project.verifiedInvestors} verified /{' '}
                                {project.totalInvestors} total investors
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gradient mb-2">
                                {project.complianceScore}%
                              </div>
                              <span
                                className={`px-4 py-2 rounded-full text-xs font-medium glass-modern ${
                                  project.status === 'compliant'
                                    ? 'text-success-600 border border-success-200'
                                    : project.status === 'review_required'
                                      ? 'text-warning-600 border border-warning-200'
                                      : 'text-error-600 border border-error-200'
                                }`}
                              >
                                {project.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                    <h2 className="text-xl font-semibold text-gradient mb-6">
                      Recent Compliance Activity
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 glass-modern rounded-xl hover-glow transition-all border border-success-200">
                        <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-primary-800 mb-1">
                            New investor verified
                          </p>
                          <p className="text-sm text-primary-600">
                            KYC completed for investor 0x742d...Cd12C
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 glass-modern rounded-xl hover-glow transition-all border border-warning-200">
                        <div className="w-12 h-12 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-primary-800 mb-1">
                            Verification expiring
                          </p>
                          <p className="text-sm text-primary-600">
                            5 investors require re-verification within 30 days
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 glass-modern rounded-xl hover-glow transition-all border border-primary-200">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-primary-800 mb-1">
                            Claims updated
                          </p>
                          <p className="text-sm text-primary-600">
                            Accredited investor claims renewed for 12 users
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            )}

            {activeTab === 'projects' && (
              <ScrollReveal animation="slide-up" delay={300}>
                <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                  <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gradient mb-3">
                      Project Compliance Status
                    </h2>
                    <p className="text-primary-600">
                      Monitor compliance status across all your projects
                    </p>
                  </div>
                  <div className="glass-modern rounded-xl overflow-hidden">
                    <DataTable
                      data={projectsTableData}
                      columns={projectColumns}
                    />
                  </div>
                </div>
              </ScrollReveal>
            )}

            {activeTab === 'investors' && (
              <ScrollReveal animation="slide-up" delay={300}>
                <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                  <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gradient mb-3">
                      Investor Profiles
                    </h2>
                    <p className="text-primary-600">
                      View detailed investor verification status and compliance
                    </p>
                  </div>
                  <div className="glass-modern rounded-xl overflow-hidden">
                    <DataTable
                      data={investorsTableData}
                      columns={investorColumns}
                    />
                  </div>
                </div>
              </ScrollReveal>
            )}

            {activeTab === 'analytics' && (
              <ScrollReveal animation="slide-up" delay={300}>
                <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
                  <div className="text-center py-16">
                    <div className="w-20 h-20 feature-icon mx-auto mb-8 hover-scale">
                      <BarChart3 className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gradient mb-4">
                      Compliance Analytics
                    </h3>
                    <p className="text-primary-600 mb-8 max-w-md mx-auto">
                      Detailed compliance analytics and reporting for SPV
                      projects
                    </p>
                    <AnimatedButton
                      onClick={() =>
                        toast.info('Analytics dashboard coming soon', {
                          message: 'SPV analytics dashboard is being developed',
                          duration: 3000,
                        })
                      }
                      ripple
                    >
                      View Analytics Dashboard
                    </AnimatedButton>
                  </div>
                </div>
              </ScrollReveal>
            )}

            {/* Investor Detail Modal */}
            {selectedInvestor && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="glass-feature rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto hover-lift">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-semibold text-gradient">
                      Investor Profile
                    </h2>
                    <AnimatedButton
                      variant="outline"
                      onClick={() => setSelectedInvestor(null)}
                      className="w-10 h-10 p-0 text-lg"
                      ripple
                    >
                      ×
                    </AnimatedButton>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="glass-modern rounded-xl p-4">
                        <label className="block text-sm font-medium text-primary-700 mb-3">
                          Wallet Address
                        </label>
                        <p className="text-primary-800 font-mono text-sm glass-modern p-3 rounded-lg break-all">
                          {selectedInvestor.address}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="glass-modern rounded-xl p-4">
                          <label className="block text-sm font-medium text-primary-700 mb-3">
                            Verification Status
                          </label>
                          <span
                            className={`px-4 py-2 rounded-full text-xs font-medium glass-modern ${
                              selectedInvestor.verificationStatus === 'verified'
                                ? 'text-success-600 border border-success-200'
                                : selectedInvestor.verificationStatus ===
                                    'pending'
                                  ? 'text-warning-600 border border-warning-200'
                                  : 'text-error-600 border border-error-200'
                            }`}
                          >
                            {selectedInvestor.verificationStatus.toUpperCase()}
                          </span>
                        </div>
                        <div className="glass-modern rounded-xl p-4">
                          <label className="block text-sm font-medium text-primary-700 mb-3">
                            Risk Level
                          </label>
                          <span
                            className={`px-4 py-2 rounded-full text-xs font-medium glass-modern ${
                              selectedInvestor.riskLevel === 'low'
                                ? 'text-success-600 border border-success-200'
                                : selectedInvestor.riskLevel === 'medium'
                                  ? 'text-warning-600 border border-warning-200'
                                  : 'text-error-600 border border-error-200'
                            }`}
                          >
                            {selectedInvestor.riskLevel.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="glass-modern rounded-xl p-4">
                          <label className="block text-sm font-medium text-primary-700 mb-3">
                            Total Claims
                          </label>
                          <p className="text-2xl font-bold text-gradient">
                            {selectedInvestor.claimsCount}
                          </p>
                        </div>
                        <div className="glass-modern rounded-xl p-4">
                          <label className="block text-sm font-medium text-primary-700 mb-3">
                            Active Claims
                          </label>
                          <p className="text-2xl font-bold text-gradient">
                            {selectedInvestor.activeClaims}
                          </p>
                        </div>
                      </div>

                      <div className="glass-modern rounded-xl p-4">
                        <label className="block text-sm font-medium text-primary-700 mb-3">
                          Investment Amount
                        </label>
                        <p className="text-2xl font-bold text-gradient">
                          {formatCurrency(selectedInvestor.investmentAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="glass-modern rounded-xl p-4">
                          <label className="block text-sm font-medium text-primary-700 mb-3">
                            Joined Date
                          </label>
                          <p className="text-lg font-semibold text-primary-800">
                            {formatDate(selectedInvestor.joinDate)}
                          </p>
                        </div>
                        <div className="glass-modern rounded-xl p-4">
                          <label className="block text-sm font-medium text-primary-700 mb-3">
                            Last Activity
                          </label>
                          <p className="text-lg font-semibold text-primary-800">
                            {formatDate(selectedInvestor.lastActivity)}
                          </p>
                        </div>
                      </div>

                      <div className="glass-modern rounded-xl p-6">
                        <label className="block text-sm font-medium text-primary-700 mb-4">
                          Compliance Status
                        </label>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 glass-modern rounded-lg border border-success-200">
                            <CheckCircle className="w-5 h-5 text-success-500" />
                            <span className="text-sm font-medium text-primary-700">
                              KYC Verified
                            </span>
                          </div>
                          <div className="flex items-center gap-3 p-3 glass-modern rounded-lg border border-success-200">
                            <CheckCircle className="w-5 h-5 text-success-500" />
                            <span className="text-sm font-medium text-primary-700">
                              AML Cleared
                            </span>
                          </div>
                          <div className="flex items-center gap-3 p-3 glass-modern rounded-lg border border-success-200">
                            <CheckCircle className="w-5 h-5 text-success-500" />
                            <span className="text-sm font-medium text-primary-700">
                              Indonesian Resident
                            </span>
                          </div>
                          {selectedInvestor.verificationStatus ===
                            'verified' && (
                            <div className="flex items-center gap-3 p-3 glass-modern rounded-lg border border-success-200">
                              <CheckCircle className="w-5 h-5 text-success-500" />
                              <span className="text-sm font-medium text-primary-700">
                                Accredited Investor
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-6 border-t border-primary-200">
                        <div className="flex gap-3">
                          <AnimatedButton
                            variant="outline"
                            onClick={() =>
                              toast.info('Feature coming soon', {
                                message:
                                  'View investor details functionality is being developed',
                                duration: 3000,
                              })
                            }
                            ripple
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Full Profile
                          </AnimatedButton>
                          <AnimatedButton
                            variant="outline"
                            onClick={() =>
                              toast.info('Export feature coming soon', {
                                message:
                                  'Export investor data functionality is being developed',
                                duration: 3000,
                              })
                            }
                            ripple
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export Data
                          </AnimatedButton>
                        </div>
                      </div>
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
