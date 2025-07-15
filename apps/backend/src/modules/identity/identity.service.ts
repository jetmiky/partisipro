import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { FirebaseService } from '../../common/services/firebase.service';
import { CacheService } from '../../common/services/cache.service';
import { UsersService } from '../users/users.service';
import { RealBlockchainService } from '../blockchain/real-blockchain.service';
import {
  IdentityRegistry,
  IdentityStatus,
  ClaimTopic,
  ClaimReference,
  IdentityVerificationResult,
  CreateIdentityDto,
  UpdateIdentityStatusDto,
  BatchRegisterIdentitiesDto,
  IdentityAuditLog,
} from '../../common/types';

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);
  private readonly COLLECTION_NAME = 'identity_registry';
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'identity';

  constructor(
    private firebaseService: FirebaseService,
    private cacheService: CacheService,
    private usersService: UsersService,
    @Inject('BLOCKCHAIN_SERVICE')
    private blockchainService: RealBlockchainService
  ) {}

  async registerIdentity(
    userAddress: string,
    createIdentityDto: CreateIdentityDto,
    operatorId?: string
  ): Promise<IdentityRegistry> {
    this.logger.log(`Registering identity for address: ${userAddress}`);

    // Validate user exists
    const user = await this.usersService.findById(createIdentityDto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if identity already exists
    const existingIdentity = await this.getIdentity(userAddress);
    if (existingIdentity) {
      throw new ConflictException(
        `Identity already exists for address: ${userAddress}`
      );
    }

    // Validate user address matches DTO
    if (userAddress !== createIdentityDto.userAddress) {
      throw new BadRequestException('User address mismatch');
    }

    // Create identity data
    const identityData: Omit<IdentityRegistry, 'id'> = {
      userId: createIdentityDto.userId,
      identityKey: createIdentityDto.identityKey || this.generateIdentityKey(),
      status: IdentityStatus.PENDING,
      claims: [],
      trustedIssuers: [],
      createdAt: new Date(),
      lastUpdated: new Date(),
      metadata: createIdentityDto.metadata || {},
    };

    // Save to Firestore with wallet address as document ID
    await this.firebaseService.setDocument(
      this.COLLECTION_NAME,
      userAddress,
      identityData
    );

    const identity: IdentityRegistry = {
      id: userAddress,
      ...identityData,
    };

    // Cache the identity
    await this.cacheIdentity(userAddress, identity);

    // Log audit event
    await this.logAuditEvent('register', userAddress, operatorId, {
      userId: createIdentityDto.userId,
      metadata: createIdentityDto.metadata,
    });

    this.logger.log(
      `Identity registered successfully for address: ${userAddress}`
    );
    return identity;
  }

  /**
   * Register identity on blockchain (new method)
   */
  async registerIdentityOnChain(
    userAddress: string,
    identityAddress: string,
    country: number = 360 // Indonesia country code
  ): Promise<void> {
    this.logger.log(
      `Registering identity on blockchain for address: ${userAddress}`
    );

    try {
      // Call blockchain service to register identity
      // Note: Using existing method name from RealBlockchainService
      const transaction = await this.blockchainService.deployContract(
        {
          projectId: `identity-${userAddress}`,
          contractType: 'identity',
          parameters: [userAddress, identityAddress, country],
        },
        userAddress
      );

      // Update local identity record with blockchain transaction
      await this.updateIdentityBlockchainInfo(userAddress, {
        blockchainTransactionHash: transaction.transactionHash,
        blockchainStatus: 'pending',
        blockchainRegisteredAt: new Date(),
      });

      this.logger.log(
        `Identity registration transaction submitted: ${transaction.transactionHash}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to register identity on blockchain: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Check if identity is verified on blockchain
   */
  async isIdentityVerifiedOnChain(userAddress: string): Promise<boolean> {
    try {
      // Use existing method from RealBlockchainService
      return await this.blockchainService.isInvestorVerified(userAddress);
    } catch (error) {
      this.logger.error(
        `Error checking blockchain identity verification: ${error.message}`
      );
      return false;
    }
  }

  /**
   * Get identity address from blockchain
   */
  async getIdentityAddressFromChain(
    userAddress: string
  ): Promise<string | null> {
    try {
      // For now, return mock identity address as this method isn't implemented yet
      this.logger.warn(
        'getUserIdentity not implemented - returning mock address'
      );
      return `identity-${userAddress}`;
    } catch (error) {
      this.logger.error(
        `Error getting identity address from blockchain: ${error.message}`
      );
      return null;
    }
  }

  /**
   * Update identity with blockchain information
   */
  async updateIdentityBlockchainInfo(
    userAddress: string,
    blockchainInfo: {
      blockchainTransactionHash?: string;
      blockchainStatus?: 'pending' | 'confirmed' | 'failed';
      blockchainRegisteredAt?: Date;
    }
  ): Promise<void> {
    await this.firebaseService.updateDocument(
      this.COLLECTION_NAME,
      userAddress,
      {
        ...blockchainInfo,
        lastUpdated: new Date(),
      }
    );

    // Invalidate cache
    await this.invalidateIdentityCache(userAddress);
  }

  async getIdentity(userAddress: string): Promise<IdentityRegistry | null> {
    // Try cache first
    const cached = await this.getCachedIdentity(userAddress);
    if (cached) {
      return cached;
    }

    // Get from Firestore
    const doc = await this.firebaseService.getDocument(
      this.COLLECTION_NAME,
      userAddress
    );

    if (!doc.exists) {
      return null;
    }

    const identity: IdentityRegistry = {
      id: doc.id,
      ...doc.data(),
    } as IdentityRegistry;

    // Cache the result
    await this.cacheIdentity(userAddress, identity);

    return identity;
  }

  async verifyIdentity(
    userAddress: string,
    requiredClaims?: ClaimTopic[]
  ): Promise<IdentityVerificationResult> {
    this.logger.log(`Verifying identity for address: ${userAddress}`);

    const identity = await this.getIdentity(userAddress);

    if (!identity) {
      return {
        isVerified: false,
        reason: 'Identity not found',
      };
    }

    if (identity.status !== IdentityStatus.VERIFIED) {
      return {
        isVerified: false,
        identity,
        reason: `Identity status is ${identity.status}`,
      };
    }

    // Check required claims if specified
    if (requiredClaims && requiredClaims.length > 0) {
      const { missingClaims, expiredClaims } = this.checkRequiredClaims(
        identity.claims,
        requiredClaims
      );

      if (missingClaims.length > 0 || expiredClaims.length > 0) {
        return {
          isVerified: false,
          identity,
          missingClaims,
          expiredClaims,
          reason: 'Required claims missing or expired',
        };
      }
    }

    return {
      isVerified: true,
      identity,
    };
  }

  async updateIdentityStatus(
    userAddress: string,
    updateDto: UpdateIdentityStatusDto,
    operatorId?: string
  ): Promise<IdentityRegistry> {
    this.logger.log(
      `Updating identity status for address: ${userAddress} to ${updateDto.status}`
    );

    const identity = await this.getIdentity(userAddress);
    if (!identity) {
      throw new NotFoundException(
        `Identity not found for address: ${userAddress}`
      );
    }

    const updateData: Partial<IdentityRegistry> = {
      status: updateDto.status,
      lastUpdated: new Date(),
    };

    // Set verification timestamp if status is verified
    if (updateDto.status === IdentityStatus.VERIFIED) {
      updateData.verifiedAt = new Date();
    }

    // Update in Firestore
    await this.firebaseService.updateDocument(
      this.COLLECTION_NAME,
      userAddress,
      updateData
    );

    // Update cached version
    const updatedIdentity = { ...identity, ...updateData };
    await this.cacheIdentity(userAddress, updatedIdentity);

    // Log audit event
    await this.logAuditEvent('status_update', userAddress, operatorId, {
      oldStatus: identity.status,
      newStatus: updateDto.status,
      reason: updateDto.reason,
    });

    this.logger.log(
      `Identity status updated successfully for address: ${userAddress}`
    );
    return updatedIdentity;
  }

  async batchRegisterIdentities(
    batchDto: BatchRegisterIdentitiesDto,
    operatorId?: string
  ): Promise<IdentityRegistry[]> {
    this.logger.log(
      `Batch registering ${batchDto.identities.length} identities`
    );

    const results: IdentityRegistry[] = [];
    const errors: string[] = [];

    // Process in smaller batches to avoid timeout
    const BATCH_SIZE = 50;
    for (let i = 0; i < batchDto.identities.length; i += BATCH_SIZE) {
      const batch = batchDto.identities.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async identityDto => {
        try {
          const identity = await this.registerIdentity(
            identityDto.userAddress,
            identityDto,
            operatorId
          );
          results.push(identity);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${identityDto.userAddress}: ${errorMessage}`);
        }
      });

      await Promise.all(batchPromises);
    }

    if (errors.length > 0) {
      this.logger.warn(
        `Batch registration completed with ${errors.length} errors: ${errors.join(', ')}`
      );
    }

    this.logger.log(
      `Batch registration completed: ${results.length} successful, ${errors.length} failed`
    );
    return results;
  }

  async addClaimToIdentity(
    userAddress: string,
    claimReference: ClaimReference,
    operatorId?: string
  ): Promise<void> {
    this.logger.log(
      `Adding claim ${claimReference.claimTopic} to identity: ${userAddress}`
    );

    const identity = await this.getIdentity(userAddress);
    if (!identity) {
      throw new NotFoundException(
        `Identity not found for address: ${userAddress}`
      );
    }

    // Remove existing claim of same topic (replace pattern)
    const updatedClaims = identity.claims.filter(
      claim => claim.claimTopic !== claimReference.claimTopic
    );
    updatedClaims.push(claimReference);

    // Update in Firestore
    await this.firebaseService.updateDocument(
      this.COLLECTION_NAME,
      userAddress,
      {
        claims: updatedClaims,
        lastUpdated: new Date(),
      }
    );

    // Update cache
    identity.claims = updatedClaims;
    identity.lastUpdated = new Date();
    await this.cacheIdentity(userAddress, identity);

    // Log audit event
    await this.logAuditEvent('claim_add', userAddress, operatorId, {
      claimTopic: claimReference.claimTopic,
      claimId: claimReference.claimId,
    });
  }

  async removeClaimFromIdentity(
    userAddress: string,
    claimTopic: ClaimTopic,
    operatorId?: string
  ): Promise<void> {
    this.logger.log(
      `Removing claim ${claimTopic} from identity: ${userAddress}`
    );

    const identity = await this.getIdentity(userAddress);
    if (!identity) {
      throw new NotFoundException(
        `Identity not found for address: ${userAddress}`
      );
    }

    const updatedClaims = identity.claims.filter(
      claim => claim.claimTopic !== claimTopic
    );

    // Update in Firestore
    await this.firebaseService.updateDocument(
      this.COLLECTION_NAME,
      userAddress,
      {
        claims: updatedClaims,
        lastUpdated: new Date(),
      }
    );

    // Update cache
    identity.claims = updatedClaims;
    identity.lastUpdated = new Date();
    await this.cacheIdentity(userAddress, identity);

    // Log audit event
    await this.logAuditEvent('claim_remove', userAddress, operatorId, {
      claimTopic,
    });
  }

  async getIdentitiesByStatus(
    status: IdentityStatus
  ): Promise<IdentityRegistry[]> {
    const querySnapshot = await this.firebaseService.getDocumentsByField(
      this.COLLECTION_NAME,
      'status',
      status
    );

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as IdentityRegistry[];
  }

  async findIdentitiesByUserId(userId: string): Promise<IdentityRegistry[]> {
    const querySnapshot = await this.firebaseService.getDocumentsByField(
      this.COLLECTION_NAME,
      'userId',
      userId
    );

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as IdentityRegistry[];
  }

  // Private helper methods
  private generateIdentityKey(): string {
    // Generate a unique identity key
    return `identity_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private checkRequiredClaims(
    userClaims: ClaimReference[],
    requiredClaims: ClaimTopic[]
  ): { missingClaims: ClaimTopic[]; expiredClaims: ClaimReference[] } {
    const now = new Date();
    const missingClaims: ClaimTopic[] = [];
    const expiredClaims: ClaimReference[] = [];

    for (const requiredClaim of requiredClaims) {
      const userClaim = userClaims.find(
        claim => claim.claimTopic === requiredClaim
      );

      if (!userClaim) {
        missingClaims.push(requiredClaim);
      } else if (userClaim.expiresAt && userClaim.expiresAt < now) {
        expiredClaims.push(userClaim);
      }
    }

    return { missingClaims, expiredClaims };
  }

  // Cache methods
  private async cacheIdentity(
    userAddress: string,
    identity: IdentityRegistry
  ): Promise<void> {
    const key = `${this.CACHE_PREFIX}:${userAddress}`;
    await this.cacheService.set(key, identity, { ttl: this.CACHE_TTL });
  }

  private async getCachedIdentity(
    userAddress: string
  ): Promise<IdentityRegistry | null> {
    const key = `${this.CACHE_PREFIX}:${userAddress}`;
    return await this.cacheService.get<IdentityRegistry>(key);
  }

  async invalidateIdentityCache(userAddress: string): Promise<void> {
    const key = `${this.CACHE_PREFIX}:${userAddress}`;
    await this.cacheService.delete(key);
  }

  // Audit logging
  private async logAuditEvent(
    operation: string,
    userAddress: string,
    operatorId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const auditLog: Omit<IdentityAuditLog, 'id'> = {
        timestamp: new Date(),
        operation: operation as IdentityAuditLog['operation'],
        identityId: userAddress,
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
