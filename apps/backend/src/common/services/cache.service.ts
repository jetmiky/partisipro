import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Logger } from '@nestjs/common';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  compress?: boolean;
}

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis;
  private defaultTTL: number = 3600; // 1 hour
  private defaultPrefix: string = 'partisipro:';

  constructor(private configService: ConfigService) {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    const redisConfig = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      lazyConnect: true,
    };

    this.redis = new Redis(redisConfig);

    this.redis.on('error', error => {
      this.logger.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const value = await this.redis.get(fullKey);

      if (value === null) {
        return null;
      }

      return JSON.parse(value);
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const serializedValue = JSON.stringify(value);
      const ttl = options?.ttl || this.defaultTTL;

      await this.redis.setex(fullKey, ttl, serializedValue);
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}:`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string, options?: CacheOptions): Promise<void> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      await this.redis.del(fullKey);
    } catch (error) {
      this.logger.error(`Cache DELETE error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern: string, options?: CacheOptions): Promise<void> {
    try {
      const fullPattern = this.buildKey(pattern, options?.prefix);
      const keys = await this.redis.keys(fullPattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      this.logger.error(
        `Cache DELETE PATTERN error for pattern ${pattern}:`,
        error
      );
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const exists = await this.redis.exists(fullKey);
      return exists === 1;
    } catch (error) {
      this.logger.error(`Cache EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get TTL for a key
   */
  async getTTL(key: string, options?: CacheOptions): Promise<number> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      return await this.redis.ttl(fullKey);
    } catch (error) {
      this.logger.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Set TTL for existing key
   */
  async setTTL(
    key: string,
    ttl: number,
    options?: CacheOptions
  ): Promise<void> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      await this.redis.expire(fullKey, ttl);
    } catch (error) {
      this.logger.error(`Cache SET TTL error for key ${key}:`, error);
    }
  }

  /**
   * Increment numeric value
   */
  async increment(
    key: string,
    by: number = 1,
    options?: CacheOptions
  ): Promise<number> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const result = await this.redis.incrby(fullKey, by);

      // Set TTL if this is a new key
      if (result === by) {
        await this.redis.expire(fullKey, options?.ttl || this.defaultTTL);
      }

      return result;
    } catch (error) {
      this.logger.error(`Cache INCREMENT error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get or set pattern - retrieve from cache or compute and cache
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key, options);
      if (cached !== null) {
        return cached;
      }

      // If not in cache, compute the value
      const computed = await factory();

      // Cache the computed value
      await this.set(key, computed, options);

      return computed;
    } catch (error) {
      this.logger.error(`Cache GET_OR_SET error for key ${key}:`, error);
      // If cache fails, just return the computed value
      return await factory();
    }
  }

  /**
   * Cache invalidation by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      const promises = tags.map(tag => this.deletePattern(`*:tag:${tag}:*`));
      await Promise.all(promises);
    } catch (error) {
      this.logger.error(`Cache INVALIDATE BY TAGS error:`, error);
    }
  }

  /**
   * Flush all cache data
   */
  async flush(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      this.logger.error('Cache FLUSH error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    try {
      const info = await this.redis.info('memory');
      return this.parseRedisInfo(info);
    } catch (error) {
      this.logger.error('Cache STATS error:', error);
      return null;
    }
  }

  private buildKey(key: string, prefix?: string): string {
    const actualPrefix = prefix || this.defaultPrefix;
    return `${actualPrefix}${key}`;
  }

  private parseRedisInfo(info: string): any {
    const lines = info.split('\r\n');
    const result: any = {};

    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = isNaN(Number(value)) ? value : Number(value);
      }
    });

    return result;
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}

// Common cache key patterns
export const CacheKeys = {
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  USER_KYC_STATUS: (userId: string) => `user:kyc:${userId}`,
  PROJECT_DETAILS: (projectId: string) => `project:details:${projectId}`,
  PROJECT_LIST: (filters: string) => `project:list:${filters}`,
  INVESTMENT_PORTFOLIO: (userId: string) => `investment:portfolio:${userId}`,
  PROFIT_CLAIMS: (userId: string) => `profit:claims:${userId}`,
  PLATFORM_ANALYTICS: () => `platform:analytics`,
  BLOCKCHAIN_BLOCK: (blockNumber: number) => `blockchain:block:${blockNumber}`,
  RATE_LIMIT: (key: string, window: number) => `rate_limit:${key}:${window}`,
};

// Cache TTL constants (in seconds)
export const CacheTTL = {
  VERY_SHORT: 60, // 1 minute
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
  PERMANENT: -1, // No expiration
};
