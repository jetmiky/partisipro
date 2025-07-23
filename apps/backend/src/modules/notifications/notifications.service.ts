import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../common/services/firebase.service';
import { EmailService } from '../../common/services/email.service';
import { UsersService } from '../users/users.service';
import {
  SendNotificationDto,
  UpdatePreferencesDto,
  NotificationType,
  NotificationPriority,
} from './dto';
import { Notification } from '../../common/types';

export interface NotificationPreferences {
  userId: string;
  investmentNotifications: boolean;
  profitNotifications: boolean;
  governanceNotifications: boolean;
  systemNotifications: boolean;
  kycNotifications: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  updatedAt: Date;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly NOTIFICATIONS_COLLECTION = 'notifications';
  private readonly PREFERENCES_COLLECTION = 'notification_preferences';

  constructor(
    private firebaseService: FirebaseService,
    private emailService: EmailService,
    private usersService: UsersService
  ) {}

  /**
   * Send notification to user(s)
   */
  async sendNotification(
    sendNotificationDto: SendNotificationDto
  ): Promise<Notification[]> {
    this.logger.log(
      `Sending ${sendNotificationDto.type} notification: ${sendNotificationDto.title}`
    );

    const notifications: Notification[] = [];

    // Determine target users
    let targetUserIds: string[] = [];
    if (sendNotificationDto.userId) {
      targetUserIds = [sendNotificationDto.userId];
    } else if (sendNotificationDto.userIds) {
      targetUserIds = sendNotificationDto.userIds;
    } else {
      throw new Error('Either userId or userIds must be provided');
    }

    // Create notification for each user
    for (const userId of targetUserIds) {
      // Check user preferences
      const preferences = await this.getUserPreferences(userId);
      if (!this.shouldSendNotification(sendNotificationDto.type, preferences)) {
        this.logger.log(
          `Skipping notification for user ${userId} due to preferences`
        );
        continue;
      }

      // Create notification
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const notification: Notification = {
        id: notificationId,
        userId,
        type: sendNotificationDto.type,
        title: sendNotificationDto.title,
        message: sendNotificationDto.message,
        data: sendNotificationDto.data,
        isRead: false,
        priority: sendNotificationDto.priority,
        createdAt: new Date(),
      };

      // Save notification to Firestore
      await this.firebaseService.setDocument(
        this.NOTIFICATIONS_COLLECTION,
        notificationId,
        notification
      );
      notifications.push(notification);

      // Send push notification if enabled
      if (sendNotificationDto.sendPush && preferences.pushNotifications) {
        await this.sendPushNotification(userId);
      }

      // Send email notification if enabled
      if (sendNotificationDto.sendEmail && preferences.emailNotifications) {
        await this.sendEmailNotification(userId, notification);
      }
    }

    this.logger.log(`Sent ${notifications.length} notifications`);
    return notifications;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    limit: number = 50,
    startAfter?: string
  ): Promise<Notification[]> {
    const query = (ref: FirebaseFirestore.Query) => {
      let q = ref.where('userId', '==', userId).orderBy('createdAt', 'desc');

      q = q.limit(limit);

      if (startAfter) {
        q = q.startAfter(startAfter);
      }

      return q;
    };

    const docs = await this.firebaseService.getDocuments(
      this.NOTIFICATIONS_COLLECTION,
      query
    );
    return docs.docs.map(doc => doc.data() as Notification);
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const query = (ref: FirebaseFirestore.Query) => {
      return ref.where('userId', '==', userId).where('isRead', '==', false);
    };

    const docs = await this.firebaseService.getDocuments(
      this.NOTIFICATIONS_COLLECTION,
      query
    );
    return docs.docs.length;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.getNotificationById(notificationId);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Unauthorized to mark this notification as read');
    }

    await this.firebaseService.updateDocument(
      this.NOTIFICATIONS_COLLECTION,
      notificationId,
      {
        isRead: true,
        readAt: this.firebaseService.getTimestamp(),
      }
    );

    this.logger.log(`Notification marked as read: ${notificationId}`);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    const unreadNotifications = await this.getUnreadNotifications(userId);

    for (const notification of unreadNotifications) {
      await this.firebaseService.updateDocument(
        this.NOTIFICATIONS_COLLECTION,
        notification.id,
        {
          isRead: true,
          readAt: this.firebaseService.getTimestamp(),
        }
      );
    }

