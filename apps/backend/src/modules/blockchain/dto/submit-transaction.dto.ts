import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitTransactionDto {
  @ApiProperty({ description: 'Transaction data (hex string)' })
  @IsString()
  transactionData: string;

  @ApiProperty({ description: 'Target contract address' })
  @IsString()
  contractAddress: string;

  @ApiProperty({ description: 'Gas limit', required: false })
  @IsOptional()
  @IsNumber()
  gasLimit?: number;

  @ApiProperty({ description: 'Gas price', required: false })
  @IsOptional()
  @IsNumber()
  gasPrice?: number;

  @ApiProperty({ description: 'Transaction value in wei', required: false })
  @IsOptional()
  @IsString()
  value?: string;
}
