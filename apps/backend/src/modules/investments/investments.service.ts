import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseService } from '../../common/services/firebase.service';
import { ProjectsService } from '../projects/projects.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateInvestmentDto } from './dto';
import {
  Investment,
  InvestmentStatus,
  KYCStatus,
  OfferingStatus,
  ProjectStatus,
} from '../../common/types';
import { PaymentType, PaymentMethod } from '../payments/dto';

@Injectable()
export class InvestmentsService {
  private readonly logger = new Logger(InvestmentsService.name);
  private readonly INVESTMENTS_COLLECTION = 'investments';

  constructor(
    private firebaseService: FirebaseService,
    private projectsService: ProjectsService,
    private paymentsService: PaymentsService
  ) {}

  /**
   * Create investment and initiate payment process
   */
  async createInvestment(
    createInvestmentDto: CreateInvestmentDto,
    userId: string
  ): Promise<{
    investment: Investment;
    paymentUrl: string;
  }> {
    this.logger.log(
      `Creating investment for user: ${userId}, project: ${createInvestmentDto.projectId}`
    );

    // Check user KYC status
    const user = await this.getUserById(userId);
    if (user.kyc.status !== KYCStatus.APPROVED) {
      throw new BadRequestException(
        'KYC verification required before investing'
      );
    }

    // Validate project and offering
    const project = await this.projectsService.findProjectById(
      createInvestmentDto.projectId
    );
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.status !== ProjectStatus.ACTIVE) {
      throw new BadRequestException('Project is not active for investment');
    }

    if (project.offering.status !== OfferingStatus.ACTIVE) {
      throw new BadRequestException('Project offering is not active');
    }

    // Check investment limits
    this.validateInvestmentLimits(createInvestmentDto, project);

    // Check if enough tokens are available
    const availableTokens =
      project.financial.totalTokens - project.offering.soldTokens;
    if (createInvestmentDto.tokenAmount > availableTokens) {
      throw new BadRequestException('Not enough tokens available');
    }

    // Calculate investment details
    const expectedAmount =
      createInvestmentDto.tokenAmount * project.financial.tokenPrice;
    if (
      Math.abs(createInvestmentDto.investmentAmount - expectedAmount) > 1000
    ) {
      // Allow 1000 IDR tolerance
      throw new BadRequestException(
        `Investment amount doesn't match token price. Expected: ${expectedAmount}, Received: ${createInvestmentDto.investmentAmount}`
      );
    }

