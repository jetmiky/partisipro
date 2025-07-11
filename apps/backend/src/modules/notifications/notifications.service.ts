import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../common/services/firebase.service';
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

  constructor(private firebaseService: FirebaseService) {}

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
        await this.sendEmailNotification(userId);
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
   * Send email notification (Mock implementation)
   */
  private async sendEmailNotification(userId: string): Promise<void> {
    this.logger.log(`Sending email notification to user: ${userId}`);

    // TODO: Implement actual email sending using a service like SendGrid or AWS SES
    // For now, we'll just log the action

    await new Promise(resolve => setTimeout(resolve, 100)); // Mock delay

    this.logger.log(`Email notification sent to user: ${userId}`);
  }
}
