import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  Logger,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto, UpdatePreferencesDto } from './dto';
import { UserRole, User } from '../../common/types';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({
    status: 200,
    description: 'User notifications retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of notifications to return',
  })
  @ApiQuery({
    name: 'startAfter',
    required: false,
    type: String,
    description: 'Pagination cursor',
  })
  async getUserNotifications(
    @CurrentUser() user: User,
    @Query('limit') limit?: number,
    @Query('startAfter') startAfter?: string
  ) {
    this.logger.log(`Fetching notifications for user: ${user.id}`);

    const notifications = await this.notificationsService.getUserNotifications(
      user.id,
      limit ? parseInt(limit.toString()) : 50,
      startAfter
    );

    return {
      success: true,
      data: notifications,
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(@CurrentUser() user: User) {
    this.logger.log(`Fetching unread count for user: ${user.id}`);

    const count = await this.notificationsService.getUnreadCount(user.id);

    return {
      success: true,
      data: { count },
    };
  }

  @Put(':id/mark-read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAsRead(@Param('id') id: string, @CurrentUser() user: User) {
    this.logger.log(`Marking notification as read: ${id} for user: ${user.id}`);

    await this.notificationsService.markAsRead(id, user.id);

    return {
      success: true,
      message: 'Notification marked as read successfully',
    };
  }

  @Put('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllAsRead(@CurrentUser() user: User) {
    this.logger.log(`Marking all notifications as read for user: ${user.id}`);

    await this.notificationsService.markAllAsRead(user.id);

    return {
      success: true,
      message: 'All notifications marked as read successfully',
    };
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiResponse({
    status: 200,
    description: 'Notification preferences retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPreferences(@CurrentUser() user: User) {
    this.logger.log(`Fetching notification preferences for user: ${user.id}`);

    const preferences = await this.notificationsService.getUserPreferences(
      user.id
    );

    return {
      success: true,
      data: preferences,
    };
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({
    status: 200,
    description: 'Notification preferences updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid preferences data',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePreferences(
    @CurrentUser() user: User,
    @Body() updatePreferencesDto: UpdatePreferencesDto
  ) {
    this.logger.log(`Updating notification preferences for user: ${user.id}`);

    const preferences = await this.notificationsService.updatePreferences(
      user.id,
      updatePreferencesDto
    );

    return {
      success: true,
      message: 'Notification preferences updated successfully',
      data: preferences,
    };
  }

  @Post('send')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Send notification (Admin only)' })
  @ApiResponse({ status: 201, description: 'Notification sent successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid notification data',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async sendNotification(
    @CurrentUser() user: User,
    @Body() sendNotificationDto: SendNotificationDto
  ) {
    this.logger.log(`Sending notification by admin: ${user.id}`);

    const notifications =
      await this.notificationsService.sendNotification(sendNotificationDto);

    return {
      success: true,
      message: 'Notification sent successfully',
      data: {
        sentCount: notifications.length,
        notifications: notifications,
      },
    };
  }

  @Post('system')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Send system notification to all users (Admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'System notification sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid notification data',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async sendSystemNotification(
    @CurrentUser() user: User,
    @Body()
    body: { title: string; message: string; priority?: string; data?: any }
  ) {
    this.logger.log(`Sending system notification by admin: ${user.id}`);

    await this.notificationsService.sendSystemNotification(
      body.title,
      body.message,
      body.priority as any,
      body.data
    );

    return {
      success: true,
      message: 'System notification sent successfully',
    };
  }
}
