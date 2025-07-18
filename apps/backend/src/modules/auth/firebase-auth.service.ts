import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export interface FirebaseAuthUser {
  uid: string;
  email: string;
  name?: string;
  emailVerified: boolean;
  customClaims?: Record<string, any>;
}

@Injectable()
export class FirebaseAuthService {
  private readonly logger = new Logger(FirebaseAuthService.name);

  constructor(private configService: ConfigService) {}

  async verifyIdToken(idToken: string): Promise<FirebaseAuthUser> {
    try {
      this.logger.debug('Verifying Firebase ID token');

      // Verify the ID token using Firebase Admin SDK
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      // Get additional user information
      const userRecord = await admin.auth().getUser(decodedToken.uid);

      return {
        uid: decodedToken.uid,
        email: decodedToken.email || userRecord.email,
        name: decodedToken.name || userRecord.displayName,
        emailVerified: decodedToken.email_verified || userRecord.emailVerified,
        customClaims: decodedToken,
      };
    } catch (error) {
      this.logger.error('Firebase ID token verification failed', error);
      throw new UnauthorizedException('Invalid Firebase ID token');
    }
  }

  async createUser(
    email: string,
    password?: string,
    displayName?: string
  ): Promise<FirebaseAuthUser> {
    try {
      this.logger.debug(`Creating Firebase user: ${email}`);

      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });

      return {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
      };
    } catch (error) {
      this.logger.error('Firebase user creation failed', error);
      throw new Error('Failed to create Firebase user');
    }
  }

  async updateUser(
    uid: string,
    updates: {
      email?: string;
      displayName?: string;
      emailVerified?: boolean;
    }
  ): Promise<FirebaseAuthUser> {
    try {
      this.logger.debug(`Updating Firebase user: ${uid}`);

      const userRecord = await admin.auth().updateUser(uid, updates);

      return {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
      };
    } catch (error) {
      this.logger.error('Firebase user update failed', error);
      throw new Error('Failed to update Firebase user');
    }
  }

  async deleteUser(uid: string): Promise<void> {
    try {
      this.logger.debug(`Deleting Firebase user: ${uid}`);
      await admin.auth().deleteUser(uid);
    } catch (error) {
      this.logger.error('Firebase user deletion failed', error);
      throw new Error('Failed to delete Firebase user');
    }
  }

  async setCustomClaims(
    uid: string,
    customClaims: Record<string, any>
  ): Promise<void> {
    try {
      this.logger.debug(`Setting custom claims for Firebase user: ${uid}`);
      await admin.auth().setCustomUserClaims(uid, customClaims);
    } catch (error) {
      this.logger.error('Setting custom claims failed', error);
      throw new Error('Failed to set custom claims');
    }
  }

  async revokeRefreshTokens(uid: string): Promise<void> {
    try {
      this.logger.debug(`Revoking refresh tokens for Firebase user: ${uid}`);
      await admin.auth().revokeRefreshTokens(uid);
    } catch (error) {
      this.logger.error('Revoking refresh tokens failed', error);
      throw new Error('Failed to revoke refresh tokens');
    }
  }

  async getUserByEmail(email: string): Promise<FirebaseAuthUser | null> {
    try {
      this.logger.debug(`Getting Firebase user by email: ${email}`);
      const userRecord = await admin.auth().getUserByEmail(email);

      return {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        customClaims: userRecord.customClaims,
      };
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return null;
      }
      this.logger.error('Getting Firebase user by email failed', error);
      throw new Error('Failed to get Firebase user');
    }
  }

  async getUserByUid(uid: string): Promise<FirebaseAuthUser | null> {
    try {
      this.logger.debug(`Getting Firebase user by UID: ${uid}`);
      const userRecord = await admin.auth().getUser(uid);

      return {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        customClaims: userRecord.customClaims,
      };
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return null;
      }
      this.logger.error('Getting Firebase user by UID failed', error);
      throw new Error('Failed to get Firebase user');
    }
  }

  async createCustomToken(
    uid: string,
    additionalClaims?: Record<string, any>
  ): Promise<string> {
    try {
      this.logger.debug(`Creating custom token for Firebase user: ${uid}`);
      return await admin.auth().createCustomToken(uid, additionalClaims);
    } catch (error) {
      this.logger.error('Creating custom token failed', error);
      throw new Error('Failed to create custom token');
    }
  }

  async generateEmailVerificationLink(email: string): Promise<string> {
    try {
      this.logger.debug(`Generating email verification link for: ${email}`);
      return await admin.auth().generateEmailVerificationLink(email);
    } catch (error) {
      this.logger.error('Generating email verification link failed', error);
      throw new Error('Failed to generate email verification link');
    }
  }

  async generatePasswordResetLink(email: string): Promise<string> {
    try {
      this.logger.debug(`Generating password reset link for: ${email}`);
      return await admin.auth().generatePasswordResetLink(email);
    } catch (error) {
      this.logger.error('Generating password reset link failed', error);
      throw new Error('Failed to generate password reset link');
    }
  }

  async listUsers(maxResults: number = 1000): Promise<FirebaseAuthUser[]> {
    try {
      this.logger.debug(`Listing Firebase users (max: ${maxResults})`);
      const listUsersResult = await admin.auth().listUsers(maxResults);

      return listUsersResult.users.map(userRecord => ({
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        customClaims: userRecord.customClaims,
      }));
    } catch (error) {
      this.logger.error('Listing Firebase users failed', error);
      throw new Error('Failed to list Firebase users');
    }
  }

  async enableUser(uid: string): Promise<void> {
    try {
      this.logger.debug(`Enabling Firebase user: ${uid}`);
      await admin.auth().updateUser(uid, { disabled: false });
    } catch (error) {
      this.logger.error('Enabling Firebase user failed', error);
      throw new Error('Failed to enable Firebase user');
    }
  }

  async disableUser(uid: string): Promise<void> {
    try {
      this.logger.debug(`Disabling Firebase user: ${uid}`);
      await admin.auth().updateUser(uid, { disabled: true });
    } catch (error) {
      this.logger.error('Disabling Firebase user failed', error);
      throw new Error('Failed to disable Firebase user');
    }
  }

  async verifySessionCookie(
    sessionCookie: string,
    checkRevoked: boolean = false
  ): Promise<FirebaseAuthUser> {
    try {
      this.logger.debug('Verifying Firebase session cookie');

      const decodedToken = await admin
        .auth()
        .verifySessionCookie(sessionCookie, checkRevoked);

      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        emailVerified: decodedToken.email_verified,
        customClaims: decodedToken,
      };
    } catch (error) {
      this.logger.error('Firebase session cookie verification failed', error);
      throw new UnauthorizedException('Invalid Firebase session cookie');
    }
  }

  async createSessionCookie(
    idToken: string,
    expiresIn: number
  ): Promise<string> {
    try {
      this.logger.debug('Creating Firebase session cookie');

      return await admin.auth().createSessionCookie(idToken, {
        expiresIn: expiresIn,
      });
    } catch (error) {
      this.logger.error('Creating Firebase session cookie failed', error);
      throw new Error('Failed to create Firebase session cookie');
    }
  }
}
