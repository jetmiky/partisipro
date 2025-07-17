import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from './firebase.service';
import { JsonRpcProvider } from 'ethers';

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    blockchain: ServiceHealth;
    external: {
      kyc: ServiceHealth;
      payments: ServiceHealth;
      web3auth: ServiceHealth;
    };
  };
  metrics: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: number;
    activeConnections: number;
    requestsPerMinute: number;
  };
}

interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  lastCheck: Date;
  error?: string;
  metadata?: any;
}

@Injectable()
export class HealthService {
  private blockchain: JsonRpcProvider;
  private requestCount: number = 0;
  private lastRequestReset: Date = new Date();

  constructor(
    private configService: ConfigService,
    private firebaseService: FirebaseService
  ) {
    this.initializeServices();
    this.startMetricsCollection();
  }

  private initializeServices(): void {
    // Initialize blockchain connection
    const rpcUrl = this.configService.get<string>('ARBITRUM_SEPOLIA_RPC_URL');
    if (rpcUrl) {
      this.blockchain = new JsonRpcProvider(rpcUrl);
    }
  }

  private startMetricsCollection(): void {
    // Reset request counter every minute
    setInterval(() => {
      this.requestCount = 0;
      this.lastRequestReset = new Date();
    }, 60000);
  }

  public incrementRequestCount(): void {
    this.requestCount++;
  }

  async getHealthStatus(): Promise<HealthCheck> {
    // Check all services concurrently
    const [databaseHealth, blockchainHealth, externalHealth] =
      await Promise.all([
        this.checkDatabaseHealth(),
        this.checkBlockchainHealth(),
        this.checkExternalServicesHealth(),
      ]);

    const metrics = await this.getSystemMetrics();

    // Determine overall status
    const allServices = [
      databaseHealth,
      blockchainHealth,
      externalHealth.kyc,
      externalHealth.payments,
      externalHealth.web3auth,
    ];

    const overallStatus = this.determineOverallStatus(allServices);

    return {
      status: overallStatus,
      timestamp: new Date(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      services: {
        database: databaseHealth,
        blockchain: blockchainHealth,
        external: externalHealth,
      },
      metrics,
    };
  }

  private async checkDatabaseHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      // Test Firebase connection by attempting to read a system document
      await this.firebaseService.getDocument('system_health', 'test');

      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        metadata: {
          type: 'firebase',
          projectId: this.configService.get<string>('_FIREBASE_PROJECT_ID'),
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          type: 'firebase',
          projectId: this.configService.get<string>('_FIREBASE_PROJECT_ID'),
        },
      };
    }
  }

  private async checkBlockchainHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      if (!this.blockchain) {
        throw new Error('Blockchain provider not configured');
      }

      const blockNumber = await this.blockchain.getBlockNumber();

      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        metadata: {
          network: 'arbitrum-sepolia',
          blockNumber,
          rpcUrl: this.configService.get<string>('ARBITRUM_SEPOLIA_RPC_URL'),
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkExternalServicesHealth(): Promise<{
    kyc: ServiceHealth;
    payments: ServiceHealth;
    web3auth: ServiceHealth;
  }> {
    // For now, we'll mock these checks since they depend on external services
    // In a real implementation, you would make HTTP requests to health endpoints

    const mockHealthCheck = (serviceName: string): ServiceHealth => ({
      status: 'healthy',
      responseTime: Math.random() * 100 + 50, // Mock response time
      lastCheck: new Date(),
      metadata: {
        service: serviceName,
        endpoint: 'mocked',
      },
    });

    return {
      kyc: mockHealthCheck('verihubs'),
      payments: mockHealthCheck('midtrans'),
      web3auth: mockHealthCheck('web3auth'),
    };
  }

  private async getSystemMetrics(): Promise<HealthCheck['metrics']> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds

    return {
      memoryUsage,
      cpuUsage: cpuPercent,
      activeConnections: this.getActiveConnections(),
      requestsPerMinute: this.requestCount,
    };
  }

  private getActiveConnections(): number {
    // Mock implementation - in a real app, you'd track actual connections
    return Math.floor(Math.random() * 50) + 10;
  }

  private determineOverallStatus(
    services: ServiceHealth[]
  ): 'healthy' | 'unhealthy' | 'degraded' {
    const unhealthyCount = services.filter(
      s => s.status === 'unhealthy'
    ).length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;

    if (unhealthyCount > 0) {
      return 'unhealthy';
    }

    if (degradedCount > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  async onApplicationShutdown(): Promise<void> {
    // No cleanup needed for in-memory cache
  }
}
