import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProfitsService } from './profits.service';
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
  Project,
  Investment,
  ProjectStatus,
  InvestmentStatus,
  ProjectCategory,
  OfferingStatus,
} from '../../common/types';
import { PaymentType, PaymentMethod } from '../payments/dto';

describe('ProfitsService', () => {
  let service: ProfitsService;
  let firebaseService: jest.Mocked<FirebaseService>;
  let projectsService: jest.Mocked<ProjectsService>;
  let investmentsService: jest.Mocked<InvestmentsService>;
  let paymentsService: jest.Mocked<PaymentsService>;
  let realtimeService: jest.Mocked<RealtimeService>;

  const mockTimestamp = {
    seconds: Math.floor(Date.now() / 1000),
    nanoseconds: 0,
    toDate: () => new Date(),
    toMillis: () => Date.now(),
    isEqual: jest.fn(() => true),
  } as any;

  const mockProject: Project = {
    id: 'project-123',
    spvId: 'spv-123',
    name: 'Test Project',
    description: 'Test Description',
    category: ProjectCategory.TRANSPORTATION,
    location: {
      province: 'Jakarta',
      city: 'Jakarta',
      coordinates: {
        latitude: -6.2,
        longitude: 106.8,
      },
    },
    financial: {
      totalValue: 1000000,
      tokenPrice: 100,
      totalTokens: 10000,
      minimumInvestment: 1000,
      maximumInvestment: 100000,
    },
    tokenization: {
      contractAddress: '0x123',
      tokenSymbol: 'TEST',
      tokenName: 'Test Token',
      decimals: 18,
    },
    offering: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      status: OfferingStatus.ACTIVE,
      soldTokens: 5000,
      raisedAmount: 500000,
    },
    concession: {
      startDate: new Date('2025-01-01'),
      endDate: new Date('2050-01-01'),
      duration: 25,
    },
    expectedAnnualReturn: 8.5,
    riskLevel: 3,
    documents: [],
    status: ProjectStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockInvestment: Investment = {
    id: 'investment-123',
    userId: 'user-123',
    projectId: 'project-123',
    tokenAmount: 100,
    investmentAmount: 10000,
    purchasePrice: 100,
    transactionHash: '0x456',
    status: InvestmentStatus.COMPLETED,
    paymentDetails: {
      paymentId: 'payment-123',
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      processedAt: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDistribution: ProfitDistribution = {
    id: 'dist-123',
    projectId: 'project-123',
    period: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      quarter: 1,
      year: 2024,
    },
    totalProfit: 100000,
    platformFee: 5000,
    distributedProfit: 95000,
    profitPerToken: 19,
    status: ProfitDistributionStatus.CALCULATED,
    transactionHash: '',
    createdAt: new Date(),
    distributedAt: new Date(),
    adminId: 'admin-123',
    notes: 'Q1 2024 distribution',
  };

  const mockClaim: ProfitClaim = {
    id: 'claim-123',
    userId: 'user-123',
    projectId: 'project-123',
    distributionId: 'dist-123',
    tokenAmount: 100,
    claimableAmount: 1900,
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

  const mockFirebaseDoc = {
    exists: true,
    data: () => mockDistribution,
    ref: {} as any,
    id: 'dist-123',
    readTime: mockTimestamp,
    get: jest.fn(),
    isEqual: jest.fn(),
    createTime: mockTimestamp,
    updateTime: mockTimestamp,
  } as any;

  // const mockFirebaseDocNotFound = {
  //   exists: false,
  //   data: () => null,
  //   ref: {} as any,
  //   id: 'dist-123',
  //   readTime: mockTimestamp,
  //   get: jest.fn(),
  //   isEqual: jest.fn(),
  //   createTime: mockTimestamp,
  //   updateTime: mockTimestamp,
  // } as any;

  const mockFirebaseQueryDoc = {
    exists: true,
    data: () => mockDistribution,
    ref: {} as any,
    id: 'dist-123',
    readTime: mockTimestamp,
    get: jest.fn(),
    isEqual: jest.fn(),
    createTime: mockTimestamp,
    updateTime: mockTimestamp,
  } as any;

  const mockFirebaseQuerySnapshot = {
    docs: [mockFirebaseQueryDoc],
    empty: false,
    size: 1,
    readTime: mockTimestamp,
    query: {} as any,
    docChanges: jest.fn(),
    forEach: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfitsService,
        {
          provide: FirebaseService,
          useValue: {
            getDocument: jest.fn(),
            setDocument: jest.fn(),
            updateDocument: jest.fn(),
            deleteDocument: jest.fn(),
            getDocumentsByField: jest.fn(),
            getDocuments: jest.fn(),
            getTimestamp: jest.fn(() => new Date()),
          },
        },
        {
          provide: ProjectsService,
          useValue: {
            findProjectById: jest.fn(),
          },
        },
        {
          provide: InvestmentsService,
          useValue: {
            getProjectInvestments: jest.fn(),
          },
        },
        {
          provide: PaymentsService,
          useValue: {
            initiatePayment: jest.fn(),
          },
        },
        {
          provide: RealtimeService,
          useValue: {
            broadcastProfitDistribution: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProfitsService>(ProfitsService);
    firebaseService = module.get(FirebaseService);
    projectsService = module.get(ProjectsService);
    investmentsService = module.get(InvestmentsService);
    paymentsService = module.get(PaymentsService);
    realtimeService = module.get(RealtimeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('distributeProfits', () => {
    const distributeProfitsDto: DistributeProfitsDto = {
      projectId: 'project-123',
      totalProfit: 100000,
      periodStartDate: '2024-01-01',
      periodEndDate: '2024-03-31',
      quarter: 1,
      year: 2024,
      notes: 'Q1 2024 distribution',
    };

    it('should distribute profits successfully', async () => {
      const adminId = 'admin-123';

      projectsService.findProjectById.mockResolvedValue(mockProject);
      firebaseService.getDocuments.mockResolvedValue({
        docs: [],
        empty: true,
        size: 0,
        readTime: mockTimestamp,
        query: {} as any,
        docChanges: jest.fn(),
        forEach: jest.fn(),
      } as any);
      investmentsService.getProjectInvestments.mockResolvedValue([
        mockInvestment,
      ]);
      firebaseService.setDocument.mockResolvedValue({} as any);
      firebaseService.updateDocument.mockResolvedValue({} as any);

      const result = await service.distributeProfits(
        distributeProfitsDto,
        adminId
      );

      expect(result).toMatchObject({
        projectId: distributeProfitsDto.projectId,
        totalProfit: distributeProfitsDto.totalProfit,
        platformFee: 5000, // 5% of 100000
        distributedProfit: 95000, // 95000 after platform fee
        profitPerToken: 950, // 95000 / 100 tokens
        status: ProfitDistributionStatus.CALCULATED,
        adminId,
        notes: distributeProfitsDto.notes,
      });
      expect(firebaseService.setDocument).toHaveBeenCalledWith(
        'profit_distributions',
        expect.any(String),
        expect.objectContaining({
          projectId: distributeProfitsDto.projectId,
          totalProfit: distributeProfitsDto.totalProfit,
        })
      );
    });

    it('should throw NotFoundException when project not found', async () => {
      const adminId = 'admin-123';

      projectsService.findProjectById.mockResolvedValue(null);

      await expect(
        service.distributeProfits(distributeProfitsDto, adminId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when distribution already exists', async () => {
      const adminId = 'admin-123';

      projectsService.findProjectById.mockResolvedValue(mockProject);
      firebaseService.getDocuments.mockResolvedValue(mockFirebaseQuerySnapshot);

      await expect(
        service.distributeProfits(distributeProfitsDto, adminId)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when no circulating tokens', async () => {
      const adminId = 'admin-123';

      projectsService.findProjectById.mockResolvedValue(mockProject);
      firebaseService.getDocuments.mockResolvedValue({
        docs: [],
        empty: true,
        size: 0,
        readTime: mockTimestamp,
        query: {} as any,
        docChanges: jest.fn(),
        forEach: jest.fn(),
      } as any);
      investmentsService.getProjectInvestments.mockResolvedValue([]);

      await expect(
        service.distributeProfits(distributeProfitsDto, adminId)
      ).rejects.toThrow(BadRequestException);
    });

    it('should broadcast profit distribution to investors', async () => {
      const adminId = 'admin-123';

      projectsService.findProjectById.mockResolvedValue(mockProject);
      firebaseService.getDocuments.mockResolvedValue({
        docs: [],
        empty: true,
        size: 0,
        readTime: mockTimestamp,
        query: {} as any,
        docChanges: jest.fn(),
        forEach: jest.fn(),
      } as any);
      investmentsService.getProjectInvestments.mockResolvedValue([
        mockInvestment,
      ]);
      firebaseService.setDocument.mockResolvedValue({} as any);
      firebaseService.updateDocument.mockResolvedValue({} as any);

      await service.distributeProfits(distributeProfitsDto, adminId);

      expect(realtimeService.broadcastProfitDistribution).toHaveBeenCalledWith(
        mockInvestment.userId,
        expect.objectContaining({
          type: 'distribution_created',
          projectId: distributeProfitsDto.projectId,
        }),
        distributeProfitsDto.projectId
      );
    });
  });

  describe('claimProfits', () => {
    const claimProfitsDto: ClaimProfitsDto = {
      distributionId: 'dist-123',
      bankAccountNumber: '1234567890',
    };

    it('should claim profits successfully', async () => {
      const userId = 'user-123';
      const claimId = `${claimProfitsDto.distributionId}_${userId}`;

      firebaseService.getDocument.mockResolvedValue({
        exists: true,
        data: () => mockClaim,
        ref: {} as any,
        id: claimId,
        readTime: mockTimestamp,
        get: jest.fn(),
        isEqual: jest.fn(),
        createTime: mockTimestamp,
        updateTime: mockTimestamp,
      });
      paymentsService.initiatePayment.mockResolvedValue({
        paymentId: 'payment-123',
        orderId: 'order-123',
        paymentUrl: 'https://mock-payment.com/payment-123',
        status: 'processing',
      });
      firebaseService.updateDocument.mockResolvedValue({} as any);

      const result = await service.claimProfits(claimProfitsDto, userId);

      expect(result).toMatchObject({
        ...mockClaim,
        status: ProfitClaimStatus.PROCESSING,
        paymentDetails: expect.objectContaining({
          paymentId: 'payment-123',
          bankAccount: claimProfitsDto.bankAccountNumber,
        }),
      });
      expect(paymentsService.initiatePayment).toHaveBeenCalledWith({
        userId,
        projectId: mockClaim.projectId,
        investmentId: claimId,
        amount: mockClaim.claimableAmount,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentType: PaymentType.PROFIT_CLAIM,
        email: '',
        phoneNumber: '',
        fullName: '',
        description: `Profit claim for distribution ${claimProfitsDto.distributionId}`,
      });
    });

    it('should throw NotFoundException when claim not found', async () => {
      const userId = 'user-123';

      firebaseService.getDocument.mockResolvedValue({
        exists: false,
        ref: {} as any,
        id: 'non-existent',
        readTime: mockTimestamp,
        data: () => undefined,
        get: jest.fn(),
        isEqual: jest.fn(),
        createTime: mockTimestamp,
        updateTime: mockTimestamp,
      });

      await expect(
        service.claimProfits(claimProfitsDto, userId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when unauthorized user', async () => {
      const userId = 'different-user';
      const claimId = `${claimProfitsDto.distributionId}_${userId}`;

      firebaseService.getDocument.mockResolvedValue({
        exists: true,
        data: () => mockClaim,
        ref: {} as any,
        id: claimId,
        readTime: mockTimestamp,
        get: jest.fn(),
        isEqual: jest.fn(),
        createTime: mockTimestamp,
        updateTime: mockTimestamp,
      });

      await expect(
        service.claimProfits(claimProfitsDto, userId)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when claim not pending', async () => {
      const userId = 'user-123';
      const processedClaim = {
        ...mockClaim,
        status: ProfitClaimStatus.COMPLETED,
      };

      firebaseService.getDocument.mockResolvedValue({
        exists: true,
        data: () => processedClaim,
        ref: {} as any,
        id: 'claim-123',
        readTime: mockTimestamp,
        get: jest.fn(),
        isEqual: jest.fn(),
        createTime: mockTimestamp,
        updateTime: mockTimestamp,
      });

      await expect(
        service.claimProfits(claimProfitsDto, userId)
      ).rejects.toThrow(BadRequestException);
    });

    it('should broadcast profit claim processing', async () => {
      const userId = 'user-123';

      firebaseService.getDocument.mockResolvedValue({
        exists: true,
        data: () => mockClaim,
        ref: {} as any,
        id: 'claim-123',
        readTime: mockTimestamp,
        get: jest.fn(),
        isEqual: jest.fn(),
        createTime: mockTimestamp,
        updateTime: mockTimestamp,
      });
      paymentsService.initiatePayment.mockResolvedValue({
        paymentId: 'payment-123',
        orderId: 'order-123',
        paymentUrl: 'https://mock-payment.com/payment-123',
        status: 'processing',
      });
      firebaseService.updateDocument.mockResolvedValue({} as any);

      await service.claimProfits(claimProfitsDto, userId);

      expect(realtimeService.broadcastProfitDistribution).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          type: 'claim_processing',
          distributionId: claimProfitsDto.distributionId,
          amount: mockClaim.claimableAmount,
          status: ProfitClaimStatus.PROCESSING,
        }),
        mockClaim.projectId
      );
    });

    it('should revert claim status on payment failure', async () => {
      const userId = 'user-123';

      firebaseService.getDocument.mockResolvedValue({
        exists: true,
        data: () => mockClaim,
        ref: {} as any,
        id: 'claim-123',
        readTime: mockTimestamp,
        get: jest.fn(),
        isEqual: jest.fn(),
        createTime: mockTimestamp,
        updateTime: mockTimestamp,
      });
      paymentsService.initiatePayment.mockRejectedValue(
        new Error('Payment failed')
      );
      firebaseService.updateDocument.mockResolvedValue({} as any);

      await expect(
        service.claimProfits(claimProfitsDto, userId)
      ).rejects.toThrow(BadRequestException);
      expect(firebaseService.updateDocument).toHaveBeenCalledWith(
        'profit_claims',
        expect.any(String),
        expect.objectContaining({
          status: ProfitClaimStatus.PENDING,
        })
      );
    });
  });

  describe('processSuccessfulClaimPayment', () => {
    it('should process successful claim payment', async () => {
      const claimId = 'claim-123';

      firebaseService.getDocument.mockResolvedValue({
        exists: true,
        data: () => ({
          ...mockClaim,
          status: ProfitClaimStatus.PROCESSING,
        }),
        ref: {} as any,
        id: claimId,
        readTime: mockTimestamp,
        get: jest.fn(),
        isEqual: jest.fn(),
        createTime: mockTimestamp,
        updateTime: mockTimestamp,
      });
      firebaseService.updateDocument.mockResolvedValue({} as any);

      await service.processSuccessfulClaimPayment(claimId);

      expect(firebaseService.updateDocument).toHaveBeenCalledWith(
        'profit_claims',
        claimId,
        expect.objectContaining({
          status: ProfitClaimStatus.COMPLETED,
          claimedAmount: mockClaim.claimableAmount,
        })
      );
      expect(realtimeService.broadcastProfitDistribution).toHaveBeenCalledWith(
        mockClaim.userId,
        expect.objectContaining({
          type: 'claim_completed',
          status: ProfitClaimStatus.COMPLETED,
        }),
        mockClaim.projectId
      );
    });

    it('should throw NotFoundException when claim not found', async () => {
      const claimId = 'claim-123';

      firebaseService.getDocument.mockResolvedValue({
        exists: false,
        ref: {} as any,
        id: 'non-existent',
        readTime: mockTimestamp,
        data: () => undefined,
        get: jest.fn(),
        isEqual: jest.fn(),
        createTime: mockTimestamp,
        updateTime: mockTimestamp,
      });

      await expect(
        service.processSuccessfulClaimPayment(claimId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle claim not in processing status', async () => {
      const claimId = 'claim-123';

      firebaseService.getDocument.mockResolvedValue({
        exists: true,
        data: () => mockClaim, // Status is PENDING
      } as any);

      await service.processSuccessfulClaimPayment(claimId);

      expect(firebaseService.updateDocument).not.toHaveBeenCalled();
    });
  });

  describe('getProjectDistributions', () => {
    it('should return project distributions', async () => {
      const projectId = 'project-123';

      firebaseService.getDocumentsByField.mockResolvedValue(
        mockFirebaseQuerySnapshot
      );

      const result = await service.getProjectDistributions(projectId);

      expect(result).toEqual([mockDistribution]);
      expect(firebaseService.getDocumentsByField).toHaveBeenCalledWith(
        'profit_distributions',
        'projectId',
        projectId
      );
    });
  });

  describe('getUserProfitClaims', () => {
    it('should return user profit claims', async () => {
      const userId = 'user-123';

      firebaseService.getDocumentsByField.mockResolvedValue({
        docs: [
          {
            exists: true,
            data: () => mockClaim,
            ref: {} as any,
            id: 'claim-123',
            readTime: mockTimestamp,
            get: jest.fn(),
            isEqual: jest.fn(),
            createTime: mockTimestamp,
            updateTime: mockTimestamp,
          },
        ],
        empty: false,
        size: 1,
        readTime: mockTimestamp,
        query: {} as any,
        docChanges: jest.fn(),
        forEach: jest.fn(),
        isEqual: jest.fn(),
      });

      const result = await service.getUserProfitClaims(userId);

      expect(result).toEqual([mockClaim]);
      expect(firebaseService.getDocumentsByField).toHaveBeenCalledWith(
        'profit_claims',
        'userId',
        userId
      );
    });
  });

  describe('getUserClaimableProfits', () => {
    it('should return user claimable profits', async () => {
      const userId = 'user-123';

      firebaseService.getDocumentsByField.mockResolvedValue({
        docs: [
          {
            exists: true,
            data: () => mockClaim,
            ref: {} as any,
            id: 'claim-123',
            readTime: mockTimestamp,
            get: jest.fn(),
            isEqual: jest.fn(),
            createTime: mockTimestamp,
            updateTime: mockTimestamp,
          },
        ],
        empty: false,
        size: 1,
        readTime: mockTimestamp,
        query: {} as any,
        docChanges: jest.fn(),
        forEach: jest.fn(),
        isEqual: jest.fn(),
      });

      const result = await service.getUserClaimableProfits(userId);

      expect(result).toEqual([mockClaim]);
    });

    it('should filter only pending claims', async () => {
      const userId = 'user-123';
      const completedClaim = {
        ...mockClaim,
        status: ProfitClaimStatus.COMPLETED,
      };

      firebaseService.getDocumentsByField.mockResolvedValue({
        docs: [
          {
            exists: true,
            data: () => mockClaim,
            ref: {} as any,
            id: 'claim-123',
            readTime: mockTimestamp,
            get: jest.fn(),
            isEqual: jest.fn(),
            createTime: mockTimestamp,
            updateTime: mockTimestamp,
          },
          {
            exists: true,
            data: () => completedClaim,
            ref: {} as any,
            id: 'claim-456',
            readTime: mockTimestamp,
            get: jest.fn(),
            isEqual: jest.fn(),
            createTime: mockTimestamp,
            updateTime: mockTimestamp,
          },
        ],
        empty: false,
        size: 2,
        readTime: mockTimestamp,
        query: {} as any,
        docChanges: jest.fn(),
        forEach: jest.fn(),
        isEqual: jest.fn(),
      });

      const result = await service.getUserClaimableProfits(userId);

      expect(result).toEqual([mockClaim]);
      expect(result).toHaveLength(1);
    });
  });

  describe('getDistributionById', () => {
    it('should return distribution when found', async () => {
      const distributionId = 'dist-123';

      firebaseService.getDocument.mockResolvedValue(mockFirebaseDoc);

      const result = await service.getDistributionById(distributionId);

      expect(result).toEqual(mockDistribution);
      expect(firebaseService.getDocument).toHaveBeenCalledWith(
        'profit_distributions',
        distributionId
      );
    });

    it('should return null when distribution not found', async () => {
      const distributionId = 'dist-123';

      firebaseService.getDocument.mockResolvedValue({
        exists: false,
        ref: {} as any,
        id: 'non-existent',
        readTime: mockTimestamp,
        data: () => undefined,
        get: jest.fn(),
        isEqual: jest.fn(),
        createTime: mockTimestamp,
        updateTime: mockTimestamp,
      });

      const result = await service.getDistributionById(distributionId);

      expect(result).toBeNull();
    });
  });

  describe('getAllDistributions', () => {
    it('should return all distributions with default parameters', async () => {
      firebaseService.getDocuments.mockResolvedValue(mockFirebaseQuerySnapshot);

      const result = await service.getAllDistributions();

      expect(result).toEqual([mockDistribution]);
      expect(firebaseService.getDocuments).toHaveBeenCalledWith(
        'profit_distributions',
        expect.any(Function)
      );
    });

    it('should return distributions with status filter', async () => {
      const status = ProfitDistributionStatus.DISTRIBUTED;

      firebaseService.getDocuments.mockResolvedValue(mockFirebaseQuerySnapshot);

      const result = await service.getAllDistributions(status, 50);

      expect(result).toEqual([mockDistribution]);
      expect(firebaseService.getDocuments).toHaveBeenCalledWith(
        'profit_distributions',
        expect.any(Function)
      );
    });

    it('should return distributions with pagination', async () => {
      firebaseService.getDocuments.mockResolvedValue(mockFirebaseQuerySnapshot);

      const result = await service.getAllDistributions(
        undefined,
        25,
        'start-after'
      );

      expect(result).toEqual([mockDistribution]);
      expect(firebaseService.getDocuments).toHaveBeenCalledWith(
        'profit_distributions',
        expect.any(Function)
      );
    });
  });

  describe('error handling', () => {
    it('should handle Firebase errors gracefully', async () => {
      const distributeProfitsDto: DistributeProfitsDto = {
        projectId: 'project-123',
        totalProfit: 100000,
        periodStartDate: '2024-01-01',
        periodEndDate: '2024-03-31',
        quarter: 1,
        year: 2024,
        notes: 'Test',
      };
      const adminId = 'admin-123';

      projectsService.findProjectById.mockResolvedValue(mockProject);
      firebaseService.getDocuments.mockRejectedValue(
        new Error('Firebase error')
      );

      await expect(
        service.distributeProfits(distributeProfitsDto, adminId)
      ).rejects.toThrow();
    });

    it('should handle payment service errors gracefully', async () => {
      const claimProfitsDto: ClaimProfitsDto = {
        distributionId: 'dist-123',
        bankAccountNumber: '1234567890',
      };
      const userId = 'user-123';

      firebaseService.getDocument.mockResolvedValue({
        exists: true,
        data: () => mockClaim,
      } as any);
      paymentsService.initiatePayment.mockRejectedValue(
        new Error('Payment service error')
      );
      firebaseService.updateDocument.mockResolvedValue({} as any);

      await expect(
        service.claimProfits(claimProfitsDto, userId)
      ).rejects.toThrow(BadRequestException);
    });
  });
});
