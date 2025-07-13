import {
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFeesDto {
  @ApiProperty({
    description: 'Platform listing fee percentage (0-100)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  listingFeePercentage?: number;

  @ApiProperty({
    description: 'Platform management fee percentage (0-100)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  managementFeePercentage?: number;

  @ApiProperty({ description: 'Transaction fee in IDR', required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  transactionFee?: number;

  @ApiProperty({
    description: 'Minimum investment amount in IDR',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  minimumInvestment?: number;

  @ApiProperty({
    description: 'Maximum investment amount in IDR',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  maximumInvestment?: number;

  @ApiProperty({ description: 'Reason for fee update', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
