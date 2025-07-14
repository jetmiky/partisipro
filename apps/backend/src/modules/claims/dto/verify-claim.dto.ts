import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyClaimDto {
  @ApiProperty({
    description: 'Claim ID to verify',
    example: 'claim_123abc',
  })
  @IsString()
  claimId: string;
}
