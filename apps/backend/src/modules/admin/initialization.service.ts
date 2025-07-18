import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../../common/services/firebase.service';
import { UsersService } from '../users/users.service';
import { IdentityService } from '../identity/identity.service';
import { ClaimsService } from '../claims/claims.service';
import { TrustedIssuersService } from '../trusted-issuers/trusted-issuers.service';
import { InitializeDataDto } from './dto/initialize-data.dto';
import { UserRole, User } from '../../common/types';

@Injectable()
export class InitializationService {
  private readonly logger = new Logger(InitializationService.name);

  constructor(
    private firebaseService: FirebaseService,
    private usersService: UsersService,
    private identityService: IdentityService,
    private claimsService: ClaimsService,
    private trustedIssuersService: TrustedIssuersService,
    private configService: ConfigService
  ) {}

  async checkIfInitialized(): Promise<boolean> {
    try {
      const systemConfig = await this.firebaseService.getDocument(
        'system_config',
        'initialization'
      );
      return systemConfig.exists && systemConfig.data()?.isInitialized === true;
    } catch (error) {
      this.logger.warn('Failed to check initialization status', error);
      return false;
    }
  }

  async initializePlatform(
    initializeDataDto: InitializeDataDto,
    adminId: string
  ): Promise<any> {
    this.logger.log('Starting platform initialization');

    const results = {
      adminUser: null,
      systemConfigs: null,
      identityRegistry: null,
      trustedIssuers: [],
      claimTopics: [],
      sampleProjects: [],
      sampleInvestments: [],
      sampleSPVs: [],
      summary: {
        totalUsers: 0,
        totalProjects: 0,
        totalInvestments: 0,
        totalIdentities: 0,
        totalClaims: 0,
        totalTrustedIssuers: 0,
        totalClaimTopics: 0,
      },
    };

    try {
      // 1. Initialize system configurations
      if (initializeDataDto.initializeSystemConfigs !== false) {
        results.systemConfigs = await this.initializeSystemConfigs(adminId);
      }

      // 2. Create default admin user if provided
      if (initializeDataDto.adminUser) {
        results.adminUser = await this.createDefaultAdminUser(
          initializeDataDto.adminUser,
          initializeDataDto.skipFirebaseAuth
        );
        results.summary.totalUsers++;
      }

      // 3. Initialize identity registry
      if (initializeDataDto.initializeIdentityRegistry !== false) {
        results.identityRegistry = await this.initializeIdentityRegistry();
        results.claimTopics = await this.initializeClaimTopics();
        results.summary.totalClaimTopics = results.claimTopics.length;
      }

      // 4. Initialize trusted issuers
      if (initializeDataDto.initializeTrustedIssuers !== false) {
        results.trustedIssuers = await this.initializeTrustedIssuers();
        results.summary.totalTrustedIssuers = results.trustedIssuers.length;
      }

      // 5. Create sample data if requested
      if (initializeDataDto.includeSampleData) {
        const sampleData = await this.createSampleData();
        results.sampleProjects = sampleData.projects;
        results.sampleInvestments = sampleData.investments;
        results.sampleSPVs = sampleData.spvs;
        results.summary.totalProjects = sampleData.projects.length;
        results.summary.totalInvestments = sampleData.investments.length;
        results.summary.totalUsers += sampleData.users.length;
      }

      // 6. Create development data if requested
      if (initializeDataDto.includeDevData) {
        const devData = await this.createDevelopmentData();
        results.summary.totalUsers += devData.users.length;
        results.summary.totalProjects += devData.projects.length;
        results.summary.totalInvestments += devData.investments.length;
        results.summary.totalIdentities += devData.identities.length;
        results.summary.totalClaims += devData.claims.length;
      }

      // 7. Mark platform as initialized
      await this.markPlatformAsInitialized(adminId);

      this.logger.log('Platform initialization completed successfully');
      return results;
    } catch (error) {
      this.logger.error('Platform initialization failed', error);
      throw error;
    }
  }

