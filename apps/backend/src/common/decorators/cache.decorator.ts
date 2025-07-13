import { SetMetadata } from '@nestjs/common';

export interface CacheDecoratorOptions {
  ttl?: number;
  key?: string;
  prefix?: string;
  tags?: string[];
  invalidateOnMutation?: boolean;
}

export const CACHE_METADATA = 'cache_metadata';

/**
 * Cache decorator for automatic method result caching
 * @param options Cache configuration options
 */
export const Cache = (options: CacheDecoratorOptions = {}) => {
  return SetMetadata(CACHE_METADATA, options);
};

/**
 * Cache invalidation decorator for methods that should clear cache
 * @param patterns Cache key patterns to invalidate
 */
export const InvalidateCache = (patterns: string[] | string) => {
  const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
  return SetMetadata('cache_invalidate', patternsArray);
};

/**
 * Cache key builder decorator for dynamic key generation
 * @param keyBuilder Function to build cache key from method arguments
 */
export const CacheKey = (keyBuilder: (...args: any[]) => string) => {
  return SetMetadata('cache_key_builder', keyBuilder);
};
