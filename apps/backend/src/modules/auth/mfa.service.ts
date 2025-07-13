import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../../common/services/firebase.service';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

export interface MFASetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MFAChallenge {
  userId: string;
  challengeId: string;
  method: 'totp' | 'sms' | 'email';
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

export interface MFAVerificationResult {
  success: boolean;
  remainingAttempts?: number;
  lockedUntil?: Date;
}

@Injectable()
export class MFAService {
  private readonly logger = new Logger(MFAService.name);
  private readonly maxAttempts = 5;
  private readonly lockoutDuration = 15 * 60 * 1000; // 15 minutes

  constructor(
    private configService: ConfigService,
    private firebaseService: FirebaseService
  ) {}

  async setupTOTP(
    userId: string,
    userEmail: string
  ): Promise<MFASetupResponse> {
    try {
      // Generate secret for TOTP
      const secret = speakeasy.generateSecret({
        name: `Partisipro (${userEmail})`,
        issuer: 'Partisipro',
        length: 32,
      });

      // Generate QR code
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes(8);

      // Store MFA setup in Firebase
      await this.firebaseService.setDocument(`users/${userId}/mfa`, 'setup', {
        secret: secret.base32,
        backupCodes: backupCodes.map(code => ({
          code: this.hashBackupCode(code),
          used: false,
        })),
        enabled: false,
        setupAt: new Date(),
      });

      this.logger.log(`TOTP setup initiated for user: ${userId}`);

      return {
        secret: secret.base32,
        qrCodeUrl,
        backupCodes,
      };
    } catch (error) {
      this.logger.error(`Failed to setup TOTP for user ${userId}:`, error);
      throw error;
    }
  }

  async enableMFA(userId: string, totpCode: string): Promise<boolean> {
    try {
      const mfaData = await this.firebaseService.getDocument(
        `users/${userId}/mfa`,
        'setup'
      );

      if (!mfaData) {
        throw new UnauthorizedException('MFA setup not found');
      }

      // Verify the TOTP code
      const verified = speakeasy.totp.verify({
        secret: mfaData.data()?.secret,
        encoding: 'base32',
        token: totpCode,
        window: 2, // Allow 2 time steps of drift
      });

      if (!verified) {
        throw new UnauthorizedException('Invalid TOTP code');
      }

      // Enable MFA
      await this.firebaseService.updateDocument(
        `users/${userId}/mfa`,
        'setup',
        {
          enabled: true,
          enabledAt: new Date(),
        }
      );

      // Update user's MFA status
      await this.firebaseService.updateDocument('users', userId, {
        mfaEnabled: true,
        'security.mfaEnabledAt': new Date(),
      });

      this.logger.log(`MFA enabled for user: ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to enable MFA for user ${userId}:`, error);
      throw error;
    }
  }

  async verifyTOTP(
    userId: string,
    totpCode: string
  ): Promise<MFAVerificationResult> {
    try {
      const mfaData = await this.firebaseService.getDocument(
        `users/${userId}/mfa`,
        'setup'
      );

      if (!mfaData || !mfaData.data()?.enabled) {
        throw new UnauthorizedException('MFA not enabled');
      }

      // Check if user is locked out
      const lockoutStatus = await this.checkLockoutStatus(userId);
      if (lockoutStatus.lockedUntil && lockoutStatus.lockedUntil > new Date()) {
        return {
          success: false,
          lockedUntil: lockoutStatus.lockedUntil,
        };
      }

      // Verify the TOTP code
      const verified = speakeasy.totp.verify({
        secret: mfaData.data()?.secret,
        encoding: 'base32',
        token: totpCode,
        window: 2,
      });

      if (verified) {
        // Reset failed attempts on successful verification
        await this.resetFailedAttempts(userId);
        return { success: true };
      } else {
        // Increment failed attempts
        const attempts = await this.incrementFailedAttempts(userId);
        const remainingAttempts = Math.max(0, this.maxAttempts - attempts);

        if (attempts >= this.maxAttempts) {
          const lockedUntil = new Date(Date.now() + this.lockoutDuration);
          await this.lockUser(userId, lockedUntil);
          return {
            success: false,
            lockedUntil,
          };
        }

        return {
          success: false,
          remainingAttempts,
        };
      }
    } catch (error) {
      this.logger.error(`Failed to verify TOTP for user ${userId}:`, error);
      throw error;
    }
  }