  async initializeDevelopmentData(adminId: string): Promise<any> {
    this.logger.log('Starting development platform initialization');

    const devData = {
      users: [],
      projects: [],
      investments: [],
      identities: [],
      claims: [],
      governance: [],
      profits: [],
      summary: {
        totalUsers: 0,
        totalProjects: 0,
        totalInvestments: 0,
        totalIdentities: 0,
        totalClaims: 0,
        totalGovernance: 0,
        totalProfits: 0,
      },
    };

    try {
      // Create comprehensive development data
      const fullDevData = await this.createComprehensiveDevelopmentData();

      Object.assign(devData, fullDevData);

      // Update summary
      devData.summary.totalUsers = devData.users.length;
      devData.summary.totalProjects = devData.projects.length;
      devData.summary.totalInvestments = devData.investments.length;
      devData.summary.totalIdentities = devData.identities.length;
      devData.summary.totalClaims = devData.claims.length;
      devData.summary.totalGovernance = devData.governance.length;
      devData.summary.totalProfits = devData.profits.length;

      // Mark as initialized
      await this.markPlatformAsInitialized(adminId, true);

      this.logger.log(
        'Development platform initialization completed successfully'
      );
      return devData;
    } catch (error) {
      this.logger.error('Development platform initialization failed', error);
      throw error;
    }
  }

  async resetPlatform(adminId: string): Promise<any> {
    this.logger.warn(
      'Starting platform reset - This is a destructive operation'
    );

    const resetResults = {
      collections: [],
      preservedData: {
        adminUsers: [],
        systemConfigs: [],
      },
      deletedCounts: {
        users: 0,
        projects: 0,
        investments: 0,
        identities: 0,
        claims: 0,
        governance: 0,
        profits: 0,
        auditLogs: 0,
      },
    };

    try {
      // Collections to reset (preserve some admin data)
      const collectionsToReset = [
        'projects',
        'investments',
        'identity_registry',
        'claims',
        'trusted_issuers',
        'governance_proposals',
        'profit_distributions',
        'audit_logs',
        'notifications',
        'payments',
      ];

      // Reset collections
      for (const collection of collectionsToReset) {
        const count = await this.clearCollection(collection);
        resetResults.deletedCounts[collection] = count;
        resetResults.collections.push(collection);
      }

      // Reset users but preserve admins
      const adminUsers = await this.preserveAdminUsers(adminId);
      resetResults.preservedData.adminUsers = adminUsers;

      // Reset system configs to defaults
      const systemConfigs = await this.resetSystemConfigs(adminId);
      resetResults.preservedData.systemConfigs = systemConfigs;

      // Mark as uninitialized
      await this.markPlatformAsUninitialized(adminId);

      this.logger.warn('Platform reset completed successfully');
      return resetResults;
    } catch (error) {
      this.logger.error('Platform reset failed', error);
      throw error;
    }
  }

