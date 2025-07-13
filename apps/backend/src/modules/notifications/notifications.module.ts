import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailWebhookController } from './email-webhook.controller';
import { CommonModule } from '../../common/common.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [CommonModule, UsersModule],
  controllers: [NotificationsController, EmailWebhookController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
