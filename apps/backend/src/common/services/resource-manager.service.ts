import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { execSync } from 'child_process';
import * as os from 'os';
import * as process from 'process';

export interface ResourceUsage {
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    free: number;
    usage: number; // percentage
    heapUsed: number;
    heapTotal: number;
  };
  disk: {
    usage: number; // percentage - simplified for this implementation
  };
  network: {
    connections: number;
  };
  process: {
    pid: number;
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
  };
}

export interface ResourceThresholds {
  cpu: { warning: number; critical: number };
  memory: { warning: number; critical: number };
  disk: { warning: number; critical: number };
  connections: { warning: number; critical: number };
}

export interface ResourceAlert {
  type: 'cpu' | 'memory' | 'disk' | 'connections';
  level: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

@Injectable()
export class ResourceManagerService implements OnModuleDestroy {
  private readonly logger = new Logger(ResourceManagerService.name);
  private readonly resourceHistory: ResourceUsage[] = [];
  private readonly maxHistorySize = 1440; // 24 hours worth of minute samples
  private readonly activeAlerts = new Map<string, ResourceAlert>();
  private readonly alertCooldown = 5 * 60 * 1000; // 5 minutes
  private readonly lastAlertTime = new Map<string, number>();

  private readonly defaultThresholds: ResourceThresholds = {
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 80, critical: 95 },
    disk: { warning: 85, critical: 95 },
    connections: { warning: 1000, critical: 1500 },
  };

  private thresholds: ResourceThresholds;
  private monitoringEnabled = true;
  private gracefulShutdownInProgress = false;

  constructor(private configService: ConfigService) {
    this.initializeThresholds();
    this.monitoringEnabled =
      this.configService.get('MONITORING_ENABLED', 'true') === 'true';
    if (this.monitoringEnabled) {
      this.startResourceMonitoring();
    } else {
      this.logger.log('Resource monitoring disabled by configuration');
    }
  }

  private initializeThresholds(): void {
    this.thresholds = {
      cpu: {
        warning: this.configService.get(
          'RESOURCE_CPU_WARNING',
          this.defaultThresholds.cpu.warning
        ),
        critical: this.configService.get(
          'RESOURCE_CPU_CRITICAL',
          this.defaultThresholds.cpu.critical
        ),
      },
      memory: {
        warning: this.configService.get(
          'RESOURCE_MEMORY_WARNING',
          this.defaultThresholds.memory.warning
        ),
        critical: this.configService.get(
          'RESOURCE_MEMORY_CRITICAL',
          this.defaultThresholds.memory.critical
        ),
      },
      disk: {
        warning: this.configService.get(
          'RESOURCE_DISK_WARNING',
          this.defaultThresholds.disk.warning
        ),
        critical: this.configService.get(
          'RESOURCE_DISK_CRITICAL',
          this.defaultThresholds.disk.critical
        ),
      },
      connections: {
        warning: this.configService.get(
          'RESOURCE_CONN_WARNING',
          this.defaultThresholds.connections.warning
        ),
        critical: this.configService.get(
          'RESOURCE_CONN_CRITICAL',
          this.defaultThresholds.connections.critical
        ),
      },
    };
  }

  private startResourceMonitoring(): void {
    this.logger.log('Starting resource monitoring...');

    // Initial resource check
    this.collectResourceUsage();

    // Start periodic collection
    setInterval(() => {
      if (this.monitoringEnabled && !this.gracefulShutdownInProgress) {
        this.collectResourceUsage();
      }
    }, 60000); // Every minute
  }

  /**
   * Collect current resource usage
   */
  private async collectResourceUsage(): Promise<void> {
    try {
      const usage = await this.getCurrentResourceUsage();

      // Add to history
      this.resourceHistory.push(usage);

      // Cleanup old history
      if (this.resourceHistory.length > this.maxHistorySize) {
        this.resourceHistory.splice(
          0,
          this.resourceHistory.length - this.maxHistorySize
        );
      }

      // Check thresholds and generate alerts
      this.checkResourceThresholds(usage);
    } catch (error) {
      this.logger.error('Failed to collect resource usage:', error);
    }
  }

