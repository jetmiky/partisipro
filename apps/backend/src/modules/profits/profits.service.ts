import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FirebaseService } from '../../common/services/firebase.service';
import { ProjectsService } from '../projects/projects.service';
import { InvestmentsService } from '../investments/investments.service';
import { PaymentsService } from '../payments/payments.service';
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
    private paymentsService: PaymentsService
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
}
