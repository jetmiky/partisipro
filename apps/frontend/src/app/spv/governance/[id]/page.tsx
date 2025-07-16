'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Vote,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Calendar,
  FileText,
  Download,
  RefreshCw,
  Filter,
  BarChart3,
  ArrowLeft,
} from 'lucide-react';
import {
  Button,
  Card,
  StatsCard,
  DashboardLayout,
  DataTable,
} from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { GovernanceProposal } from '@/services';

interface Project {
  id: string;
  name: string;
  totalTokens: number;
  activeTokenHolders: number;
  governanceActive: boolean;
}

// Mock data
const mockProject: Project = {
  id: '1',
  name: 'Jakarta-Surabaya Toll Road Extension',
  totalTokens: 2500000,
  activeTokenHolders: 1250,
  governanceActive: true,
};

const mockProposals: GovernanceProposal[] = [
  {
    id: 'prop-001',
    projectId: '1',
    title: 'Upgrade Treasury Contract to v2.1',
    description:
      'Upgrade the Treasury smart contract to include new security features and gas optimization improvements.',
    proposer: '0x1234...5678',
    proposerName: 'Jakarta Toll Management',
    status: 'active',
    type: 'governance_change',
    category: 'governance',
    priority: 'high',
    votingPeriod: {
      start: '2025-01-06',
      end: '2025-01-13',
      duration: 168, // 7 days in hours
    },
    votes: {
      for: 380000,
      against: 70000,
      abstain: 0,
      total: 450000,
    },
    quorum: {
      required: 500000,
      current: 450000,
      percentage: 90,
      met: false,
    },
    tokenSupply: {
      total: 2500000,
      eligible: 2500000,
    },
    metadata: {
      createdAt: '2025-01-05T00:00:00Z',
      updatedAt: '2025-01-05T00:00:00Z',
      tags: ['treasury', 'upgrade', 'security'],
    },
  },
  {
    id: 'prop-002',
    projectId: '1',
    title: 'Adjust Revenue Distribution Percentage',
    description:
      'Proposal to increase investor revenue share from 85% to 88% of net profits to improve investor returns.',
    proposer: '0x1234...5678',
    proposerName: 'Jakarta Toll Management',
    status: 'passed',
    type: 'revenue_distribution',
    category: 'financial',
    priority: 'medium',
    votingPeriod: {
      start: '2024-12-21',
      end: '2024-12-28',
      duration: 168,
    },
    votes: {
      for: 560000,
      against: 60000,
      abstain: 0,
      total: 620000,
    },
    quorum: {
      required: 500000,
      current: 620000,
      percentage: 124,
      met: true,
    },
    tokenSupply: {
      total: 2500000,
      eligible: 2500000,
    },
    execution: {
      executable: true,
      executedAt: '2024-12-30T00:00:00Z',
      executedBy: '0x1234...5678',
      transactionHash: '0xabc123...',
    },
    metadata: {
      createdAt: '2024-12-20T00:00:00Z',
      updatedAt: '2024-12-30T00:00:00Z',
      tags: ['revenue', 'distribution'],
    },
  },
  {
    id: 'prop-003',
    projectId: '1',
    title: 'Emergency Maintenance Fund Allocation',
    description:
      'Allocate 2% of current treasury balance for emergency road maintenance during rainy season.',
    proposer: '0x1234...5678',
    proposerName: 'Jakarta Toll Management',
    status: 'executed',
    type: 'investment_decision',
    category: 'operations',
    priority: 'high',
    votingPeriod: {
      start: '2024-11-16',
      end: '2024-11-23',
      duration: 168,
    },
    votes: {
      for: 520000,
      against: 60000,
      abstain: 0,
      total: 580000,
    },
    quorum: {
      required: 500000,
      current: 580000,
      percentage: 116,
      met: true,
    },
    tokenSupply: {
      total: 2500000,
      eligible: 2500000,
    },
    execution: {
      executable: true,
      executedAt: '2024-11-25T00:00:00Z',
      executedBy: '0x1234...5678',
      transactionHash: '0xdef456...',
    },
    metadata: {
      createdAt: '2024-11-15T00:00:00Z',
      updatedAt: '2024-11-25T00:00:00Z',
      tags: ['emergency', 'maintenance', 'fund'],
    },
  },
];