  async verifyBackupCode(
    userId: string,
    backupCode: string
  ): Promise<MFAVerificationResult> {
    try {
      const mfaData = await this.firebaseService.getDocument(
        `users/${userId}/mfa`,
        'setup'
      );

      if (!mfaData || !mfaData.data()?.enabled) {
        throw new UnauthorizedException('MFA not enabled');
      }

      const hashedCode = this.hashBackupCode(backupCode);
      const backupCodeIndex = mfaData
        .data()
        ?.backupCodes.findIndex(
          (code: any) => code.code === hashedCode && !code.used
        );

      if (backupCodeIndex === -1) {
        throw new UnauthorizedException('Invalid or used backup code');
      }

      // Mark backup code as used
      const mfaDataSnapshot = mfaData.data();
      mfaDataSnapshot.backupCodes[backupCodeIndex].used = true;
      mfaDataSnapshot.backupCodes[backupCodeIndex].usedAt = new Date();

      await this.firebaseService.updateDocument(
        `users/${userId}/mfa`,
        'setup',
        {
          backupCodes: mfaDataSnapshot.backupCodes,
        }
      );

      this.logger.log(`Backup code used for user: ${userId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to verify backup code for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  async disableMFA(userId: string, totpCode: string): Promise<boolean> {
    try {
      const verificationResult = await this.verifyTOTP(userId, totpCode);

      if (!verificationResult.success) {
        throw new UnauthorizedException('Invalid TOTP code');
      }

      // Disable MFA
      await this.firebaseService.updateDocument(
        `users/${userId}/mfa`,
        'setup',
        {
          enabled: false,
          disabledAt: new Date(),
        }
      );

      // Update user's MFA status
      await this.firebaseService.updateDocument('users', userId, {
        mfaEnabled: false,
        'security.mfaDisabledAt': new Date(),
      });

      this.logger.log(`MFA disabled for user: ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to disable MFA for user ${userId}:`, error);
      throw error;
    }
  }

  async regenerateBackupCodes(
    userId: string,
    totpCode: string
  ): Promise<string[]> {
    try {
      const verificationResult = await this.verifyTOTP(userId, totpCode);

      if (!verificationResult.success) {
        throw new UnauthorizedException('Invalid TOTP code');
      }

      const newBackupCodes = this.generateBackupCodes(8);

      await this.firebaseService.updateDocument(
        `users/${userId}/mfa`,
        'setup',
        {
          backupCodes: newBackupCodes.map(code => ({
            code: this.hashBackupCode(code),
            used: false,
          })),
          backupCodesRegeneratedAt: new Date(),
        }
      );

      this.logger.log(`Backup codes regenerated for user: ${userId}`);
      return newBackupCodes;
    } catch (error) {
      this.logger.error(
        `Failed to regenerate backup codes for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  async getMFAStatus(userId: string): Promise<{
    enabled: boolean;
    backupCodesRemaining: number;
    lockedUntil?: Date;
  }> {
    try {
      const mfaData = await this.firebaseService.getDocument(
        `users/${userId}/mfa`,
        'setup'
      );

      if (!mfaData) {
        return {
          enabled: false,
          backupCodesRemaining: 0,
        };
      }

      const backupCodesRemaining =
        mfaData.data()?.backupCodes?.filter((code: any) => !code.used).length ||
        0;

      const lockoutStatus = await this.checkLockoutStatus(userId);

      return {
        enabled: mfaData.data()?.enabled || false,
        backupCodesRemaining,
        lockedUntil: lockoutStatus.lockedUntil,
      };
    } catch (error) {
      this.logger.error(`Failed to get MFA status for user ${userId}:`, error);
      throw error;
    }
  }

  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  private hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  private async checkLockoutStatus(userId: string): Promise<{
    attempts: number;
    lockedUntil?: Date;
  }> {
    try {
      const lockoutData = await this.firebaseService.getDocument(
        `users/${userId}/security`,
        'lockout'
      );

      if (!lockoutData) {
        return { attempts: 0 };
      }

      // Check if lockout has expired
      if (
        lockoutData.data()?.lockedUntil &&
        new Date(lockoutData.data()?.lockedUntil) < new Date()
      ) {
        await this.resetFailedAttempts(userId);
        return { attempts: 0 };
      }

      return {
        attempts: lockoutData.data()?.attempts || 0,
        lockedUntil: lockoutData.data()?.lockedUntil
          ? new Date(lockoutData.data()?.lockedUntil)
          : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Failed to check lockout status for user ${userId}:`,
        error
      );
      return { attempts: 0 };
    }
  }

  private async incrementFailedAttempts(userId: string): Promise<number> {
    try {
      const lockoutData = await this.firebaseService.getDocument(
        `users/${userId}/security`,
        'lockout'
      );
      const attempts = (lockoutData?.data()?.attempts || 0) + 1;

      await this.firebaseService.setDocument(
        `users/${userId}/security`,
        'lockout',
        {
          attempts,
          lastAttempt: new Date(),
        }
      );

      return attempts;
    } catch (error) {
      this.logger.error(
        `Failed to increment failed attempts for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  private async resetFailedAttempts(userId: string): Promise<void> {
    try {
      await this.firebaseService.setDocument(
        `users/${userId}/security`,
        'lockout',
        {
          attempts: 0,
          lastReset: new Date(),
        }
      );
    } catch (error) {
      this.logger.error(
        `Failed to reset failed attempts for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  private async lockUser(userId: string, lockedUntil: Date): Promise<void> {
    try {
      await this.firebaseService.setDocument(
        `users/${userId}/security`,
        'lockout',
        {
          attempts: this.maxAttempts,
          lockedUntil,
          lockedAt: new Date(),
        }
      );

      this.logger.warn(`User locked due to failed MFA attempts: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to lock user ${userId}:`, error);
      throw error;
    }
  }
}
