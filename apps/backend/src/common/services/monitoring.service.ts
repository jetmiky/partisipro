import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from './firebase.service';
import { CacheService } from './cache.service';
import { HealthService } from './health.service';

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
    private healthService: HealthService
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
      'Redis',
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

    return {
      metrics,
      alerts,
      health,
      timestamp: new Date(),
    };
  }
}
