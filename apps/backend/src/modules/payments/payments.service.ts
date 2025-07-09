import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../../common/services/firebase.service';
import {
  InitiatePaymentDto,
  PaymentWebhookDto,
  PaymentWebhookStatus,
} from './dto';
import { TransactionStatus } from '../../common/types';

export interface PaymentSession {
  id: string;
  orderId: string;
  userId: string;
  projectId?: string;
  investmentId?: string;
  amount: number;
  paymentMethod: string;
  paymentType: string;
  status: TransactionStatus;
  initiatedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  gatewayTransactionId?: string;
  paymentUrl?: string;
  gatewayData?: Record<string, any>;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly PAYMENTS_COLLECTION = 'payment_sessions';

  // Mock configuration - in production, these would come from environment variables
  private readonly MOCK_PAYMENT_DELAY = 15000; // 15 seconds
  private readonly MOCK_SUCCESS_RATE = 0.9; // 90% success rate
  private readonly MOCK_WEBHOOK_DELAY = 3000; // 3 seconds
  private readonly MOCK_PAYMENT_URL = 'https://mock-payment-gateway.com/pay';

  constructor(private firebaseService: FirebaseService) {}

  /**
   * TODO: Replace with real Midtrans payment gateway integration
   * This is a mock implementation that simulates IDR payment processing with timeouts
   */
  async initiatePayment(initiatePaymentDto: InitiatePaymentDto): Promise<{
    paymentId: string;
    orderId: string;
    paymentUrl: string;
    status: string;
  }> {
    this.logger.log(
      `Initiating payment for user: ${initiatePaymentDto.userId}, amount: IDR ${initiatePaymentDto.amount}`
    );

    // Generate unique identifiers
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const gatewayTransactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create payment session
    const paymentSession: PaymentSession = {
      id: paymentId,
      orderId,
      userId: initiatePaymentDto.userId,
      projectId: initiatePaymentDto.projectId,
      investmentId: initiatePaymentDto.investmentId,
      amount: initiatePaymentDto.amount,
      paymentMethod: initiatePaymentDto.paymentMethod,
      paymentType: initiatePaymentDto.paymentType,
      status: TransactionStatus.PENDING,
      initiatedAt: new Date(),
      gatewayTransactionId,
      paymentUrl: `${this.MOCK_PAYMENT_URL}/${paymentId}`,
      gatewayData: {
        email: initiatePaymentDto.email,
        phoneNumber: initiatePaymentDto.phoneNumber,
        fullName: initiatePaymentDto.fullName,
        description: initiatePaymentDto.description,
        successUrl: initiatePaymentDto.successUrl,
        failureUrl: initiatePaymentDto.failureUrl,
      },
    };

    // Save to Firestore
    await this.firebaseService.setDocument(
      this.PAYMENTS_COLLECTION,
      paymentId,
      paymentSession
    );

    // TODO: In production, this would make an API call to Midtrans
    // For now, we'll simulate the payment process with a timeout
    this.simulatePaymentProcessing(paymentId, orderId, gatewayTransactionId);

    return {
      paymentId,
      orderId,
      paymentUrl: paymentSession.paymentUrl!,
      status: 'pending',
    };
  }

  /**
   * Get payment session status
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentSession | null> {
    const doc = await this.firebaseService.getDocument(
      this.PAYMENTS_COLLECTION,
      paymentId
    );

    if (!doc.exists) {
      return null;
    }

    return doc.data() as PaymentSession;
  }

  /**
   * Get payment status by order ID
   */
  async getPaymentStatusByOrderId(
    orderId: string
  ): Promise<PaymentSession | null> {
    const docs = await this.firebaseService.getDocumentsByField(
      this.PAYMENTS_COLLECTION,
      'orderId',
      orderId
    );

    if (docs.empty) {
      return null;
    }

    return docs.docs[0].data() as PaymentSession;
  }

  /**
   * Get user's payment history
   */
  async getUserPaymentHistory(
    userId: string,
    limit: number = 10
  ): Promise<PaymentSession[]> {
    const docs = await this.firebaseService.getDocumentsByField(
      this.PAYMENTS_COLLECTION,
      'userId',
      userId
    );

    if (docs.empty) {
      return [];
    }

    return docs.docs
      .map(doc => doc.data() as PaymentSession)
      .sort((a, b) => b.initiatedAt.getTime() - a.initiatedAt.getTime())
      .slice(0, limit);
  }

