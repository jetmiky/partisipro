'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  DashboardLayout,
  DataTable,
  StatsCard,
} from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
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
    alert('SPV compliance report export functionality coming soon');
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
        <Button
          size="sm"
          variant="outline"
          onClick={() => alert('Project compliance details coming soon')}
          className="flex items-center gap-1"
        >
          <Eye className="w-3 h-3" />
          View Details
        </Button>
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
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSelectedInvestor(row)}
          className="flex items-center gap-1"
        >
          <Eye className="w-3 h-3" />
          View Profile
        </Button>
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
              SPV Compliance Dashboard
            </h1>
            <p className="text-gray-600">
              Monitor investor compliance and identity verification for your
              projects
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Projects</option>
              {projectsCompliance.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={handleExportCompliance}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Investors"
            value={totalInvestors.toLocaleString()}
            icon={<Users className="w-4 h-4" />}
            description={`${totalVerified} verified`}
            changeType="increase"
          />
          <StatsCard
            title="Verification Rate"
            value={`${Math.round((totalVerified / totalInvestors) * 100)}%`}
            icon={<UserCheck className="w-4 h-4" />}
            change={2.5}
            changeType="increase"
          />
          <StatsCard
            title="Pending Verification"
            value={totalPending.toString()}
            icon={<Clock className="w-4 h-4" />}
            description="Requires attention"
            changeType="decrease"
          />
          <StatsCard
            title="Compliance Score"
            value={`${avgComplianceScore.toFixed(1)}%`}
            icon={<Shield className="w-4 h-4" />}
            description="Across all projects"
            changeType={avgComplianceScore >= 90 ? 'increase' : 'decrease'}
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'projects'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Projects ({projectsCompliance.length})
            </button>
            <button
              onClick={() => setActiveTab('investors')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'investors'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Investors ({investorProfiles.length})
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
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Compliance Requirements */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Identity Verification Requirements
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">
                      KYC Verification
                    </p>
                    <p className="text-sm text-green-700">
                      Required for all investors
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">
                      Indonesian Resident
                    </p>
                    <p className="text-sm text-green-700">
                      Verified residence status
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">AML Compliance</p>
                    <p className="text-sm text-blue-700">
                      Automated screening active
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <UserCheck className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-purple-900">
                      Accredited Investor
                    </p>
                    <p className="text-sm text-purple-700">
                      Optional for higher limits
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Project Compliance Summary */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Project Compliance Summary
              </h2>
              <div className="space-y-4">
                {projectsCompliance.map(project => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {project.verifiedInvestors} verified /{' '}
                        {project.totalInvestors} total investors
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-lg">
                        {project.complianceScore}%
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}
                      >
                        {project.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Compliance Activity
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      New investor verified
                    </p>
                    <p className="text-sm text-gray-600">
                      KYC completed for investor 0x742d...Cd12C
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Verification expiring
                    </p>
                    <p className="text-sm text-gray-600">
                      5 investors require re-verification within 30 days
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">Claims updated</p>
                    <p className="text-sm text-gray-600">
                      Accredited investor claims renewed for 12 users
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'projects' && (
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Project Compliance Status
              </h2>
              <p className="text-gray-600">
                Monitor compliance status across all your projects
              </p>
            </div>
            <DataTable data={projectsTableData} columns={projectColumns} />
          </Card>
        )}

        {activeTab === 'investors' && (
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Investor Profiles
              </h2>
              <p className="text-gray-600">
                View detailed investor verification status and compliance
              </p>
            </div>
            <DataTable data={investorsTableData} columns={investorColumns} />
          </Card>
        )}

        {activeTab === 'analytics' && (
          <Card className="p-6">
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Compliance Analytics
              </h3>
              <p className="text-gray-600 mb-4">
                Detailed compliance analytics and reporting for SPV projects
              </p>
              <Button
                onClick={() => alert('SPV analytics dashboard coming soon')}
              >
                View Analytics Dashboard
              </Button>
            </div>
          </Card>
        )}

        {/* Investor Detail Modal */}
        {selectedInvestor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Investor Profile
                </h2>
                <Button
                  variant="outline"
                  onClick={() => setSelectedInvestor(null)}
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
                      {selectedInvestor.address}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Verification Status
                      </label>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedInvestor.verificationStatus)}`}
                      >
                        {selectedInvestor.verificationStatus.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Risk Level
                      </label>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(selectedInvestor.riskLevel)}`}
                      >
                        {selectedInvestor.riskLevel.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Claims
                      </label>
                      <p className="text-gray-900">
                        {selectedInvestor.claimsCount}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Active Claims
                      </label>
                      <p className="text-gray-900">
                        {selectedInvestor.activeClaims}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Investment Amount
                    </label>
                    <p className="text-gray-900 font-medium">
                      {formatCurrency(selectedInvestor.investmentAmount)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Joined Date
                      </label>
                      <p className="text-gray-900">
                        {formatDate(selectedInvestor.joinDate)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Activity
                      </label>
                      <p className="text-gray-900">
                        {formatDate(selectedInvestor.lastActivity)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Compliance Status
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700">
                          KYC Verified
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700">
                          AML Cleared
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700">
                          Indonesian Resident
                        </span>
                      </div>
                      {selectedInvestor.verificationStatus === 'verified' && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-700">
                            Accredited Investor
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          alert(
                            'View investor details functionality coming soon'
                          )
                        }
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Full Profile
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          alert(
                            'Export investor data functionality coming soon'
                          )
                        }
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export Data
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
