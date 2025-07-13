import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';

export interface ConnectionPoolConfig {
  maxSockets: number;
  maxFreeSockets: number;
  timeout: number;
  keepAlive: boolean;
  keepAliveMsecs: number;
}

export interface ServiceEndpoint {
  name: string;
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  poolConfig?: Partial<ConnectionPoolConfig>;
}

export interface RequestMetrics {
  serviceType: string;
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  success: boolean;
  timestamp: Date;
  retryCount: number;
}

@Injectable()
export class ConnectionPoolService implements OnModuleDestroy {
  private readonly logger = new Logger(ConnectionPoolService.name);
  private readonly httpAgents = new Map<string, HttpAgent>();
  private readonly httpsAgents = new Map<string, HttpsAgent>();
  private readonly axiosInstances = new Map<string, AxiosInstance>();
  private readonly requestMetrics: RequestMetrics[] = [];
  private readonly maxMetricsHistory = 10000;

  private readonly defaultPoolConfig: ConnectionPoolConfig = {
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 30000,
    keepAlive: true,
    keepAliveMsecs: 1000,
  };

  constructor(private configService: ConfigService) {
    this.initializeServiceEndpoints();
  }

  private initializeServiceEndpoints(): void {
    // Initialize common service endpoints
    const endpoints: ServiceEndpoint[] = [
      {
        name: 'kyc-service',
        baseURL: this.configService.get(
          'KYC_SERVICE_URL',
          'https://api.verihubs.com'
        ),
        timeout: 30000,
        retries: 3,
        retryDelay: 1000,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.configService.get('KYC_API_KEY')}`,
        },
      },
      {
        name: 'payment-gateway',
        baseURL: this.configService.get(
          'PAYMENT_GATEWAY_URL',
          'https://api.midtrans.com'
        ),
        timeout: 20000,
        retries: 2,
        retryDelay: 500,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(this.configService.get('PAYMENT_SERVER_KEY', '') + ':').toString('base64')}`,
        },
      },
      {
        name: 'blockchain-rpc',
        baseURL: this.configService.get(
          'ARBITRUM_RPC_URL',
          'https://sepolia-rollup.arbitrum.io/rpc'
        ),
        timeout: 15000,
        retries: 5,
        retryDelay: 2000,
        poolConfig: {
          maxSockets: 20,
          keepAliveMsecs: 5000,
        },
      },
      {
        name: 'email-service',
        baseURL: this.configService.get(
          'EMAIL_SERVICE_URL',
          'https://api.sendgrid.com'
        ),
        timeout: 10000,
        retries: 2,
        retryDelay: 1000,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.configService.get('SENDGRID_API_KEY')}`,
        },
      },
      {
        name: 'web3auth-service',
        baseURL: this.configService.get(
          'WEB3AUTH_API_URL',
          'https://api.web3auth.io'
        ),
        timeout: 10000,
        retries: 3,
        retryDelay: 1000,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.configService.get('WEB3AUTH_API_KEY')}`,
        },
      },
    ];

    endpoints.forEach(endpoint => this.createServiceClient(endpoint));
  }

  private createServiceClient(endpoint: ServiceEndpoint): void {
    const poolConfig = { ...this.defaultPoolConfig, ...endpoint.poolConfig };

    // Create HTTP/HTTPS agents with connection pooling
    const httpAgent = new HttpAgent({
      maxSockets: poolConfig.maxSockets,
      maxFreeSockets: poolConfig.maxFreeSockets,
      timeout: poolConfig.timeout,
      keepAlive: poolConfig.keepAlive,
      keepAliveMsecs: poolConfig.keepAliveMsecs,
    });

    const httpsAgent = new HttpsAgent({
      maxSockets: poolConfig.maxSockets,
      maxFreeSockets: poolConfig.maxFreeSockets,
      timeout: poolConfig.timeout,
      keepAlive: poolConfig.keepAlive,
      keepAliveMsecs: poolConfig.keepAliveMsecs,
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    });

    this.httpAgents.set(endpoint.name, httpAgent);
    this.httpsAgents.set(endpoint.name, httpsAgent);

    // Create Axios instance with the agents
    const axiosInstance = axios.create({
      baseURL: endpoint.baseURL,
      timeout: endpoint.timeout || 30000,
      headers: endpoint.headers || {},
      httpAgent,
      httpsAgent,
    });

    // Add request interceptor
    axiosInstance.interceptors.request.use(
      config => {
        (config as any).metadata = { startTime: Date.now(), retryCount: 0 };
        return config;
      },
      error => Promise.reject(error)
    );

    // Add response interceptor for metrics
    axiosInstance.interceptors.response.use(
      response => {
        this.recordRequestMetric(endpoint.name, response);
        return response;
      },
      error => {
        this.recordRequestMetric(endpoint.name, error.response, error);
        return Promise.reject(error);
      }
    );

    this.axiosInstances.set(endpoint.name, axiosInstance);
    this.logger.log(`Initialized connection pool for ${endpoint.name}`);
  }

  /**
   * Get service client by name
   */
  getServiceClient(serviceName: string): AxiosInstance {
    const client = this.axiosInstances.get(serviceName);
    if (!client) {
      throw new Error(`Service client not found: ${serviceName}`);
    }
    return client;
  }

  /**
   * Make request with automatic retries and circuit breaker
   */
  async makeRequest<T = any>(
    serviceName: string,
    config: AxiosRequestConfig,
    options?: {
      retries?: number;
      retryDelay?: number;
      timeout?: number;
    }
  ): Promise<AxiosResponse<T>> {
    const client = this.getServiceClient(serviceName);
    const maxRetries = options?.retries ?? 3;
    const retryDelay = options?.retryDelay ?? 1000;

    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const requestConfig = {
          ...config,
          timeout: options?.timeout || config.timeout,
          metadata: {
            ...(config as any).metadata,
            retryCount: attempt,
            serviceName,
          },
        } as any;

        const response = await client.request<T>(requestConfig);

        if (attempt > 0) {
          this.logger.log(
            `Request succeeded on retry ${attempt} for ${serviceName}`
          );
        }

        return response;
      } catch (error) {
        lastError = error;

        // Don't retry on certain errors
        if (this.shouldNotRetry(error)) {
          break;
        }

        if (attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
          this.logger.warn(
            `Request failed for ${serviceName}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`
          );
          await this.sleep(delay);
        }
      }
    }

    this.logger.error(
      `Request failed after ${maxRetries + 1} attempts for ${serviceName}:`,
      lastError
    );
    throw lastError;
  }

  /**
   * Health check for all service endpoints
   */
  async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    const healthChecks = Array.from(this.axiosInstances.entries()).map(
      async ([serviceName, client]) => {
        try {
          await client.get('/health', { timeout: 5000 });
          results[serviceName] = true;
        } catch (error) {
          results[serviceName] = false;
          this.logger.warn(
            `Health check failed for ${serviceName}:`,
            error instanceof Error ? error.message : String(error)
          );
        }
      }
    );

    await Promise.allSettled(healthChecks);
    return results;
  }

  /**
   * Get connection pool statistics
   */
  getPoolStatistics(): Record<string, any> {
    const stats: Record<string, any> = {};

    this.httpAgents.forEach((agent, serviceName) => {
      stats[serviceName] = {
        http: {
          sockets: Object.keys(agent.sockets || {}).length,
          freeSockets: Object.keys(agent.freeSockets || {}).length,
          maxSockets: agent.maxSockets,
          maxFreeSockets: agent.maxFreeSockets,
        },
      };
    });

    this.httpsAgents.forEach((agent, serviceName) => {
      if (!stats[serviceName]) stats[serviceName] = {};
      stats[serviceName].https = {
        sockets: Object.keys(agent.sockets || {}).length,
        freeSockets: Object.keys(agent.freeSockets || {}).length,
        maxSockets: agent.maxSockets,
        maxFreeSockets: agent.maxFreeSockets,
      };
    });

    return stats;
  }

  /**
   * Get request metrics and analytics
   */
  getRequestMetrics(): {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    serviceBreakdown: Record<string, any>;
    recentErrors: RequestMetrics[];
  } {
    if (this.requestMetrics.length === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        serviceBreakdown: {},
        recentErrors: [],
      };
    }

    const totalRequests = this.requestMetrics.length;
    const successfulRequests = this.requestMetrics.filter(
      m => m.success
    ).length;
    const successRate = (successfulRequests / totalRequests) * 100;
    const averageResponseTime =
      this.requestMetrics.reduce((sum, m) => sum + m.duration, 0) /
      totalRequests;

    // Service breakdown
    const serviceBreakdown: Record<string, any> = {};
    this.requestMetrics.forEach(metric => {
      if (!serviceBreakdown[metric.serviceType]) {
        serviceBreakdown[metric.serviceType] = {
          totalRequests: 0,
          successfulRequests: 0,
          averageResponseTime: 0,
          totalDuration: 0,
        };
      }

      const service = serviceBreakdown[metric.serviceType];
      service.totalRequests++;
      service.totalDuration += metric.duration;

      if (metric.success) {
        service.successfulRequests++;
      }
    });

    // Calculate averages
    Object.values(serviceBreakdown).forEach((service: any) => {
      service.successRate =
        (service.successfulRequests / service.totalRequests) * 100;
      service.averageResponseTime =
        service.totalDuration / service.totalRequests;
      delete service.totalDuration;
    });

    // Recent errors (last 20)
    const recentErrors = this.requestMetrics
      .filter(m => !m.success)
      .slice(-20)
      .reverse();

    return {
      totalRequests,
      successRate,
      averageResponseTime,
      serviceBreakdown,
      recentErrors,
    };
  }

  /**
   * Clean up old metrics
   */
  private cleanupMetrics(): void {
    if (this.requestMetrics.length > this.maxMetricsHistory) {
      this.requestMetrics.splice(
        0,
        this.requestMetrics.length - this.maxMetricsHistory
      );
    }
  }

  /**
   * Record request metrics
   */
  private recordRequestMetric(
    serviceName: string,
    response?: AxiosResponse,
    error?: any
  ): void {
    const config = response?.config || error?.config;
    if (!config?.metadata) return;

    const duration = Date.now() - config.metadata.startTime;
    const statusCode = response?.status || error?.response?.status || 0;
    const success = !!response && statusCode >= 200 && statusCode < 400;

    const metric: RequestMetrics = {
      serviceType: serviceName,
      endpoint: config.url || 'unknown',
      method: config.method?.toUpperCase() || 'GET',
      duration,
      statusCode,
      success,
      timestamp: new Date(),
      retryCount: config.metadata.retryCount || 0,
    };

    this.requestMetrics.push(metric);
    this.cleanupMetrics();

    // Log slow requests
    if (duration > 5000) {
      this.logger.warn(
        `Slow request detected: ${serviceName} ${metric.method} ${metric.endpoint} took ${duration}ms`
      );
    }
  }

  /**
   * Check if error should not trigger retry
   */
  private shouldNotRetry(error: any): boolean {
    const status = error?.response?.status;

    // Don't retry on client errors (4xx) except rate limiting
    if (status >= 400 && status < 500 && status !== 429) {
      return true;
    }

    // Don't retry on certain network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return true;
    }

    return false;
  }

  /**
   * Sleep helper for retries
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Cleaning up connection pools...');

    // Destroy all HTTP agents
    this.httpAgents.forEach((agent, serviceName) => {
      agent.destroy();
      this.logger.debug(`Destroyed HTTP agent for ${serviceName}`);
    });

    // Destroy all HTTPS agents
    this.httpsAgents.forEach((agent, serviceName) => {
      agent.destroy();
      this.logger.debug(`Destroyed HTTPS agent for ${serviceName}`);
    });

    this.logger.log('Connection pool cleanup completed');
  }
}
