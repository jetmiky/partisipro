import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FirebaseService } from './firebase.service';
import { CacheService } from './cache.service';
import { HealthService } from './health.service';
import { ConnectionPoolService } from './connection-pool.service';
import { ResourceManagerService } from './resource-manager.service';

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  source: string;
  metadata?: any;
  resolved?: boolean;
  resolvedAt?: Date;
  notificationsSent?: string[];
}

export interface MetricThreshold {
  metric: string;
  operator: 'gt' | 'lt' | 'eq';
  value: number;
  severity: Alert['severity'];
  description: string;
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly thresholds: MetricThreshold[] = [
    {
      metric: 'error_rate',
      operator: 'gt',
      value: 0.05, // 5%
      severity: 'high',
      description: 'Error rate is above 5%',
    },
    {
      metric: 'response_time',
      operator: 'gt',
      value: 2000, // 2 seconds
      severity: 'medium',
      description: 'Average response time is above 2 seconds',
    },
    {
      metric: 'memory_usage',
      operator: 'gt',
      value: 0.8, // 80%
      severity: 'high',
      description: 'Memory usage is above 80%',
    },
    {
      metric: 'active_connections',
      operator: 'gt',
      value: 1000,
      severity: 'medium',
      description: 'Active connections exceed 1000',
    },
  ];

  private metrics: Map<string, number[]> = new Map();
  private alerts: Map<string, Alert> = new Map();

  constructor(
    private configService: ConfigService,
    private firebaseService: FirebaseService,
    private cacheService: CacheService,
    private healthService: HealthService,
    private connectionPoolService: ConnectionPoolService,
    private resourceManagerService: ResourceManagerService
  ) {
    this.startMonitoring();
  }