const getProposalTypeIcon = (type: GovernanceProposal['type']) => {
  switch (type) {
    case 'governance_change':
      return <FileText className="h-4 w-4" />;
    case 'revenue_distribution':
      return <BarChart3 className="h-4 w-4" />;
    case 'investment_decision':
      return <Users className="h-4 w-4" />;
    case 'operational_change':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Vote className="h-4 w-4" />;
  }
};

const getStatusIcon = (status: GovernanceProposal['status']) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'active':
      return <Vote className="h-4 w-4" />;
    case 'passed':
      return <CheckCircle className="h-4 w-4" />;
    case 'rejected':
      return <XCircle className="h-4 w-4" />;
    case 'executed':
      return <CheckCircle className="h-4 w-4" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
};

const getStatusColor = (status: GovernanceProposal['status']) => {
  switch (status) {
    case 'pending':
      return 'text-gray-500';
    case 'active':
      return 'text-primary-500';
    case 'passed':
      return 'text-support-500';
    case 'rejected':
      return 'text-accent-500';
    case 'executed':
      return 'text-support-600';
    case 'cancelled':
      return 'text-accent-600';
    default:
      return 'text-gray-500';
  }
};

const formatProposalType = (type: GovernanceProposal['type']) => {
  return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const calculateVotingProgress = (votes: GovernanceProposal['votes']) => {
  const total = votes.total;
  if (total === 0) return { forPercentage: 0, againstPercentage: 0 };

  return {
    forPercentage: (votes.for / total) * 100,
    againstPercentage: (votes.against / total) * 100,
  };
};

const formatTokenCount = (count: number) => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toLocaleString();
};

