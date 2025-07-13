import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ProposalType {
  UPGRADE = 'upgrade',
  PARAMETER_CHANGE = 'parameter_change',
  FUND_ALLOCATION = 'fund_allocation',
  OTHER = 'other',
}

export class ContractCallDto {
  @IsString()
  @IsNotEmpty()
  targetContract: string;

  @IsString()
  @IsNotEmpty()
  methodName: string;

  @IsArray()
  @IsOptional()
  parameters?: any[];
}

export class CreateProposalDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(ProposalType)
  type: ProposalType;

  @IsDateString()
  @IsOptional()
  votingStartDate?: string;

  @IsDateString()
  @IsOptional()
  votingEndDate?: string;

  @IsNumber()
  @IsOptional()
  quorum?: number; // minimum votes required (percentage)

  @IsNumber()
  @IsOptional()
  threshold?: number; // percentage needed to pass

  @ValidateNested()
  @Type(() => ContractCallDto)
  @IsOptional()
  contractCall?: ContractCallDto;
}
