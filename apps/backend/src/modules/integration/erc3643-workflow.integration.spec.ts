import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
// import { FirebaseService } from '../../common/services/firebase.service';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { IdentityService } from '../identity/identity.service';
import { ClaimsService } from '../claims/claims.service';
import { TrustedIssuersService } from '../trusted-issuers/trusted-issuers.service';
import { ProjectsService } from '../projects/projects.service';
import { InvestmentsService } from '../investments/investments.service';
import { ProfitsService } from '../profits/profits.service';
import { GovernanceService } from '../governance/governance.service';
import {
  User,
  UserRole,
  KYCStatus,
  ClaimTopic,
  ProjectStatus,
  ProjectCategory,
} from '../../common/types';
import { ProposalType } from '../governance/dto/create-proposal.dto';
import { VoteOption } from '../governance/dto/vote-proposal.dto';

describe('ERC-3643 Workflow Integration Tests', () => {
  let app: INestApplication;
  let authService: AuthService;
  let usersService: UsersService;
  let identityService: IdentityService;
  let claimsService: ClaimsService;
  let trustedIssuersService: TrustedIssuersService;
  let projectsService: ProjectsService;
  let investmentsService: InvestmentsService;
  let profitsService: ProfitsService;
  let governanceService: GovernanceService;

  // Test data
  let adminUser: User;
  let spvUser: User;
  let investorUser: User;
  let trustedIssuerId: string;
  let projectId: string;
  let investmentId: string;
  let distributionId: string;
  let proposalId: string;
  // let adminToken: string;
  // let spvToken: string;
  let investorToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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
    governanceService = app.get<GovernanceService>(GovernanceService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. User Onboarding and Identity Setup', () => {
    it('should create admin user and authenticate', async () => {
      // Create admin user
      adminUser = await usersService.findOrCreateUser({
        email: 'admin@partisipro.com',
        walletAddress: '0xadmin123',
        web3AuthId: 'admin-web3auth',
      });

      // Update role to admin
      adminUser = await usersService.updateUser(adminUser.id, {
        role: UserRole.ADMIN,
      });

      expect(adminUser).toBeDefined();
      expect(adminUser.role).toBe(UserRole.ADMIN);

      // Authenticate admin
      const authResult = await authService.authenticateWithWeb3Auth({
        idToken: 'mock-admin-token',
      });
      // adminToken = authResult.accessToken;

      expect(authResult.user.id).toBe(adminUser.id);
      expect(authResult.accessToken).toBeDefined();
    });

    it('should create SPV user and authenticate', async () => {
      // Create SPV user
      spvUser = await usersService.findOrCreateUser({
        email: 'spv@partisipro.com',
        walletAddress: '0xspv123',
        web3AuthId: 'spv-web3auth',
      });

      // Update role to SPV
      spvUser = await usersService.updateUser(spvUser.id, {
        role: UserRole.SPV,
      });

      expect(spvUser).toBeDefined();
      expect(spvUser.role).toBe(UserRole.SPV);

      // Authenticate SPV
      const authResult = await authService.authenticateWithWeb3Auth({
        idToken: 'mock-spv-token',
      });
      // spvToken = authResult.accessToken;

      expect(authResult.user.id).toBe(spvUser.id);
    });

    it('should create investor user and authenticate', async () => {
      // Create investor user
      investorUser = await usersService.findOrCreateUser({
        email: 'investor@partisipro.com',
        walletAddress: '0xinvestor123',
        web3AuthId: 'investor-web3auth',
      });

      // Role is already INVESTOR by default, no need to update

      expect(investorUser).toBeDefined();
      expect(investorUser.role).toBe(UserRole.INVESTOR);

      // Authenticate investor
      const authResult = await authService.authenticateWithWeb3Auth({
        idToken: 'mock-investor-token',
      });
      investorToken = authResult.accessToken;

      expect(authResult.user.id).toBe(investorUser.id);
    });

    it('should create trusted issuer (KYC provider)', async () => {
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
  });

  describe('2. Identity Registration and Verification', () => {
    it('should register SPV identity', async () => {
      const spvIdentity = await identityService.registerIdentity(
        spvUser.walletAddress,
        {
          userId: spvUser.id,
          userAddress: spvUser.walletAddress,
          metadata: {
            provider: 'manual',
            registrationType: 'spv',
          },
        }
      );

      expect(spvIdentity).toBeDefined();
      expect(spvIdentity.userId).toBe(spvUser.id);
      expect(spvIdentity.id).toBe(spvUser.walletAddress);
      expect(spvIdentity.status).toBe('pending');
    });

    it('should register investor identity', async () => {
      const investorIdentity = await identityService.registerIdentity(
        investorUser.walletAddress,
        {
          userId: investorUser.id,
          userAddress: investorUser.walletAddress,
          metadata: {
            provider: 'verihubs',
            registrationType: 'individual',
          },
        }
      );

      expect(investorIdentity).toBeDefined();
      expect(investorIdentity.userId).toBe(investorUser.id);
      expect(investorIdentity.status).toBe('pending');
    });

    it('should verify SPV identity and create claims', async () => {
      const spvIdentity = await identityService.getIdentity(
        spvUser.walletAddress
      );

      // Issue KYC claim for SPV
      await claimsService.issueClaim({
        identityId: spvIdentity.id,
        claimTopic: ClaimTopic.KYC_APPROVED,
        issuer: trustedIssuerId,
        data: {
          provider: 'manual',
          verificationId: 'spv-verification-123',
          verifiedAt: new Date(),
        },
      });

      // Update identity status to verified
      await identityService.updateIdentityStatus(spvIdentity.id, {
        status: 'verified' as any,
        reason: 'KYC verification completed',
      });

      // Verify identity is now verified
      const verifiedIdentity = await identityService.verifyIdentity(
        spvUser.walletAddress
      );
      expect(verifiedIdentity.isVerified).toBe(true);

      // Check if user KYC status was updated
      const updatedSpvUser = await usersService.findById(spvUser.id);
      expect(updatedSpvUser.kyc.status).toBe(KYCStatus.APPROVED);
    });

    it('should verify investor identity and create claims', async () => {
      const investorIdentity = await identityService.getIdentity(
        investorUser.walletAddress
      );

      // Issue KYC claim for investor
      await claimsService.issueClaim({
        identityId: investorIdentity.id,
        claimTopic: ClaimTopic.KYC_APPROVED,
        issuer: trustedIssuerId,
        data: {
          provider: 'verihubs',
          verificationId: 'investor-verification-123',
          verifiedAt: new Date(),
        },
      });

      // Update identity status to verified
      await identityService.updateIdentityStatus(investorIdentity.id, {
        status: 'verified' as any,
        reason: 'KYC verification completed',
      });

      // Verify identity is now verified
      const verifiedIdentity = await identityService.verifyIdentity(
        investorUser.walletAddress
      );
      expect(verifiedIdentity.isVerified).toBe(true);

      // Check if user KYC status was updated
      const updatedInvestorUser = await usersService.findById(investorUser.id);
      expect(updatedInvestorUser.kyc.status).toBe(KYCStatus.APPROVED);
    });

    it('should verify identity verification status', async () => {
      const spvVerification = await identityService.verifyIdentity(
        spvUser.walletAddress
      );
      const investorVerification = await identityService.verifyIdentity(
        investorUser.walletAddress
      );

      expect(spvVerification.isVerified).toBe(true);
      expect(investorVerification.isVerified).toBe(true);
    });
  });

  describe('3. Project Creation and Management', () => {
    it('should create project with verified SPV identity', async () => {
      const project = await projectsService.createProject(
        {
          name: 'Jakarta MRT Phase 2',
          description: 'Extension of Jakarta MRT network',
          category: ProjectCategory.TRANSPORTATION,
          province: 'DKI Jakarta',
          city: 'Jakarta',
          totalValue: 10000000000, // 10 billion IDR
          tokenPrice: 100000, // 100k IDR per token
          totalTokens: 100000,
          minimumInvestment: 1000000, // 1 million IDR
          maximumInvestment: 100000000, // 100 million IDR
          tokenSymbol: 'JMRTX2',
          tokenName: 'Jakarta MRT Phase 2 Token',
          offeringStartDate: '2024-01-01',
          offeringEndDate: '2024-12-31',
          concessionStartDate: '2025-01-01',
          concessionEndDate: '2050-01-01',
          expectedAnnualReturn: 8.5,
          riskLevel: 3,
          documentUrls: [],
        },
        spvUser.id
      );

      projectId = project.id;

      expect(project).toBeDefined();
      expect(project.name).toBe('Jakarta MRT Phase 2');
      expect(project.spvId).toBe(spvUser.id);
      expect(project.status).toBe(ProjectStatus.DRAFT);
    });

    it('should submit project for approval', async () => {
      await projectsService.submitForApproval(projectId, spvUser.id);

      const project = await projectsService.findProjectById(projectId);
      expect(project.status).toBe(ProjectStatus.PENDING_APPROVAL);
    });

    it('should approve project by admin', async () => {
      await projectsService.approveProject(
        projectId,
        {
          action: 'approve' as any,
          reason: 'Project meets all requirements',
        },
        adminUser.id
      );

      const project = await projectsService.findProjectById(projectId);
      expect(project.status).toBe(ProjectStatus.APPROVED);
    });
  });

  describe('4. Investment Process with Identity Verification', () => {
    it('should create investment with verified investor identity', async () => {
      const investment = await investmentsService.createInvestment(
        {
          projectId,
          tokenAmount: 100, // 100 tokens
          investmentAmount: 10000000, // 10 million IDR
          investmentType: 'primary' as any,
          email: investorUser.email,
          phoneNumber: '+6281234567890',
          fullName: 'Test Investor',
        },
        investorUser.id
      );

      investmentId = investment.investment.id;

      expect(investment).toBeDefined();
      expect(investment.investment.userId).toBe(investorUser.id);
      expect(investment.investment.projectId).toBe(projectId);
      expect(investment.investment.tokenAmount).toBe(100);
      expect(investment.investment.investmentAmount).toBe(10000000);
    });

    it('should process successful investment payment', async () => {
      await investmentsService.processSuccessfulPayment(investmentId);

      const investment =
        await investmentsService.getInvestmentById(investmentId);
      expect(investment.status).toBe('completed');
    });

    it('should verify investor portfolio', async () => {
      const portfolio = await investmentsService.getUserPortfolio(
        investorUser.id
      );

      expect(portfolio).toHaveLength(1);
      expect(portfolio[0].investment.id).toBe(investmentId);
      expect(portfolio[0].project.id).toBe(projectId);
    });
  });

  describe('5. Profit Distribution with Identity Verification', () => {
    it('should distribute profits to verified investors', async () => {
      const distribution = await profitsService.distributeProfits(
        {
          projectId,
          totalProfit: 50000000, // 50 million IDR
          periodStartDate: '2024-01-01',
          periodEndDate: '2024-03-31',
          quarter: 1,
          year: 2024,
          notes: 'Q1 2024 profit distribution',
        },
        adminUser.id
      );

      distributionId = distribution.id;

      expect(distribution).toBeDefined();
      expect(distribution.projectId).toBe(projectId);
      expect(distribution.totalProfit).toBe(50000000);
      expect(distribution.distributedProfit).toBe(47500000); // After 5% platform fee
    });

    it('should verify profit claims for investor', async () => {
      const claims = await profitsService.getUserProfitClaims(investorUser.id);

      expect(claims).toHaveLength(1);
      expect(claims[0].userId).toBe(investorUser.id);
      expect(claims[0].distributionId).toBe(distributionId);
      expect(claims[0].claimableAmount).toBeGreaterThan(0);
    });

    it('should claim profits with verified identity', async () => {
      // const claimableProfits = await profitsService.getUserClaimableProfits(
      //   investorUser.id
      // );
      // const claimId = claimableProfits[0].id;

      const claim = await profitsService.claimProfits(
        {
          distributionId,
          bankAccountNumber: '1234567890',
        },
        investorUser.id
      );

      expect(claim).toBeDefined();
      expect(claim.status).toBe('processing');
    });
  });

  describe('6. Governance with Identity Verification', () => {
    it('should create governance proposal with verified identity', async () => {
      const proposal = await governanceService.createProposal(
        {
          projectId,
          title: 'Increase Token Supply',
          description: 'Proposal to increase token supply by 50%',
          type: ProposalType.PARAMETER_CHANGE,
          votingStartDate: new Date(
            Date.now() + 24 * 60 * 60 * 1000
          ).toISOString(), // Start tomorrow
          votingEndDate: new Date(
            Date.now() + 8 * 24 * 60 * 60 * 1000
          ).toISOString(), // End in 8 days
          quorum: 0.3, // 30% quorum
          threshold: 0.51, // 51% threshold
          contractCall: {
            targetContract: '0x123',
            methodName: 'increaseSupply',
            parameters: [150000], // New supply
          },
        },
        investorUser.id
      );

      proposalId = proposal.id;

      expect(proposal).toBeDefined();
      expect(proposal.projectId).toBe(projectId);
      expect(proposal.proposerId).toBe(investorUser.id);
      expect(proposal.title).toBe('Increase Token Supply');
    });

    it('should vote on proposal with verified identity', async () => {
      const vote = await governanceService.voteOnProposal(
        {
          proposalId,
          vote: VoteOption.FOR,
          reason: 'This will help project growth',
        },
        investorUser.id
      );

      expect(vote).toBeDefined();
      expect(vote.proposalId).toBe(proposalId);
      expect(vote.userId).toBe(investorUser.id);
      expect(vote.vote).toBe('for');
    });

    it('should verify voting power calculation', async () => {
      const votingPower = await governanceService.getUserVotingPower(
        investorUser.id,
        projectId
      );

      expect(votingPower).toBe(100); // Based on 100 tokens owned
    });
  });

  describe('7. API Endpoints Integration Tests', () => {
    it('should get identity status via API', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/identity/status')
        .set('Authorization', `Bearer ${investorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isVerified).toBe(true);
    });

    it('should get user claims via API', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/claims/my-claims')
        .set('Authorization', `Bearer ${investorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].claimType).toBe(ClaimTopic.KYC_APPROVED);
    });

    it('should get portfolio via API', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/investments/portfolio')
        .set('Authorization', `Bearer ${investorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].investment.projectId).toBe(projectId);
    });

    it('should get profit claims via API', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/profits/my-claims')
        .set('Authorization', `Bearer ${investorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].distributionId).toBe(distributionId);
    });

    it('should get governance proposals via API', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/governance/proposals/${projectId}`)
        .set('Authorization', `Bearer ${investorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Increase Token Supply');
    });

    it('should enforce identity verification on protected endpoints', async () => {
      // Try to access protected endpoint without proper claims
      // const newInvestor = await usersService.findOrCreateUser({
      //   email: 'unverified@example.com',
      //   walletAddress: '0xunverified123',
      //   web3AuthId: 'unverified-web3auth',
      // });

      const unverifiedAuth = await authService.authenticateWithWeb3Auth({
        idToken: 'mock-unverified-token',
      });
      const unverifiedToken = unverifiedAuth.accessToken;

      const response = await request(app.getHttpServer())
        .get('/api/investments/portfolio')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .expect(403);

      expect(response.body.message).toContain('KYC verification required');
    });
  });

  describe('8. Cross-Project Identity Benefits', () => {
    it('should create second project with same SPV', async () => {
      const secondProject = await projectsService.createProject(
        {
          name: 'Jakarta LRT Phase 3',
          description: 'Extension of Jakarta LRT network',
          category: ProjectCategory.TRANSPORTATION,
          province: 'DKI Jakarta',
          city: 'Jakarta',
          totalValue: 5000000000, // 5 billion IDR
          tokenPrice: 50000, // 50k IDR per token
          totalTokens: 100000,
          minimumInvestment: 500000, // 500k IDR
          maximumInvestment: 50000000, // 50 million IDR
          tokenSymbol: 'JLRTX3',
          tokenName: 'Jakarta LRT Phase 3 Token',
          offeringStartDate: '2024-01-01',
          offeringEndDate: '2024-12-31',
          concessionStartDate: '2025-01-01',
          concessionEndDate: '2055-01-01',
          expectedAnnualReturn: 7.5,
          riskLevel: 2,
          documentUrls: [],
        },
        spvUser.id
      );

      // Submit and approve second project
      await projectsService.submitForApproval(secondProject.id, spvUser.id);
      await projectsService.approveProject(
        secondProject.id,
        {
          action: 'approve' as any,
          reason: 'Second project approved',
        },
        adminUser.id
      );

      expect(secondProject).toBeDefined();
      expect(secondProject.name).toBe('Jakarta LRT Phase 3');
    });

    it('should allow verified investor to invest in second project immediately', async () => {
      // Get the second project
      const projects = await projectsService.findProjectsBySPV(spvUser.id);
      const secondProject = projects.find(
        p => p.name === 'Jakarta LRT Phase 3'
      );

      // Investor can invest immediately without additional KYC
      const secondInvestment = await investmentsService.createInvestment(
        {
          projectId: secondProject.id,
          tokenAmount: 200, // 200 tokens
          investmentAmount: 10000000, // 10 million IDR
          investmentType: 'primary' as any,
          email: investorUser.email,
          phoneNumber: '+6281234567890',
          fullName: 'Test Investor',
        },
        investorUser.id
      );

      expect(secondInvestment).toBeDefined();
      expect(secondInvestment.investment.userId).toBe(investorUser.id);
      expect(secondInvestment.investment.projectId).toBe(secondProject.id);

      // Verify portfolio now contains both projects
      const portfolio = await investmentsService.getUserPortfolio(
        investorUser.id
      );
      expect(portfolio).toHaveLength(2);
    });
  });

  describe('9. System Performance and Load Testing', () => {
    it('should handle multiple simultaneous operations', async () => {
      const operations = [];

      // Simulate 10 concurrent operations
      for (let i = 0; i < 10; i++) {
        operations.push(
          // Portfolio check
          investmentsService.getUserPortfolio(investorUser.id),
          // Identity verification check
          identityService.verifyIdentity(investorUser.walletAddress),
          // Claims check
          claimsService.getClaimsByIdentity(investorUser.walletAddress),
          // Profit claims check
          profitsService.getUserProfitClaims(investorUser.id)
        );
      }

      const results = await Promise.all(operations);
      expect(results).toHaveLength(40); // 10 operations × 4 calls each
    });

    it('should maintain data consistency during concurrent operations', async () => {
      // Perform multiple operations simultaneously
      const [portfolio, claims, profits] = await Promise.all([
        investmentsService.getUserPortfolio(investorUser.id),
        claimsService.getClaimsByIdentity(investorUser.walletAddress),
        profitsService.getUserProfitClaims(investorUser.id),
      ]);

      // Verify data consistency
      expect(portfolio).toHaveLength(2); // Two investments
      expect(claims).toHaveLength(1); // One KYC claim
      expect(profits).toHaveLength(1); // One profit claim

      // Verify cross-references
      expect(portfolio[0].investment.userId).toBe(investorUser.id);
      expect(claims[0].identityId).toBe(investorUser.walletAddress);
      expect(profits[0].userId).toBe(investorUser.id);
    });
  });

  describe('10. Security and Compliance Validation', () => {
    it('should enforce identity verification for all protected operations', async () => {
      // Test all major protected endpoints
      const protectedEndpoints = [
        '/api/investments/create',
        '/api/profits/claim',
        '/api/governance/proposals',
        '/api/governance/vote',
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app.getHttpServer())
          .post(endpoint)
          .set('Authorization', `Bearer ${investorToken}`)
          .send({});

        // Should not fail due to identity verification (will fail for other reasons)
        expect(response.status).not.toBe(403);
      }
    });

    it('should maintain audit trail for all operations', async () => {
      // Verify that all operations are logged
      const userClaims = await claimsService.getClaimsByIdentity(
        investorUser.walletAddress
      );
      const userInvestments = await investmentsService.getUserInvestments(
        investorUser.id
      );
      const userProfits = await profitsService.getUserProfitClaims(
        investorUser.id
      );

      // Check that records exist
      expect(userClaims.length).toBeGreaterThan(0);
      expect(userInvestments.length).toBeGreaterThan(0);
      expect(userProfits.length).toBeGreaterThan(0);

      // All records should have creation timestamps
      expect(userClaims[0].issuedAt).toBeDefined();
      expect(userInvestments[0].createdAt).toBeDefined();
      expect(userProfits[0].createdAt).toBeDefined();

      // All records should have update timestamps
      expect(userClaims[0].updatedAt).toBeDefined();
      expect(userInvestments[0].updatedAt).toBeDefined();
    });
  });
});
