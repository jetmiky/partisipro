import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MonitoringService } from './monitoring.service';
import { CacheService } from './cache.service';
import { EmailService } from './email.service';

export interface AlertConfig {
  enabled: boolean;
  thresholds: {
    errorRate: number;
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    concurrentRequests: number;
    queueDepth: number;
  };
  notifications: {
    email: boolean;
    slack: boolean;
    webhook: boolean;
  };
  cooldownMs: number;
}

export interface MetricData {
  timestamp: Date;
  value: number;
  unit: string;
  labels?: Record<string, string>;
}

export interface AlertStatus {
  alertId: string;
  metricName: string;
  level: 'warning' | 'critical';
  status: 'active' | 'resolved';
  value: number;
  threshold: number;
  message: string;
  timestamp: Date;
  lastNotified?: Date;
}

export interface MonitoringDashboard {
  overview: {
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    activeConnections: number;
    uptime: number;
  };
  performance: {
    memoryUsage: number;
    cpuUsage: number;
    gcTime: number;
    eventLoopLag: number;
  };
  business: {
    activeUsers: number;
    projectsCreated: number;
    investmentsProcessed: number;
    profitsDistributed: number;
  };
  errors: {
    total: number;
    byType: Record<string, number>;
    recent: Array<{
      message: string;
      timestamp: Date;
      stack?: string;
    }>;
  };
  alerts: AlertStatus[];
}

