import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { FirebaseService } from '../../common/services/firebase.service';
import { ProjectsService } from '../projects/projects.service';
import { PaymentsService } from '../payments/payments.service';
import { RealtimeService } from '../realtime/realtime.service';
import { CreateInvestmentDto, InvestmentType } from './dto';
import {
  Investment,
  InvestmentStatus,
  KYCStatus,
  OfferingStatus,
  ProjectStatus,
  User,
  Project,
  UserRole,
} from '../../common/types';
import { PaymentType, PaymentMethod } from '../payments/dto';
import { ProjectCategory } from '../projects/dto';

describe('InvestmentsService', () => {
  let service: InvestmentsService;
  let firebaseService: FirebaseService;
  let projectsService: ProjectsService;
  let paymentsService: PaymentsService;

  // Mock data
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    walletAddress: '0x1234567890123456789012345678901234567890',
    web3AuthId: 'web3auth-test-id',
    role: UserRole.INVESTOR,
    profile: {
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '+1234567890',
      dateOfBirth: new Date('1990-01-01'),
      nationality: 'ID',
      address: {
        street: 'Test Street',
        city: 'Test City',
        province: 'Test Province',
        postalCode: '12345',
        country: 'Indonesia',
      },
    },
    kyc: {
      status: KYCStatus.APPROVED,
      provider: 'verihubs',
      verificationId: 'kyc-test-id',
      submittedAt: new Date(),
      approvedAt: new Date(),
      documents: [],
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProject: Project = {
    id: 'test-project-id',
    spvId: 'test-spv-id',
    name: 'Test Project',
    description: 'Test project description',
    category: ProjectCategory.TRANSPORTATION,
    location: {
      province: 'Test Province',
      city: 'Test City',
    },
    financial: {
      totalValue: 1000000000,
      tokenPrice: 100000,
      totalTokens: 10000,
      minimumInvestment: 1000000,
      maximumInvestment: 100000000,
    },
    tokenization: {
      contractAddress: '0x1234567890123456789012345678901234567890',
      tokenSymbol: 'TEST',
      tokenName: 'Test Token',
      decimals: 18,
    },
    offering: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      status: OfferingStatus.ACTIVE,
      soldTokens: 1000,
      raisedAmount: 100000000,
    },
    concession: {
      startDate: new Date('2025-01-01'),
      endDate: new Date('2030-12-31'),
      duration: 5,
    },
    expectedAnnualReturn: 10.0,
    riskLevel: 3,
    documents: [],
    status: ProjectStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockInvestment: Investment = {
    id: 'test-investment-id',
    userId: 'test-user-id',
    projectId: 'test-project-id',
    tokenAmount: 10,
    investmentAmount: 1000000,
    purchasePrice: 100000,
    transactionHash: '0xabcdef1234567890abcdef1234567890abcdef12',
    status: InvestmentStatus.PENDING,
    paymentDetails: {
      paymentId: 'test-payment-id',
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      processedAt: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFirebaseDocumentSnapshot = {
    exists: true,
    id: 'test-investment-id',
    data: () => mockInvestment,
  } as any;

  const mockCreateInvestmentDto: CreateInvestmentDto = {
    projectId: 'test-project-id',
    tokenAmount: 10,
    investmentAmount: 1000000,
    investmentType: InvestmentType.PRIMARY,
    email: 'test@example.com',
    phoneNumber: '+1234567890',
    fullName: 'Test User',
  };

  const mockPaymentResult = {
    paymentId: 'test-payment-id',
    orderId: 'test-order-id',
    paymentUrl: 'https://payment.example.com/test-payment-id',
    status: 'pending',
  };

  const mockFirebaseQuerySnapshot = {
    docs: [mockFirebaseDocumentSnapshot],
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestmentsService,
        {
          provide: FirebaseService,
          useValue: {
            setDocument: jest.fn(),
            getDocument: jest.fn(),
            updateDocument: jest.fn(),
            getDocumentsByField: jest.fn(),
            getDocuments: jest.fn(),
            getTimestamp: jest.fn(),
          },
        },
        {
          provide: ProjectsService,
          useValue: {
            findProjectById: jest.fn(),
          },
        },
        {
          provide: PaymentsService,
          useValue: {
            initiatePayment: jest.fn(),
            cancelPayment: jest.fn(),
          },
        },
        {
          provide: RealtimeService,
          useValue: {
            broadcastPortfolioUpdate: jest.fn(),
            broadcastProjectUpdate: jest.fn(),
            broadcastGovernanceUpdate: jest.fn(),
            broadcastProfitDistributionUpdate: jest.fn(),
            broadcastKYCStatusUpdate: jest.fn(),
            broadcastSystemUpdate: jest.fn(),
            broadcastNotificationUpdate: jest.fn(),
            broadcastGeneralUpdate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InvestmentsService>(InvestmentsService);
    firebaseService = module.get<FirebaseService>(FirebaseService);
    projectsService = module.get<ProjectsService>(ProjectsService);
    paymentsService = module.get<PaymentsService>(PaymentsService);

    // Default mock implementations
    jest
      .spyOn(firebaseService, 'getTimestamp')
      .mockReturnValue(new Date() as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createInvestment', () => {
    it('should create investment successfully', async () => {
      // Arrange
      jest.spyOn(firebaseService, 'getDocument').mockResolvedValue({
        exists: true,
        id: 'test-user-id',
        data: () => mockUser,
      } as any);
      jest
        .spyOn(projectsService, 'findProjectById')
        .mockResolvedValue(mockProject);
      jest
        .spyOn(paymentsService, 'initiatePayment')
        .mockResolvedValue(mockPaymentResult);
      jest.spyOn(firebaseService, 'setDocument').mockResolvedValue(undefined);
      jest
        .spyOn(firebaseService, 'updateDocument')
        .mockResolvedValue(undefined);

      const logSpy = jest.spyOn(Logger.prototype, 'log');

      // Act
      const result = await service.createInvestment(
        mockCreateInvestmentDto,
        'test-user-id'
      );

      // Assert
      expect(result).toEqual({
        investment: expect.objectContaining({
          userId: 'test-user-id',
          projectId: 'test-project-id',
          tokenAmount: 10,
          investmentAmount: 1000000,
          purchasePrice: 100000,
          status: InvestmentStatus.PENDING,
          paymentDetails: expect.objectContaining({
            paymentId: 'test-payment-id',
            paymentMethod: PaymentMethod.BANK_TRANSFER,
          }),
        }),
        paymentUrl: 'https://payment.example.com/test-payment-id',
      });

      expect(firebaseService.setDocument).toHaveBeenCalledWith(
        'investments',
        expect.stringMatching(/^inv_\d+_/),
        expect.objectContaining({
          userId: 'test-user-id',
          projectId: 'test-project-id',
        })
      );

      expect(paymentsService.initiatePayment).toHaveBeenCalledWith({
        userId: 'test-user-id',
        projectId: 'test-project-id',
        investmentId: expect.stringMatching(/^inv_\d+_/),
        amount: 1000000,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentType: PaymentType.INVESTMENT,
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        fullName: 'Test User',
        description: 'Investment in Test Project',
      });

      expect(logSpy).toHaveBeenCalledWith(
        'Creating investment for user: test-user-id, project: test-project-id'
      );
    });

    it('should throw BadRequestException when user KYC is not approved', async () => {
      // Arrange
      const userWithPendingKYC = {
        ...mockUser,
        kyc: { ...mockUser.kyc, status: KYCStatus.PENDING },
      };
      jest.spyOn(firebaseService, 'getDocument').mockResolvedValue({
        exists: true,
        id: 'test-user-id',
        data: () => userWithPendingKYC,
      } as any);

      // Act & Assert
      await expect(
        service.createInvestment(mockCreateInvestmentDto, 'test-user-id')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when project not found', async () => {
      // Arrange
      jest.spyOn(firebaseService, 'getDocument').mockResolvedValue({
        exists: true,
        id: 'test-user-id',
        data: () => mockUser,
      } as any);
      jest.spyOn(projectsService, 'findProjectById').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createInvestment(mockCreateInvestmentDto, 'test-user-id')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when project is not active', async () => {
      // Arrange
      jest.spyOn(firebaseService, 'getDocument').mockResolvedValue({
        exists: true,
        id: 'test-user-id',
        data: () => mockUser,
      } as any);
      const inactiveProject = {
        ...mockProject,
        status: ProjectStatus.DRAFT,
      };
      jest
        .spyOn(projectsService, 'findProjectById')
        .mockResolvedValue(inactiveProject);

      // Act & Assert
      await expect(
        service.createInvestment(mockCreateInvestmentDto, 'test-user-id')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when offering is not active', async () => {
      // Arrange
      jest.spyOn(firebaseService, 'getDocument').mockResolvedValue({
        exists: true,
        id: 'test-user-id',
        data: () => mockUser,
      } as any);
      const projectWithCompletedOffering = {
        ...mockProject,
        offering: { ...mockProject.offering, status: OfferingStatus.COMPLETED },
      };
      jest
        .spyOn(projectsService, 'findProjectById')
        .mockResolvedValue(projectWithCompletedOffering);

      // Act & Assert
      await expect(
        service.createInvestment(mockCreateInvestmentDto, 'test-user-id')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when investment amount is below minimum', async () => {
      // Arrange
      jest.spyOn(firebaseService, 'getDocument').mockResolvedValue({
        exists: true,
        id: 'test-user-id',
        data: () => mockUser,
      } as any);
      jest
        .spyOn(projectsService, 'findProjectById')
        .mockResolvedValue(mockProject);

      const belowMinimumDto = {
        ...mockCreateInvestmentDto,
        investmentAmount: 500000, // Below minimum of 1,000,000
      };

      // Act & Assert
      await expect(
        service.createInvestment(belowMinimumDto, 'test-user-id')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when investment amount is above maximum', async () => {
      // Arrange
      jest.spyOn(firebaseService, 'getDocument').mockResolvedValue({
        exists: true,
        id: 'test-user-id',
        data: () => mockUser,
      } as any);
      jest
        .spyOn(projectsService, 'findProjectById')
        .mockResolvedValue(mockProject);

      const aboveMaximumDto = {
        ...mockCreateInvestmentDto,
        investmentAmount: 200000000, // Above maximum of 100,000,000
      };

      // Act & Assert
      await expect(
        service.createInvestment(aboveMaximumDto, 'test-user-id')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when not enough tokens available', async () => {
      // Arrange
      jest.spyOn(firebaseService, 'getDocument').mockResolvedValue({
        exists: true,
        id: 'test-user-id',
        data: () => mockUser,
      } as any);
      const projectWithLimitedTokens = {
        ...mockProject,
        offering: { ...mockProject.offering, soldTokens: 9999 }, // Only 1 token remaining
      };
      jest
        .spyOn(projectsService, 'findProjectById')
        .mockResolvedValue(projectWithLimitedTokens);

      const tooManyTokensDto = {
        ...mockCreateInvestmentDto,
        tokenAmount: 10, // Requesting 10 tokens when only 1 available
      };

      // Act & Assert
      await expect(
        service.createInvestment(tooManyTokensDto, 'test-user-id')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when investment amount doesnt match token price', async () => {
      // Arrange
      jest.spyOn(firebaseService, 'getDocument').mockResolvedValue({
        exists: true,
        id: 'test-user-id',
        data: () => mockUser,
      } as any);
      jest
        .spyOn(projectsService, 'findProjectById')
        .mockResolvedValue(mockProject);

      const wrongAmountDto = {
        ...mockCreateInvestmentDto,
        investmentAmount: 2000000, // Expected: 10 * 100,000 = 1,000,000
      };

      // Act & Assert
      await expect(
        service.createInvestment(wrongAmountDto, 'test-user-id')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('processSuccessfulPayment', () => {
    it('should process successful payment', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocument')
        .mockResolvedValue(mockFirebaseDocumentSnapshot);
      jest
        .spyOn(firebaseService, 'updateDocument')
        .mockResolvedValue(undefined);
      jest
        .spyOn(projectsService, 'findProjectById')
        .mockResolvedValue(mockProject);

      const logSpy = jest.spyOn(Logger.prototype, 'log');

      // Act
      await service.processSuccessfulPayment('test-investment-id');

      // Assert
      expect(firebaseService.updateDocument).toHaveBeenCalledWith(
        'investments',
        'test-investment-id',
        expect.objectContaining({
          status: InvestmentStatus.COMPLETED,
          transactionHash: expect.stringMatching(/^0x[a-f0-9]+$/),
        })
      );

      expect(firebaseService.updateDocument).toHaveBeenCalledWith(
        'projects',
        'test-project-id',
        expect.objectContaining({
          'offering.soldTokens': 1010, // 1000 + 10
          'offering.raisedAmount': 101000000, // 100000000 + 1000000
        })
      );

      expect(logSpy).toHaveBeenCalledWith(
        'Investment completed successfully: test-investment-id'
      );
    });

    it('should throw NotFoundException when investment not found', async () => {
      // Arrange
      jest.spyOn(firebaseService, 'getDocument').mockResolvedValue({
        exists: false,
        id: 'test-investment-id',
        data: () => null,
      } as any);

      // Act & Assert
      await expect(
        service.processSuccessfulPayment('test-investment-id')
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle investment not in pending status', async () => {
      // Arrange
      const completedInvestment = {
        ...mockInvestment,
        status: InvestmentStatus.COMPLETED,
      };
      jest.spyOn(firebaseService, 'getDocument').mockResolvedValue({
        exists: true,
        id: 'test-investment-id',
        data: () => completedInvestment,
      } as any);

      const warnSpy = jest.spyOn(Logger.prototype, 'warn');

      // Act
      await service.processSuccessfulPayment('test-investment-id');

      // Assert
      expect(warnSpy).toHaveBeenCalledWith(
        'Investment test-investment-id is not in pending status: completed'
      );
    });

    it('should update offering status to completed when tokens are sold out', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocument')
        .mockResolvedValue(mockFirebaseDocumentSnapshot);
      jest
        .spyOn(firebaseService, 'updateDocument')
        .mockResolvedValue(undefined);

      const projectAlmostSoldOut = {
        ...mockProject,
        offering: { ...mockProject.offering, soldTokens: 9995 }, // 5 tokens remaining
      };
      const largeInvestment = {
        ...mockInvestment,
        tokenAmount: 10, // More than remaining tokens
      };

      jest
        .spyOn(projectsService, 'findProjectById')
        .mockResolvedValue(projectAlmostSoldOut);
      jest.spyOn(firebaseService, 'getDocument').mockResolvedValue({
        exists: true,
        id: 'test-investment-id',
        data: () => largeInvestment,
      } as any);

      // Act
      await service.processSuccessfulPayment('test-investment-id');

      // Assert
      expect(firebaseService.updateDocument).toHaveBeenCalledWith(
        'projects',
        'test-project-id',
        expect.objectContaining({
          'offering.status': OfferingStatus.COMPLETED,
        })
      );
    });
  });

  describe('getInvestmentById', () => {
    it('should return investment when found', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocument')
        .mockResolvedValue(mockFirebaseDocumentSnapshot);

      // Act
      const result = await service.getInvestmentById('test-investment-id');

      // Assert
      expect(result).toEqual(mockInvestment);
    });

    it('should return null when investment not found', async () => {
      // Arrange
      jest.spyOn(firebaseService, 'getDocument').mockResolvedValue({
        exists: false,
        id: 'test-investment-id',
        data: () => null,
      } as any);

      // Act
      const result = await service.getInvestmentById('test-investment-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getUserInvestments', () => {
    it('should return user investments', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocumentsByField')
        .mockResolvedValue(mockFirebaseQuerySnapshot);

      // Act
      const result = await service.getUserInvestments('test-user-id');

      // Assert
      expect(result).toEqual([mockInvestment]);
      expect(firebaseService.getDocumentsByField).toHaveBeenCalledWith(
        'investments',
        'userId',
        'test-user-id'
      );
    });
  });

  describe('getUserPortfolio', () => {
    it('should return user portfolio with project details', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocumentsByField')
        .mockResolvedValue(mockFirebaseQuerySnapshot);
      jest
        .spyOn(projectsService, 'findProjectById')
        .mockResolvedValue(mockProject);

      // Act
      const result = await service.getUserPortfolio('test-user-id');

      // Assert
      expect(result).toEqual([
        {
          investment: mockInvestment,
          project: {
            id: 'test-project-id',
            name: 'Test Project',
            category: ProjectCategory.TRANSPORTATION,
            status: ProjectStatus.ACTIVE,
            tokenPrice: 100000,
            expectedAnnualReturn: 10.0,
            riskLevel: 3,
          },
        },
      ]);
    });

    it('should skip investments with missing projects', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocumentsByField')
        .mockResolvedValue(mockFirebaseQuerySnapshot);
      jest.spyOn(projectsService, 'findProjectById').mockResolvedValue(null);

      // Act
      const result = await service.getUserPortfolio('test-user-id');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getProjectInvestments', () => {
    it('should return project investments', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocumentsByField')
        .mockResolvedValue(mockFirebaseQuerySnapshot);

      // Act
      const result = await service.getProjectInvestments('test-project-id');

      // Assert
      expect(result).toEqual([mockInvestment]);
      expect(firebaseService.getDocumentsByField).toHaveBeenCalledWith(
        'investments',
        'projectId',
        'test-project-id'
      );
    });
  });

  describe('getAllInvestments', () => {
    it('should return all investments with default parameters', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocuments')
        .mockResolvedValue(mockFirebaseQuerySnapshot);

      // Act
      const result = await service.getAllInvestments();

      // Assert
      expect(result).toEqual([mockInvestment]);
      expect(firebaseService.getDocuments).toHaveBeenCalledWith(
        'investments',
        expect.any(Function)
      );
    });

    it('should return investments with status filter', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocuments')
        .mockResolvedValue(mockFirebaseQuerySnapshot);

      // Act
      const result = await service.getAllInvestments(
        InvestmentStatus.COMPLETED
      );

      // Assert
      expect(result).toEqual([mockInvestment]);
    });
  });

  describe('cancelInvestment', () => {
    it('should cancel investment successfully', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocument')
        .mockResolvedValue(mockFirebaseDocumentSnapshot);
      jest
        .spyOn(firebaseService, 'updateDocument')
        .mockResolvedValue(undefined);
      jest.spyOn(paymentsService, 'cancelPayment').mockResolvedValue(undefined);

      const logSpy = jest.spyOn(Logger.prototype, 'log');

      // Act
      await service.cancelInvestment('test-investment-id', 'test-user-id');

      // Assert
      expect(paymentsService.cancelPayment).toHaveBeenCalledWith(
        'test-payment-id',
        'test-user-id'
      );
      expect(firebaseService.updateDocument).toHaveBeenCalledWith(
        'investments',
        'test-investment-id',
        expect.objectContaining({
          status: InvestmentStatus.CANCELLED,
        })
      );
      expect(logSpy).toHaveBeenCalledWith(
        'Investment cancelled: test-investment-id'
      );
    });

    it('should throw NotFoundException when investment not found', async () => {
      // Arrange
      jest.spyOn(firebaseService, 'getDocument').mockResolvedValue({
        exists: false,
        id: 'test-investment-id',
        data: () => null,
      } as any);

      // Act & Assert
      await expect(
        service.cancelInvestment('test-investment-id', 'test-user-id')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when unauthorized', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocument')
        .mockResolvedValue(mockFirebaseDocumentSnapshot);

      // Act & Assert
      await expect(
        service.cancelInvestment('test-investment-id', 'wrong-user-id')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when investment cannot be cancelled', async () => {
      // Arrange
      const completedInvestment = {
        ...mockInvestment,
        status: InvestmentStatus.COMPLETED,
      };
      jest.spyOn(firebaseService, 'getDocument').mockResolvedValue({
        exists: true,
        id: 'test-investment-id',
        data: () => completedInvestment,
      } as any);

      // Act & Assert
      await expect(
        service.cancelInvestment('test-investment-id', 'test-user-id')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('error handling', () => {
    it('should handle Firebase errors gracefully', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocument')
        .mockRejectedValue(new Error('Firebase error'));

      // Act & Assert
      await expect(
        service.getInvestmentById('test-investment-id')
      ).rejects.toThrow('Firebase error');
    });

    it('should handle user not found error', async () => {
      // Arrange
      jest.spyOn(firebaseService, 'getDocument').mockResolvedValue({
        exists: false,
        id: 'test-user-id',
        data: () => null,
      } as any);

      // Act & Assert
      await expect(
        service.createInvestment(mockCreateInvestmentDto, 'test-user-id')
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle payment service errors', async () => {
      // Arrange
      jest.spyOn(firebaseService, 'getDocument').mockResolvedValue({
        exists: true,
        id: 'test-user-id',
        data: () => mockUser,
      } as any);
      jest
        .spyOn(projectsService, 'findProjectById')
        .mockResolvedValue(mockProject);
      jest.spyOn(firebaseService, 'setDocument').mockResolvedValue(undefined);
      jest
        .spyOn(paymentsService, 'initiatePayment')
        .mockRejectedValue(new Error('Payment error'));

      // Act & Assert
      await expect(
        service.createInvestment(mockCreateInvestmentDto, 'test-user-id')
      ).rejects.toThrow('Payment error');
    });
  });
});
