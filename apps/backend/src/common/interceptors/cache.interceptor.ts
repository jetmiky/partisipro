import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService, CacheTTL } from '../services/cache.service';
import {
  CACHE_METADATA,
  CacheDecoratorOptions,
} from '../decorators/cache.decorator';
import { Logger } from '@nestjs/common';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const cacheOptions = this.reflector.get<CacheDecoratorOptions>(
      CACHE_METADATA,
      context.getHandler()
    );

    if (!cacheOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const methodName = context.getHandler().name;
    const className = context.getClass().name;

    // Build cache key
    const cacheKey = this.buildCacheKey(
      request,
      methodName,
      className,
      cacheOptions
    );

    try {
      // Check if we should skip cache for mutations
      if (this.isMutationMethod(request.method)) {
        return this.handleMutation(next, cacheKey, cacheOptions);
      }

      // Try to get from cache
      const cachedResult = await this.cacheService.get(cacheKey);
      if (cachedResult !== null) {
        this.logger.debug(`Cache HIT for key: ${cacheKey}`);
        return of(cachedResult);
      }

      this.logger.debug(`Cache MISS for key: ${cacheKey}`);

      // Execute the method and cache the result
      return next.handle().pipe(
        tap(async result => {
          const ttl = cacheOptions.ttl || CacheTTL.MEDIUM;
          await this.cacheService.set(cacheKey, result, { ttl });
          this.logger.debug(
            `Cached result for key: ${cacheKey} with TTL: ${ttl}s`
          );
        })
      );
    } catch (error) {
      this.logger.error(`Cache error for key ${cacheKey}:`, error);
      return next.handle();
    }
  }

  private buildCacheKey(
    request: any,
    methodName: string,
    className: string,
    options: CacheDecoratorOptions
  ): string {
    if (options.key) {
      return options.key;
    }

    const baseKey = `${className.toLowerCase()}:${methodName}`;

    // Include query parameters in cache key
    const queryString = new URLSearchParams(request.query).toString();
    const pathParams = request.params ? JSON.stringify(request.params) : '';

    // Create a unique key based on request characteristics
    const keyParts = [baseKey];

    if (pathParams) {
      keyParts.push(`params:${this.hashString(pathParams)}`);
    }

    if (queryString) {
      keyParts.push(`query:${this.hashString(queryString)}`);
    }

    // Include user context if available
    if (request.user?.id) {
      keyParts.push(`user:${request.user.id}`);
    }

    return keyParts.join(':');
  }

  private async handleMutation(
    next: CallHandler,
    cacheKey: string,
    options: CacheDecoratorOptions
  ): Promise<Observable<any>> {
    return next.handle().pipe(
      tap(async () => {
        if (options.invalidateOnMutation) {
          // Invalidate related caches
          if (options.tags) {
            await this.cacheService.invalidateByTags(options.tags);
          }

          // Also invalidate this specific cache key pattern
          const keyPattern = cacheKey.split(':').slice(0, 2).join(':') + '*';
          await this.cacheService.deletePattern(keyPattern);

          this.logger.debug(`Invalidated cache for pattern: ${keyPattern}`);
        }
      })
    );
  }

  private isMutationMethod(httpMethod: string): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
      httpMethod.toUpperCase()
    );
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
