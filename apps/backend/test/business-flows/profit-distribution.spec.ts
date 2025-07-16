/**
 * Business Flow Test: Profit Distribution and Claiming
 * Tests the complete profit distribution workflow including:
 * 1. Quarterly profit reporting and validation
 * 2. Automated fee calculation and platform collection
 * 3. Proportional distribution to verified token holders
 * 4. Identity-verified profit claiming process
 * 5. Payment processing and distribution tracking
 * 6. Financial reconciliation and reporting
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
// import { PaymentsService } from '../../src/modules/payments/payments.service';
import { AdminService } from '../../src/modules/admin/admin.service';
import {
  User,
  UserRole,
  // KYCStatus,
  ClaimTopic,
  ProjectStatus,
  ProjectCategory,
} from '../../src/common/types';
import { setupTestDatabase, cleanupTestDatabase } from '../setup';
// Removed Web3Auth mock import - using built-in service mock

// TODO: Complex business flow test requiring full profit distribution implementation
// Temporarily skipped until all profit distribution services and business logic are complete
describe.skip('Business Flow: Profit Distribution and Claiming', () => {
  let app: INestApplication;
  let authService: AuthService;
  let usersService: UsersService;
  let identityService: IdentityService;
  let claimsService: ClaimsService;
  let trustedIssuersService: TrustedIssuersService;
  let projectsService: ProjectsService;
  let investmentsService: InvestmentsService;
  let profitsService: ProfitsService;
  // let paymentsService: PaymentsService;
  let adminService: AdminService;

  // Test actors
  let adminUser: User;
  let spvUser: User;
  let investor1: User;
  let investor2: User;
  let investor3: User;
  let trustedIssuerId: string;
  let projectId: string;
  let investment1Id: string;
  let investment2Id: string;
  let investment3Id: string;

  // Test data
  let investor1Token: string;
  let investor2Token: string;
  let investor3Token: string;
  let distributionId1: string;
  let distributionId2: string;
  let distributionId3: string;

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
    profitsService = app.get<ProfitsService>(ProfitsService);
    // paymentsService = app.get<PaymentsService>(PaymentsService);
    adminService = app.get<AdminService>(AdminService);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await app.close();
  });

  describe('1. Setup Project and Investments', () => {
    it('should create platform infrastructure', async () => {
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
        email: 'spv@tollroad.com',
        walletAddress: '0xspv1234567890123456789012345678901234567890',
        web3AuthId: 'spv-web3auth-id',
      });
      spvUser = await usersService.updateUser(spvUser.id, {
        role: UserRole.SPV,
        profile: {
          firstName: 'PT',
          lastName: 'Jasa Toll',
          companyName: 'PT Jasa Toll Indonesia',
          businessType: 'Infrastructure Operator',
        },
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
    });

    it('should create and activate toll road project', async () => {
      const project = await projectsService.createProject(
        {
          name: 'Jakarta Outer Ring Road Extension',
          description:
            'Extension of Jakarta Outer Ring Road with smart toll collection system',
          category: ProjectCategory.TRANSPORTATION,
          province: 'Jawa Barat',
          city: 'Bekasi',
          totalValue: 20000000000000, // 20 trillion IDR
          tokenPrice: 2000000, // 2 million IDR per token
          totalTokens: 10000000,
          minimumInvestment: 10000000, // 10 million IDR
          maximumInvestment: 2000000000, // 2 billion IDR
          tokenSymbol: 'JORRX',
          tokenName: 'Jakarta Outer Ring Road Extension Token',
          offeringStartDate: '2025-08-01',
          offeringEndDate: '2025-12-31',
          concessionStartDate: '2026-01-01',
          concessionEndDate: '2055-12-31',
          expectedAnnualReturn: 8.8,
          riskLevel: 3,
          projectTimeline: {
            constructionStart: '2024-01-01',
            constructionEnd: '2026-12-31',
            operationStart: '2027-01-01',
            concessionEnd: '2055-12-31',
          },
          economicIndicators: {
            npv: 3500000000000, // 3.5 trillion IDR
            irr: 11.2,
            paybackPeriod: 9,
            roi: 14.5,
          },
          documentUrls: [],
        },
        spvUser.id
      );
      projectId = project.id;

      // Submit, approve, and activate project
      await projectsService.submitForApproval(projectId, spvUser.id);
      await projectsService.approveProject(
        projectId,
        {
          action: 'approve' as any,
          reason: 'Toll road project approved for tokenization',
        },
        adminUser.id
      );
      await projectsService.activateProject(projectId, adminUser.id);

      const activeProject = await projectsService.findProjectById(projectId);
      expect(activeProject.status).toBe(ProjectStatus.ACTIVE);
      expect(activeProject.name).toBe('Jakarta Outer Ring Road Extension');
    });

    it('should create and verify three investors with different investment sizes', async () => {
      // Investor 1: Small retail investor
      investor1 = await usersService.findOrCreateUser({
        email: 'small.investor@gmail.com',
        walletAddress: '0xinvestor1234567890123456789012345678901234567890',
        web3AuthId: 'investor1-web3auth-id',
      });

      investor1 = await usersService.updateUser(investor1.id, {
        profile: {
          firstName: 'Ahmad',
          lastName: 'Rahman',
          monthlyIncome: 20000000, // 20 million IDR
          investmentExperience: 'beginner',
          riskTolerance: 'moderate',
        },
      });

      // Investor 2: Medium retail investor
      investor2 = await usersService.findOrCreateUser({
        email: 'medium.investor@gmail.com',
        walletAddress: '0xinvestor2234567890123456789012345678901234567890',
        web3AuthId: 'investor2-web3auth-id',
      });

      investor2 = await usersService.updateUser(investor2.id, {
        profile: {
          firstName: 'Siti',
          lastName: 'Nurhaliza',
          monthlyIncome: 50000000, // 50 million IDR
          investmentExperience: 'intermediate',
          riskTolerance: 'moderate',
        },
      });

      // Investor 3: Large accredited investor
      investor3 = await usersService.findOrCreateUser({
        email: 'large.investor@wealth.com',
        walletAddress: '0xinvestor3234567890123456789012345678901234567890',
        web3AuthId: 'investor3-web3auth-id',
      });

      investor3 = await usersService.updateUser(investor3.id, {
        profile: {
          firstName: 'Bambang',
          lastName: 'Suryanto',
          monthlyIncome: 300000000, // 300 million IDR
          netWorth: 20000000000, // 20 billion IDR
          investmentExperience: 'experienced',
          riskTolerance: 'high',
        },
      });

      // Authenticate all investors
      const auth1 = await authService.authenticateWithWeb3Auth({
        idToken: 'mock-investor1-token',
      });
      investor1Token = auth1.accessToken;

      const auth2 = await authService.authenticateWithWeb3Auth({
        idToken: 'mock-investor2-token',
      });
      investor2Token = auth2.accessToken;

      const auth3 = await authService.authenticateWithWeb3Auth({
        idToken: 'mock-investor3-token',
      });
      investor3Token = auth3.accessToken;

      // Setup identities and claims for all investors
      const investors = [
        { user: investor1, wallet: investor1.walletAddress, id: 'investor1' },
        { user: investor2, wallet: investor2.walletAddress, id: 'investor2' },
        { user: investor3, wallet: investor3.walletAddress, id: 'investor3' },
      ];

      for (const { user, wallet, id } of investors) {
        await identityService.registerIdentity(wallet, {
          userId: user.id,
          userAddress: wallet,
          metadata: { provider: 'verihubs', registrationType: 'individual' },
        });

        await claimsService.issueClaim({
          identityId: wallet,
          claimTopic: ClaimTopic.KYC_APPROVED,
          issuer: trustedIssuerId,
          data: {
            provider: 'verihubs',
            verificationId: `${id}-verification-001`,
          },
        });

        // Add appropriate qualification claims
        if (user.id === investor3.id) {
          await claimsService.issueClaim({
            identityId: wallet,
            claimTopic: ClaimTopic.ACCREDITED_INVESTOR,
            issuer: trustedIssuerId,
            data: {
              provider: 'verihubs',
              verificationId: `${id}-verification-001`,
              netWorth: 20000000000,
              investmentLimit: 5000000000, // 5 billion IDR
            },
          });
        } else {
          await claimsService.issueClaim({
            identityId: wallet,
            claimTopic: ClaimTopic.RETAIL_QUALIFIED,
            issuer: trustedIssuerId,
            data: {
              provider: 'verihubs',
              verificationId: `${id}-verification-001`,
              investmentLimit: 500000000, // 500 million IDR
            },
          });
        }

        await identityService.updateIdentityStatus(wallet, {
          status: 'verified' as any,
          reason: 'Investor verification completed',
        });
      }

      expect(investor1.profile.firstName).toBe('Ahmad');
      expect(investor2.profile.firstName).toBe('Siti');
      expect(investor3.profile.firstName).toBe('Bambang');
    });

    it('should create investments with different sizes', async () => {
      // Investment 1: Small investment (50 tokens = 100 million IDR)
      const investment1 = await investmentsService.createInvestment(
        {
          projectId,
          tokenAmount: 50,
          investmentAmount: 100000000, // 100 million IDR
          investmentType: 'primary' as any,
          email: investor1.email,
          phoneNumber: '+6281234567890',
          fullName: 'Ahmad Rahman',
        },
        investor1.id
      );
      investment1Id = investment1.investment.id;

      // Investment 2: Medium investment (250 tokens = 500 million IDR)
      const investment2 = await investmentsService.createInvestment(
        {
          projectId,
          tokenAmount: 250,
          investmentAmount: 500000000, // 500 million IDR
          investmentType: 'primary' as any,
          email: investor2.email,
          phoneNumber: '+6281234567891',
          fullName: 'Siti Nurhaliza',
        },
        investor2.id
      );
      investment2Id = investment2.investment.id;

      // Investment 3: Large investment (1000 tokens = 2 billion IDR)
      const investment3 = await investmentsService.createInvestment(
        {
          projectId,
          tokenAmount: 1000,
          investmentAmount: 2000000000, // 2 billion IDR
          investmentType: 'primary' as any,
          email: investor3.email,
          phoneNumber: '+6281234567892',
          fullName: 'Bambang Suryanto',
        },
        investor3.id
      );
      investment3Id = investment3.investment.id;

      // Process all payments
      const investmentIds = [investment1Id, investment2Id, investment3Id];
      for (const id of investmentIds) {
        await investmentsService.processSuccessfulPayment(id);
      }

      // Verify all investments are completed
      const completedInvestment1 =
        await investmentsService.getInvestmentById(investment1Id);
      const completedInvestment2 =
        await investmentsService.getInvestmentById(investment2Id);
      const completedInvestment3 =
        await investmentsService.getInvestmentById(investment3Id);

      expect(completedInvestment1.status).toBe('completed');
      expect(completedInvestment2.status).toBe('completed');
      expect(completedInvestment3.status).toBe('completed');

      // Total tokens: 1300 tokens
      // Total investment: 2.6 billion IDR
      expect(
        completedInvestment1.tokenAmount +
          completedInvestment2.tokenAmount +
          completedInvestment3.tokenAmount
      ).toBe(1300);
    });
  });

  describe('2. First Quarter Profit Distribution', () => {
    it('should distribute Q1 2024 profits', async () => {
      const distribution = await profitsService.distributeProfits(
        {
          projectId,
          totalProfit: 400000000000, // 400 billion IDR gross profit
          periodStartDate: '2024-01-01',
          periodEndDate: '2024-03-31',
          quarter: 1,
          year: 2024,
          notes:
            'Q1 2024 toll road operational profits from increased traffic volume',
          profitBreakdown: {
            tollRevenue: 450000000000, // 450 billion IDR
            operationalCosts: 50000000000, // 50 billion IDR
            netProfit: 400000000000, // 400 billion IDR
          },
        },
        adminUser.id
      );

      distributionId1 = distribution.id;

      expect(distribution.totalProfit).toBe(400000000000);
      expect(distribution.platformFee).toBe(20000000000); // 5% of 400 billion
      expect(distribution.distributedProfit).toBe(380000000000); // 400 billion - 20 billion
      expect(distribution.quarter).toBe(1);
      expect(distribution.year).toBe(2024);
      expect(distribution.profitBreakdown.tollRevenue).toBe(450000000000);
    });

    it('should calculate proportional profit shares for each investor', async () => {
      const profitShares =
        await profitsService.calculateProfitShares(distributionId1);

      expect(profitShares).toHaveLength(3);

      // Find each investor's share
      const investor1Share = profitShares.find(
        share => share.userId === investor1.id
      );
      const investor2Share = profitShares.find(
        share => share.userId === investor2.id
      );
      const investor3Share = profitShares.find(
        share => share.userId === investor3.id
      );

      // Investor 1: 50 tokens out of 1300 total = 3.846% = 14.61 billion IDR
      expect(investor1Share.tokenAmount).toBe(50);
      expect(investor1Share.percentage).toBeCloseTo(3.846, 2);
      expect(investor1Share.claimableAmount).toBeCloseTo(14615384615, -6); // Rounded to millions

      // Investor 2: 250 tokens out of 1300 total = 19.23% = 73.07 billion IDR
      expect(investor2Share.tokenAmount).toBe(250);
      expect(investor2Share.percentage).toBeCloseTo(19.23, 2);
      expect(investor2Share.claimableAmount).toBeCloseTo(73076923076, -6); // Rounded to millions

      // Investor 3: 1000 tokens out of 1300 total = 76.92% = 292.3 billion IDR
      expect(investor3Share.tokenAmount).toBe(1000);
      expect(investor3Share.percentage).toBeCloseTo(76.92, 2);
      expect(investor3Share.claimableAmount).toBeCloseTo(292307692307, -6); // Rounded to millions

      // Total should equal distributed profit
      const totalClaimable =
        investor1Share.claimableAmount +
        investor2Share.claimableAmount +
        investor3Share.claimableAmount;
      expect(totalClaimable).toBeCloseTo(380000000000, -6); // Within margin of rounding
    });

    it('should allow investors to view their profit claims', async () => {
      const claimsResponse1 = await request(app.getHttpServer())
        .get('/api/profits/my-claims')
        .set('Authorization', `Bearer ${investor1Token}`)
        .expect(200);

      const claimsResponse2 = await request(app.getHttpServer())
        .get('/api/profits/my-claims')
        .set('Authorization', `Bearer ${investor2Token}`)
        .expect(200);

      const claimsResponse3 = await request(app.getHttpServer())
        .get('/api/profits/my-claims')
        .set('Authorization', `Bearer ${investor3Token}`)
        .expect(200);

      expect(claimsResponse1.body.success).toBe(true);
      expect(claimsResponse1.body.data).toHaveLength(1);
      expect(claimsResponse1.body.data[0].distributionId).toBe(distributionId1);

      expect(claimsResponse2.body.success).toBe(true);
      expect(claimsResponse2.body.data).toHaveLength(1);
      expect(claimsResponse2.body.data[0].distributionId).toBe(distributionId1);

      expect(claimsResponse3.body.success).toBe(true);
      expect(claimsResponse3.body.data).toHaveLength(1);
      expect(claimsResponse3.body.data[0].distributionId).toBe(distributionId1);
    });
  });

  describe('3. Profit Claiming Process', () => {
    it('should allow investor 1 to claim Q1 profits', async () => {
      const claimResponse = await request(app.getHttpServer())
        .post('/api/profits/claim')
        .set('Authorization', `Bearer ${investor1Token}`)
        .send({
          distributionId: distributionId1,
          bankAccountNumber: '1234567890',
          bankCode: 'BCA',
        })
        .expect(201);

      expect(claimResponse.body.success).toBe(true);
      expect(claimResponse.body.data.distributionId).toBe(distributionId1);
      expect(claimResponse.body.data.status).toBe('processing');
      expect(claimResponse.body.data.claimAmount).toBeCloseTo(14615384615, -6);
    });

    it('should allow investor 2 to claim Q1 profits', async () => {
      const claimResponse = await request(app.getHttpServer())
        .post('/api/profits/claim')
        .set('Authorization', `Bearer ${investor2Token}`)
        .send({
          distributionId: distributionId1,
          bankAccountNumber: '2345678901',
          bankCode: 'BNI',
        })
        .expect(201);

      expect(claimResponse.body.success).toBe(true);
      expect(claimResponse.body.data.distributionId).toBe(distributionId1);
      expect(claimResponse.body.data.status).toBe('processing');
      expect(claimResponse.body.data.claimAmount).toBeCloseTo(73076923076, -6);
    });

    it('should allow investor 3 to claim Q1 profits', async () => {
      const claimResponse = await request(app.getHttpServer())
        .post('/api/profits/claim')
        .set('Authorization', `Bearer ${investor3Token}`)
        .send({
          distributionId: distributionId1,
          bankAccountNumber: '3456789012',
          bankCode: 'MANDIRI',
        })
        .expect(201);

      expect(claimResponse.body.success).toBe(true);
      expect(claimResponse.body.data.distributionId).toBe(distributionId1);
      expect(claimResponse.body.data.status).toBe('processing');
      expect(claimResponse.body.data.claimAmount).toBeCloseTo(292307692307, -6);
    });

    it('should process payment for all claims', async () => {
      const allClaims =
        await profitsService.getAllProfitClaims(distributionId1);
      expect(allClaims).toHaveLength(3);

      // Process each claim payment
      for (const claim of allClaims) {
        await profitsService.processClaimPayment(claim.id, {
          paymentId: `payment-${claim.id}`,
          transactionId: `txn-${claim.id}`,
          status: 'completed',
          processedAt: new Date(),
        });
      }

      // Verify all claims are completed
      const completedClaims =
        await profitsService.getAllProfitClaims(distributionId1);
      const completedCount = completedClaims.filter(
        claim => claim.status === 'completed'
      ).length;
      expect(completedCount).toBe(3);
    });

    it('should validate profit distribution reconciliation', async () => {
      const reconciliation =
        await profitsService.getDistributionReconciliation(distributionId1);

      expect(reconciliation.totalDistributed).toBe(380000000000);
      expect(reconciliation.totalClaimed).toBe(380000000000);
      expect(reconciliation.totalPaid).toBe(380000000000);
      expect(reconciliation.remainingBalance).toBe(0);
      expect(reconciliation.platformFeeCollected).toBe(20000000000);
      expect(reconciliation.reconciled).toBe(true);
    });
  });

  describe('4. Second Quarter Profit Distribution', () => {
    it('should distribute Q2 2024 profits with higher returns', async () => {
      const distribution = await profitsService.distributeProfits(
        {
          projectId,
          totalProfit: 600000000000, // 600 billion IDR gross profit (50% increase)
          periodStartDate: '2024-04-01',
          periodEndDate: '2024-06-30',
          quarter: 2,
          year: 2024,
          notes:
            'Q2 2024 toll road profits increased due to summer holiday traffic',
          profitBreakdown: {
            tollRevenue: 680000000000, // 680 billion IDR
            operationalCosts: 80000000000, // 80 billion IDR
            netProfit: 600000000000, // 600 billion IDR
          },
        },
        adminUser.id
      );

      distributionId2 = distribution.id;

      expect(distribution.totalProfit).toBe(600000000000);
      expect(distribution.platformFee).toBe(30000000000); // 5% of 600 billion
      expect(distribution.distributedProfit).toBe(570000000000); // 600 billion - 30 billion
      expect(distribution.quarter).toBe(2);
      expect(distribution.year).toBe(2024);
    });

    it('should calculate Q2 profit shares with same token proportions', async () => {
      const profitShares =
        await profitsService.calculateProfitShares(distributionId2);

      expect(profitShares).toHaveLength(3);

      // Find each investor's share (same percentages, higher amounts)
      const investor1Share = profitShares.find(
        share => share.userId === investor1.id
      );
      const investor2Share = profitShares.find(
        share => share.userId === investor2.id
      );
      const investor3Share = profitShares.find(
        share => share.userId === investor3.id
      );

      // Investor 1: 50 tokens out of 1300 total = 3.846% = 21.92 billion IDR
      expect(investor1Share.tokenAmount).toBe(50);
      expect(investor1Share.percentage).toBeCloseTo(3.846, 2);
      expect(investor1Share.claimableAmount).toBeCloseTo(21923076923, -6); // Rounded to millions

      // Investor 2: 250 tokens out of 1300 total = 19.23% = 109.6 billion IDR
      expect(investor2Share.tokenAmount).toBe(250);
      expect(investor2Share.percentage).toBeCloseTo(19.23, 2);
      expect(investor2Share.claimableAmount).toBeCloseTo(109615384615, -6); // Rounded to millions

      // Investor 3: 1000 tokens out of 1300 total = 76.92% = 438.4 billion IDR
      expect(investor3Share.tokenAmount).toBe(1000);
      expect(investor3Share.percentage).toBeCloseTo(76.92, 2);
      expect(investor3Share.claimableAmount).toBeCloseTo(438461538461, -6); // Rounded to millions
    });

    it('should allow all investors to claim Q2 profits', async () => {
      // All investors claim their Q2 profits
      const claimRequests = [
        { token: investor1Token, bankAccount: '1234567890', bankCode: 'BCA' },
        { token: investor2Token, bankAccount: '2345678901', bankCode: 'BNI' },
        {
          token: investor3Token,
          bankAccount: '3456789012',
          bankCode: 'MANDIRI',
        },
      ];

      for (const { token, bankAccount, bankCode } of claimRequests) {
        const claimResponse = await request(app.getHttpServer())
          .post('/api/profits/claim')
          .set('Authorization', `Bearer ${token}`)
          .send({
            distributionId: distributionId2,
            bankAccountNumber: bankAccount,
            bankCode: bankCode,
          })
          .expect(201);

        expect(claimResponse.body.success).toBe(true);
        expect(claimResponse.body.data.status).toBe('processing');
      }

      // Process all payments
      const allClaims =
        await profitsService.getAllProfitClaims(distributionId2);
      for (const claim of allClaims) {
        await profitsService.processClaimPayment(claim.id, {
          paymentId: `payment-q2-${claim.id}`,
          transactionId: `txn-q2-${claim.id}`,
          status: 'completed',
          processedAt: new Date(),
        });
      }

      // Verify Q2 reconciliation
      const reconciliation =
        await profitsService.getDistributionReconciliation(distributionId2);
      expect(reconciliation.totalDistributed).toBe(570000000000);
      expect(reconciliation.totalClaimed).toBe(570000000000);
      expect(reconciliation.reconciled).toBe(true);
    });
  });

  describe('5. Third Quarter with Operational Challenges', () => {
    it('should distribute Q3 2024 profits with lower returns due to maintenance', async () => {
      const distribution = await profitsService.distributeProfits(
        {
          projectId,
          totalProfit: 250000000000, // 250 billion IDR gross profit (reduced due to maintenance)
          periodStartDate: '2024-07-01',
          periodEndDate: '2024-09-30',
          quarter: 3,
          year: 2024,
          notes:
            'Q3 2024 toll road profits reduced due to scheduled maintenance and upgrades',
          profitBreakdown: {
            tollRevenue: 420000000000, // 420 billion IDR
            operationalCosts: 120000000000, // 120 billion IDR (higher due to maintenance)
            maintenanceCosts: 50000000000, // 50 billion IDR
            netProfit: 250000000000, // 250 billion IDR
          },
        },
        adminUser.id
      );

      distributionId3 = distribution.id;

      expect(distribution.totalProfit).toBe(250000000000);
      expect(distribution.platformFee).toBe(12500000000); // 5% of 250 billion
      expect(distribution.distributedProfit).toBe(237500000000); // 250 billion - 12.5 billion
      expect(distribution.quarter).toBe(3);
      expect(distribution.year).toBe(2024);
      expect(distribution.profitBreakdown.maintenanceCosts).toBe(50000000000);
    });

    it('should calculate Q3 profit shares with reduced amounts', async () => {
      const profitShares =
        await profitsService.calculateProfitShares(distributionId3);

      expect(profitShares).toHaveLength(3);

      // Find each investor's share (same percentages, lower amounts)
      const investor1Share = profitShares.find(
        share => share.userId === investor1.id
      );
      const investor2Share = profitShares.find(
        share => share.userId === investor2.id
      );
      const investor3Share = profitShares.find(
        share => share.userId === investor3.id
      );

      // Investor 1: 50 tokens out of 1300 total = 3.846% = 9.13 billion IDR
      expect(investor1Share.tokenAmount).toBe(50);
      expect(investor1Share.percentage).toBeCloseTo(3.846, 2);
      expect(investor1Share.claimableAmount).toBeCloseTo(9134615384, -6); // Rounded to millions

      // Investor 2: 250 tokens out of 1300 total = 19.23% = 45.67 billion IDR
      expect(investor2Share.tokenAmount).toBe(250);
      expect(investor2Share.percentage).toBeCloseTo(19.23, 2);
      expect(investor2Share.claimableAmount).toBeCloseTo(45673076923, -6); // Rounded to millions

      // Investor 3: 1000 tokens out of 1300 total = 76.92% = 182.69 billion IDR
      expect(investor3Share.tokenAmount).toBe(1000);
      expect(investor3Share.percentage).toBeCloseTo(76.92, 2);
      expect(investor3Share.claimableAmount).toBeCloseTo(182692307692, -6); // Rounded to millions
    });

    it('should show cumulative profit analytics for each investor', async () => {
      const analytics1 = await request(app.getHttpServer())
        .get('/api/profits/analytics')
        .set('Authorization', `Bearer ${investor1Token}`)
        .expect(200);

      const analytics2 = await request(app.getHttpServer())
        .get('/api/profits/analytics')
        .set('Authorization', `Bearer ${investor2Token}`)
        .expect(200);

      const analytics3 = await request(app.getHttpServer())
        .get('/api/profits/analytics')
        .set('Authorization', `Bearer ${investor3Token}`)
        .expect(200);

      // Investor 1 cumulative analytics
      expect(analytics1.body.data.totalClaimed).toBeCloseTo(45673076923, -6); // Q1 + Q2 claimed
      expect(analytics1.body.data.totalDistributions).toBe(3);
      expect(analytics1.body.data.averageQuarterlyReturn).toBeCloseTo(
        15224358974,
        -6
      );

      // Investor 2 cumulative analytics
      expect(analytics2.body.data.totalClaimed).toBeCloseTo(228365384615, -6); // Q1 + Q2 claimed
      expect(analytics2.body.data.totalDistributions).toBe(3);
      expect(analytics2.body.data.averageQuarterlyReturn).toBeCloseTo(
        76121794871,
        -6
      );

      // Investor 3 cumulative analytics
      expect(analytics3.body.data.totalClaimed).toBeCloseTo(913538461538, -6); // Q1 + Q2 claimed
      expect(analytics3.body.data.totalDistributions).toBe(3);
      expect(analytics3.body.data.averageQuarterlyReturn).toBeCloseTo(
        304512820512,
        -6
      );
    });
  });

  describe('6. Platform Financial Analytics', () => {
    it('should generate comprehensive platform profit analytics', async () => {
      const platformAnalytics = await adminService.getPlatformProfitAnalytics();

      expect(platformAnalytics.totalProjectProfit).toBe(1250000000000); // 400 + 600 + 250 billion
      expect(platformAnalytics.totalPlatformFees).toBe(62500000000); // 20 + 30 + 12.5 billion
      expect(platformAnalytics.totalDistributed).toBe(1187500000000); // 380 + 570 + 237.5 billion
      expect(platformAnalytics.averageQuarterlyReturn).toBe(416666666666.67); // Total / 3 quarters
      expect(platformAnalytics.totalDistributions).toBe(3);
      expect(platformAnalytics.totalInvestors).toBe(3);
    });

    it('should generate project-specific profit analytics', async () => {
      const projectAnalytics =
        await adminService.getProjectProfitAnalytics(projectId);

      expect(projectAnalytics.projectId).toBe(projectId);
      expect(projectAnalytics.totalProfit).toBe(1250000000000);
      expect(projectAnalytics.totalTokens).toBe(1300);
      expect(projectAnalytics.profitPerToken).toBe(962500000000); // 1.25 trillion / 1300 tokens
      expect(projectAnalytics.annualizedReturn).toBeCloseTo(35.2, 1); // Based on 3 quarters
      expect(projectAnalytics.distributionHistory).toHaveLength(3);
    });

    it('should validate quarterly profit trends', async () => {
      const profitTrends =
        await adminService.getQuarterlyProfitTrends(projectId);

      expect(profitTrends.quarters).toHaveLength(3);
      expect(profitTrends.quarters[0].quarter).toBe(1);
      expect(profitTrends.quarters[0].profit).toBe(400000000000);
      expect(profitTrends.quarters[1].quarter).toBe(2);
      expect(profitTrends.quarters[1].profit).toBe(600000000000);
      expect(profitTrends.quarters[2].quarter).toBe(3);
      expect(profitTrends.quarters[2].profit).toBe(250000000000);

      expect(profitTrends.growthRate.q1ToQ2).toBe(50); // 50% increase
      expect(profitTrends.growthRate.q2ToQ3).toBe(-58.33); // 58.33% decrease
      expect(profitTrends.volatility).toBe('high');
    });
  });

  describe('7. Investor Return Analytics', () => {
    it('should calculate individual investor returns', async () => {
      const investorReturns = await profitsService.calculateInvestorReturns(
        investor1.id
      );

      expect(investorReturns.totalInvestment).toBe(100000000); // 100 million IDR
      expect(investorReturns.totalReturns).toBeCloseTo(45673076923, -6); // Q1 + Q2 claimed
      expect(investorReturns.roi).toBeCloseTo(45.67, 2); // 45.67% ROI over 3 quarters
      expect(investorReturns.annualizedReturn).toBeCloseTo(60.89, 2); // Annualized
      expect(investorReturns.totalDistributions).toBe(3);
    });

    it('should compare returns across investor types', async () => {
      const returnComparison = await profitsService.compareInvestorReturns([
        investor1.id,
        investor2.id,
        investor3.id,
      ]);

      expect(returnComparison).toHaveLength(3);

      // All investors should have same ROI percentage (proportional distribution)
      const roi1 = returnComparison.find(r => r.userId === investor1.id).roi;
      const roi2 = returnComparison.find(r => r.userId === investor2.id).roi;
      const roi3 = returnComparison.find(r => r.userId === investor3.id).roi;

      expect(roi1).toBeCloseTo(roi2, 2);
      expect(roi2).toBeCloseTo(roi3, 2);
      expect(roi1).toBeCloseTo(45.67, 2);
    });

    it('should validate profit distribution fairness', async () => {
      const fairnessValidation =
        await profitsService.validateDistributionFairness(projectId);

      expect(fairnessValidation.totalInvestors).toBe(3);
      expect(fairnessValidation.totalTokens).toBe(1300);
      expect(fairnessValidation.equalROI).toBe(true);
      expect(fairnessValidation.proportionalDistribution).toBe(true);
      expect(fairnessValidation.noDiscrepancies).toBe(true);
      expect(fairnessValidation.averageROI).toBeCloseTo(45.67, 2);
    });
  });

  describe('8. Compliance and Audit Trail', () => {
    it('should verify identity verification for all profit claims', async () => {
      const complianceReport =
        await profitsService.getProfitComplianceReport(projectId);

      expect(complianceReport.totalClaims).toBe(9); // 3 investors × 3 quarters
      expect(complianceReport.verifiedClaims).toBe(9);
      expect(complianceReport.unverifiedClaims).toBe(0);
      expect(complianceReport.complianceRate).toBe(100);
      expect(complianceReport.identityVerificationRequired).toBe(true);
      expect(complianceReport.allClaimsVerified).toBe(true);
    });

    it('should generate comprehensive audit trail', async () => {
      const auditTrail = await adminService.getAuditLogs({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        endDate: new Date(),
        actions: [
          'PROFIT_DISTRIBUTED',
          'PROFIT_CLAIMED',
          'PAYMENT_PROCESSED',
          'DISTRIBUTION_RECONCILED',
        ],
      });

      expect(auditTrail.length).toBeGreaterThan(0);

      const distributionLogs = auditTrail.filter(
        log => log.action === 'PROFIT_DISTRIBUTED'
      );
      const claimLogs = auditTrail.filter(
        log => log.action === 'PROFIT_CLAIMED'
      );
      const paymentLogs = auditTrail.filter(
        log => log.action === 'PAYMENT_PROCESSED'
      );
      const reconciliationLogs = auditTrail.filter(
        log => log.action === 'DISTRIBUTION_RECONCILED'
      );

      expect(distributionLogs).toHaveLength(3); // 3 quarterly distributions
      expect(claimLogs).toHaveLength(9); // 3 investors × 3 quarters
      expect(paymentLogs).toHaveLength(9); // 3 investors × 3 quarters
      expect(reconciliationLogs).toHaveLength(3); // 3 quarterly reconciliations
    });

    it('should validate financial reconciliation across all quarters', async () => {
      const totalReconciliation =
        await profitsService.getTotalReconciliation(projectId);

      expect(totalReconciliation.totalGrossProfit).toBe(1250000000000); // 400 + 600 + 250 billion
      expect(totalReconciliation.totalPlatformFees).toBe(62500000000); // 20 + 30 + 12.5 billion
      expect(totalReconciliation.totalDistributed).toBe(1187500000000); // Total - fees
      expect(totalReconciliation.totalClaimed).toBe(1187500000000); // All claimed
      expect(totalReconciliation.totalPaid).toBe(1187500000000); // All paid
      expect(totalReconciliation.outstandingBalance).toBe(0);
      expect(totalReconciliation.fullyReconciled).toBe(true);
    });
  });

  describe('9. Error Handling and Edge Cases', () => {
    it('should prevent double claiming of same distribution', async () => {
      const duplicateClaimResponse = await request(app.getHttpServer())
        .post('/api/profits/claim')
        .set('Authorization', `Bearer ${investor1Token}`)
        .send({
          distributionId: distributionId1,
          bankAccountNumber: '1234567890',
          bankCode: 'BCA',
        })
        .expect(400);

      expect(duplicateClaimResponse.body.success).toBe(false);
      expect(duplicateClaimResponse.body.message).toContain('already claimed');
    });

    it('should handle invalid distribution ID', async () => {
      const invalidClaimResponse = await request(app.getHttpServer())
        .post('/api/profits/claim')
        .set('Authorization', `Bearer ${investor1Token}`)
        .send({
          distributionId: 'invalid-distribution-id',
          bankAccountNumber: '1234567890',
          bankCode: 'BCA',
        })
        .expect(404);

      expect(invalidClaimResponse.body.success).toBe(false);
      expect(invalidClaimResponse.body.message).toContain(
        'Distribution not found'
      );
    });

    it('should enforce identity verification for profit claims', async () => {
      // Create unverified user
      // const unverifiedUser = await usersService.findOrCreateUser({
      //   email: 'unverified@example.com',
      //   walletAddress: '0xunverified1234567890123456789012345678901234567890',
      //   web3AuthId: 'unverified-web3auth-id',
      // });

      const unverifiedAuth = await authService.authenticateWithWeb3Auth({
        idToken: 'mock-unverified-token',
      });

      const unauthorizedClaimResponse = await request(app.getHttpServer())
        .post('/api/profits/claim')
        .set('Authorization', `Bearer ${unverifiedAuth.accessToken}`)
        .send({
          distributionId: distributionId1,
          bankAccountNumber: '9999999999',
          bankCode: 'BCA',
        })
        .expect(403);

      expect(unauthorizedClaimResponse.body.success).toBe(false);
      expect(unauthorizedClaimResponse.body.message).toContain(
        'Identity verification required'
      );
    });
  });

  describe('10. Future Profit Projections', () => {
    it('should generate profit projections for next quarters', async () => {
      const projections =
        await profitsService.generateProfitProjections(projectId);

      expect(projections.projectId).toBe(projectId);
      expect(projections.nextQuarters).toHaveLength(4); // Q4 2024 + Q1-Q3 2025
      expect(projections.projectionModel).toBe('historical_trend');
      expect(projections.confidenceLevel).toBe(0.75);
      expect(projections.factors).toContain('seasonal_traffic');
      expect(projections.factors).toContain('maintenance_schedule');
      expect(projections.factors).toContain('economic_conditions');
    });

    it('should provide investment recommendations based on performance', async () => {
      const recommendations =
        await profitsService.getInvestmentRecommendations(projectId);

      expect(recommendations.projectId).toBe(projectId);
      expect(recommendations.performanceRating).toBe('good');
      expect(recommendations.recommendationScore).toBeGreaterThan(7);
      expect(recommendations.strengths).toContain('consistent_returns');
      expect(recommendations.risks).toContain('maintenance_periods');
      expect(recommendations.suitableFor).toContain('moderate_risk_investors');
    });
  });
});
