'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGovernanceWebSocket } from '@/hooks/useWebSocket';
import { useRouter } from 'next/navigation';
import {
  Vote,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  MessageSquare,
  FileText,
  Filter,
  ChevronRight,
  Search,
  BarChart3,
} from 'lucide-react';
import { DashboardLayout } from '@/components/ui';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { ScrollReveal, StaggeredList } from '@/components/ui/ScrollAnimations';
import { PageTransition } from '@/components/ui/PageTransition';
import { toast } from '@/components/ui/AnimatedNotification';
import { useAuth } from '@/hooks/useAuth';
import {
  governanceService,
  GovernanceProposal,
  VotingPower,
  GovernanceStats,
} from '@/services';

// Remove old interfaces - now using service types
// interface Proposal and interface UserTokens have been replaced
// with GovernanceProposal and VotingPower from the service

// Remove mock data - now using real API data loaded in loadGovernanceData()
// const mockProposals: GovernanceProposal[] = [];
// const mockUserTokens: VotingPower[] = [];

export default function GovernancePage() {
  const router = useRouter();
  const { isAuthenticated, isKYCApproved, isIdentityVerified } = useAuth();

  const [selectedTab, setSelectedTab] = useState('active');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProposal, setSelectedProposal] =
    useState<GovernanceProposal | null>(null);
  const [votingModalOpen, setVotingModalOpen] = useState(false);
  const [selectedVote, setSelectedVote] = useState<
    'for' | 'against' | 'abstain' | ''
  >('');

  // Data state
  const [proposals, setProposals] = useState<GovernanceProposal[]>([]);
  const [votingPowers, setVotingPowers] = useState<VotingPower[]>([]);
  const [governanceStats, setGovernanceStats] =
    useState<GovernanceStats | null>(null);

  // WebSocket integration for real-time governance updates
  const { proposals: liveProposals, notifications } = useGovernanceWebSocket();

  // Update local proposals when real-time updates come in
  useEffect(() => {
    if (liveProposals.length > 0) {
      // Real-time governance proposals update
      setProposals(prev => {
        const updatedProposals = [...prev];
        liveProposals.forEach(liveProposal => {
          const index = updatedProposals.findIndex(
            p => p.id === liveProposal.id
          );
          if (index >= 0) {
            updatedProposals[index] = liveProposal;
          } else {
            updatedProposals.unshift(liveProposal);
          }
        });
        return updatedProposals;
      });
    }
  }, [liveProposals]);

  // Show real-time notifications
  useEffect(() => {
    if (notifications.length > 0) {
      // const latestNotification = notifications[0];
      // Governance notification received
      // Here you could show a toast notification
      // toast.info(`Governance Update: ${latestNotification.message}`);
    }
  }, [notifications]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  voting;

  // Check authentication and eligibility
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?redirectTo=/governance');
      return;
    }

    if (!isKYCApproved || !isIdentityVerified) {
      toast.error(
        'Complete KYC and identity verification to participate in governance'
      );
      router.push('/identity');
      return;
    }

    loadGovernanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isKYCApproved, isIdentityVerified, router]);

  const loadGovernanceData = useCallback(async () => {
    try {
      setLoading(true);

      // Load all governance data in parallel
      const [proposalsResult, votingPowerResult, statsResult] =
        await Promise.all([
          governanceService.getProposals({
            status:
              selectedTab === 'all'
                ? undefined
                : (selectedTab as GovernanceProposal['status']),
            category:
              filterCategory === 'all'
                ? undefined
                : (filterCategory as GovernanceProposal['category']),
            search: searchTerm || undefined,
            sortBy: 'created',
            sortOrder: 'desc',
          }),
          governanceService.getVotingPower(),
          governanceService.getGovernanceStats(),
        ]);

      setProposals(proposalsResult.proposals);
      setVotingPowers(votingPowerResult);
      setGovernanceStats(statsResult);
    } catch (error: any) {
      // Failed to load governance data - will show user error message
      toast.error('Failed to load governance data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedTab, filterCategory, searchTerm]);

  // Reload when filters change
  useEffect(() => {
    if (isAuthenticated && isKYCApproved && isIdentityVerified) {
      loadGovernanceData();
    }
  }, [
    selectedTab,
    filterCategory,
    searchTerm,
    isAuthenticated,
    isKYCApproved,
    isIdentityVerified,
    loadGovernanceData,
  ]);

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

  const calculateVotingProgress = (proposal: GovernanceProposal) => {
    const totalVotes = proposal.votes.total;
    const participation = proposal.quorum.percentage;
    const approval =
      totalVotes > 0 ? (proposal.votes.for / totalVotes) * 100 : 0;
    const quorumReached = proposal.quorum.met;

    return {
      participation: participation.toFixed(1),
      approval: approval.toFixed(1),
      quorumReached,
      totalVotes,
    };
  };

  const isVotingActive = (proposal: GovernanceProposal) => {
    const now = new Date();
    const endDate = new Date(proposal.votingPeriod.end);
    return proposal.status === 'active' && now <= endDate;
  };

  const getUserVotingPower = (projectId?: string) => {
    if (!projectId) return 0;
    const userPower = votingPowers.find(p => p.projectId === projectId);
    return userPower?.votingPower || 0;
  };

  // Show loading state
  if (loading) {
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
          <div className="flex items-center justify-center min-h-96 relative z-10">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-spin">
                <Vote className="w-8 h-8 text-white" />
              </div>
              <p className="text-primary-600 font-medium">
                Loading governance data...
              </p>
            </div>
          </div>
        </DashboardLayout>
      </div>
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

  // Filter proposals locally for UI responsiveness
  const filteredProposals = proposals;

  const tabs = [
    { id: 'active', label: 'Active Proposals' },
    { id: 'passed', label: 'Passed' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'all', label: 'All Proposals' },
  ];

  const activeProposals = governanceStats?.activeProposals || 0;
  const totalVotingPower = votingPowers.reduce(
    (sum, power) => sum + power.votingPower,
    0
  );
  const proposalsVoted = governanceStats?.userParticipation.proposalsVoted || 0;
  const participationRate =
    governanceStats?.userParticipation.participationRate || 0;

  const handleVote = async () => {
    if (!selectedProposal || !selectedVote) return;

    setVoting(true);

    try {
      const result = await governanceService.vote({
        proposalId: selectedProposal.id,
        choice: selectedVote,
      });

      // Update the proposal with the new vote
      setProposals(prevProposals =>
        prevProposals.map(proposal =>
          proposal.id === selectedProposal.id
            ? {
                ...proposal,
                userVote: {
                  choice: selectedVote,
                  votingPower: result.votingPower,
                  timestamp: new Date().toISOString(),
                  transactionHash: result.transactionHash,
                },
              }
            : proposal
        )
      );

      setVotingModalOpen(false);
      setSelectedVote('');
      setSelectedProposal(null);

      toast.success(`Vote "${selectedVote}" submitted successfully!`);

      // Refresh governance data to get updated vote counts
      loadGovernanceData();
    } catch (error: any) {
      // Voting failed - will show user error message
      toast.error(error.message || 'Failed to submit vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  const renderProposalCard = (proposal: GovernanceProposal) => {
    const progress = calculateVotingProgress(proposal);
    const votingActive = isVotingActive(proposal);
    const userVotingPower = getUserVotingPower(proposal.projectId);

    return (
      <div className="glass-feature rounded-2xl p-8 hover-lift transition-all duration-300">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="font-semibold text-gradient text-xl">
                {proposal.title}
              </h3>
              <span
                className={`px-3 py-1 rounded-xl text-xs font-bold ${getStatusColor(
                  proposal.status
                )
                  .replace('bg-', 'bg-gradient-to-r from-')
                  .replace(
                    '-50',
                    '-100 to-' +
                      getStatusColor(proposal.status).split('-')[1] +
                      '-200'
                  )}`}
              >
                {getStatusLabel(proposal.status)}
              </span>
              <span
                className={`text-xs font-bold px-2 py-1 rounded-lg ${getPriorityColor(
                  proposal.priority
                )
                  .replace('text-', 'text-')
                  .replace(
                    '-600',
                    '-700 bg-' +
                      getPriorityColor(proposal.priority).split('-')[1] +
                      '-100'
                  )}`}
              >
                {proposal.priority.toUpperCase()}
              </span>
            </div>
            <p className="text-primary-700 mb-4 text-sm leading-relaxed">
              {proposal.description.length > 150
                ? `${proposal.description.substring(0, 150)}...`
                : proposal.description}
            </p>
            <div className="flex items-center gap-6 text-sm text-primary-600">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {proposal.category}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Ends {formatDate(proposal.votingPeriod.end)}
              </span>
              {proposal.projectId && (
                <span className="text-primary-700 font-medium">
                  Voting Power: {userVotingPower.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
          <div className="ml-6">
            <AnimatedButton
              variant="secondary"
              className="flex items-center gap-2"
              onClick={() => setSelectedProposal(proposal)}
            >
              View Details
              <ChevronRight className="w-4 h-4" />
            </AnimatedButton>
          </div>
        </div>

        {/* Voting Progress */}
        <div className="glass-modern rounded-xl p-6 mt-6">
          <h4 className="font-semibold text-primary-800 mb-4">
            Voting Progress
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-xs text-success-600 font-medium mb-2">
                For ({progress.approval}%)
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 glass-hero rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-success-500 to-success-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progress.approval}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-success-700 min-w-[3rem]">
                  {formatNumber(proposal.votes.for)}
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-accent-600 font-medium mb-2">
                Against
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 glass-hero rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-accent-500 to-accent-600 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${(proposal.votes.against / progress.totalVotes) * 100 || 0}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-accent-700 min-w-[3rem]">
                  {formatNumber(proposal.votes.against)}
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-600 font-medium mb-2">
                Abstain
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 glass-hero rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-muted-400 to-muted-500 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${(proposal.votes.abstain / progress.totalVotes) * 100 || 0}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-muted-600 min-w-[3rem]">
                  {formatNumber(proposal.votes.abstain)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-primary-100">
            <div className="flex items-center gap-6 text-sm">
              <span
                className={`flex items-center gap-2 font-medium ${progress.quorumReached ? 'text-success-700' : 'text-accent-700'}`}
              >
                {progress.quorumReached ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                Quorum {progress.quorumReached ? 'Reached' : 'Required'}:{' '}
                {formatNumber(proposal.quorum.required)}
              </span>
              <span className="text-primary-600 font-medium">
                Participation: {progress.participation}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              {proposal.userVote && (
                <span
                  className={`px-3 py-2 rounded-xl text-xs font-bold ${
                    proposal.userVote.choice === 'for'
                      ? 'bg-gradient-to-r from-success-100 to-success-200 text-success-800'
                      : proposal.userVote.choice === 'against'
                        ? 'bg-gradient-to-r from-accent-100 to-accent-200 text-accent-800'
                        : 'bg-gradient-to-r from-muted-100 to-muted-200 text-muted-800'
                  }`}
                >
                  You voted: {proposal.userVote.choice}
                </span>
              )}
              {votingActive && !proposal.userVote && userVotingPower > 0 && (
                <AnimatedButton
                  variant="primary"
                  className="flex items-center gap-2"
                  onClick={() => {
                    setSelectedProposal(proposal);
                    setVotingModalOpen(true);
                  }}
                  ripple
                >
                  <Vote className="w-4 h-4" />
                  Vote Now
                </AnimatedButton>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Fluid Background Shapes */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="fluid-shape-1 top-20 right-16"></div>
        <div className="fluid-shape-2 top-1/2 left-10"></div>
        <div className="fluid-shape-3 bottom-32 right-1/4"></div>
        <div className="fluid-shape-1 bottom-10 left-16"></div>
      </div>

      <DashboardLayout userType="investor">
        <PageTransition type="fade" duration={300}>
          <div className="p-6 relative z-10">
            {/* Header */}
            <ScrollReveal animation="slide-up" delay={0}>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gradient mb-2">
                  Governance
                </h1>
                <p className="text-muted-foreground">
                  Participate in project governance and vote on important
                  decisions
                </p>
              </div>
            </ScrollReveal>

            {/* Stats Cards */}
            <StaggeredList
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
              itemDelay={150}
              animation="slide-up"
            >
              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                    <Vote className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-success-600 font-medium">
                    +12.5%
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    {activeProposals}
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    Active Proposals
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Awaiting your vote
                  </p>
                </div>
              </div>

              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-success-600 font-medium">
                    +0.8%
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    {totalVotingPower.toFixed(2)}%
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    Your Voting Power
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Across all projects
                  </p>
                </div>
              </div>

              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-success-600 font-medium">
                    +{proposalsVoted}
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    {proposalsVoted}
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    Proposals Voted
                  </p>
                  <p className="text-xs text-muted-foreground">This quarter</p>
                </div>
              </div>

              <div className="glass-feature rounded-2xl p-6 hover-lift transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-support-500 to-support-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <span
                    className={`text-xs font-medium ${participationRate > 50 ? 'text-success-600' : 'text-accent-600'}`}
                  >
                    {participationRate > 50 ? '+' : ''}
                    {participationRate.toFixed(1)}%
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gradient">
                    {participationRate.toFixed(1)}%
                  </h3>
                  <p className="text-sm font-medium text-primary-700">
                    Participation Rate
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Platform average
                  </p>
                </div>
              </div>
            </StaggeredList>

            {/* Tabs */}
            <ScrollReveal animation="slide-up" delay={200}>
              <div className="glass-modern rounded-xl p-2 mb-8">
                <nav className="flex space-x-2">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedTab(tab.id)}
                      className={`px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 hover-lift ${
                        selectedTab === tab.id
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                          : 'text-primary-600 hover:text-primary-700 hover:bg-primary-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </ScrollReveal>

            {/* Filters */}
            <ScrollReveal animation="slide-up" delay={300}>
              <div className="glass-feature rounded-2xl p-6 mb-8 hover-lift transition-all duration-300">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400" />
                    <AnimatedInput
                      type="text"
                      placeholder="Search proposals..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10"
                    />
                  </div>
                  <div className="flex gap-3">
                    <select
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value)}
                      className="px-4 py-3 glass-modern border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400 hover-glow transition-all duration-300"
                    >
                      <option value="all">All Categories</option>
                      <option value="financial">Financial</option>
                      <option value="investment">Investment</option>
                      <option value="governance">Governance</option>
                      <option value="risk management">Risk Management</option>
                    </select>
                    <AnimatedButton
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      Filter
                    </AnimatedButton>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Proposals List */}
            <ScrollReveal animation="slide-up" delay={400}>
              <div className="space-y-6">
                {filteredProposals.length > 0 ? (
                  <StaggeredList itemDelay={100} animation="slide-up">
                    {filteredProposals.map(proposal => (
                      <div key={proposal.id}>
                        {renderProposalCard(proposal)}
                      </div>
                    ))}
                  </StaggeredList>
                ) : (
                  <div className="glass-feature rounded-2xl p-12 text-center hover-lift transition-all duration-300">
                    <div className="w-16 h-16 feature-icon mx-auto mb-6 hover-scale">
                      <FileText className="w-8 h-8 text-primary-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gradient mb-3">
                      No Proposals Found
                    </h3>
                    <p className="text-primary-600 mb-6 max-w-md mx-auto">
                      {searchTerm || filterCategory !== 'all'
                        ? 'Try adjusting your search or filter criteria to find relevant proposals.'
                        : 'There are currently no governance proposals to display. Check back later for new proposals.'}
                    </p>
                    <AnimatedButton
                      onClick={() => {
                        setSearchTerm('');
                        setFilterCategory('all');
                      }}
                      ripple
                    >
                      Clear Filters
                    </AnimatedButton>
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>

          {/* Voting Modal */}
          {votingModalOpen && selectedProposal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="glass-feature rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gradient mb-2">
                      Cast Your Vote
                    </h2>
                    <p className="text-primary-600">
                      Make your voice heard in project governance
                    </p>
                  </div>
                  <AnimatedButton
                    variant="outline"
                    onClick={() => {
                      setVotingModalOpen(false);
                      setSelectedVote('');
                    }}
                    className="w-10 h-10 p-0 text-lg"
                  >
                    ×
                  </AnimatedButton>
                </div>

                <div className="mb-8">
                  <div className="glass-modern rounded-xl p-6 mb-6">
                    <h3 className="font-semibold text-gradient text-lg mb-3">
                      {selectedProposal.title}
                    </h3>
                    <p className="text-primary-700 text-sm mb-4 leading-relaxed">
                      {selectedProposal.description}
                    </p>
                    <div className="glass-hero rounded-lg p-4">
                      <p className="text-sm font-medium text-primary-800">
                        Your voting power:{' '}
                        <span className="text-primary-600 font-bold">
                          {getUserVotingPower(
                            selectedProposal.projectId
                          ).toFixed(2)}
                          %
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <label
                      className={`flex items-center gap-4 glass-modern rounded-xl p-4 cursor-pointer hover-lift transition-all duration-300 ${selectedVote === 'for' ? 'ring-2 ring-success-500 bg-gradient-to-r from-success-50 to-success-100' : 'hover:bg-primary-50'}`}
                    >
                      <input
                        type="radio"
                        name="vote"
                        value="for"
                        checked={selectedVote === 'for'}
                        onChange={e => setSelectedVote(e.target.value as 'for')}
                        className="text-success-600 focus:ring-success-500"
                      />
                      <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-600 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-primary-800 mb-1">
                          Vote For
                        </div>
                        <div className="text-sm text-primary-600">
                          Support and approve this proposal
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-4 glass-modern rounded-xl p-4 cursor-pointer hover-lift transition-all duration-300 ${selectedVote === 'against' ? 'ring-2 ring-accent-500 bg-gradient-to-r from-accent-50 to-accent-100' : 'hover:bg-primary-50'}`}
                    >
                      <input
                        type="radio"
                        name="vote"
                        value="against"
                        checked={selectedVote === 'against'}
                        onChange={e =>
                          setSelectedVote(e.target.value as 'against')
                        }
                        className="text-accent-600 focus:ring-accent-500"
                      />
                      <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-primary-800 mb-1">
                          Vote Against
                        </div>
                        <div className="text-sm text-primary-600">
                          Oppose and reject this proposal
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-4 glass-modern rounded-xl p-4 cursor-pointer hover-lift transition-all duration-300 ${selectedVote === 'abstain' ? 'ring-2 ring-secondary-500 bg-gradient-to-r from-secondary-50 to-secondary-100' : 'hover:bg-primary-50'}`}
                    >
                      <input
                        type="radio"
                        name="vote"
                        value="abstain"
                        checked={selectedVote === 'abstain'}
                        onChange={e =>
                          setSelectedVote(e.target.value as 'abstain')
                        }
                        className="text-secondary-600 focus:ring-secondary-500"
                      />
                      <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-primary-800 mb-1">
                          Abstain
                        </div>
                        <div className="text-sm text-primary-600">
                          No preference on this proposal
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center gap-4">
                    <AnimatedButton
                      variant="secondary"
                      onClick={() => {
                        setVotingModalOpen(false);
                        setSelectedVote('');
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </AnimatedButton>
                    <AnimatedButton
                      variant="primary"
                      onClick={handleVote}
                      disabled={!selectedVote || voting}
                      className="flex-1 flex items-center justify-center gap-2"
                      loading={voting}
                      ripple
                    >
                      {!voting && (
                        <>
                          <Vote className="w-4 h-4" />
                          Submit Vote
                        </>
                      )}
                    </AnimatedButton>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Proposal Details Modal */}
          {selectedProposal && !votingModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="glass-feature rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gradient mb-2">
                      Proposal Details
                    </h2>
                    <p className="text-primary-600">
                      Complete proposal information and voting history
                    </p>
                  </div>
                  <AnimatedButton
                    variant="outline"
                    onClick={() => setSelectedProposal(null)}
                    className="w-10 h-10 p-0 text-lg"
                  >
                    ×
                  </AnimatedButton>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-6">
                    <div className="glass-modern rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="font-semibold text-gradient text-xl">
                          {selectedProposal.title}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-xl text-xs font-bold ${getStatusColor(
                            selectedProposal.status
                          )
                            .replace('bg-', 'bg-gradient-to-r from-')
                            .replace(
                              '-50',
                              '-100 to-' +
                                getStatusColor(selectedProposal.status).split(
                                  '-'
                                )[1] +
                                '-200'
                            )}`}
                        >
                          {getStatusLabel(selectedProposal.status)}
                        </span>
                      </div>
                      <p className="text-primary-700 leading-relaxed">
                        {selectedProposal.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="glass-modern rounded-xl p-4">
                        <label className="block text-sm font-semibold text-primary-700 mb-2">
                          Proposer
                        </label>
                        <p className="text-primary-800 font-mono text-sm break-all">
                          {selectedProposal.proposer}
                        </p>
                      </div>
                      <div className="glass-modern rounded-xl p-4">
                        <label className="block text-sm font-semibold text-primary-700 mb-2">
                          Category
                        </label>
                        <p className="text-primary-800 font-medium">
                          {selectedProposal.category}
                        </p>
                      </div>
                    </div>

                    <div className="glass-modern rounded-xl p-4">
                      <label className="block text-sm font-semibold text-primary-700 mb-2">
                        Voting Period
                      </label>
                      <p className="text-primary-800 font-medium">
                        {formatDate(selectedProposal.votingPeriod.start)} -{' '}
                        {formatDate(selectedProposal.votingPeriod.end)}
                      </p>
                    </div>

                    <div className="glass-modern rounded-xl p-4">
                      <label className="block text-sm font-semibold text-primary-700 mb-2">
                        Required Quorum
                      </label>
                      <p className="text-primary-800 font-bold text-lg">
                        {formatNumber(selectedProposal.quorum.required)} tokens
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="glass-modern rounded-xl p-6">
                      <h4 className="font-semibold text-gradient text-lg mb-4">
                        Voting Results
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 glass-hero rounded-lg">
                          <span className="text-success-700 font-semibold flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            For
                          </span>
                          <span className="font-bold text-success-800">
                            {formatNumber(selectedProposal.votes.for)} tokens
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 glass-hero rounded-lg">
                          <span className="text-accent-700 font-semibold flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            Against
                          </span>
                          <span className="font-bold text-accent-800">
                            {formatNumber(selectedProposal.votes.against)}{' '}
                            tokens
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 glass-hero rounded-lg">
                          <span className="text-muted-700 font-semibold flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Abstain
                          </span>
                          <span className="font-bold text-muted-800">
                            {formatNumber(selectedProposal.votes.abstain)}{' '}
                            tokens
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </PageTransition>
      </DashboardLayout>
    </div>
  );
}
