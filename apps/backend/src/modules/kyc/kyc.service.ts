import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../../common/services/firebase.service';
import { InitiateKYCDto, KYCWebhookDto, KYCWebhookStatus } from './dto';
import { KYCStatus } from '../../common/types';

export interface KYCSession {
  id: string;
  userId: string;
  status: KYCStatus;
  initiatedAt: Date;
  completedAt?: Date;
  reason?: string;
  confidenceScore?: number;
}

@Injectable()
export class KYCService {
  private readonly logger = new Logger(KYCService.name);
  private readonly KYC_COLLECTION = 'kyc_sessions';

  // Mock configuration - in production, these would come from environment variables
  private readonly MOCK_VERIFICATION_DELAY = 10000; // 10 seconds
  private readonly MOCK_SUCCESS_RATE = 0.8; // 80% success rate
  private readonly MOCK_WEBHOOK_DELAY = 2000; // 2 seconds

  constructor(private firebaseService: FirebaseService) {}

  /**
   * TODO: Replace with real Verihubs KYC provider integration
   * This is a mock implementation that simulates KYC verification with timeouts
   */
  async initiateKYC(
    initiateKYCDto: InitiateKYCDto
  ): Promise<{ sessionId: string; status: string }> {
    this.logger.log(`Initiating KYC for user: ${initiateKYCDto.userId}`);

    // Check if user already has a pending KYC session
    const existingSession = await this.findPendingKYCSession(
      initiateKYCDto.userId
    );
    if (existingSession) {
      throw new BadRequestException('User already has a pending KYC session');
    }

    // Create new KYC session
    const sessionId = `kyc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const kycSession: KYCSession = {
      id: sessionId,
      userId: initiateKYCDto.userId,
      status: KYCStatus.PENDING,
      initiatedAt: new Date(),
    };

    // Save to Firestore
    await this.firebaseService.setDocument(
      this.KYC_COLLECTION,
      sessionId,
      kycSession
    );

    // Update user's KYC status to pending
    await this.updateUserKYCStatus(initiateKYCDto.userId, KYCStatus.PENDING);

    // TODO: In production, this would make an API call to Verihubs
    // For now, we'll simulate the verification process with a timeout
    this.simulateKYCVerification(sessionId, initiateKYCDto.userId);

    return {
      sessionId,
      status: 'pending',
    };
  }

  /**
   * Get KYC session status
   */
  async getKYCStatus(sessionId: string): Promise<KYCSession | null> {
    const doc = await this.firebaseService.getDocument(
      this.KYC_COLLECTION,
      sessionId
    );

    if (!doc.exists) {
      return null;
    }

    return doc.data() as KYCSession;
  }

  /**
   * Get KYC status by user ID
   */
  async getKYCStatusByUserId(userId: string): Promise<KYCSession | null> {
    const docs = await this.firebaseService.getDocumentsByField(
      this.KYC_COLLECTION,
      'userId',
      userId
    );

    if (docs.empty) {
      return null;
    }

    // Return the most recent session
    const sessions = docs.docs
      .map(doc => doc.data() as KYCSession)
      .sort((a, b) => b.initiatedAt.getTime() - a.initiatedAt.getTime());

    return sessions[0];
  }

  /**
   * TODO: Replace with real webhook handling from Verihubs
   * This simulates processing a webhook from the KYC provider
   */
  async handleKYCWebhook(webhookDto: KYCWebhookDto): Promise<void> {
    this.logger.log(
      `Processing KYC webhook for session: ${webhookDto.sessionId}`
    );

    // Find the KYC session
    const session = await this.getKYCStatus(webhookDto.sessionId);
    if (!session) {
      this.logger.warn(`KYC session not found: ${webhookDto.sessionId}`);
      return;
    }

    // Update session status
    const updatedSession: Partial<KYCSession> = {
      status: this.mapWebhookStatusToKYCStatus(webhookDto.status),
      completedAt: new Date(webhookDto.completedAt),
      reason: webhookDto.reason,
      confidenceScore: webhookDto.confidenceScore
        ? parseInt(webhookDto.confidenceScore)
        : undefined,
    };

    await this.firebaseService.updateDocument(
      this.KYC_COLLECTION,
      webhookDto.sessionId,
      updatedSession
    );

    // Update user's KYC status
    await this.updateUserKYCStatus(session.userId, updatedSession.status!);

    this.logger.log(
      `KYC status updated for user ${session.userId}: ${updatedSession.status}`
    );
  }

  /**
   * Mock KYC verification simulation
   * TODO: Remove this when implementing real KYC provider
   */
  private async simulateKYCVerification(
    sessionId: string,
    userId: string
  ): Promise<void> {
    // Simulate processing delay
    setTimeout(async () => {
      try {
        // Simulate success/failure based on mock success rate
        const isSuccess = Math.random() < this.MOCK_SUCCESS_RATE;
        const status = isSuccess
          ? KYCWebhookStatus.APPROVED
          : KYCWebhookStatus.REJECTED;

        // Create mock webhook data
        const mockWebhookData: KYCWebhookDto = {
          sessionId,
          userId,
          status,
          completedAt: new Date().toISOString(),
          reason: isSuccess
            ? 'Verification successful'
            : 'Document quality insufficient',
          confidenceScore: isSuccess ? '85' : '45',
        };

        // Simulate webhook delay
        setTimeout(async () => {
          await this.handleKYCWebhook(mockWebhookData);
        }, this.MOCK_WEBHOOK_DELAY);

        this.logger.log(
          `Mock KYC verification completed for session: ${sessionId}, Result: ${status}`
        );
      } catch (error) {
        this.logger.error(
          `Mock KYC verification failed for session: ${sessionId}`,
          error
        );
      }
    }, this.MOCK_VERIFICATION_DELAY);
  }

  /**
   * Helper method to find pending KYC session for a user
   */
  private async findPendingKYCSession(
    userId: string
  ): Promise<KYCSession | null> {
    const docs = await this.firebaseService.getDocumentsByQuery(
      this.KYC_COLLECTION,
      'userId',
      '==',
      userId
    );

    if (docs.empty) {
      return null;
    }

    // Check if any session is pending
    for (const doc of docs.docs) {
      const session = doc.data() as KYCSession;
      if (session.status === KYCStatus.PENDING) {
        return session;
      }
    }

    return null;
  }

  /**
   * Update user's KYC status in users collection
   */
  private async updateUserKYCStatus(
    userId: string,
    status: KYCStatus
  ): Promise<void> {
    await this.firebaseService.updateDocument('users', userId, {
      'kyc.status': status,
      'kyc.updatedAt': this.firebaseService.getTimestamp(),
    });
  }

  /**
   * Map webhook status to internal KYC status
   */
  private mapWebhookStatusToKYCStatus(
    webhookStatus: KYCWebhookStatus
  ): KYCStatus {
    switch (webhookStatus) {
      case KYCWebhookStatus.APPROVED:
        return KYCStatus.APPROVED;
      case KYCWebhookStatus.REJECTED:
        return KYCStatus.REJECTED;
      case KYCWebhookStatus.REQUIRES_REVIEW:
        return KYCStatus.PENDING;
      default:
        return KYCStatus.PENDING;
    }
  }
}
