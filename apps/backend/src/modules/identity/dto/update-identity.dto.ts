import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IdentityStatus } from '../../../common/types';

export class UpdateIdentityStatusDto {
  @ApiProperty({
    description: 'New identity status',
    enum: IdentityStatus,
    example: IdentityStatus.VERIFIED,
  })
  @IsEnum(IdentityStatus)
  status: IdentityStatus;

  @ApiPropertyOptional({
    description: 'Reason for status change',
    example: 'KYC verification completed successfully',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
