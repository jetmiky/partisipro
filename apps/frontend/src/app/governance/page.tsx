'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Vote,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  MessageSquare,
  FileText,
  ChevronRight,
  Filter,
  Search,
  Plus,
  BarChart3,
} from 'lucide-react';
import { Button, Card, DashboardLayout, StatsCard, Modal } from '@/components/ui';

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: 'active' | 'passed' | 'rejected' | 'pending';
  votingPeriod: {
    start: string;
    end: string;
  };
  votes: {
    for: number;
    against: number;
    abstain: number;
  };
  totalTokens: number;
  requiredQuorum: number;
  userVote?: 'for' | 'against' | 'abstain' | null;
  category: string;
  projectId?: string;
  priority: 'high' | 'medium' | 'low';
}

interface UserTokens {
  projectId: string;
  projectTitle: string;
  tokenBalance: number;
  votingPower: number;
}

const mockProposals: Proposal[] = [
  {
    id: '1',
    title: 'Increase Revenue Distribution Rate to 8%',
    description: 'Proposal to increase the monthly revenue distribution rate from 6% to 8% for the Jakarta-Bandung High-Speed Rail Extension project to provide better returns for token holders.',
    proposer: '0x1234...5678',
    status: 'active',
    votingPeriod: {
      start: '2024-01-01',
      end: '2024-01-15',
    },
    votes: {
      for: 12500000,
      against: 3200000,
      abstain: 800000,
    },
    totalTokens: 25000000,
    requiredQuorum: 15000000,
    userVote: null,
    category: 'Financial',
    projectId: '1',
    priority: 'high',
  },
  {
    id: '2',
    title: 'Approve Additional Infrastructure Investment',
    description: 'Authorize additional investment of 50 billion IDR for enhanced safety systems and passenger amenities in the Soekarno-Hatta Airport Terminal 4 project.',
    proposer: '0x9876...4321',
    status: 'active',
    votingPeriod: {
      start: '2024-01-05',
      end: '2024-01-19',
    },
    votes: {
      for: 8900000,
      against: 5600000,
      abstain: 1200000,
    },
    totalTokens: 20000000,
    requiredQuorum: 12000000,
    userVote: 'for',
    category: 'Investment',
    projectId: '2',
    priority: 'medium',
  },
  {
    id: '3',
    title: 'Implement Quarterly Financial Reporting',
    description: 'Mandate quarterly financial reports for all projects to increase transparency and provide regular updates on project performance and revenue distribution.',
    proposer: '0x5555...7777',
    status: 'passed',
    votingPeriod: {
      start: '2023-12-01',
      end: '2023-12-15',
    },
    votes: {
      for: 18500000,
      against: 2100000,
      abstain: 900000,
    },
    totalTokens: 30000000,
    requiredQuorum: 18000000,
    userVote: 'for',
    category: 'Governance',
    priority: 'medium',
  },
  {
    id: '4',
    title: 'Emergency Fund Allocation for Project Delays',
    description: 'Establish emergency fund allocation protocol for handling unexpected project delays and cost overruns to protect investor interests.',
    proposer: '0x3333...8888',
    status: 'rejected',
    votingPeriod: {
      start: '2023-11-15',
      end: '2023-11-29',
    },
    votes: {
      for: 6200000,
      against: 14800000,
      abstain: 3000000,
    },
    totalTokens: 24000000,
    requiredQuorum: 14400000,
    userVote: 'against',
    category: 'Risk Management',
    priority: 'low',
  },
];

const mockUserTokens: UserTokens[] = [
  {
    projectId: '1',
    projectTitle: 'Jakarta-Bandung High-Speed Rail Extension',
    tokenBalance: 50000,
    votingPower: 0.2, // 0.2% of total tokens
  },
  {
    projectId: '2',
    projectTitle: 'Soekarno-Hatta Airport Terminal 4',
    tokenBalance: 30000,
    votingPower: 0.15, // 0.15% of total tokens
  },
  {
    projectId: '3',
    projectTitle: 'Bali Renewable Energy Plant',
    tokenBalance: 25000,
    votingPower: 0.125, // 0.125% of total tokens
  },
];

