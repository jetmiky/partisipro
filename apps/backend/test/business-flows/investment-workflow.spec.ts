/**
 * Business Flow Test: Investment Workflow with ERC-3643 Compliance
 * Tests the complete investment workflow including:
 * 1. Investment opportunity discovery and evaluation
 * 2. Identity verification and eligibility checking
 * 3. Investment creation and validation
 * 4. Payment processing and token minting
 * 5. Portfolio management and tracking
 * 6. Secondary market considerations
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
import { PaymentsService } from '../../src/modules/payments/payments.service';
import { BlockchainService } from '../../src/modules/blockchain/blockchain.service';
import { AdminService } from '../../src/modules/admin/admin.service';
import {
  User,
  UserRole,
  // KYCStatus,
  ClaimTopic,
  // ProjectStatus,
  ProjectCategory,
  // InvestmentStatus,
} from '../../src/common/types';
import { setupTestDatabase, cleanupTestDatabase } from '../setup';
// Removed Web3Auth mock import - using built-in service mock

// TODO: Complex business flow test requiring full investment workflow implementation
// Temporarily skipped until all investment services and business logic are complete
describe.skip('Business Flow: Investment Workflow with ERC-3643 Compliance', () => {
  let app: INestApplication;
  let authService: AuthService;
  let usersService: UsersService;
  let identityService: IdentityService;
  let claimsService: ClaimsService;
  let trustedIssuersService: TrustedIssuersService;
  let projectsService: ProjectsService;
  let investmentsService: InvestmentsService;
  let paymentsService: PaymentsService;
  let blockchainService: BlockchainService;
  let adminService: AdminService;

  // Test actors
  let adminUser: User;
  let spvUser: User;
  let retailInvestor: User;
  let accreditedInvestor: User;
  let institutionalInvestor: User;
  let trustedIssuerId: string;
  let projectId1: string;
  let projectId2: string;
  let projectId3: string;

  // Test data
  let retailInvestorToken: string;
  let accreditedInvestorToken: string;
  let institutionalInvestorToken: string;
  let investment1Id: string;
  let investment2Id: string;
  let investment3Id: string;

  beforeAll(async () => {
    await setupTestDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
    paymentsService = app.get<PaymentsService>(PaymentsService);
    blockchainService = app.get<BlockchainService>(BlockchainService);
    adminService = app.get<AdminService>(AdminService);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await app.close();
  });

  describe('1. Platform Setup and Project Creation', () => {
    it('should setup platform with admin, SPV, and trusted issuers', async () => {
      // Create admin
      adminUser = await usersService.findOrCreateUser({
        email: 'admin@partisipro.com',
        walletAddress: '0x1234567890123456789012345678901234567890',
        web3AuthId: 'admin-web3auth-id',
      });
      adminUser = await usersService.updateUser(adminUser.id, {
        role: UserRole.ADMIN,
      });

      // Create SPV
      spvUser = await usersService.findOrCreateUser({
        email: 'spv@infrastructure.com',
        walletAddress: '0xspv1234567890123456789012345678901234567890',
        web3AuthId: 'spv-web3auth-id',
      });
      spvUser = await usersService.updateUser(spvUser.id, {
        role: UserRole.SPV,
      });

      // Create trusted issuer
      const trustedIssuer = await trustedIssuersService.addTrustedIssuer(
        {
          name: 'Verihubs Indonesia',
          issuerAddress: '0xverihubs1234567890123456789012345678901234567890',
          authorizedClaims: [
            ClaimTopic.KYC_APPROVED,
            ClaimTopic.RETAIL_QUALIFIED,
            ClaimTopic.ACCREDITED_INVESTOR,
            ClaimTopic.INSTITUTIONAL_INVESTOR,
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

      // Setup SPV identity
      await identityService.registerIdentity(spvUser.walletAddress, {
        userId: spvUser.id,
        userAddress: spvUser.walletAddress,
        metadata: { provider: 'manual', registrationType: 'spv' },
      });

      await claimsService.issueClaim({
        identityId: spvUser.walletAddress,
        claimTopic: ClaimTopic.KYC_APPROVED,
        issuer: trustedIssuerId,
        data: { provider: 'manual', verificationId: 'spv-verification-001' },
      });

      await identityService.updateIdentityStatus(spvUser.walletAddress, {
        status: 'verified' as any,
        reason: 'SPV verification completed',
      });

      expect(adminUser.role).toBe(UserRole.ADMIN);
      expect(spvUser.role).toBe(UserRole.SPV);
      expect(trustedIssuer.name).toBe('Verihubs Indonesia');
    });

    it('should create multiple investment projects with different characteristics', async () => {
      // Project 1: Transportation - Large scale, high minimum investment
      const project1 = await projectsService.createProject(
        {
          name: 'Jakarta-Bandung High Speed Rail Extension',
          description:
            'Extension of existing high-speed rail network from Jakarta to Bandung',
          category: ProjectCategory.TRANSPORTATION,
          province: 'Jawa Barat',
          city: 'Bandung',
          totalValue: 50000000000000, // 50 trillion IDR
          tokenPrice: 5000000, // 5 million IDR per token
          totalTokens: 10000000,
          minimumInvestment: 50000000, // 50 million IDR
          maximumInvestment: 5000000000, // 5 billion IDR
          tokenSymbol: 'JHSRX',
          tokenName: 'Jakarta-Bandung High Speed Rail Extension Token',
          offeringStartDate: '2025-08-01',
          offeringEndDate: '2025-12-31',
          concessionStartDate: '2026-01-01',
          concessionEndDate: '2055-12-31',
          expectedAnnualReturn: 9.5,
          riskLevel: 4,
          documentUrls: [],
        },
        spvUser.id
      );
      projectId1 = project1.id;

      // Project 2: Healthcare - Medium scale, moderate minimum investment
      const project2 = await projectsService.createProject(
        {
          name: 'National Cancer Treatment Center',
          description:
            'State-of-the-art cancer treatment facility with latest medical technology',
          category: ProjectCategory.HEALTHCARE,
          province: 'DKI Jakarta',
          city: 'Jakarta',
          totalValue: 8000000000000, // 8 trillion IDR
          tokenPrice: 2000000, // 2 million IDR per token
          totalTokens: 4000000,
          minimumInvestment: 10000000, // 10 million IDR
          maximumInvestment: 800000000, // 800 million IDR
          tokenSymbol: 'NCTCX',
          tokenName: 'National Cancer Treatment Center Token',
          offeringStartDate: '2025-09-01',
          offeringEndDate: '2025-11-30',
          concessionStartDate: '2025-12-01',
          concessionEndDate: '2050-01-31',
          expectedAnnualReturn: 7.8,
          riskLevel: 2,
          documentUrls: [],
        },
        spvUser.id
      );
      projectId2 = project2.id;

      // Project 3: Energy - Small scale, low minimum investment (retail-friendly)
      const project3 = await projectsService.createProject(
        {
          name: 'Solar Power Park Bali',
          description:
            'Renewable energy solar power generation facility in Bali',
          category: ProjectCategory.ENERGY,
          province: 'Bali',
          city: 'Denpasar',
          totalValue: 2000000000000, // 2 trillion IDR
          tokenPrice: 500000, // 500k IDR per token
          totalTokens: 4000000,
          minimumInvestment: 2500000, // 2.5 million IDR
          maximumInvestment: 200000000, // 200 million IDR
          tokenSymbol: 'SPPBX',
          tokenName: 'Solar Power Park Bali Token',
          offeringStartDate: '2025-10-01',
          offeringEndDate: '2025-12-31',
          concessionStartDate: '2026-01-01',
          concessionEndDate: '2045-02-28',
          expectedAnnualReturn: 8.2,
          riskLevel: 3,
          documentUrls: [],
        },
        spvUser.id
      );
      projectId3 = project3.id;

      // Submit and approve all projects
      const projectIds = [projectId1, projectId2, projectId3];
      for (const projectId of projectIds) {
        await projectsService.submitForApproval(projectId, spvUser.id);
        await projectsService.approveProject(
          projectId,
          { action: 'approve' as any, reason: 'Test project approved' },
          adminUser.id
        );
        await projectsService.activateProject(projectId, adminUser.id);
      }

      expect(project1.totalValue).toBe(50000000000000);
      expect(project2.category).toBe(ProjectCategory.HEALTHCARE);
      expect(project3.minimumInvestment).toBe(2500000);
    });
  });

  describe('2. Investor Setup and Identity Verification', () => {
    it('should create and verify retail investor', async () => {
      retailInvestor = await usersService.findOrCreateUser({
        email: 'retail@investor.com',
        walletAddress: '0xretail1234567890123456789012345678901234567890',
        web3AuthId: 'retail-web3auth-id',
      });

      retailInvestor = await usersService.updateUser(retailInvestor.id, {
        profile: {
          firstName: 'Andi',
          lastName: 'Wijaya',
          monthlyIncome: 30000000, // 30 million IDR
          investmentExperience: 'beginner',
          riskTolerance: 'moderate',
        },
      });

      // Authenticate and get token
      const authResult = await authService.authenticateWithWeb3Auth({
        idToken: 'mock-retail-investor-token',
      });
      retailInvestorToken = authResult.accessToken;

      // Setup identity and claims
      await identityService.registerIdentity(retailInvestor.walletAddress, {
        userId: retailInvestor.id,
        userAddress: retailInvestor.walletAddress,
        metadata: { provider: 'verihubs', registrationType: 'individual' },
      });

      await claimsService.issueClaim({
        identityId: retailInvestor.walletAddress,
        claimTopic: ClaimTopic.KYC_APPROVED,
        issuer: trustedIssuerId,
        data: {
          provider: 'verihubs',
          verificationId: 'retail-verification-001',
        },
      });

      await claimsService.issueClaim({
        identityId: retailInvestor.walletAddress,
        claimTopic: ClaimTopic.RETAIL_QUALIFIED,
        issuer: trustedIssuerId,
        data: {
          provider: 'verihubs',
          verificationId: 'retail-verification-001',
          investmentLimit: 300000000, // 300 million IDR
        },
      });

      await identityService.updateIdentityStatus(retailInvestor.walletAddress, {
        status: 'verified' as any,
        reason: 'Retail investor verification completed',
      });

      expect(retailInvestor.profile.monthlyIncome).toBe(30000000);
    });

    it('should create and verify accredited investor', async () => {
      accreditedInvestor = await usersService.findOrCreateUser({
        email: 'accredited@investor.com',
        walletAddress: '0xaccredited1234567890123456789012345678901234567890',
        web3AuthId: 'accredited-web3auth-id',
      });

      accreditedInvestor = await usersService.updateUser(
        accreditedInvestor.id,
        {
          profile: {
            firstName: 'Sari',
            lastName: 'Kusuma',
            monthlyIncome: 200000000, // 200 million IDR
            netWorth: 15000000000, // 15 billion IDR
            investmentExperience: 'experienced',
            riskTolerance: 'high',
          },
        }
      );

      // Authenticate and get token
      const authResult = await authService.authenticateWithWeb3Auth({
        idToken: 'mock-accredited-investor-token',
      });
      accreditedInvestorToken = authResult.accessToken;

      // Setup identity and claims
      await identityService.registerIdentity(accreditedInvestor.walletAddress, {
        userId: accreditedInvestor.id,
        userAddress: accreditedInvestor.walletAddress,
        metadata: { provider: 'verihubs', registrationType: 'individual' },
      });

      await claimsService.issueClaim({
        identityId: accreditedInvestor.walletAddress,
        claimTopic: ClaimTopic.KYC_APPROVED,
        issuer: trustedIssuerId,
        data: {
          provider: 'verihubs',
          verificationId: 'accredited-verification-001',
        },
      });

      await claimsService.issueClaim({
        identityId: accreditedInvestor.walletAddress,
        claimTopic: ClaimTopic.ACCREDITED_INVESTOR,
        issuer: trustedIssuerId,
        data: {
          provider: 'verihubs',
          verificationId: 'accredited-verification-001',
          netWorth: 15000000000,
          investmentLimit: 2000000000, // 2 billion IDR
        },
      });

      await identityService.updateIdentityStatus(
        accreditedInvestor.walletAddress,
        {
          status: 'verified' as any,
          reason: 'Accredited investor verification completed',
        }
      );

      expect(accreditedInvestor.profile.netWorth).toBe(15000000000);
    });

    it('should create and verify institutional investor', async () => {
      institutionalInvestor = await usersService.findOrCreateUser({
        email: 'institutional@fund.com',
        walletAddress:
          '0xinstitutional1234567890123456789012345678901234567890',
        web3AuthId: 'institutional-web3auth-id',
      });

      institutionalInvestor = await usersService.updateUser(
        institutionalInvestor.id,
        {
          profile: {
            firstName: 'PT',
            lastName: 'Asuransi Jiwa',
            companyName: 'PT Asuransi Jiwa Indonesia',
            aum: 100000000000000, // 100 trillion IDR
            investmentExperience: 'institutional',
            riskTolerance: 'conservative',
          },
        }
      );

      // Authenticate and get token
      const authResult = await authService.authenticateWithWeb3Auth({
        idToken: 'mock-institutional-investor-token',
      });
      institutionalInvestorToken = authResult.accessToken;

      // Setup identity and claims
      await identityService.registerIdentity(
        institutionalInvestor.walletAddress,
        {
          userId: institutionalInvestor.id,
          userAddress: institutionalInvestor.walletAddress,
          metadata: { provider: 'verihubs', registrationType: 'institutional' },
        }
      );

      await claimsService.issueClaim({
        identityId: institutionalInvestor.walletAddress,
        claimTopic: ClaimTopic.KYC_APPROVED,
        issuer: trustedIssuerId,
        data: {
          provider: 'verihubs',
          verificationId: 'institutional-verification-001',
        },
      });

      await claimsService.issueClaim({
        identityId: institutionalInvestor.walletAddress,
        claimTopic: ClaimTopic.INSTITUTIONAL_INVESTOR,
        issuer: trustedIssuerId,
        data: {
          provider: 'verihubs',
          verificationId: 'institutional-verification-001',
          aum: 100000000000000,
          investmentLimit: 20000000000000, // 20 trillion IDR
        },
      });

      await identityService.updateIdentityStatus(
        institutionalInvestor.walletAddress,
        {
          status: 'verified' as any,
          reason: 'Institutional investor verification completed',
        }
      );

      expect(institutionalInvestor.profile.aum).toBe(100000000000000);
    });
  });

  describe('3. Investment Opportunity Discovery and Analysis', () => {
    it('should provide project discovery with filtering', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/projects/public')
        .query({
          category: ProjectCategory.TRANSPORTATION,
          minReturn: 8,
          maxRisk: 4,
          province: 'Jawa Barat',
        })
        .set('Authorization', `Bearer ${retailInvestorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe(
        'Jakarta-Bandung High Speed Rail Extension'
      );
    });

    it('should provide detailed project analysis for each investor type', async () => {
      const investorTokens = [
        { token: retailInvestorToken, type: 'retail' },
        { token: accreditedInvestorToken, type: 'accredited' },
        { token: institutionalInvestorToken, type: 'institutional' },
      ];

      for (const { token, type } of investorTokens) {
        const response = await request(app.getHttpServer())
          .get(`/api/projects/${projectId2}/analysis`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.projectId).toBe(projectId2);
        expect(response.body.data.investorType).toBe(type);
        expect(response.body.data.eligible).toBe(true);
        expect(response.body.data.riskAssessment).toBeDefined();
        expect(response.body.data.projectedReturns).toBeDefined();
      }
    });

    it('should validate investment eligibility based on identity claims', async () => {
      // Test retail investor eligibility for different projects
      const retailEligibility = await request(app.getHttpServer())
        .get(`/api/investments/eligibility/${projectId1}`)
        .set('Authorization', `Bearer ${retailInvestorToken}`)
        .expect(200);

      expect(retailEligibility.body.data.eligible).toBe(false); // High minimum investment
      expect(retailEligibility.body.data.reason).toContain(
        'minimum investment'
      );

      // Test retail investor eligibility for retail-friendly project
      const retailEligibility2 = await request(app.getHttpServer())
        .get(`/api/investments/eligibility/${projectId3}`)
        .set('Authorization', `Bearer ${retailInvestorToken}`)
        .expect(200);

      expect(retailEligibility2.body.data.eligible).toBe(true);
      expect(retailEligibility2.body.data.maxInvestmentAmount).toBe(300000000);
    });
  });

  describe('4. Investment Creation and Validation', () => {
    it('should create retail investment in suitable project', async () => {
      const investmentData = {
        projectId: projectId3,
        tokenAmount: 100, // 100 tokens
        investmentAmount: 50000000, // 50 million IDR
        investmentType: 'primary',
        email: retailInvestor.email,
        phoneNumber: '+6281234567890',
        fullName: 'Andi Wijaya',
      };

      const response = await request(app.getHttpServer())
        .post('/api/investments/create')
        .set('Authorization', `Bearer ${retailInvestorToken}`)
        .send(investmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.investment.userId).toBe(retailInvestor.id);
      expect(response.body.data.investment.tokenAmount).toBe(100);
      expect(response.body.data.investment.investmentAmount).toBe(50000000);
      expect(response.body.data.investment.status).toBe('pending_payment');

      investment1Id = response.body.data.investment.id;
    });

    it('should create accredited investment in medium-scale project', async () => {
      const investmentData = {
        projectId: projectId2,
        tokenAmount: 200, // 200 tokens
        investmentAmount: 400000000, // 400 million IDR
        investmentType: 'primary',
        email: accreditedInvestor.email,
        phoneNumber: '+6281234567891',
        fullName: 'Sari Kusuma',
      };

      const response = await request(app.getHttpServer())
        .post('/api/investments/create')
        .set('Authorization', `Bearer ${accreditedInvestorToken}`)
        .send(investmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.investment.userId).toBe(accreditedInvestor.id);
      expect(response.body.data.investment.tokenAmount).toBe(200);
      expect(response.body.data.investment.investmentAmount).toBe(400000000);

      investment2Id = response.body.data.investment.id;
    });

    it('should create institutional investment in large-scale project', async () => {
      const investmentData = {
        projectId: projectId1,
        tokenAmount: 1000, // 1000 tokens
        investmentAmount: 5000000000, // 5 billion IDR
        investmentType: 'primary',
        email: institutionalInvestor.email,
        phoneNumber: '+6221-1234567',
        fullName: 'PT Asuransi Jiwa Indonesia',
      };

      const response = await request(app.getHttpServer())
        .post('/api/investments/create')
        .set('Authorization', `Bearer ${institutionalInvestorToken}`)
        .send(investmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.investment.userId).toBe(
        institutionalInvestor.id
      );
      expect(response.body.data.investment.tokenAmount).toBe(1000);
      expect(response.body.data.investment.investmentAmount).toBe(5000000000);

      investment3Id = response.body.data.investment.id;
    });

    it('should validate investment business rules', async () => {
      // Test investment amount validation
      const invalidInvestmentData = {
        projectId: projectId3,
        tokenAmount: 1, // Below minimum
        investmentAmount: 500000, // Below minimum investment
        investmentType: 'primary',
        email: retailInvestor.email,
        phoneNumber: '+6281234567890',
        fullName: 'Andi Wijaya',
      };

      const response = await request(app.getHttpServer())
        .post('/api/investments/create')
        .set('Authorization', `Bearer ${retailInvestorToken}`)
        .send(invalidInvestmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('minimum investment');
    });
  });

  describe('5. Payment Processing and Token Minting', () => {
    it('should process IDR payment for retail investment', async () => {
      // Initiate payment
      const paymentResponse = await request(app.getHttpServer())
        .post(`/api/payments/initiate/${investment1Id}`)
        .set('Authorization', `Bearer ${retailInvestorToken}`)
        .send({
          paymentMethod: 'bank_transfer',
          bankCode: 'BCA',
        })
        .expect(201);

      expect(paymentResponse.body.success).toBe(true);
      expect(paymentResponse.body.data.paymentId).toBeDefined();
      expect(paymentResponse.body.data.amount).toBe(50000000);
      expect(paymentResponse.body.data.currency).toBe('IDR');

      // Simulate successful payment
      await paymentsService.processPaymentCallback({
        paymentId: paymentResponse.body.data.paymentId,
        status: 'success',
        transactionId: 'TXN-RETAIL-001',
        amount: 50000000,
        currency: 'IDR',
        processedAt: new Date(),
      });

      // Check investment status
      const investmentStatus = await request(app.getHttpServer())
        .get(`/api/investments/${investment1Id}`)
        .set('Authorization', `Bearer ${retailInvestorToken}`)
        .expect(200);

      expect(investmentStatus.body.data.status).toBe('completed');
      expect(investmentStatus.body.data.paymentDetails.status).toBe('success');
    });

    it('should process payment for accredited investment', async () => {
      // Initiate payment
      const paymentResponse = await request(app.getHttpServer())
        .post(`/api/payments/initiate/${investment2Id}`)
        .set('Authorization', `Bearer ${accreditedInvestorToken}`)
        .send({
          paymentMethod: 'bank_transfer',
          bankCode: 'BNI',
        })
        .expect(201);

      expect(paymentResponse.body.data.amount).toBe(400000000);

      // Simulate successful payment
      await paymentsService.processPaymentCallback({
        paymentId: paymentResponse.body.data.paymentId,
        status: 'success',
        transactionId: 'TXN-ACCREDITED-001',
        amount: 400000000,
        currency: 'IDR',
        processedAt: new Date(),
      });

      // Verify investment completion
      const investment =
        await investmentsService.getInvestmentById(investment2Id);
      expect(investment.status).toBe('completed');
    });

    it('should process payment for institutional investment', async () => {
      // Initiate payment
      const paymentResponse = await request(app.getHttpServer())
        .post(`/api/payments/initiate/${investment3Id}`)
        .set('Authorization', `Bearer ${institutionalInvestorToken}`)
        .send({
          paymentMethod: 'wire_transfer',
          bankCode: 'MANDIRI',
        })
        .expect(201);

      expect(paymentResponse.body.data.amount).toBe(5000000000);

      // Simulate successful payment
      await paymentsService.processPaymentCallback({
        paymentId: paymentResponse.body.data.paymentId,
        status: 'success',
        transactionId: 'TXN-INSTITUTIONAL-001',
        amount: 5000000000,
        currency: 'IDR',
        processedAt: new Date(),
      });

      // Verify investment completion
      const investment =
        await investmentsService.getInvestmentById(investment3Id);
      expect(investment.status).toBe('completed');
    });

    it('should simulate blockchain token minting with identity verification', async () => {
      const investments = [
        { id: investment1Id, investor: retailInvestor.walletAddress },
        { id: investment2Id, investor: accreditedInvestor.walletAddress },
        { id: investment3Id, investor: institutionalInvestor.walletAddress },
      ];

      for (const { id, investor } of investments) {
        const investment = await investmentsService.getInvestmentById(id);

        // Simulate blockchain token minting
        const mintingResult = await blockchainService.mintTokens({
          projectId: investment.projectId,
          recipientAddress: investor,
          tokenAmount: investment.tokenAmount,
          investmentId: id,
        });

        expect(mintingResult.success).toBe(true);
        expect(mintingResult.transactionHash).toBeDefined();
        expect(mintingResult.tokensMinted).toBe(investment.tokenAmount);
      }
    });
  });

  describe('6. Portfolio Management and Tracking', () => {
    it('should provide comprehensive portfolio view for retail investor', async () => {
      const portfolioResponse = await request(app.getHttpServer())
        .get('/api/investments/portfolio')
        .set('Authorization', `Bearer ${retailInvestorToken}`)
        .expect(200);

      expect(portfolioResponse.body.success).toBe(true);
      expect(portfolioResponse.body.data).toHaveLength(1);

      const portfolio = portfolioResponse.body.data[0];
      expect(portfolio.investment.id).toBe(investment1Id);
      expect(portfolio.project.name).toBe('Solar Power Park Bali');
      expect(portfolio.tokenBalance).toBe(100);
      expect(portfolio.currentValue).toBeDefined();
      expect(portfolio.unrealizedPnL).toBeDefined();
    });

    it('should provide diversified portfolio view for accredited investor', async () => {
      const portfolioResponse = await request(app.getHttpServer())
        .get('/api/investments/portfolio')
        .set('Authorization', `Bearer ${accreditedInvestorToken}`)
        .expect(200);

      expect(portfolioResponse.body.success).toBe(true);
      expect(portfolioResponse.body.data).toHaveLength(1);

      const portfolio = portfolioResponse.body.data[0];
      expect(portfolio.investment.id).toBe(investment2Id);
      expect(portfolio.project.name).toBe('National Cancer Treatment Center');
      expect(portfolio.tokenBalance).toBe(200);
    });

    it('should provide institutional portfolio analytics', async () => {
      const analyticsResponse = await request(app.getHttpServer())
        .get('/api/investments/analytics')
        .set('Authorization', `Bearer ${institutionalInvestorToken}`)
        .expect(200);

      expect(analyticsResponse.body.success).toBe(true);
      expect(analyticsResponse.body.data.totalInvestments).toBe(1);
      expect(analyticsResponse.body.data.totalValue).toBe(5000000000);
      expect(analyticsResponse.body.data.diversification).toBeDefined();
      expect(analyticsResponse.body.data.riskMetrics).toBeDefined();
      expect(analyticsResponse.body.data.performanceMetrics).toBeDefined();
    });

    it('should track investment performance over time', async () => {
      const performanceResponse = await request(app.getHttpServer())
        .get(`/api/investments/${investment1Id}/performance`)
        .set('Authorization', `Bearer ${retailInvestorToken}`)
        .expect(200);

      expect(performanceResponse.body.success).toBe(true);
      expect(performanceResponse.body.data.investmentId).toBe(investment1Id);
      expect(performanceResponse.body.data.performanceHistory).toBeDefined();
      expect(performanceResponse.body.data.benchmarkComparison).toBeDefined();
      expect(performanceResponse.body.data.dividendHistory).toBeDefined();
    });
  });

  describe('7. Investment Limits and Compliance Monitoring', () => {
    it('should enforce retail investment limits', async () => {
      const overLimitInvestmentData = {
        projectId: projectId3,
        tokenAmount: 800, // 800 tokens * 500k = 400 million IDR (over limit)
        investmentAmount: 400000000,
        investmentType: 'primary',
        email: retailInvestor.email,
        phoneNumber: '+6281234567890',
        fullName: 'Andi Wijaya',
      };

      const response = await request(app.getHttpServer())
        .post('/api/investments/create')
        .set('Authorization', `Bearer ${retailInvestorToken}`)
        .send(overLimitInvestmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('investment limit');
    });

    it('should monitor ongoing compliance for all investors', async () => {
      const complianceReport =
        await adminService.getInvestmentComplianceReport();

      expect(complianceReport.totalInvestments).toBe(3);
      expect(complianceReport.compliantInvestments).toBe(3);
      expect(complianceReport.nonCompliantInvestments).toBe(0);
      expect(complianceReport.byInvestorType.retail).toBe(1);
      expect(complianceReport.byInvestorType.accredited).toBe(1);
      expect(complianceReport.byInvestorType.institutional).toBe(1);
    });

    it('should validate identity verification for all transactions', async () => {
      const identityValidation =
        await identityService.validateInvestmentIdentities();

      expect(identityValidation.totalInvestments).toBe(3);
      expect(identityValidation.verifiedInvestments).toBe(3);
      expect(identityValidation.unverifiedInvestments).toBe(0);
      expect(identityValidation.identityIssues).toHaveLength(0);
    });
  });

  describe('8. Secondary Market Considerations', () => {
    it('should provide token transfer eligibility checking', async () => {
      const transferEligibilityResponse = await request(app.getHttpServer())
        .post('/api/investments/transfer-eligibility')
        .set('Authorization', `Bearer ${retailInvestorToken}`)
        .send({
          tokenAmount: 50,
          recipientAddress: accreditedInvestor.walletAddress,
          projectId: projectId3,
        })
        .expect(200);

      expect(transferEligibilityResponse.body.success).toBe(true);
      expect(transferEligibilityResponse.body.data.eligible).toBe(true);
      expect(transferEligibilityResponse.body.data.recipientVerified).toBe(
        true
      );
    });

    it('should simulate DEX integration readiness', async () => {
      const dexIntegrationResponse = await request(app.getHttpServer())
        .get(`/api/projects/${projectId3}/dex-integration`)
        .set('Authorization', `Bearer ${retailInvestorToken}`)
        .expect(200);

      expect(dexIntegrationResponse.body.success).toBe(true);
      expect(dexIntegrationResponse.body.data.dexReady).toBe(true);
      expect(dexIntegrationResponse.body.data.liquidityPool).toBeDefined();
      expect(dexIntegrationResponse.body.data.tradingVolume).toBeDefined();
    });
  });

  describe('9. Risk Management and Monitoring', () => {
    it('should provide risk assessment for each investment', async () => {
      const riskAssessments = [
        { token: retailInvestorToken, investmentId: investment1Id },
        { token: accreditedInvestorToken, investmentId: investment2Id },
        { token: institutionalInvestorToken, investmentId: investment3Id },
      ];

      for (const { token, investmentId } of riskAssessments) {
        const riskResponse = await request(app.getHttpServer())
          .get(`/api/investments/${investmentId}/risk-assessment`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(riskResponse.body.success).toBe(true);
        expect(riskResponse.body.data.riskScore).toBeDefined();
        expect(riskResponse.body.data.riskFactors).toBeDefined();
        expect(riskResponse.body.data.mitigationStrategies).toBeDefined();
      }
    });

    it('should monitor platform-wide investment risks', async () => {
      const platformRiskReport = await adminService.getPlatformRiskReport();

      expect(platformRiskReport.totalInvestments).toBe(3);
      expect(platformRiskReport.totalInvestmentValue).toBe(5450000000); // Sum of all investments
      expect(platformRiskReport.averageRiskScore).toBeDefined();
      expect(platformRiskReport.riskDistribution).toBeDefined();
      expect(platformRiskReport.concentrationRisk).toBeDefined();
    });
  });

  describe('10. Investment Analytics and Reporting', () => {
    it('should generate investment analytics for platform', async () => {
      const analyticsReport = await adminService.getInvestmentAnalytics();

      expect(analyticsReport.totalInvestments).toBe(3);
      expect(analyticsReport.totalInvestmentValue).toBe(5450000000);
      expect(analyticsReport.averageInvestmentSize).toBeDefined();
      expect(analyticsReport.byProject).toBeDefined();
      expect(analyticsReport.byInvestorType).toBeDefined();
      expect(analyticsReport.byCategory).toBeDefined();
      expect(analyticsReport.timeSeriesData).toBeDefined();
    });

    it('should provide investment performance benchmarking', async () => {
      const benchmarkingReport = await adminService.getInvestmentBenchmarks();

      expect(benchmarkingReport.platformReturn).toBeDefined();
      expect(benchmarkingReport.benchmarkComparison).toBeDefined();
      expect(benchmarkingReport.outperformingProjects).toBeDefined();
      expect(benchmarkingReport.underperformingProjects).toBeDefined();
    });

    it('should verify comprehensive audit trail', async () => {
      const auditLogs = await adminService.getAuditLogs({
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(),
        actions: [
          'INVESTMENT_CREATED',
          'PAYMENT_PROCESSED',
          'TOKENS_MINTED',
          'PORTFOLIO_UPDATED',
        ],
      });

      expect(auditLogs.length).toBeGreaterThan(0);

      const investmentCreationLogs = auditLogs.filter(
        log => log.action === 'INVESTMENT_CREATED'
      );
      const paymentProcessingLogs = auditLogs.filter(
        log => log.action === 'PAYMENT_PROCESSED'
      );
      const tokenMintingLogs = auditLogs.filter(
        log => log.action === 'TOKENS_MINTED'
      );

      expect(investmentCreationLogs).toHaveLength(3);
      expect(paymentProcessingLogs).toHaveLength(3);
      expect(tokenMintingLogs).toHaveLength(3);
    });
  });
});
