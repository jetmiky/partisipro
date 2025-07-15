import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  compress?: boolean;
}

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private memoryCache: Map<string, { value: any; expiry: number }> = new Map();
  private defaultTTL: number = 3600; // 1 hour
  private defaultPrefix: string = 'partisipro:';

  constructor(private configService: ConfigService) {
    this.logger.warn('Using in-memory cache instead of Redis for testing');
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanupExpiredEntries(), 5 * 60 * 1000);
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiry > 0 && now > entry.expiry) {
        this.memoryCache.delete(key);
      }
    }
  }

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const fullKey = this.buildKey(key, options?.prefix);
    const entry = this.memoryCache.get(fullKey);

    if (!entry) {
      return null;
    }

    if (entry.expiry > 0 && Date.now() > entry.expiry) {
      this.memoryCache.delete(fullKey);
      return null;
    }

    return entry.value;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const fullKey = this.buildKey(key, options?.prefix);
    const ttl = options?.ttl || this.defaultTTL;
    const expiry = ttl > 0 ? Date.now() + ttl * 1000 : 0;

    this.memoryCache.set(fullKey, { value, expiry });
  }

  async delete(key: string, options?: CacheOptions): Promise<void> {
    const fullKey = this.buildKey(key, options?.prefix);
    this.memoryCache.delete(fullKey);
  }

  async deletePattern(pattern: string, options?: CacheOptions): Promise<void> {
    const fullPattern = this.buildKey(pattern, options?.prefix);
    const regex = new RegExp(fullPattern.replace(/\*/g, '.*'));

    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }
  }

  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    const fullKey = this.buildKey(key, options?.prefix);
    const entry = this.memoryCache.get(fullKey);

    if (!entry) {
      return false;
    }

    if (entry.expiry > 0 && Date.now() > entry.expiry) {
      this.memoryCache.delete(fullKey);
      return false;
    }

    return true;
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
  }

  async flush(): Promise<void> {
    this.memoryCache.clear();
  }

  async mget<T>(keys: string[], options?: CacheOptions): Promise<(T | null)[]> {
    const results: (T | null)[] = [];
    for (const key of keys) {
      const value = await this.get<T>(key, options);
      results.push(value);
    }
    return results;
  }

  async mset<T>(
    data: Array<{ key: string; value: T; ttl?: number }>,
    options?: CacheOptions
  ): Promise<void> {
    for (const item of data) {
      await this.set(item.key, item.value, {
        ...options,
        ttl: item.ttl || options?.ttl,
      });
    }
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    for (const tag of tags) {
      await this.deletePattern(`*:tag:${tag}:*`);
    }
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    latency: number;
    memory: any;
  }> {
    return {
      healthy: true,
      latency: 0,
      memory: { size: this.memoryCache.size },
    };
  }

  private buildKey(key: string, prefix?: string): string {
    const actualPrefix = prefix || this.defaultPrefix;
    return `${actualPrefix}${key}`;
  }

  async onModuleDestroy() {
    this.memoryCache.clear();
    this.logger.log('Memory cache cleared');
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
