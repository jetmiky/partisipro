import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../../common/services/firebase.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ProjectsService } from '../projects/projects.service';
import { InvestmentsService } from '../investments/investments.service';
import { RealtimeService } from '../realtime/realtime.service';
import {
  CreateProposalDto,
  VoteProposalDto,
  ProposalType,
  VoteOption,
} from './dto';

export interface GovernanceProposal {
  id: string;
  projectId: string;
  proposerId: string;
  title: string;
  description: string;
  type: ProposalType;
  voting: {
    startDate: Date;
    endDate: Date;
    quorum: number;
    threshold: number;
  };
  votes: {
    for: number;
    against: number;
    abstain: number;
  };
  status: 'pending' | 'active' | 'passed' | 'rejected' | 'executed';
  contractCall?: {
    targetContract: string;
    methodName: string;
    parameters: any[];
  };
  createdAt: Date;
  executedAt?: Date;
}

export interface Vote {
  id: string;
  proposalId: string;
  userId: string;
  vote: VoteOption;
  tokenAmount: number; // voting power
  reason?: string;
  transactionHash?: string;
  createdAt: Date;
}

@Injectable()
export class GovernanceService {
  private readonly logger = new Logger(GovernanceService.name);
  private readonly PROPOSALS_COLLECTION = 'governance_proposals';
  private readonly VOTES_COLLECTION = 'governance_votes';

  constructor(
    private configService: ConfigService,
    private firebaseService: FirebaseService,
    private blockchainService: BlockchainService,
    private projectsService: ProjectsService,
    private investmentsService: InvestmentsService,
    @Inject(forwardRef(() => RealtimeService))
    private realtimeService: RealtimeService
  ) {}

