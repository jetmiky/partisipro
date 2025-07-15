/**
 * Business Flow Test: Governance Voting and Proposals
 * Tests the complete governance workflow including:
 * 1. Token holder governance participation
 * 2. Proposal creation and validation
 * 3. Identity-verified voting process
 * 4. Voting power calculation and delegation
 * 5. Proposal execution and implementation
 * 6. Governance analytics and reporting
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
import { Web3AuthService } from '../../src/modules/auth/web3auth.service';
// import { GovernanceService } from '../../src/modules/governance/governance.service';
// import { AdminService } from '../../src/modules/admin/admin.service';
import {
  User,
  UserRole,
  // KYCStatus,
  ClaimTopic,
  ProjectStatus,
  ProjectCategory,
} from '../../src/common/types';
import { ProposalType } from '../../src/modules/governance/dto/create-proposal.dto';
import { VoteOption } from '../../src/modules/governance/dto/vote-proposal.dto';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  createMockUser,
} from '../setup';
import { createWeb3AuthMock } from '../utils/web3auth-mock';

describe('Business Flow: Governance Voting and Proposals', () => {
  let app: INestApplication;
  let authService: AuthService;
  let usersService: UsersService;
  let identityService: IdentityService;
  let claimsService: ClaimsService;
  let trustedIssuersService: TrustedIssuersService;
  let projectsService: ProjectsService;
  let investmentsService: InvestmentsService;
  // let governanceService: GovernanceService;
  // let adminService: AdminService;

  // Test actors
  let adminUser: User;
  let spvUser: User;
  let majorityTokenHolder: User;
  let minorityTokenHolder1: User;
  let minorityTokenHolder2: User;
  let smallTokenHolder: User;
  let trustedIssuerId: string;
  let projectId: string;

  // Test data
  let majorityToken: string;
  let minority1Token: string;
  let minority2Token: string;
  let smallToken: string;
  let proposalId1: string;
  let proposalId2: string;
  let proposalId3: string;

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

    // Apply global prefix like in main.ts
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
    // governanceService = app.get<GovernanceService>(GovernanceService);
    // adminService = app.get<AdminService>(AdminService);

    // Create a mock user that matches the JWT payload (sub: 'test-user-id')
    const mockUser = createMockUser({
      id: 'test-user-id',
      role: UserRole.INVESTOR,
    });

    // Directly add to mock database (since we can't easily modify user ID through service)
    // This is a test-specific workaround
    const testUsersService = app.get('UsersService');

    // Mock the findById method to return our test user
    jest.spyOn(testUsersService, 'findById').mockResolvedValue(mockUser);

    // Set majorityToken to a dummy JWT for auth header
    majorityToken = 'mock-jwt-token';

    // Create a test project
    const testProject = await projectsService.createProject({
      spvId: mockUser.id, // Use same user as SPV for simplicity
      name: 'Test Smart City Project',
      description: 'Test project for governance testing',
      category: ProjectCategory.TRANSPORTATION,
      location: {
        province: 'Jakarta',
        city: 'Jakarta',
        coordinates: { latitude: -6.2088, longitude: 106.8456 },
      },
      financial: {
        totalValue: 1000000000,
        tokenPrice: 100000,
        totalTokens: 10000,
        minimumInvestment: 1000000,
        maximumInvestment: 100000000,
      },
      concession: {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2030-12-31'),
        duration: 5,
      },
    });

    projectId = testProject.id;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await app.close();
  });

  describe('1. Platform and Project Setup', () => {
    it('should create platform infrastructure with governance-enabled project', async () => {
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
        email: 'spv@smartcity.com',
        walletAddress: '0xspv1234567890123456789012345678901234567890',
        web3AuthId: 'spv-web3auth-id',
      });
      spvUser = await usersService.updateUser(spvUser.id, {
        role: UserRole.SPV,
        profile: {
          firstName: 'PT',
          lastName: 'Smart City',
          companyName: 'PT Smart City Indonesia',
          businessType: 'Technology Infrastructure',
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

    it('should create smart city IoT project with governance features', async () => {
      const project = await projectsService.createProject(
        {
          name: 'Jakarta Smart City IoT Network',
          description:
            'Comprehensive IoT network for smart city management including traffic, environment, and public services',
          category: ProjectCategory.TECHNOLOGY,
          province: 'DKI Jakarta',
          city: 'Jakarta',
          totalValue: 15000000000000, // 15 trillion IDR
          tokenPrice: 1500000, // 1.5 million IDR per token
          totalTokens: 10000000,
          minimumInvestment: 15000000, // 15 million IDR
          maximumInvestment: 1500000000, // 1.5 billion IDR
          tokenSymbol: 'JSIOTX',
          tokenName: 'Jakarta Smart City IoT Token',
          offeringStartDate: '2024-01-01',
          offeringEndDate: '2024-12-31',
          concessionStartDate: '2025-01-01',
          concessionEndDate: '2045-12-31',
          expectedAnnualReturn: 9.2,
          riskLevel: 4,
          governanceFeatures: {
            votingPeriod: 7, // 7 days
            quorumPercentage: 25, // 25% of tokens
            proposalThreshold: 0.1, // 0.1% of tokens to create proposal
            votingDelay: 1, // 1 day delay before voting starts
            executionDelay: 2, // 2 days delay before execution
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
          reason: 'Smart city IoT project approved with governance features',
        },
        adminUser.id
      );
      await projectsService.activateProject(projectId, adminUser.id);

      const activeProject = await projectsService.findProjectById(projectId);
      expect(activeProject.status).toBe(ProjectStatus.ACTIVE);
      expect(activeProject.name).toBe('Jakarta Smart City IoT Network');
      expect(activeProject.governanceFeatures.votingPeriod).toBe(7);
    });
  });

  describe('2. Token Holder Setup with Different Voting Powers', () => {
    it('should create majority token holder (institutional investor)', async () => {
      majorityTokenHolder = await usersService.findOrCreateUser({
        email: 'institutional@pension.fund',
        walletAddress: '0xmajority1234567890123456789012345678901234567890',
        web3AuthId: 'majority-web3auth-id',
      });

      majorityTokenHolder = await usersService.updateUser(
        majorityTokenHolder.id,
        {
          profile: {
            firstName: 'PT',
            lastName: 'Dana Pensiun',
            companyName: 'PT Dana Pensiun Nasional',
            aum: 75000000000000, // 75 trillion IDR
            investmentExperience: 'institutional',
            riskTolerance: 'moderate',
          },
        }
      );

      // Authenticate
      const authResult = await authService.authenticateWithWeb3Auth({
        idToken: 'mock-majority-token',
      });
      majorityToken = authResult.accessToken;

      // Setup identity
      await identityService.registerIdentity(
        majorityTokenHolder.walletAddress,
        {
          userId: majorityTokenHolder.id,
          userAddress: majorityTokenHolder.walletAddress,
          metadata: { provider: 'verihubs', registrationType: 'institutional' },
        }
      );

      await claimsService.issueClaim({
        identityId: majorityTokenHolder.walletAddress,
        claimTopic: ClaimTopic.KYC_APPROVED,
        issuer: trustedIssuerId,
        data: {
          provider: 'verihubs',
          verificationId: 'majority-verification-001',
        },
      });

      await identityService.updateIdentityStatus(
        majorityTokenHolder.walletAddress,
        {
          status: 'verified' as any,
          reason: 'Institutional investor verification completed',
        }
      );

      // Create large investment (40% of tokens)
      const majorityInvestment = await investmentsService.createInvestment(
        {
          projectId,
          tokenAmount: 4000000, // 4 million tokens (40%)
          investmentAmount: 6000000000000, // 6 trillion IDR
          investmentType: 'primary' as any,
          email: majorityTokenHolder.email,
          phoneNumber: '+6221-1234567',
          fullName: 'PT Dana Pensiun Nasional',
        },
        majorityTokenHolder.id
      );

      await investmentsService.processSuccessfulPayment(
        majorityInvestment.investment.id
      );

      expect(majorityTokenHolder.profile.companyName).toBe(
        'PT Dana Pensiun Nasional'
      );
    });

    it('should create minority token holder 1 (accredited investor)', async () => {
      minorityTokenHolder1 = await usersService.findOrCreateUser({
        email: 'accredited1@wealth.com',
        walletAddress: '0xminority1234567890123456789012345678901234567890',
        web3AuthId: 'minority1-web3auth-id',
      });

      minorityTokenHolder1 = await usersService.updateUser(
        minorityTokenHolder1.id,
        {
          profile: {
            firstName: 'Maria',
            lastName: 'Santoso',
            monthlyIncome: 500000000, // 500 million IDR
            netWorth: 25000000000, // 25 billion IDR
            investmentExperience: 'experienced',
            riskTolerance: 'high',
          },
        }
      );

      // Authenticate
      const authResult = await authService.authenticateWithWeb3Auth({
        idToken: 'mock-minority1-token',
      });
      minority1Token = authResult.accessToken;

      // Setup identity
      await identityService.registerIdentity(
        minorityTokenHolder1.walletAddress,
        {
          userId: minorityTokenHolder1.id,
          userAddress: minorityTokenHolder1.walletAddress,
          metadata: { provider: 'verihubs', registrationType: 'individual' },
        }
      );

      await claimsService.issueClaim({
        identityId: minorityTokenHolder1.walletAddress,
        claimTopic: ClaimTopic.KYC_APPROVED,
        issuer: trustedIssuerId,
        data: {
          provider: 'verihubs',
          verificationId: 'minority1-verification-001',
        },
      });

      await claimsService.issueClaim({
        identityId: minorityTokenHolder1.walletAddress,
        claimTopic: ClaimTopic.ACCREDITED_INVESTOR,
        issuer: trustedIssuerId,
        data: {
          provider: 'verihubs',
          verificationId: 'minority1-verification-001',
          netWorth: 25000000000,
          investmentLimit: 3000000000, // 3 billion IDR
        },
      });

      await identityService.updateIdentityStatus(
        minorityTokenHolder1.walletAddress,
        {
          status: 'verified' as any,
          reason: 'Accredited investor verification completed',
        }
      );

      // Create medium investment (20% of tokens)
      const minority1Investment = await investmentsService.createInvestment(
        {
          projectId,
          tokenAmount: 2000000, // 2 million tokens (20%)
          investmentAmount: 3000000000000, // 3 trillion IDR
          investmentType: 'primary' as any,
          email: minorityTokenHolder1.email,
          phoneNumber: '+6281234567891',
          fullName: 'Maria Santoso',
        },
        minorityTokenHolder1.id
      );

      await investmentsService.processSuccessfulPayment(
        minority1Investment.investment.id
      );

      expect(minorityTokenHolder1.profile.firstName).toBe('Maria');
    });

    it('should create minority token holder 2 (accredited investor)', async () => {
      minorityTokenHolder2 = await usersService.findOrCreateUser({
        email: 'accredited2@wealth.com',
        walletAddress: '0xminority2234567890123456789012345678901234567890',
        web3AuthId: 'minority2-web3auth-id',
      });

      minorityTokenHolder2 = await usersService.updateUser(
        minorityTokenHolder2.id,
        {
          profile: {
            firstName: 'David',
            lastName: 'Tanoesoedibjo',
            monthlyIncome: 400000000, // 400 million IDR
            netWorth: 20000000000, // 20 billion IDR
            investmentExperience: 'experienced',
            riskTolerance: 'moderate',
          },
        }
      );

      // Authenticate
      const authResult = await authService.authenticateWithWeb3Auth({
        idToken: 'mock-minority2-token',
      });
      minority2Token = authResult.accessToken;

      // Setup identity
      await identityService.registerIdentity(
        minorityTokenHolder2.walletAddress,
        {
          userId: minorityTokenHolder2.id,
          userAddress: minorityTokenHolder2.walletAddress,
          metadata: { provider: 'verihubs', registrationType: 'individual' },
        }
      );

      await claimsService.issueClaim({
        identityId: minorityTokenHolder2.walletAddress,
        claimTopic: ClaimTopic.KYC_APPROVED,
        issuer: trustedIssuerId,
        data: {
          provider: 'verihubs',
          verificationId: 'minority2-verification-001',
        },
      });

      await claimsService.issueClaim({
        identityId: minorityTokenHolder2.walletAddress,
        claimTopic: ClaimTopic.ACCREDITED_INVESTOR,
        issuer: trustedIssuerId,
        data: {
          provider: 'verihubs',
          verificationId: 'minority2-verification-001',
          netWorth: 20000000000,
          investmentLimit: 2500000000, // 2.5 billion IDR
        },
      });

      await identityService.updateIdentityStatus(
        minorityTokenHolder2.walletAddress,
        {
          status: 'verified' as any,
          reason: 'Accredited investor verification completed',
        }
      );

      // Create medium investment (25% of tokens)
      const minority2Investment = await investmentsService.createInvestment(
        {
          projectId,
          tokenAmount: 2500000, // 2.5 million tokens (25%)
          investmentAmount: 3750000000000, // 3.75 trillion IDR
          investmentType: 'primary' as any,
          email: minorityTokenHolder2.email,
          phoneNumber: '+6281234567892',
          fullName: 'David Tanoesoedibjo',
        },
        minorityTokenHolder2.id
      );

      await investmentsService.processSuccessfulPayment(
        minority2Investment.investment.id
      );

      expect(minorityTokenHolder2.profile.firstName).toBe('David');
    });

    it('should create small token holder (retail investor)', async () => {
      smallTokenHolder = await usersService.findOrCreateUser({
        email: 'retail@investor.com',
        walletAddress: '0xsmall1234567890123456789012345678901234567890',
        web3AuthId: 'small-web3auth-id',
      });

      smallTokenHolder = await usersService.updateUser(smallTokenHolder.id, {
        profile: {
          firstName: 'Budi',
          lastName: 'Hartono',
          monthlyIncome: 35000000, // 35 million IDR
          investmentExperience: 'intermediate',
          riskTolerance: 'moderate',
        },
      });

      // Authenticate
      const authResult = await authService.authenticateWithWeb3Auth({
        idToken: 'mock-small-token',
      });
      smallToken = authResult.accessToken;

      // Setup identity
      await identityService.registerIdentity(smallTokenHolder.walletAddress, {
        userId: smallTokenHolder.id,
        userAddress: smallTokenHolder.walletAddress,
        metadata: { provider: 'verihubs', registrationType: 'individual' },
      });

      await claimsService.issueClaim({
        identityId: smallTokenHolder.walletAddress,
        claimTopic: ClaimTopic.KYC_APPROVED,
        issuer: trustedIssuerId,
        data: {
          provider: 'verihubs',
          verificationId: 'small-verification-001',
        },
      });

      await claimsService.issueClaim({
        identityId: smallTokenHolder.walletAddress,
        claimTopic: ClaimTopic.RETAIL_QUALIFIED,
        issuer: trustedIssuerId,
        data: {
          provider: 'verihubs',
          verificationId: 'small-verification-001',
          investmentLimit: 300000000, // 300 million IDR
        },
      });

      await identityService.updateIdentityStatus(
        smallTokenHolder.walletAddress,
        {
          status: 'verified' as any,
          reason: 'Retail investor verification completed',
        }
      );

      // Create small investment (15% of tokens)
      const smallInvestment = await investmentsService.createInvestment(
        {
          projectId,
          tokenAmount: 1500000, // 1.5 million tokens (15%)
          investmentAmount: 2250000000000, // 2.25 trillion IDR
          investmentType: 'primary' as any,
          email: smallTokenHolder.email,
          phoneNumber: '+6281234567893',
          fullName: 'Budi Hartono',
        },
        smallTokenHolder.id
      );

      await investmentsService.processSuccessfulPayment(
        smallInvestment.investment.id
      );

      expect(smallTokenHolder.profile.firstName).toBe('Budi');
    });
  });

  describe('3. Governance Proposal Creation', () => {
    it('should create parameter change proposal by majority token holder', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/governance/proposals')
        .set('Authorization', `Bearer ${majorityToken}`)
        .send({
          projectId,
          title: 'Increase IoT Sensor Density',
          description:
            'Proposal to increase IoT sensor density from 1000 to 1500 sensors per square kilometer to improve data quality and city management efficiency',
          type: ProposalType.PARAMETER_CHANGE,
          votingStartDate: new Date(
            Date.now() + 24 * 60 * 60 * 1000
          ).toISOString(), // Tomorrow
          votingEndDate: new Date(
            Date.now() + 8 * 24 * 60 * 60 * 1000
          ).toISOString(), // 8 days from now
          quorum: 0.25, // 25% quorum
          threshold: 0.51, // 51% threshold
          contractCall: {
            targetContract: '0x123456789',
            methodName: 'updateSensorDensity',
            parameters: [1500],
          },
          expectedCost: 2000000000000, // 2 trillion IDR
          expectedBenefit:
            'Improved traffic management, better air quality monitoring, enhanced public safety',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Increase IoT Sensor Density');
      expect(response.body.data.proposerId).toBe(majorityTokenHolder.id);
      expect(response.body.data.type).toBe(ProposalType.PARAMETER_CHANGE);

      proposalId1 = response.body.data.id;
    });

    it('should create budget allocation proposal by minority token holder', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/governance/proposals')
        .set('Authorization', `Bearer ${minority1Token}`)
        .send({
          projectId,
          title: 'Smart Traffic Light System Budget',
          description:
            'Allocate additional budget for implementing AI-powered smart traffic light system at 500 major intersections',
          type: ProposalType.BUDGET_ALLOCATION,
          votingStartDate: new Date(
            Date.now() + 24 * 60 * 60 * 1000
          ).toISOString(),
          votingEndDate: new Date(
            Date.now() + 8 * 24 * 60 * 60 * 1000
          ).toISOString(),
          quorum: 0.3, // 30% quorum for budget proposals
          threshold: 0.6, // 60% threshold for budget proposals
          budgetDetails: {
            totalAmount: 5000000000000, // 5 trillion IDR
            categories: [
              { category: 'Hardware', amount: 3000000000000 },
              { category: 'Software', amount: 1500000000000 },
              { category: 'Installation', amount: 500000000000 },
            ],
            timeline: '12 months',
          },
          expectedBenefit:
            'Reduced traffic congestion by 30%, improved emergency response times, lower carbon emissions',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(
        'Smart Traffic Light System Budget'
      );
      expect(response.body.data.proposerId).toBe(minorityTokenHolder1.id);
      expect(response.body.data.type).toBe(ProposalType.BUDGET_ALLOCATION);

      proposalId2 = response.body.data.id;
    });

    it('should create governance change proposal by another minority holder', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/governance/proposals')
        .set('Authorization', `Bearer ${minority2Token}`)
        .send({
          projectId,
          title: 'Reduce Voting Quorum Requirement',
          description:
            'Proposal to reduce voting quorum from 25% to 15% to increase governance participation and decision-making efficiency',
          type: ProposalType.GOVERNANCE_CHANGE,
          votingStartDate: new Date(
            Date.now() + 24 * 60 * 60 * 1000
          ).toISOString(),
          votingEndDate: new Date(
            Date.now() + 8 * 24 * 60 * 60 * 1000
          ).toISOString(),
          quorum: 0.25, // Current quorum
          threshold: 0.67, // 67% threshold for governance changes
          governanceChanges: {
            currentQuorum: 0.25,
            proposedQuorum: 0.15,
            rationale:
              'Lower quorum will enable more frequent and timely governance decisions while maintaining legitimacy',
          },
          expectedBenefit:
            'Faster decision-making, improved responsiveness to market changes, higher participation rates',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Reduce Voting Quorum Requirement');
      expect(response.body.data.proposerId).toBe(minorityTokenHolder2.id);
      expect(response.body.data.type).toBe(ProposalType.GOVERNANCE_CHANGE);

      proposalId3 = response.body.data.id;
    });

    it('should validate proposal creation requirements', async () => {
      // Test insufficient voting power
      const insufficientResponse = await request(app.getHttpServer())
        .post('/api/governance/proposals')
        .set('Authorization', `Bearer ${smallToken}`)
        .send({
          projectId,
          title: 'Invalid Proposal',
          description: 'This should fail due to insufficient voting power',
          type: ProposalType.PARAMETER_CHANGE,
          votingStartDate: new Date(
            Date.now() + 24 * 60 * 60 * 1000
          ).toISOString(),
          votingEndDate: new Date(
            Date.now() + 8 * 24 * 60 * 60 * 1000
          ).toISOString(),
          quorum: 0.25,
          threshold: 0.51,
        })
        .expect(400);

      expect(insufficientResponse.body.success).toBe(false);
      expect(insufficientResponse.body.message).toContain(
        'Insufficient voting power'
      );
    });
  });

  describe('4. Voting Process with Identity Verification', () => {
    it('should allow majority token holder to vote on all proposals', async () => {
      const proposals = [
        {
          id: proposalId1,
          vote: VoteOption.FOR,
          reason: 'Supports technology improvement',
        },
        {
          id: proposalId2,
          vote: VoteOption.AGAINST,
          reason: 'Budget allocation too high',
        },
        {
          id: proposalId3,
          vote: VoteOption.FOR,
          reason: 'Supports governance efficiency',
        },
      ];

      for (const { id, vote, reason } of proposals) {
        const response = await request(app.getHttpServer())
          .post(`/api/governance/proposals/${id}/vote`)
          .set('Authorization', `Bearer ${majorityToken}`)
          .send({
            vote,
            reason,
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.proposalId).toBe(id);
        expect(response.body.data.vote).toBe(vote.toLowerCase());
        expect(response.body.data.votingPower).toBe(4000000); // 4 million tokens
      }
    });

    it('should allow minority token holder 1 to vote on all proposals', async () => {
      const proposals = [
        {
          id: proposalId1,
          vote: VoteOption.FOR,
          reason: 'Agrees with sensor density increase',
        },
        {
          id: proposalId2,
          vote: VoteOption.FOR,
          reason: 'Supports smart traffic system',
        },
        {
          id: proposalId3,
          vote: VoteOption.AGAINST,
          reason: 'Prefers current quorum level',
        },
      ];

      for (const { id, vote, reason } of proposals) {
        const response = await request(app.getHttpServer())
          .post(`/api/governance/proposals/${id}/vote`)
          .set('Authorization', `Bearer ${minority1Token}`)
          .send({
            vote,
            reason,
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.proposalId).toBe(id);
        expect(response.body.data.vote).toBe(vote.toLowerCase());
        expect(response.body.data.votingPower).toBe(2000000); // 2 million tokens
      }
    });

    it('should allow minority token holder 2 to vote on all proposals', async () => {
      const proposals = [
        {
          id: proposalId1,
          vote: VoteOption.ABSTAIN,
          reason: 'Neutral on technical decision',
        },
        {
          id: proposalId2,
          vote: VoteOption.FOR,
          reason: 'Supports infrastructure investment',
        },
        {
          id: proposalId3,
          vote: VoteOption.FOR,
          reason: 'Authored proposal, supports change',
        },
      ];

      for (const { id, vote, reason } of proposals) {
        const response = await request(app.getHttpServer())
          .post(`/api/governance/proposals/${id}/vote`)
          .set('Authorization', `Bearer ${minority2Token}`)
          .send({
            vote,
            reason,
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.proposalId).toBe(id);
        expect(response.body.data.vote).toBe(vote.toLowerCase());
        expect(response.body.data.votingPower).toBe(2500000); // 2.5 million tokens
      }
    });

    it('should allow small token holder to vote on select proposals', async () => {
      const proposals = [
        {
          id: proposalId1,
          vote: VoteOption.FOR,
          reason: 'Supports technology advancement',
        },
        {
          id: proposalId2,
          vote: VoteOption.AGAINST,
          reason: 'Concerned about cost',
        },
        // Skip proposalId3 (governance change) to test partial participation
      ];

      for (const { id, vote, reason } of proposals) {
        const response = await request(app.getHttpServer())
          .post(`/api/governance/proposals/${id}/vote`)
          .set('Authorization', `Bearer ${smallToken}`)
          .send({
            vote,
            reason,
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.proposalId).toBe(id);
        expect(response.body.data.vote).toBe(vote.toLowerCase());
        expect(response.body.data.votingPower).toBe(1500000); // 1.5 million tokens
      }
    });

    it('should validate voting power calculations', async () => {
      const votingPowers = [
        {
          token: majorityToken,
          userId: majorityTokenHolder.id,
          expectedPower: 4000000,
        },
        {
          token: minority1Token,
          userId: minorityTokenHolder1.id,
          expectedPower: 2000000,
        },
        {
          token: minority2Token,
          userId: minorityTokenHolder2.id,
          expectedPower: 2500000,
        },
        {
          token: smallToken,
          userId: smallTokenHolder.id,
          expectedPower: 1500000,
        },
      ];

      for (const { token, userId, expectedPower } of votingPowers) {
        const response = await request(app.getHttpServer())
          .get(`/api/governance/projects/${projectId}/voting-power`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.userId).toBe(userId);
        expect(response.body.data.votingPower).toBe(expectedPower);
        expect(response.body.data.tokenBalance).toBe(expectedPower);
      }
    });
  });

  describe('5. Proposal Results and Execution', () => {
    it('should calculate proposal 1 results (Parameter Change)', async () => {
      const resultsResponse = await request(app.getHttpServer())
        .get(`/api/governance/proposals/${proposalId1}/results`)
        .set('Authorization', `Bearer ${majorityToken}`)
        .expect(200);

      expect(resultsResponse.body.success).toBe(true);

      const results = resultsResponse.body.data;
      expect(results.proposalId).toBe(proposalId1);
      expect(results.totalVotes).toBe(4); // All 4 token holders voted
      expect(results.totalVotingPower).toBe(10000000); // Total tokens voted
      expect(results.forVotes).toBe(7500000); // Majority + Minority1 + Small = 4M + 2M + 1.5M
      expect(results.againstVotes).toBe(0);
      expect(results.abstainVotes).toBe(2500000); // Minority2 abstained
      expect(results.quorumReached).toBe(true);
      expect(results.proposalPassed).toBe(true);
    });

    it('should calculate proposal 2 results (Budget Allocation)', async () => {
      const resultsResponse = await request(app.getHttpServer())
        .get(`/api/governance/proposals/${proposalId2}/results`)
        .set('Authorization', `Bearer ${minority1Token}`)
        .expect(200);

      expect(resultsResponse.body.success).toBe(true);

      const results = resultsResponse.body.data;
      expect(results.proposalId).toBe(proposalId2);
      expect(results.totalVotes).toBe(4);
      expect(results.totalVotingPower).toBe(10000000);
      expect(results.forVotes).toBe(4500000); // Minority1 + Minority2 = 2M + 2.5M
      expect(results.againstVotes).toBe(5500000); // Majority + Small = 4M + 1.5M
      expect(results.abstainVotes).toBe(0);
      expect(results.quorumReached).toBe(true);
      expect(results.proposalPassed).toBe(false); // Needs 60% threshold, only got 45%
    });

    it('should calculate proposal 3 results (Governance Change)', async () => {
      const resultsResponse = await request(app.getHttpServer())
        .get(`/api/governance/proposals/${proposalId3}/results`)
        .set('Authorization', `Bearer ${minority2Token}`)
        .expect(200);

      expect(resultsResponse.body.success).toBe(true);

      const results = resultsResponse.body.data;
      expect(results.proposalId).toBe(proposalId3);
      expect(results.totalVotes).toBe(3); // Small holder didn't vote
      expect(results.totalVotingPower).toBe(8500000); // 10M - 1.5M (small holder)
      expect(results.forVotes).toBe(6500000); // Majority + Minority2 = 4M + 2.5M
      expect(results.againstVotes).toBe(2000000); // Minority1 = 2M
      expect(results.abstainVotes).toBe(0);
      expect(results.quorumReached).toBe(false); // Needs 25% of ALL tokens, only got 85%
      expect(results.proposalPassed).toBe(false); // Quorum not reached
    });

    it('should execute successful proposal (Parameter Change)', async () => {
      const executionResponse = await request(app.getHttpServer())
        .post(`/api/governance/proposals/${proposalId1}/execute`)
        .set('Authorization', `Bearer ${majorityToken}`)
        .expect(200);

      expect(executionResponse.body.success).toBe(true);
      expect(executionResponse.body.data.proposalId).toBe(proposalId1);
      expect(executionResponse.body.data.executed).toBe(true);
      expect(executionResponse.body.data.executionHash).toBeDefined();
      expect(executionResponse.body.data.executedAt).toBeDefined();
    });

    it('should prevent execution of failed proposals', async () => {
      // Try to execute failed budget proposal
      const failedExecutionResponse = await request(app.getHttpServer())
        .post(`/api/governance/proposals/${proposalId2}/execute`)
        .set('Authorization', `Bearer ${minority1Token}`)
        .expect(400);

      expect(failedExecutionResponse.body.success).toBe(false);
      expect(failedExecutionResponse.body.message).toContain(
        'Proposal did not pass'
      );

      // Try to execute proposal without quorum
      const noQuorumExecutionResponse = await request(app.getHttpServer())
        .post(`/api/governance/proposals/${proposalId3}/execute`)
        .set('Authorization', `Bearer ${minority2Token}`)
        .expect(400);

      expect(noQuorumExecutionResponse.body.success).toBe(false);
      expect(noQuorumExecutionResponse.body.message).toContain(
        'Quorum not reached'
      );
    });
  });

  describe('6. Governance Analytics and Reporting', () => {
    it('should generate comprehensive governance analytics', async () => {
      const analyticsResponse = await request(app.getHttpServer())
        .get(`/api/governance/analytics/${projectId}`)
        .set('Authorization', `Bearer ${majorityToken}`)
        .expect(200);

      expect(analyticsResponse.body.success).toBe(true);

      const analytics = analyticsResponse.body.data;
      expect(analytics.projectId).toBe(projectId);
      expect(analytics.totalProposals).toBe(3);
      expect(analytics.activeProposals).toBe(0);
      expect(analytics.executedProposals).toBe(1);
      expect(analytics.failedProposals).toBe(2);
      expect(analytics.totalVoters).toBe(4);
      expect(analytics.averageParticipation).toBe(87.5); // (4+4+3)/3 = 92% average
      expect(analytics.averageVotingPower).toBe(2500000); // 10M tokens / 4 voters
    });

    it('should generate voter participation analytics', async () => {
      const participationResponse = await request(app.getHttpServer())
        .get(`/api/governance/participation/${projectId}`)
        .set('Authorization', `Bearer ${majorityToken}`)
        .expect(200);

      expect(participationResponse.body.success).toBe(true);

      const participation = participationResponse.body.data;
      expect(participation.totalEligibleVoters).toBe(4);
      expect(participation.activeVoters).toBe(4);
      expect(participation.participationRate).toBe(100);
      expect(participation.voterAnalytics).toHaveLength(4);

      // Check individual participation
      const majorityStats = participation.voterAnalytics.find(
        v => v.userId === majorityTokenHolder.id
      );
      expect(majorityStats.proposalsVoted).toBe(3);
      expect(majorityStats.participationRate).toBe(100);
      expect(majorityStats.votingPower).toBe(4000000);
    });

    it('should generate proposal category analytics', async () => {
      const categoryResponse = await request(app.getHttpServer())
        .get(`/api/governance/categories/${projectId}`)
        .set('Authorization', `Bearer ${adminUser.id}`)
        .expect(200);

      expect(categoryResponse.body.success).toBe(true);

      const categories = categoryResponse.body.data;
      expect(categories.parameterChanges.total).toBe(1);
      expect(categories.parameterChanges.passed).toBe(1);
      expect(categories.parameterChanges.successRate).toBe(100);

      expect(categories.budgetAllocations.total).toBe(1);
      expect(categories.budgetAllocations.passed).toBe(0);
      expect(categories.budgetAllocations.successRate).toBe(0);

      expect(categories.governanceChanges.total).toBe(1);
      expect(categories.governanceChanges.passed).toBe(0);
      expect(categories.governanceChanges.successRate).toBe(0);
    });
  });

  describe('7. Governance Impact Assessment', () => {
    it('should assess impact of executed proposals', async () => {
      const impactResponse = await request(app.getHttpServer())
        .get(`/api/governance/impact/${projectId}`)
        .set('Authorization', `Bearer ${adminUser.id}`)
        .expect(200);

      expect(impactResponse.body.success).toBe(true);

      const impact = impactResponse.body.data;
      expect(impact.executedProposals).toBe(1);
      expect(impact.totalImplementationCost).toBe(2000000000000); // 2 trillion IDR
      expect(impact.expectedBenefits).toContain('traffic management');
      expect(impact.impactMetrics.efficiency).toBeDefined();
      expect(impact.impactMetrics.userSatisfaction).toBeDefined();
    });

    it('should track governance effectiveness over time', async () => {
      const effectivenessResponse = await request(app.getHttpServer())
        .get(`/api/governance/effectiveness/${projectId}`)
        .set('Authorization', `Bearer ${adminUser.id}`)
        .expect(200);

      expect(effectivenessResponse.body.success).toBe(true);

      const effectiveness = effectivenessResponse.body.data;
      expect(effectiveness.governanceScore).toBeGreaterThan(6); // Out of 10
      expect(effectiveness.participationTrend).toBe('stable');
      expect(effectiveness.decisionQuality).toBe('high');
      expect(effectiveness.implementationSpeed).toBe('fast');
    });
  });

  describe('8. Advanced Governance Features', () => {
    it('should handle vote delegation (if implemented)', async () => {
      // Note: This test assumes delegation features are implemented
      const delegationResponse = await request(app.getHttpServer())
        .post('/api/governance/delegate')
        .set('Authorization', `Bearer ${smallToken}`)
        .send({
          projectId,
          delegateeTo: majorityTokenHolder.id,
          delegationType: 'specific_topics',
          topics: ['PARAMETER_CHANGE', 'BUDGET_ALLOCATION'],
        })
        .expect(200);

      expect(delegationResponse.body.success).toBe(true);
      expect(delegationResponse.body.data.delegatedVotingPower).toBe(1500000);
    });

    it('should support governance token staking for increased voting power', async () => {
      // Note: This test assumes staking features are implemented
      const stakingResponse = await request(app.getHttpServer())
        .post('/api/governance/stake')
        .set('Authorization', `Bearer ${minority1Token}`)
        .send({
          projectId,
          stakeAmount: 1000000, // 1 million tokens
          stakingPeriod: 180, // 180 days
        })
        .expect(200);

      expect(stakingResponse.body.success).toBe(true);
      expect(stakingResponse.body.data.stakedAmount).toBe(1000000);
      expect(stakingResponse.body.data.votingPowerMultiplier).toBe(1.5); // 50% bonus
    });
  });

  describe('9. Governance Compliance and Audit', () => {
    it('should verify identity verification for all governance actions', async () => {
      const complianceResponse = await request(app.getHttpServer())
        .get(`/api/governance/compliance/${projectId}`)
        .set('Authorization', `Bearer ${adminUser.id}`)
        .expect(200);

      expect(complianceResponse.body.success).toBe(true);

      const compliance = complianceResponse.body.data;
      expect(compliance.totalGovernanceActions).toBe(15); // 3 proposals + 12 votes
      expect(compliance.verifiedActions).toBe(15);
      expect(compliance.unverifiedActions).toBe(0);
      expect(compliance.complianceRate).toBe(100);
      expect(compliance.identityVerificationRequired).toBe(true);
    });

    it('should generate governance audit trail', async () => {
      const auditResponse = await request(app.getHttpServer())
        .get(`/api/governance/audit/${projectId}`)
        .set('Authorization', `Bearer ${adminUser.id}`)
        .expect(200);

      expect(auditResponse.body.success).toBe(true);

      const audit = auditResponse.body.data;
      expect(audit.totalActions).toBe(15);
      expect(audit.auditTrail).toHaveLength(15);

      // Check audit trail completeness
      const proposalActions = audit.auditTrail.filter(
        a => a.action === 'PROPOSAL_CREATED'
      );
      const voteActions = audit.auditTrail.filter(
        a => a.action === 'VOTE_CAST'
      );
      const executionActions = audit.auditTrail.filter(
        a => a.action === 'PROPOSAL_EXECUTED'
      );

      expect(proposalActions).toHaveLength(3);
      expect(voteActions).toHaveLength(11); // 3+3+3+2 votes
      expect(executionActions).toHaveLength(1);
    });
  });

  describe('10. Governance Performance Metrics', () => {
    it('should calculate governance ROI and efficiency', async () => {
      const metricsResponse = await request(app.getHttpServer())
        .get(`/api/governance/metrics/${projectId}`)
        .set('Authorization', `Bearer ${adminUser.id}`)
        .expect(200);

      expect(metricsResponse.body.success).toBe(true);

      const metrics = metricsResponse.body.data;
      expect(metrics.governanceROI).toBeDefined();
      expect(metrics.decisionSpeed).toBeDefined();
      expect(metrics.participationQuality).toBeDefined();
      expect(metrics.implementationSuccess).toBe(100); // 1 out of 1 executed
      expect(metrics.voterSatisfaction).toBeGreaterThan(7); // Out of 10
    });

    it('should provide governance recommendations', async () => {
      const recommendationsResponse = await request(app.getHttpServer())
        .get(`/api/governance/recommendations/${projectId}`)
        .set('Authorization', `Bearer ${adminUser.id}`)
        .expect(200);

      expect(recommendationsResponse.body.success).toBe(true);

      const recommendations = recommendationsResponse.body.data;
      expect(recommendations.participationRecommendations).toBeDefined();
      expect(recommendations.processImprovements).toBeDefined();
      expect(recommendations.engagementStrategies).toBeDefined();
      expect(recommendations.technicalUpgrades).toBeDefined();
    });
  });
});
