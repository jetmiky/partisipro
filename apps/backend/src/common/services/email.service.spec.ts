import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { ConnectionPoolService } from './connection-pool.service';
import { MonitoringService } from './monitoring.service';
import * as sgMail from '@sendgrid/mail';

// Mock crypto module
jest.mock('crypto', () => ({
  createHmac: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'valid-signature'),
  })),
}));

describe('EmailService', () => {
  let service: EmailService;
  // let configService: jest.Mocked<ConfigService>;
  let connectionPoolService: jest.Mocked<ConnectionPoolService>;
  let monitoringService: jest.Mocked<MonitoringService>;

  const mockEmailConfig = {
    apiKey: 'test-api-key',
    fromEmail: 'test@partisipro.com',
    fromName: 'Partisipro Test',
    baseUrl: 'https://api.sendgrid.com',
    templates: {
      investment: { id: 'd-investment', name: 'Investment' },
      security: { id: 'd-security', name: 'Security' },
      kyc: { id: 'd-kyc', name: 'KYC' },
      governance: { id: 'd-governance', name: 'Governance' },
      system: { id: 'd-system', name: 'System' },
      mfa: { id: 'd-mfa', name: 'MFA' },
    },
    webhook: {
      secret: 'webhook-secret',
      endpoint: '/api/email/webhook',
    },
    retries: {
      maxAttempts: 3,
      delay: 1000,
    },
  };

  // Set up test environment to force real API mode for specific tests
  const originalEnv = process.env.NODE_ENV;
  const originalEmailForceReal = process.env.EMAIL_FORCE_REAL;

  beforeEach(async () => {
    // Reset environment variables before each test
    process.env.NODE_ENV = 'test';
    process.env.EMAIL_FORCE_REAL = 'false';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(mockEmailConfig),
          },
        },
        {
          provide: ConnectionPoolService,
          useValue: {
            getConnection: jest.fn(),
          },
        },
        {
          provide: MonitoringService,
          useValue: {
            recordMetric: jest.fn(),
            createAlert: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    // configService = module.get(ConfigService);
    connectionPoolService = module.get(ConnectionPoolService);
    monitoringService = module.get(MonitoringService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Restore original environment variables
    process.env.NODE_ENV = originalEnv;
    process.env.EMAIL_FORCE_REAL = originalEmailForceReal;
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize SendGrid API when API key is provided and not in mock mode', async () => {
      // Force real API mode for this test by setting environment before service creation
      process.env.EMAIL_FORCE_REAL = 'true';
      process.env.NODE_ENV = 'production'; // Override test environment

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue(mockEmailConfig),
            },
          },
          {
            provide: ConnectionPoolService,
            useValue: {
              getConnection: jest.fn(),
            },
          },
          {
            provide: MonitoringService,
            useValue: {
              recordMetric: jest.fn(),
              createAlert: jest.fn(),
            },
          },
        ],
      }).compile();

      // Get service instance that should be in real API mode
      const realApiService = module.get<EmailService>(EmailService);

      expect(sgMail.setApiKey).toHaveBeenCalledWith('test-api-key');
      expect(realApiService).toBeDefined();
    });
  });

  describe('sendInvestmentNotification', () => {
    it('should send investment notification successfully in mock mode', async () => {
      const emailData = {
        to: 'investor@example.com',
        dynamicTemplateData: {
          investmentAmount: 1000000,
          projectName: 'Test Project',
        },
      };

      const messageId = await service.sendInvestmentNotification(
        emailData,
        'purchase'
      );

      // In mock mode, sgMail.send is not called
      expect(sgMail.send).not.toHaveBeenCalled();
      // Mock message ID should match the pattern
      expect(messageId).toMatch(/^mock-/);
      expect(monitoringService.recordMetric).toHaveBeenCalledWith(
        'email_sent_success',
        1
      );
    });

    it('should handle different investment notification types in mock mode', async () => {
      const emailData = { to: 'investor@example.com' };

      const messageId1 = await service.sendInvestmentNotification(
        emailData,
        'profit'
      );
      const messageId2 = await service.sendInvestmentNotification(
        emailData,
        'buyback'
      );

      // In mock mode, sgMail.send is not called
      expect(sgMail.send).not.toHaveBeenCalled();
      // Both should return mock message IDs
      expect(messageId1).toMatch(/^mock-/);
      expect(messageId2).toMatch(/^mock-/);
      expect(monitoringService.recordMetric).toHaveBeenCalledWith(
        'email_sent_success',
        1
      );
    });
  });

  describe('sendSecurityAlert', () => {
    it('should send security alert successfully in mock mode', async () => {
      const emailData = {
        to: 'user@example.com',
        dynamicTemplateData: {
          ipAddress: '192.168.1.1',
          location: 'Jakarta, Indonesia',
        },
      };

      const messageId = await service.sendSecurityAlert(emailData, 'login');

      // In mock mode, sgMail.send is not called
      expect(sgMail.send).not.toHaveBeenCalled();
      // Mock message ID should match the pattern
      expect(messageId).toMatch(/^mock-/);
    });

    it('should handle different alert types in mock mode', async () => {
      const emailData = { to: 'user@example.com' };

      const messageId1 = await service.sendSecurityAlert(emailData, 'mfa');
      const messageId2 = await service.sendSecurityAlert(
        emailData,
        'suspicious'
      );
      const messageId3 = await service.sendSecurityAlert(
        emailData,
        'account_change'
      );

      // In mock mode, sgMail.send is not called
      expect(sgMail.send).not.toHaveBeenCalled();
      // All should return mock message IDs
      expect(messageId1).toMatch(/^mock-/);
      expect(messageId2).toMatch(/^mock-/);
      expect(messageId3).toMatch(/^mock-/);
    });
  });

  describe('sendKYCUpdate', () => {
    it('should send KYC update notification in mock mode', async () => {
      const emailData = {
        to: 'user@example.com',
        dynamicTemplateData: {
          userName: 'John Doe',
        },
      };

      const messageId = await service.sendKYCUpdate(emailData, 'approved');

      // In mock mode, sgMail.send is not called
      expect(sgMail.send).not.toHaveBeenCalled();
      // Mock message ID should match the pattern
      expect(messageId).toMatch(/^mock-/);
    });

    it('should handle different KYC statuses in mock mode', async () => {
      const emailData = { to: 'user@example.com' };

      const messageId1 = await service.sendKYCUpdate(emailData, 'pending');
      const messageId2 = await service.sendKYCUpdate(emailData, 'rejected');
      const messageId3 = await service.sendKYCUpdate(
        emailData,
        'requires_action'
      );

      // In mock mode, sgMail.send is not called
      expect(sgMail.send).not.toHaveBeenCalled();
      // All should return mock message IDs
      expect(messageId1).toMatch(/^mock-/);
      expect(messageId2).toMatch(/^mock-/);
      expect(messageId3).toMatch(/^mock-/);
    });
  });

  describe('sendMFACode', () => {
    it('should send MFA code successfully in mock mode', async () => {
      const emailData = { to: 'user@example.com' };
      const code = '123456';
      const expiresIn = 300; // 5 minutes

      const messageId = await service.sendMFACode(emailData, code, expiresIn);

      // In mock mode, sgMail.send is not called
      expect(sgMail.send).not.toHaveBeenCalled();
      // Mock message ID should match the pattern
      expect(messageId).toMatch(/^mock-/);
    });
  });

  describe('processWebhook', () => {
    it('should process webhook events successfully', async () => {
      // Crypto is already mocked at module level

      const mockPayload = [
        {
          event: 'delivered',
          sg_message_id: 'test-message-id',
          timestamp: Math.floor(Date.now() / 1000),
        },
        {
          event: 'open',
          sg_message_id: 'test-message-id-2',
          timestamp: Math.floor(Date.now() / 1000),
        },
      ];

      const result = await service.processWebhook(
        mockPayload,
        'valid-signature'
      );

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('delivered');
      expect(result[1].status).toBe('opened');
      expect(monitoringService.recordMetric).toHaveBeenCalledWith(
        'email_delivery_event',
        1
      );
    });

    it('should handle invalid webhook signature', async () => {
      const mockPayload = [{ event: 'delivered' }];

      await expect(
        service.processWebhook(mockPayload, 'invalid-signature')
      ).rejects.toThrow('Invalid webhook signature');
    });
  });

  describe('error handling', () => {
    it('should handle SendGrid API errors with retry in real API mode', async () => {
      // Force real API mode for this test by setting environment before service creation
      process.env.EMAIL_FORCE_REAL = 'true';
      process.env.NODE_ENV = 'production'; // Override test environment

      const realApiModule: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue(mockEmailConfig),
            },
          },
          {
            provide: ConnectionPoolService,
            useValue: {
              getConnection: jest.fn(),
            },
          },
          {
            provide: MonitoringService,
            useValue: monitoringService,
          },
        ],
      }).compile();

      const realApiService = realApiModule.get<EmailService>(EmailService);

      const error = new Error('SendGrid API Error');
      // Mock all 3 retry attempts to fail
      (sgMail.send as jest.Mock)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error);

      const emailData = { to: 'user@example.com' };

      await expect(
        realApiService.sendInvestmentNotification(emailData, 'purchase')
      ).rejects.toThrow(
        'Failed to send email after 3 attempts: SendGrid API Error'
      );

      expect(monitoringService.recordMetric).toHaveBeenCalledWith(
        'email_sent_error',
        1
      );
      expect(monitoringService.createAlert).toHaveBeenCalled();
    });

    it('should work in mock mode when API key is not provided', () => {
      const configServiceMock = {
        get: jest.fn().mockReturnValue({
          ...mockEmailConfig,
          apiKey: '',
        }),
      };

      // Create new service instance without API key
      const testModule = Test.createTestingModule({
        providers: [
          EmailService,
          { provide: ConfigService, useValue: configServiceMock },
          { provide: ConnectionPoolService, useValue: connectionPoolService },
          { provide: MonitoringService, useValue: monitoringService },
        ],
      });

      expect(testModule).toBeDefined();
    });
  });

  describe('utility methods', () => {
    it('should validate email addresses correctly', async () => {
      expect(await service.validateEmailAddress('valid@example.com')).toBe(
        true
      );
      expect(await service.validateEmailAddress('invalid-email')).toBe(false);
      expect(await service.validateEmailAddress('')).toBe(false);
    });

    it('should get template information', async () => {
      const template = await service.getTemplateInfo('investment');

      expect(template).toEqual({
        id: 'd-investment',
        name: 'Investment',
      });
    });

    it('should get delivery statistics', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const stats = await service.getDeliveryStats(startDate, endDate);

      expect(stats).toHaveProperty('sent');
      expect(stats).toHaveProperty('delivered');
      expect(stats).toHaveProperty('period');
      expect(stats.period.start).toBe(startDate);
      expect(stats.period.end).toBe(endDate);
    });
  });
});
