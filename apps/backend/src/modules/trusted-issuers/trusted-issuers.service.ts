import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseService } from '../../common/services/firebase.service';
import { CacheService } from '../../common/services/cache.service';
import {
  TrustedIssuer,
  IssuerStatus,
  ClaimTopic,
  CreateTrustedIssuerDto,
  UpdateTrustedIssuerDto,
  IdentityAuditLog,
} from '../../common/types';

@Injectable()
export class TrustedIssuersService {
  private readonly logger = new Logger(TrustedIssuersService.name);
  private readonly COLLECTION_NAME = 'trusted_issuers';
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'trusted_issuer';

  constructor(
    private firebaseService: FirebaseService,
    private cacheService: CacheService
  ) {}

  async addTrustedIssuer(
    createDto: CreateTrustedIssuerDto,
    operatorId?: string
  ): Promise<TrustedIssuer> {
    this.logger.log(`Adding trusted issuer: ${createDto.issuerAddress}`);

    // Check if issuer already exists
    const existing = await this.getTrustedIssuer(createDto.issuerAddress);
    if (existing) {
      throw new ConflictException(
        `Trusted issuer already exists: ${createDto.issuerAddress}`
      );
    }

    // Create issuer data
    const issuerData: Omit<TrustedIssuer, 'id'> = {
      name: createDto.name,
      authorizedClaims: createDto.authorizedClaims,
      status: IssuerStatus.ACTIVE,
      registeredAt: new Date(),
      lastActivity: new Date(),
      metadata: createDto.metadata,
      issuedClaimsCount: 0,
      activeClaimsCount: 0,
    };

    // Save to Firestore with issuer address as document ID
    await this.firebaseService.setDocument(
      this.COLLECTION_NAME,
      createDto.issuerAddress,
      issuerData
    );

    const trustedIssuer: TrustedIssuer = {
      id: createDto.issuerAddress,
      ...issuerData,
    };

    // Cache the issuer
    await this.cacheTrustedIssuer(createDto.issuerAddress, trustedIssuer);

    // Log audit event
    await this.logAuditEvent(
      'trusted_issuer_add',
      createDto.issuerAddress,
      operatorId,
      {
        name: createDto.name,
        authorizedClaims: createDto.authorizedClaims,
      }
    );

    this.logger.log(
      `Trusted issuer added successfully: ${createDto.issuerAddress}`
    );
    return trustedIssuer;
  }

  async getTrustedIssuer(issuerAddress: string): Promise<TrustedIssuer | null> {
    // Try cache first
    const cached = await this.getCachedTrustedIssuer(issuerAddress);
    if (cached) {
      return cached;
    }

    // Get from Firestore
    const doc = await this.firebaseService.getDocument(
      this.COLLECTION_NAME,
      issuerAddress
    );

    if (!doc.exists) {
      return null;
    }

    const trustedIssuer: TrustedIssuer = {
      id: doc.id,
      ...doc.data(),
    } as TrustedIssuer;

    // Cache the result
    await this.cacheTrustedIssuer(issuerAddress, trustedIssuer);

    return trustedIssuer;
  }

  async updateTrustedIssuer(
    issuerAddress: string,
    updateDto: UpdateTrustedIssuerDto,
    operatorId?: string
  ): Promise<TrustedIssuer> {
    this.logger.log(`Updating trusted issuer: ${issuerAddress}`);

    const issuer = await this.getTrustedIssuer(issuerAddress);
    if (!issuer) {
      throw new NotFoundException(`Trusted issuer not found: ${issuerAddress}`);
    }

    const updateData: Partial<TrustedIssuer> = {
      lastActivity: new Date(),
    };

    if (updateDto.name !== undefined) {
      updateData.name = updateDto.name;
    }

    if (updateDto.authorizedClaims !== undefined) {
      updateData.authorizedClaims = updateDto.authorizedClaims;
    }

    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    if (updateDto.metadata !== undefined) {
      updateData.metadata = { ...issuer.metadata, ...updateDto.metadata };
    }

    // Update in Firestore
    await this.firebaseService.updateDocument(
      this.COLLECTION_NAME,
      issuerAddress,
      updateData
    );

    // Update cached version
    const updatedIssuer = { ...issuer, ...updateData };
    await this.cacheTrustedIssuer(issuerAddress, updatedIssuer);

    // Log audit event
    await this.logAuditEvent(
      'trusted_issuer_update',
      issuerAddress,
      operatorId,
      {
        changes: updateData,
      }
    );

    this.logger.log(`Trusted issuer updated successfully: ${issuerAddress}`);
    return updatedIssuer;
  }

