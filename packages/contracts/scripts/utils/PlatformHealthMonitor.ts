/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers, Contract } from 'ethers';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';

export interface HealthMetric {
  name: string;
  value: number | string | boolean;
  unit?: string;
  threshold?: {
    warning: number;
    critical: number;
  };
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
}

export interface ContractHealthCheck {
  contractName: string;
  address: string;
  isResponsive: boolean;
  gasEstimate: string;
  lastBlockNumber: number;
  isPaused: boolean;
  isUpgradeable: boolean;
  proxyImplementation?: string;
  errorCount: number;
  uptime: number;
  lastError?: string;
  timestamp: string;
}

export interface PlatformHealthStatus {
  overallStatus: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  network: string;
  blockNumber: number;
  gasPrice: string;
  contracts: ContractHealthCheck[];
  metrics: HealthMetric[];
  alerts: Array<{
    severity: 'warning' | 'critical';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
  systemInfo: {
    totalContracts: number;
    responsiveContracts: number;
    pausedContracts: number;
    upgradeableContracts: number;
    totalGasUsed: string;
    averageResponseTime: number;
  };
}

export interface MonitoringConfig {
  checkInterval: number; // milliseconds
  alertThresholds: {
    responseTime: number;
    gasPrice: number;
    errorRate: number;
  };
  contracts: Array<{
    name: string;
    address: string;
    abi: any[];
    healthCheckFunction?: string;
  }>;
  notifications: {
    email?: string;
    webhook?: string;
    slack?: string;
  };
}

export class PlatformHealthMonitor extends EventEmitter {
  private provider: ethers.Provider;
  private config: MonitoringConfig;
  private contracts: Map<string, Contract> = new Map();
  private healthHistory: PlatformHealthStatus[] = [];
  private activeAlerts: Map<string, any> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private metricsBuffer: HealthMetric[] = [];
  private startTime: number = Date.now();
  private errorCounts: Map<string, number> = new Map();

  constructor(provider: ethers.Provider, config: MonitoringConfig) {
    super();
    this.provider = provider;
    this.config = config;
    this.initializeContracts();
  }

