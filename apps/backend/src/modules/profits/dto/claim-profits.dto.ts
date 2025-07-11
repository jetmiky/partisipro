import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClaimProfitsDto {
  @ApiProperty({ description: 'Distribution ID to claim from' })
  @IsString()
  distributionId: string;

  @ApiProperty({
    description: 'Bank account number for payout',
    required: false,
  })
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiProperty({ description: 'Bank name for payout', required: false })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({ description: 'Account holder name', required: false })
  @IsOptional()
  @IsString()
  accountHolderName?: string;
}
