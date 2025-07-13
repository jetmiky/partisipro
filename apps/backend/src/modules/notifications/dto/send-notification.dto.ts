import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum NotificationType {
  INVESTMENT = 'investment',
  PROFIT = 'profit',
  GOVERNANCE = 'governance',
  SYSTEM = 'system',
  KYC = 'kyc',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export class SendNotificationDto {
  @ApiProperty({
    description: 'User ID to send notification to',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'User IDs to send notification to (bulk)',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification message' })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Notification priority',
    enum: NotificationPriority,
  })
  @IsEnum(NotificationPriority)
  priority: NotificationPriority;

  @ApiProperty({ description: 'Additional data', required: false })
  @IsOptional()
  data?: any;

  @ApiProperty({ description: 'Send push notification', required: false })
  @IsOptional()
  @IsBoolean()
  sendPush?: boolean;

  @ApiProperty({ description: 'Send email notification', required: false })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}