  /**
   * Get current resource usage
   */
  async getCurrentResourceUsage(): Promise<ResourceUsage> {
    const memInfo = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      cpu: {
        usage: await this.getCpuUsage(),
        loadAverage: os.loadavg(),
        cores: os.cpus().length,
      },
      memory: {
        used: usedMem,
        total: totalMem,
        free: freeMem,
        usage: (usedMem / totalMem) * 100,
        heapUsed: memInfo.heapUsed,
        heapTotal: memInfo.heapTotal,
      },
      disk: {
        usage: await this.getDiskUsage(),
      },
      network: {
        connections: await this.getActiveConnections(),
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: memInfo,
      },
    };
  }

  /**
   * Get CPU usage percentage
   */
  private async getCpuUsage(): Promise<number> {
    return new Promise(resolve => {
      const startTime = process.hrtime();
      const startUsage = process.cpuUsage();

      setTimeout(() => {
        const endTime = process.hrtime(startTime);
        const endUsage = process.cpuUsage(startUsage);

        const userTime = endUsage.user;
        const systemTime = endUsage.system;
        const totalTime = (endTime[0] * 1e9 + endTime[1]) / 1000; // Convert to microseconds

        const cpuUsage = ((userTime + systemTime) / totalTime) * 100;
        resolve(Math.min(cpuUsage, 100)); // Cap at 100%
      }, 100);
    });
  }

  /**
   * Get disk usage percentage (simplified)
   */
  private async getDiskUsage(): Promise<number> {
    // This is a simplified implementation
    // In production, you might want to use a library like 'node-disk-info'
    try {
      const output = execSync('df -h / | tail -1', { encoding: 'utf8' });
      const usage = output.split(/\s+/)[4];
      return parseInt(usage.replace('%', ''), 10);
    } catch {
      // Fallback if df command is not available
      return 50; // Default estimate
    }
  }

  /**
   * Get number of active network connections (approximation)
   */
  private async getActiveConnections(): Promise<number> {
    try {
      const output = execSync('netstat -an | grep ESTABLISHED | wc -l', {
        encoding: 'utf8',
      });
      return parseInt(output.trim(), 10);
    } catch {
      // Fallback if netstat is not available
      return 0;
    }
  }

  /**
   * Check resource thresholds and trigger alerts
   */
  private checkResourceThresholds(usage: ResourceUsage): void {
    // Check CPU
    this.checkThreshold('cpu', usage.cpu.usage, this.thresholds.cpu);

    // Check Memory
    this.checkThreshold('memory', usage.memory.usage, this.thresholds.memory);

    // Check Disk
    this.checkThreshold('disk', usage.disk.usage, this.thresholds.disk);

    // Check Connections
    this.checkThreshold(
      'connections',
      usage.network.connections,
      this.thresholds.connections
    );
  }

  /**
   * Check individual threshold
   */
  private checkThreshold(
    type: keyof ResourceThresholds,
    value: number,
    threshold: { warning: number; critical: number }
  ): void {
    const now = Date.now();
    const alertKey = `${type}`;
    const lastAlert = this.lastAlertTime.get(alertKey) || 0;

    // Check if we're in cooldown period
    if (now - lastAlert < this.alertCooldown) {
      return;
    }

    let level: 'warning' | 'critical' | null = null;
    let thresholdValue: number;

    if (value >= threshold.critical) {
      level = 'critical';
      thresholdValue = threshold.critical;
    } else if (value >= threshold.warning) {
      level = 'warning';
      thresholdValue = threshold.warning;
    }

    if (level) {
      const alert: ResourceAlert = {
        type,
        level,
        message: `${type.toUpperCase()} usage is ${level}: ${value.toFixed(2)}% (threshold: ${thresholdValue}%)`,
        value,
        threshold: thresholdValue,
        timestamp: new Date(),
      };

      this.triggerAlert(alertKey, alert);
      this.lastAlertTime.set(alertKey, now);
    } else {
      // Clear alert if resource usage is back to normal
      this.clearAlert(alertKey);
    }
  }

  /**
   * Trigger resource alert
   */
  private triggerAlert(alertKey: string, alert: ResourceAlert): void {
    this.activeAlerts.set(alertKey, alert);

    if (alert.level === 'critical') {
      this.logger.error(`CRITICAL RESOURCE ALERT: ${alert.message}`);
    } else {
      this.logger.warn(`RESOURCE WARNING: ${alert.message}`);
    }

    // In production, you might want to send alerts to external monitoring systems
    // this.sendToMonitoringSystem(alert);
  }

  /**
   * Clear resource alert
   */
  private clearAlert(alertKey: string): void {
    if (this.activeAlerts.has(alertKey)) {
      this.activeAlerts.delete(alertKey);
      this.logger.log(`Resource alert cleared: ${alertKey}`);
    }
  }

  /**
   * Get resource usage history
   */
  getResourceHistory(hours: number = 1): ResourceUsage[] {
    const samplesNeeded = hours * 60; // minutes
    return this.resourceHistory.slice(-samplesNeeded);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): ResourceAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get resource statistics
   */
  getResourceStatistics(): {
    current: ResourceUsage | null;
    averages: Partial<ResourceUsage>;
    peaks: Partial<ResourceUsage>;
    activeAlerts: ResourceAlert[];
    uptime: number;
  } {
    const history = this.resourceHistory;
    const current = history.length > 0 ? history[history.length - 1] : null;

    if (history.length === 0) {
      return {
        current: null,
        averages: {},
        peaks: {},
        activeAlerts: this.getActiveAlerts(),
        uptime: process.uptime(),
      };
    }

    // Calculate averages
    const averages = {
      cpu: {
        usage:
          history.reduce((sum, h) => sum + h.cpu.usage, 0) / history.length,
        loadAverage:
          history.length > 0 ? history[history.length - 1].cpu.loadAverage : [],
        cores: history.length > 0 ? history[history.length - 1].cpu.cores : 0,
      },
      memory: {
        usage:
          history.reduce((sum, h) => sum + h.memory.usage, 0) / history.length,
      },
      disk: {
        usage:
          history.reduce((sum, h) => sum + h.disk.usage, 0) / history.length,
      },
    } as Partial<ResourceUsage>;

    // Calculate peaks
    const peaks = {
      cpu: {
        usage: Math.max(...history.map(h => h.cpu.usage)),
        loadAverage:
          history.length > 0 ? history[history.length - 1].cpu.loadAverage : [],
        cores: history.length > 0 ? history[history.length - 1].cpu.cores : 0,
      },
      memory: {
        usage: Math.max(...history.map(h => h.memory.usage)),
      },
      disk: {
        usage: Math.max(...history.map(h => h.disk.usage)),
      },
    } as Partial<ResourceUsage>;

    return {
      current,
      averages,
      peaks,
      activeAlerts: this.getActiveAlerts(),
      uptime: process.uptime(),
    };
  }

  /**
   * Force garbage collection if available
   */
  forceGarbageCollection(): boolean {
    if (global.gc) {
      global.gc();
      this.logger.log('Forced garbage collection');
      return true;
    }
    this.logger.warn(
      'Garbage collection not available (run with --expose-gc flag)'
    );
    return false;
  }

  /**
   * Get memory leak detection info
   */
  getMemoryLeakInfo(): {
    heapGrowth: number;
    suspiciousGrowth: boolean;
    recommendations: string[];
  } {
    const history = this.resourceHistory.slice(-60); // Last hour

    if (history.length < 10) {
      return {
        heapGrowth: 0,
        suspiciousGrowth: false,
        recommendations: ['Not enough data to analyze memory trends'],
      };
    }

    const firstHeap = history[0].memory.heapUsed;
    const lastHeap = history[history.length - 1].memory.heapUsed;
    const heapGrowth = ((lastHeap - firstHeap) / firstHeap) * 100;

    const suspiciousGrowth = heapGrowth > 50; // More than 50% growth in an hour

    const recommendations: string[] = [];

    if (suspiciousGrowth) {
      recommendations.push('Consider running garbage collection');
      recommendations.push('Check for memory leaks in application code');
      recommendations.push('Monitor object retention and closures');
    }

    if (history[history.length - 1].memory.usage > 90) {
      recommendations.push('Memory usage is critically high');
      recommendations.push('Consider increasing available memory');
    }

    return {
      heapGrowth,
      suspiciousGrowth,
      recommendations,
    };
  }

  /**
   * Initiate graceful shutdown
   */
  async initiateGracefulShutdown(): Promise<void> {
    this.logger.log('Initiating graceful shutdown...');
    this.gracefulShutdownInProgress = true;
    this.monitoringEnabled = false;

    // Wait for ongoing operations to complete
    await this.waitForOngoingOperations();

    this.logger.log('Graceful shutdown preparation completed');
  }

  /**
   * Wait for ongoing operations (placeholder)
   */
  private async waitForOngoingOperations(): Promise<void> {
    // In a real implementation, this would wait for:
    // - Database connections to close
    // - HTTP requests to complete
    // - Background jobs to finish
    // - Cache to flush

    return new Promise(resolve => {
      setTimeout(resolve, 2000); // 2 second grace period
    });
  }

  /**
   * Scheduled resource cleanup
   */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduledCleanup(): Promise<void> {
    this.logger.debug('Running scheduled resource cleanup...');

    // Force garbage collection if memory usage is high
    const current = await this.getCurrentResourceUsage();
    if (current.memory.usage > 80) {
      this.forceGarbageCollection();
    }

    // Clear old alerts
    const now = Date.now();
    const alertsToRemove: string[] = [];

    this.activeAlerts.forEach((alert, key) => {
      if (now - alert.timestamp.getTime() > 60 * 60 * 1000) {
        // 1 hour old
        alertsToRemove.push(key);
      }
    });

    alertsToRemove.forEach(key => this.activeAlerts.delete(key));

    this.logger.debug('Scheduled resource cleanup completed');
  }

  /**
   * Module cleanup
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Stopping resource monitoring...');
    this.monitoringEnabled = false;
    await this.initiateGracefulShutdown();
  }
}