export default function GovernancePage() {
  const [selectedTab, setSelectedTab] = useState('active');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [votingModalOpen, setVotingModalOpen] = useState(false);
  const [selectedVote, setSelectedVote] = useState<'for' | 'against' | 'abstain' | ''>('');

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'passed':
        return 'Passed';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const calculateVotingProgress = (proposal: Proposal) => {
    const totalVotes = proposal.votes.for + proposal.votes.against + proposal.votes.abstain;
    const participation = (totalVotes / proposal.totalTokens) * 100;
    const approval = totalVotes > 0 ? (proposal.votes.for / totalVotes) * 100 : 0;
    const quorumReached = totalVotes >= proposal.requiredQuorum;
    
    return {
      participation: participation.toFixed(1),
      approval: approval.toFixed(1),
      quorumReached,
      totalVotes,
    };
  };

  const isVotingActive = (proposal: Proposal) => {
    const now = new Date();
    const endDate = new Date(proposal.votingPeriod.end);
    return proposal.status === 'active' && now <= endDate;
  };

  const getUserVotingPower = (projectId?: string) => {
    if (!projectId) return 0;
    const userTokens = mockUserTokens.find(t => t.projectId === projectId);
    return userTokens?.votingPower || 0;
  };

  const filteredProposals = mockProposals.filter(proposal => {
    const matchesTab = selectedTab === 'all' || proposal.status === selectedTab;
    const matchesCategory = filterCategory === 'all' || proposal.category.toLowerCase() === filterCategory;
    const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesCategory && matchesSearch;
  });

  const tabs = [
    { id: 'active', label: 'Active Proposals' },
    { id: 'passed', label: 'Passed' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'all', label: 'All Proposals' },
  ];

  const activeProposals = mockProposals.filter(p => p.status === 'active').length;
  const totalVotingPower = mockUserTokens.reduce((sum, token) => sum + token.votingPower, 0);
  const proposalsVoted = mockProposals.filter(p => p.userVote).length;
  const participationRate = mockProposals.length > 0 ? (proposalsVoted / mockProposals.length) * 100 : 0;

  const handleVote = () => {
    if (!selectedProposal || !selectedVote) return;

    // TODO: Implement actual voting logic with smart contract integration
    console.log(`Voting ${selectedVote} on proposal ${selectedProposal.id}`);
    
    // Mock vote submission
    setTimeout(() => {
      setVotingModalOpen(false);
      setSelectedVote('');
      setSelectedProposal(null);
      // In real implementation, would refetch data or update state
    }, 1000);
  };

  const renderProposalCard = (proposal: Proposal) => {
    const progress = calculateVotingProgress(proposal);
    const votingActive = isVotingActive(proposal);
    const userVotingPower = getUserVotingPower(proposal.projectId);
    
    return (
      <Card key={proposal.id} className="p-6 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-gray-900 text-lg">{proposal.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                {getStatusLabel(proposal.status)}
              </span>
              <span className={`text-xs font-medium ${getPriorityColor(proposal.priority)}`}>
                {proposal.priority.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-600 mb-3 text-sm leading-relaxed">
              {proposal.description.length > 150 
                ? `${proposal.description.substring(0, 150)}...` 
                : proposal.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {proposal.category}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Ends {formatDate(proposal.votingPeriod.end)}
              </span>
              {proposal.projectId && (
                <span className="text-primary-600">
                  Voting Power: {userVotingPower.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
          <div className="ml-4">
            <Button 
              variant="secondary" 
              className="text-sm"
              onClick={() => setSelectedProposal(proposal)}
            >
              View Details
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Voting Progress */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">For ({progress.approval}%)</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${progress.approval}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-green-600">
                  {formatNumber(proposal.votes.for)}
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Against</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${((proposal.votes.against / progress.totalVotes) * 100) || 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-red-600">
                  {formatNumber(proposal.votes.against)}
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Abstain</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-400 h-2 rounded-full" 
                    style={{ width: `${((proposal.votes.abstain / progress.totalVotes) * 100) || 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {formatNumber(proposal.votes.abstain)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span className={`flex items-center gap-1 ${progress.quorumReached ? 'text-green-600' : 'text-orange-600'}`}>
                {progress.quorumReached ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                Quorum {progress.quorumReached ? 'Reached' : 'Required'}: {formatNumber(proposal.requiredQuorum)}
              </span>
              <span className="text-gray-500">
                Participation: {progress.participation}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              {proposal.userVote && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  proposal.userVote === 'for' ? 'bg-green-100 text-green-800' :
                  proposal.userVote === 'against' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  You voted: {proposal.userVote}
                </span>
              )}
              {votingActive && !proposal.userVote && userVotingPower > 0 && (
                <Button 
                  variant="primary" 
                  className="text-sm"
                  onClick={() => {
                    setSelectedProposal(proposal);
                    setVotingModalOpen(true);
                  }}
                >
                  <Vote className="w-4 h-4 mr-1" />
                  Vote
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <DashboardLayout userType="investor">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Governance</h1>
          <p className="text-gray-600">
            Participate in project governance and vote on important decisions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatsCard
            title="Active Proposals"
            value={activeProposals.toString()}
            icon={<Vote className="w-5 h-5" />}
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatsCard
            title="Your Voting Power"
            value={`${totalVotingPower.toFixed(2)}%`}
            icon={<BarChart3 className="w-5 h-5" />}
            trend={{ value: 0.8, isPositive: true }}
          />
          <StatsCard
            title="Proposals Voted"
            value={proposalsVoted.toString()}
            icon={<CheckCircle className="w-5 h-5" />}
            trend={{ value: proposalsVoted, isPositive: true }}
          />
          <StatsCard
            title="Participation Rate"
            value={`${participationRate.toFixed(1)}%`}
            icon={<Users className="w-5 h-5" />}
            trend={{ value: participationRate, isPositive: participationRate > 50 }}
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search proposals..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Categories</option>
            <option value="financial">Financial</option>
            <option value="investment">Investment</option>
            <option value="governance">Governance</option>
            <option value="risk management">Risk Management</option>
          </select>
        </div>

        {/* Proposals List */}
        <div className="space-y-4">
          {filteredProposals.length > 0 ? (
            filteredProposals.map(renderProposalCard)
          ) : (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Proposals Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterCategory !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'There are currently no proposals to display.'}
              </p>
            </Card>
          )}
        </div>

        {/* Voting Modal */}
        {votingModalOpen && selectedProposal && (
          <Modal
            isOpen={votingModalOpen}
            onClose={() => {
              setVotingModalOpen(false);
              setSelectedVote('');
            }}
            title="Cast Your Vote"
          >
            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">{selectedProposal.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{selectedProposal.description}</p>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Your voting power: {getUserVotingPower(selectedProposal.projectId).toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="vote"
                    value="for"
                    checked={selectedVote === 'for'}
                    onChange={e => setSelectedVote(e.target.value as 'for')}
                    className="text-primary-600"
                  />
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">Vote For</div>
                    <div className="text-sm text-gray-600">Support this proposal</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="vote"
                    value="against"
                    checked={selectedVote === 'against'}
                    onChange={e => setSelectedVote(e.target.value as 'against')}
                    className="text-primary-600"
                  />
                  <XCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <div className="font-medium text-gray-900">Vote Against</div>
                    <div className="text-sm text-gray-600">Oppose this proposal</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="vote"
                    value="abstain"
                    checked={selectedVote === 'abstain'}
                    onChange={e => setSelectedVote(e.target.value as 'abstain')}
                    className="text-primary-600"
                  />
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">Abstain</div>
                    <div className="text-sm text-gray-600">No preference on this proposal</div>
                  </div>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setVotingModalOpen(false);
                    setSelectedVote('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleVote}
                  disabled={!selectedVote}
                  className="flex-1"
                >
                  Submit Vote
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Proposal Details Modal */}
        {selectedProposal && !votingModalOpen && (
          <Modal
            isOpen={!!selectedProposal}
            onClose={() => setSelectedProposal(null)}
            title="Proposal Details"
          >
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">{selectedProposal.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedProposal.status)}`}>
                    {getStatusLabel(selectedProposal.status)}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{selectedProposal.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Proposer:</span>
                    <span className="ml-2 font-mono">{selectedProposal.proposer}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <span className="ml-2">{selectedProposal.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Voting Period:</span>
                    <span className="ml-2">
                      {formatDate(selectedProposal.votingPeriod.start)} - {formatDate(selectedProposal.votingPeriod.end)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Required Quorum:</span>
                    <span className="ml-2">{formatNumber(selectedProposal.requiredQuorum)} tokens</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Voting Results</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-green-600 font-medium">For</span>
                    <span>{formatNumber(selectedProposal.votes.for)} tokens</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-red-600 font-medium">Against</span>
                    <span>{formatNumber(selectedProposal.votes.against)} tokens</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Abstain</span>
                    <span>{formatNumber(selectedProposal.votes.abstain)} tokens</span>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}