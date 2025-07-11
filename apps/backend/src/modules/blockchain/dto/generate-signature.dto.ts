import { IsString, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateSignatureDto {
  @ApiProperty({ description: 'Investor wallet address' })
  @IsString()
  investorAddress: string;

  @ApiProperty({ description: 'Investment amount' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ description: 'Project ID' })
  @IsString()
  projectId: string;

  @ApiProperty({ description: 'Token amount' })
  @IsNumber()
  @IsPositive()
  tokenAmount: number;

  @ApiProperty({ description: 'Nonce for signature uniqueness' })
  @IsString()
  nonce: string;
}
