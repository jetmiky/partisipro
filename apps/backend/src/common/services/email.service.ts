import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { createHmac } from 'crypto';
import { EmailConfig, EmailTemplate } from '../../config/email.config';
import { ConnectionPoolService } from './connection-pool.service';
import { MonitoringService } from './monitoring.service';

export interface EmailData {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject?: string;
  dynamicTemplateData?: Record<string, any>;
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: string;
  }>;
}

export interface EmailDeliveryStatus {
  messageId: string;
  status:
    | 'sent'
    | 'delivered'
    | 'opened'
    | 'clicked'
    | 'bounced'
    | 'dropped'
    | 'failed';
  timestamp: Date;
  reason?: string;
  url?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly emailConfig: EmailConfig;
  private readonly retryDelays = [1000, 3000, 9000]; // Exponential backoff

  constructor(
    private readonly configService: ConfigService,
    private readonly connectionPool: ConnectionPoolService,
    private readonly monitoring: MonitoringService
  ) {
    this.emailConfig = this.configService.get<EmailConfig>('email');

    if (this.emailConfig.apiKey) {
      sgMail.setApiKey(this.emailConfig.apiKey);
      this.logger.log('SendGrid API initialized');
    } else {
      this.logger.warn(
        'SendGrid API key not provided - email service will run in mock mode'
      );
    }
  }

  async sendInvestmentNotification(
    emailData: EmailData,
    type: 'purchase' | 'profit' | 'buyback'
  ): Promise<string> {
    const template = this.emailConfig.templates.investment;
    const templateData = {
      ...emailData.dynamicTemplateData,
      notificationType: type,
      companyName: this.emailConfig.fromName,
      timestamp: new Date().toISOString(),
    };

    return this.sendTemplatedEmail(template, emailData, templateData);
  }

  async sendSecurityAlert(
    emailData: EmailData,
    alertType: 'login' | 'mfa' | 'suspicious' | 'account_change'
  ): Promise<string> {
    const template = this.emailConfig.templates.security;
    const templateData = {
      ...emailData.dynamicTemplateData,
      alertType,
      companyName: this.emailConfig.fromName,
      timestamp: new Date().toISOString(),
      supportEmail: this.emailConfig.fromEmail,
    };

    return this.sendTemplatedEmail(template, emailData, templateData);
  }

  async sendKYCUpdate(
    emailData: EmailData,
    status: 'pending' | 'approved' | 'rejected' | 'requires_action'
  ): Promise<string> {
    const template = this.emailConfig.templates.kyc;
    const templateData = {
      ...emailData.dynamicTemplateData,
      kycStatus: status,
      companyName: this.emailConfig.fromName,
      timestamp: new Date().toISOString(),
      dashboardUrl:
        process.env.FRONTEND_URL || 'https://partisipro.com/dashboard',
    };

    return this.sendTemplatedEmail(template, emailData, templateData);
  }

