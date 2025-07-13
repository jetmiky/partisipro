import {
  IsString,
  IsNumber,
  IsEmail,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  E_WALLET = 'e_wallet',
  VIRTUAL_ACCOUNT = 'virtual_account',
}

export enum PaymentType {
  INVESTMENT = 'investment',
  PROFIT_CLAIM = 'profit_claim',
  REFUND = 'refund',
}

export class InitiatePaymentDto {
  @ApiProperty({ description: 'User ID making the payment' })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Project ID for investment payments',
    required: false,
  })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiProperty({ description: 'Investment ID for tracking', required: false })
  @IsOptional()
  @IsString()
  investmentId?: string;

  @ApiProperty({ description: 'Payment amount in IDR', minimum: 100000 })
  @IsNumber()
  @Min(100000, { message: 'Minimum payment amount is IDR 100,000' })
  amount: number;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Payment type',
    enum: PaymentType,
  })
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiProperty({ description: 'User email for payment notifications' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User phone number' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ description: 'User full name' })
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'Payment description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Success redirect URL', required: false })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiProperty({ description: 'Failure redirect URL', required: false })
  @IsOptional()
  @IsString()
  failureUrl?: string;
}
