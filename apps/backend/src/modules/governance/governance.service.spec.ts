import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { FirebaseService } from '../../common/services/firebase.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ProjectsService } from '../projects/projects.service';
import { InvestmentsService } from '../investments/investments.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ConfigService } from '@nestjs/config';
import {
  CreateProposalDto,
  VoteProposalDto,
  ProposalType,
  VoteOption,
} from './dto';

describe('GovernanceService', () => {
  let service: GovernanceService;
  let firebaseService: FirebaseService;
  let blockchainService: BlockchainService;
  let projectsService: ProjectsService;
  let investmentsService: InvestmentsService;
  let realtimeService: RealtimeService;

  const mockProject = {
    id: 'test-project-id',
    name: 'Test Project',
    spvId: 'test-spv-id',
    status: 'active',
    financial: {
      totalTokens: 1000000,
    },
  };

  const mockInvestment = {
    id: 'test-investment-id',
    userId: 'test-user-id',
    projectId: 'test-project-id',
    tokenAmount: 1000,
    status: 'completed',
  };

  const mockProposal = {
    id: 'test-proposal-id',
    projectId: 'test-project-id',
    proposerId: 'test-user-id',
    title: 'Test Proposal',
    description: 'Test proposal description',
    type: ProposalType.PARAMETER_CHANGE,
    voting: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      quorum: 10,
      threshold: 50,
    },
    votes: {
      for: 0,
      against: 0,
      abstain: 0,
    },
    status: 'active' as const,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GovernanceService,
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
          provide: BlockchainService,
          useValue: {
            mockProjectFactoryCreateProject: jest.fn(),
            mockTreasuryDistributeProfits: jest.fn(),
            submitTransaction: jest.fn(),
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
            getUserInvestments: jest.fn(),
          },
        },
        {
          provide: RealtimeService,
          useValue: {
            broadcastGovernanceUpdate: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GovernanceService>(GovernanceService);
    firebaseService = module.get<FirebaseService>(FirebaseService);
    blockchainService = module.get<BlockchainService>(BlockchainService);
    projectsService = module.get<ProjectsService>(ProjectsService);
    investmentsService = module.get<InvestmentsService>(InvestmentsService);
    realtimeService = module.get<RealtimeService>(RealtimeService);

    // Default mock implementations
    jest
      .spyOn(firebaseService, 'getTimestamp')
      .mockReturnValue(new Date() as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('createProposal', () => {
    const createProposalDto: CreateProposalDto = {
      projectId: 'test-project-id',
      title: 'Test Proposal',
      description: 'Test proposal description',
      type: ProposalType.PARAMETER_CHANGE,
      quorum: 10,
      threshold: 50,
    };

    it('should create proposal successfully', async () => {
      // Arrange
      jest
        .spyOn(projectsService, 'findProjectById')
        .mockResolvedValue(mockProject as any);
      jest
        .spyOn(investmentsService, 'getUserInvestments')
        .mockResolvedValue([mockInvestment] as any);
      jest.spyOn(firebaseService, 'setDocument').mockResolvedValue(undefined);
      jest
        .spyOn(blockchainService, 'mockProjectFactoryCreateProject')
        .mockResolvedValue({ hash: 'test-hash' } as any);
      jest
        .spyOn(realtimeService, 'broadcastGovernanceUpdate')
        .mockResolvedValue(undefined);

      // Act
      const result = await service.createProposal(
        createProposalDto,
        'test-user-id'
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.title).toBe(createProposalDto.title);
      expect(result.projectId).toBe(createProposalDto.projectId);
      expect(result.proposerId).toBe('test-user-id');
      expect(firebaseService.setDocument).toHaveBeenCalled();
      expect(realtimeService.broadcastGovernanceUpdate).toHaveBeenCalledWith(
        createProposalDto.projectId,
        expect.objectContaining({
          type: 'proposal_created',
        })
      );
    });

    it('should throw NotFoundException when project not found', async () => {
      jest.spyOn(projectsService, 'findProjectById').mockResolvedValue(null);

      await expect(
        service.createProposal(createProposalDto, 'test-user-id')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user has no tokens', async () => {
      jest
        .spyOn(projectsService, 'findProjectById')
        .mockResolvedValue(mockProject as any);
      jest
        .spyOn(investmentsService, 'getUserInvestments')
        .mockResolvedValue([]);

      await expect(
        service.createProposal(createProposalDto, 'test-user-id')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for invalid voting dates', async () => {
      const invalidDto = {
        ...createProposalDto,
        votingStartDate: new Date(Date.now() + 86400000).toISOString(), // tomorrow
        votingEndDate: new Date().toISOString(), // today
      };

      jest
        .spyOn(projectsService, 'findProjectById')
        .mockResolvedValue(mockProject as any);
      jest
        .spyOn(investmentsService, 'getUserInvestments')
        .mockResolvedValue([mockInvestment] as any);

      await expect(
        service.createProposal(invalidDto, 'test-user-id')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('voteOnProposal', () => {
    const voteProposalDto: VoteProposalDto = {
      proposalId: 'test-proposal-id',
      vote: VoteOption.FOR,
      reason: 'I support this proposal',
    };

    it('should cast vote successfully', async () => {
      // Arrange
      jest.spyOn(service, 'getProposal').mockResolvedValue(mockProposal as any);
      jest.spyOn(service, 'getUserVote').mockResolvedValue(null);
      jest
        .spyOn(investmentsService, 'getUserInvestments')
        .mockResolvedValue([mockInvestment] as any);
      jest.spyOn(firebaseService, 'setDocument').mockResolvedValue(undefined);
      jest
        .spyOn(firebaseService, 'updateDocument')
        .mockResolvedValue(undefined);
      jest
        .spyOn(blockchainService, 'mockTreasuryDistributeProfits')
        .mockResolvedValue({ hash: 'test-tx-hash' } as any);
      jest
        .spyOn(realtimeService, 'broadcastGovernanceUpdate')
        .mockResolvedValue(undefined);

      // Mock updateProposalVoteCounts method
      jest
        .spyOn(service as any, 'updateProposalVoteCounts')
        .mockResolvedValue(undefined);

      // Act
      const result = await service.voteOnProposal(
        voteProposalDto,
        'test-user-id'
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.vote).toBe(VoteOption.FOR);
      expect(result.userId).toBe('test-user-id');
      expect(result.tokenAmount).toBe(1000);
      expect(firebaseService.setDocument).toHaveBeenCalled();
      expect(realtimeService.broadcastGovernanceUpdate).toHaveBeenCalledWith(
        mockProposal.projectId,
        expect.objectContaining({
          type: 'vote_cast',
        })
      );
    });

    it('should throw NotFoundException when proposal not found', async () => {
      jest.spyOn(service, 'getProposal').mockResolvedValue(null);

      await expect(
        service.voteOnProposal(voteProposalDto, 'test-user-id')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when proposal not active', async () => {
      const inactiveProposal = { ...mockProposal, status: 'pending' };
      jest
        .spyOn(service, 'getProposal')
        .mockResolvedValue(inactiveProposal as any);

      await expect(
        service.voteOnProposal(voteProposalDto, 'test-user-id')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user already voted', async () => {
      const existingVote = {
        id: 'existing-vote-id',
        proposalId: 'test-proposal-id',
        userId: 'test-user-id',
        vote: VoteOption.AGAINST,
        tokenAmount: 500,
        createdAt: new Date(),
      };

      jest.spyOn(service, 'getProposal').mockResolvedValue(mockProposal as any);
      jest.spyOn(service, 'getUserVote').mockResolvedValue(existingVote as any);

      await expect(
        service.voteOnProposal(voteProposalDto, 'test-user-id')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when user has no tokens', async () => {
      jest.spyOn(service, 'getProposal').mockResolvedValue(mockProposal as any);
      jest.spyOn(service, 'getUserVote').mockResolvedValue(null);
      jest
        .spyOn(investmentsService, 'getUserInvestments')
        .mockResolvedValue([]);

      await expect(
        service.voteOnProposal(voteProposalDto, 'test-user-id')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getProjectProposals', () => {
    it('should return project proposals', async () => {
      const mockDocuments = {
        docs: [{ data: () => mockProposal }],
      };

      jest
        .spyOn(firebaseService, 'getDocumentsByField')
        .mockResolvedValue(mockDocuments as any);

      const result = await service.getProjectProposals('test-project-id');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockProposal);
      expect(firebaseService.getDocumentsByField).toHaveBeenCalledWith(
        'governance_proposals',
        'projectId',
        'test-project-id'
      );
    });
  });

  describe('getProposal', () => {
    it('should return proposal when found', async () => {
      const mockDocument = {
        exists: true,
        data: () => mockProposal,
      };

      jest
        .spyOn(firebaseService, 'getDocument')
        .mockResolvedValue(mockDocument as any);

      const result = await service.getProposal('test-proposal-id');

      expect(result).toEqual(mockProposal);
    });

    it('should return null when proposal not found', async () => {
      const mockDocument = {
        exists: false,
      };

      jest
        .spyOn(firebaseService, 'getDocument')
        .mockResolvedValue(mockDocument as any);

      const result = await service.getProposal('test-proposal-id');

      expect(result).toBeNull();
    });
  });

  describe('getUserVotingPower', () => {
    it('should calculate user voting power correctly', async () => {
      const userInvestments = [
        { ...mockInvestment, tokenAmount: 1000 },
        { ...mockInvestment, tokenAmount: 500 },
      ];

      jest
        .spyOn(investmentsService, 'getUserInvestments')
        .mockResolvedValue(userInvestments as any);

      const result = await service.getUserVotingPower(
        'test-user-id',
        'test-project-id'
      );

      expect(result).toBe(1500);
    });

    it('should return 0 when user has no investments', async () => {
      jest
        .spyOn(investmentsService, 'getUserInvestments')
        .mockResolvedValue([]);

      const result = await service.getUserVotingPower(
        'test-user-id',
        'test-project-id'
      );

      expect(result).toBe(0);
    });
  });

  describe('executeProposal', () => {
    const passedProposal = {
      ...mockProposal,
      status: 'passed' as const,
      contractCall: {
        targetContract: '0x1234567890123456789012345678901234567890',
        methodName: 'updateParameter',
        parameters: ['param1', 'value1'],
      },
    };

    it('should execute proposal successfully', async () => {
      jest
        .spyOn(service, 'getProposal')
        .mockResolvedValue(passedProposal as any);
      jest
        .spyOn(blockchainService, 'submitTransaction')
        .mockResolvedValue({ hash: 'test-tx-hash' } as any);
      jest
        .spyOn(firebaseService, 'updateDocument')
        .mockResolvedValue(undefined);
      jest
        .spyOn(realtimeService, 'broadcastGovernanceUpdate')
        .mockResolvedValue(undefined);

      const result = await service.executeProposal(
        'test-proposal-id',
        'test-executor-id'
      );

      expect(result.status).toBe('executed');
      expect(result.executedAt).toBeDefined();
      expect(blockchainService.submitTransaction).toHaveBeenCalled();
      expect(realtimeService.broadcastGovernanceUpdate).toHaveBeenCalledWith(
        passedProposal.projectId,
        expect.objectContaining({
          type: 'proposal_executed',
        })
      );
    });

    it('should throw NotFoundException when proposal not found', async () => {
      jest.spyOn(service, 'getProposal').mockResolvedValue(null);

      await expect(
        service.executeProposal('test-proposal-id', 'test-executor-id')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when proposal has not passed', async () => {
      jest.spyOn(service, 'getProposal').mockResolvedValue(mockProposal as any);

      await expect(
        service.executeProposal('test-proposal-id', 'test-executor-id')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when proposal has no contract call', async () => {
      const proposalWithoutCall = {
        ...passedProposal,
        contractCall: undefined,
      };
      jest
        .spyOn(service, 'getProposal')
        .mockResolvedValue(proposalWithoutCall as any);

      await expect(
        service.executeProposal('test-proposal-id', 'test-executor-id')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('error handling', () => {
    it('should handle Firebase errors gracefully', async () => {
      jest
        .spyOn(projectsService, 'findProjectById')
        .mockResolvedValue(mockProject as any);
      jest
        .spyOn(investmentsService, 'getUserInvestments')
        .mockResolvedValue([mockInvestment] as any);
      jest
        .spyOn(firebaseService, 'setDocument')
        .mockRejectedValue(new Error('Firebase error'));

      const createProposalDto: CreateProposalDto = {
        projectId: 'test-project-id',
        title: 'Test Proposal',
        description: 'Test proposal description',
        type: ProposalType.PARAMETER_CHANGE,
      };

      await expect(
        service.createProposal(createProposalDto, 'test-user-id')
      ).rejects.toThrow('Firebase error');
    });

    it('should handle blockchain service errors gracefully', async () => {
      jest.spyOn(service, 'getProposal').mockResolvedValue(mockProposal as any);
      jest.spyOn(service, 'getUserVote').mockResolvedValue(null);
      jest
        .spyOn(investmentsService, 'getUserInvestments')
        .mockResolvedValue([mockInvestment] as any);
      jest.spyOn(firebaseService, 'setDocument').mockResolvedValue(undefined);
      jest
        .spyOn(firebaseService, 'getDocumentsByField')
        .mockResolvedValue({ docs: [] } as any);
      jest
        .spyOn(blockchainService, 'mockTreasuryDistributeProfits')
        .mockRejectedValue(new Error('Blockchain error'));

      // Mock updateProposalVoteCounts method to avoid internal errors
      jest
        .spyOn(service as any, 'updateProposalVoteCounts')
        .mockResolvedValue(undefined);

      const voteProposalDto: VoteProposalDto = {
        proposalId: 'test-proposal-id',
        vote: VoteOption.FOR,
      };

      await expect(
        service.voteOnProposal(voteProposalDto, 'test-user-id')
      ).rejects.toThrow('Blockchain error');
    });
  });
});
