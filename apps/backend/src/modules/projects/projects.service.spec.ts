import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { FirebaseService } from '../../common/services/firebase.service';
import { CacheService } from '../../common/services/cache.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ApproveProjectDto,
  ProjectStatus,
  ApprovalAction,
  ProjectCategory,
} from './dto';
import { Project, OfferingStatus } from '../../common/types';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let firebaseService: FirebaseService;
  let cacheService: CacheService;

  // Mock data
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
      startDate: new Date('2025-08-01'),
      endDate: new Date('2025-12-31'),
      status: OfferingStatus.UPCOMING,
      soldTokens: 0,
      raisedAmount: 0,
    },
    concession: {
      startDate: new Date('2026-01-01'),
      endDate: new Date('2031-12-31'),
      duration: 6,
    },
    expectedAnnualReturn: 10.0,
    riskLevel: 3,
    documents: [],
    status: ProjectStatus.DRAFT,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreateProjectDto: CreateProjectDto = {
    name: 'Test Project',
    description: 'Test project description',
    category: ProjectCategory.TRANSPORTATION,
    province: 'Test Province',
    city: 'Test City',
    totalValue: 1000000000,
    tokenPrice: 100000,
    totalTokens: 10000,
    minimumInvestment: 1000000,
    maximumInvestment: 100000000,
    tokenSymbol: 'TEST',
    tokenName: 'Test Token',
    offeringStartDate: '2025-08-01',
    offeringEndDate: '2025-12-31',
    concessionStartDate: '2026-01-01',
    concessionEndDate: '2031-12-31',
    expectedAnnualReturn: 10.0,
    riskLevel: 3,
    documentUrls: ['https://example.com/doc1.pdf'],
    additionalDetails: 'Additional details about the project',
  };

  const mockFirebaseDocumentSnapshot = {
    exists: true,
    id: 'test-project-id',
    data: () => mockProject,
  } as any;

  const mockFirebaseQuerySnapshot = {
    docs: [mockFirebaseDocumentSnapshot],
  } as any;

  // const mockEmptyQuerySnapshot = {
  //   docs: [],
  // };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: FirebaseService,
          useValue: {
            setDocument: jest.fn(),
            getDocument: jest.fn(),
            updateDocument: jest.fn(),
            deleteDocument: jest.fn(),
            getDocuments: jest.fn(),
            getDocumentsByField: jest.fn(),
            getTimestamp: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
            deletePattern: jest.fn(),
            exists: jest.fn(),
            getTTL: jest.fn(),
            setTTL: jest.fn(),
            increment: jest.fn(),
            getOrSet: jest.fn(),
            isHealthy: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    firebaseService = module.get<FirebaseService>(FirebaseService);
    cacheService = module.get<CacheService>(CacheService);

    // Default mock implementations
    jest
      .spyOn(firebaseService, 'getTimestamp')
      .mockReturnValue(new Date() as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create project successfully', async () => {
      // Arrange
      jest.spyOn(firebaseService, 'setDocument').mockResolvedValue(undefined);
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      // Act
      const result = await service.createProject(
        mockCreateProjectDto,
        'test-spv-id'
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(mockCreateProjectDto.name);
      expect(result.spvId).toBe('test-spv-id');
      expect(result.status).toBe(ProjectStatus.DRAFT);
      expect(result.offering.status).toBe(OfferingStatus.UPCOMING);
      expect(result.tokenization.decimals).toBe(18);
      expect(result.tokenization.contractAddress).toBe('');
      expect(result.documents).toHaveLength(1);
      expect(result.concession.duration).toBe(6);

      expect(firebaseService.setDocument).toHaveBeenCalledWith(
        'projects',
        expect.stringMatching(/^proj_\d+_/),
        expect.objectContaining({
          name: mockCreateProjectDto.name,
          spvId: 'test-spv-id',
          status: ProjectStatus.DRAFT,
        })
      );

      expect(logSpy).toHaveBeenCalledWith(
        `Creating project: ${mockCreateProjectDto.name} for SPV: test-spv-id`
      );
    });

    it('should throw BadRequestException for invalid offering dates', async () => {
      // Arrange
      const invalidDto = {
        ...mockCreateProjectDto,
        offeringStartDate: '2024-12-31',
        offeringEndDate: '2024-06-01',
      };

      // Act & Assert
      await expect(
        service.createProject(invalidDto, 'test-spv-id')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid concession dates', async () => {
      // Arrange
      const invalidDto = {
        ...mockCreateProjectDto,
        concessionStartDate: '2030-12-31',
        concessionEndDate: '2025-01-01',
      };

      // Act & Assert
      await expect(
        service.createProject(invalidDto, 'test-spv-id')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when offering ends after concession starts', async () => {
      // Arrange
      const invalidDto = {
        ...mockCreateProjectDto,
        offeringEndDate: '2025-06-01',
        concessionStartDate: '2025-01-01',
      };

      // Act & Assert
      await expect(
        service.createProject(invalidDto, 'test-spv-id')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for past offering start date', async () => {
      // Arrange
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const invalidDto = {
        ...mockCreateProjectDto,
        offeringStartDate: pastDate.toISOString(),
      };

      // Act & Assert
      await expect(
        service.createProject(invalidDto, 'test-spv-id')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitForApproval', () => {
    it('should submit project for approval successfully', async () => {
      // Arrange
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockProject);
      jest
        .spyOn(firebaseService, 'updateDocument')
        .mockResolvedValue(undefined);
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      // Act
      const result = await service.submitForApproval(
        'test-project-id',
        'test-spv-id'
      );

      // Assert
      expect(result.status).toBe(ProjectStatus.PENDING_APPROVAL);
      expect(firebaseService.updateDocument).toHaveBeenCalledWith(
        'projects',
        'test-project-id',
        {
          status: ProjectStatus.PENDING_APPROVAL,
          updatedAt: expect.any(Date),
        }
      );
      expect(logSpy).toHaveBeenCalledWith(
        'Project submitted for approval: test-project-id'
      );
    });

    it('should throw NotFoundException when project not found', async () => {
      // Arrange
      jest.spyOn(firebaseService, 'getDocument').mockResolvedValue({
        exists: false,
        id: 'test-project-id',
        data: () => null,
      } as any);

      // Act & Assert
      await expect(
        service.submitForApproval('test-project-id', 'test-spv-id')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when unauthorized', async () => {
      // Arrange
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockProject);

      // Act & Assert
      await expect(
        service.submitForApproval('test-project-id', 'wrong-spv-id')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when project not in draft status', async () => {
      // Arrange
      const approvedProject = {
        ...mockProject,
        status: ProjectStatus.APPROVED,
      };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(approvedProject);

      // Act & Assert
      await expect(
        service.submitForApproval('test-project-id', 'test-spv-id')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveProject', () => {
    const mockApproveDto: ApproveProjectDto = {
      action: ApprovalAction.APPROVE,
      reason: 'Project meets all requirements',
      adminNotes: 'Approved for deployment',
    };

    it('should approve project successfully', async () => {
      // Arrange
      const pendingProject = {
        ...mockProject,
        status: ProjectStatus.PENDING_APPROVAL,
      };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(pendingProject);
      jest
        .spyOn(firebaseService, 'updateDocument')
        .mockResolvedValue(undefined);
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      // Act
      const result = await service.approveProject(
        'test-project-id',
        mockApproveDto,
        'admin-id'
      );

      // Assert
      expect(result.status).toBe(ProjectStatus.APPROVED);
      expect(firebaseService.updateDocument).toHaveBeenCalledWith(
        'projects',
        'test-project-id',
        expect.objectContaining({
          status: ProjectStatus.APPROVED,
          approval: expect.objectContaining({
            adminId: 'admin-id',
            action: ApprovalAction.APPROVE,
            reason: 'Project meets all requirements',
            adminNotes: 'Approved for deployment',
          }),
        })
      );
      expect(logSpy).toHaveBeenCalledWith('Project approved: test-project-id');
    });

    it('should reject project successfully', async () => {
      // Arrange
      const pendingProject = {
        ...mockProject,
        status: ProjectStatus.PENDING_APPROVAL,
      };
      const rejectDto: ApproveProjectDto = {
        action: ApprovalAction.REJECT,
        reason: 'Missing required documents',
        adminNotes: 'Please provide complete documentation',
      };

      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(pendingProject);
      jest
        .spyOn(firebaseService, 'updateDocument')
        .mockResolvedValue(undefined);
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      // Act
      const result = await service.approveProject(
        'test-project-id',
        rejectDto,
        'admin-id'
      );

      // Assert
      expect(result.status).toBe(ProjectStatus.DRAFT);
      expect(logSpy).toHaveBeenCalledWith('Project rejected: test-project-id');
    });

    it('should throw NotFoundException when project not found', async () => {
      // Arrange
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.approveProject('test-project-id', mockApproveDto, 'admin-id')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when project not pending approval', async () => {
      // Arrange
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockProject);

      // Act & Assert
      await expect(
        service.approveProject('test-project-id', mockApproveDto, 'admin-id')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllProjects', () => {
    it('should return all projects with default parameters', async () => {
      // Arrange
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue([mockProject]);

      // Act
      const result = await service.findAllProjects();

      // Assert
      expect(result).toEqual([mockProject]);
    });

    it('should return projects with status filter', async () => {
      // Arrange
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue([mockProject]);

      // Act
      const result = await service.findAllProjects(ProjectStatus.APPROVED);

      // Assert
      expect(result).toEqual([mockProject]);
    });

    it('should return projects with category filter', async () => {
      // Arrange
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue([mockProject]);

      // Act
      const result = await service.findAllProjects(undefined, 'transportation');

      // Assert
      expect(result).toEqual([mockProject]);
    });

    it('should return projects with pagination', async () => {
      // Arrange
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue([mockProject]);

      // Act
      const result = await service.findAllProjects(
        undefined,
        undefined,
        10,
        'last-project-id'
      );

      // Assert
      expect(result).toEqual([mockProject]);
    });
  });

  describe('findProjectsBySPV', () => {
    it('should return projects for specific SPV', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocumentsByField')
        .mockResolvedValue(mockFirebaseQuerySnapshot);

      // Act
      const result = await service.findProjectsBySPV('test-spv-id');

      // Assert
      expect(result).toEqual([mockProject]);
      expect(firebaseService.getDocumentsByField).toHaveBeenCalledWith(
        'projects',
        'spvId',
        'test-spv-id'
      );
    });
  });

  describe('findProjectById', () => {
    it('should return project when found', async () => {
      // Arrange
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockProject);

      // Act
      const result = await service.findProjectById('test-project-id');

      // Assert
      expect(result).toEqual(mockProject);
    });

    it('should return null when project not found', async () => {
      // Arrange
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(null);

      // Act
      const result = await service.findProjectById('test-project-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateProject', () => {
    const mockUpdateDto: UpdateProjectDto = {
      name: 'Updated Project Name',
      description: 'Updated description',
    };

    it('should update project successfully', async () => {
      // Arrange
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockProject);
      jest
        .spyOn(firebaseService, 'updateDocument')
        .mockResolvedValue(undefined);

      // Act
      const result = await service.updateProject(
        'test-project-id',
        mockUpdateDto,
        'test-spv-id'
      );

      // Assert
      expect(result.name).toBe('Updated Project Name');
      expect(firebaseService.updateDocument).toHaveBeenCalledWith(
        'projects',
        'test-project-id',
        expect.objectContaining({
          ...mockUpdateDto,
          updatedAt: expect.any(Date),
        })
      );
    });

    it('should throw NotFoundException when project not found', async () => {
      // Arrange
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateProject('test-project-id', mockUpdateDto, 'test-spv-id')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when unauthorized', async () => {
      // Arrange
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockProject);

      // Act & Assert
      await expect(
        service.updateProject('test-project-id', mockUpdateDto, 'wrong-spv-id')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when project not in draft status', async () => {
      // Arrange
      const approvedProject = {
        ...mockProject,
        status: ProjectStatus.APPROVED,
      };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(approvedProject);

      // Act & Assert
      await expect(
        service.updateProject('test-project-id', mockUpdateDto, 'test-spv-id')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      // Arrange
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockProject);
      jest
        .spyOn(firebaseService, 'deleteDocument')
        .mockResolvedValue(undefined);
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      // Act
      await service.deleteProject('test-project-id', 'test-spv-id');

      // Assert
      expect(firebaseService.deleteDocument).toHaveBeenCalledWith(
        'projects',
        'test-project-id'
      );
      expect(logSpy).toHaveBeenCalledWith('Project deleted: test-project-id');
    });

    it('should throw NotFoundException when project not found', async () => {
      // Arrange
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.deleteProject('test-project-id', 'test-spv-id')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when unauthorized', async () => {
      // Arrange
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockProject);

      // Act & Assert
      await expect(
        service.deleteProject('test-project-id', 'wrong-spv-id')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when project not in draft status', async () => {
      // Arrange
      const approvedProject = {
        ...mockProject,
        status: ProjectStatus.APPROVED,
      };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(approvedProject);

      // Act & Assert
      await expect(
        service.deleteProject('test-project-id', 'test-spv-id')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('private methods', () => {
    it('should calculate concession duration correctly', async () => {
      // Arrange
      const createDto = {
        ...mockCreateProjectDto,
        offeringStartDate: '2025-08-01',
        offeringEndDate: '2025-12-31',
        concessionStartDate: '2026-01-01',
        concessionEndDate: '2031-01-01',
      };

      jest.spyOn(firebaseService, 'setDocument').mockResolvedValue(undefined);

      // Act
      const result = await service.createProject(createDto, 'test-spv-id');

      // Assert
      expect(result.concession.duration).toBe(5);
    });

    it('should handle contract deployment simulation', async () => {
      // Arrange
      const pendingProject = {
        ...mockProject,
        status: ProjectStatus.PENDING_APPROVAL,
      };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(pendingProject);
      jest
        .spyOn(firebaseService, 'updateDocument')
        .mockResolvedValue(undefined);

      // Act
      await service.approveProject(
        'test-project-id',
        { action: ApprovalAction.APPROVE, reason: 'Test' },
        'admin-id'
      );

      // Assert
      // Contract deployment happens asynchronously, so we just verify the project was approved
      expect(firebaseService.updateDocument).toHaveBeenCalledWith(
        'projects',
        'test-project-id',
        expect.objectContaining({
          status: ProjectStatus.APPROVED,
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle Firebase errors gracefully', async () => {
      // Arrange
      jest
        .spyOn(cacheService, 'getOrSet')
        .mockRejectedValue(new Error('Firebase error'));

      // Act & Assert
      await expect(service.findProjectById('test-project-id')).rejects.toThrow(
        'Firebase error'
      );
    });

    it('should handle validation errors in date validation', async () => {
      // Arrange
      const invalidDto = {
        ...mockCreateProjectDto,
        offeringStartDate: '2025-12-31',
        offeringEndDate: '2025-08-01', // End date before start date
      };

      // Act & Assert
      await expect(
        service.createProject(invalidDto, 'test-spv-id')
      ).rejects.toThrow(BadRequestException);
    });
  });
});
