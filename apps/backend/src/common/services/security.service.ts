import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from './firebase.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

export interface SecurityEvent {
  id: string;
  userId: string;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  description: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export enum SecurityEventType {
  FAILED_LOGIN = 'failed_login',
  SUSPICIOUS_LOGIN = 'suspicious_login',
  MFA_BYPASS_ATTEMPT = 'mfa_bypass_attempt',
  ACCOUNT_LOCKED = 'account_locked',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  UNUSUAL_ACTIVITY = 'unusual_activity',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_TRANSACTION = 'suspicious_transaction',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);
  private readonly encryptionKey: string;
  private readonly saltRounds = 12;

  constructor(
    private configService: ConfigService,
    private firebaseService: FirebaseService
  ) {
    this.encryptionKey =
      this.configService.get<string>('ENCRYPTION_KEY') ||
      crypto.randomBytes(32).toString('hex');
  }

  async logSecurityEvent(
    userId: string,
    eventType: SecurityEventType,
    severity: SecuritySeverity,
    description: string,
    ipAddress: string,
    userAgent: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        id: crypto.randomUUID(),
        userId,
        eventType,
        severity,
        description,
        ipAddress,
        userAgent,
        timestamp: new Date(),
        metadata,
      };

      // Store in Firebase
      await this.firebaseService.setDocument(
        'security_events',
        securityEvent.id,
        securityEvent
      );

      // Log to console for immediate visibility
      this.logger.warn(
        `Security Event [${severity.toUpperCase()}]: ${eventType} - ${description} (User: ${userId})`
      );

