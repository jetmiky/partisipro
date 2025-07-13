import { IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum InvestmentType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
}

export class CreateInvestmentDto {
  @ApiProperty({ description: 'Project ID to invest in' })
  @IsString()
  projectId: string;

  @ApiProperty({ description: 'Investment amount in IDR' })
  @IsNumber()
  @Min(100000, { message: 'Minimum investment amount is IDR 100,000' })
  investmentAmount: number;

  @ApiProperty({ description: 'Number of tokens to purchase' })
  @IsNumber()
  @Min(1, { message: 'Must purchase at least 1 token' })
  tokenAmount: number;

  @ApiProperty({
    description: 'Investment type',
    enum: InvestmentType,
    default: InvestmentType.PRIMARY,
  })
  @IsEnum(InvestmentType)
  investmentType: InvestmentType = InvestmentType.PRIMARY;

  @ApiProperty({ description: 'User email for notifications' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'User phone number' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ description: 'User full name' })
  @IsString()
  fullName: string;
}
