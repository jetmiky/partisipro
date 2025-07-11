import {
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DistributeProfitsDto {
  @ApiProperty({ description: 'Project ID' })
  @IsString()
  projectId: string;

  @ApiProperty({ description: 'Total profit amount in IDR' })
  @IsNumber()
  @IsPositive()
  totalProfit: number;

  @ApiProperty({ description: 'Distribution period start date' })
  @IsDateString()
  periodStartDate: string;

  @ApiProperty({ description: 'Distribution period end date' })
  @IsDateString()
  periodEndDate: string;

  @ApiProperty({ description: 'Quarter number (1-4)' })
  @IsNumber()
  @IsPositive()
  quarter: number;

  @ApiProperty({ description: 'Year of the distribution' })
  @IsNumber()
  @IsPositive()
  year: number;

  @ApiProperty({
    description: 'Additional notes about the distribution',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
