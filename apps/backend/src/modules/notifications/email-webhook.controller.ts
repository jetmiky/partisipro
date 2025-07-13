import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  Get,
  Param,
} from '@nestjs/common';
import { EmailService } from '../../common/services/email.service';

@Controller('api/email')
export class EmailWebhookController {
  private readonly logger = new Logger(EmailWebhookController.name);

  constructor(private readonly emailService: EmailService) {}

  /**
   * Handle SendGrid webhook events for email delivery tracking
   */
  @Post('webhook')
  async handleSendGridWebhook(
    @Body() payload: any,
    @Headers('x-twilio-email-event-webhook-signature') signature: string
  ) {
    try {
      this.logger.log('Received SendGrid webhook event');

      const deliveryStatuses = await this.emailService.processWebhook(
        payload,
        signature
      );

      this.logger.log(
        `Processed ${deliveryStatuses.length} email delivery events`
      );

      return {
        status: 'success',
        processedEvents: deliveryStatuses.length,
      };
    } catch (error) {
      this.logger.error(
        'Error processing SendGrid webhook:',
        error instanceof Error ? error.stack : error
      );
      throw error;
    }
  }

  /**
   * Get email template information
   */
  @Get('templates/:type')
  async getTemplateInfo(@Param('type') type: string) {
    try {
      const template = await this.emailService.getTemplateInfo(type as any);
      return {
        status: 'success',
        template,
      };
    } catch (error) {
      this.logger.error(
        `Error getting template info for ${type}:`,
        error instanceof Error ? error.stack : error
      );
      throw error;
    }
  }

  /**
   * Get email delivery statistics
   */
  @Get('stats')
  async getDeliveryStats() {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

      const stats = await this.emailService.getDeliveryStats(
        startDate,
        endDate
      );
      return {
        status: 'success',
        stats,
      };
    } catch (error) {
      this.logger.error(
        'Error getting delivery stats:',
        error instanceof Error ? error.stack : error
      );
      throw error;
    }
  }
}
