import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { FirebaseService } from '../../common/services/firebase.service';
import { CacheService } from '../../common/services/cache.service';
import {
  Claim,
  ClaimStatus,
  ClaimTopic,
  ClaimReference,
  ClaimVerificationResult,
  CreateClaimDto,
  UpdateClaimDto,
  BatchUpdateClaimsDto,
  IdentityAuditLog,
} from '../../common/types';

@Injectable()
export class ClaimsService {
  private readonly logger = new Logger(ClaimsService.name);
  private readonly COLLECTION_NAME = 'claims';
  private readonly CACHE_TTL = 1800; // 30 minutes
  private readonly CACHE_PREFIX = 'claim';

  constructor(
    private firebaseService: FirebaseService,
    private cacheService: CacheService
  ) {}

  async issueClaim(
    createClaimDto: CreateClaimDto,
    operatorId?: string
  ): Promise<Claim> {
    this.logger.log(
      `Issuing claim ${createClaimDto.claimTopic} for identity: ${createClaimDto.identityId}`
    );

    // Generate unique claim ID
    const claimId = this.generateClaimId();

    // Create claim data
    const claimData: Omit<Claim, 'id'> = {
      identityId: createClaimDto.identityId,
      claimTopic: createClaimDto.claimTopic,
      issuer: createClaimDto.issuer,
      data: createClaimDto.data,
      issuedAt: new Date(),
      expiresAt: createClaimDto.expiresAt
        ? new Date(createClaimDto.expiresAt)
        : undefined,
      status: ClaimStatus.ACTIVE,
      verificationHash:
        createClaimDto.verificationHash || this.generateVerificationHash(),
      updatedAt: new Date(),
    };

    // Save to Firestore
    await this.firebaseService.setDocument(
      this.COLLECTION_NAME,
      claimId,
      claimData
    );

    const claim: Claim = {
      id: claimId,
      ...claimData,
    };

    // Cache the claim
    await this.cacheClaim(claimId, claim);

    // Log audit event
    await this.logAuditEvent(
      'claim_issue',
      createClaimDto.identityId,
      operatorId,
      {
        claimId,
        claimTopic: createClaimDto.claimTopic,
        issuer: createClaimDto.issuer,
      }
    );

    this.logger.log(
      `Claim ${claimId} issued successfully for identity: ${createClaimDto.identityId}`
    );
    return claim;
  }

  async getClaim(claimId: string): Promise<Claim | null> {
    // Try cache first
    const cached = await this.getCachedClaim(claimId);
    if (cached) {
      return cached;
    }

    // Get from Firestore
    const doc = await this.firebaseService.getDocument(
      this.COLLECTION_NAME,
      claimId
    );

    if (!doc.exists) {
      return null;
    }

    const claim: Claim = {
      id: doc.id,
      ...doc.data(),
    } as Claim;

    // Cache the result
    await this.cacheClaim(claimId, claim);

    return claim;
  }