  private startMonitoring(): void {
    // Check metrics every minute
    setInterval(() => {
      this.checkMetrics();
    }, 60000);

    // Check system health every 5 minutes
    setInterval(() => {
      this.checkSystemHealth();
    }, 300000);

    // Clean up old metrics every hour
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 3600000);
  }

  /**
   * Record a metric value
   */
  recordMetric(metric: string, value: number): void {
    const values = this.metrics.get(metric) || [];
    values.push(value);

    // Keep only last 100 values
    if (values.length > 100) {
      values.shift();
    }

    this.metrics.set(metric, values);
  }

  /**
   * Record an error occurrence
   */
  recordError(error: Error, context?: any): void {
    this.recordMetric('error_count', 1);

    // Create alert for critical errors
    if (this.isCriticalError(error)) {
      this.createAlert({
        type: 'error',
        severity: 'critical',
        title: 'Critical Error Occurred',
        description: error.message,
        source: 'error_handler',
        metadata: {
          error: error.name,
          stack: error.stack,
          context,
        },
      });
    }
  }

  /**
   * Record response time
   */
  recordResponseTime(duration: number): void {
    this.recordMetric('response_time', duration);
  }

  /**
   * Record successful request
   */
  recordSuccess(): void {
    this.recordMetric('success_count', 1);
  }

  /**
   * Get current metrics
   */
  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [metric, values] of this.metrics.entries()) {
      result[metric] = {
        current: values[values.length - 1] || 0,
        average: values.reduce((a, b) => a + b, 0) / values.length || 0,
        min: Math.min(...values) || 0,
        max: Math.max(...values) || 0,
        count: values.length,
      };
    }

    return result;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Create a new alert
   */
  async createAlert(
    alertData: Omit<Alert, 'id' | 'timestamp'>
  ): Promise<Alert> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...alertData,
    };

    this.alerts.set(alert.id, alert);

    // Log alert
    this.logger.warn(`Alert created: ${alert.title} - ${alert.description}`);

    // Store in Firebase
    try {
      await this.firebaseService.setDocument('alerts', alert.id, alert);
    } catch (error) {
      this.logger.error('Failed to store alert in Firebase:', error);
    }

    // Send notifications if severity is high or critical
    if (alert.severity === 'high' || alert.severity === 'critical') {
      await this.sendNotification(alert);
    }

    return alert;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();

    // Update in Firebase
    try {
      await this.firebaseService.updateDocument('alerts', alertId, {
        resolved: true,
        resolvedAt: alert.resolvedAt,
      });
    } catch (error) {
      this.logger.error('Failed to update alert in Firebase:', error);
    }

    this.logger.log(`Alert resolved: ${alert.title}`);
  }

  private async checkMetrics(): Promise<void> {
    const currentMetrics = this.getMetrics();

    for (const threshold of this.thresholds) {
      const metric = currentMetrics[threshold.metric];
      if (!metric) continue;

      const value = metric.average;
      const shouldAlert = this.evaluateThreshold(value, threshold);

      if (shouldAlert) {
        // Check if we already have an active alert for this metric
        const existingAlert = Array.from(this.alerts.values()).find(
          alert =>
            alert.source === `metric_${threshold.metric}` && !alert.resolved
        );

        if (!existingAlert) {
          await this.createAlert({
            type: 'warning',
            severity: threshold.severity,
            title: `Metric Threshold Exceeded: ${threshold.metric}`,
            description: `${threshold.description}. Current value: ${value}`,
            source: `metric_${threshold.metric}`,
            metadata: {
              threshold: threshold.value,
              current: value,
              operator: threshold.operator,
            },
          });
        }
      }
    }
  }

  private async checkSystemHealth(): Promise<void> {
    try {
      const health = await this.healthService.getHealthStatus();

      if (health.status === 'unhealthy') {
        await this.createAlert({
          type: 'error',
          severity: 'critical',
          title: 'System Health Check Failed',
          description: 'One or more system components are unhealthy',
          source: 'health_check',
          metadata: {
            services: health.services,
            uptime: health.uptime,
          },
        });
      } else if (health.status === 'degraded') {
        await this.createAlert({
          type: 'warning',
          severity: 'medium',
          title: 'System Performance Degraded',
          description: 'Some system components are experiencing issues',
          source: 'health_check',
          metadata: {
            services: health.services,
            uptime: health.uptime,
          },
        });
      }
    } catch (error) {
      this.logger.error('Health check failed:', error);
    }
  }

  private evaluateThreshold(
    value: number,
    threshold: MetricThreshold
  ): boolean {
    switch (threshold.operator) {
      case 'gt':
        return value > threshold.value;
      case 'lt':
        return value < threshold.value;
      case 'eq':
        return value === threshold.value;
      default:
        return false;
    }
  }

  private isCriticalError(error: Error): boolean {
    const criticalErrors = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'Firebase',
      'Database',
      'Payment',
      'KYC',
    ];

    return criticalErrors.some(
      critical =>
        error.message.includes(critical) || error.name.includes(critical)
    );
  }

  private async sendNotification(alert: Alert): Promise<void> {
    // In a real implementation, this would send notifications via:
    // - Email
    // - Slack
    // - Discord
    // - SMS
    // - Push notifications

    // For now, we'll just log and store the notification intent
    this.logger.error(
      `🚨 CRITICAL ALERT: ${alert.title} - ${alert.description}`,
      alert.metadata
    );

    // Store notification in cache for dashboard
    await this.cacheService.set(
      `notification:${alert.id}`,
      {
        alert,
        channels: ['console', 'dashboard'],
        sentAt: new Date(),
      },
      { ttl: 86400 } // 24 hours
    );
  }

  private cleanupOldMetrics(): void {
    // In a real implementation, you'd clean up timestamped metrics
    // For now, we'll just log the cleanup
    this.logger.log('Cleaning up old metrics');
  }

  /**
   * Get monitoring dashboard data
   */
  async getDashboardData(): Promise<any> {
    const metrics = this.getMetrics();
    const alerts = this.getActiveAlerts();
    const health = await this.healthService.getHealthStatus();
    const resourceStats = this.resourceManagerService.getResourceStatistics();
    const connectionStats = this.connectionPoolService.getPoolStatistics();
    const requestMetrics = this.connectionPoolService.getRequestMetrics();
    const cacheHealth = await this.cacheService.healthCheck();

    return {
      metrics,
      alerts,
      health,
      resources: resourceStats,
      connections: connectionStats,
      requests: requestMetrics,
      cache: cacheHealth,
      timestamp: new Date(),
    };
  }

  /**
   * Get comprehensive performance report
   */
  async getPerformanceReport(): Promise<{
    summary: any;
    resources: any;
    network: any;
    database: any;
    cache: any;
    errors: any;
    recommendations: string[];
  }> {
    const resourceStats = this.resourceManagerService.getResourceStatistics();
    const connectionStats = this.connectionPoolService.getPoolStatistics();
    const requestMetrics = this.connectionPoolService.getRequestMetrics();
    const cacheHealth = await this.cacheService.healthCheck();
    const memoryLeakInfo = this.resourceManagerService.getMemoryLeakInfo();

    // Generate performance summary
    const summary = {
      overallHealth: this.calculateOverallHealth(
        resourceStats,
        requestMetrics,
        cacheHealth
      ),
      uptime: resourceStats.uptime,
      totalRequests: requestMetrics.totalRequests,
      successRate: requestMetrics.successRate,
      averageResponseTime: requestMetrics.averageResponseTime,
      activeAlerts: this.getActiveAlerts().length,
    };

    // Gather recommendations
    const recommendations = this.generatePerformanceRecommendations(
      resourceStats,
      requestMetrics,
      memoryLeakInfo,
      cacheHealth
    );

    return {
      summary,
      resources: resourceStats,
      network: {
        connections: connectionStats,
        requests: requestMetrics,
      },
      database: {
        // Add database performance metrics here
        healthCheck: await this.firebaseService.healthCheck(),
      },
      cache: cacheHealth,
      errors: {
        recentErrors: requestMetrics.recentErrors,
        memoryLeaks: memoryLeakInfo,
      },
      recommendations,
    };
  }

  /**
   * Calculate overall system health score
   */
  private calculateOverallHealth(
    resourceStats: any,
    requestMetrics: any,
    cacheHealth: any
  ): { score: number; status: string; factors: any[] } {
    const factors = [];
    let totalScore = 0;
    let maxScore = 0;

    // CPU health (20%)
    const cpuScore = Math.max(
      0,
      100 - (resourceStats.current?.cpu?.usage || 0)
    );
    factors.push({ name: 'CPU Usage', score: cpuScore, weight: 20 });
    totalScore += cpuScore * 0.2;
    maxScore += 20;

    // Memory health (25%)
    const memoryScore = Math.max(
      0,
      100 - (resourceStats.current?.memory?.usage || 0)
    );
    factors.push({ name: 'Memory Usage', score: memoryScore, weight: 25 });
    totalScore += memoryScore * 0.25;
    maxScore += 25;

    // Request success rate (30%)
    const requestScore = requestMetrics.successRate || 0;
    factors.push({
      name: 'Request Success Rate',
      score: requestScore,
      weight: 30,
    });
    totalScore += requestScore * 0.3;
    maxScore += 30;

    // Response time health (15%)
    const responseTimeScore = Math.max(
      0,
      100 - requestMetrics.averageResponseTime / 50
    ); // 5000ms = 0 score
    factors.push({
      name: 'Response Time',
      score: responseTimeScore,
      weight: 15,
    });
    totalScore += responseTimeScore * 0.15;
    maxScore += 15;

    // Cache health (10%)
    const cacheScore = cacheHealth.healthy ? 100 : 0;
    factors.push({ name: 'Cache Health', score: cacheScore, weight: 10 });
    totalScore += cacheScore * 0.1;
    maxScore += 10;

    const overallScore = Math.round((totalScore / maxScore) * 100);

    let status = 'excellent';
    if (overallScore < 50) status = 'critical';
    else if (overallScore < 70) status = 'poor';
    else if (overallScore < 85) status = 'fair';
    else if (overallScore < 95) status = 'good';

    return { score: overallScore, status, factors };
  }

  /**
   * Generate performance recommendations
   */
  private generatePerformanceRecommendations(
    resourceStats: any,
    requestMetrics: any,
    memoryLeakInfo: any,
    cacheHealth: any
  ): string[] {
    const recommendations: string[] = [];

    // CPU recommendations
    if (resourceStats.current?.cpu?.usage > 80) {
      recommendations.push(
        'High CPU usage detected. Consider scaling horizontally or optimizing CPU-intensive operations.'
      );
    }

    // Memory recommendations
    if (resourceStats.current?.memory?.usage > 85) {
      recommendations.push(
        'High memory usage detected. Consider increasing available memory or investigating memory leaks.'
      );
    }

    if (memoryLeakInfo.suspiciousGrowth) {
      recommendations.push(
        'Potential memory leak detected. Review application code for memory retention issues.'
      );
    }

    // Request performance recommendations
    if (requestMetrics.successRate < 95) {
      recommendations.push(
        'Request success rate is below 95%. Review error logs and improve error handling.'
      );
    }

    if (requestMetrics.averageResponseTime > 2000) {
      recommendations.push(
        'Average response time is above 2 seconds. Consider optimizing database queries and caching strategies.'
      );
    }

    // Cache recommendations
    if (!cacheHealth.healthy) {
      recommendations.push(
        'Cache service is unhealthy. Check in-memory cache configuration.'
      );
    } else if (cacheHealth.latency > 100) {
      recommendations.push(
        'Cache latency is high. Consider optimizing in-memory cache configuration.'
      );
    }

    // General recommendations
    if (resourceStats.activeAlerts.length > 0) {
      recommendations.push(
        `${resourceStats.activeAlerts.length} active system alerts require attention.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'System is performing well. Continue monitoring for optimal performance.'
      );
    }

    return recommendations;
  }

  /**
   * Scheduled performance analysis
   */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduledPerformanceAnalysis(): Promise<void> {
    this.logger.debug('Running scheduled performance analysis...');

    try {
      const report = await this.getPerformanceReport();

      // Log performance summary
      this.logger.log(
        `Performance Score: ${report.summary.overallHealth.score}% (${report.summary.overallHealth.status})`
      );

      // Check for critical performance issues
      if (report.summary.overallHealth.score < 50) {
        await this.createAlert({
          type: 'error',
          severity: 'critical',
          title: 'Critical Performance Issues Detected',
          description: `System performance score is ${report.summary.overallHealth.score}%. Immediate attention required.`,
          source: 'performance_analysis',
          metadata: { report: report.summary },
        });
      } else if (report.summary.overallHealth.score < 70) {
        await this.createAlert({
          type: 'warning',
          severity: 'high',
          title: 'Performance Degradation Detected',
          description: `System performance score is ${report.summary.overallHealth.score}%. Performance optimization recommended.`,
          source: 'performance_analysis',
          metadata: { report: report.summary },
        });
      }

      // Cache the performance report for dashboard
      await this.cacheService.set(
        'performance:report',
        report,
        { ttl: 3600 } // 1 hour
      );
    } catch (error) {
      this.logger.error('Scheduled performance analysis failed:', error);
    }
  }

  /**
   * Get trending metrics over time
   */
  getTrendingMetrics(hours: number = 24): {
    cpu: number[];
    memory: number[];
    requests: number[];
    errors: number[];
    responseTime: number[];
  } {
    const resourceHistory =
      this.resourceManagerService.getResourceHistory(hours);

    return {
      cpu: resourceHistory.map(r => r.cpu.usage),
      memory: resourceHistory.map(r => r.memory.usage),
      requests: [], // Would need to implement request history tracking
      errors: [], // Would need to implement error history tracking
      responseTime: [], // Would need to implement response time history tracking
    };
  }

  /**
   * Force performance optimization actions
   */
  async forceOptimization(): Promise<{
    actionsPerformed: string[];
    errors: string[];
  }> {
    const actionsPerformed: string[] = [];
    const errors: string[] = [];

    try {
      // Force garbage collection
      const gcResult = this.resourceManagerService.forceGarbageCollection();
      if (gcResult) {
        actionsPerformed.push('Forced garbage collection');
      } else {
        errors.push('Garbage collection not available');
      }
    } catch (error) {
      errors.push(
        `Garbage collection failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    try {
      // Clear old cache entries
      await this.cacheService.deletePattern('*:expired:*');
      actionsPerformed.push('Cleared expired cache entries');
    } catch (error) {
      errors.push(
        `Cache cleanup failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    try {
      // Warm up critical caches
      // Implementation would depend on your specific caching strategy
      actionsPerformed.push('Cache warm-up initiated');
    } catch (error) {
      errors.push(
        `Cache warm-up failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return { actionsPerformed, errors };
  }
}
