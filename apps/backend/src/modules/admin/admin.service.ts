import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseService } from '../../common/services/firebase.service';
import { UsersService } from '../users/users.service';
import { ProjectsService } from '../projects/projects.service';
import { InvestmentsService } from '../investments/investments.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { UpdateFeesDto, WhitelistSpvDto, MaintenanceModeDto } from './dto';
import { SystemConfiguration } from '../../common/types';

export interface PlatformAnalytics {
  totalUsers: number;
  totalProjects: number;
  totalInvestments: number;
  totalInvestedAmount: number;
  totalProfitsDistributed: number;
  activeProjects: number;
  pendingProjects: number;
  completedProjects: number;
  monthlyGrowthRate: number;
}

export interface SpvWhitelist {
  id: string;
  spvAddress: string;
  companyName: string;
  registrationNumber: string;
  contactEmail: string;
  contactPhone: string;
  notes?: string;
  whitelistedAt: Date;
  whitelistedBy: string;
  isActive: boolean;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private readonly CONFIG_COLLECTION = 'system_configuration';
  private readonly SPV_WHITELIST_COLLECTION = 'spv_whitelist';
  private readonly MAINTENANCE_CONFIG_KEY = 'maintenance_mode';

  constructor(
    private firebaseService: FirebaseService,
    private usersService: UsersService,
    private projectsService: ProjectsService,
    private investmentsService: InvestmentsService,
    private blockchainService: BlockchainService
  ) {}

  /**
   * Get comprehensive platform analytics
   */
  async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    this.logger.log('Generating platform analytics');

    // TODO: Implement actual analytics calculations
    // For now, returning mock data with basic structure

    const mockAnalytics: PlatformAnalytics = {
      totalUsers: 1250,
      totalProjects: 45,
      totalInvestments: 3420,
      totalInvestedAmount: 125000000000, // 125 billion IDR
      totalProfitsDistributed: 8500000000, // 8.5 billion IDR
      activeProjects: 32,
      pendingProjects: 8,
      completedProjects: 5,
      monthlyGrowthRate: 12.5, // 12.5% growth
    };

