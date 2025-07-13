import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentWebhookStatus {
  PENDING = 'pending',
  SETTLEMENT = 'settlement',
  SUCCESS = 'success',
  FAILURE = 'failure',
  CANCEL = 'cancel',
  EXPIRE = 'expire',
}

export class PaymentWebhookDto {
  @ApiProperty({ description: 'Transaction ID from payment gateway' })
  @IsString()
  transactionId: string;

  @ApiProperty({ description: 'Order ID from our system' })
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Payment amount in IDR' })
  @IsNumber()
  grossAmount: number;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentWebhookStatus,
  })
  @IsEnum(PaymentWebhookStatus)
  transactionStatus: PaymentWebhookStatus;

  @ApiProperty({ description: 'Payment type used' })
  @IsString()
  paymentType: string;

  @ApiProperty({ description: 'Transaction time' })
  @IsDateString()
  transactionTime: string;

  @ApiProperty({ description: 'Settlement time', required: false })
  @IsOptional()
  @IsDateString()
  settlementTime?: string;

  @ApiProperty({ description: 'Status message', required: false })
  @IsOptional()
  @IsString()
  statusMessage?: string;

  @ApiProperty({ description: 'Fraud status', required: false })
  @IsOptional()
  @IsString()
  fraudStatus?: string;

  @ApiProperty({
    description: 'Additional payment gateway data',
    required: false,
  })
  @IsOptional()
  gatewayData?: Record<string, any>;
}
