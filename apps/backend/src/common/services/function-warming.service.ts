import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { HealthService } from './health.service';
import { MonitoringService } from './monitoring.service';

export interface WarmingConfig {
  enabled: boolean;
  intervalMs: number;
  endpoints: string[];
  concurrency: number;
  timeoutMs: number;
  retryAttempts: number;
  scheduledWarming: {
    enabled: boolean;
    cron: string;
  };
}

export interface WarmingResult {
  endpoint: string;
  success: boolean;
  responseTime: number;
  error?: string;
  timestamp: Date;
}

@Injectable()
export class FunctionWarmingService implements OnModuleInit {
  private readonly logger = new Logger(FunctionWarmingService.name);
  private warmingConfig: WarmingConfig;
  private warmingInterval: NodeJS.Timeout | null = null;
  private isWarming = false;

  constructor(
    private configService: ConfigService,
    private cacheService: CacheService,
    private healthService: HealthService,
    private monitoringService: MonitoringService
  ) {
    this.warmingConfig = this.loadWarmingConfig();
  }

  async onModuleInit() {
    if (this.warmingConfig.enabled) {
      await this.startWarmingSchedule();
      this.logger.log('Function warming service initialized');
    } else {
      this.logger.log('Function warming service disabled');
    }
  }

  /**
   * Load warming configuration
   */
  private loadWarmingConfig(): WarmingConfig {
    const isDevelopment = process.env.NODE_ENV === 'development';

    return {
      enabled: this.configService.get<boolean>(
        'function.warming.enabled',
        !isDevelopment
      ),
      intervalMs: this.configService.get<number>(
        'function.warming.intervalMs',
        5 * 60 * 1000
      ), // 5 minutes
      endpoints: this.configService.get<string[]>(
        'function.warming.endpoints',
        [
          '/health',
          '/api/auth/health',
          '/api/users/health',
          '/api/projects/health',
        ]
      ),
      concurrency: this.configService.get<number>(
        'function.warming.concurrency',
        3
      ),
      timeoutMs: this.configService.get<number>(
        'function.warming.timeoutMs',
        10000
      ),
      retryAttempts: this.configService.get<number>(
        'function.warming.retryAttempts',
        2
      ),
      scheduledWarming: {
        enabled: this.configService.get<boolean>(
          'function.warming.scheduled.enabled',
          true
        ),
        cron: this.configService.get<string>(
          'function.warming.scheduled.cron',
          '0 */5 * * * *'
        ), // Every 5 minutes
      },
    };
  }

  /**
   * Start warming schedule
   */
  private async startWarmingSchedule(): Promise<void> {
    // Initial warming
    await this.performWarming();

    // Set up interval warming
    this.warmingInterval = setInterval(async () => {
      await this.performWarming();
    }, this.warmingConfig.intervalMs);

    this.logger.log(
      `Function warming scheduled every ${this.warmingConfig.intervalMs}ms`
    );
  }

  /**
   * Perform function warming
   */
  async performWarming(): Promise<WarmingResult[]> {
    if (this.isWarming) {
      this.logger.debug('Warming already in progress, skipping');
      return [];
    }

    this.isWarming = true;
    const startTime = Date.now();

    try {
      this.logger.debug('Starting function warming');

      // Warm functions in batches based on concurrency
      const results: WarmingResult[] = [];
      const endpoints = this.warmingConfig.endpoints;

      for (
        let i = 0;
        i < endpoints.length;
        i += this.warmingConfig.concurrency
      ) {
        const batch = endpoints.slice(i, i + this.warmingConfig.concurrency);
        const batchResults = await Promise.all(
          batch.map(endpoint => this.warmEndpoint(endpoint))
        );
        results.push(...batchResults);
      }

      // Cache warming results
      await this.cacheWarmingResults(results);

      // Report metrics
      const totalTime = Date.now() - startTime;
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      this.logger.log(
        `Function warming completed: ${successCount} success, ${failureCount} failures, ${totalTime}ms`
      );

      // Send metrics to monitoring service
      await this.monitoringService.recordMetric(
        'function_warming_success_count',
        successCount
      );
      await this.monitoringService.recordMetric(
        'function_warming_failure_count',
        failureCount
      );
      await this.monitoringService.recordMetric(
        'function_warming_duration_ms',
        totalTime
      );

      return results;
    } catch (error) {
      this.logger.error('Function warming failed', error);
      await this.monitoringService.recordMetric('function_warming_error', 1);
      throw error;
    } finally {
      this.isWarming = false;
    }
  }

