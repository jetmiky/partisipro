import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly allowedOrigins: string[];
  private readonly isDevelopment: boolean;

  constructor(private configService: ConfigService) {
    this.allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://partisipro.com',
      'https://app.partisipro.com',
    ];

    this.isDevelopment =
      this.configService.get<string>('NODE_ENV') === 'development';
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Set security headers
    this.setSecurityHeaders(res);

    // Handle CORS
    this.handleCors(req, res);

    // Content Security Policy
    this.setCSPHeaders(res);

    // Rate limiting headers (if not already set)
    if (!res.get('X-RateLimit-Limit')) {
      res.set('X-RateLimit-Limit', '100');
    }

    // Request ID for tracing
    if (!req.requestId) {
      req.requestId = crypto.randomUUID();
    }
    res.set('X-Request-ID', req.requestId);

    next();
  }

  private setSecurityHeaders(res: Response): void {
    // Prevent XSS attacks
    res.set('X-XSS-Protection', '1; mode=block');

    // Prevent clickjacking
    res.set('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.set('X-Content-Type-Options', 'nosniff');

    // Referrer policy
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Remove server information
    res.removeHeader('X-Powered-By');

    // Strict Transport Security (HTTPS only)
    if (!this.isDevelopment) {
      res.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // Permissions Policy
    res.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  }

  private handleCors(req: Request, res: Response): void {
    const origin = req.get('Origin');

    if (
      this.isDevelopment ||
      (origin && this.allowedOrigins.includes(origin))
    ) {
      res.set('Access-Control-Allow-Origin', origin || '*');
    }

    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );
    res.set('Access-Control-Allow-Credentials', 'true');
    res.set('Access-Control-Max-Age', '86400'); // 24 hours
  }

  private setCSPHeaders(res: Response): void {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.partisipro.com https://firebaseapp.com https://identitytoolkit.googleapis.com",
      "frame-src 'self' https://apis.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      'upgrade-insecure-requests',
    ];

    if (this.isDevelopment) {
      // More permissive CSP for development
      cspDirectives[1] = "script-src 'self' 'unsafe-inline' 'unsafe-eval' *";
      cspDirectives[5] = "connect-src 'self' *";
    }

    res.set('Content-Security-Policy', cspDirectives.join('; '));
  }
}

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  private readonly validApiKeys: Set<string>;

  constructor(private configService: ConfigService) {
    const apiKeys = this.configService.get<string>('API_KEYS', '');
    this.validApiKeys = new Set(apiKeys.split(',').filter(key => key.trim()));
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Skip API key validation for public endpoints
    if (this.isPublicEndpoint(req.path)) {
      return next();
    }

    const apiKey = req.get('X-API-Key');

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required',
        message: 'X-API-Key header is required for this endpoint',
      });
    }

    if (!this.validApiKeys.has(apiKey)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
        message: 'The provided API key is invalid or expired',
      });
    }

    next();
  }

  private isPublicEndpoint(path: string): boolean {
    const publicPaths = [
      '/health',
      '/auth/login',
      '/auth/register',
      '/projects', // Public project listing
      '/webhooks', // External webhooks
    ];

    return publicPaths.some(publicPath => path.startsWith(publicPath));
  }
}
