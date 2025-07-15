import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';
import {
  Web3AuthService,
  Web3AuthTokenPayload,
} from '../../modules/auth/web3auth.service';
import { FirebaseService } from './firebase.service';

export interface CustomClaims {
  role: 'investor' | 'spv' | 'admin';
  identity_verified: boolean;
  kyc_approved: boolean;
  wallet_address: string;
  permissions: string[];
}

export interface FirebaseAuthResult {
  firebaseToken: string;
  customClaims: CustomClaims;
  user: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    emailVerified: boolean;
    metadata: {
      creationTime: string;
      lastSignInTime?: string;
    };
  };
}

@Injectable()
export class FirebaseAuthService {
  private readonly logger = new Logger(FirebaseAuthService.name);
  private auth: admin.auth.Auth;

  constructor(
    private configService: ConfigService,
    private web3AuthService: Web3AuthService,
    private firebaseService: FirebaseService
  ) {
    this.auth = admin.auth();
  }

  /**
   * Create or update Firebase user with Web3Auth data
   */
  async createOrUpdateFirebaseUser(
    web3AuthPayload: Web3AuthTokenPayload,
    additionalClaims: Partial<CustomClaims> = {}
  ): Promise<FirebaseAuthResult> {
    try {
      const uid = this.generateFirebaseUid(web3AuthPayload.sub);

      // Check if user exists
      let firebaseUser: admin.auth.UserRecord;
      try {
        firebaseUser = await this.auth.getUser(uid);
        this.logger.log(`Firebase user exists: ${uid}`);
      } catch (error) {
        // User doesn't exist, create new one
        firebaseUser = await this.auth.createUser({
          uid,
          email: web3AuthPayload.email,
          displayName: web3AuthPayload.name,
          emailVerified: true, // Web3Auth handles email verification
        });
        this.logger.log(`Created new Firebase user: ${uid}`);
      }

      // Update user if needed
      if (
        firebaseUser.email !== web3AuthPayload.email ||
        firebaseUser.displayName !== web3AuthPayload.name
      ) {
        await this.auth.updateUser(uid, {
          email: web3AuthPayload.email,
          displayName: web3AuthPayload.name,
        });
        this.logger.log(`Updated Firebase user: ${uid}`);
      }

      // Get user role from database
      const userRole = await this.getUserRole(uid);

      // Generate custom claims
      const customClaims: CustomClaims = {
        role: userRole,
        identity_verified: additionalClaims.identity_verified || false,
        kyc_approved: additionalClaims.kyc_approved || false,
        wallet_address: web3AuthPayload.walletAddress || '',
        permissions: this.getPermissionsForRole(userRole),
      };

      // Set custom claims
      await this.auth.setCustomUserClaims(uid, customClaims);
      this.logger.log(`Set custom claims for user: ${uid}`);

      // Generate custom token
      const firebaseToken = await this.auth.createCustomToken(
        uid,
        customClaims
      );

      return {
        firebaseToken,
        customClaims,
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          metadata: {
            creationTime: firebaseUser.metadata.creationTime,
            lastSignInTime: firebaseUser.metadata.lastSignInTime,
          },
        },
      };
    } catch (error) {
      this.logger.error('Failed to create or update Firebase user', error);
      throw new UnauthorizedException('Firebase user creation failed');
    }
  }

  /**
   * Authenticate with Web3Auth and get Firebase token
   */
  async authenticateWithWeb3Auth(
    web3AuthIdToken: string
  ): Promise<FirebaseAuthResult> {
    try {
      // Verify Web3Auth token
      const web3AuthPayload =
        await this.web3AuthService.verifyIdToken(web3AuthIdToken);

      // Get additional user claims from database
      const additionalClaims = await this.getAdditionalUserClaims(
        web3AuthPayload.sub
      );

      // Create or update Firebase user
      const result = await this.createOrUpdateFirebaseUser(
        web3AuthPayload,
        additionalClaims
      );

      // Update last login in database
      await this.updateLastLogin(result.user.uid);

      return result;
    } catch (error) {
      this.logger.error('Web3Auth authentication failed', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Verify Firebase ID token
   */
  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    try {
      const decodedToken = await this.auth.verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      this.logger.error('Firebase ID token verification failed', error);
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  /**
   * Update user custom claims
   */
  async updateCustomClaims(
    uid: string,
    claims: Partial<CustomClaims>
  ): Promise<void> {
    try {
      // Get current claims
      const user = await this.auth.getUser(uid);
      const currentClaims = (user.customClaims || {}) as CustomClaims;

      // Merge with new claims
      const updatedClaims: CustomClaims = {
        ...currentClaims,
        ...claims,
      };

      // Update permissions if role changed
      if (claims.role) {
        updatedClaims.permissions = this.getPermissionsForRole(claims.role);
      }

      await this.auth.setCustomUserClaims(uid, updatedClaims);
      this.logger.log(`Updated custom claims for user: ${uid}`);
    } catch (error) {
      this.logger.error(
        `Failed to update custom claims for user: ${uid}`,
        error
      );
      throw error;
    }
  }

  /**
   * Update user identity verification status
   */
  async updateIdentityVerification(
    uid: string,
    verified: boolean,
    kycApproved: boolean
  ): Promise<void> {
    try {
      await this.updateCustomClaims(uid, {
        identity_verified: verified,
        kyc_approved: kycApproved,
      });

      // Update in database as well
      await this.firebaseService.updateDocument('users', uid, {
        'kyc.status': kycApproved ? 'approved' : 'pending',
        'kyc.verificationDate': verified
          ? this.firebaseService.getTimestamp()
          : null,
        updatedAt: this.firebaseService.getTimestamp(),
      });

      this.logger.log(`Updated identity verification for user: ${uid}`);
    } catch (error) {
      this.logger.error(
        `Failed to update identity verification for user: ${uid}`,
        error
      );
      throw error;
    }
  }

  /**
   * Get user by UID
   */
  async getUser(uid: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.auth.getUser(uid);
    } catch (error) {
      this.logger.error(`Failed to get user: ${uid}`, error);
      throw new UnauthorizedException('User not found');
    }
  }

  /**
   * Delete user
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      await this.auth.deleteUser(uid);
      this.logger.log(`Deleted user: ${uid}`);
    } catch (error) {
      this.logger.error(`Failed to delete user: ${uid}`, error);
      throw error;
    }
  }

  /**
   * List users with pagination
   */
  async listUsers(
    maxResults: number = 100,
    nextPageToken?: string
  ): Promise<{
    users: admin.auth.UserRecord[];
    nextPageToken?: string;
  }> {
    try {
      const result = await this.auth.listUsers(maxResults, nextPageToken);
      return {
        users: result.users,
        nextPageToken: result.pageToken,
      };
    } catch (error) {
      this.logger.error('Failed to list users', error);
      throw error;
    }
  }

  /**
   * Generate Firebase UID from Web3Auth sub
   */
  private generateFirebaseUid(web3AuthSub: string): string {
    // Create a deterministic UID based on Web3Auth sub
    // Firebase UIDs must be <= 128 characters and alphanumeric
    const sanitized = web3AuthSub.replace(/[^a-zA-Z0-9]/g, '_');
    return `web3auth_${sanitized}`.substring(0, 128);
  }

  /**
   * Get user role from database
   */
  private async getUserRole(
    uid: string
  ): Promise<'investor' | 'spv' | 'admin'> {
    try {
      const userDoc = await this.firebaseService.getDocument('users', uid);
      if (userDoc.exists) {
        const userData = userDoc.data();
        return userData?.role || 'investor';
      }
      return 'investor'; // Default role
    } catch (error) {
      this.logger.error(`Failed to get user role for: ${uid}`, error);
      return 'investor';
    }
  }

  /**
   * Get additional user claims from database
   */
  private async getAdditionalUserClaims(
    web3AuthSub: string
  ): Promise<Partial<CustomClaims>> {
    try {
      const uid = this.generateFirebaseUid(web3AuthSub);
      const userDoc = await this.firebaseService.getDocument('users', uid);

      if (userDoc.exists) {
        const userData = userDoc.data();
        return {
          identity_verified: userData?.kyc?.status === 'approved',
          kyc_approved: userData?.kyc?.status === 'approved',
        };
      }

      return {
        identity_verified: false,
        kyc_approved: false,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get additional claims for: ${web3AuthSub}`,
        error
      );
      return {
        identity_verified: false,
        kyc_approved: false,
      };
    }
  }

  /**
   * Get permissions for role
   */
  private getPermissionsForRole(role: 'investor' | 'spv' | 'admin'): string[] {
    const permissions: Record<string, string[]> = {
      investor: [
        'view_projects',
        'invest_in_projects',
        'view_portfolio',
        'claim_profits',
        'participate_governance',
        'manage_profile',
        'upload_kyc_documents',
      ],
      spv: [
        'view_projects',
        'create_projects',
        'manage_projects',
        'distribute_profits',
        'create_governance_proposals',
        'view_project_analytics',
        'manage_profile',
        'upload_project_documents',
      ],
      admin: [
        'view_all_projects',
        'approve_projects',
        'manage_users',
        'manage_platform',
        'view_analytics',
        'manage_compliance',
        'manage_fees',
        'manage_system_config',
        'view_all_files',
        'manage_trusted_issuers',
        'manage_identity_registry',
      ],
    };

    return permissions[role] || permissions.investor;
  }

  /**
   * Update last login timestamp
   */
  private async updateLastLogin(uid: string): Promise<void> {
    try {
      await this.firebaseService.updateDocument('users', uid, {
        lastLogin: this.firebaseService.getTimestamp(),
        updatedAt: this.firebaseService.getTimestamp(),
      });
    } catch (error) {
      this.logger.error(`Failed to update last login for: ${uid}`, error);
      // Don't throw error, just log it
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to list users with limit 1 to check if service is working
      await this.auth.listUsers(1);
      return true;
    } catch (error) {
      this.logger.error('Firebase Auth health check failed', error);
      return false;
    }
  }
}
