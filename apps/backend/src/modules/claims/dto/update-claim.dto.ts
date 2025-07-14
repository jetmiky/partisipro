import {
  IsString,
  IsOptional,
  IsObject,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClaimStatus } from '../../../common/types';

export class UpdateClaimDto {
  @ApiProperty({
    description: 'Claim ID to update',
    example: 'claim_123abc',
  })
  @IsString()
  claimId: string;

  @ApiPropertyOptional({
    description: 'New claim status',
    enum: ClaimStatus,
    example: ClaimStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ClaimStatus)
  status?: ClaimStatus;

  @ApiPropertyOptional({
    description: 'New expiration date (ISO string)',
    example: '2025-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Updated claim data',
    example: { verificationLevel: 'enhanced' },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Reason for revocation (required if status is REVOKED)',
    example: 'Document expired or compromised',
  })
  @IsOptional()
  @IsString()
  revocationReason?: string;
}