  async getPlatformStatus(): Promise<any> {
    try {
      const isInitialized = await this.checkIfInitialized();

      // Get counts from various collections
      const [
        userCount,
        projectCount,
        investmentCount,
        identityCount,
        trustedIssuerCount,
        claimTopicCount,
      ] = await Promise.all([
        this.getCollectionCount('users'),
        this.getCollectionCount('projects'),
        this.getCollectionCount('investments'),
        this.getCollectionCount('identity_registry'),
        this.getCollectionCount('trusted_issuers'),
        this.getCollectionCount('claim_topics'),
      ]);

      // Get admin count
      const adminCount = await this.getAdminCount();

      // Get initialization date
      let initializationDate = null;
      if (isInitialized) {
        const systemConfig = await this.firebaseService.getDocument(
          'system_config',
          'initialization'
        );
        if (systemConfig.exists) {
          initializationDate = systemConfig.data()?.createdAt?.toDate();
        }
      }

      return {
        isInitialized,
        initializationDate,
        adminCount,
        userCount,
        projectCount,
        investmentCount,
        identityRegistryCount: identityCount,
        trustedIssuerCount,
        claimTopicCount,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to get platform status', error);
      throw error;
    }
  }

  // Private helper methods

  private async createDefaultAdminUser(
    adminUserDto: any,
    skipFirebaseAuth = false
  ): Promise<User> {
    this.logger.log('Creating default admin user');

    try {
      // Check if admin user already exists
      const existingUser = await this.usersService.findByEmail(
        adminUserDto.email
      );
      if (existingUser) {
        this.logger.warn('Admin user already exists, updating role to admin');
        return await this.usersService.updateUser(existingUser.id, {
          role: UserRole.ADMIN,
        });
      }

      // Create Firebase Auth user if not skipping
      let firebaseUid = null;
      if (!skipFirebaseAuth) {
        try {
          const firebaseUser = await admin.auth().createUser({
            email: adminUserDto.email,
            emailVerified: true,
            displayName: `${adminUserDto.firstName} ${adminUserDto.lastName}`,
          });
          firebaseUid = firebaseUser.uid;
          this.logger.log('Firebase Auth user created successfully');
        } catch (firebaseError) {
          this.logger.warn(
            'Firebase Auth user creation failed, continuing without',
            firebaseError
          );
        }
      }

      // Create user in Firestore
      const adminUser = await this.usersService.findOrCreateUser({
        email: adminUserDto.email,
        walletAddress: adminUserDto.walletAddress,
        firebaseUid,
      });

      // Update user with admin role and complete profile
      const updatedAdmin = await this.usersService.updateUser(adminUser.id, {
        role: UserRole.ADMIN,
        profile: {
          firstName: adminUserDto.firstName,
          lastName: adminUserDto.lastName,
          phoneNumber: adminUserDto.phoneNumber || '',
          dateOfBirth: '1990-01-01',
          nationality: 'ID',
          address: {
            street: '',
            city: 'Jakarta',
            province: 'DKI Jakarta',
            postalCode: '12345',
            country: 'Indonesia',
          },
        },
      });

      this.logger.log('Default admin user created successfully');
      return updatedAdmin;
    } catch (error) {
      this.logger.error('Failed to create default admin user', error);
      throw error;
    }
  }

  private async initializeSystemConfigs(adminId: string): Promise<any> {
    this.logger.log('Initializing system configurations');

    const systemConfigs = {
      platformFees: {
        listingFee: 0.02, // 2%
        managementFee: 0.05, // 5%
        transactionFee: 0.001, // 0.1%
        lastUpdated: new Date(),
        updatedBy: adminId,
      },
      maintenanceMode: {
        enabled: false,
        message: 'Platform under maintenance',
        lastUpdated: new Date(),
        updatedBy: adminId,
      },
      systemSettings: {
        maxInvestmentAmount: 1000000000, // 1 billion IDR
        minInvestmentAmount: 100000, // 100k IDR
        maxProjectFunding: 100000000000, // 100 billion IDR
        defaultCurrency: 'IDR',
        supportedCurrencies: ['IDR', 'USDT', 'ETH'],
        lastUpdated: new Date(),
        updatedBy: adminId,
      },
      kycSettings: {
        providers: ['verihubs', 'sumsub', 'jumio'],
        defaultProvider: 'verihubs',
        requiredDocuments: ['identity_card', 'selfie'],
        expiryDays: 365,
        lastUpdated: new Date(),
        updatedBy: adminId,
      },
    };

    // Save each configuration
    for (const [key, config] of Object.entries(systemConfigs)) {
      await this.firebaseService.setDocument('system_config', key, config);
    }

    this.logger.log('System configurations initialized successfully');
    return systemConfigs;
  }

  private async initializeIdentityRegistry(): Promise<any> {
    this.logger.log('Initializing identity registry');

    const identityRegistry = {
      registryInfo: {
        name: 'Partisipro Identity Registry',
        description: 'Central identity registry for Partisipro platform',
        version: '1.0.0',
        createdAt: new Date(),
        isActive: true,
      },
      registrySettings: {
        autoApprovalEnabled: false,
        requiresManualReview: true,
        defaultClaimTopics: [1, 2, 3], // KYC_APPROVED, ACCREDITED_INVESTOR, AML_CLEARED
        claimExpiryDays: 365,
        maxClaimsPerIdentity: 10,
      },
    };

    await this.firebaseService.setDocument(
      'identity_registry',
      'registry_info',
      identityRegistry
    );

    this.logger.log('Identity registry initialized successfully');
    return identityRegistry;
  }

  private async initializeClaimTopics(): Promise<any[]> {
    this.logger.log('Initializing claim topics');

    const claimTopics = [
      {
        id: 1,
        name: 'KYC_APPROVED',
        description: 'Know Your Customer verification approved',
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 2,
        name: 'ACCREDITED_INVESTOR',
        description: 'Accredited investor status verified',
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 3,
        name: 'AML_CLEARED',
        description: 'Anti-Money Laundering check cleared',
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 4,
        name: 'INSTITUTIONAL_INVESTOR',
        description: 'Institutional investor status verified',
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 5,
        name: 'RETAIL_QUALIFIED',
        description: 'Retail investor qualification verified',
        isActive: true,
        createdAt: new Date(),
      },
    ];

    // Save each claim topic
    for (const topic of claimTopics) {
      await this.firebaseService.setDocument(
        'claim_topics',
        topic.id.toString(),
        topic
      );
    }

    this.logger.log('Claim topics initialized successfully');
    return claimTopics;
  }

  private async initializeTrustedIssuers(): Promise<any[]> {
    this.logger.log('Initializing trusted issuers');

    const trustedIssuers = [
      {
        name: 'Partisipro KYC Service',
        description: 'Internal KYC verification service',
        walletAddress: '0x1234567890123456789012345678901234567890',
        authorizedTopics: [1, 2, 3, 4, 5],
        isActive: true,
        createdAt: new Date(),
      },
      {
        name: 'Verihubs Indonesia',
        description: 'External KYC provider for Indonesian users',
        walletAddress: '0x2345678901234567890123456789012345678901',
        authorizedTopics: [1, 3, 5],
        isActive: true,
        createdAt: new Date(),
      },
      {
        name: 'Sumsub Global',
        description: 'Global KYC and AML verification service',
        walletAddress: '0x3456789012345678901234567890123456789012',
        authorizedTopics: [1, 2, 3, 4],
        isActive: true,
        createdAt: new Date(),
      },
    ];

    // Save each trusted issuer
    for (const issuer of trustedIssuers) {
      await this.firebaseService.addDocument('trusted_issuers', issuer);
    }

    this.logger.log('Trusted issuers initialized successfully');
    return trustedIssuers;
  }

  private async createSampleData(): Promise<any> {
    this.logger.log('Creating sample data');

    // This would create sample projects, investments, users, etc.
    // For brevity, returning empty arrays
    return {
      projects: [],
      investments: [],
      spvs: [],
      users: [],
    };
  }

  private async createDevelopmentData(): Promise<any> {
    this.logger.log('Creating development data');

    // This would create comprehensive development data
    // For brevity, returning empty arrays
    return {
      users: [],
      projects: [],
      investments: [],
      identities: [],
      claims: [],
    };
  }

  private async createComprehensiveDevelopmentData(): Promise<any> {
    this.logger.log('Creating comprehensive development data');

    // This would create extensive development data
    // For brevity, returning empty arrays
    return {
      users: [],
      projects: [],
      investments: [],
      identities: [],
      claims: [],
      governance: [],
      profits: [],
    };
  }

  private async markPlatformAsInitialized(
    adminId: string,
    isDevelopment = false
  ): Promise<void> {
    const initializationData = {
      isInitialized: true,
      initializedBy: adminId,
      initializationType: isDevelopment ? 'development' : 'production',
      createdAt: new Date(),
    };

    await this.firebaseService.setDocument(
      'system_config',
      'initialization',
      initializationData
    );
  }

  private async markPlatformAsUninitialized(adminId: string): Promise<void> {
    const resetData = {
      isInitialized: false,
      resetBy: adminId,
      resetAt: new Date(),
    };

    await this.firebaseService.setDocument(
      'system_config',
      'initialization',
      resetData
    );
  }

  private async clearCollection(collectionName: string): Promise<number> {
    try {
      const docs = await this.firebaseService.getDocuments(collectionName);
      const batch = this.firebaseService.getBatch();

      let count = 0;
      docs.docs.forEach(doc => {
        batch.delete(doc.ref);
        count++;
      });

      if (count > 0) {
        await batch.commit();
      }

      this.logger.log(`Cleared ${count} documents from ${collectionName}`);
      return count;
    } catch (error) {
      this.logger.error(`Failed to clear collection ${collectionName}`, error);
      return 0;
    }
  }

  private async preserveAdminUsers(adminId: string): Promise<User[]> {
    adminId;
    const adminUsers = await this.usersService.getUsersByRole(UserRole.ADMIN);

    // Clear non-admin users
    const allUsers = await this.firebaseService.getDocuments('users');
    const batch = this.firebaseService.getBatch();

    let deletedCount = 0;
    allUsers.docs.forEach(doc => {
      const user = doc.data();
      if (user.role !== UserRole.ADMIN) {
        batch.delete(doc.ref);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      await batch.commit();
    }

    this.logger.log(
      `Preserved ${adminUsers.length} admin users, deleted ${deletedCount} non-admin users`
    );
    return adminUsers;
  }

  private async resetSystemConfigs(adminId: string): Promise<any> {
    // Re-initialize system configs
    return await this.initializeSystemConfigs(adminId);
  }

  private async getCollectionCount(collectionName: string): Promise<number> {
    try {
      const docs = await this.firebaseService.getDocuments(collectionName);
      return docs.size;
    } catch (error) {
      this.logger.warn(
        `Failed to get count for collection ${collectionName}`,
        error
      );
      return 0;
    }
  }

  private async getAdminCount(): Promise<number> {
    try {
      const adminUsers = await this.usersService.getUsersByRole(UserRole.ADMIN);
      return adminUsers.length;
    } catch (error) {
      this.logger.warn('Failed to get admin count', error);
      return 0;
    }
  }
}
