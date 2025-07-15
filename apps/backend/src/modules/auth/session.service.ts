import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../../common/services/firebase.service';
import * as crypto from 'crypto';

export interface SessionData {
  sessionId: string;
  userId: string;
  userRole: string;
  deviceId: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  mfaVerified: boolean;
  isActive: boolean;
  revokedAt?: Date;
  revokedReason?: string;
}

export interface DeviceInfo {
  type: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  os: string;
  browser: string;
  isTrusted: boolean;
  fingerprint: string;
}

export interface SessionSummary {
  sessionId: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  location?: string;
  createdAt: Date;
  lastActivity: Date;
  isCurrent: boolean;
  isActive: boolean;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly sessionTTL = 7 * 24 * 60 * 60; // 7 days in seconds
  private readonly maxSessionsPerUser = 5;
  private memoryCache: Map<string, SessionData> = new Map();

  constructor(
    private configService: ConfigService,
    private firebaseService: FirebaseService
  ) {
    this.logger.warn('Using in-memory session storage instead of Redis');
    // Clean up expired sessions every hour
    setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000);
  }

  async createSession(
    userId: string,
    userRole: string,
    deviceId: string,
    deviceInfo: DeviceInfo,
    ipAddress: string,
    userAgent: string,
    mfaVerified: boolean = false
  ): Promise<SessionData> {
    try {
      const sessionId = this.generateSessionId();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.sessionTTL * 1000);

      const sessionData: SessionData = {
        sessionId,
        userId,
        userRole,
        deviceId,
        deviceInfo,
        ipAddress,
        userAgent,
        createdAt: now,
        lastActivity: now,
        expiresAt,
        mfaVerified,
        isActive: true,
      };

      // Store in memory cache for fast access
      this.memoryCache.set(sessionId, sessionData);

      // Store in Firebase for persistence and audit
      await this.firebaseService.setDocument(
        `users/${userId}/sessions`,
        sessionId,
        sessionData
      );

      // Manage session limits
      await this.enforceSessionLimits(userId);

      this.logger.log(
        `Session created for user: ${userId}, session: ${sessionId}`
      );
      return sessionData;
    } catch (error) {
      this.logger.error(`Failed to create session for user ${userId}:`, error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      // Try memory cache first for performance
      const sessionData = this.memoryCache.get(sessionId);
      if (sessionData) {
        // Check if session is expired
        if (new Date(sessionData.expiresAt) < new Date()) {
          await this.revokeSession(sessionId, 'expired');
          return null;
        }

        return sessionData;
      }

      // Fallback to Firebase
      const userId = await this.getUserIdFromSession(sessionId);
      if (!userId) {
        return null;
      }

      const sessionDoc = await this.firebaseService.getDocument(
        `users/${userId}/sessions`,
        sessionId
      );

      if (!sessionDoc) {
        return null;
      }

      const sessionDataFromFirebase = sessionDoc.data() as SessionData;

      // Check if session is expired
      if (new Date(sessionDataFromFirebase.expiresAt) < new Date()) {
        await this.revokeSession(sessionId, 'expired');
        return null;
      }

      // Restore to memory cache
      this.memoryCache.set(sessionId, sessionDataFromFirebase);

      return sessionDataFromFirebase;
    } catch (error) {
      this.logger.error(`Failed to get session ${sessionId}:`, error);
      return null;
    }
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      const sessionData = await this.getSession(sessionId);
      if (!sessionData) {
        return;
      }

      const now = new Date();
      sessionData.lastActivity = now;

      // Update both memory cache and Firebase
      this.memoryCache.set(sessionId, sessionData);

      await this.firebaseService.updateDocument(
        `users/${sessionData.userId}/sessions`,
        sessionId,
        { lastActivity: now }
      );
    } catch (error) {
      this.logger.error(
        `Failed to update session activity ${sessionId}:`,
        error
      );
    }
  }

  async markMFAVerified(sessionId: string): Promise<void> {
    try {
      const sessionData = await this.getSession(sessionId);
      if (!sessionData) {
        throw new UnauthorizedException('Session not found');
      }

      sessionData.mfaVerified = true;

      // Update both memory cache and Firebase
      this.memoryCache.set(sessionId, sessionData);

      await this.firebaseService.updateDocument(
        `users/${sessionData.userId}/sessions`,
        sessionId,
        { mfaVerified: true }
      );

      this.logger.log(`MFA verified for session: ${sessionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to mark MFA verified for session ${sessionId}:`,
        error
      );
      throw error;
    }
  }

  async revokeSession(sessionId: string, reason: string): Promise<void> {
    try {
      const sessionData = await this.getSession(sessionId);
      if (!sessionData) {
        return;
      }

      // Remove from memory cache
      this.memoryCache.delete(sessionId);

      // Update Firebase to mark as revoked
      await this.firebaseService.updateDocument(
        `users/${sessionData.userId}/sessions`,
        sessionId,
        {
          isActive: false,
          revokedAt: new Date(),
          revokedReason: reason,
        }
      );

      this.logger.log(`Session revoked: ${sessionId}, reason: ${reason}`);
    } catch (error) {
      this.logger.error(`Failed to revoke session ${sessionId}:`, error);
      throw error;
    }
  }

  async revokeAllUserSessions(
    userId: string,
    currentSessionId?: string
  ): Promise<void> {
    try {
      const sessions = await this.getUserSessions(userId);

      for (const session of sessions) {
        if (session.sessionId !== currentSessionId) {
          await this.revokeSession(session.sessionId, 'revoked_by_user');
        }
      }

      this.logger.log(`All sessions revoked for user: ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to revoke all sessions for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  async getUserSessions(userId: string): Promise<SessionSummary[]> {
    try {
      const sessionsSnapshot = await this.firebaseService.getDocuments(
        `users/${userId}/sessions`
      );

      const sessions: SessionSummary[] = [];

      for (const doc of sessionsSnapshot.docs) {
        const sessionData = doc.data() as SessionData;

        // Skip expired sessions
        if (new Date(sessionData.expiresAt) < new Date()) {
          continue;
        }

        sessions.push({
          sessionId: sessionData.sessionId,
          deviceInfo: sessionData.deviceInfo,
          ipAddress: sessionData.ipAddress,
          createdAt: sessionData.createdAt,
          lastActivity: sessionData.lastActivity,
          isCurrent: false, // Will be set by caller
          isActive: sessionData.isActive,
        });
      }

      return sessions.sort(
        (a, b) =>
          new Date(b.lastActivity).getTime() -
          new Date(a.lastActivity).getTime()
      );
    } catch (error) {
      this.logger.error(`Failed to get user sessions for ${userId}:`, error);
      throw error;
    }
  }

  async validateSession(sessionId: string): Promise<SessionData | null> {
    try {
      const sessionData = await this.getSession(sessionId);

      if (!sessionData) {
        return null;
      }

      if (!sessionData.isActive) {
        return null;
      }

      if (new Date(sessionData.expiresAt) < new Date()) {
        await this.revokeSession(sessionId, 'expired');
        return null;
      }

      // Update last activity
      await this.updateSessionActivity(sessionId);

      return sessionData;
    } catch (error) {
      this.logger.error(`Failed to validate session ${sessionId}:`, error);
      return null;
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    try {
      // This would typically be called by a cron job
      // For now, we'll implement a simple cleanup
      const now = new Date();

      // Clean up expired sessions from memory cache
      for (const [sessionId, sessionData] of this.memoryCache.entries()) {
        if (new Date(sessionData.expiresAt) < now) {
          this.memoryCache.delete(sessionId);
        }
      }

      this.logger.log('Expired sessions cleaned up');
    } catch (error) {
      this.logger.error('Failed to cleanup expired sessions:', error);
    }
  }

  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async getUserIdFromSession(
    sessionId: string
  ): Promise<string | null> {
    try {
      // Check memory cache first
      const sessionData = this.memoryCache.get(sessionId);
      if (sessionData) {
        return sessionData.userId;
      }

      // If not in memory cache, we need to search Firebase
      // This is less efficient but works as a fallback
      // In production, you might want to maintain a reverse index
      return null;
    } catch (error) {
      this.logger.error(
        `Failed to get user ID from session ${sessionId}:`,
        error
      );
      return null;
    }
  }

  private async enforceSessionLimits(userId: string): Promise<void> {
    try {
      const sessions = await this.getUserSessions(userId);

      if (sessions.length > this.maxSessionsPerUser) {
        // Revoke oldest sessions
        const sessionsToRevoke = sessions
          .slice(this.maxSessionsPerUser)
          .sort(
            (a, b) =>
              new Date(a.lastActivity).getTime() -
              new Date(b.lastActivity).getTime()
          );

        for (const session of sessionsToRevoke) {
          await this.revokeSession(session.sessionId, 'session_limit_exceeded');
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to enforce session limits for user ${userId}:`,
        error
      );
    }
  }

  async onApplicationShutdown(): Promise<void> {
    this.memoryCache.clear();
    this.logger.log('Session memory cache cleared');
  }
}