      // Send alerts for high severity events
      if (
        severity === SecuritySeverity.HIGH ||
        severity === SecuritySeverity.CRITICAL
      ) {
        await this.sendSecurityAlert(securityEvent);
      }
    } catch (error) {
      this.logger.error('Failed to log security event:', error);
    }
  }

  async analyzeLoginAttempt(
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{
    isAnomalous: boolean;
    riskScore: number;
    reasons: string[];
  }> {
    try {
      const reasons: string[] = [];
      let riskScore = 0;

      // Check for unusual IP address
      const knownIPs = await this.getKnownIPAddresses(userId);
      if (!knownIPs.includes(ipAddress)) {
        reasons.push('Unknown IP address');
        riskScore += 30;
      }

      // Check for unusual user agent
      const knownUserAgents = await this.getKnownUserAgents(userId);
      if (
        !knownUserAgents.some(ua =>
          ua.includes(this.extractBrowserInfo(userAgent))
        )
      ) {
        reasons.push('Unknown device/browser');
        riskScore += 20;
      }

      // Check for recent failed attempts
      const recentFailures = await this.getRecentFailedAttempts(userId);
      if (recentFailures > 3) {
        reasons.push('Multiple recent failed attempts');
        riskScore += 40;
      }

      // Check for geographical anomalies (simplified)
      const isGeoAnomalous = await this.checkGeographicalAnomaly(
        userId,
        ipAddress
      );
      if (isGeoAnomalous) {
        reasons.push('Login from unusual location');
        riskScore += 25;
      }

      // Check for time-based anomalies
      const isTimeAnomalous = await this.checkTimeAnomaly(userId);
      if (isTimeAnomalous) {
        reasons.push('Login at unusual time');
        riskScore += 15;
      }

      return {
        isAnomalous: riskScore > 50,
        riskScore,
        reasons,
      };
    } catch (error) {
      this.logger.error('Failed to analyze login attempt:', error);
      return {
        isAnomalous: false,
        riskScore: 0,
        reasons: [],
      };
    }
  }

  async encryptSensitiveData(data: string): Promise<string> {
    try {
      const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      this.logger.error('Failed to encrypt sensitive data:', error);
      throw error;
    }
  }

  async decryptSensitiveData(encryptedData: string): Promise<string> {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      this.logger.error('Failed to decrypt sensitive data:', error);
      throw error;
    }
  }

  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      this.logger.error('Failed to hash password:', error);
      throw error;
    }
  }

  async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      this.logger.error('Failed to verify password:', error);
      return false;
    }
  }

  async generateSecureToken(length: number = 32): Promise<string> {
    return crypto.randomBytes(length).toString('hex');
  }

  async scanForThreats(data: any): Promise<{
    threats: string[];
    isClean: boolean;
  }> {
    const threats: string[] = [];

    // Check for SQL injection patterns
    if (this.containsSQLInjection(data)) {
      threats.push('SQL injection patterns detected');
    }

    // Check for XSS patterns
    if (this.containsXSS(data)) {
      threats.push('XSS patterns detected');
    }

    // Check for malicious file uploads
    if (this.containsMaliciousFile(data)) {
      threats.push('Malicious file patterns detected');
    }

    // Check for command injection
    if (this.containsCommandInjection(data)) {
      threats.push('Command injection patterns detected');
    }

    return {
      threats,
      isClean: threats.length === 0,
    };
  }

  private async sendSecurityAlert(securityEvent: SecurityEvent): Promise<void> {
    try {
      // In a real implementation, this would send alerts via:
      // - Email
      // - Slack
      // - SMS
      // - Security monitoring systems
      this.logger.error(
        `🚨 SECURITY ALERT: ${securityEvent.eventType} - ${securityEvent.description}`
      );
    } catch (error) {
      this.logger.error('Failed to send security alert:', error);
    }
  }

  private async getKnownIPAddresses(userId: string): Promise<string[]> {
    try {
      const loginHistory = await this.firebaseService.getDocuments(
        `users/${userId}/login_history`
      );

      const ipAddresses = new Set<string>();
      loginHistory.docs.forEach(doc => {
        const data = doc.data();
        if (data.ipAddress) {
          ipAddresses.add(data.ipAddress);
        }
      });

      return Array.from(ipAddresses);
    } catch (error) {
      this.logger.error('Failed to get known IP addresses:', error);
      return [];
    }
  }

  private async getKnownUserAgents(userId: string): Promise<string[]> {
    try {
      const loginHistory = await this.firebaseService.getDocuments(
        `users/${userId}/login_history`
      );

      const userAgents = new Set<string>();
      loginHistory.docs.forEach(doc => {
        const data = doc.data();
        if (data.userAgent) {
          userAgents.add(data.userAgent);
        }
      });

      return Array.from(userAgents);
    } catch (error) {
      this.logger.error('Failed to get known user agents:', error);
      return [];
    }
  }

  private async getRecentFailedAttempts(userId: string): Promise<number> {
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

      const failedAttempts = await this.firebaseService.getDocuments(
        'security_events',
        query =>
          query
            .where('userId', '==', userId)
            .where('eventType', '==', SecurityEventType.FAILED_LOGIN)
            .where('timestamp', '>=', cutoff)
      );

      return failedAttempts.docs.length;
    } catch (error) {
      this.logger.error('Failed to get recent failed attempts:', error);
      return 0;
    }
  }

  private async checkGeographicalAnomaly(
    userId: string,
    ipAddress: string
  ): Promise<boolean> {
    // This is a simplified implementation
    // In production, you would use a GeoIP service
    try {
      const recentLogins = await this.firebaseService.getDocuments(
        `users/${userId}/login_history`,
        query =>
          query.where(
            'timestamp',
            '>=',
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          )
      );

      // If user has no recent login history, consider it anomalous
      if (recentLogins.docs.length === 0) {
        return true;
      }

      // Check if IP is from a different region (simplified)
      const knownIPs = recentLogins.docs.map(doc => doc.data().ipAddress);
      const ipPrefix = ipAddress.split('.').slice(0, 2).join('.');

      return !knownIPs.some(ip => ip?.startsWith(ipPrefix));
    } catch (error) {
      this.logger.error('Failed to check geographical anomaly:', error);
      return false;
    }
  }

  private async checkTimeAnomaly(userId: string): Promise<boolean> {
    try {
      const currentHour = new Date().getHours();

      // Check if user typically logs in at this time
      const recentLogins = await this.firebaseService.getDocuments(
        `users/${userId}/login_history`,
        query =>
          query.where(
            'timestamp',
            '>=',
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          )
      );

      if (recentLogins.docs.length === 0) {
        return false;
      }

      const loginHours = recentLogins.docs.map(doc =>
        new Date(doc.data().timestamp).getHours()
      );

      // Check if current hour is within normal range
      const hourCounts = loginHours.reduce(
        (acc, hour) => {
          acc[hour] = (acc[hour] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>
      );

      const totalLogins = loginHours.length;
      const currentHourCount = hourCounts[currentHour] || 0;
      const currentHourPercentage = currentHourCount / totalLogins;

      // Consider it anomalous if less than 5% of logins happen at this hour
      return currentHourPercentage < 0.05;
    } catch (error) {
      this.logger.error('Failed to check time anomaly:', error);
      return false;
    }
  }

  private extractBrowserInfo(userAgent: string): string {
    // Extract browser information from user agent
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private containsSQLInjection(data: any): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /('|(\\')|(;)|(\\;)|(\\x00)|(\\n)|(\\r)|(\\x1a))/i,
    ];

    const dataStr = JSON.stringify(data).toLowerCase();
    return sqlPatterns.some(pattern => pattern.test(dataStr));
  }

  private containsXSS(data: any): boolean {
    const xssPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[\s\S]*?onerror[\s\S]*?>/gi,
    ];

    const dataStr = JSON.stringify(data);
    return xssPatterns.some(pattern => pattern.test(dataStr));
  }

  private containsMaliciousFile(data: any): boolean {
    const maliciousExtensions = [
      '.exe',
      '.bat',
      '.cmd',
      '.com',
      '.scr',
      '.vbs',
      '.js',
      '.jar',
      '.php',
      '.asp',
      '.aspx',
      '.jsp',
      '.py',
      '.rb',
      '.pl',
    ];

    const dataStr = JSON.stringify(data).toLowerCase();
    return maliciousExtensions.some(ext => dataStr.includes(ext));
  }

  private containsCommandInjection(data: any): boolean {
    const cmdPatterns = [
      /(\||&|;|`|\$\(|\$\{)/,
      /(rm|mv|cp|cat|grep|wget|curl|nc|telnet|ssh)/i,
      /(sudo|su|chmod|chown|passwd)/i,
    ];

    const dataStr = JSON.stringify(data);
    return cmdPatterns.some(pattern => pattern.test(dataStr));
  }
}