  /**
   * Initialize contracts for monitoring
   */
  private initializeContracts(): void {
    for (const contractConfig of this.config.contracts) {
      try {
        const contract = new ethers.Contract(
          contractConfig.address,
          contractConfig.abi,
          this.provider
        );
        this.contracts.set(contractConfig.name, contract);
        this.errorCounts.set(contractConfig.name, 0);

        console.log(`📊 Initialized monitoring for ${contractConfig.name}`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${contractConfig.name}:`, error);
      }
    }
  }

  /**
   * Start real-time monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.monitoringInterval) {
      console.log('⚠️ Monitoring already running');
      return;
    }

    console.log('🚀 Starting real-time platform health monitoring...');
    console.log(`📊 Check interval: ${this.config.checkInterval}ms`);
    console.log(`📋 Monitoring ${this.config.contracts.length} contracts`);

    // Initial health check
    await this.performHealthCheck();

    // Start periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('❌ Health check failed:', error);
        this.emit('error', error);
      }
    }, this.config.checkInterval);

    // Setup event listeners for real-time updates
    this.setupEventListeners();

    console.log('✅ Real-time monitoring started successfully');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 Platform health monitoring stopped');
    }

    // Remove event listeners
    this.removeAllListeners();
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<PlatformHealthStatus> {
    const startTime = Date.now();

    try {
      // Get network information
      const [blockNumber, gasPrice] = await Promise.all([
        this.provider.getBlockNumber(),
        this.provider.getFeeData().then(data => data.gasPrice || BigInt(0)),
      ]);

      // Check all contracts
      const contractChecks = await Promise.all(
        Array.from(this.contracts.entries()).map(([name, contract]) =>
          this.checkContractHealth(name, contract)
        )
      );

      // Calculate system metrics
      const systemMetrics = this.calculateSystemMetrics(contractChecks);
      const platformMetrics = this.calculatePlatformMetrics(
        contractChecks,
        gasPrice
      );

      // Determine overall health status
      const overallStatus = this.determineOverallStatus(
        contractChecks,
        platformMetrics
      );

      // Check for alerts
      const alerts = this.checkForAlerts(contractChecks, platformMetrics);

      const healthStatus: PlatformHealthStatus = {
        overallStatus,
        timestamp: new Date().toISOString(),
        network: (await this.provider.getNetwork()).name,
        blockNumber,
        gasPrice: gasPrice.toString(),
        contracts: contractChecks,
        metrics: platformMetrics,
        alerts,
        systemInfo: systemMetrics,
      };

      // Store in history
      this.healthHistory.push(healthStatus);

      // Keep only last 1000 entries
      if (this.healthHistory.length > 1000) {
        this.healthHistory = this.healthHistory.slice(-1000);
      }

      // Emit health update
      this.emit('healthUpdate', healthStatus);

      // Log status
      const responseTime = Date.now() - startTime;
      console.log(
        `📊 Health check completed in ${responseTime}ms - Status: ${overallStatus.toUpperCase()}`
      );

      return healthStatus;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  }

  /**
   * Check individual contract health
   */
  private async checkContractHealth(
    name: string,
    contract: Contract
  ): Promise<ContractHealthCheck> {

    try {
      // Basic responsiveness check
      const code = await this.provider.getCode(contract.target as string);
      const isResponsive = code !== '0x';

      // Check if contract is paused (if it has pause functionality)
      let isPaused = false;
      try {
        if (contract.paused) {
          isPaused = await contract.paused();
        }
      } catch (error) {
        // Contract doesn't have pause functionality
      }

      // Check if contract is upgradeable
      let isUpgradeable = false;
      let proxyImplementation: string | undefined;
      try {
        if (contract.implementation) {
          proxyImplementation = await contract.implementation();
          isUpgradeable = true;
        }
      } catch (error) {
        // Contract is not upgradeable
      }

      // Estimate gas for a simple function call
      let gasEstimate = '0';
      try {
        const configFunction = this.config.contracts.find(
          c => c.name === name
        )?.healthCheckFunction;
        if (configFunction && contract[configFunction]) {
          gasEstimate = (
            await contract[configFunction].estimateGas()
          ).toString();
        }
      } catch (error) {
        // Gas estimation failed
      }

      // Get last block number
      const lastBlockNumber = await this.provider.getBlockNumber();

      // Calculate uptime
      const uptime = Date.now() - this.startTime;

      // Get error count
      const errorCount = this.errorCounts.get(name) || 0;

      const healthCheck: ContractHealthCheck = {
        contractName: name,
        address: contract.target as string,
        isResponsive,
        gasEstimate,
        lastBlockNumber,
        isPaused,
        isUpgradeable,
        proxyImplementation,
        errorCount,
        uptime,
        timestamp: new Date().toISOString(),
      };

      return healthCheck;
    } catch (error) {
      // Increment error count
      const currentCount = this.errorCounts.get(name) || 0;
      this.errorCounts.set(name, currentCount + 1);

      console.error(`❌ Health check failed for ${name}:`, error);

      return {
        contractName: name,
        address: contract.target as string,
        isResponsive: false,
        gasEstimate: '0',
        lastBlockNumber: 0,
        isPaused: false,
        isUpgradeable: false,
        errorCount: currentCount + 1,
        uptime: Date.now() - this.startTime,
        lastError: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Calculate system metrics
   */
  private calculateSystemMetrics(
    contractChecks: ContractHealthCheck[]
  ): PlatformHealthStatus['systemInfo'] {
    const totalContracts = contractChecks.length;
    const responsiveContracts = contractChecks.filter(
      c => c.isResponsive
    ).length;
    const pausedContracts = contractChecks.filter(c => c.isPaused).length;
    const upgradeableContracts = contractChecks.filter(
      c => c.isUpgradeable
    ).length;

    const totalGasUsed = contractChecks
      .reduce((sum, c) => sum + BigInt(c.gasEstimate), BigInt(0))
      .toString();

    const averageResponseTime =
      contractChecks.length > 0
        ? contractChecks.reduce(
            (sum, c) => sum + c.uptime / contractChecks.length,
            0
          )
        : 0;

    return {
      totalContracts,
      responsiveContracts,
      pausedContracts,
      upgradeableContracts,
      totalGasUsed,
      averageResponseTime,
    };
  }

  /**
   * Calculate platform metrics
   */
  private calculatePlatformMetrics(
    contractChecks: ContractHealthCheck[],
    gasPrice: bigint
  ): HealthMetric[] {
    const metrics: HealthMetric[] = [];

    // Response time metric
    const avgResponseTime =
      contractChecks.length > 0
        ? contractChecks.reduce((sum, c) => sum + c.uptime, 0) /
          contractChecks.length
        : 0;

    metrics.push({
      name: 'Average Response Time',
      value: Math.round(avgResponseTime),
      unit: 'ms',
      threshold: {
        warning: this.config.alertThresholds.responseTime * 0.8,
        critical: this.config.alertThresholds.responseTime,
      },
      status:
        avgResponseTime > this.config.alertThresholds.responseTime
          ? 'critical'
          : 'healthy',
      timestamp: new Date().toISOString(),
    });

    // Gas price metric
    const gasPriceGwei = Number(ethers.formatUnits(gasPrice, 'gwei'));
    metrics.push({
      name: 'Gas Price',
      value: gasPriceGwei,
      unit: 'gwei',
      threshold: {
        warning: this.config.alertThresholds.gasPrice * 0.8,
        critical: this.config.alertThresholds.gasPrice,
      },
      status:
        gasPriceGwei > this.config.alertThresholds.gasPrice
          ? 'critical'
          : 'healthy',
      timestamp: new Date().toISOString(),
    });

    // Error rate metric
    const totalErrors = Array.from(this.errorCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );
    const errorRate =
      contractChecks.length > 0
        ? (totalErrors / contractChecks.length) * 100
        : 0;

    metrics.push({
      name: 'Error Rate',
      value: Math.round(errorRate * 100) / 100,
      unit: '%',
      threshold: {
        warning: this.config.alertThresholds.errorRate * 0.8,
        critical: this.config.alertThresholds.errorRate,
      },
      status:
        errorRate > this.config.alertThresholds.errorRate
          ? 'critical'
          : 'healthy',
      timestamp: new Date().toISOString(),
    });

    // Contract availability metric
    const availabilityRate =
      contractChecks.length > 0
        ? (contractChecks.filter(c => c.isResponsive).length /
            contractChecks.length) *
          100
        : 0;

    metrics.push({
      name: 'Contract Availability',
      value: Math.round(availabilityRate * 100) / 100,
      unit: '%',
      threshold: {
        warning: 95,
        critical: 90,
      },
      status:
        availabilityRate < 90
          ? 'critical'
          : availabilityRate < 95
            ? 'warning'
            : 'healthy',
      timestamp: new Date().toISOString(),
    });

    return metrics;
  }

  /**
   * Determine overall platform health status
   */
  private determineOverallStatus(
    contractChecks: ContractHealthCheck[],
    metrics: HealthMetric[]
  ): 'healthy' | 'warning' | 'critical' {
    // Check for any critical metrics
    const criticalMetrics = metrics.filter(m => m.status === 'critical');
    if (criticalMetrics.length > 0) {
      return 'critical';
    }

    // Check for any warning metrics
    const warningMetrics = metrics.filter(m => m.status === 'warning');
    if (warningMetrics.length > 0) {
      return 'warning';
    }

    // Check for unresponsive contracts
    const unresponsiveContracts = contractChecks.filter(c => !c.isResponsive);
    if (unresponsiveContracts.length > 0) {
      return 'critical';
    }

    // Check for paused contracts
    const pausedContracts = contractChecks.filter(c => c.isPaused);
    if (pausedContracts.length > 0) {
      return 'warning';
    }

    return 'healthy';
  }

  /**
   * Check for alerts
   */
  private checkForAlerts(
    contractChecks: ContractHealthCheck[],
    metrics: HealthMetric[]
  ): PlatformHealthStatus['alerts'] {
    const alerts: PlatformHealthStatus['alerts'] = [];

    // Check metric-based alerts
    for (const metric of metrics) {
      if (metric.status === 'critical') {
        alerts.push({
          severity: 'critical',
          message: `${metric.name} is critical: ${metric.value} ${metric.unit || ''}`,
          timestamp: new Date().toISOString(),
          resolved: false,
        });
      } else if (metric.status === 'warning') {
        alerts.push({
          severity: 'warning',
          message: `${metric.name} is warning: ${metric.value} ${metric.unit || ''}`,
          timestamp: new Date().toISOString(),
          resolved: false,
        });
      }
    }

    // Check contract-based alerts
    for (const contract of contractChecks) {
      if (!contract.isResponsive) {
        alerts.push({
          severity: 'critical',
          message: `Contract ${contract.contractName} is unresponsive`,
          timestamp: new Date().toISOString(),
          resolved: false,
        });
      }

      if (contract.isPaused) {
        alerts.push({
          severity: 'warning',
          message: `Contract ${contract.contractName} is paused`,
          timestamp: new Date().toISOString(),
          resolved: false,
        });
      }

      if (contract.errorCount > 5) {
        alerts.push({
          severity: 'warning',
          message: `Contract ${contract.contractName} has ${contract.errorCount} errors`,
          timestamp: new Date().toISOString(),
          resolved: false,
        });
      }
    }

    return alerts;
  }

  /**
   * Setup event listeners for real-time updates
   */
  private setupEventListeners(): void {
    // Listen for new blocks
    this.provider.on('block', blockNumber => {
      console.log(`📦 New block: ${blockNumber}`);
      this.emit('newBlock', blockNumber);
    });

    // Listen for contract events
    for (const [name, contract] of this.contracts) {
      try {
        // Listen for all events
        contract.on('*', event => {
          console.log(`📡 Event from ${name}:`, event);
          this.emit('contractEvent', { contractName: name, event });
        });
      } catch (error) {
        console.error(`❌ Failed to setup event listener for ${name}:`, error);
      }
    }
  }

  /**
   * Generate health report
   */
  generateHealthReport(): string {
    const latestHealth = this.healthHistory[this.healthHistory.length - 1];

    if (!latestHealth) {
      throw new Error('No health data available');
    }

    const report = {
      timestamp: new Date().toISOString(),
      monitoringDuration: Date.now() - this.startTime,
      latestHealth,
      healthHistory: this.healthHistory.slice(-24), // Last 24 checks
      statistics: {
        totalChecks: this.healthHistory.length,
        averageResponseTime:
          this.healthHistory.reduce(
            (sum, h) => sum + h.systemInfo.averageResponseTime,
            0
          ) / this.healthHistory.length,
        uptimePercentage:
          (this.healthHistory.filter(h => h.overallStatus === 'healthy')
            .length /
            this.healthHistory.length) *
          100,
      },
    };

    const reportPath = join(__dirname, '../../reports/health-report.json');

    // Ensure reports directory exists
    const reportsDir = join(__dirname, '../../reports');
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }

    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 Platform Health Report Generated');
    console.log('===================================');
    console.log(`📝 Report saved to: ${reportPath}`);
    console.log(`🌐 Network: ${latestHealth.network}`);
    console.log(
      `📊 Overall Status: ${latestHealth.overallStatus.toUpperCase()}`
    );
    console.log(
      `📋 Contracts monitored: ${latestHealth.systemInfo.totalContracts}`
    );
    console.log(
      `✅ Responsive contracts: ${latestHealth.systemInfo.responsiveContracts}`
    );
    console.log(
      `⏸️ Paused contracts: ${latestHealth.systemInfo.pausedContracts}`
    );
    console.log(
      `🔧 Upgradeable contracts: ${latestHealth.systemInfo.upgradeableContracts}`
    );
    console.log(`🚨 Active alerts: ${latestHealth.alerts.length}`);

    return reportPath;
  }

  /**
   * Get current health status
   */
  getCurrentHealthStatus(): PlatformHealthStatus | null {
    return this.healthHistory[this.healthHistory.length - 1] || null;
  }

  /**
   * Get health history
   */
  getHealthHistory(limit: number = 100): PlatformHealthStatus[] {
    return this.healthHistory.slice(-limit);
  }

  /**
   * Reset error counts
   */
  resetErrorCounts(): void {
    this.errorCounts.clear();
    for (const contractConfig of this.config.contracts) {
      this.errorCounts.set(contractConfig.name, 0);
    }
    console.log('🔄 Error counts reset');
  }
}

// Default monitoring configuration
export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  checkInterval: 30000, // 30 seconds
  alertThresholds: {
    responseTime: 5000, // 5 seconds
    gasPrice: 50, // 50 gwei
    errorRate: 5, // 5%
  },
  contracts: [], // To be populated with actual contracts
  notifications: {
    // To be configured based on requirements
  },
};

export default PlatformHealthMonitor;
