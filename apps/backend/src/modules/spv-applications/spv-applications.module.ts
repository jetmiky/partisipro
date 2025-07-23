import { Module } from '@nestjs/common';
import { SpvApplicationsController } from './spv-applications.controller';
import { SpvApplicationsService } from './spv-applications.service';
import { CommonModule } from '../../common/common.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [CommonModule, UsersModule, NotificationsModule, FilesModule],
  controllers: [SpvApplicationsController],
  providers: [SpvApplicationsService],
  exports: [SpvApplicationsService],
})
export class SpvApplicationsModule {}