    this.logger.log(
      `Marked ${unreadNotifications.length} notifications as read for user: ${userId}`
    );
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    userId: string,
    updatePreferencesDto: UpdatePreferencesDto
  ): Promise<NotificationPreferences> {
    this.logger.log(`Updating notification preferences for user: ${userId}`);

    const currentPreferences = await this.getUserPreferences(userId);

    const updatedPreferences: NotificationPreferences = {
      ...currentPreferences,
      ...updatePreferencesDto,
      updatedAt: new Date(),
    };

    await this.firebaseService.setDocument(
      this.PREFERENCES_COLLECTION,
      userId,
      updatedPreferences
    );

    this.logger.log(`Updated notification preferences for user: ${userId}`);
    return updatedPreferences;
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const doc = await this.firebaseService.getDocument(
      this.PREFERENCES_COLLECTION,
      userId
    );

    if (!doc.exists) {
      // Return default preferences
      const defaultPreferences: NotificationPreferences = {
        userId,
        investmentNotifications: true,
        profitNotifications: true,
        governanceNotifications: true,
        systemNotifications: true,
        kycNotifications: true,
        pushNotifications: true,
        emailNotifications: true,
        updatedAt: new Date(),
      };

      // Save default preferences
      await this.firebaseService.setDocument(
        this.PREFERENCES_COLLECTION,
        userId,
        defaultPreferences
      );
      return defaultPreferences;
    }

    return doc.data() as NotificationPreferences;
  }

  /**
   * Send system notification to all users
   */
  async sendSystemNotification(
    title: string,
    message: string,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
    data?: any
  ): Promise<void> {
    this.logger.log(`Sending system notification: ${title}`);

    // TODO: In production, this would fetch all user IDs from the database
    // For now, we'll just log the action
    const mockUserIds = ['user1', 'user2', 'user3']; // Mock user IDs

    await this.sendNotification({
      userIds: mockUserIds,
      type: NotificationType.SYSTEM,
      title,
      message,
      priority,
      data,
      sendPush: true,
      sendEmail: false,
    });
  }

  /**
   * Send investment notification
   */
  async sendInvestmentNotification(
    userId: string,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    await this.sendNotification({
      userId,
      type: NotificationType.INVESTMENT,
      title,
      message,
      priority: NotificationPriority.HIGH,
      data,
      sendPush: true,
      sendEmail: true,
    });
  }

  /**
   * Send profit notification
   */
  async sendProfitNotification(
    userId: string,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    await this.sendNotification({
      userId,
      type: NotificationType.PROFIT,
      title,
      message,
      priority: NotificationPriority.HIGH,
      data,
      sendPush: true,
      sendEmail: true,
    });
  }

  /**
   * Send KYC notification
   */
  async sendKycNotification(
    userId: string,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    await this.sendNotification({
      userId,
      type: NotificationType.KYC,
      title,
      message,
      priority: NotificationPriority.HIGH,
      data,
      sendPush: true,
      sendEmail: true,
    });
  }

  /**
   * Get notification by ID
   */
  private async getNotificationById(
    notificationId: string
  ): Promise<Notification | null> {
    const doc = await this.firebaseService.getDocument(
      this.NOTIFICATIONS_COLLECTION,
      notificationId
    );

    if (!doc.exists) {
      return null;
    }

    return doc.data() as Notification;
  }

  /**
   * Get unread notifications for a user
   */
  private async getUnreadNotifications(
    userId: string
  ): Promise<Notification[]> {
    const query = (ref: FirebaseFirestore.Query) => {
      return ref.where('userId', '==', userId).where('isRead', '==', false);
    };

    const docs = await this.firebaseService.getDocuments(
      this.NOTIFICATIONS_COLLECTION,
      query
    );
    return docs.docs.map(doc => doc.data() as Notification);
  }

  /**
   * Check if notification should be sent based on user preferences
   */
  private shouldSendNotification(
    type: NotificationType,
    preferences: NotificationPreferences
  ): boolean {
    switch (type) {
      case NotificationType.INVESTMENT:
        return preferences.investmentNotifications;
      case NotificationType.PROFIT:
        return preferences.profitNotifications;
      case NotificationType.GOVERNANCE:
        return preferences.governanceNotifications;
      case NotificationType.SYSTEM:
        return preferences.systemNotifications;
      case NotificationType.KYC:
        return preferences.kycNotifications;
      default:
        return true;
    }
  }

  /**
   * Send push notification (Mock implementation)
   */
  private async sendPushNotification(userId: string): Promise<void> {
    this.logger.log(`Sending push notification to user: ${userId}`);

    // TODO: Implement actual push notification using Firebase Cloud Messaging
    // For now, we'll just log the action

    await new Promise(resolve => setTimeout(resolve, 100)); // Mock delay

    this.logger.log(`Push notification sent to user: ${userId}`);
  }

  /**
   * Send email notification using EmailService
   */
  private async sendEmailNotification(
    userId: string,
    notification: Notification
  ): Promise<void> {
    try {
      this.logger.log(`Sending email notification to user: ${userId}`);

      // Get user details
      const user = await this.usersService.findById(userId);
      if (!user || !user.email) {
        this.logger.warn(
          `Cannot send email to user ${userId}: No email address found`
        );
        return;
      }

      // Prepare email data
      const emailData = {
        to: user.email,
        subject: notification.title,
        dynamicTemplateData: {
          userName: user.profile?.firstName || 'User',
          notificationTitle: notification.title,
          notificationMessage: notification.message,
          notificationData: notification.data,
          dashboardUrl:
            process.env.FRONTEND_URL || 'https://partisipro.com/dashboard',
        },
      };

      // Send appropriate email based on notification type
      let messageId: string;
      switch (notification.type) {
        case NotificationType.INVESTMENT:
          messageId = await this.emailService.sendInvestmentNotification(
            emailData,
            this.getInvestmentNotificationType(notification)
          );
          break;
        case NotificationType.PROFIT:
          messageId = await this.emailService.sendInvestmentNotification(
            emailData,
            'profit'
          );
          break;
        case NotificationType.KYC:
          messageId = await this.emailService.sendKYCUpdate(
            emailData,
            this.getKYCStatus(notification)
          );
          break;
        case NotificationType.GOVERNANCE:
          messageId = await this.emailService.sendGovernanceNotification(
            emailData,
            this.getGovernanceType(notification)
          );
          break;
        case NotificationType.SYSTEM:
          messageId = await this.emailService.sendSystemNotification(
            emailData,
            'alert'
          );
          break;
        default:
          // Fallback to system notification
          messageId = await this.emailService.sendSystemNotification(
            emailData,
            'alert'
          );
      }

      this.logger.log(
        `Email notification sent to user ${userId}: ${messageId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email notification to user ${userId}:`,
        error instanceof Error ? error.stack : error
      );
      // Don't throw error - we don't want email failures to block notification creation
    }
  }

  /**
   * Determine investment notification type from notification data
   */
  private getInvestmentNotificationType(
    notification: Notification
  ): 'purchase' | 'profit' | 'buyback' {
    if (notification.data?.type) {
      return notification.data.type;
    }
    // Default to purchase for investment notifications
    return 'purchase';
  }

  /**
   * Determine KYC status from notification data
   */
  private getKYCStatus(
    notification: Notification
  ): 'pending' | 'approved' | 'rejected' | 'requires_action' {
    if (notification.data?.kycStatus) {
      return notification.data.kycStatus;
    }
    // Default to pending
    return 'pending';
  }

  /**
   * Determine governance notification type from notification data
   */
  private getGovernanceType(
    notification: Notification
  ): 'proposal' | 'voting' | 'result' {
    if (notification.data?.governanceType) {
      return notification.data.governanceType;
    }
    // Default to proposal
    return 'proposal';
  }

  /**
   * Send email directly using EmailService (for backward compatibility)
   */
  async sendEmail(emailData: {
    to: string;
    templateType: string;
    data: any;
  }): Promise<string> {
    this.logger.log(
      `Sending email to: ${emailData.to} with template: ${emailData.templateType}`
    );

    try {
      // Map template types to EmailService methods
      switch (emailData.templateType) {
        case 'spv_application_confirmation':
        case 'spv_application_approved':
        case 'spv_application_rejected':
          return await this.emailService.sendSystemNotification(
            {
              to: emailData.to,
              subject: this.getEmailSubject(emailData.templateType),
              dynamicTemplateData: emailData.data,
            },
            'alert'
          );
        default:
          return await this.emailService.sendSystemNotification(
            {
              to: emailData.to,
              subject: 'System Notification',
              dynamicTemplateData: emailData.data,
            },
            'alert'
          );
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${emailData.to}:`, error);
      throw error;
    }
  }

  /**
   * Get email subject based on template type
   */
  private getEmailSubject(templateType: string): string {
    switch (templateType) {
      case 'spv_application_confirmation':
        return 'SPV Application Confirmation - Partisipro';
      case 'spv_application_approved':
        return 'SPV Application Approved - Partisipro';
      case 'spv_application_rejected':
        return 'SPV Application Rejected - Partisipro';
      default:
        return 'Notification - Partisipro';
    }
  }
}
