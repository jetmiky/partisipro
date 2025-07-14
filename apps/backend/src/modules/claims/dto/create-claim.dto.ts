import {
  IsString,
  IsOptional,
  IsObject,
  IsEnum,
  IsDateString,
  IsEthereumAddress,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClaimTopic } from '../../../common/types';

export class CreateClaimDto {
  @ApiProperty({
    description: 'Identity ID (wallet address) to issue claim for',
    example: '0x742d35Cc6634C0532925a3b8D404E9e937b1b5dE',
  })
  @IsString()
  @IsEthereumAddress()
  identityId: string;

  @ApiProperty({
    description: 'Type of claim being issued',
    enum: ClaimTopic,
    example: ClaimTopic.KYC_APPROVED,
  })
  @IsEnum(ClaimTopic)
  claimTopic: ClaimTopic;

  @ApiProperty({
    description: 'Trusted issuer ID/address',
    example: 'verihubs_issuer_001',
  })
  @IsString()
  issuer: string;

  @ApiProperty({
    description: 'Claim data payload',
    example: {
      verificationId: 'vh_123abc',
      verificationLevel: 'basic',
      documentTypes: ['identity_card', 'bank_statement'],
    },
  })
  @IsObject()
  data: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Claim expiration date (ISO string)',
    example: '2025-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'On-chain verification hash',
    example: '0xabc123...',
  })
  @IsOptional()
  @IsString()
  verificationHash?: string;
}
