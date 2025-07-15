import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

interface RateLimitEntry {
  count: number;
  window: number;
  resetTime: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private memoryStore: Map<string, RateLimitEntry> = new Map();
  protected windowMs: number = 15 * 60 * 1000; // 15 minutes
  protected maxRequests: number = 100; // requests per window

  constructor(private configService: ConfigService) {
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanupExpiredEntries(), 5 * 60 * 1000);
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryStore.entries()) {
      if (now > entry.resetTime) {
        this.memoryStore.delete(key);
      }
    }
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const key = this.generateKey(req);
    const now = Date.now();
    const window = Math.floor(now / this.windowMs);
    const storeKey = `${key}:${window}`;

    try {
      let entry = this.memoryStore.get(storeKey);

      if (!entry) {
        entry = {
          count: 0,
          window,
          resetTime: now + this.windowMs,
        };
      }

      entry.count++;
      this.memoryStore.set(storeKey, entry);

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': this.maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(
          0,
          this.maxRequests - entry.count
        ).toString(),
        'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
      });

      if (entry.count > this.maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(this.windowMs / 1000),
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open - allow request if rate limiting fails
      next();
    }
  }

  private generateKey(req: Request): string {
    // Use IP address as primary identifier
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    // If user is authenticated, use user ID for better tracking
    const userId = req.user?.['sub'];
    if (userId) {
      return `user:${userId}`;
    }

    return `ip:${ip}`;
  }

  async onApplicationShutdown() {
    this.memoryStore.clear();
  }
}

// Stricter rate limiting for sensitive endpoints
@Injectable()
export class StrictRateLimitMiddleware extends RateLimitMiddleware {
  protected windowMs: number = 15 * 60 * 1000; // 15 minutes
  protected maxRequests: number = 10; // Lower limit for sensitive operations
}

// Rate limiting for authentication endpoints
@Injectable()
export class AuthRateLimitMiddleware extends RateLimitMiddleware {
  protected windowMs: number = 15 * 60 * 1000; // 15 minutes
  protected maxRequests: number = 5; // Very strict for auth attempts
}
