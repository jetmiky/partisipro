import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FirebaseService } from '../services/firebase.service';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

interface ErrorLog {
  id: string;
  timestamp: Date;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context: {
    requestId?: string;
    userId?: string;
    method: string;
    path: string;
    userAgent?: string;
    ipAddress: string;
    body?: any;
    query?: any;
  };
  statusCode: number;
  error?: any;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly isDevelopment: boolean;

  constructor(
    private firebaseService: FirebaseService,
    private configService: ConfigService
  ) {
    this.isDevelopment =
      this.configService.get<string>('NODE_ENV') === 'development';
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorInfo = this.extractErrorInfo(exception);
    const errorLog = this.createErrorLog(errorInfo, request);

    // Log error asynchronously
    this.logError(errorLog);

    // Send response
    const responseBody = this.createErrorResponse(errorInfo, request);
    response.status(errorInfo.statusCode).json(responseBody);
  }

  private extractErrorInfo(exception: unknown): {
    statusCode: number;
    message: string;
    error: string;
    stack?: string;
  } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      return {
        statusCode: exception.getStatus(),
        message:
          typeof response === 'string' ? response : (response as any).message,
        error: exception.name,
        stack: exception.stack,
      };
    }

    if (exception instanceof Error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message,
        error: exception.name,
        stack: exception.stack,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'UnknownError',
      stack: undefined,
    };
  }

  private createErrorLog(errorInfo: any, request: Request): ErrorLog {
    return {
      id: uuidv4(),
      timestamp: new Date(),
      level: errorInfo.statusCode >= 500 ? 'error' : 'warn',
      message: errorInfo.message,
      stack: errorInfo.stack,
      context: {
        requestId: request.requestId,
        userId: request.user?.['sub'],
        method: request.method,
        path: request.path,
        userAgent: request.get('User-Agent'),
        ipAddress: request.ip || request.connection.remoteAddress || 'unknown',
        body: this.sanitizeRequestBody(request.body),
        query: request.query,
      },
      statusCode: errorInfo.statusCode,
      error: errorInfo.error,
    };
  }

  private createErrorResponse(errorInfo: any, request: Request): any {
    const baseResponse = {
      success: false,
      error: errorInfo.error,
      message: errorInfo.message,
      statusCode: errorInfo.statusCode,
      timestamp: new Date().toISOString(),
      path: request.path,
      requestId: request.requestId,
    };

    // Include stack trace in development mode
    if (this.isDevelopment && errorInfo.stack) {
      (baseResponse as any).stack = errorInfo.stack;
    }

    return baseResponse;
  }

  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = [
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

    const sanitized = { ...body };

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (
        typeof sanitized[key] === 'object' &&
        sanitized[key] !== null
      ) {
        sanitized[key] = this.sanitizeRequestBody(sanitized[key]);
      }
    }

    return sanitized;
  }

  private async logError(errorLog: ErrorLog): Promise<void> {
    try {
      // Log to console
      this.logger.error(
        `${errorLog.context.method} ${errorLog.context.path} - ${errorLog.message}`,
        errorLog.stack
      );

      // Log to Firebase for persistence
      await this.firebaseService.setDocument(
        'error_logs',
        errorLog.id,
        errorLog
      );
    } catch (logError) {
      // Fallback logging if Firebase fails
      this.logger.error('Failed to log error to Firebase:', logError);
      console.error('Original error:', errorLog);
    }
  }
}