    this.logger.log('Platform analytics generated');
    return mockAnalytics;
  }

  /**
   * Update platform fees
   */
  async updatePlatformFees(
    updateFeesDto: UpdateFeesDto,
    adminId: string
  ): Promise<SystemConfiguration[]> {
    this.logger.log(`Updating platform fees by admin: ${adminId}`);

    const updatedConfigs: SystemConfiguration[] = [];
    const updateTime = new Date();

    // Update listing fee if provided
    if (updateFeesDto.listingFeePercentage !== undefined) {
      const config = await this.updateSystemConfig(
        'fees',
        'listing_fee_percentage',
        updateFeesDto.listingFeePercentage,
        'Platform listing fee percentage',
        adminId,
        updateTime
      );
      updatedConfigs.push(config);
    }

    // Update management fee if provided
    if (updateFeesDto.managementFeePercentage !== undefined) {
      const config = await this.updateSystemConfig(
        'fees',
        'management_fee_percentage',
        updateFeesDto.managementFeePercentage,
        'Platform management fee percentage',
        adminId,
        updateTime
      );
      updatedConfigs.push(config);
    }

    // Update transaction fee if provided
    if (updateFeesDto.transactionFee !== undefined) {
      const config = await this.updateSystemConfig(
        'fees',
        'transaction_fee',
        updateFeesDto.transactionFee,
        'Transaction fee in IDR',
        adminId,
        updateTime
      );
      updatedConfigs.push(config);
    }

    // Update minimum investment if provided
    if (updateFeesDto.minimumInvestment !== undefined) {
      const config = await this.updateSystemConfig(
        'limits',
        'minimum_investment',
        updateFeesDto.minimumInvestment,
        'Minimum investment amount in IDR',
        adminId,
        updateTime
      );
      updatedConfigs.push(config);
    }

    // Update maximum investment if provided
    if (updateFeesDto.maximumInvestment !== undefined) {
      const config = await this.updateSystemConfig(
        'limits',
        'maximum_investment',
        updateFeesDto.maximumInvestment,
        'Maximum investment amount in IDR',
        adminId,
        updateTime
      );
      updatedConfigs.push(config);
    }

    this.logger.log(`Updated ${updatedConfigs.length} platform configurations`);
    return updatedConfigs;
  }

  /**
   * Whitelist SPV address
   */
  async whitelistSpv(
    whitelistSpvDto: WhitelistSpvDto,
    adminId: string
  ): Promise<SpvWhitelist> {
    this.logger.log(
      `Whitelisting SPV: ${whitelistSpvDto.spvAddress} by admin: ${adminId}`
    );

    // Check if SPV already whitelisted
    const existingWhitelist = await this.findSpvWhitelist(
      whitelistSpvDto.spvAddress
    );
    if (existingWhitelist) {
      throw new BadRequestException('SPV address already whitelisted');
    }

    // Create whitelist entry
    const whitelistId = `spv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const whitelist: SpvWhitelist = {
      id: whitelistId,
      spvAddress: whitelistSpvDto.spvAddress,
      companyName: whitelistSpvDto.companyName,
      registrationNumber: whitelistSpvDto.registrationNumber,
      contactEmail: whitelistSpvDto.contactEmail,
      contactPhone: whitelistSpvDto.contactPhone,
      notes: whitelistSpvDto.notes,
      whitelistedAt: new Date(),
      whitelistedBy: adminId,
      isActive: true,
    };

    await this.firebaseService.setDocument(
      this.SPV_WHITELIST_COLLECTION,
      whitelistId,
      whitelist
    );

    // TODO: In production, call PlatformRegistry smart contract to whitelist address
    this.logger.log(`SPV whitelisted: ${whitelistSpvDto.spvAddress}`);
    return whitelist;
  }

  /**
   * Remove SPV from whitelist
   */
  async removeSpvFromWhitelist(
    spvAddress: string,
    adminId: string
  ): Promise<void> {
    this.logger.log(
      `Removing SPV from whitelist: ${spvAddress} by admin: ${adminId}`
    );

    const whitelist = await this.findSpvWhitelist(spvAddress);
    if (!whitelist) {
      throw new NotFoundException('SPV not found in whitelist');
    }

    // Deactivate whitelist entry
    await this.firebaseService.updateDocument(
      this.SPV_WHITELIST_COLLECTION,
      whitelist.id,
      {
        isActive: false,
        deactivatedAt: this.firebaseService.getTimestamp(),
        deactivatedBy: adminId,
      }
    );

    // TODO: In production, call PlatformRegistry smart contract to remove from whitelist
    this.logger.log(`SPV removed from whitelist: ${spvAddress}`);
  }

  /**
   * Get all whitelisted SPVs
   */
  async getWhitelistedSpvs(): Promise<SpvWhitelist[]> {
    const docs = await this.firebaseService.getDocumentsByField(
      this.SPV_WHITELIST_COLLECTION,
      'isActive',
      true
    );

    return docs.docs.map(doc => doc.data() as SpvWhitelist);
  }

  /**
   * Set maintenance mode
   */
  async setMaintenanceMode(
    maintenanceModeDto: MaintenanceModeDto,
    adminId: string
  ): Promise<SystemConfiguration> {
    this.logger.log(
      `Setting maintenance mode: ${maintenanceModeDto.enabled} by admin: ${adminId}`
    );

    const maintenanceConfig = {
      enabled: maintenanceModeDto.enabled,
      message:
        maintenanceModeDto.message ||
        'System is under maintenance. Please try again later.',
      estimatedEndTime: maintenanceModeDto.estimatedEndTime
        ? new Date(maintenanceModeDto.estimatedEndTime)
        : null,
      reason: maintenanceModeDto.reason,
      setAt: new Date(),
      setBy: adminId,
    };

    const config = await this.updateSystemConfig(
      'system',
      this.MAINTENANCE_CONFIG_KEY,
      maintenanceConfig,
      'Platform maintenance mode configuration',
      adminId,
      new Date()
    );

    this.logger.log(
      `Maintenance mode ${maintenanceModeDto.enabled ? 'enabled' : 'disabled'}`
    );
    return config;
  }

  /**
   * Get maintenance mode status
   */
  async getMaintenanceMode(): Promise<any> {
    const config = await this.getSystemConfig(
      'system',
      this.MAINTENANCE_CONFIG_KEY
    );
    return config ? config.value : { enabled: false };
  }

  /**
   * Get all system configurations
   */
  async getSystemConfigurations(): Promise<SystemConfiguration[]> {
    const docs = await this.firebaseService.getDocuments(
      this.CONFIG_COLLECTION
    );
    return docs.docs.map(doc => doc.data() as SystemConfiguration);
  }

  /**
   * Get user management data
   */
  async getUserManagementData(
    limit: number = 50,
    startAfter?: string
  ): Promise<any[]> {
    this.logger.log(
      `Fetching user management data, with limit ${limit} and startAfter ${startAfter}`
    );

    // TODO: Implement actual user management data fetching
    // For now, returning mock data

    const mockUsers = [
      {
        id: 'user_001',
        email: 'investor1@example.com',
        role: 'investor',
        kycStatus: 'approved',
        totalInvestments: 3,
        totalInvestedAmount: 50000000,
        joinedAt: new Date('2024-01-15'),
        lastActive: new Date('2024-12-20'),
      },
      {
        id: 'user_002',
        email: 'spv1@example.com',
        role: 'spv',
        kycStatus: 'approved',
        totalProjects: 2,
        totalFundsRaised: 2500000000,
        joinedAt: new Date('2024-02-01'),
        lastActive: new Date('2024-12-18'),
      },
      // Add more mock users as needed
    ];

    return mockUsers;
  }

  /**
   * Get platform revenue analytics
   */
  async getRevenueAnalytics(): Promise<any> {
    this.logger.log('Generating revenue analytics');

    // TODO: Implement actual revenue calculations
    // For now, returning mock data

    const mockRevenue = {
      totalRevenue: 1250000000, // 1.25 billion IDR
      listingFees: 500000000, // 500 million IDR
      managementFees: 625000000, // 625 million IDR
      transactionFees: 125000000, // 125 million IDR
      monthlyRevenue: [
        { month: '2024-01', revenue: 45000000 },
        { month: '2024-02', revenue: 67000000 },
        { month: '2024-03', revenue: 89000000 },
        { month: '2024-04', revenue: 123000000 },
        { month: '2024-05', revenue: 156000000 },
        { month: '2024-06', revenue: 178000000 },
        { month: '2024-07', revenue: 201000000 },
        { month: '2024-08', revenue: 234000000 },
        { month: '2024-09', revenue: 267000000 },
        { month: '2024-10', revenue: 289000000 },
        { month: '2024-11', revenue: 312000000 },
        { month: '2024-12', revenue: 334000000 },
      ],
    };

    return mockRevenue;
  }

  /**
   * Get audit logs with filtering options
   */
  async getAuditLogs(params: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    actions?: string[];
    limit?: number;
    startAfter?: string;
  }): Promise<any[]> {
    this.logger.log('Fetching audit logs with filters');

    const {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Default: last 7 days
      endDate = new Date(),
      userId,
      actions,
      limit = 100,
      startAfter,
    } = params;

    // For development/testing, return mock data with filtering
    // In production, this would query the actual Firestore audit_logs collection
    const mockAuditLogs = [
      {
        id: 'audit_001',
        timestamp: new Date(),
        userId: 'user_001',
        userRole: 'admin',
        method: 'POST',
        path: '/api/admin/spv/whitelist',
        action: 'SPV_WHITELISTED',
        statusCode: 201,
        ipAddress: '127.0.0.1',
        userAgent: 'jest-test-runner',
        sensitive: true,
        responseTime: 150,
      },
      {
        id: 'audit_002',
        timestamp: new Date(Date.now() - 60000),
        userId: 'user_002',
        userRole: 'investor',
        method: 'POST',
        path: '/api/investments/purchase',
        action: 'INVESTMENT_CREATED',
        statusCode: 200,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        sensitive: true,
        responseTime: 280,
      },
      {
        id: 'audit_003',
        timestamp: new Date(Date.now() - 120000),
        userId: 'user_003',
        userRole: 'spv',
        method: 'POST',
        path: '/api/projects/create',
        action: 'PROJECT_CREATED',
        statusCode: 201,
        ipAddress: '10.0.0.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        sensitive: false,
        responseTime: 320,
      },
      {
        id: 'audit_004',
        timestamp: new Date(Date.now() - 180000),
        userId: 'user_004',
        userRole: 'investor',
        method: 'POST',
        path: '/api/investments/purchase',
        action: 'INVESTMENT_CREATED',
        statusCode: 200,
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        sensitive: true,
        responseTime: 200,
      },
      {
        id: 'audit_005',
        timestamp: new Date(Date.now() - 240000),
        userId: 'user_005',
        userRole: 'investor',
        method: 'POST',
        path: '/api/payments/process',
        action: 'PAYMENT_PROCESSED',
        statusCode: 200,
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        sensitive: true,
        responseTime: 320,
      },
      {
        id: 'audit_006',
        timestamp: new Date(Date.now() - 300000),
        userId: 'user_006',
        userRole: 'investor',
        method: 'POST',
        path: '/api/blockchain/mint',
        action: 'TOKENS_MINTED',
        statusCode: 200,
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        sensitive: true,
        responseTime: 450,
      },
      {
        id: 'audit_007',
        timestamp: new Date(Date.now() - 360000),
        userId: 'user_007',
        userRole: 'investor',
        method: 'POST',
        path: '/api/investments/purchase',
        action: 'INVESTMENT_CREATED',
        statusCode: 200,
        ipAddress: '192.168.1.104',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        sensitive: true,
        responseTime: 250,
      },
      {
        id: 'audit_008',
        timestamp: new Date(Date.now() - 420000),
        userId: 'user_008',
        userRole: 'investor',
        method: 'POST',
        path: '/api/payments/process',
        action: 'PAYMENT_PROCESSED',
        statusCode: 200,
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        sensitive: true,
        responseTime: 300,
      },
      {
        id: 'audit_009',
        timestamp: new Date(Date.now() - 480000),
        userId: 'user_009',
        userRole: 'investor',
        method: 'POST',
        path: '/api/blockchain/mint',
        action: 'TOKENS_MINTED',
        statusCode: 200,
        ipAddress: '192.168.1.106',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        sensitive: true,
        responseTime: 380,
      },
      {
        id: 'audit_010',
        timestamp: new Date(Date.now() - 540000),
        userId: 'user_010',
        userRole: 'investor',
        method: 'POST',
        path: '/api/payments/process',
        action: 'PAYMENT_PROCESSED',
        statusCode: 200,
        ipAddress: '192.168.1.107',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        sensitive: true,
        responseTime: 270,
      },
      {
        id: 'audit_011',
        timestamp: new Date(Date.now() - 600000),
        userId: 'user_011',
        userRole: 'investor',
        method: 'POST',
        path: '/api/blockchain/mint',
        action: 'TOKENS_MINTED',
        statusCode: 200,
        ipAddress: '192.168.1.108',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        sensitive: true,
        responseTime: 420,
      },
    ];

    let filteredLogs = mockAuditLogs;

    // Apply filters
    if (startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= startDate);
    }
    if (endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= endDate);
    }
    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId);
    }
    if (actions && actions.length > 0) {
      filteredLogs = filteredLogs.filter(log =>
        actions.some(action => log.action === action)
      );
    }

    // Apply pagination
    if (startAfter) {
      const startIndex = filteredLogs.findIndex(log => log.id === startAfter);
      filteredLogs = filteredLogs.slice(startIndex + 1);
    }

    // Apply limit
    filteredLogs = filteredLogs.slice(0, limit);

    this.logger.log(`Retrieved ${filteredLogs.length} audit logs`);
    return filteredLogs;
  }

  /**
   * Update system configuration
   */
  private async updateSystemConfig(
    category: 'fees' | 'limits' | 'kyc' | 'blockchain' | 'payments' | 'system',
    key: string,
    value: any,
    description: string,
    adminId: string,
    updateTime: Date
  ): Promise<SystemConfiguration> {
    const configId = `${category}_${key}`;
    const config: SystemConfiguration = {
      id: configId,
      category,
      key,
      value,
      description,
      updatedBy: adminId,
      createdAt: updateTime,
      updatedAt: updateTime,
    };

    await this.firebaseService.setDocument(
      this.CONFIG_COLLECTION,
      configId,
      config
    );
    return config;
  }

  /**
   * Get system configuration
   */
  private async getSystemConfig(
    category: string,
    key: string
  ): Promise<SystemConfiguration | null> {
    const configId = `${category}_${key}`;
    const doc = await this.firebaseService.getDocument(
      this.CONFIG_COLLECTION,
      configId
    );

    if (!doc.exists) {
      return null;
    }

    return doc.data() as SystemConfiguration;
  }

  /**
   * Find SPV whitelist entry
   */
  private async findSpvWhitelist(
    spvAddress: string
  ): Promise<SpvWhitelist | null> {
    const query = (ref: FirebaseFirestore.Query) => {
      return ref
        .where('spvAddress', '==', spvAddress)
        .where('isActive', '==', true)
        .limit(1);
    };

    const docs = await this.firebaseService.getDocuments(
      this.SPV_WHITELIST_COLLECTION,
      query
    );

    if (docs.docs.length === 0) {
      return null;
    }

    return docs.docs[0].data() as SpvWhitelist;
  }
}