  async verifyClaim(claimId: string): Promise<ClaimVerificationResult> {
    this.logger.log(`Verifying claim: ${claimId}`);

    const claim = await this.getClaim(claimId);

    if (!claim) {
      return {
        isValid: false,
        reason: 'Claim not found',
      };
    }

    if (claim.status !== ClaimStatus.ACTIVE) {
      return {
        isValid: false,
        claim,
        reason: `Claim status is ${claim.status}`,
      };
    }

    // Check expiration
    if (claim.expiresAt && claim.expiresAt < new Date()) {
      // Auto-update expired claim status
      await this.updateClaimStatus(claimId, ClaimStatus.EXPIRED, 'system');

      return {
        isValid: false,
        claim: { ...claim, status: ClaimStatus.EXPIRED },
        reason: 'Claim has expired',
      };
    }

    // Calculate days until expiration
    let expiresIn: number | undefined;
    if (claim.expiresAt) {
      const msUntilExpiry = claim.expiresAt.getTime() - Date.now();
      expiresIn = Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24));
    }

    return {
      isValid: true,
      claim,
      expiresIn,
    };
  }

  async revokeClaim(
    claimId: string,
    reason: string,
    operatorId?: string
  ): Promise<Claim> {
    this.logger.log(`Revoking claim: ${claimId}`);

    const claim = await this.getClaim(claimId);
    if (!claim) {
      throw new NotFoundException(`Claim not found: ${claimId}`);
    }

    if (claim.status === ClaimStatus.REVOKED) {
      throw new ConflictException(`Claim already revoked: ${claimId}`);
    }

    const updateData: Partial<Claim> = {
      status: ClaimStatus.REVOKED,
      revocationReason: reason,
      updatedAt: new Date(),
    };

    // Update in Firestore
    await this.firebaseService.updateDocument(
      this.COLLECTION_NAME,
      claimId,
      updateData
    );

    // Update cached version
    const updatedClaim = { ...claim, ...updateData };
    await this.cacheClaim(claimId, updatedClaim);

    // Log audit event
    await this.logAuditEvent('claim_revoke', claim.identityId, operatorId, {
      claimId,
      claimTopic: claim.claimTopic,
      reason,
    });

    this.logger.log(`Claim ${claimId} revoked successfully`);
    return updatedClaim;
  }

  async getClaimsByIdentity(identityId: string): Promise<Claim[]> {
    const querySnapshot = await this.firebaseService.getDocumentsByField(
      this.COLLECTION_NAME,
      'identityId',
      identityId
    );

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Claim[];
  }

  async getClaimsByTopic(claimTopic: ClaimTopic): Promise<Claim[]> {
    const querySnapshot = await this.firebaseService.getDocumentsByField(
      this.COLLECTION_NAME,
      'claimTopic',
      claimTopic
    );

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Claim[];
  }

  async getClaimsByIssuer(issuer: string): Promise<Claim[]> {
    const querySnapshot = await this.firebaseService.getDocumentsByField(
      this.COLLECTION_NAME,
      'issuer',
      issuer
    );

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Claim[];
  }

  async getClaimsByStatus(status: ClaimStatus): Promise<Claim[]> {
    const querySnapshot = await this.firebaseService.getDocumentsByField(
      this.COLLECTION_NAME,
      'status',
      status
    );

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Claim[];
  }

  async renewClaim(
    claimId: string,
    newExpiry: Date,
    operatorId?: string
  ): Promise<Claim> {
    this.logger.log(`Renewing claim: ${claimId}`);

    const claim = await this.getClaim(claimId);
    if (!claim) {
      throw new NotFoundException(`Claim not found: ${claimId}`);
    }

    if (
      claim.status !== ClaimStatus.ACTIVE &&
      claim.status !== ClaimStatus.EXPIRED
    ) {
      throw new BadRequestException(
        `Cannot renew claim with status: ${claim.status}`
      );
    }

    const updateData: Partial<Claim> = {
      status: ClaimStatus.ACTIVE,
      expiresAt: newExpiry,
      updatedAt: new Date(),
      revocationReason: undefined, // Clear any previous revocation reason
    };

    // Update in Firestore
    await this.firebaseService.updateDocument(
      this.COLLECTION_NAME,
      claimId,
      updateData
    );

    // Update cached version
    const updatedClaim = { ...claim, ...updateData };
    await this.cacheClaim(claimId, updatedClaim);

    // Log audit event
    await this.logAuditEvent('claim_renew', claim.identityId, operatorId, {
      claimId,
      claimTopic: claim.claimTopic,
      newExpiry,
    });

    this.logger.log(`Claim ${claimId} renewed successfully`);
    return updatedClaim;
  }

  async bulkUpdateClaims(
    batchDto: BatchUpdateClaimsDto,
    operatorId?: string
  ): Promise<Claim[]> {
    this.logger.log(`Bulk updating ${batchDto.updates.length} claims`);

    const results: Claim[] = [];
    const errors: string[] = [];

    // Process updates sequentially to maintain data consistency
    for (const updateDto of batchDto.updates) {
      try {
        const updatedClaim = await this.updateClaim(updateDto, operatorId);
        results.push(updatedClaim);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${updateDto.claimId}: ${errorMessage}`);
      }
    }

    if (errors.length > 0) {
      this.logger.warn(
        `Bulk update completed with ${errors.length} errors: ${errors.join(', ')}`
      );
    }

    this.logger.log(
      `Bulk update completed: ${results.length} successful, ${errors.length} failed`
    );
    return results;
  }

  async verifyRequiredClaims(
    identityId: string,
    requiredClaims: ClaimTopic[]
  ): Promise<boolean> {
    const userClaims = await this.getClaimsByIdentity(identityId);
    const activeClaims = userClaims.filter(
      claim => claim.status === ClaimStatus.ACTIVE
    );

    // Check each required claim
    for (const requiredClaim of requiredClaims) {
      const userClaim = activeClaims.find(
        claim => claim.claimTopic === requiredClaim
      );

      if (!userClaim) {
        return false; // Missing required claim
      }

      // Check if claim is expired
      if (userClaim.expiresAt && userClaim.expiresAt < new Date()) {
        return false; // Expired claim
      }
    }

    return true;
  }

  async findExpiredClaims(): Promise<Claim[]> {
    // This would require a compound query in a real implementation
    // For now, get all active claims and filter client-side
    const activeClaims = await this.getClaimsByStatus(ClaimStatus.ACTIVE);
    const now = new Date();

    return activeClaims.filter(
      claim => claim.expiresAt && claim.expiresAt < now
    );
  }

  async convertToClaimReference(claim: Claim): Promise<ClaimReference> {
    return {
      claimId: claim.id,
      claimTopic: claim.claimTopic,
      issuedAt: claim.issuedAt,
      expiresAt: claim.expiresAt,
      status: claim.status,
    };
  }

  // Private helper methods
  private async updateClaim(
    updateDto: UpdateClaimDto,
    operatorId?: string
  ): Promise<Claim> {
    const claim = await this.getClaim(updateDto.claimId);
    if (!claim) {
      throw new NotFoundException(`Claim not found: ${updateDto.claimId}`);
    }

    const updateData: Partial<Claim> = {
      updatedAt: new Date(),
    };

    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    if (updateDto.expiresAt !== undefined) {
      updateData.expiresAt = new Date(updateDto.expiresAt);
    }

    if (updateDto.data !== undefined) {
      updateData.data = { ...claim.data, ...updateDto.data };
    }

    if (updateDto.revocationReason !== undefined) {
      updateData.revocationReason = updateDto.revocationReason;
    }

    // Update in Firestore
    await this.firebaseService.updateDocument(
      this.COLLECTION_NAME,
      updateDto.claimId,
      updateData
    );

    // Update cached version
    const updatedClaim = { ...claim, ...updateData };
    await this.cacheClaim(updateDto.claimId, updatedClaim);

    // Log audit event
    await this.logAuditEvent('claim_update', claim.identityId, operatorId, {
      claimId: updateDto.claimId,
      changes: updateData,
    });

    return updatedClaim;
  }

  private async updateClaimStatus(
    claimId: string,
    status: ClaimStatus,
    operatorId?: string
  ): Promise<void> {
    operatorId;

    await this.firebaseService.updateDocument(this.COLLECTION_NAME, claimId, {
      status,
      updatedAt: new Date(),
    });

    // Invalidate cache
    await this.invalidateClaimCache(claimId);
  }

  private generateClaimId(): string {
    return `claim_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateVerificationHash(): string {
    // Generate a mock verification hash
    return `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`;
  }

  // Cache methods
  private async cacheClaim(claimId: string, claim: Claim): Promise<void> {
    const key = `${this.CACHE_PREFIX}:${claimId}`;
    await this.cacheService.set(key, claim, { ttl: this.CACHE_TTL });
  }

  private async getCachedClaim(claimId: string): Promise<Claim | null> {
    const key = `${this.CACHE_PREFIX}:${claimId}`;
    return await this.cacheService.get<Claim>(key);
  }

  async invalidateClaimCache(claimId: string): Promise<void> {
    const key = `${this.CACHE_PREFIX}:${claimId}`;
    await this.cacheService.delete(key);
  }

  // Audit logging
  private async logAuditEvent(
    operation: string,
    identityId: string,
    _operatorId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const auditLog: Omit<IdentityAuditLog, 'id'> = {
        timestamp: new Date(),
        operation: operation as
          | 'register'
          | 'verify'
          | 'revoke'
          | 'claim_issue'
          | 'claim_revoke'
          | 'status_update',
        identityId,
        operatorId: _operatorId || 'system',
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
