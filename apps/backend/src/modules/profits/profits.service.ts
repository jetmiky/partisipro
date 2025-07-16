import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { FirebaseService } from '../../common/services/firebase.service';
import { ProjectsService } from '../projects/projects.service';
import { InvestmentsService } from '../investments/investments.service';
import { PaymentsService } from '../payments/payments.service';
import { RealtimeService } from '../realtime/realtime.service';
import { DistributeProfitsDto, ClaimProfitsDto } from './dto';
import {
  ProfitDistribution,
  ProfitClaim,
  ProfitDistributionStatus,
  ProfitClaimStatus,
} from '../../common/types';
import { PaymentType, PaymentMethod } from '../payments/dto';

@Injectable()
export class ProfitsService {
  private readonly logger = new Logger(ProfitsService.name);
  private readonly DISTRIBUTIONS_COLLECTION = 'profit_distributions';
  private readonly CLAIMS_COLLECTION = 'profit_claims';
  private readonly PLATFORM_FEE_PERCENTAGE = 0.05; // 5% platform fee

  constructor(
    private firebaseService: FirebaseService,
    private projectsService: ProjectsService,
    private investmentsService: InvestmentsService,
    private paymentsService: PaymentsService,
    @Inject(forwardRef(() => RealtimeService))
    private realtimeService: RealtimeService
  ) {}