@Injectable()
export class FirebaseMonitoringService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseMonitoringService.name);
  private alertConfig: AlertConfig;
  private activeAlerts: Map<string, AlertStatus> = new Map();
  private metrics: Map<string, MetricData[]> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alertCooldowns: Map<string, Date> = new Map();

  constructor(
    private configService: ConfigService,
    private monitoringService: MonitoringService,
    private cacheService: CacheService,
    private emailService: EmailService
  ) {
    this.alertConfig = this.loadAlertConfig();
  }

  async onModuleInit() {
    await this.initializeMonitoring();
    this.startMonitoringLoop();
    this.logger.log('Firebase monitoring service initialized');
  }

  /**
   * Load alert configuration
   */
  private loadAlertConfig(): AlertConfig {
    return {
      enabled: this.configService.get<boolean>(
        'monitoring.alerts.enabled',
        true
      ),
      thresholds: {
        errorRate: this.configService.get<number>(
          'monitoring.alerts.thresholds.errorRate',
          0.05
        ), // 5%
        responseTime: this.configService.get<number>(
          'monitoring.alerts.thresholds.responseTime',
          5000
        ), // 5 seconds
        memoryUsage: this.configService.get<number>(
          'monitoring.alerts.thresholds.memoryUsage',
          0.8
        ), // 80%
        cpuUsage: this.configService.get<number>(
          'monitoring.alerts.thresholds.cpuUsage',
          0.8
        ), // 80%
        concurrentRequests: this.configService.get<number>(
          'monitoring.alerts.thresholds.concurrentRequests',
          100
        ),
        queueDepth: this.configService.get<number>(
          'monitoring.alerts.thresholds.queueDepth',
          1000
        ),
      },
      notifications: {
        email: this.configService.get<boolean>(
          'monitoring.alerts.notifications.email',
          true
        ),
        slack: this.configService.get<boolean>(
          'monitoring.alerts.notifications.slack',
          false
        ),
        webhook: this.configService.get<boolean>(
          'monitoring.alerts.notifications.webhook',
          false
        ),
      },
      cooldownMs: this.configService.get<number>(
        'monitoring.alerts.cooldownMs',
        300000
      ), // 5 minutes
    };
  }

  /**
   * Initialize monitoring
   */
  private async initializeMonitoring(): Promise<void> {
    // Initialize metric storage
    this.metrics.set('requests', []);
    this.metrics.set('errors', []);
    this.metrics.set('responseTime', []);
    this.metrics.set('memoryUsage', []);
    this.metrics.set('cpuUsage', []);
    this.metrics.set('activeConnections', []);
    this.metrics.set('businessMetrics', []);

    // Set up process monitoring
    this.setupProcessMonitoring();
  }

  /**
   * Setup process monitoring
   */
  private setupProcessMonitoring(): void {
    // Monitor memory usage
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      this.recordMetric(
        'memoryUsage',
        memoryUsage.heapUsed / memoryUsage.heapTotal
      );
    }, 30000); // Every 30 seconds

    // Monitor CPU usage (approximated)
    let lastCpuUsage = process.cpuUsage();
    setInterval(() => {
      const currentCpuUsage = process.cpuUsage(lastCpuUsage);
      const cpuPercent =
        (currentCpuUsage.user + currentCpuUsage.system) / 1000000; // Convert to seconds
      this.recordMetric('cpuUsage', cpuPercent);
      lastCpuUsage = process.cpuUsage();
    }, 30000);

    // Monitor event loop lag
    setInterval(() => {
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
        this.recordMetric('eventLoopLag', lag);
      });
    }, 30000);
  }

  /**
   * Record metric
   */
  async recordMetric(
    metricName: string,
    value: number,
    unit: string = '',
    labels?: Record<string, string>
  ): Promise<void> {
    const metricData: MetricData = {
      timestamp: new Date(),
      value,
      unit,
      labels,
    };

    // Store in memory (keep last 100 points)
    let metrics = this.metrics.get(metricName) || [];
    metrics.push(metricData);
    if (metrics.length > 100) {
      metrics = metrics.slice(-100);
    }
    this.metrics.set(metricName, metrics);

    // Send to monitoring service
    await this.monitoringService.recordMetric(metricName, value);

    // Check for alerts
    await this.checkAlerts(metricName, value);

    // Cache recent metrics
    await this.cacheService.set(
      `metric_${metricName}_latest`,
      metricData,
      { ttl: 60 } // 1 minute
    );
  }

  /**
   * Record business metric
   */
  async recordBusinessMetric(
    metricName: string,
    value: number,
    metadata?: any
  ): Promise<void> {
    metadata;
    await this.recordMetric(`business_${metricName}`, value);
  }

  /**
   * Record error
   */
  async recordError(error: Error, context?: string): Promise<void> {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date(),
    };

    // Store error details
    await this.cacheService.set(
      `error_${Date.now()}`,
      errorData,
      { ttl: 3600 } // 1 hour
    );

    // Record error metric
    await this.recordMetric('errors', 1);

    // Log error
    this.logger.error(`Error recorded: ${error.message}`, error.stack);
  }

  /**
   * Record request
   */
  async recordRequest(
    method: string,
    path: string,
    statusCode: number,
    responseTime: number,
    userId?: string
  ): Promise<void> {
    userId;

    // Record request metric
    await this.recordMetric('requests', 1);

    // Record response time
    await this.recordMetric('responseTime', responseTime);

    // Record error if status code indicates error
    if (statusCode >= 400) {
      await this.recordMetric('errors', 1);
    }
  }

  /**
   * Check alerts
   */
  private async checkAlerts(metricName: string, value: number): Promise<void> {
    if (!this.alertConfig.enabled) {
      return;
    }

    const threshold = this.getThreshold(metricName);
    if (threshold === null) {
      return;
    }

    const alertId = `${metricName}_threshold`;
    const isViolation = value > threshold;
    const existingAlert = this.activeAlerts.get(alertId);

    if (isViolation && !existingAlert) {
      // New alert
      const alert: AlertStatus = {
        alertId,
        metricName,
        level: this.getAlertLevel(metricName, value, threshold),
        status: 'active',
        value,
        threshold,
        message: `${metricName} (${value}) exceeded threshold (${threshold})`,
        timestamp: new Date(),
      };

      this.activeAlerts.set(alertId, alert);
      await this.sendAlert(alert);
    } else if (!isViolation && existingAlert) {
      // Resolve alert
      existingAlert.status = 'resolved';
      existingAlert.timestamp = new Date();

      await this.sendAlert(existingAlert);
      this.activeAlerts.delete(alertId);
    }
  }

  /**
   * Get threshold for metric
   */
  private getThreshold(metricName: string): number | null {
    const thresholds = this.alertConfig.thresholds;

    switch (metricName) {
      case 'errorRate':
        return thresholds.errorRate;
      case 'responseTime':
        return thresholds.responseTime;
      case 'memoryUsage':
        return thresholds.memoryUsage;
      case 'cpuUsage':
        return thresholds.cpuUsage;
      case 'activeConnections':
        return thresholds.concurrentRequests;
      case 'queueDepth':
        return thresholds.queueDepth;
      default:
        return null;
    }
  }

  /**
   * Get alert level
   */
  private getAlertLevel(
    metricName: string,
    value: number,
    threshold: number
  ): 'warning' | 'critical' {
    const ratio = value / threshold;
    return ratio > 2 ? 'critical' : 'warning';
  }

  /**
   * Send alert
   */
  private async sendAlert(alert: AlertStatus): Promise<void> {
    const cooldownKey = `${alert.alertId}_cooldown`;
    const lastNotified = this.alertCooldowns.get(cooldownKey);

    // Check cooldown
    if (
      lastNotified &&
      Date.now() - lastNotified.getTime() < this.alertConfig.cooldownMs
    ) {
      return;
    }

    this.alertCooldowns.set(cooldownKey, new Date());

    try {
      // Send email notification
      if (this.alertConfig.notifications.email) {
        await this.sendEmailAlert(alert);
      }

      // Send Slack notification (if configured)
      if (this.alertConfig.notifications.slack) {
        await this.sendSlackAlert(alert);
      }

      // Send webhook notification (if configured)
      if (this.alertConfig.notifications.webhook) {
        await this.sendWebhookAlert(alert);
      }

      alert.lastNotified = new Date();
      this.logger.log(`Alert sent: ${alert.message}`);
    } catch (error) {
      this.logger.error('Failed to send alert:', error);
    }
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(alert: AlertStatus): Promise<void> {
    const subject = `[${alert.level.toUpperCase()}] ${alert.metricName} Alert`;
    const message = `
      Alert: ${alert.message}
      Level: ${alert.level}
      Status: ${alert.status}
      Timestamp: ${alert.timestamp.toISOString()}
      
      Value: ${alert.value}
      Threshold: ${alert.threshold}
    `;

    const emailData = {
      to: 'admin@partisipro.com', // Configure admin email
      subject,
      dynamicTemplateData: {
        message,
        alertLevel: alert.level,
        metricName: alert.metricName,
        value: alert.value,
        threshold: alert.threshold,
        timestamp: alert.timestamp.toISOString(),
      },
    };

    await this.emailService.sendSystemNotification(emailData, 'alert');
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(alert: AlertStatus): Promise<void> {
    // Implementation depends on Slack integration
    this.logger.log(`Slack alert would be sent: ${alert.message}`);
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(alert: AlertStatus): Promise<void> {
    // Implementation depends on webhook configuration
    this.logger.log(`Webhook alert would be sent: ${alert.message}`);
  }

  /**
   * Start monitoring loop
   */
  private startMonitoringLoop(): void {
    this.monitoringInterval = setInterval(async () => {
      await this.collectSystemMetrics();
      await this.updateDashboard();
    }, 60000); // Every minute
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<void> {
    try {
      // Calculate error rate
      const recentErrors = this.metrics.get('errors')?.slice(-10) || [];
      const recentRequests = this.metrics.get('requests')?.slice(-10) || [];
      const errorRate =
        recentRequests.length > 0
          ? recentErrors.length / recentRequests.length
          : 0;

      await this.recordMetric('errorRate', errorRate);

      // Calculate average response time
      const recentResponseTimes =
        this.metrics.get('responseTime')?.slice(-10) || [];
      const avgResponseTime =
        recentResponseTimes.length > 0
          ? recentResponseTimes.reduce((sum, metric) => sum + metric.value, 0) /
            recentResponseTimes.length
          : 0;

      await this.recordMetric('avgResponseTime', avgResponseTime);

      // System uptime
      await this.recordMetric('uptime', process.uptime());
    } catch (error) {
      this.logger.error('Failed to collect system metrics:', error);
    }
  }

  /**
   * Update dashboard
   */
  private async updateDashboard(): Promise<void> {
    try {
      const dashboard = await this.generateDashboard();
      await this.cacheService.set('monitoring_dashboard', dashboard, {
        ttl: 60,
      }); // 1 minute
    } catch (error) {
      this.logger.error('Failed to update dashboard:', error);
    }
  }

  /**
   * Generate monitoring dashboard
   */
  async generateDashboard(): Promise<MonitoringDashboard> {
    const requestMetrics = this.metrics.get('requests') || [];
    const errorMetrics = this.metrics.get('errors') || [];
    const responseTimeMetrics = this.metrics.get('responseTime') || [];
    const memoryMetrics = this.metrics.get('memoryUsage') || [];
    const cpuMetrics = this.metrics.get('cpuUsage') || [];

    // Calculate totals
    const totalRequests = requestMetrics.reduce(
      (sum, metric) => sum + metric.value,
      0
    );
    const totalErrors = errorMetrics.reduce(
      (sum, metric) => sum + metric.value,
      0
    );
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

    // Calculate averages
    const avgResponseTime =
      responseTimeMetrics.length > 0
        ? responseTimeMetrics.reduce((sum, metric) => sum + metric.value, 0) /
          responseTimeMetrics.length
        : 0;

    const avgMemoryUsage =
      memoryMetrics.length > 0
        ? memoryMetrics.reduce((sum, metric) => sum + metric.value, 0) /
          memoryMetrics.length
        : 0;

    const avgCpuUsage =
      cpuMetrics.length > 0
        ? cpuMetrics.reduce((sum, metric) => sum + metric.value, 0) /
          cpuMetrics.length
        : 0;

    // Get recent errors
    const recentErrors = await this.getRecentErrors(10);

    // Get active alerts
    const activeAlerts = Array.from(this.activeAlerts.values());

    return {
      overview: {
        totalRequests,
        errorRate,
        averageResponseTime: avgResponseTime,
        activeConnections: 0, // TODO: implement active connections tracking
        uptime: process.uptime(),
      },
      performance: {
        memoryUsage: avgMemoryUsage,
        cpuUsage: avgCpuUsage,
        gcTime: 0, // TODO: implement GC time tracking
        eventLoopLag: 0, // TODO: implement event loop lag tracking
      },
      business: {
        activeUsers: 0, // TODO: implement active users tracking
        projectsCreated: 0, // TODO: implement projects created tracking
        investmentsProcessed: 0, // TODO: implement investments processed tracking
        profitsDistributed: 0, // TODO: implement profits distributed tracking
      },
      errors: {
        total: totalErrors,
        byType: {}, // TODO: implement error type aggregation
        recent: recentErrors,
      },
      alerts: activeAlerts,
    };
  }

  /**
   * Get recent errors
   */
  private async getRecentErrors(limit: number): Promise<
    Array<{
      message: string;
      timestamp: Date;
      stack?: string;
    }>
  > {
    try {
      limit;

      // For now, return empty array since we don't have a keys() method
      // TODO: Implement a proper way to get recent errors
      return [];
    } catch (error) {
      this.logger.error('Failed to get recent errors:', error);
      return [];
    }
  }

  /**
   * Get monitoring dashboard
   */
  async getDashboard(): Promise<MonitoringDashboard> {
    const cached = await this.cacheService.get<MonitoringDashboard>(
      'monitoring_dashboard'
    );
    if (cached) {
      return cached;
    }

    return await this.generateDashboard();
  }

  /**
   * Get metric history
   */
  async getMetricHistory(
    metricName: string,
    limit: number = 100
  ): Promise<MetricData[]> {
    const metrics = this.metrics.get(metricName) || [];
    return metrics.slice(-limit);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): AlertStatus[] {
    return Array.from(this.activeAlerts.values());
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
      const dashboard = await this.getDashboard();
      const criticalAlerts = dashboard.alerts.filter(
        a => a.level === 'critical' && a.status === 'active'
      );

      return {
        healthy: criticalAlerts.length === 0,
        status: criticalAlerts.length === 0 ? 'healthy' : 'critical',
        details: {
          totalAlerts: dashboard.alerts.length,
          criticalAlerts: criticalAlerts.length,
          errorRate: dashboard.overview.errorRate,
          responseTime: dashboard.overview.averageResponseTime,
          memoryUsage: dashboard.performance.memoryUsage,
          cpuUsage: dashboard.performance.cpuUsage,
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
   * Update alert configuration
   */
  async updateAlertConfig(config: Partial<AlertConfig>): Promise<void> {
    this.alertConfig = { ...this.alertConfig, ...config };
    this.logger.log('Alert configuration updated');
  }

  /**
   * Clear alerts
   */
  async clearAlerts(): Promise<void> {
    this.activeAlerts.clear();
    this.alertCooldowns.clear();
    this.logger.log('All alerts cleared');
  }
}
