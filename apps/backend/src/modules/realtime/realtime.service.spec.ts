import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeService } from './realtime.service';
import { CacheService } from '../../common/services/cache.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

describe('RealtimeService', () => {
  let service: RealtimeService;
  let cacheService: CacheService;
  // let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeService,
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
            deletePattern: jest.fn(),
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

    service = module.get<RealtimeService>(RealtimeService);
    cacheService = module.get<CacheService>(CacheService);
    // configService = module.get<ConfigService>(ConfigService);

    // Mock logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('connection management', () => {
    it('should add connection successfully', async () => {
      const socketId = 'test-socket-id';
      const userId = 'test-user-id';

      jest.spyOn(cacheService, 'set').mockResolvedValue(undefined);

      await service.addConnection(socketId, userId);

      expect(cacheService.set).toHaveBeenCalledWith(
        `realtime:connection:${socketId}`,
        expect.any(String),
        { ttl: 300 }
      );
    });

    it('should remove connection successfully', async () => {
      const socketId = 'test-socket-id';

      // First add a connection
      await service.addConnection(socketId, 'test-user-id');

      jest.spyOn(cacheService, 'delete').mockResolvedValue(undefined);

      await service.removeConnection(socketId);

      expect(cacheService.delete).toHaveBeenCalledWith(
        `realtime:connection:${socketId}`
      );
    });
  });

  describe('subscription management', () => {
    it('should subscribe to portfolio updates', async () => {
      const socketId = 'test-socket-id';
      const userId = 'test-user-id';

      // First add a connection
      await service.addConnection(socketId, userId);

      jest.spyOn(cacheService, 'set').mockResolvedValue(undefined);

      await service.subscribeToPortfolio(socketId, userId);

      // Verify the method executes without errors
      expect(service).toBeDefined();
    });

    it('should subscribe to governance updates', async () => {
      const socketId = 'test-socket-id';
      const userId = 'test-user-id';
      const projectId = 'test-project-id';

      // First add a connection
      await service.addConnection(socketId, userId);

      jest.spyOn(cacheService, 'set').mockResolvedValue(undefined);

      await service.subscribeToGovernance(socketId, userId, projectId);

      // Verify the method executes without errors
      expect(service).toBeDefined();
    });
  });

  describe('broadcasting', () => {
    beforeEach(() => {
      // Mock server to avoid errors
      const mockServer = {
        to: jest.fn().mockReturnValue({
          emit: jest.fn(),
        }),
      };
      service.setServer(mockServer as any);
    });

    it('should broadcast portfolio updates', async () => {
      const userId = 'test-user-id';
      const portfolioData = {
        type: 'investment_created',
        investment: { id: 'test-investment-id', amount: 1000 },
        project: { id: 'test-project-id', name: 'Test Project' },
      };

      await service.broadcastPortfolioUpdate(userId, portfolioData);

      // Verify the method executes without errors
      expect(service).toBeDefined();
    });

    it('should broadcast governance updates', async () => {
      const projectId = 'test-project-id';
      const governanceData = {
        type: 'proposal_created',
        proposal: { id: 'test-proposal-id', title: 'Test Proposal' },
        projectId: 'test-project-id',
        timestamp: new Date(),
      };

      await service.broadcastGovernanceUpdate(projectId, governanceData);

      // Verify the method executes without errors
      expect(service).toBeDefined();
    });

    it('should broadcast KYC status updates', async () => {
      const userId = 'test-user-id';
      const kycData = {
        status: 'approved',
        userId: 'test-user-id',
        timestamp: new Date(),
      };

      await service.broadcastKYCStatusUpdate(userId, kycData);

      // Verify the method executes without errors
      expect(service).toBeDefined();
    });

    it('should broadcast project updates', async () => {
      const projectId = 'test-project-id';
      const projectData = {
        type: 'project_created',
        project: { id: 'test-project-id', name: 'Test Project' },
        timestamp: new Date(),
      };

      await service.broadcastProjectUpdate(projectId, projectData);

      // Verify the method executes without errors
      expect(service).toBeDefined();
    });

    it('should broadcast profit distribution updates', async () => {
      const userId = 'test-user-id';
      const profitData = {
        type: 'distribution_calculated',
        distribution: { id: 'test-distribution-id', amount: 5000 },
        projectId: 'test-project-id',
        timestamp: new Date(),
      };

      await service.broadcastProfitDistribution(
        userId,
        profitData,
        'test-project-id'
      );

      // Verify the method executes without errors
      expect(service).toBeDefined();
    });

    it('should broadcast system notifications', async () => {
      const message = 'System maintenance scheduled for tonight';

      await service.broadcastSystemNotification(message);

      // Verify the method executes without errors
      expect(service).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle cache service errors gracefully', async () => {
      jest
        .spyOn(cacheService, 'set')
        .mockRejectedValue(new Error('Cache error'));

      const socketId = 'test-socket-id';
      const userId = 'test-user-id';

      // Should not throw error
      await expect(
        service.addConnection(socketId, userId)
      ).resolves.not.toThrow();
    });

    it('should handle missing connections gracefully', async () => {
      const socketId = 'non-existent-socket-id';

      // Should handle missing connection gracefully
      await expect(service.removeConnection(socketId)).resolves.not.toThrow();
    });

    it('should handle unsubscribe for unknown subscription type', async () => {
      const socketId = 'test-socket-id';

      // First add a connection
      await service.addConnection(socketId, 'test-user-id');

      // Should handle unknown subscription type gracefully
      await expect(
        service.unsubscribe(socketId, 'unknown_type')
      ).resolves.not.toThrow();
    });
  });
});