  /**
   * Create a new governance proposal
   */
  async createProposal(
    createProposalDto: CreateProposalDto,
    proposerId: string
  ): Promise<GovernanceProposal> {
    this.logger.log(
      `Creating governance proposal for project: ${createProposalDto.projectId}`
    );

    // Verify project exists and user has permission to create proposals
    const project = await this.projectsService.findProjectById(
      createProposalDto.projectId
    );
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user has tokens in this project (voting power)
    const allInvestments =
      await this.investmentsService.getUserInvestments(proposerId);
    const userInvestments = allInvestments.filter(
      investment => investment.projectId === createProposalDto.projectId
    );
    if (!userInvestments || userInvestments.length === 0) {
      throw new ForbiddenException(
        'You must hold tokens to create proposals for this project'
      );
    }

    // Calculate voting period (default 7 days if not specified)
    const now = new Date();
    const votingStartDate = createProposalDto.votingStartDate
      ? new Date(createProposalDto.votingStartDate)
      : now;
    const votingEndDate = createProposalDto.votingEndDate
      ? new Date(createProposalDto.votingEndDate)
      : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    if (votingEndDate <= votingStartDate) {
      throw new BadRequestException('Voting end date must be after start date');
    }

    const proposalId = `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const proposal: GovernanceProposal = {
      id: proposalId,
      projectId: createProposalDto.projectId,
      proposerId,
      title: createProposalDto.title,
      description: createProposalDto.description,
      type: createProposalDto.type,
      voting: {
        startDate: votingStartDate,
        endDate: votingEndDate,
        quorum: createProposalDto.quorum || 10, // 10% default
        threshold: createProposalDto.threshold || 50, // 50% default
      },
      votes: {
        for: 0,
        against: 0,
        abstain: 0,
      },
      status: votingStartDate <= now ? 'active' : 'pending',
      contractCall: createProposalDto.contractCall
        ? {
            targetContract: createProposalDto.contractCall.targetContract,
            methodName: createProposalDto.contractCall.methodName,
            parameters: createProposalDto.contractCall.parameters || [],
          }
        : undefined,
      createdAt: now,
    };

    // Save proposal to Firestore
    await this.firebaseService.setDocument(
      this.PROPOSALS_COLLECTION,
      proposalId,
      proposal
    );

    // TODO: In production, this would create a proposal on the Governance smart contract
    await this.blockchainService.mockProjectFactoryCreateProject(
      createProposalDto.projectId,
      proposerId,
      { proposalId, type: 'governance_proposal' }
    );

    // Broadcast proposal creation to real-time subscribers
    await this.realtimeService.broadcastGovernanceUpdate(proposal.projectId, {
      type: 'proposal_created',
      proposal: {
        id: proposal.id,
        title: proposal.title,
        type: proposal.type,
        status: proposal.status,
        voting: proposal.voting,
        createdAt: proposal.createdAt,
      },
      projectId: proposal.projectId,
      timestamp: new Date(),
    });

    this.logger.log(`Governance proposal created: ${proposalId}`);
    return proposal;
  }

  /**
   * Vote on a governance proposal
   */
  async voteOnProposal(
    voteProposalDto: VoteProposalDto,
    userId: string
  ): Promise<Vote> {
    this.logger.log(
      `User ${userId} voting on proposal: ${voteProposalDto.proposalId}`
    );

    // Get proposal
    const proposal = await this.getProposal(voteProposalDto.proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    // Check if proposal is active
    const now = new Date();
    if (proposal.status !== 'active') {
      throw new BadRequestException('Proposal is not active for voting');
    }

    if (now < proposal.voting.startDate) {
      throw new BadRequestException('Voting has not started yet');
    }

    if (now > proposal.voting.endDate) {
      throw new BadRequestException('Voting period has ended');
    }

    // Check if user already voted
    const existingVote = await this.getUserVote(
      voteProposalDto.proposalId,
      userId
    );
    if (existingVote) {
      throw new BadRequestException('You have already voted on this proposal');
    }

    // Get user's voting power (token amount in project)
    const allInvestments =
      await this.investmentsService.getUserInvestments(userId);
    const userInvestments = allInvestments.filter(
      investment => investment.projectId === proposal.projectId
    );
    const totalTokens = userInvestments.reduce(
      (sum, investment) => sum + investment.tokenAmount,
      0
    );

    if (totalTokens === 0) {
      throw new ForbiddenException(
        'You must hold tokens to vote on this proposal'
      );
    }

    const voteId = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const vote: Vote = {
      id: voteId,
      proposalId: voteProposalDto.proposalId,
      userId,
      vote: voteProposalDto.vote,
      tokenAmount: totalTokens,
      reason: voteProposalDto.reason,
      createdAt: now,
    };

    // Save vote to Firestore
    await this.firebaseService.setDocument(this.VOTES_COLLECTION, voteId, vote);

    // Update proposal vote counts
    await this.updateProposalVoteCounts(voteProposalDto.proposalId);

    // TODO: In production, this would record the vote on the Governance smart contract
    const mockTransaction =
      await this.blockchainService.mockTreasuryDistributeProfits(
        proposal.projectId,
        totalTokens,
        voteId
      );
    vote.transactionHash = mockTransaction.hash;

    // Update vote with transaction hash
    await this.firebaseService.updateDocument(this.VOTES_COLLECTION, voteId, {
      transactionHash: vote.transactionHash,
    });

    // Get updated proposal for broadcasting
    const updatedProposal = await this.getProposal(proposal.id);

    // Broadcast vote cast to real-time subscribers
    await this.realtimeService.broadcastGovernanceUpdate(proposal.projectId, {
      type: 'vote_cast',
      vote: {
        id: vote.id,
        proposalId: vote.proposalId,
        vote: vote.vote,
        tokenAmount: vote.tokenAmount,
        createdAt: vote.createdAt,
      },
      proposal: {
        id: updatedProposal.id,
        votes: updatedProposal.votes,
        status: updatedProposal.status,
      },
      projectId: proposal.projectId,
      timestamp: new Date(),
    });

    this.logger.log(`Vote cast: ${voteId}`);
    return vote;
  }

  /**
   * Get all proposals for a project
   */
  async getProjectProposals(projectId: string): Promise<GovernanceProposal[]> {
    const docs = await this.firebaseService.getDocumentsByField(
      this.PROPOSALS_COLLECTION,
      'projectId',
      projectId
    );

    return docs.docs.map(doc => doc.data() as GovernanceProposal);
  }

  /**
   * Get a specific proposal
   */
  async getProposal(proposalId: string): Promise<GovernanceProposal | null> {
    const doc = await this.firebaseService.getDocument(
      this.PROPOSALS_COLLECTION,
      proposalId
    );

    if (!doc.exists) {
      return null;
    }

    return doc.data() as GovernanceProposal;
  }

  /**
   * Get all proposals (admin function)
   */
  async getAllProposals(): Promise<GovernanceProposal[]> {
    const docs = await this.firebaseService.getDocuments(
      this.PROPOSALS_COLLECTION
    );
    return docs.docs.map(doc => doc.data() as GovernanceProposal);
  }

  /**
   * Get user's voting power for a project
   */
  async getUserVotingPower(userId: string, projectId: string): Promise<number> {
    const allInvestments =
      await this.investmentsService.getUserInvestments(userId);
    const userInvestments = allInvestments.filter(
      investment => investment.projectId === projectId
    );
    return userInvestments.reduce(
      (sum, investment) => sum + investment.tokenAmount,
      0
    );
  }

  /**
   * Get user's vote on a proposal
   */
  async getUserVote(proposalId: string, userId: string): Promise<Vote | null> {
    const query = (ref: FirebaseFirestore.Query) =>
      ref.where('proposalId', '==', proposalId).where('userId', '==', userId);

    const docs = await this.firebaseService.getDocuments(
      this.VOTES_COLLECTION,
      query
    );

    if (docs.docs.length === 0) {
      return null;
    }

    return docs.docs[0].data() as Vote;
  }

  /**
   * Get all votes for a proposal
   */
  async getProposalVotes(proposalId: string): Promise<Vote[]> {
    const docs = await this.firebaseService.getDocumentsByField(
      this.VOTES_COLLECTION,
      'proposalId',
      proposalId
    );

    return docs.docs.map(doc => doc.data() as Vote);
  }

  /**
   * Execute a passed proposal
   */
  async executeProposal(
    proposalId: string,
    executorId: string
  ): Promise<GovernanceProposal> {
    this.logger.log(`Executing proposal: ${proposalId}`);

    const proposal = await this.getProposal(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    if (proposal.status !== 'passed') {
      throw new BadRequestException('Proposal has not passed');
    }

    // Check if proposal has contract call to execute
    if (!proposal.contractCall) {
      throw new BadRequestException('Proposal has no contract call to execute');
    }

    // TODO: In production, this would execute the actual contract call
    // For now, we'll mock the execution
    await this.blockchainService.submitTransaction(
      {
        contractAddress: proposal.contractCall.targetContract,
        transactionData: JSON.stringify({
          method: proposal.contractCall.methodName,
          parameters: proposal.contractCall.parameters,
        }),
        value: '0',
        gasLimit: 500000,
      },
      executorId
    );

    // Update proposal status
    const updatedProposal = {
      ...proposal,
      status: 'executed' as const,
      executedAt: new Date(),
    };

    await this.firebaseService.updateDocument(
      this.PROPOSALS_COLLECTION,
      proposalId,
      {
        status: 'executed',
        executedAt: updatedProposal.executedAt,
      }
    );

    // Broadcast proposal execution to real-time subscribers
    await this.realtimeService.broadcastGovernanceUpdate(proposal.projectId, {
      type: 'proposal_executed',
      proposal: {
        id: updatedProposal.id,
        title: updatedProposal.title,
        status: updatedProposal.status,
        executedAt: updatedProposal.executedAt,
        contractCall: updatedProposal.contractCall,
      },
      projectId: proposal.projectId,
      timestamp: new Date(),
    });

    this.logger.log(`Proposal executed: ${proposalId}`);
    return updatedProposal;
  }

  /**
   * Update proposal status and check if voting has ended
   */
  async updateProposalStatuses(): Promise<void> {
    const now = new Date();
    const proposals = await this.getAllProposals();

    for (const proposal of proposals) {
      let updated = false;
      const updates: Partial<GovernanceProposal> = {};

      // Check if proposal should become active
      if (proposal.status === 'pending' && now >= proposal.voting.startDate) {
        updates.status = 'active';
        updated = true;
      }

      // Check if voting period has ended
      if (proposal.status === 'active' && now > proposal.voting.endDate) {
        const totalVotes =
          proposal.votes.for + proposal.votes.against + proposal.votes.abstain;
        const totalTokens = await this.getTotalProjectTokens(
          proposal.projectId
        );
        const participationRate = (totalVotes / totalTokens) * 100;

        if (participationRate >= proposal.voting.quorum) {
          const approvalRate = (proposal.votes.for / totalVotes) * 100;
          updates.status =
            approvalRate >= proposal.voting.threshold ? 'passed' : 'rejected';
        } else {
          updates.status = 'rejected'; // Failed to meet quorum
        }
        updated = true;
      }

      if (updated) {
        await this.firebaseService.updateDocument(
          this.PROPOSALS_COLLECTION,
          proposal.id,
          updates
        );

        // Broadcast proposal status update to real-time subscribers
        await this.realtimeService.broadcastGovernanceUpdate(
          proposal.projectId,
          {
            type: 'proposal_status_updated',
            proposal: {
              id: proposal.id,
              title: proposal.title,
              status: updates.status,
              votes: proposal.votes,
              voting: proposal.voting,
            },
            projectId: proposal.projectId,
            timestamp: new Date(),
          }
        );
      }
    }
  }

  /**
   * Update vote counts for a proposal
   */
  private async updateProposalVoteCounts(proposalId: string): Promise<void> {
    const votes = await this.getProposalVotes(proposalId);
    const proposal = await this.getProposal(proposalId);

    const voteCounts = {
      for: 0,
      against: 0,
      abstain: 0,
    };

    votes.forEach(vote => {
      voteCounts[vote.vote] += vote.tokenAmount;
    });

    await this.firebaseService.updateDocument(
      this.PROPOSALS_COLLECTION,
      proposalId,
      { votes: voteCounts }
    );

    // Broadcast vote count update to real-time subscribers (for live vote tallies)
    if (proposal) {
      await this.realtimeService.broadcastGovernanceUpdate(proposal.projectId, {
        type: 'vote_counts_updated',
        proposal: {
          id: proposal.id,
          title: proposal.title,
          votes: voteCounts,
          status: proposal.status,
        },
        projectId: proposal.projectId,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get total tokens for a project (for calculating participation rate)
   */
  private async getTotalProjectTokens(projectId: string): Promise<number> {
    const project = await this.projectsService.findProjectById(projectId);
    return project?.financial.totalTokens || 0;
  }
}
