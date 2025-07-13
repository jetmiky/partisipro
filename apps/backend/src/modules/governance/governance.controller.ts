import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { CreateProposalDto, VoteProposalDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/types/user.types';

@Controller('governance')
@UseGuards(JwtAuthGuard)
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  /**
   * Create a new governance proposal
   */
  @Post('proposals')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INVESTOR, UserRole.SPV)
  async createProposal(
    @Body() createProposalDto: CreateProposalDto,
    @CurrentUser() user: any
  ) {
    const proposal = await this.governanceService.createProposal(
      createProposalDto,
      user.sub
    );

    return {
      success: true,
      data: proposal,
      message: 'Governance proposal created successfully',
    };
  }

  /**
   * Vote on a governance proposal
   */
  @Post('proposals/:proposalId/vote')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INVESTOR, UserRole.SPV)
  async voteOnProposal(
    @Param('proposalId') proposalId: string,
    @Body() voteProposalDto: VoteProposalDto,
    @CurrentUser() user: any
  ) {
    // Override proposalId from URL params
    voteProposalDto.proposalId = proposalId;

    const vote = await this.governanceService.voteOnProposal(
      voteProposalDto,
      user.sub
    );

    return {
      success: true,
      data: vote,
      message: 'Vote cast successfully',
    };
  }

  /**
   * Get all proposals for a project
   */
  @Get('projects/:projectId/proposals')
  async getProjectProposals(@Param('projectId') projectId: string) {
    const proposals =
      await this.governanceService.getProjectProposals(projectId);

    return {
      success: true,
      data: proposals,
      message: 'Project proposals retrieved successfully',
    };
  }

  /**
   * Get a specific proposal
   */
  @Get('proposals/:proposalId')
  async getProposal(@Param('proposalId') proposalId: string) {
    const proposal = await this.governanceService.getProposal(proposalId);

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    return {
      success: true,
      data: proposal,
      message: 'Proposal retrieved successfully',
    };
  }

  /**
   * Get all proposals (admin only)
   */
  @Get('proposals')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllProposals() {
    const proposals = await this.governanceService.getAllProposals();

    return {
      success: true,
      data: proposals,
      message: 'All proposals retrieved successfully',
    };
  }

  /**
   * Get user's voting power for a project
   */
  @Get('projects/:projectId/voting-power')
  async getUserVotingPower(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any
  ) {
    const votingPower = await this.governanceService.getUserVotingPower(
      user.sub,
      projectId
    );

    return {
      success: true,
      data: { votingPower },
      message: 'Voting power retrieved successfully',
    };
  }

  /**
   * Get user's vote on a proposal
   */
  @Get('proposals/:proposalId/my-vote')
  async getUserVote(
    @Param('proposalId') proposalId: string,
    @CurrentUser() user: any
  ) {
    const vote = await this.governanceService.getUserVote(proposalId, user.sub);

    return {
      success: true,
      data: vote,
      message: vote ? 'Vote retrieved successfully' : 'No vote found',
    };
  }

  /**
   * Get all votes for a proposal
   */
  @Get('proposals/:proposalId/votes')
  async getProposalVotes(
    @Param('proposalId') proposalId: string,
    @Query('includeDetails') includeDetails?: string
  ) {
    const votes = await this.governanceService.getProposalVotes(proposalId);

    // Optionally filter out sensitive information
    const responseData =
      includeDetails === 'true'
        ? votes
        : votes.map(vote => ({
            id: vote.id,
            vote: vote.vote,
            tokenAmount: vote.tokenAmount,
            createdAt: vote.createdAt,
            // Exclude userId and reason for privacy
          }));

    return {
      success: true,
      data: responseData,
      message: 'Proposal votes retrieved successfully',
    };
  }

  /**
   * Execute a passed proposal (admin only)
   */
  @Post('proposals/:proposalId/execute')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async executeProposal(
    @Param('proposalId') proposalId: string,
    @CurrentUser() user: any
  ) {
    const proposal = await this.governanceService.executeProposal(
      proposalId,
      user.sub
    );

    return {
      success: true,
      data: proposal,
      message: 'Proposal executed successfully',
    };
  }

  /**
   * Update proposal statuses (admin only, typically called by a cron job)
   */
  @Post('proposals/update-statuses')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateProposalStatuses() {
    await this.governanceService.updateProposalStatuses();

    return {
      success: true,
      message: 'Proposal statuses updated successfully',
    };
  }
}