    // Create investment record
    const investmentId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const investment: Investment = {
      id: investmentId,
      userId,
      projectId: createInvestmentDto.projectId,
      tokenAmount: createInvestmentDto.tokenAmount,
      investmentAmount: createInvestmentDto.investmentAmount,
      purchasePrice: project.financial.tokenPrice,
      transactionHash: '', // Will be set after blockchain transaction
      status: InvestmentStatus.PENDING,
      paymentDetails: {
        paymentId: '',
        paymentMethod: '',
        processedAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save investment to Firestore
    await this.firebaseService.setDocument(
      this.INVESTMENTS_COLLECTION,
      investmentId,
      investment
    );

    // Initiate payment process
    const paymentResult = await this.paymentsService.initiatePayment({
      userId,
      projectId: createInvestmentDto.projectId,
      investmentId,
      amount: createInvestmentDto.investmentAmount,
      paymentMethod: PaymentMethod.BANK_TRANSFER, // Default to bank transfer
      paymentType: PaymentType.INVESTMENT,
      email: createInvestmentDto.email,
      phoneNumber: createInvestmentDto.phoneNumber,
      fullName: createInvestmentDto.fullName,
      description: `Investment in ${project.name}`,
    });

    // Update investment with payment details
    await this.firebaseService.updateDocument(
      this.INVESTMENTS_COLLECTION,
      investmentId,
      {
        'paymentDetails.paymentId': paymentResult.paymentId,
        'paymentDetails.paymentMethod': PaymentMethod.BANK_TRANSFER,
        updatedAt: this.firebaseService.getTimestamp(),
      }
    );

    const updatedInvestment = {
      ...investment,
      paymentDetails: {
        ...investment.paymentDetails,
        paymentId: paymentResult.paymentId,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
      },
    };

    this.logger.log(
      `Investment created: ${investmentId}, Payment initiated: ${paymentResult.paymentId}`
    );

    return {
      investment: updatedInvestment,
      paymentUrl: paymentResult.paymentUrl,
    };
  }

  /**
   * Process successful investment payment
   */
  async processSuccessfulPayment(investmentId: string): Promise<void> {
    this.logger.log(
      `Processing successful payment for investment: ${investmentId}`
    );

    const investment = await this.getInvestmentById(investmentId);
    if (!investment) {
      throw new NotFoundException('Investment not found');
    }

    if (investment.status !== InvestmentStatus.PENDING) {
      this.logger.warn(
        `Investment ${investmentId} is not in pending status: ${investment.status}`
      );
      return;
    }

    // Update investment status to completed
    await this.firebaseService.updateDocument(
      this.INVESTMENTS_COLLECTION,
      investmentId,
      {
        status: InvestmentStatus.COMPLETED,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`, // Mock transaction hash
        updatedAt: this.firebaseService.getTimestamp(),
      }
    );

    // Update project offering stats
    await this.updateProjectOfferingStats(
      investment.projectId,
      investment.tokenAmount,
      investment.investmentAmount
    );

    // TODO: In production, mint tokens to user's wallet
    this.logger.log(`Investment completed successfully: ${investmentId}`);
  }

  /**
   * Get investment by ID
   */
  async getInvestmentById(investmentId: string): Promise<Investment | null> {
    const doc = await this.firebaseService.getDocument(
      this.INVESTMENTS_COLLECTION,
      investmentId
    );

    if (!doc.exists) {
      return null;
    }

    return doc.data() as Investment;
  }

  /**
   * Get user's investments
   */
  async getUserInvestments(userId: string): Promise<Investment[]> {
    const docs = await this.firebaseService.getDocumentsByField(
      this.INVESTMENTS_COLLECTION,
      'userId',
      userId
    );

    return docs.docs.map(doc => doc.data() as Investment);
  }

  /**
   * Get user's portfolio with project details
   */
  async getUserPortfolio(userId: string): Promise<any[]> {
    const investments = await this.getUserInvestments(userId);
    const portfolio = [];

    for (const investment of investments) {
      const project = await this.projectsService.findProjectById(
        investment.projectId
      );
      if (project) {
        portfolio.push({
          investment,
          project: {
            id: project.id,
            name: project.name,
            category: project.category,
            status: project.status,
            tokenPrice: project.financial.tokenPrice,
            expectedAnnualReturn: project.expectedAnnualReturn,
            riskLevel: project.riskLevel,
          },
        });
      }
    }

    return portfolio;
  }

  /**
   * Get project investments
   */
  async getProjectInvestments(projectId: string): Promise<Investment[]> {
    const docs = await this.firebaseService.getDocumentsByField(
      this.INVESTMENTS_COLLECTION,
      'projectId',
      projectId
    );

    return docs.docs.map(doc => doc.data() as Investment);
  }

  /**
   * Get all investments with filtering
   */
  async getAllInvestments(
    status?: InvestmentStatus,
    limit: number = 50,
    startAfter?: string
  ): Promise<Investment[]> {
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
      this.INVESTMENTS_COLLECTION,
      query
    );

    return docs.docs.map(doc => doc.data() as Investment);
  }

  /**
   * Cancel investment (only if pending)
   */
  async cancelInvestment(investmentId: string, userId: string): Promise<void> {
    const investment = await this.getInvestmentById(investmentId);

    if (!investment) {
      throw new NotFoundException('Investment not found');
    }

    if (investment.userId !== userId) {
      throw new BadRequestException('Unauthorized to cancel this investment');
    }

    if (investment.status !== InvestmentStatus.PENDING) {
      throw new BadRequestException('Investment cannot be cancelled');
    }

    // Cancel payment if it exists
    if (investment.paymentDetails.paymentId) {
      await this.paymentsService.cancelPayment(
        investment.paymentDetails.paymentId,
        userId
      );
    }

    // Update investment status
    await this.firebaseService.updateDocument(
      this.INVESTMENTS_COLLECTION,
      investmentId,
      {
        status: InvestmentStatus.CANCELLED,
        updatedAt: this.firebaseService.getTimestamp(),
      }
    );

    this.logger.log(`Investment cancelled: ${investmentId}`);
  }

  /**
   * Validate investment limits
   */
  private validateInvestmentLimits(
    createInvestmentDto: CreateInvestmentDto,
    project: any
  ): void {
    if (
      createInvestmentDto.investmentAmount < project.financial.minimumInvestment
    ) {
      throw new BadRequestException(
        `Investment amount below minimum: ${project.financial.minimumInvestment}`
      );
    }

    if (
      createInvestmentDto.investmentAmount > project.financial.maximumInvestment
    ) {
      throw new BadRequestException(
        `Investment amount above maximum: ${project.financial.maximumInvestment}`
      );
    }

    if (createInvestmentDto.tokenAmount < 1) {
      throw new BadRequestException('Must purchase at least 1 token');
    }
  }

  /**
   * Update project offering statistics
   */
  private async updateProjectOfferingStats(
    projectId: string,
    tokenAmount: number,
    investmentAmount: number
  ): Promise<void> {
    const project = await this.projectsService.findProjectById(projectId);
    if (!project) {
      return;
    }

    const newSoldTokens = project.offering.soldTokens + tokenAmount;
    const newRaisedAmount = project.offering.raisedAmount + investmentAmount;

    // Check if offering is completed
    let offeringStatus = project.offering.status;
    if (newSoldTokens >= project.financial.totalTokens) {
      offeringStatus = OfferingStatus.COMPLETED;
    }

    await this.firebaseService.updateDocument('projects', projectId, {
      'offering.soldTokens': newSoldTokens,
      'offering.raisedAmount': newRaisedAmount,
      'offering.status': offeringStatus,
      updatedAt: this.firebaseService.getTimestamp(),
    });

    this.logger.log(
      `Project offering stats updated: ${projectId} - Sold: ${newSoldTokens}, Raised: ${newRaisedAmount}`
    );
  }

  /**
   * Get user by ID
   */
  private async getUserById(userId: string): Promise<any> {
    const doc = await this.firebaseService.getDocument('users', userId);

    if (!doc.exists) {
      throw new NotFoundException('User not found');
    }

    return doc.data();
  }
}