export default function SPVGovernancePage() {
  const params = useParams();
  const _projectId = params.id as string;
  const [isLoading, setIsLoading] = useState(false);

  _projectId;

  const handleRefresh = async () => {
    setIsLoading(true);
    // TODO: Fetch latest governance data from blockchain
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  const handleCreateProposal = () => {
    // TODO: Navigate to proposal creation page
    // console.log('Create new proposal for project:', projectId);
  };

  const handleViewProposal = (_proposalId: string) => {
    // TODO: Navigate to proposal detail page
    // console.log('View proposal:', proposalId);
    _proposalId;
  };

  const handleExecuteProposal = (_proposalId: string) => {
    // TODO: Execute passed proposal on blockchain
    // console.log('Execute proposal:', proposalId);
    _proposalId;
  };

  const proposalColumns: Column<GovernanceProposal>[] = [
    {
      key: 'title',
      label: 'Proposal',
      render: (_, row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            {getProposalTypeIcon(row.type)}
            <span className="font-medium text-gray-900">{row.title}</span>
          </div>
          <span className="text-sm text-gray-500">
            {formatProposalType(row.type)} • Created{' '}
            {new Date(row.metadata.createdAt).toLocaleDateString()}
          </span>
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
          <span className="capitalize font-medium">{row.status}</span>
        </div>
      ),
    },
    {
      key: 'voting',
      label: 'Voting Results',
      render: (_, row) => {
        const { forPercentage, againstPercentage } = calculateVotingProgress(
          row.votes
        );
        return (
          <div className="flex flex-col">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-support-600">
                For: {formatTokenCount(row.votes.for)}
              </span>
              <span className="text-accent-600">
                Against: {formatTokenCount(row.votes.against)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="flex h-2 rounded-full overflow-hidden">
                <div
                  className="bg-support-500"
                  style={{ width: `${forPercentage}%` }}
                ></div>
                <div
                  className="bg-accent-500"
                  style={{ width: `${againstPercentage}%` }}
                ></div>
              </div>
            </div>
            <span className="text-xs text-gray-500 mt-1">
              Quorum: {formatTokenCount(row.quorum.required)}{' '}
              {row.quorum.met ? '✓' : '✗'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'timeline',
      label: 'Timeline',
      render: (_, row) => (
        <div className="flex flex-col text-sm">
          <span className="text-gray-900">
            {new Date(row.votingPeriod.start).toLocaleDateString()} -{' '}
            {new Date(row.votingPeriod.end).toLocaleDateString()}
          </span>
          {row.execution?.executedAt && (
            <span className="text-support-600">
              Executed:{' '}
              {new Date(row.execution.executedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewProposal(row.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {row.status === 'passed' && !row.execution?.executedAt && (
            <Button size="sm" onClick={() => handleExecuteProposal(row.id)}>
              Execute
            </Button>
          )}
        </div>
      ),
    },
  ];

  const activeProposals = mockProposals.filter(
    p => p.status === 'active'
  ).length;
  const passedProposals = mockProposals.filter(
    p => p.status === 'passed'
  ).length;
  const totalVotes = mockProposals.reduce((sum, p) => sum + p.votes.total, 0);
  const averageParticipation =
    (totalVotes / mockProposals.length / mockProject.totalTokens) * 100;

  return (
    <DashboardLayout userType="spv">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/spv/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Governance Management
              </h1>
              <p className="text-gray-600">{mockProject.name}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
            <Button onClick={handleCreateProposal}>
              <Plus className="h-4 w-4 mr-2" />
              Create Proposal
            </Button>
          </div>
        </div>

        {/* Project Governance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Token Holders"
            value={mockProject.activeTokenHolders.toLocaleString()}
            icon={<Users className="w-4 h-4" />}
            change={0}
            changeType="neutral"
            description="Eligible voters"
          />
          <StatsCard
            title="Active Proposals"
            value={activeProposals.toString()}
            icon={<Vote className="w-4 h-4" />}
            change={0}
            changeType="neutral"
            description="Currently voting"
          />
          <StatsCard
            title="Passed Proposals"
            value={passedProposals.toString()}
            icon={<CheckCircle className="w-4 h-4" />}
            change={16.7}
            changeType="increase"
            description="Successfully executed"
          />
          <StatsCard
            title="Avg. Participation"
            value={`${averageParticipation.toFixed(1)}%`}
            icon={<BarChart3 className="w-4 h-4" />}
            change={-2.3}
            changeType="decrease"
            description="Voter turnout rate"
          />
        </div>

        {/* Governance Proposals Table */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Governance Proposals
              </h2>
              <p className="text-sm text-gray-600">
                Create and manage governance proposals for your project
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <DataTable<GovernanceProposal & Record<string, unknown>>
            columns={proposalColumns}
            data={
              mockProposals as (GovernanceProposal & Record<string, unknown>)[]
            }
          />
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Plus className="h-8 w-8 text-primary-500 bg-primary-50 rounded-lg p-2" />
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Create Proposal
                </h3>
                <p className="text-sm text-gray-600">
                  Submit a new governance proposal for voting
                </p>
              </div>
            </div>
            <Button className="w-full" onClick={handleCreateProposal}>
              Get Started
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center mb-4">
              <BarChart3 className="h-8 w-8 text-secondary-500 bg-secondary-50 rounded-lg p-2" />
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Voting Analytics
                </h3>
                <p className="text-sm text-gray-600">
                  View detailed voting patterns and participation
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              View Analytics
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Calendar className="h-8 w-8 text-support-500 bg-support-50 rounded-lg p-2" />
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Proposal Calendar
                </h3>
                <p className="text-sm text-gray-600">
                  Track voting deadlines and execution dates
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              View Calendar
            </Button>
          </Card>
        </div>

        {/* TODO: Mock Implementation Notes */}
        <Card className="p-6 bg-primary-50 border-primary-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-primary-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-primary-900 mb-2">
                TODO: Mock Implementation Notes
              </h3>
              <ul className="text-sm text-primary-800 space-y-1">
                <li>
                  • Mock governance contract integration for proposal creation
                </li>
                <li>
                  • Mock voting mechanism with token-weighted voting power
                </li>
                <li>• Mock proposal execution via smart contract calls</li>
                <li>• Mock real-time voting updates and quorum tracking</li>
                <li>
                  • Mock proposal creation wizard with parameter validation
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
