import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private redis: Redis;
  protected windowMs: number = 15 * 60 * 1000; // 15 minutes
  protected maxRequests: number = 100; // requests per window

  constructor(private configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
    });
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const key = this.generateKey(req);
    const now = Date.now();
    const window = Math.floor(now / this.windowMs);
    const redisKey = `rate_limit:${key}:${window}`;

    try {
      const current = await this.redis.incr(redisKey);

      if (current === 1) {
        await this.redis.expire(redisKey, Math.ceil(this.windowMs / 1000));
      }

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': this.maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(
          0,
          this.maxRequests - current
        ).toString(),
        'X-RateLimit-Reset': new Date(now + this.windowMs).toISOString(),
      });

      if (current > this.maxRequests) {
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
      // Fail open - allow request if Redis is down
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
    await this.redis.quit();
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
