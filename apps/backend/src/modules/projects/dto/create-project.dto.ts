import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ProjectCategory {
  TRANSPORTATION = 'transportation',
  ENERGY = 'energy',
  WATER = 'water',
  TELECOMMUNICATIONS = 'telecommunications',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
}

export enum ProjectStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class CreateProjectDto {
  @ApiProperty({ description: 'Project name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Project description' })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Project category',
    enum: ProjectCategory,
  })
  @IsEnum(ProjectCategory)
  category: ProjectCategory;

  @ApiProperty({ description: 'Project location (province)' })
  @IsString()
  province: string;

  @ApiProperty({ description: 'Project location (city)' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'Total project value in IDR' })
  @IsNumber()
  @Min(1000000000, { message: 'Minimum project value is IDR 1 billion' })
  totalValue: number;

  @ApiProperty({ description: 'Token price in IDR' })
  @IsNumber()
  @Min(100000, { message: 'Minimum token price is IDR 100,000' })
  tokenPrice: number;

  @ApiProperty({ description: 'Total number of tokens to be issued' })
  @IsNumber()
  @Min(1000, { message: 'Minimum token supply is 1,000 tokens' })
  totalTokens: number;

  @ApiProperty({ description: 'Minimum investment amount in IDR' })
  @IsNumber()
  @Min(100000, { message: 'Minimum investment amount is IDR 100,000' })
  minimumInvestment: number;

  @ApiProperty({ description: 'Maximum investment amount in IDR' })
  @IsNumber()
  maximumInvestment: number;

  @ApiProperty({ description: 'Token symbol (e.g., TOLL01)' })
  @IsString()
  tokenSymbol: string;

  @ApiProperty({ description: 'Full token name' })
  @IsString()
  tokenName: string;

  @ApiProperty({ description: 'Offering start date' })
  @IsDateString()
  offeringStartDate: string;

  @ApiProperty({ description: 'Offering end date' })
  @IsDateString()
  offeringEndDate: string;

  @ApiProperty({ description: 'Concession start date' })
  @IsDateString()
  concessionStartDate: string;

  @ApiProperty({ description: 'Concession end date' })
  @IsDateString()
  concessionEndDate: string;

  @ApiProperty({ description: 'Expected annual return percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  expectedAnnualReturn: number;

  @ApiProperty({ description: 'Project risk level (1-5)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  riskLevel: number;

  @ApiProperty({ description: 'Project documents URLs', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentUrls?: string[];

  @ApiProperty({ description: 'Additional project details', required: false })
  @IsOptional()
  @IsString()
  additionalDetails?: string;
}