  /**
   * TODO: Replace with real webhook handling from Midtrans
   * This simulates processing a webhook from the payment gateway
   */
  async handlePaymentWebhook(webhookDto: PaymentWebhookDto): Promise<void> {
    this.logger.log(
      `Processing payment webhook for order: ${webhookDto.orderId}`
    );

    // Find the payment session
    const session = await this.getPaymentStatusByOrderId(webhookDto.orderId);
    if (!session) {
      this.logger.warn(
        `Payment session not found for order: ${webhookDto.orderId}`
      );
      return;
    }

    // Update session status
    const updatedSession: Partial<PaymentSession> = {
      status: this.mapWebhookStatusToTransactionStatus(
        webhookDto.transactionStatus
      ),
      gatewayData: {
        ...session.gatewayData,
        ...webhookDto.gatewayData,
        transactionTime: webhookDto.transactionTime,
        settlementTime: webhookDto.settlementTime,
        statusMessage: webhookDto.statusMessage,
        fraudStatus: webhookDto.fraudStatus,
      },
    };

    // Set completion or failure time
    if (updatedSession.status === TransactionStatus.COMPLETED) {
      updatedSession.completedAt = new Date(
        webhookDto.settlementTime || webhookDto.transactionTime
      );
    } else if (updatedSession.status === TransactionStatus.FAILED) {
      updatedSession.failedAt = new Date(webhookDto.transactionTime);
      updatedSession.failureReason =
        webhookDto.statusMessage || 'Payment failed';
    }

    await this.firebaseService.updateDocument(
      this.PAYMENTS_COLLECTION,
      session.id,
      updatedSession
    );

    // TODO: Trigger investment processing if payment is successful
    if (
      updatedSession.status === TransactionStatus.COMPLETED &&
      session.investmentId
    ) {
      await this.processSuccessfulInvestmentPayment(session);
    }

    this.logger.log(
      `Payment status updated for order ${webhookDto.orderId}: ${updatedSession.status}`
    );
  }

  /**
   * Mock payment processing simulation
   * TODO: Remove this when implementing real payment gateway
   */
  private async simulatePaymentProcessing(
    paymentId: string,
    orderId: string,
    gatewayTransactionId: string
  ): Promise<void> {
    // Simulate processing delay
    setTimeout(async () => {
      try {
        // Simulate success/failure based on mock success rate
        const isSuccess = Math.random() < this.MOCK_SUCCESS_RATE;
        const status = isSuccess
          ? PaymentWebhookStatus.SUCCESS
          : PaymentWebhookStatus.FAILURE;

        // Create mock webhook data
        const mockWebhookData: PaymentWebhookDto = {
          transactionId: gatewayTransactionId,
          orderId,
          grossAmount: 0, // Will be set from session data
          transactionStatus: status,
          paymentType: 'bank_transfer',
          transactionTime: new Date().toISOString(),
          settlementTime: isSuccess ? new Date().toISOString() : undefined,
          statusMessage: isSuccess
            ? 'Payment successful'
            : 'Payment failed - insufficient funds',
          fraudStatus: 'accept',
          gatewayData: {
            mockPayment: true,
            processedAt: new Date().toISOString(),
          },
        };

        // Get amount from session
        const session = await this.getPaymentStatus(paymentId);
        if (session) {
          mockWebhookData.grossAmount = session.amount;
        }

        // Simulate webhook delay
        setTimeout(async () => {
          await this.handlePaymentWebhook(mockWebhookData);
        }, this.MOCK_WEBHOOK_DELAY);

        this.logger.log(
          `Mock payment processing completed for order: ${orderId}, Result: ${status}`
        );
      } catch (error) {
        this.logger.error(
          `Mock payment processing failed for order: ${orderId}`,
          error
        );
      }
    }, this.MOCK_PAYMENT_DELAY);
  }

  /**
   * Process successful investment payment
   * TODO: Integrate with investments service
   */
  private async processSuccessfulInvestmentPayment(
    session: PaymentSession
  ): Promise<void> {
    if (!session.investmentId) {
      return;
    }

    this.logger.log(
      `Processing successful investment payment for investment: ${session.investmentId}`
    );

    // TODO: Call investments service to update investment status
    // For now, we'll just log the action
    this.logger.log(
      `Investment ${session.investmentId} payment completed - TODO: Update investment status`
    );
  }

  /**
   * Map webhook status to internal transaction status
   */
  private mapWebhookStatusToTransactionStatus(
    webhookStatus: PaymentWebhookStatus
  ): TransactionStatus {
    switch (webhookStatus) {
      case PaymentWebhookStatus.SUCCESS:
      case PaymentWebhookStatus.SETTLEMENT:
        return TransactionStatus.COMPLETED;
      case PaymentWebhookStatus.FAILURE:
      case PaymentWebhookStatus.CANCEL:
      case PaymentWebhookStatus.EXPIRE:
        return TransactionStatus.FAILED;
      case PaymentWebhookStatus.PENDING:
      default:
        return TransactionStatus.PROCESSING;
    }
  }

  /**
   * Cancel payment session
   */
  async cancelPayment(paymentId: string, userId: string): Promise<void> {
    const session = await this.getPaymentStatus(paymentId);

    if (!session) {
      throw new BadRequestException('Payment session not found');
    }

    if (session.userId !== userId) {
      throw new BadRequestException('Unauthorized to cancel this payment');
    }

    if (
      session.status !== TransactionStatus.PENDING &&
      session.status !== TransactionStatus.PROCESSING
    ) {
      throw new BadRequestException('Payment cannot be cancelled');
    }

    await this.firebaseService.updateDocument(
      this.PAYMENTS_COLLECTION,
      paymentId,
      {
        status: TransactionStatus.FAILED,
        failedAt: this.firebaseService.getTimestamp(),
        failureReason: 'Cancelled by user',
      }
    );

    this.logger.log(`Payment cancelled: ${paymentId} by user: ${userId}`);
  }
}
