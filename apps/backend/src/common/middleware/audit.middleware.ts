import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { FirebaseService } from '../services/firebase.service';
import { v4 as uuidv4 } from 'uuid';

interface AuditLog {
  id: string;
  timestamp: Date;
  userId?: string;
  userRole?: string;
  method: string;
  path: string;
  statusCode: number;
  ipAddress: string;
  userAgent: string;
  requestBody?: any;
  responseTime: number;
  error?: string;
  sensitive: boolean;
}

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  private sensitiveEndpoints = [
    '/auth',
    '/kyc',
    '/payments',
    '/investments',
    '/admin',
    '/profits',
  ];

  private sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'private',
    'ssn',
    'nip',
    'ktp',
    'bankAccount',
    'paymentDetails',
  ];

  constructor(private firebaseService: FirebaseService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const requestId = uuidv4();

    // Add request ID to request object for tracing
    req.requestId = requestId;

    // Override res.end to capture response details
    const originalEnd = res.end;
    res.end = (chunk?: any, encoding?: any) => {
      const responseTime = Date.now() - startTime;

      // Create audit log entry
      const auditLog: AuditLog = {
        id: requestId,
        timestamp: new Date(),
        userId: req.user?.['sub'],
        userRole: req.user?.['role'],
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        requestBody:
          req.method !== 'GET' ? this.sanitizeData(req.body) : undefined,
        responseTime,
        sensitive: this.isSensitiveEndpoint(req.path),
      };

      // Add error details if response indicates error
      if (res.statusCode >= 400 && chunk) {
        try {
          const errorData = JSON.parse(chunk.toString());
          auditLog.error =
            errorData.message || errorData.error || 'Unknown error';
        } catch (e) {
          auditLog.error = 'Error parsing response';
        }
      }

      // Log to Firebase asynchronously
      this.logToFirebase(auditLog).catch(error => {
        console.error('Failed to write audit log:', error);
      });

      // Call original end method and return the result
      return originalEnd.call(res, chunk, encoding);
    };

    next();
  }

  private isSensitiveEndpoint(path: string): boolean {
    return this.sensitiveEndpoints.some(endpoint => path.includes(endpoint));
  }

  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };

    for (const key in sanitized) {
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (
        typeof sanitized[key] === 'object' &&
        sanitized[key] !== null
      ) {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }

  private isSensitiveField(fieldName: string): boolean {
    const lowerField = fieldName.toLowerCase();
    return this.sensitiveFields.some(sensitive =>
      lowerField.includes(sensitive)
    );
  }

  private async logToFirebase(auditLog: AuditLog): Promise<void> {
    try {
      await this.firebaseService.setDocument(
        'audit_logs',
        auditLog.id,
        auditLog
      );
    } catch (error) {
      console.error('Failed to save audit log to Firebase:', error);
      // Could implement fallback logging here (e.g., to file or external service)
    }
  }
}

// Extend Express Request interface to include requestId
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}
