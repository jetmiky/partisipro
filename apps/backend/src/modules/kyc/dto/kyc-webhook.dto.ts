import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum KYCWebhookStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REQUIRES_REVIEW = 'requires_review',
}

export class KYCWebhookDto {
  @ApiProperty({ description: 'KYC session ID' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'KYC verification status',
    enum: KYCWebhookStatus,
  })
  @IsEnum(KYCWebhookStatus)
  status: KYCWebhookStatus;

  @ApiProperty({ description: 'Verification completion timestamp' })
  @IsDateString()
  completedAt: string;

  @ApiProperty({
    description: 'Reason for rejection or additional info',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ description: 'Confidence score (0-100)', required: false })
  @IsOptional()
  @IsString()
  confidenceScore?: string;
}
