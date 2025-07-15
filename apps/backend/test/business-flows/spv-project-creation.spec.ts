/**
 * Business Flow Test: SPV Project Creation
 * Tests the complete SPV project creation workflow including:
 * 1. SPV registration and identity verification
 * 2. Project creation with validation
 * 3. Project submission and approval process
 * 4. Contract deployment simulation
 * 5. Project activation and listing
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
// import { AuthService } from '../../src/modules/auth/auth.service';
import { UsersService } from '../../src/modules/users/users.service';
import { IdentityService } from '../../src/modules/identity/identity.service';
import { ClaimsService } from '../../src/modules/claims/claims.service';
import { TrustedIssuersService } from '../../src/modules/trusted-issuers/trusted-issuers.service';
import { ProjectsService } from '../../src/modules/projects/projects.service';
import { AdminService } from '../../src/modules/admin/admin.service';
import { BlockchainService } from '../../src/modules/blockchain/blockchain.service';
import { Web3AuthService } from '../../src/modules/auth/web3auth.service';
import {
  User,
  UserRole,
  KYCStatus,
  ClaimTopic,
  ProjectStatus,
  ProjectCategory,
} from '../../src/common/types';
import { setupTestDatabase, cleanupTestDatabase } from '../setup';
import { createWeb3AuthMock } from '../utils/web3auth-mock';

describe('Business Flow: SPV Project Creation', () => {
  let app: INestApplication;
  // let authService: AuthService;
  let usersService: UsersService;
  let identityService: IdentityService;
  let claimsService: ClaimsService;
  let trustedIssuersService: TrustedIssuersService;
  let projectsService: ProjectsService;
  let adminService: AdminService;
  let blockchainService: BlockchainService;

  // Test actors
  let adminUser: User;
  let spvUser: User;
  let spvUser2: User;
  let trustedIssuerId: string;
  let projectId: string;
  let projectId2: string;

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
    // authService = app.get<AuthService>(AuthService);
    usersService = app.get<UsersService>(UsersService);
    identityService = app.get<IdentityService>(IdentityService);
    claimsService = app.get<ClaimsService>(ClaimsService);
    trustedIssuersService = app.get<TrustedIssuersService>(
      TrustedIssuersService
    );
    projectsService = app.get<ProjectsService>(ProjectsService);
    adminService = app.get<AdminService>(AdminService);
    blockchainService = app.get<BlockchainService>(BlockchainService);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await app.close();
  });

  describe('1. Initial Setup and Admin Configuration', () => {
    it('should create platform admin user', async () => {
      adminUser = await usersService.findOrCreateUser({
        email: 'admin@partisipro.com',
        walletAddress: '0x1234567890123456789012345678901234567890',
        web3AuthId: 'admin-web3auth-id',
      });

      // Update to admin role
      adminUser = await usersService.updateUser(adminUser.id, {
        role: UserRole.ADMIN,
      });

      expect(adminUser.role).toBe(UserRole.ADMIN);
      expect(adminUser.email).toBe('admin@partisipro.com');
    });

    it('should configure trusted KYC issuer', async () => {
      const trustedIssuer = await trustedIssuersService.addTrustedIssuer(
        {
          name: 'Verihubs Indonesia',
          issuerAddress: '0xverihubs1234567890123456789012345678901234567890',
          authorizedClaims: [
            ClaimTopic.KYC_APPROVED,
            ClaimTopic.ACCREDITED_INVESTOR,
            ClaimTopic.AML_CLEARED,
          ],
          metadata: {
            companyName: 'Verihubs Indonesia',
            website: 'https://verihubs.com',
            contactEmail: 'support@verihubs.com',
            licenseNumber: 'KYC-ID-2024-001',
          },
        },
        adminUser.id
      );

      trustedIssuerId = trustedIssuer.id;

      expect(trustedIssuer.name).toBe('Verihubs Indonesia');
      expect(trustedIssuer.authorizedClaims).toContain(ClaimTopic.KYC_APPROVED);
      expect(trustedIssuer.authorizedClaims).toContain(
        ClaimTopic.ACCREDITED_INVESTOR
      );
      expect(trustedIssuer.authorizedClaims).toContain(ClaimTopic.AML_CLEARED);
    });

    it('should verify platform is ready for SPV onboarding', async () => {
      const platformStatus = await adminService.getPlatformStatus();

      expect(platformStatus.totalAdmins).toBe(1);
      expect(platformStatus.totalTrustedIssuers).toBe(1);
      expect(platformStatus.totalProjects).toBe(0);
      expect(platformStatus.totalUsers).toBe(1);
    });
  });

  describe('2. SPV User Registration and Identity Verification', () => {
    it('should register first SPV user', async () => {
      spvUser = await usersService.findOrCreateUser({
        email: 'spv1@jasamarga.com',
        walletAddress: '0xspv1234567890123456789012345678901234567890',
        web3AuthId: 'spv1-web3auth-id',
      });

      // Update to SPV role
      spvUser = await usersService.updateUser(spvUser.id, {
        role: UserRole.SPV,
        profile: {
          firstName: 'PT',
          lastName: 'Jasa Marga',
          companyName: 'PT Jasa Marga (Persero) Tbk',
          phoneNumber: '+6221-7941234',
          companyAddress: {
            street: 'Jl. Tol Jagorawi Km. 15.5',
            city: 'Jakarta',
            state: 'DKI Jakarta',
            postalCode: '13770',
            country: 'Indonesia',
          },
          businessLicense: 'NPWP-001234567890',
          businessType: 'State-Owned Enterprise',
        },
      });

      expect(spvUser.role).toBe(UserRole.SPV);
      expect(spvUser.email).toBe('spv1@jasamarga.com');
      expect(spvUser.profile.companyName).toBe('PT Jasa Marga (Persero) Tbk');
    });

    it('should register second SPV user', async () => {
      spvUser2 = await usersService.findOrCreateUser({
        email: 'spv2@wikagedung.com',
        walletAddress: '0xspv2234567890123456789012345678901234567890',
        web3AuthId: 'spv2-web3auth-id',
      });

      // Update to SPV role
      spvUser2 = await usersService.updateUser(spvUser2.id, {
        role: UserRole.SPV,
        profile: {
          firstName: 'PT',
          lastName: 'Wika Gedung',
          companyName: 'PT Wijaya Karya Gedung Tbk',
          phoneNumber: '+6221-7941235',
          companyAddress: {
            street: 'Jl. D.I. Panjaitan Kav. 9-10',
            city: 'Jakarta',
            state: 'DKI Jakarta',
            postalCode: '13340',
            country: 'Indonesia',
          },
          businessLicense: 'NPWP-001234567891',
          businessType: 'State-Owned Enterprise',
        },
      });

      expect(spvUser2.role).toBe(UserRole.SPV);
      expect(spvUser2.email).toBe('spv2@wikagedung.com');
    });

    it('should register SPV identities in ERC-3643 system', async () => {
      // Register first SPV identity
      const spvIdentity1 = await identityService.registerIdentity(
        spvUser.walletAddress,
        {
          userId: spvUser.id,
          userAddress: spvUser.walletAddress,
          metadata: {
            provider: 'manual',
            registrationType: 'spv',
            companyName: spvUser.profile.companyName,
            businessLicense: spvUser.profile.businessLicense,
          },
        }
      );

      // Register second SPV identity
      const spvIdentity2 = await identityService.registerIdentity(
        spvUser2.walletAddress,
        {
          userId: spvUser2.id,
          userAddress: spvUser2.walletAddress,
          metadata: {
            provider: 'manual',
            registrationType: 'spv',
            companyName: spvUser2.profile.companyName,
            businessLicense: spvUser2.profile.businessLicense,
          },
        }
      );

      expect(spvIdentity1.id).toBe(spvUser.walletAddress);
      expect(spvIdentity1.userId).toBe(spvUser.id);
      expect(spvIdentity1.status).toBe('pending');

      expect(spvIdentity2.id).toBe(spvUser2.walletAddress);
      expect(spvIdentity2.userId).toBe(spvUser2.id);
      expect(spvIdentity2.status).toBe('pending');
    });

    it('should verify SPV corporate KYC and issue claims', async () => {
      // Issue claims for first SPV
      await claimsService.issueClaim({
        identityId: spvUser.walletAddress,
        claimTopic: ClaimTopic.KYC_APPROVED,
        issuer: trustedIssuerId,
        data: {
          provider: 'manual',
          verificationId: 'spv1-kyc-verification-001',
          verifiedAt: new Date(),
          kycLevel: 'corporate',
          companyVerification: {
            companyName: 'PT Jasa Marga (Persero) Tbk',
            businessLicense: 'NPWP-001234567890',
            incorporationDate: '1978-03-01',
            registrationNumber: 'AHU-001234567890',
            verificationStatus: 'verified',
          },
        },
      });

      await claimsService.issueClaim({
        identityId: spvUser.walletAddress,
        claimTopic: ClaimTopic.ACCREDITED_INVESTOR,
        issuer: trustedIssuerId,
        data: {
          provider: 'manual',
          verificationId: 'spv1-accredited-001',
          verifiedAt: new Date(),
          accreditationType: 'corporate',
          netWorth: 1000000000000, // 1 trillion IDR
          revenue: 500000000000, // 500 billion IDR
        },
      });

      // Issue claims for second SPV
      await claimsService.issueClaim({
        identityId: spvUser2.walletAddress,
        claimTopic: ClaimTopic.KYC_APPROVED,
        issuer: trustedIssuerId,
        data: {
          provider: 'manual',
          verificationId: 'spv2-kyc-verification-001',
          verifiedAt: new Date(),
          kycLevel: 'corporate',
          companyVerification: {
            companyName: 'PT Wijaya Karya Gedung Tbk',
            businessLicense: 'NPWP-001234567891',
            incorporationDate: '1960-08-11',
            registrationNumber: 'AHU-001234567891',
            verificationStatus: 'verified',
          },
        },
      });

      // Update identity status to verified
      await identityService.updateIdentityStatus(spvUser.walletAddress, {
        status: 'verified' as any,
        reason: 'Corporate KYC verification completed',
      });

      await identityService.updateIdentityStatus(spvUser2.walletAddress, {
        status: 'verified' as any,
        reason: 'Corporate KYC verification completed',
      });

      // Verify identities
      const spvVerification1 = await identityService.verifyIdentity(
        spvUser.walletAddress
      );
      const spvVerification2 = await identityService.verifyIdentity(
        spvUser2.walletAddress
      );

      expect(spvVerification1.isVerified).toBe(true);
      expect(spvVerification2.isVerified).toBe(true);

      // Check user KYC status update
      const updatedSpvUser1 = await usersService.findById(spvUser.id);
      const updatedSpvUser2 = await usersService.findById(spvUser2.id);

      expect(updatedSpvUser1.kyc.status).toBe(KYCStatus.APPROVED);
      expect(updatedSpvUser2.kyc.status).toBe(KYCStatus.APPROVED);
    });

    it('should verify SPV eligibility for project creation', async () => {
      // Check SPV permissions
      const spv1Permissions = await adminService.getSPVPermissions(spvUser.id);
      const spv2Permissions = await adminService.getSPVPermissions(spvUser2.id);

      expect(spv1Permissions.canCreateProjects).toBe(true);
      expect(spv1Permissions.identityVerified).toBe(true);
      expect(spv1Permissions.maxProjects).toBe(10); // Default limit

      expect(spv2Permissions.canCreateProjects).toBe(true);
      expect(spv2Permissions.identityVerified).toBe(true);
      expect(spv2Permissions.maxProjects).toBe(10);
    });
  });

  describe('3. Project Creation Process', () => {
    it('should create first project with complete business details', async () => {
      const project = await projectsService.createProject(
        {
          name: 'Jakarta-Cikampek II Toll Road',
          description:
            'Extension of Jakarta-Cikampek toll road with modern infrastructure and smart traffic management systems',
          category: ProjectCategory.TRANSPORTATION,
          province: 'Jawa Barat',
          city: 'Karawang',

          // Financial details
          totalValue: 15000000000000, // 15 trillion IDR
          tokenPrice: 1000000, // 1 million IDR per token
          totalTokens: 15000000,
          minimumInvestment: 10000000, // 10 million IDR
          maximumInvestment: 1000000000, // 1 billion IDR

          // Token details
          tokenSymbol: 'JCTRX2',
          tokenName: 'Jakarta-Cikampek II Toll Road Token',

          // Offering timeline
          offeringStartDate: '2024-06-01',
          offeringEndDate: '2024-12-31',

          // Concession details
          concessionStartDate: '2025-01-01',
          concessionEndDate: '2055-12-31',

          // Business projections
          expectedAnnualReturn: 8.5,
          riskLevel: 3,

          // Project details
          projectTimeline: {
            constructionStart: '2024-01-01',
            constructionEnd: '2026-12-31',
            operationStart: '2027-01-01',
            concessionEnd: '2055-12-31',
          },

          economicIndicators: {
            npv: 2000000000000, // 2 trillion IDR
            irr: 12.5,
            paybackPeriod: 8,
            roi: 15.2,
          },

          technicalSpecifications: {
            length: 36.4, // km
            lanes: 6,
            designSpeed: 100, // km/h
            capacity: 150000, // vehicles per day
          },

          environmentalImpact: {
            eiaApproved: true,
            eiaNumber: 'EIA-2024-001',
            carbonFootprint: 850000, // tons CO2
            mitigationMeasures: [
              'Tree planting program',
              'Wildlife crossing bridges',
              'Noise barrier installation',
            ],
          },

          documentUrls: [
            'https://docs.partisipro.com/projects/jctrx2/feasibility-study.pdf',
            'https://docs.partisipro.com/projects/jctrx2/environmental-impact.pdf',
            'https://docs.partisipro.com/projects/jctrx2/financial-projections.pdf',
          ],
        },
        spvUser.id
      );

      projectId = project.id;

      expect(project.name).toBe('Jakarta-Cikampek II Toll Road');
      expect(project.spvId).toBe(spvUser.id);
      expect(project.status).toBe(ProjectStatus.DRAFT);
      expect(project.category).toBe(ProjectCategory.TRANSPORTATION);
      expect(project.totalValue).toBe(15000000000000);
      expect(project.tokenPrice).toBe(1000000);
      expect(project.totalTokens).toBe(15000000);
      expect(project.economicIndicators.npv).toBe(2000000000000);
      expect(project.technicalSpecifications.length).toBe(36.4);
      expect(project.environmentalImpact.eiaApproved).toBe(true);
    });

    it('should create second project with different category', async () => {
      const project = await projectsService.createProject(
        {
          name: 'Jakarta Green Hospital Complex',
          description:
            'Modern healthcare facility with sustainable design and advanced medical equipment',
          category: ProjectCategory.HEALTHCARE,
          province: 'DKI Jakarta',
          city: 'Jakarta',

          // Financial details
          totalValue: 5000000000000, // 5 trillion IDR
          tokenPrice: 500000, // 500k IDR per token
          totalTokens: 10000000,
          minimumInvestment: 5000000, // 5 million IDR
          maximumInvestment: 500000000, // 500 million IDR

          // Token details
          tokenSymbol: 'JGHCX',
          tokenName: 'Jakarta Green Hospital Complex Token',

          // Offering timeline
          offeringStartDate: '2024-07-01',
          offeringEndDate: '2025-01-31',

          // Concession details
          concessionStartDate: '2025-02-01',
          concessionEndDate: '2055-01-31',

          // Business projections
          expectedAnnualReturn: 7.5,
          riskLevel: 2,

          // Project details
          projectTimeline: {
            constructionStart: '2024-03-01',
            constructionEnd: '2026-02-28',
            operationStart: '2026-03-01',
            concessionEnd: '2055-01-31',
          },

          economicIndicators: {
            npv: 1200000000000, // 1.2 trillion IDR
            irr: 10.8,
            paybackPeriod: 9,
            roi: 12.5,
          },

          technicalSpecifications: {
            floorArea: 75000, // m²
            bedCapacity: 800,
            parkingSpaces: 1200,
            operatingRooms: 32,
          },

          environmentalImpact: {
            eiaApproved: true,
            eiaNumber: 'EIA-2024-002',
            carbonFootprint: 125000, // tons CO2
            mitigationMeasures: [
              'Solar panel installation',
              'Rainwater harvesting system',
              'Green building certification',
            ],
          },

          documentUrls: [
            'https://docs.partisipro.com/projects/jghcx/medical-facility-plan.pdf',
            'https://docs.partisipro.com/projects/jghcx/sustainability-report.pdf',
            'https://docs.partisipro.com/projects/jghcx/healthcare-market-analysis.pdf',
          ],
        },
        spvUser2.id
      );

      projectId2 = project.id;

      expect(project.name).toBe('Jakarta Green Hospital Complex');
      expect(project.spvId).toBe(spvUser2.id);
      expect(project.status).toBe(ProjectStatus.DRAFT);
      expect(project.category).toBe(ProjectCategory.HEALTHCARE);
      expect(project.totalValue).toBe(5000000000000);
      expect(project.technicalSpecifications.bedCapacity).toBe(800);
      expect(project.environmentalImpact.eiaApproved).toBe(true);
    });

    it('should validate project creation business rules', async () => {
      // Test minimum investment validation
      await expect(
        projectsService.createProject(
          {
            name: 'Invalid Project',
            description: 'Test project',
            category: ProjectCategory.TRANSPORTATION,
            province: 'Jakarta',
            city: 'Jakarta',
            totalValue: 1000000000,
            tokenPrice: 100000,
            totalTokens: 10000,
            minimumInvestment: 100000000, // Higher than max investment
            maximumInvestment: 50000000,
            tokenSymbol: 'INVX',
            tokenName: 'Invalid Token',
            offeringStartDate: '2024-01-01',
            offeringEndDate: '2024-12-31',
            concessionStartDate: '2025-01-01',
            concessionEndDate: '2055-12-31',
            expectedAnnualReturn: 8.5,
            riskLevel: 3,
            documentUrls: [],
          },
          spvUser.id
        )
      ).rejects.toThrow(
        'Minimum investment cannot be greater than maximum investment'
      );

      // Test token economics validation
      await expect(
        projectsService.createProject(
          {
            name: 'Invalid Project 2',
            description: 'Test project',
            category: ProjectCategory.TRANSPORTATION,
            province: 'Jakarta',
            city: 'Jakarta',
            totalValue: 1000000000,
            tokenPrice: 100000,
            totalTokens: 5000, // Too few tokens for total value
            minimumInvestment: 1000000,
            maximumInvestment: 50000000,
            tokenSymbol: 'INVX2',
            tokenName: 'Invalid Token 2',
            offeringStartDate: '2024-01-01',
            offeringEndDate: '2024-12-31',
            concessionStartDate: '2025-01-01',
            concessionEndDate: '2055-12-31',
            expectedAnnualReturn: 8.5,
            riskLevel: 3,
            documentUrls: [],
          },
          spvUser.id
        )
      ).rejects.toThrow(
        'Token price and total tokens must equal total project value'
      );
    });

    it('should verify project creation updates SPV statistics', async () => {
      const spvStats = await projectsService.getSPVStatistics(spvUser.id);
      const spv2Stats = await projectsService.getSPVStatistics(spvUser2.id);

      expect(spvStats.totalProjects).toBe(1);
      expect(spvStats.totalValue).toBe(15000000000000);
      expect(spvStats.activeProjects).toBe(0); // Still in draft
      expect(spvStats.completedProjects).toBe(0);

      expect(spv2Stats.totalProjects).toBe(1);
      expect(spv2Stats.totalValue).toBe(5000000000000);
      expect(spv2Stats.activeProjects).toBe(0);
      expect(spv2Stats.completedProjects).toBe(0);
    });
  });

  describe('4. Project Submission and Approval Process', () => {
    it('should submit projects for admin approval', async () => {
      // Submit first project
      await projectsService.submitForApproval(projectId, spvUser.id);

      // Submit second project
      await projectsService.submitForApproval(projectId2, spvUser2.id);

      // Verify status changes
      const project1 = await projectsService.findProjectById(projectId);
      const project2 = await projectsService.findProjectById(projectId2);

      expect(project1.status).toBe(ProjectStatus.PENDING_APPROVAL);
      expect(project1.submittedAt).toBeDefined();
      expect(project2.status).toBe(ProjectStatus.PENDING_APPROVAL);
      expect(project2.submittedAt).toBeDefined();
    });

    it('should validate project approval workflow', async () => {
      // Get pending approvals
      const pendingProjects = await adminService.getPendingProjectApprovals();

      expect(pendingProjects).toHaveLength(2);
      expect(pendingProjects.some(p => p.id === projectId)).toBe(true);
      expect(pendingProjects.some(p => p.id === projectId2)).toBe(true);
    });

    it('should approve first project with admin review', async () => {
      await projectsService.approveProject(
        projectId,
        {
          action: 'approve' as any,
          reason:
            'Project meets all technical and financial requirements. Environmental impact assessment approved.',
          conditions: [
            'Must maintain minimum 8% annual return',
            'Environmental monitoring reports required quarterly',
            'Progress reports due monthly during construction',
          ],
        },
        adminUser.id
      );

      const project = await projectsService.findProjectById(projectId);

      expect(project.status).toBe(ProjectStatus.APPROVED);
      expect(project.approvedAt).toBeDefined();
      expect(project.approvedBy).toBe(adminUser.id);
      expect(project.approvalConditions).toHaveLength(3);
    });

    it('should request revision for second project', async () => {
      await projectsService.approveProject(
        projectId2,
        {
          action: 'request_revision' as any,
          reason:
            'Additional documentation required for healthcare facility compliance',
          revisionRequests: [
            'Provide detailed medical equipment specifications',
            'Submit healthcare facility operation license',
            'Include patient capacity analysis',
            'Add infection control protocols documentation',
          ],
        },
        adminUser.id
      );

      const project = await projectsService.findProjectById(projectId2);

      expect(project.status).toBe(ProjectStatus.REVISION_REQUESTED);
      expect(project.revisionRequests).toHaveLength(4);
      expect(project.reviewedBy).toBe(adminUser.id);
    });

    it('should resubmit project after revision', async () => {
      // SPV updates project with additional information
      await projectsService.updateProject(
        projectId2,
        {
          additionalDocuments: [
            'https://docs.partisipro.com/projects/jghcx/medical-equipment-specs.pdf',
            'https://docs.partisipro.com/projects/jghcx/healthcare-operation-license.pdf',
            'https://docs.partisipro.com/projects/jghcx/patient-capacity-analysis.pdf',
            'https://docs.partisipro.com/projects/jghcx/infection-control-protocols.pdf',
          ],
          revisionNotes:
            'All requested documents have been provided. Healthcare facility operation license number: HF-2024-001',
        },
        spvUser2.id
      );

      // Resubmit for approval
      await projectsService.submitForApproval(projectId2, spvUser2.id);

      const project = await projectsService.findProjectById(projectId2);
      expect(project.status).toBe(ProjectStatus.PENDING_APPROVAL);
      expect(project.additionalDocuments).toHaveLength(4);
    });

    it('should approve revised project', async () => {
      await projectsService.approveProject(
        projectId2,
        {
          action: 'approve' as any,
          reason:
            'All revision requirements satisfied. Healthcare facility compliance verified.',
          conditions: [
            'Must maintain minimum 7% annual return',
            'Healthcare compliance audits required annually',
            'Patient safety protocols must be maintained',
          ],
        },
        adminUser.id
      );

      const project = await projectsService.findProjectById(projectId2);

      expect(project.status).toBe(ProjectStatus.APPROVED);
      expect(project.approvedAt).toBeDefined();
      expect(project.approvedBy).toBe(adminUser.id);
      expect(project.approvalConditions).toHaveLength(3);
    });
  });

  describe('5. Smart Contract Deployment and Activation', () => {
    it('should simulate smart contract deployment for approved projects', async () => {
      // Deploy contracts for first project
      const deployment1 = await blockchainService.deployProjectContracts(
        projectId,
        {
          tokenName: 'Jakarta-Cikampek II Toll Road Token',
          tokenSymbol: 'JCTRX2',
          totalSupply: 15000000,
          tokenPrice: 1000000,
          offeringStartDate: '2024-06-01',
          offeringEndDate: '2024-12-31',
        }
      );

      // Deploy contracts for second project
      const deployment2 = await blockchainService.deployProjectContracts(
        projectId2,
        {
          tokenName: 'Jakarta Green Hospital Complex Token',
          tokenSymbol: 'JGHCX',
          totalSupply: 10000000,
          tokenPrice: 500000,
          offeringStartDate: '2024-07-01',
          offeringEndDate: '2025-01-31',
        }
      );

      expect(deployment1.tokenAddress).toBeDefined();
      expect(deployment1.offeringAddress).toBeDefined();
      expect(deployment1.treasuryAddress).toBeDefined();
      expect(deployment1.governanceAddress).toBeDefined();

      expect(deployment2.tokenAddress).toBeDefined();
      expect(deployment2.offeringAddress).toBeDefined();
      expect(deployment2.treasuryAddress).toBeDefined();
      expect(deployment2.governanceAddress).toBeDefined();
    });

    it('should activate projects for public investment', async () => {
      await projectsService.activateProject(projectId, adminUser.id);
      await projectsService.activateProject(projectId2, adminUser.id);

      const project1 = await projectsService.findProjectById(projectId);
      const project2 = await projectsService.findProjectById(projectId2);

      expect(project1.status).toBe(ProjectStatus.ACTIVE);
      expect(project1.activatedAt).toBeDefined();
      expect(project1.activatedBy).toBe(adminUser.id);

      expect(project2.status).toBe(ProjectStatus.ACTIVE);
      expect(project2.activatedAt).toBeDefined();
      expect(project2.activatedBy).toBe(adminUser.id);
    });

    it('should verify projects are listed for public investment', async () => {
      const publicProjects = await projectsService.getPublicProjects();

      expect(publicProjects).toHaveLength(2);
      expect(publicProjects.some(p => p.id === projectId)).toBe(true);
      expect(publicProjects.some(p => p.id === projectId2)).toBe(true);

      const transportationProjects = publicProjects.filter(
        p => p.category === ProjectCategory.TRANSPORTATION
      );
      const healthcareProjects = publicProjects.filter(
        p => p.category === ProjectCategory.HEALTHCARE
      );

      expect(transportationProjects).toHaveLength(1);
      expect(healthcareProjects).toHaveLength(1);
    });
  });

  describe('6. Platform Analytics and Reporting', () => {
    it('should generate comprehensive platform statistics', async () => {
      const platformStats = await adminService.getPlatformStatistics();

      expect(platformStats.totalProjects).toBe(2);
      expect(platformStats.totalProjectValue).toBe(20000000000000); // 20 trillion IDR
      expect(platformStats.activeProjects).toBe(2);
      expect(platformStats.totalSPVs).toBe(2);
      expect(platformStats.totalTokens).toBe(25000000);
      expect(platformStats.averageTokenPrice).toBe(750000); // Average of 1M and 500k

      expect(platformStats.projectsByCategory.transportation).toBe(1);
      expect(platformStats.projectsByCategory.healthcare).toBe(1);

      expect(platformStats.projectsByProvince['Jawa Barat']).toBe(1);
      expect(platformStats.projectsByProvince['DKI Jakarta']).toBe(1);
    });

    it('should generate SPV performance reports', async () => {
      const spv1Report = await adminService.generateSPVReport(spvUser.id);
      const spv2Report = await adminService.generateSPVReport(spvUser2.id);

      expect(spv1Report.spvId).toBe(spvUser.id);
      expect(spv1Report.totalProjects).toBe(1);
      expect(spv1Report.totalValue).toBe(15000000000000);
      expect(spv1Report.activeProjects).toBe(1);
      expect(spv1Report.averageProjectSize).toBe(15000000000000);
      expect(spv1Report.companyName).toBe('PT Jasa Marga (Persero) Tbk');

      expect(spv2Report.spvId).toBe(spvUser2.id);
      expect(spv2Report.totalProjects).toBe(1);
      expect(spv2Report.totalValue).toBe(5000000000000);
      expect(spv2Report.activeProjects).toBe(1);
      expect(spv2Report.averageProjectSize).toBe(5000000000000);
      expect(spv2Report.companyName).toBe('PT Wijaya Karya Gedung Tbk');
    });

    it('should verify audit trail for all operations', async () => {
      const auditLogs = await adminService.getAuditLogs({
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        endDate: new Date(),
        limit: 100,
      });

      expect(auditLogs.length).toBeGreaterThan(0);

      // Check for key operations
      const projectCreationLogs = auditLogs.filter(
        log => log.action === 'PROJECT_CREATED'
      );
      const projectApprovalLogs = auditLogs.filter(
        log => log.action === 'PROJECT_APPROVED'
      );
      const projectActivationLogs = auditLogs.filter(
        log => log.action === 'PROJECT_ACTIVATED'
      );
      const identityVerificationLogs = auditLogs.filter(
        log => log.action === 'IDENTITY_VERIFIED'
      );

      expect(projectCreationLogs).toHaveLength(2);
      expect(projectApprovalLogs).toHaveLength(2);
      expect(projectActivationLogs).toHaveLength(2);
      expect(identityVerificationLogs).toHaveLength(2);
    });
  });

  describe('7. Business Rules and Compliance Verification', () => {
    it('should enforce SPV project limits', async () => {
      // Try to create more projects than allowed
      await adminService.updateSPVLimits(spvUser.id, { maxProjects: 1 });

      await expect(
        projectsService.createProject(
          {
            name: 'Excessive Project',
            description: 'Should be rejected due to limits',
            category: ProjectCategory.TRANSPORTATION,
            province: 'Jakarta',
            city: 'Jakarta',
            totalValue: 1000000000,
            tokenPrice: 100000,
            totalTokens: 10000,
            minimumInvestment: 1000000,
            maximumInvestment: 50000000,
            tokenSymbol: 'EXCX',
            tokenName: 'Excessive Token',
            offeringStartDate: '2024-01-01',
            offeringEndDate: '2024-12-31',
            concessionStartDate: '2025-01-01',
            concessionEndDate: '2055-12-31',
            expectedAnnualReturn: 8.5,
            riskLevel: 3,
            documentUrls: [],
          },
          spvUser.id
        )
      ).rejects.toThrow('SPV has reached maximum project limit');
    });

    it('should verify ERC-3643 compliance for all operations', async () => {
      const spvCompliance = await identityService.getComplianceReport(
        spvUser.walletAddress
      );
      const spv2Compliance = await identityService.getComplianceReport(
        spvUser2.walletAddress
      );

      expect(spvCompliance.isCompliant).toBe(true);
      expect(spvCompliance.verifiedClaims).toHaveLength(2); // KYC and Accredited Investor
      expect(spvCompliance.claimsStatus.kyc).toBe('verified');
      expect(spvCompliance.claimsStatus.accreditedInvestor).toBe('verified');

      expect(spv2Compliance.isCompliant).toBe(true);
      expect(spv2Compliance.verifiedClaims).toHaveLength(1); // KYC only
      expect(spv2Compliance.claimsStatus.kyc).toBe('verified');
    });

    it('should validate project tokenization economics', async () => {
      const project1Economics =
        await projectsService.validateProjectEconomics(projectId);
      const project2Economics =
        await projectsService.validateProjectEconomics(projectId2);

      expect(project1Economics.isValid).toBe(true);
      expect(project1Economics.tokenPrice * project1Economics.totalTokens).toBe(
        project1Economics.totalValue
      );
      expect(project1Economics.minimumInvestment).toBeLessThan(
        project1Economics.maximumInvestment
      );

      expect(project2Economics.isValid).toBe(true);
      expect(project2Economics.tokenPrice * project2Economics.totalTokens).toBe(
        project2Economics.totalValue
      );
      expect(project2Economics.minimumInvestment).toBeLessThan(
        project2Economics.maximumInvestment
      );
    });
  });
});