  async removeTrustedIssuer(
    issuerAddress: string,
    operatorId?: string
  ): Promise<void> {
    this.logger.log(`Removing trusted issuer: ${issuerAddress}`);

    const issuer = await this.getTrustedIssuer(issuerAddress);
    if (!issuer) {
      throw new NotFoundException(`Trusted issuer not found: ${issuerAddress}`);
    }

    // Instead of deleting, mark as revoked
    await this.updateTrustedIssuer(
      issuerAddress,
      { status: IssuerStatus.REVOKED },
      operatorId
    );

    // Log audit event
    await this.logAuditEvent(
      'trusted_issuer_remove',
      issuerAddress,
      operatorId,
      {
        name: issuer.name,
      }
    );

    this.logger.log(`Trusted issuer removed successfully: ${issuerAddress}`);
  }

  async isTrustedIssuer(
    issuerAddress: string,
    claimTopic?: ClaimTopic
  ): Promise<boolean> {
    const issuer = await this.getTrustedIssuer(issuerAddress);

    if (!issuer || issuer.status !== IssuerStatus.ACTIVE) {
      return false;
    }

    // If specific claim topic is provided, check authorization
    if (claimTopic && !issuer.authorizedClaims.includes(claimTopic)) {
      return false;
    }

    return true;
  }

  async getAuthorizedClaims(issuerAddress: string): Promise<ClaimTopic[]> {
    const issuer = await this.getTrustedIssuer(issuerAddress);

    if (!issuer || issuer.status !== IssuerStatus.ACTIVE) {
      return [];
    }

    return issuer.authorizedClaims;
  }

  async getAllTrustedIssuers(): Promise<TrustedIssuer[]> {
    const collection = this.firebaseService.getCollection(this.COLLECTION_NAME);
    const querySnapshot = await collection.get();

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as TrustedIssuer[];
  }

  async getTrustedIssuersByStatus(
    status: IssuerStatus
  ): Promise<TrustedIssuer[]> {
    const querySnapshot = await this.firebaseService.getDocumentsByField(
      this.COLLECTION_NAME,
      'status',
      status
    );

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as TrustedIssuer[];
  }

  async getTrustedIssuersByClaimTopic(
    claimTopic: ClaimTopic
  ): Promise<TrustedIssuer[]> {
    // Note: This would require a proper array-contains query in production
    const allIssuers = await this.getAllTrustedIssuers();

    return allIssuers.filter(
      issuer =>
        issuer.status === IssuerStatus.ACTIVE &&
        issuer.authorizedClaims.includes(claimTopic)
    );
  }

  async updateIssuerStats(
    issuerAddress: string,
    issuedClaimsIncrement: number = 0,
    activeClaimsIncrement: number = 0
  ): Promise<void> {
    const issuer = await this.getTrustedIssuer(issuerAddress);
    if (!issuer) {
      return;
    }

    const updateData = {
      issuedClaimsCount: Math.max(
        0,
        issuer.issuedClaimsCount + issuedClaimsIncrement
      ),
      activeClaimsCount: Math.max(
        0,
        issuer.activeClaimsCount + activeClaimsIncrement
      ),
      lastActivity: new Date(),
    };

    await this.firebaseService.updateDocument(
      this.COLLECTION_NAME,
      issuerAddress,
      updateData
    );

    // Update cache
    const updatedIssuer = { ...issuer, ...updateData };
    await this.cacheTrustedIssuer(issuerAddress, updatedIssuer);
  }

  // Cache methods
  private async cacheTrustedIssuer(
    issuerAddress: string,
    issuer: TrustedIssuer
  ): Promise<void> {
    const key = `${this.CACHE_PREFIX}:${issuerAddress}`;
    await this.cacheService.set(key, issuer, { ttl: this.CACHE_TTL });
  }

  private async getCachedTrustedIssuer(
    issuerAddress: string
  ): Promise<TrustedIssuer | null> {
    const key = `${this.CACHE_PREFIX}:${issuerAddress}`;
    return await this.cacheService.get<TrustedIssuer>(key);
  }

  async invalidateTrustedIssuerCache(issuerAddress: string): Promise<void> {
    const key = `${this.CACHE_PREFIX}:${issuerAddress}`;
    await this.cacheService.delete(key);
  }

  // Audit logging
  private async logAuditEvent(
    operation: string,
    issuerAddress: string,
    operatorId?: string,
    metadata?: any
  ): Promise<void> {
    try {
      const auditLog: Omit<IdentityAuditLog, 'id'> = {
        timestamp: new Date(),
        operation: operation as any,
        identityId: issuerAddress, // Using issuer address as identity ID for audit
        operatorId: operatorId || 'system',
        changes: metadata || {},
      };

      await this.firebaseService.addDocument('identity_audit_logs', auditLog);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to log audit event: ${errorMessage}`,
        errorStack
      );
    }
  }
}
