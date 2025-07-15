import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { MonitoringService } from './monitoring.service';

import http from 'http';
import https from 'https';

export interface ConnectionPoolConfig {
  maxConnections: number;
  minConnections: number;
  acquireTimeoutMs: number;
  idleTimeoutMs: number;
  maxRetries: number;
  healthCheckIntervalMs: number;
  metrics: {
    enabled: boolean;
    intervalMs: number;
  };
}

export interface ConnectionMetrics {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  waitingRequests: number;
  connectionErrors: number;
  averageConnectionTime: number;
  peakConnections: number;
  timestamp: Date;
}

export interface ConnectionPoolStats {
  pool: string;
  config: ConnectionPoolConfig;
  metrics: ConnectionMetrics;
  health: {
    healthy: boolean;
    status: string;
    details: any;
  };
}

@Injectable()
export class ConnectionOptimizationService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ConnectionOptimizationService.name);
  private connectionPools: Map<string, any> = new Map();
  private poolConfigs: Map<string, ConnectionPoolConfig> = new Map();
  private poolMetrics: Map<string, ConnectionMetrics> = new Map();
  private metricsInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(
    private configService: ConfigService,
    private cacheService: CacheService,
    private monitoringService: MonitoringService
  ) {}

  async onModuleInit() {
    await this.initializeConnectionPools();
    this.startMetricsCollection();
    this.startHealthChecks();
    this.logger.log('Connection optimization service initialized');
  }

  async onModuleDestroy() {
    await this.cleanup();
    this.logger.log('Connection optimization service destroyed');
  }

  /**
   * Initialize connection pools
   */
  private async initializeConnectionPools(): Promise<void> {
    const poolConfigs = this.loadPoolConfigurations();

    for (const [poolName, config] of poolConfigs) {
      try {
        const pool = await this.createConnectionPool(poolName, config);
        this.connectionPools.set(poolName, pool);
        this.poolConfigs.set(poolName, config);
        this.poolMetrics.set(poolName, this.createInitialMetrics());

        this.logger.log(`Initialized connection pool: ${poolName}`);
      } catch (error) {
        this.logger.error(
          `Failed to initialize connection pool ${poolName}:`,
          error
        );
      }
    }
  }

  /**
   * Load pool configurations
   */
  private loadPoolConfigurations(): Map<string, ConnectionPoolConfig> {
    const configs = new Map<string, ConnectionPoolConfig>();

    // HTTP Connection Pool
    configs.set('http', {
      maxConnections: this.configService.get<number>(
        'connection.http.maxConnections',
        100
      ),
      minConnections: this.configService.get<number>(
        'connection.http.minConnections',
        10
      ),
      acquireTimeoutMs: this.configService.get<number>(
        'connection.http.acquireTimeoutMs',
        30000
      ),
      idleTimeoutMs: this.configService.get<number>(
        'connection.http.idleTimeoutMs',
        30000
      ),
      maxRetries: this.configService.get<number>(
        'connection.http.maxRetries',
        3
      ),
      healthCheckIntervalMs: this.configService.get<number>(
        'connection.http.healthCheckIntervalMs',
        60000
      ),
      metrics: {
        enabled: this.configService.get<boolean>(
          'connection.http.metrics.enabled',
          true
        ),
        intervalMs: this.configService.get<number>(
          'connection.http.metrics.intervalMs',
          30000
        ),
      },
    });

    // Database Connection Pool
    configs.set('database', {
      maxConnections: this.configService.get<number>(
        'connection.database.maxConnections',
        50
      ),
      minConnections: this.configService.get<number>(
        'connection.database.minConnections',
        5
      ),
      acquireTimeoutMs: this.configService.get<number>(
        'connection.database.acquireTimeoutMs',
        20000
      ),
      idleTimeoutMs: this.configService.get<number>(
        'connection.database.idleTimeoutMs',
        60000
      ),
      maxRetries: this.configService.get<number>(
        'connection.database.maxRetries',
        3
      ),
      healthCheckIntervalMs: this.configService.get<number>(
        'connection.database.healthCheckIntervalMs',
        30000
      ),
      metrics: {
        enabled: this.configService.get<boolean>(
          'connection.database.metrics.enabled',
          true
        ),
        intervalMs: this.configService.get<number>(
          'connection.database.metrics.intervalMs',
          30000
        ),
      },
    });

    // Redis Connection Pool
    configs.set('redis', {
      maxConnections: this.configService.get<number>(
        'connection.redis.maxConnections',
        20
      ),
      minConnections: this.configService.get<number>(
        'connection.redis.minConnections',
        2
      ),
      acquireTimeoutMs: this.configService.get<number>(
        'connection.redis.acquireTimeoutMs',
        10000
      ),
      idleTimeoutMs: this.configService.get<number>(
        'connection.redis.idleTimeoutMs',
        30000
      ),
      maxRetries: this.configService.get<number>(
        'connection.redis.maxRetries',
        3
      ),
      healthCheckIntervalMs: this.configService.get<number>(
        'connection.redis.healthCheckIntervalMs',
        30000
      ),
      metrics: {
        enabled: this.configService.get<boolean>(
          'connection.redis.metrics.enabled',
          true
        ),
        intervalMs: this.configService.get<number>(
          'connection.redis.metrics.intervalMs',
          30000
        ),
      },
    });

    return configs;
  }

  /**
   * Create connection pool
   */
  private async createConnectionPool(
    poolName: string,
    config: ConnectionPoolConfig
  ): Promise<any> {
    switch (poolName) {
      case 'http':
        return this.createHttpConnectionPool(config);
      case 'database':
        return this.createDatabaseConnectionPool(config);
      case 'redis':
        return this.createRedisConnectionPool(config);
      default:
        throw new Error(`Unknown pool type: ${poolName}`);
    }
  }

  /**
   * Create HTTP connection pool
   */
  private createHttpConnectionPool(config: ConnectionPoolConfig): any {
    const httpAgent = new http.Agent({
      maxSockets: config.maxConnections,
      maxFreeSockets: config.minConnections,
      timeout: config.acquireTimeoutMs,
      keepAlive: true,
      keepAliveMsecs: config.idleTimeoutMs,
    });

    const httpsAgent = new https.Agent({
      maxSockets: config.maxConnections,
      maxFreeSockets: config.minConnections,
      timeout: config.acquireTimeoutMs,
      keepAlive: true,
      keepAliveMsecs: config.idleTimeoutMs,
    });

    return {
      http: httpAgent,
      https: httpsAgent,
      type: 'http',
      config,
    };
  }

  /**
   * Create database connection pool
   */
  private createDatabaseConnectionPool(config: ConnectionPoolConfig): any {
    // For Firebase/Firestore, we'll optimize the connection settings
    return {
      type: 'database',
      config,
      // Firebase SDK handles connection pooling internally
      // We'll track metrics for monitoring
    };
  }

  /**
   * Create Redis connection pool
   */
  private createRedisConnectionPool(config: ConnectionPoolConfig): any {
    return {
      type: 'redis',
      config,
      // Redis connection pooling will be handled by the CacheService
    };
  }

  /**
   * Get connection from pool
   */
  async getConnection(poolName: string): Promise<any> {
    const pool = this.connectionPools.get(poolName);
    if (!pool) {
      throw new Error(`Connection pool not found: ${poolName}`);
    }

    const startTime = Date.now();

    try {
      const connection = await this.acquireConnection(pool);
      const connectionTime = Date.now() - startTime;

      // Update metrics
      this.updateConnectionMetrics(poolName, 'acquire', connectionTime);

      return connection;
    } catch (error) {
      this.updateConnectionMetrics(poolName, 'error');
      throw error;
    }
  }

  /**
   * Acquire connection from pool
   */
  private async acquireConnection(pool: any): Promise<any> {
    // Implementation depends on pool type
    switch (pool.type) {
      case 'http':
        return pool; // HTTP agents are reused
      case 'database':
        return pool; // Firebase connections are managed internally
      case 'redis':
        return pool; // Redis connections are managed by CacheService
      default:
        throw new Error(`Unknown pool type: ${pool.type}`);
    }
  }

  /**
   * Release connection back to pool
   */
  async releaseConnection(poolName: string, connection: any): Promise<void> {
    try {
      connection;

      this.updateConnectionMetrics(poolName, 'release');
      // For most pools, connections are automatically returned
    } catch (error) {
      this.logger.error(
        `Failed to release connection for pool ${poolName}:`,
        error
      );
    }
  }

  /**
   * Update connection metrics
   */
  private updateConnectionMetrics(
    poolName: string,
    action: 'acquire' | 'release' | 'error',
    connectionTime?: number
  ): void {
    const metrics = this.poolMetrics.get(poolName);
    if (!metrics) return;

    switch (action) {
      case 'acquire':
        metrics.activeConnections++;
        metrics.totalConnections++;
        if (connectionTime) {
          metrics.averageConnectionTime =
            (metrics.averageConnectionTime + connectionTime) / 2;
        }
        if (metrics.activeConnections > metrics.peakConnections) {
          metrics.peakConnections = metrics.activeConnections;
        }
        break;
      case 'release':
        metrics.activeConnections = Math.max(0, metrics.activeConnections - 1);
        metrics.idleConnections++;
        break;
      case 'error':
        metrics.connectionErrors++;
        break;
    }

    metrics.timestamp = new Date();
    this.poolMetrics.set(poolName, metrics);
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(async () => {
      await this.collectAndReportMetrics();
    }, 30000); // Every 30 seconds
  }

  /**
   * Collect and report metrics
   */
  private async collectAndReportMetrics(): Promise<void> {
    try {
      for (const [poolName, metrics] of this.poolMetrics) {
        const config = this.poolConfigs.get(poolName);

        if (config?.metrics.enabled) {
          // Send metrics to monitoring service
          await this.monitoringService.recordMetric(
            `connection_pool_${poolName}_active`,
            metrics.activeConnections
          );
          await this.monitoringService.recordMetric(
            `connection_pool_${poolName}_idle`,
            metrics.idleConnections
          );
          await this.monitoringService.recordMetric(
            `connection_pool_${poolName}_total`,
            metrics.totalConnections
          );
          await this.monitoringService.recordMetric(
            `connection_pool_${poolName}_errors`,
            metrics.connectionErrors
          );
          await this.monitoringService.recordMetric(
            `connection_pool_${poolName}_avg_time`,
            metrics.averageConnectionTime
          );
          await this.monitoringService.recordMetric(
            `connection_pool_${poolName}_peak`,
            metrics.peakConnections
          );

          // Cache metrics for API access
          await this.cacheService.set(
            `connection_metrics_${poolName}`,
            metrics,
            { ttl: 60 } // 1 minute
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to collect connection metrics:', error);
    }
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 60000); // Every 60 seconds
  }

  /**
   * Perform health checks
   */
  private async performHealthChecks(): Promise<void> {
    try {
      for (const [poolName, pool] of this.connectionPools) {
        const health = await this.checkPoolHealth(poolName, pool);

        if (!health.healthy) {
          this.logger.warn(`Connection pool ${poolName} is unhealthy:`, health);
          await this.monitoringService.recordMetric(
            `connection_pool_${poolName}_unhealthy`,
            1
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to perform health checks:', error);
    }
  }

  /**
   * Check pool health
   */
  private async checkPoolHealth(
    poolName: string,
    pool: any
  ): Promise<{
    healthy: boolean;
    status: string;
    details: any;
  }> {
    try {
      pool;

      const metrics = this.poolMetrics.get(poolName);
      const config = this.poolConfigs.get(poolName);

      if (!metrics || !config) {
        return {
          healthy: false,
          status: 'missing_config',
          details: { message: 'Pool configuration or metrics not found' },
        };
      }

      // Check if error rate is too high
      const errorRate =
        metrics.connectionErrors / Math.max(metrics.totalConnections, 1);
      if (errorRate > 0.1) {
        // 10% error rate threshold
        return {
          healthy: false,
          status: 'high_error_rate',
          details: { errorRate, threshold: 0.1 },
        };
      }

      // Check if connection time is too high
      if (metrics.averageConnectionTime > config.acquireTimeoutMs * 0.8) {
        return {
          healthy: false,
          status: 'slow_connections',
          details: {
            averageTime: metrics.averageConnectionTime,
            threshold: config.acquireTimeoutMs * 0.8,
          },
        };
      }

      // Check if pool is at capacity
      if (metrics.activeConnections >= config.maxConnections * 0.9) {
        return {
          healthy: false,
          status: 'near_capacity',
          details: {
            activeConnections: metrics.activeConnections,
            maxConnections: config.maxConnections,
          },
        };
      }

      return {
        healthy: true,
        status: 'healthy',
        details: { metrics },
      };
    } catch (error) {
      return {
        healthy: false,
        status: 'error',
        details: { error: error.message },
      };
    }
  }

  /**
   * Get connection pool statistics
   */
  async getConnectionPoolStats(): Promise<ConnectionPoolStats[]> {
    const stats: ConnectionPoolStats[] = [];

    for (const [poolName, pool] of this.connectionPools) {
      const config = this.poolConfigs.get(poolName);
      const metrics = this.poolMetrics.get(poolName);
      const health = await this.checkPoolHealth(poolName, pool);

      if (config && metrics) {
        stats.push({
          pool: poolName,
          config,
          metrics,
          health,
        });
      }
    }

    return stats;
  }

  /**
   * Optimize connection pool
   */
  async optimizeConnectionPool(poolName: string): Promise<void> {
    const pool = this.connectionPools.get(poolName);
    const config = this.poolConfigs.get(poolName);
    const metrics = this.poolMetrics.get(poolName);

    if (!pool || !config || !metrics) {
      throw new Error(`Pool ${poolName} not found or incomplete`);
    }

    // Auto-adjust pool size based on usage patterns
    const utilizationRate = metrics.activeConnections / config.maxConnections;
    const errorRate =
      metrics.connectionErrors / Math.max(metrics.totalConnections, 1);

    const newConfig = { ...config };
    let optimized = false;

    // Increase pool size if utilization is high and error rate is low
    if (utilizationRate > 0.8 && errorRate < 0.05) {
      newConfig.maxConnections = Math.min(config.maxConnections * 1.2, 200);
      optimized = true;
    }

    // Decrease pool size if utilization is low
    if (utilizationRate < 0.3 && config.maxConnections > 10) {
      newConfig.maxConnections = Math.max(config.maxConnections * 0.8, 10);
      optimized = true;
    }

    if (optimized) {
      this.poolConfigs.set(poolName, newConfig);
      this.logger.log(
        `Optimized connection pool ${poolName}: maxConnections=${newConfig.maxConnections}`
      );
    }
  }

  /**
   * Create initial metrics
   */
  private createInitialMetrics(): ConnectionMetrics {
    return {
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
      waitingRequests: 0,
      connectionErrors: 0,
      averageConnectionTime: 0,
      peakConnections: 0,
      timestamp: new Date(),
    };
  }

  /**
   * Get HTTP agents for external requests
   */
  getHttpAgents(): { http: any; https: any } | null {
    const httpPool = this.connectionPools.get('http');
    return httpPool ? { http: httpPool.http, https: httpPool.https } : null;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    status: string;
    details: any;
  }> {
    try {
      const stats = await this.getConnectionPoolStats();
      const unhealthyPools = stats.filter(s => !s.health.healthy);

      return {
        healthy: unhealthyPools.length === 0,
        status: unhealthyPools.length === 0 ? 'healthy' : 'degraded',
        details: {
          totalPools: stats.length,
          healthyPools: stats.length - unhealthyPools.length,
          unhealthyPools: unhealthyPools.map(p => ({
            pool: p.pool,
            status: p.health.status,
            details: p.health.details,
          })),
        },
      };
    } catch (error) {
      return {
        healthy: false,
        status: 'error',
        details: { error: error.message },
      };
    }
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Close all connection pools
    for (const [poolName, pool] of this.connectionPools) {
      try {
        if (pool.type === 'http') {
          pool.http.destroy();
          pool.https.destroy();
        }
      } catch (error) {
        this.logger.error(
          `Failed to close connection pool ${poolName}:`,
          error
        );
      }
    }
  }
}