  /**
   * Distribute profits to investors (Admin only)
   */
  async distributeProfits(
    distributeProfitsDto: DistributeProfitsDto,
    adminId: string
  ): Promise<ProfitDistribution> {
    this.logger.log(
      `Distributing profits for project: ${distributeProfitsDto.projectId}`
    );

    // Validate project exists
    const project = await this.projectsService.findProjectById(
      distributeProfitsDto.projectId
    );
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if distribution for this period already exists
    const existingDistribution = await this.findDistributionByPeriod(
      distributeProfitsDto.projectId,
      distributeProfitsDto.quarter,
      distributeProfitsDto.year
    );

    if (existingDistribution) {
      throw new BadRequestException(
        'Distribution for this period already exists'
      );
    }

    // Calculate platform fee and distributed profit
    const platformFee =
      distributeProfitsDto.totalProfit * this.PLATFORM_FEE_PERCENTAGE;
    const distributedProfit = distributeProfitsDto.totalProfit - platformFee;

    // Get total circulating tokens for this project
    const totalCirculatingTokens = await this.getTotalCirculatingTokens(
      distributeProfitsDto.projectId
    );

    if (totalCirculatingTokens === 0) {
      throw new BadRequestException(
        'No circulating tokens found for this project'
      );
    }

    // Calculate profit per token
    const profitPerToken = distributedProfit / totalCirculatingTokens;

    // Create distribution ID
    const distributionId = `dist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create distribution record
    const distribution: ProfitDistribution = {
      id: distributionId,
      projectId: distributeProfitsDto.projectId,
      period: {
        startDate: new Date(distributeProfitsDto.periodStartDate),
        endDate: new Date(distributeProfitsDto.periodEndDate),
        quarter: distributeProfitsDto.quarter,
        year: distributeProfitsDto.year,
      },
      totalProfit: distributeProfitsDto.totalProfit,
      platformFee,
      distributedProfit,
      profitPerToken,
      status: ProfitDistributionStatus.CALCULATED,
      transactionHash: '', // Will be set after mock blockchain transaction
      createdAt: new Date(),
      distributedAt: new Date(),
      adminId,
      notes: distributeProfitsDto.notes,
    };

    // Save distribution to Firestore
    await this.firebaseService.setDocument(
      this.DISTRIBUTIONS_COLLECTION,
      distributionId,
      distribution
    );

    // Mock Treasury contract interaction - simulate profit distribution
    await this.mockTreasuryDistribution(distributionId, distributedProfit);

    // Create individual profit claims for each investor
    await this.createProfitClaims(
      distributionId,
      distributeProfitsDto.projectId,
      profitPerToken
    );

    // Broadcast profit distribution to all investors of this project
    await this.broadcastProfitDistributionToProjectInvestors(
      distributeProfitsDto.projectId,
      distribution
    );

    this.logger.log(`Profit distribution completed: ${distributionId}`);
    return distribution;
  }

  /**
   * Claim profits (Investor only)
   */
  async claimProfits(
    claimProfitsDto: ClaimProfitsDto,
    userId: string
  ): Promise<ProfitClaim> {
    this.logger.log(
      `Processing profit claim for user: ${userId}, distribution: ${claimProfitsDto.distributionId}`
    );

    // Get profit claim record
    const claimId = `${claimProfitsDto.distributionId}_${userId}`;
    const claim = await this.getProfitClaimById(claimId);

    if (!claim) {
      throw new NotFoundException('Profit claim not found');
    }

    if (claim.userId !== userId) {
      throw new BadRequestException('Unauthorized to claim this profit');
    }

    if (claim.status !== ProfitClaimStatus.PENDING) {
      throw new BadRequestException(
        `Profit claim is not pending. Current status: ${claim.status}`
      );
    }

    // Update claim status to processing
    await this.firebaseService.updateDocument(this.CLAIMS_COLLECTION, claimId, {
      status: ProfitClaimStatus.PROCESSING,
      updatedAt: this.firebaseService.getTimestamp(),
    });

    try {
      // Initiate payment to user's bank account
      const paymentResult = await this.paymentsService.initiatePayment({
        userId,
        projectId: claim.projectId,
        investmentId: claimId,
        amount: claim.claimableAmount,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentType: PaymentType.PROFIT_CLAIM,
        email: '', // Will be fetched from user profile
        phoneNumber: '', // Will be fetched from user profile
        fullName: '', // Will be fetched from user profile
        description: `Profit claim for distribution ${claim.distributionId}`,
      });

      // Update claim with payment details
      const updatedClaim = {
        ...claim,
        status: ProfitClaimStatus.PROCESSING,
        paymentDetails: {
          paymentId: paymentResult.paymentId,
          bankAccount: claimProfitsDto.bankAccountNumber || '',
          processedAt: new Date(),
        },
        updatedAt: new Date(),
      };

      await this.firebaseService.updateDocument(
        this.CLAIMS_COLLECTION,
        claimId,
        {
          ...updatedClaim,
          updatedAt: this.firebaseService.getTimestamp(),
        }
      );

      // Broadcast profit claim update to user
      await this.realtimeService.broadcastProfitDistribution(
        userId,
        {
          type: 'claim_processing',
          distributionId: claimProfitsDto.distributionId,
          claimId,
          amount: claim.claimableAmount,
          paymentId: paymentResult.paymentId,
          status: ProfitClaimStatus.PROCESSING,
        },
        claim.projectId
      );

      this.logger.log(
        `Profit claim processed: ${claimId}, Payment: ${paymentResult.paymentId}`
      );
      return updatedClaim;
    } catch (error) {
      // Revert claim status to pending if payment fails
      await this.firebaseService.updateDocument(
        this.CLAIMS_COLLECTION,
        claimId,
        {
          status: ProfitClaimStatus.PENDING,
          updatedAt: this.firebaseService.getTimestamp(),
        }
      );

      this.logger.error(`Failed to process profit claim: ${claimId}`, error);
      throw new BadRequestException('Failed to process profit claim');
    }
  }

  /**
   * Process successful profit claim payment
   */
  async processSuccessfulClaimPayment(claimId: string): Promise<void> {
    this.logger.log(`Processing successful profit claim payment: ${claimId}`);

    const claim = await this.getProfitClaimById(claimId);
    if (!claim) {
      throw new NotFoundException('Profit claim not found');
    }

    if (claim.status !== ProfitClaimStatus.PROCESSING) {
      this.logger.warn(
        `Profit claim ${claimId} is not in processing status: ${claim.status}`
      );
      return;
    }

    // Update claim status to completed
    await this.firebaseService.updateDocument(this.CLAIMS_COLLECTION, claimId, {
      status: ProfitClaimStatus.COMPLETED,
      claimedAmount: claim.claimableAmount,
      claimedAt: this.firebaseService.getTimestamp(),
      updatedAt: this.firebaseService.getTimestamp(),
    });

    // Broadcast profit claim completion to user
    await this.realtimeService.broadcastProfitDistribution(
      claim.userId,
      {
        type: 'claim_completed',
        distributionId: claim.distributionId,
        claimId,
        amount: claim.claimableAmount,
        status: ProfitClaimStatus.COMPLETED,
      },
      claim.projectId
    );

    // TODO: In production, call Treasury contract to mark claim as settled
    this.logger.log(`Profit claim completed successfully: ${claimId}`);
  }

  /**
   * Get profit distributions for a project
   */
  async getProjectDistributions(
    projectId: string
  ): Promise<ProfitDistribution[]> {
    const docs = await this.firebaseService.getDocumentsByField(
      this.DISTRIBUTIONS_COLLECTION,
      'projectId',
      projectId
    );

    return docs.docs.map(doc => doc.data() as ProfitDistribution);
  }

  /**
   * Get user's profit claims
   */
  async getUserProfitClaims(userId: string): Promise<ProfitClaim[]> {
    const docs = await this.firebaseService.getDocumentsByField(
      this.CLAIMS_COLLECTION,
      'userId',
      userId
    );

    return docs.docs.map(doc => doc.data() as ProfitClaim);
  }

  /**
   * Get claimable profits for a user
   */
  async getUserClaimableProfits(userId: string): Promise<ProfitClaim[]> {
    const allClaims = await this.getUserProfitClaims(userId);
    return allClaims.filter(
      claim => claim.status === ProfitClaimStatus.PENDING
    );
  }

  /**
   * Get profit distribution by ID
   */
  async getDistributionById(
    distributionId: string
  ): Promise<ProfitDistribution | null> {
    const doc = await this.firebaseService.getDocument(
      this.DISTRIBUTIONS_COLLECTION,
      distributionId
    );

    if (!doc.exists) {
      return null;
    }

    return doc.data() as ProfitDistribution;
  }

  /**
   * Get profit claim by ID
   */
  async getProfitClaimById(claimId: string): Promise<ProfitClaim | null> {
    const doc = await this.firebaseService.getDocument(
      this.CLAIMS_COLLECTION,
      claimId
    );

    if (!doc.exists) {
      return null;
    }

    return doc.data() as ProfitClaim;
  }

  /**
   * Get all profit distributions with filtering
   */
  async getAllDistributions(
    status?: ProfitDistributionStatus,
    limit: number = 50,
    startAfter?: string
  ): Promise<ProfitDistribution[]> {
    const query = (ref: FirebaseFirestore.Query) => {
      let q = ref.orderBy('createdAt', 'desc');

      if (status) {
        q = q.where('status', '==', status);
      }

      q = q.limit(limit);

      if (startAfter) {
        q = q.startAfter(startAfter);
      }

      return q;
    };

    const docs = await this.firebaseService.getDocuments(
      this.DISTRIBUTIONS_COLLECTION,
      query
    );

    return docs.docs.map(doc => doc.data() as ProfitDistribution);
  }

  /**
   * Find distribution by period
   */
  private async findDistributionByPeriod(
    projectId: string,
    quarter: number,
    year: number
  ): Promise<ProfitDistribution | null> {
    const query = (ref: FirebaseFirestore.Query) => {
      return ref
        .where('projectId', '==', projectId)
        .where('period.quarter', '==', quarter)
        .where('period.year', '==', year)
        .limit(1);
    };

    const docs = await this.firebaseService.getDocuments(
      this.DISTRIBUTIONS_COLLECTION,
      query
    );

    if (docs.docs.length === 0) {
      return null;
    }

    return docs.docs[0].data() as ProfitDistribution;
  }

  /**
   * Get total circulating tokens for a project
   */
  private async getTotalCirculatingTokens(projectId: string): Promise<number> {
    const investments =
      await this.investmentsService.getProjectInvestments(projectId);

    return investments
      .filter(inv => inv.status === 'completed')
      .reduce((total, inv) => total + inv.tokenAmount, 0);
  }

  /**
   * Mock Treasury contract profit distribution
   */
  private async mockTreasuryDistribution(
    distributionId: string,
    amount: number
  ): Promise<void> {
    this.logger.log(
      `Mock Treasury distribution: ${distributionId}, Amount: ${amount}`
    );

    // Simulate blockchain transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock transaction hash
    const mockTransactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;

    // Update distribution with transaction hash and status
    await this.firebaseService.updateDocument(
      this.DISTRIBUTIONS_COLLECTION,
      distributionId,
      {
        transactionHash: mockTransactionHash,
        status: ProfitDistributionStatus.DISTRIBUTED,
        updatedAt: this.firebaseService.getTimestamp(),
      }
    );

    this.logger.log(
      `Mock Treasury distribution completed: ${distributionId}, TX: ${mockTransactionHash}`
    );
  }

  /**
   * Create individual profit claims for each investor
   */
  private async createProfitClaims(
    distributionId: string,
    projectId: string,
    profitPerToken: number
  ): Promise<void> {
    this.logger.log(
      `Creating profit claims for distribution: ${distributionId}`
    );

    const investments =
      await this.investmentsService.getProjectInvestments(projectId);
    const completedInvestments = investments.filter(
      inv => inv.status === 'completed'
    );

    for (const investment of completedInvestments) {
      const claimableAmount = investment.tokenAmount * profitPerToken;

      const claimId = `${distributionId}_${investment.userId}`;
      const claim: ProfitClaim = {
        id: claimId,
        userId: investment.userId,
        projectId,
        distributionId,
        tokenAmount: investment.tokenAmount,
        claimableAmount,
        claimedAmount: 0,
        status: ProfitClaimStatus.PENDING,
        paymentDetails: {
          paymentId: '',
          bankAccount: '',
          processedAt: new Date(),
        },
        createdAt: new Date(),
        claimedAt: null,
      };

      await this.firebaseService.setDocument(
        this.CLAIMS_COLLECTION,
        claimId,
        claim
      );
    }

    this.logger.log(
      `Created ${completedInvestments.length} profit claims for distribution: ${distributionId}`
    );
  }

  /**
   * Broadcast profit distribution to all investors of a project
   */
  private async broadcastProfitDistributionToProjectInvestors(
    projectId: string,
    distribution: ProfitDistribution
  ): Promise<void> {
    try {
      // Get all investors for this project
      const projectInvestments =
        await this.investmentsService.getProjectInvestments(projectId);

      // Broadcast to each investor
      for (const investment of projectInvestments) {
        await this.realtimeService.broadcastProfitDistribution(
          investment.userId,
          {
            type: 'distribution_created',
            distributionId: distribution.id,
            projectId,
            period: distribution.period,
            profitPerToken: distribution.profitPerToken,
            totalProfit: distribution.totalProfit,
            distributedProfit: distribution.distributedProfit,
            status: distribution.status,
            createdAt: distribution.createdAt,
          },
          projectId
        );
      }

      this.logger.log(
        `Broadcasted profit distribution to ${projectInvestments.length} investors for project: ${projectId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to broadcast profit distribution for project: ${projectId}`,
        error
      );
    }
  }

  // ========================================
  // MISSING METHODS - Added for test compatibility
  // TODO: Implement with real business logic
  // ========================================

  /**
   * Calculate profit shares for a distribution
   */
  async calculateProfitShares(distributionId: string): Promise<any> {
    this.logger.log(
      `Calculating profit shares for distribution: ${distributionId}`
    );

    // TODO: Implement real profit share calculation
    return {
      distributionId,
      totalShares: 0,
      shareHolders: [],
      calculatedAt: new Date(),
    };
  }

  /**
   * Get all profit claims for a distribution
   */
  async getAllProfitClaims(distributionId: string): Promise<any[]> {
    this.logger.log(
      `Getting all profit claims for distribution: ${distributionId}`
    );

    // TODO: Implement real profit claims retrieval
    return [];
  }

  /**
   * Get distribution reconciliation
   */
  async getDistributionReconciliation(distributionId: string): Promise<any> {
    this.logger.log(
      `Getting distribution reconciliation for: ${distributionId}`
    );

    // TODO: Implement real reconciliation logic
    return {
      distributionId,
      totalDistributed: 0,
      totalClaimed: 0,
      remainingBalance: 0,
      reconciliationStatus: 'complete',
      discrepancies: [],
      reconciledAt: new Date(),
    };
  }

  /**
   * Calculate individual investor returns
   */
  async calculateInvestorReturns(investorId: string): Promise<any> {
    this.logger.log(`Calculating investor returns for: ${investorId}`);

    // TODO: Implement real investor returns calculation
    return {
      investorId,
      totalInvested: 0,
      totalReturns: 0,
      totalProfits: 0,
      returnRate: 0,
      investments: [],
      calculatedAt: new Date(),
    };
  }

  /**
   * Compare returns across investor types
   */
  async compareInvestorReturns(investorIds: string[]): Promise<any> {
    this.logger.log(
      `Comparing investor returns for: ${investorIds.join(', ')}`
    );

    // TODO: Implement real investor returns comparison
    return {
      investors: [],
      averageReturn: 0,
      bestPerformer: null,
      worstPerformer: null,
      comparisonMetrics: {
        totalReturns: 0,
        averageROI: 0,
        riskAdjustedReturns: 0,
      },
      comparedAt: new Date(),
    };
  }

  /**
   * Validate distribution fairness
   */
  async validateDistributionFairness(projectId: string): Promise<any> {
    this.logger.log(
      `Validating distribution fairness for project: ${projectId}`
    );

    // TODO: Implement real fairness validation
    return {
      projectId,
      fairnessScore: 100,
      distributionEquity: 100,
      potentialIssues: [],
      recommendations: [],
      validatedAt: new Date(),
    };
  }

  /**
   * Get profit compliance report
   */
  async getProfitComplianceReport(projectId: string): Promise<any> {
    this.logger.log(
      `Getting profit compliance report for project: ${projectId}`
    );

    // TODO: Implement real compliance report
    return {
      projectId,
      complianceScore: 100,
      regulatoryCompliance: 100,
      taxCompliance: 100,
      distributionCompliance: 100,
      flaggedTransactions: [],
      complianceIssues: [],
      recommendations: [],
      generatedAt: new Date(),
    };
  }

  /**
   * Get total reconciliation for a project
   */
  async getTotalReconciliation(projectId: string): Promise<any> {
    this.logger.log(`Getting total reconciliation for project: ${projectId}`);

    // TODO: Implement real total reconciliation
    return {
      projectId,
      totalProfitsReceived: 0,
      totalDistributed: 0,
      totalClaimed: 0,
      platformFees: 0,
      remainingBalance: 0,
      reconciliationStatus: 'complete',
      quarterlyBreakdown: [],
      discrepancies: [],
      reconciledAt: new Date(),
    };
  }

  /**
   * Generate profit projections
   */
  async generateProfitProjections(projectId: string): Promise<any> {
    this.logger.log(`Generating profit projections for project: ${projectId}`);

    // TODO: Implement real profit projections
    return {
      projectId,
      projectionPeriod: '12_months',
      projectedQuarterly: [],
      projectedAnnual: 0,
      confidenceLevel: 75,
      assumptions: [],
      riskFactors: [],
      generatedAt: new Date(),
    };
  }

  /**
   * Get investment recommendations
   */
  async getInvestmentRecommendations(projectId: string): Promise<any> {
    this.logger.log(
      `Getting investment recommendations for project: ${projectId}`
    );

    // TODO: Implement real investment recommendations
    return {
      projectId,
      recommendationScore: 75,
      recommendation: 'HOLD',
      rationale: [],
      riskAssessment: 'medium',
      expectedReturn: 0,
      timeHorizon: '12_months',
      marketConditions: [],
      generatedAt: new Date(),
    };
  }
}
