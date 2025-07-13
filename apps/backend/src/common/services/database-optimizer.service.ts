import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { CacheService } from './cache.service';

export interface QueryPerformanceMetrics {
  queryType: string;
  executionTime: number;
  documentsRead: number;
  cacheHit: boolean;
  timestamp: Date;
}

export interface BatchOperation<T> {
  operation: 'create' | 'update' | 'delete';
  collection: string;
  documentId?: string;
  data?: T;
}

@Injectable()
export class DatabaseOptimizerService {
  private readonly logger = new Logger(DatabaseOptimizerService.name);
  private performanceMetrics: QueryPerformanceMetrics[] = [];
  private readonly BATCH_SIZE = 500; // Firestore batch limit
  private readonly METRICS_RETENTION_DAYS = 7;

  constructor(
    private firebaseService: FirebaseService,
    private cacheService: CacheService
  ) {
    // Cleanup old metrics periodically
    this.cleanupOldMetrics();
  }

  /**
   * Execute optimized query with performance tracking
   */
  async executeOptimizedQuery<T>(
    queryName: string,
    queryFunction: () => Promise<T>,
    cacheKey?: string,
    cacheTtl?: number
  ): Promise<T> {
    const startTime = Date.now();
    let cacheHit = false;
    let result: T;

    try {
      if (cacheKey) {
        // Try cache first
        const cachedResult = await this.cacheService.get<T>(cacheKey);
        if (cachedResult !== null) {
          cacheHit = true;
          result = cachedResult;
        } else {
          // Execute query and cache result
          result = await queryFunction();
          if (cacheTtl) {
            await this.cacheService.set(cacheKey, result, { ttl: cacheTtl });
          }
        }
      } else {
        result = await queryFunction();
      }

      // Record performance metrics
      const executionTime = Date.now() - startTime;
      this.recordPerformanceMetric({
        queryType: queryName,
        executionTime,
        documentsRead: this.estimateDocumentsRead(result),
        cacheHit,
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      this.logger.error(`Query optimization error for ${queryName}:`, error);
      throw error;
    }
  }

  /**
   * Execute batch operations efficiently
   */
  async executeBatchOperations<T>(
    operations: BatchOperation<T>[]
  ): Promise<void> {
    if (operations.length === 0) return;

    const batches = this.chunkArray(operations, this.BATCH_SIZE);

    for (const batch of batches) {
      try {
        const firestoreBatch = this.firebaseService.getBatch();

        for (const operation of batch) {
          const docRef = operation.documentId
            ? this.firebaseService.getDocumentReference(
                operation.collection,
                operation.documentId
              )
            : this.firebaseService.getNewDocumentReference(
                operation.collection
              );

          switch (operation.operation) {
            case 'create':
              firestoreBatch.set(docRef, operation.data);
              break;
            case 'update':
              if (operation.data) {
                firestoreBatch.update(docRef, operation.data as any);
              }
              break;
            case 'delete':
              firestoreBatch.delete(docRef);
              break;
          }
        }

        await firestoreBatch.commit();
        this.logger.debug(`Executed batch of ${batch.length} operations`);
      } catch (error) {
        this.logger.error(`Batch operation failed:`, error);
        throw error;
      }
    }
  }

  /**
   * Optimize pagination with cursor-based approach
   */
  async paginateQuery<T>(
    collection: string,
    queryBuilder: (
      ref: FirebaseFirestore.CollectionReference
    ) => FirebaseFirestore.Query,
    pageSize: number = 20,
    startAfterDoc?: FirebaseFirestore.DocumentSnapshot
  ): Promise<{
    documents: T[];
    hasMore: boolean;
    lastDoc?: FirebaseFirestore.DocumentSnapshot;
  }> {
    try {
      const collectionRef = this.firebaseService.getCollection(collection);
      let query = queryBuilder(collectionRef).limit(pageSize + 1); // Get one extra to check if there are more

      if (startAfterDoc) {
        query = query.startAfter(startAfterDoc);
      }

      const snapshot = await query.get();
      const documents = snapshot.docs.slice(0, pageSize).map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as T
      );

      const hasMore = snapshot.docs.length > pageSize;
      const lastDoc =
        documents.length > 0 ? snapshot.docs[pageSize - 1] : undefined;

      return {
        documents,
        hasMore,
        lastDoc,
      };
    } catch (error) {
      this.logger.error(
        `Pagination error for collection ${collection}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Bulk read operations with caching
   */
  async bulkRead<T>(
    collection: string,
    documentIds: string[],
    cachePrefix?: string
  ): Promise<Map<string, T | null>> {
    const result = new Map<string, T | null>();
    const uncachedIds: string[] = [];

    // Check cache first if prefix provided
    if (cachePrefix) {
      const cacheKeys = documentIds.map(id => `${cachePrefix}:${id}`);
      const cachedResults = await this.cacheService.mget<T>(cacheKeys);

      documentIds.forEach((id, index) => {
        if (cachedResults[index] !== null) {
          result.set(id, cachedResults[index]);
        } else {
          uncachedIds.push(id);
        }
      });
    } else {
      uncachedIds.push(...documentIds);
    }

    // Fetch uncached documents
    if (uncachedIds.length > 0) {
      const chunks = this.chunkArray(uncachedIds, 10); // Firestore 'in' query limit

      for (const chunk of chunks) {
        const snapshot = await this.firebaseService.getDocumentsByIds(
          collection,
          chunk
        );

        const cacheData: Array<{ key: string; value: T; ttl?: number }> = [];

        snapshot.docs.forEach(doc => {
          const data = doc.exists ? (doc.data() as T) : null;
          result.set(doc.id, data);

          if (cachePrefix && data) {
            cacheData.push({
              key: `${cachePrefix}:${doc.id}`,
              value: data,
              ttl: 1800, // 30 minutes
            });
          }
        });

        // Cache the results
        if (cacheData.length > 0) {
          await this.cacheService.mset(cacheData);
        }
      }
    }

    return result;
  }

  /**
   * Get performance analytics
   */
  getPerformanceAnalytics(): {
    averageExecutionTime: number;
    cacheHitRate: number;
    slowestQueries: QueryPerformanceMetrics[];
    totalQueries: number;
  } {
    if (this.performanceMetrics.length === 0) {
      return {
        averageExecutionTime: 0,
        cacheHitRate: 0,
        slowestQueries: [],
        totalQueries: 0,
      };
    }

    const totalExecutionTime = this.performanceMetrics.reduce(
      (sum, metric) => sum + metric.executionTime,
      0
    );
    const cacheHits = this.performanceMetrics.filter(
      metric => metric.cacheHit
    ).length;
    const slowestQueries = [...this.performanceMetrics]
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);

    return {
      averageExecutionTime: totalExecutionTime / this.performanceMetrics.length,
      cacheHitRate: (cacheHits / this.performanceMetrics.length) * 100,
      slowestQueries,
      totalQueries: this.performanceMetrics.length,
    };
  }

  /**
   * Warm up frequently accessed data
   */
  async warmUpCaches(): Promise<void> {
    try {
      this.logger.log('Starting cache warm-up...');

      // Warm up active projects
      const activeProjectsQuery = (
        ref: FirebaseFirestore.CollectionReference
      ) => ref.where('status', '==', 'active').limit(50);

      const activeProjects = await this.paginateQuery(
        'projects',
        activeProjectsQuery,
        50
      );

      if (activeProjects.documents.length > 0) {
        const cacheData = activeProjects.documents.map((project: any) => ({
          key: `project:details:${project.id}`,
          value: project,
          ttl: 1800, // 30 minutes
        }));

        await this.cacheService.mset(cacheData);
        this.logger.log(`Warmed up ${cacheData.length} active projects`);
      }

      // Warm up platform analytics
      await this.cacheService.set(
        'platform:analytics',
        await this.generatePlatformAnalytics(),
        { ttl: 3600 } // 1 hour
      );

      this.logger.log('Cache warm-up completed');
    } catch (error) {
      this.logger.error('Cache warm-up failed:', error);
    }
  }

  /**
   * Clean up old performance metrics
   */
  private cleanupOldMetrics(): void {
    setInterval(
      () => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.METRICS_RETENTION_DAYS);

        this.performanceMetrics = this.performanceMetrics.filter(
          metric => metric.timestamp > cutoffDate
        );
      },
      24 * 60 * 60 * 1000
    ); // Run daily
  }

  /**
   * Record performance metric
   */
  private recordPerformanceMetric(metric: QueryPerformanceMetrics): void {
    this.performanceMetrics.push(metric);

    // Log slow queries
    if (metric.executionTime > 1000) {
      // 1 second threshold
      this.logger.warn(
        `Slow query detected: ${metric.queryType} took ${metric.executionTime}ms`
      );
    }
  }

  /**
   * Estimate documents read from result
   */
  private estimateDocumentsRead<T>(result: T): number {
    if (Array.isArray(result)) {
      return result.length;
    }
    return result ? 1 : 0;
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Generate platform analytics
   */
  private async generatePlatformAnalytics(): Promise<any> {
    try {
      // This would typically fetch real analytics data
      // For now, return basic metrics structure
      return {
        totalProjects: 0,
        activeProjects: 0,
        totalInvestments: 0,
        totalUsers: 0,
        totalInvestmentVolume: 0,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to generate platform analytics:', error);
      return null;
    }
  }
}