  /**
   * Warm a specific endpoint
   */
  private async warmEndpoint(endpoint: string): Promise<WarmingResult> {
    const startTime = Date.now();
    let attempt = 0;

    while (attempt < this.warmingConfig.retryAttempts) {
      try {
        const baseUrl = this.getBaseUrl();
        const url = `${baseUrl}${endpoint}`;

        // Use fetch with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.warmingConfig.timeoutMs
        );

        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Function-Warming-Service',
            'X-Warming-Request': 'true',
          },
        });

        clearTimeout(timeoutId);

        const responseTime = Date.now() - startTime;

        if (response.ok) {
          this.logger.debug(`Warmed endpoint ${endpoint} in ${responseTime}ms`);
          return {
            endpoint,
            success: true,
            responseTime,
            timestamp: new Date(),
          };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        attempt++;
        const responseTime = Date.now() - startTime;

        if (attempt >= this.warmingConfig.retryAttempts) {
          this.logger.warn(
            `Failed to warm endpoint ${endpoint} after ${attempt} attempts: ${error.message}`
          );
          return {
            endpoint,
            success: false,
            responseTime,
            error: error.message,
            timestamp: new Date(),
          };
        }

        // Wait before retry
        await this.delay(1000 * attempt);
      }
    }

    // Should not reach here
    return {
      endpoint,
      success: false,
      responseTime: Date.now() - startTime,
      error: 'Maximum retry attempts exceeded',
      timestamp: new Date(),
    };
  }

  /**
   * Get base URL for warming requests
   */
  private getBaseUrl(): string {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      return this.configService.get<string>(
        'function.baseUrl',
        'https://your-app.cloudfunctions.net'
      );
    } else {
      return this.configService.get<string>(
        'function.baseUrl',
        'http://localhost:3000'
      );
    }
  }

  /**
   * Cache warming results
   */
  private async cacheWarmingResults(results: WarmingResult[]): Promise<void> {
    try {
      const cacheKey = 'function_warming_results';
      const cacheData = {
        results,
        timestamp: new Date(),
        summary: {
          total: results.length,
          success: results.filter(r => r.success).length,
          failure: results.filter(r => !r.success).length,
          averageResponseTime:
            results.reduce((sum, r) => sum + r.responseTime, 0) /
            results.length,
        },
      };

      await this.cacheService.set(cacheKey, cacheData, { ttl: 10 * 60 }); // 10 minutes
    } catch (error) {
      this.logger.error('Failed to cache warming results', error);
    }
  }

  /**
   * Get cached warming results
   */
  async getWarmingResults(): Promise<any> {
    try {
      return await this.cacheService.get('function_warming_results');
    } catch (error) {
      this.logger.error('Failed to get cached warming results', error);
      return null;
    }
  }

  /**
   * Manual warming trigger
   */
  async triggerManualWarming(): Promise<WarmingResult[]> {
    this.logger.log('Manual warming triggered');
    return await this.performWarming();
  }

  /**
   * Stop warming service
   */
  async stopWarmingService(): Promise<void> {
    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
      this.warmingInterval = null;
    }

    this.logger.log('Function warming service stopped');
  }

  /**
   * Update warming configuration
   */
  async updateWarmingConfig(config: Partial<WarmingConfig>): Promise<void> {
    this.warmingConfig = { ...this.warmingConfig, ...config };

    // Restart warming if it was running
    if (this.warmingInterval) {
      await this.stopWarmingService();
      if (this.warmingConfig.enabled) {
        await this.startWarmingSchedule();
      }
    }

    this.logger.log('Warming configuration updated');
  }

  /**
   * Get warming statistics
   */
  async getWarmingStats(): Promise<{
    config: WarmingConfig;
    isActive: boolean;
    lastResults: any;
    uptime: number;
  }> {
    const lastResults = await this.getWarmingResults();

    return {
      config: this.warmingConfig,
      isActive: this.warmingInterval !== null,
      lastResults,
      uptime: process.uptime(),
    };
  }

  /**
   * Health check for warming service
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    status: string;
    details: any;
  }> {
    try {
      const stats = await this.getWarmingStats();
      const lastResults = stats.lastResults;

      if (!this.warmingConfig.enabled) {
        return {
          healthy: true,
          status: 'disabled',
          details: { message: 'Function warming is disabled' },
        };
      }

      if (!lastResults) {
        return {
          healthy: false,
          status: 'no_results',
          details: { message: 'No warming results available' },
        };
      }

      const recentResults =
        lastResults.timestamp &&
        Date.now() - new Date(lastResults.timestamp).getTime() <
          this.warmingConfig.intervalMs * 2;

      if (!recentResults) {
        return {
          healthy: false,
          status: 'stale_results',
          details: { message: 'Warming results are stale' },
        };
      }

      const successRate =
        lastResults.summary.success / lastResults.summary.total;
      const healthy = successRate >= 0.8; // 80% success rate threshold

      return {
        healthy,
        status: healthy ? 'healthy' : 'degraded',
        details: {
          successRate,
          lastWarming: lastResults.timestamp,
          summary: lastResults.summary,
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
   * Utility: delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