  async sendGovernanceNotification(
    emailData: EmailData,
    notificationType: 'proposal' | 'voting' | 'result'
  ): Promise<string> {
    const template = this.emailConfig.templates.governance;
    const templateData = {
      ...emailData.dynamicTemplateData,
      notificationType,
      companyName: this.emailConfig.fromName,
      timestamp: new Date().toISOString(),
      governanceUrl: process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/governance`
        : 'https://partisipro.com/governance',
    };

    return this.sendTemplatedEmail(template, emailData, templateData);
  }

  async sendSystemNotification(
    emailData: EmailData,
    type: 'maintenance' | 'update' | 'alert'
  ): Promise<string> {
    const template = this.emailConfig.templates.system;
    const templateData = {
      ...emailData.dynamicTemplateData,
      systemNotificationType: type,
      companyName: this.emailConfig.fromName,
      timestamp: new Date().toISOString(),
    };

    return this.sendTemplatedEmail(template, emailData, templateData);
  }

  async sendMFACode(
    emailData: EmailData,
    code: string,
    expiresIn: number
  ): Promise<string> {
    const template = this.emailConfig.templates.mfa;
    const templateData = {
      ...emailData.dynamicTemplateData,
      mfaCode: code,
      expiresInMinutes: Math.floor(expiresIn / 60),
      companyName: this.emailConfig.fromName,
      timestamp: new Date().toISOString(),
    };

    return this.sendTemplatedEmail(template, emailData, templateData);
  }

  private async sendTemplatedEmail(
    template: EmailTemplate,
    emailData: EmailData,
    templateData: Record<string, any>
  ): Promise<string> {
    if (!this.emailConfig.apiKey) {
      // Mock mode for development
      const mockId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      this.logger.log(
        `Mock email sent: ${template.name} to ${emailData.to} with ID ${mockId}`
      );
      return mockId;
    }

    const msg: sgMail.MailDataRequired = {
      to: emailData.to,
      cc: emailData.cc,
      bcc: emailData.bcc,
      from: {
        email: this.emailConfig.fromEmail,
        name: this.emailConfig.fromName,
      },
      templateId: template.id,
      dynamicTemplateData: templateData,
      attachments: emailData.attachments,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
        subscriptionTracking: { enable: false },
      },
      mailSettings: {
        sandboxMode: { enable: process.env.NODE_ENV === 'test' },
      },
    };

    // Override subject if provided
    if (emailData.subject) {
      msg.subject = emailData.subject;
    }

    return this.sendWithRetry(msg, template.name);
  }

  private async sendWithRetry(
    msg: sgMail.MailDataRequired,
    templateName: string,
    attempt = 0
  ): Promise<string> {
    const startTime = Date.now();

    try {
      const [response] = await sgMail.send(msg);
      const messageId = response.headers['x-message-id'] || `sg-${Date.now()}`;

      // Log success metrics
      const duration = Date.now() - startTime;
      this.monitoring.recordMetric('email_sent_success', 1);
      this.monitoring.recordMetric('email_duration', duration);

      this.logger.log(
        `Email sent successfully: ${templateName} (ID: ${messageId}, Duration: ${duration}ms)`
      );
      return messageId;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error metrics
      this.monitoring.recordMetric('email_sent_error', 1);
      this.monitoring.recordMetric('email_error_duration', duration);

      this.logger.error(
        `Email send failed (attempt ${attempt + 1}): ${templateName}`,
        error instanceof Error ? error.stack : String(error)
      );

      // Retry logic with exponential backoff
      if (attempt < this.emailConfig.retries.maxAttempts - 1) {
        const delay =
          this.retryDelays[attempt] ||
          this.retryDelays[this.retryDelays.length - 1];
        this.logger.log(`Retrying email send in ${delay}ms...`);

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendWithRetry(msg, templateName, attempt + 1);
      }

      // Final failure after all retries
      await this.monitoring.createAlert({
        type: 'error',
        severity: 'high',
        title: 'Email Delivery Failure',
        description: `Failed to send ${templateName} email after ${this.emailConfig.retries.maxAttempts} attempts: ${error instanceof Error ? error.message : String(error)}`,
        source: 'email_service',
        metadata: {
          template: templateName,
          recipient: Array.isArray(msg.to)
            ? msg.to.join(', ')
            : msg.to.toString(),
          error: error instanceof Error ? error.message : String(error),
          attempts: this.emailConfig.retries.maxAttempts,
        },
      });

      throw new Error(
        `Failed to send email after ${this.emailConfig.retries.maxAttempts} attempts: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async processWebhook(
    payload: any,
    signature: string
  ): Promise<EmailDeliveryStatus[]> {
    // Verify webhook signature if secret is provided
    if (this.emailConfig.webhook.secret) {
      const isValid = await this.verifyWebhookSignature(payload, signature);
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }
    }

    const events: EmailDeliveryStatus[] = [];

    if (Array.isArray(payload)) {
      for (const event of payload) {
        const status = this.mapSendGridEventToStatus(event);
        if (status) {
          events.push(status);
          await this.handleDeliveryEvent(status);
        }
      }
    }

    return events;
  }

  private async verifyWebhookSignature(
    payload: any,
    signature: string
  ): Promise<boolean> {
    try {
      // SendGrid webhook signature verification
      const expectedSignature = createHmac(
        'sha256',
        this.emailConfig.webhook.secret
      )
        .update(JSON.stringify(payload))
        .digest('base64');

      return signature === expectedSignature;
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      return false;
    }
  }

  private mapSendGridEventToStatus(event: any): EmailDeliveryStatus | null {
    const eventTypeMap = {
      processed: 'sent',
      delivered: 'delivered',
      open: 'opened',
      click: 'clicked',
      bounce: 'bounced',
      dropped: 'dropped',
      deferred: 'failed',
      unsubscribe: 'delivered', // Still delivered, just unsubscribed
      group_unsubscribe: 'delivered',
      group_resubscribe: 'delivered',
      spamreport: 'delivered', // Delivered but marked as spam
    };

    const status = eventTypeMap[event.event];
    if (!status) return null;

    return {
      messageId: event.sg_message_id || event['smtp-id'] || '',
      status: status as any,
      timestamp: new Date(event.timestamp * 1000),
      reason: event.reason || event.type,
      url: event.url,
    };
  }

  private async handleDeliveryEvent(
    status: EmailDeliveryStatus
  ): Promise<void> {
    // Record delivery metrics
    this.monitoring.recordMetric('email_delivery_event', 1);
    this.monitoring.recordMetric(`email_${status.status}`, 1);

    // Log important events
    if (['bounced', 'dropped', 'failed'].includes(status.status)) {
      this.logger.warn(
        `Email delivery issue: ${status.status} for message ${status.messageId}`,
        {
          reason: status.reason,
          timestamp: status.timestamp,
        }
      );
    } else if (status.status === 'delivered') {
      this.logger.log(`Email delivered successfully: ${status.messageId}`);
    }

    // TODO: Update database with delivery status if needed
    // This could be used to track email delivery for audit purposes
  }

  async getDeliveryStats(startDate: Date, endDate: Date): Promise<any> {
    // This would typically query SendGrid's Stats API
    // For now, return mock data structure
    return {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      failed: 0,
      period: { start: startDate, end: endDate },
    };
  }

  async validateEmailAddress(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async getTemplateInfo(
    templateType: keyof EmailConfig['templates']
  ): Promise<EmailTemplate> {
    return this.emailConfig.templates[templateType];
  }
}
