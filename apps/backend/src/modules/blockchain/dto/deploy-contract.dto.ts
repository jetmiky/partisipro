import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeployContractDto {
  @ApiProperty({ description: 'Project ID' })
  @IsString()
  projectId: string;

  @ApiProperty({ description: 'Contract type to deploy' })
  @IsString()
  contractType: string;

  @ApiProperty({ description: 'Contract constructor parameters' })
  @IsArray()
  @IsOptional()
  parameters?: any[];

  @ApiProperty({ description: 'Gas limit for deployment', required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  gasLimit?: number;
}
