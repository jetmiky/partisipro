/**
 * Business Flow Test: Admin Platform Management
 * Tests the complete admin platform management workflow including:
 * 1. Platform configuration and fee management
 * 2. SPV whitelist and authorization management
 * 3. User and identity management oversight
 * 4. Project approval and lifecycle management
 * 5. Financial monitoring and reporting
 * 6. System health and performance monitoring
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AuthService } from '../../src/modules/auth/auth.service';
import { UsersService } from '../../src/modules/users/users.service';
import { IdentityService } from '../../src/modules/identity/identity.service';
import { ClaimsService } from '../../src/modules/claims/claims.service';
import { TrustedIssuersService } from '../../src/modules/trusted-issuers/trusted-issuers.service';
import { ProjectsService } from '../../src/modules/projects/projects.service';
import { InvestmentsService } from '../../src/modules/investments/investments.service';
import { ProfitsService } from '../../src/modules/profits/profits.service';
import { Web3AuthService } from '../../src/modules/auth/web3auth.service';
// import { AdminService } from '../../src/modules/admin/admin.service';
// import { KYCService } from '../../src/modules/kyc/kyc.service';
// import { PaymentsService } from '../../src/modules/payments/payments.service';
// import { BlockchainService } from '../../src/modules/blockchain/blockchain.service';
import {
  User,
  UserRole,
  // KYCStatus,
  ClaimTopic,
  ProjectStatus,
  ProjectCategory,
} from '../../src/common/types';
import { setupTestDatabase, cleanupTestDatabase } from '../setup';
import { createWeb3AuthMock } from '../utils/web3auth-mock';

describe('Business Flow: Admin Platform Management', () => {
  let app: INestApplication;
  let authService: AuthService;
  let usersService: UsersService;
  let identityService: IdentityService;
  let claimsService: ClaimsService;
  let trustedIssuersService: TrustedIssuersService;
  let projectsService: ProjectsService;
  let investmentsService: InvestmentsService;
  let profitsService: ProfitsService;
  // let adminService: AdminService;
  // let kycService: KYCService;
  // let paymentsService: PaymentsService;
  // let blockchainService: BlockchainService;

  // Test actors
  let adminUser: User;
  let spvUser1: User;
  let spvUser2: User;
  let investor1: User;
  let investor2: User;
  let trustedIssuerId: string;
  let projectId1: string;
  let projectId2: string;
  let investmentId1: string;
  let investmentId2: string;

  // Test data
  let adminToken: string;
  // let spv1Token: string;
  // let spv2Token: string;
  let investor1Token: string;
  // let investor2Token: string;

  beforeAll(async () => {
    await setupTestDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(Web3AuthService)
      .useValue(createWeb3AuthMock())
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    // Get services
    authService = app.get<AuthService>(AuthService);
    usersService = app.get<UsersService>(UsersService);
    identityService = app.get<IdentityService>(IdentityService);
    claimsService = app.get<ClaimsService>(ClaimsService);
    trustedIssuersService = app.get<TrustedIssuersService>(
      TrustedIssuersService
    );
    projectsService = app.get<ProjectsService>(ProjectsService);
    investmentsService = app.get<InvestmentsService>(InvestmentsService);
    profitsService = app.get<ProfitsService>(ProfitsService);
    // adminService = app.get<AdminService>(AdminService);
    // kycService = app.get<KYCService>(KYCService);
    // paymentsService = app.get<PaymentsService>(PaymentsService);
    // blockchainService = app.get<BlockchainService>(BlockchainService);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await app.close();
  });

  describe('1. Platform Setup and Configuration', () => {
    it('should create platform admin with proper authentication', async () => {
      adminUser = await usersService.findOrCreateUser({
        email: 'admin@partisipro.com',
        walletAddress: '0x1234567890123456789012345678901234567890',
        web3AuthId: 'admin-web3auth-id',
      });

      adminUser = await usersService.updateUser(adminUser.id, {
        role: UserRole.ADMIN,
      });

      expect(adminUser.role).toBe(UserRole.ADMIN);

      // Authenticate admin
      const authResult = await authService.authenticateWithWeb3Auth({
        idToken: 'mock-admin-token',
      });
      adminToken = authResult.accessToken;

      expect(authResult.user.id).toBe(adminUser.id);
      expect(adminToken).toBeDefined();
    });

    it('should configure platform fee structure', async () => {
      // Platform fee configuration would be handled by PlatformRegistry smart contract
      // For now, verify admin can access fee-related endpoints
      const response = await request(app.getHttpServer())
        .get('/api/admin/platform-fees')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should setup trusted KYC providers', async () => {
      const trustedIssuer = await trustedIssuersService.addTrustedIssuer(
        {
          name: 'Verihubs KYC Provider',
          issuerAddress: '0xverihubs123',
          authorizedClaims: [
            ClaimTopic.KYC_APPROVED,
            ClaimTopic.ACCREDITED_INVESTOR,
          ],
          metadata: {
            companyName: 'Verihubs Indonesia',
            website: 'https://verihubs.com',
            contactEmail: 'support@verihubs.com',
          },
        },
        adminUser.id
      );

      trustedIssuerId = trustedIssuer.id;

      expect(trustedIssuer).toBeDefined();
      expect(trustedIssuer.name).toBe('Verihubs KYC Provider');
      expect(trustedIssuer.authorizedClaims).toContain(ClaimTopic.KYC_APPROVED);
    });

    it('should configure system monitoring and alerts', async () => {
      // Verify admin can access system health monitoring
      const response = await request(app.getHttpServer())
        .get('/api/admin/system-health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firebaseStatus).toBe('healthy');
      expect(response.body.data.blockchainStatus).toBe('connected');
    });
  });

  describe('2. SPV Management and Authorization', () => {
    it('should create and verify SPV applications', async () => {
      // Create first SPV
      spvUser1 = await usersService.findOrCreateUser({
        email: 'spv1@infrastructure.com',
        walletAddress: '0xspv1234567890123456789012345678901234567890',
        web3AuthId: 'spv1-web3auth-id',
      });

      spvUser1 = await usersService.updateUser(spvUser1.id, {
        role: UserRole.SPV,
      });

      // Create second SPV
      spvUser2 = await usersService.findOrCreateUser({
        email: 'spv2@infrastructure.com',
        walletAddress: '0xspv2234567890123456789012345678901234567890',
        web3AuthId: 'spv2-web3auth-id',
      });

      spvUser2 = await usersService.updateUser(spvUser2.id, {
        role: UserRole.SPV,
      });

      // Authenticate SPVs
      const spv1Auth = await authService.authenticateWithWeb3Auth({
        idToken: 'mock-spv1-token',
      });
      spv1Token = spv1Auth.accessToken;

      const spv2Auth = await authService.authenticateWithWeb3Auth({
        idToken: 'mock-spv2-token',
      });
      spv2Token = spv2Auth.accessToken;

      expect(spvUser1.role).toBe(UserRole.SPV);
      expect(spvUser2.role).toBe(UserRole.SPV);
    });

    it('should authorize SPVs through admin approval process', async () => {
      // Register SPV identities
      await identityService.registerIdentity(spvUser1.walletAddress, {
        userId: spvUser1.id,
        userAddress: spvUser1.walletAddress,
        metadata: {
          provider: 'manual',
          registrationType: 'spv',
        },
      });

      await identityService.registerIdentity(spvUser2.walletAddress, {
        userId: spvUser2.id,
        userAddress: spvUser2.walletAddress,
        metadata: {
          provider: 'manual',
          registrationType: 'spv',
        },
      });

      // Issue KYC claims for SPVs
      await claimsService.issueClaim({
        identityId: spvUser1.walletAddress,
        claimTopic: ClaimTopic.KYC_APPROVED,
        issuer: trustedIssuerId,
        data: {
          provider: 'manual',
          verificationId: 'spv1-verification-123',
          verifiedAt: new Date(),
        },
      });

      await claimsService.issueClaim({
        identityId: spvUser2.walletAddress,
        claimTopic: ClaimTopic.KYC_APPROVED,
        issuer: trustedIssuerId,
        data: {
          provider: 'manual',
          verificationId: 'spv2-verification-123',
          verifiedAt: new Date(),
        },
      });

      // Update identity status to verified
      await identityService.updateIdentityStatus(spvUser1.walletAddress, {
        status: 'verified' as any,
        reason: 'SPV verification completed',
      });

      await identityService.updateIdentityStatus(spvUser2.walletAddress, {
        status: 'verified' as any,
        reason: 'SPV verification completed',
      });

      // Verify SPV identities
      const spv1Verification = await identityService.verifyIdentity(
        spvUser1.walletAddress
      );
      const spv2Verification = await identityService.verifyIdentity(
        spvUser2.walletAddress
      );

      expect(spv1Verification.isVerified).toBe(true);
      expect(spv2Verification.isVerified).toBe(true);
    });

    it('should manage SPV whitelist via admin controls', async () => {
      // Admin can view all SPVs
      const response = await request(app.getHttpServer())
        .get('/api/admin/spvs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map(spv => spv.email)).toContain(
        'spv1@infrastructure.com'
      );
      expect(response.body.data.map(spv => spv.email)).toContain(
        'spv2@infrastructure.com'
      );
    });
  });

  describe('3. User and Identity Management Oversight', () => {
    it('should create and manage investors', async () => {
      // Create investors
      investor1 = await usersService.findOrCreateUser({
        email: 'investor1@example.com',
        walletAddress: '0xinvestor1234567890123456789012345678901234567890',
        web3AuthId: 'investor1-web3auth-id',
      });

      investor2 = await usersService.findOrCreateUser({
        email: 'investor2@example.com',
        walletAddress: '0xinvestor2234567890123456789012345678901234567890',
        web3AuthId: 'investor2-web3auth-id',
      });

      // Authenticate investors
      const investor1Auth = await authService.authenticateWithWeb3Auth({
        idToken: 'mock-investor1-token',
      });
      investor1Token = investor1Auth.accessToken;

      const investor2Auth = await authService.authenticateWithWeb3Auth({
        idToken: 'mock-investor2-token',
      });
      investor2Token = investor2Auth.accessToken;

      expect(investor1.role).toBe(UserRole.INVESTOR);
      expect(investor2.role).toBe(UserRole.INVESTOR);
    });

    it('should manage identity registry and claims', async () => {
      // Register investor identities
      await identityService.registerIdentity(investor1.walletAddress, {
        userId: investor1.id,
        userAddress: investor1.walletAddress,
        metadata: {
          provider: 'verihubs',
          registrationType: 'individual',
        },
      });

      await identityService.registerIdentity(investor2.walletAddress, {
        userId: investor2.id,
        userAddress: investor2.walletAddress,
        metadata: {
          provider: 'verihubs',
          registrationType: 'individual',
        },
      });

      // Issue KYC claims
      await claimsService.issueClaim({
        identityId: investor1.walletAddress,
        claimTopic: ClaimTopic.KYC_APPROVED,
        issuer: trustedIssuerId,
        data: {
          provider: 'verihubs',
          verificationId: 'investor1-verification-123',
          verifiedAt: new Date(),
        },
      });

      await claimsService.issueClaim({
        identityId: investor2.walletAddress,
        claimTopic: ClaimTopic.KYC_APPROVED,
        issuer: trustedIssuerId,
        data: {
          provider: 'verihubs',
          verificationId: 'investor2-verification-123',
          verifiedAt: new Date(),
        },
      });

      // Update identity status
      await identityService.updateIdentityStatus(investor1.walletAddress, {
        status: 'verified' as any,
        reason: 'KYC verification completed',
      });

      await identityService.updateIdentityStatus(investor2.walletAddress, {
        status: 'verified' as any,
        reason: 'KYC verification completed',
      });

      // Admin can view identity registry
      const response = await request(app.getHttpServer())
        .get('/api/admin/identity-registry')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should monitor KYC provider performance', async () => {
      // Admin can view KYC provider statistics
      const response = await request(app.getHttpServer())
        .get('/api/admin/kyc-providers/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalVerifications).toBeGreaterThan(0);
    });
  });

  describe('4. Project Approval and Lifecycle Management', () => {
    it('should create projects requiring admin approval', async () => {
      // SPV1 creates project
      const project1 = await projectsService.createProject(
        {
          name: 'Jakarta Smart City Infrastructure',
          description: 'Smart city infrastructure development',
          category: ProjectCategory.TECHNOLOGY,
          province: 'DKI Jakarta',
          city: 'Jakarta',
          totalValue: 15000000000, // 15 billion IDR
          tokenPrice: 150000, // 150k IDR per token
          totalTokens: 100000,
          minimumInvestment: 1500000, // 1.5 million IDR
          maximumInvestment: 150000000, // 150 million IDR
          tokenSymbol: 'JSCI',
          tokenName: 'Jakarta Smart City Infrastructure Token',
          offeringStartDate: '2024-01-01',
          offeringEndDate: '2024-12-31',
          concessionStartDate: '2025-01-01',
          concessionEndDate: '2055-01-01',
          expectedAnnualReturn: 9.5,
          riskLevel: 4,
          documentUrls: [],
        },
        spvUser1.id
      );

      projectId1 = project1.id;

      // SPV2 creates project
      const project2 = await projectsService.createProject(
        {
          name: 'Surabaya Port Modernization',
          description: 'Port infrastructure modernization',
          category: ProjectCategory.INFRASTRUCTURE,
          province: 'Jawa Timur',
          city: 'Surabaya',
          totalValue: 8000000000, // 8 billion IDR
          tokenPrice: 80000, // 80k IDR per token
          totalTokens: 100000,
          minimumInvestment: 800000, // 800k IDR
          maximumInvestment: 80000000, // 80 million IDR
          tokenSymbol: 'SPM',
          tokenName: 'Surabaya Port Modernization Token',
          offeringStartDate: '2024-01-01',
          offeringEndDate: '2024-12-31',
          concessionStartDate: '2025-01-01',
          concessionEndDate: '2050-01-01',
          expectedAnnualReturn: 8.0,
          riskLevel: 3,
          documentUrls: [],
        },
        spvUser2.id
      );

      projectId2 = project2.id;

      expect(project1.status).toBe(ProjectStatus.DRAFT);
      expect(project2.status).toBe(ProjectStatus.DRAFT);
    });

    it('should submit projects for approval', async () => {
      await projectsService.submitForApproval(projectId1, spvUser1.id);
      await projectsService.submitForApproval(projectId2, spvUser2.id);

      const project1 = await projectsService.findProjectById(projectId1);
      const project2 = await projectsService.findProjectById(projectId2);

      expect(project1.status).toBe(ProjectStatus.PENDING_APPROVAL);
      expect(project2.status).toBe(ProjectStatus.PENDING_APPROVAL);
    });

    it('should manage project approval workflow', async () => {
      // Admin can view pending projects
      const response = await request(app.getHttpServer())
        .get('/api/admin/projects/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);

      // Approve first project
      await projectsService.approveProject(
        projectId1,
        {
          action: 'approve' as any,
          reason: 'Project meets all regulatory requirements',
        },
        adminUser.id
      );

      // Approve second project
      await projectsService.approveProject(
        projectId2,
        {
          action: 'approve' as any,
          reason: 'Port modernization is strategically important',
        },
        adminUser.id
      );

      const project1 = await projectsService.findProjectById(projectId1);
      const project2 = await projectsService.findProjectById(projectId2);

      expect(project1.status).toBe(ProjectStatus.APPROVED);
      expect(project2.status).toBe(ProjectStatus.APPROVED);
    });

    it('should monitor project performance metrics', async () => {
      // Admin can view project analytics
      const response = await request(app.getHttpServer())
        .get('/api/admin/projects/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalProjects).toBe(2);
      expect(response.body.data.totalValue).toBeGreaterThan(0);
    });
  });

  describe('5. Investment Monitoring and Oversight', () => {
    it('should monitor investment flows and compliance', async () => {
      // Create investments
      const investment1 = await investmentsService.createInvestment(
        {
          projectId: projectId1,
          tokenAmount: 100,
          investmentAmount: 15000000, // 15 million IDR
          investmentType: 'primary' as any,
          email: investor1.email,
          phoneNumber: '+6281234567890',
          fullName: 'Test Investor 1',
        },
        investor1.id
      );

      const investment2 = await investmentsService.createInvestment(
        {
          projectId: projectId2,
          tokenAmount: 200,
          investmentAmount: 16000000, // 16 million IDR
          investmentType: 'primary' as any,
          email: investor2.email,
          phoneNumber: '+6281234567891',
          fullName: 'Test Investor 2',
        },
        investor2.id
      );

      investmentId1 = investment1.investment.id;
      investmentId2 = investment2.investment.id;

      // Process payments
      await investmentsService.processSuccessfulPayment(investmentId1);
      await investmentsService.processSuccessfulPayment(investmentId2);

      // Admin can view investment analytics
      const response = await request(app.getHttpServer())
        .get('/api/admin/investments/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalInvestments).toBe(2);
      expect(response.body.data.totalValue).toBeGreaterThan(0);
    });

    it('should monitor compliance violations and alerts', async () => {
      // Admin can view compliance dashboard
      const response = await request(app.getHttpServer())
        .get('/api/admin/compliance/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalVerifiedUsers).toBeGreaterThan(0);
      expect(response.body.data.complianceScore).toBeGreaterThan(0);
    });
  });

  describe('6. Financial Monitoring and Reporting', () => {
    it('should manage profit distribution oversight', async () => {
      // Create profit distribution
      const distribution = await profitsService.distributeProfits(
        {
          projectId: projectId1,
          totalProfit: 75000000, // 75 million IDR
          periodStartDate: '2024-01-01',
          periodEndDate: '2024-03-31',
          quarter: 1,
          year: 2024,
          notes: 'Q1 2024 profit distribution',
        },
        adminUser.id
      );

      expect(distribution).toBeDefined();
      expect(distribution.totalProfit).toBe(75000000);
      expect(distribution.platformFee).toBe(3750000); // 5% platform fee
      expect(distribution.distributedProfit).toBe(71250000); // After platform fee
    });

    it('should monitor platform revenue and fees', async () => {
      // Admin can view platform financial dashboard
      const response = await request(app.getHttpServer())
        .get('/api/admin/finances/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalPlatformRevenue).toBeGreaterThan(0);
      expect(response.body.data.totalPlatformFees).toBeGreaterThan(0);
    });

    it('should generate comprehensive financial reports', async () => {
      // Admin can generate financial reports
      const response = await request(app.getHttpServer())
        .post('/api/admin/reports/financial')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          reportType: 'quarterly',
          includeDetails: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reportUrl).toBeDefined();
      expect(response.body.data.totalProjects).toBe(2);
    });
  });

  describe('7. System Performance and Health Monitoring', () => {
    it('should monitor system health and performance metrics', async () => {
      // Admin can view system health dashboard
      const response = await request(app.getHttpServer())
        .get('/api/admin/system/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firebaseStatus).toBe('healthy');
      expect(response.body.data.blockchainStatus).toBe('connected');
      expect(response.body.data.kycProvidersStatus).toBe('operational');
    });

    it('should monitor user activity and engagement', async () => {
      // Admin can view user activity analytics
      const response = await request(app.getHttpServer())
        .get('/api/admin/analytics/user-activity')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalUsers).toBe(5); // 1 admin + 2 SPVs + 2 investors
      expect(response.body.data.activeUsers).toBeGreaterThan(0);
    });

    it('should handle system alerts and notifications', async () => {
      // Admin can view system alerts
      const response = await request(app.getHttpServer())
        .get('/api/admin/alerts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('8. Advanced Admin Operations', () => {
    it('should manage emergency controls and circuit breakers', async () => {
      // Admin can access emergency controls
      const response = await request(app.getHttpServer())
        .get('/api/admin/emergency/controls')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emergencyMode).toBe(false);
      expect(response.body.data.systemStatus).toBe('operational');
    });

    it('should perform data export and backup operations', async () => {
      // Admin can initiate data export
      const response = await request(app.getHttpServer())
        .post('/api/admin/data/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          exportType: 'full',
          includePersonalData: false,
          format: 'json',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.exportId).toBeDefined();
      expect(response.body.data.status).toBe('processing');
    });

    it('should manage platform configuration updates', async () => {
      // Admin can update platform configuration
      const response = await request(app.getHttpServer())
        .put('/api/admin/platform/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          platformName: 'Partisipro Platform',
          maintenanceMode: false,
          maxInvestmentPerUser: 1000000000, // 1 billion IDR
          minInvestmentAmount: 100000, // 100k IDR
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Platform configuration updated');
    });
  });

  describe('9. Audit Trail and Compliance Reporting', () => {
    it('should maintain comprehensive audit logs', async () => {
      // Admin can view audit logs
      const response = await request(app.getHttpServer())
        .get('/api/admin/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          limit: 100,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toBeDefined();
      expect(response.body.data.totalLogs).toBeGreaterThan(0);
    });

    it('should generate compliance reports for regulators', async () => {
      // Admin can generate compliance reports
      const response = await request(app.getHttpServer())
        .post('/api/admin/compliance/report')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportType: 'regulatory',
          period: 'quarterly',
          year: 2024,
          quarter: 1,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reportId).toBeDefined();
      expect(response.body.data.complianceScore).toBeGreaterThan(0);
    });
  });

  describe('10. Security and Access Control Validation', () => {
    it('should enforce admin-only access controls', async () => {
      // Non-admin users cannot access admin endpoints
      const response = await request(app.getHttpServer())
        .get('/api/admin/system/health')
        .set('Authorization', `Bearer ${investor1Token}`)
        .expect(403);

      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should validate comprehensive security measures', async () => {
      // Admin can view security dashboard
      const response = await request(app.getHttpServer())
        .get('/api/admin/security/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.securityScore).toBeGreaterThan(0);
      expect(response.body.data.threatLevel).toBe('low');
    });

    it('should maintain session security and monitoring', async () => {
      // Admin can view active sessions
      const response = await request(app.getHttpServer())
        .get('/api/admin/security/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.activeSessions).toBeGreaterThan(0);
    });
  });
});
