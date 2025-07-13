import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import {
  SecurityService,
  SecurityEventType,
  SecuritySeverity,
} from '../services/security.service';
import {
  ComplianceService,
  ComplianceEventType,
  ComplianceRegulation,
} from '../services/compliance.service';

@Injectable()
export class SecurityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SecurityInterceptor.name);

  constructor(
    private securityService: SecurityService,
    private complianceService: ComplianceService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const startTime = Date.now();
    // Security logging context (used in security checks)
    // const method = request.method;
    // const url = request.url;
    const userAgent = request.get('User-Agent') || 'unknown';
    const ipAddress =
      request.ip || request.connection.remoteAddress || 'unknown';
    const user = request.user;

    // Pre-request security checks
    this.performPreRequestChecks(request, user, ipAddress, userAgent);

    return next.handle().pipe(
      tap({
        next: async data => {
          const responseTime = Date.now() - startTime;

          // Post-request security logging
          await this.performPostRequestLogging(
            request,
            response,
            user,
            ipAddress,
            userAgent,
            responseTime,
            data
          );
        },
        error: async error => {
          const responseTime = Date.now() - startTime;

          // Log security events for errors
          await this.handleSecurityError(
            request,
            response,
            user,
            ipAddress,
            userAgent,
            error,
            responseTime
          );
        },
      })
    );
  }

  private async performPreRequestChecks(
    request: any,
    user: any,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      // Check for malicious patterns in request
      const threatScan = await this.securityService.scanForThreats({
        body: request.body,
        query: request.query,
        params: request.params,
        headers: request.headers,
      });

      if (!threatScan.isClean) {
        this.logger.warn(
          `Potential security threats detected: ${threatScan.threats.join(', ')}`
        );

        if (user) {
          await this.securityService.logSecurityEvent(
            user.sub,
            SecurityEventType.SUSPICIOUS_ACTIVITY,
            SecuritySeverity.HIGH,
            `Malicious patterns detected: ${threatScan.threats.join(', ')}`,
            ipAddress,
            userAgent,
            {
              url: request.url,
              method: request.method,
              threats: threatScan.threats,
            }
          );
        }
      }

      // Analyze login attempts for anomalies
      if (request.url.includes('/auth/') && user) {
        const loginAnalysis = await this.securityService.analyzeLoginAttempt(
          user.sub,
          ipAddress,
          userAgent
        );

        if (loginAnalysis.isAnomalous) {
          await this.securityService.logSecurityEvent(
            user.sub,
            SecurityEventType.SUSPICIOUS_LOGIN,
            SecuritySeverity.MEDIUM,
            `Anomalous login detected: ${loginAnalysis.reasons.join(', ')}`,
            ipAddress,
            userAgent,
            {
              riskScore: loginAnalysis.riskScore,
              reasons: loginAnalysis.reasons,
            }
          );
        }
      }
    } catch (error) {
      this.logger.error(
        'Failed to perform pre-request security checks:',
        error
      );
    }
  }

  private async performPostRequestLogging(
    request: any,
    response: any,
    user: any,
    ipAddress: string,
    userAgent: string,
    responseTime: number,
    data: any
  ): Promise<void> {
    try {
      if (!user) return;

      const method = request.method;
      const url = request.url;
      const statusCode = response.statusCode;

      // Determine compliance requirements
      const regulations = this.determineComplianceRegulations(url);

      if (regulations.length > 0) {
        const eventType = this.mapToComplianceEventType(method, url);

        await this.complianceService.logComplianceEvent(
          user.sub,
          eventType,
          `${method} ${url}`,
          this.extractResourceFromUrl(url),
          ipAddress,
          userAgent,
          request.requestId,
          method === 'PUT' || method === 'PATCH'
            ? {
                before: request.originalData,
                after: data,
              }
            : undefined,
          regulations
        );
      }

      // Log sensitive data access
      if (this.isSensitiveEndpoint(url)) {
        await this.securityService.logSecurityEvent(
          user.sub,
          SecurityEventType.UNAUTHORIZED_ACCESS,
          SecuritySeverity.LOW,
          `Sensitive endpoint accessed: ${url}`,
          ipAddress,
          userAgent,
          {
            responseTime,
            statusCode,
            dataSize: JSON.stringify(data).length,
          }
        );
      }

      // Log financial transactions
      if (this.isFinancialEndpoint(url)) {
        await this.complianceService.logComplianceEvent(
          user.sub,
          ComplianceEventType.FINANCIAL_TRANSACTION,
          `${method} ${url}`,
          'financial_data',
          ipAddress,
          userAgent,
          request.requestId,
          undefined,
          [ComplianceRegulation.AML, ComplianceRegulation.KYC]
        );
      }

      // Check for PCI DSS compliance on payment endpoints
      if (
        this.isPaymentEndpoint(url) &&
        (method === 'POST' || method === 'PUT')
      ) {
        const pciCompliance =
          await this.complianceService.validatePCIDSSCompliance(request.body);

        if (!pciCompliance.compliant) {
          await this.securityService.logSecurityEvent(
            user.sub,
            SecurityEventType.DATA_BREACH_ATTEMPT,
            SecuritySeverity.CRITICAL,
            `PCI DSS violation detected: ${pciCompliance.violations.join(', ')}`,
            ipAddress,
            userAgent,
            {
              violations: pciCompliance.violations,
              recommendations: pciCompliance.recommendations,
            }
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to perform post-request logging:', error);
    }
  }

  private async handleSecurityError(
    request: any,
    response: any,
    user: any,
    ipAddress: string,
    userAgent: string,
    error: any,
    responseTime: number
  ): Promise<void> {
    try {
      const statusCode = response.statusCode || 500;
      const errorMessage = error.message || 'Unknown error';

      // Log authentication failures
      if (statusCode === 401 && user) {
        await this.securityService.logSecurityEvent(
          user.sub,
          SecurityEventType.FAILED_LOGIN,
          SecuritySeverity.MEDIUM,
          `Authentication failed: ${errorMessage}`,
          ipAddress,
          userAgent,
          {
            url: request.url,
            method: request.method,
            responseTime,
          }
        );
      }

      // Log authorization failures
      if (statusCode === 403 && user) {
        await this.securityService.logSecurityEvent(
          user.sub,
          SecurityEventType.UNAUTHORIZED_ACCESS,
          SecuritySeverity.HIGH,
          `Authorization failed: ${errorMessage}`,
          ipAddress,
          userAgent,
          {
            url: request.url,
            method: request.method,
            responseTime,
          }
        );
      }

      // Log rate limiting
      if (statusCode === 429) {
        const userId = user?.sub || 'anonymous';
        await this.securityService.logSecurityEvent(
          userId,
          SecurityEventType.RATE_LIMIT_EXCEEDED,
          SecuritySeverity.MEDIUM,
          `Rate limit exceeded for ${request.url}`,
          ipAddress,
          userAgent,
          {
            url: request.url,
            method: request.method,
          }
        );
      }

      // Log server errors that might indicate attacks
      if (statusCode >= 500) {
        const userId = user?.sub || 'anonymous';
        await this.securityService.logSecurityEvent(
          userId,
          SecurityEventType.SUSPICIOUS_ACTIVITY,
          SecuritySeverity.HIGH,
          `Server error: ${errorMessage}`,
          ipAddress,
          userAgent,
          {
            url: request.url,
            method: request.method,
            statusCode,
            responseTime,
          }
        );
      }
    } catch (logError) {
      this.logger.error('Failed to handle security error:', logError);
    }
  }

  private determineComplianceRegulations(url: string): ComplianceRegulation[] {
    const regulations: ComplianceRegulation[] = [];

    if (url.includes('/users/') || url.includes('/profile/')) {
      regulations.push(ComplianceRegulation.GDPR);
    }

    if (url.includes('/kyc/') || url.includes('/verification/')) {
      regulations.push(ComplianceRegulation.KYC);
    }

    if (url.includes('/payments/') || url.includes('/transactions/')) {
      regulations.push(ComplianceRegulation.PCI_DSS);
      regulations.push(ComplianceRegulation.AML);
    }

    if (url.includes('/investments/') || url.includes('/profits/')) {
      regulations.push(ComplianceRegulation.AML);
      regulations.push(ComplianceRegulation.SOX);
    }

    if (url.includes('/admin/')) {
      regulations.push(ComplianceRegulation.SOX);
      regulations.push(ComplianceRegulation.ISO_27001);
    }

    return regulations;
  }

  private mapToComplianceEventType(
    method: string,
    url: string
  ): ComplianceEventType {
    if (method === 'GET') {
      return url.includes('/sensitive/') ||
        url.includes('/kyc/') ||
        url.includes('/payments/')
        ? ComplianceEventType.SENSITIVE_DATA_ACCESS
        : ComplianceEventType.DATA_ACCESS;
    }

    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      return ComplianceEventType.DATA_MODIFICATION;
    }

    if (method === 'DELETE') {
      return ComplianceEventType.DATA_DELETION;
    }

    return ComplianceEventType.DATA_ACCESS;
  }

  private extractResourceFromUrl(url: string): string {
    const parts = url.split('/').filter(part => part.length > 0);
    return parts[parts.length - 1] || 'unknown';
  }

  private isSensitiveEndpoint(url: string): boolean {
    const sensitivePatterns = [
      '/kyc/',
      '/mfa/',
      '/payments/',
      '/admin/',
      '/users/profile',
      '/investments/',
      '/profits/',
    ];

    return sensitivePatterns.some(pattern => url.includes(pattern));
  }

  private isFinancialEndpoint(url: string): boolean {
    const financialPatterns = [
      '/investments/',
      '/profits/',
      '/transactions/',
      '/payments/',
    ];

    return financialPatterns.some(pattern => url.includes(pattern));
  }

  private isPaymentEndpoint(url: string): boolean {
    return url.includes('/payments/') || url.includes('/payment-methods/');
  }
}
