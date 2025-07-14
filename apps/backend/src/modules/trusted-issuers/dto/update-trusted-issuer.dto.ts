import { IsString, IsArray, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ClaimTopic, IssuerStatus } from '../../../common/types';
import { IssuerMetadataDto } from './create-trusted-issuer.dto';

export class UpdateTrustedIssuerDto {
  @ApiPropertyOptional({
    description: 'Updated name for the trusted issuer',
    example: 'Verihubs Indonesia Ltd',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated authorized claim topics',
    enum: ClaimTopic,
    isArray: true,
    example: [ClaimTopic.KYC_APPROVED, ClaimTopic.INSTITUTIONAL_INVESTOR],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ClaimTopic, { each: true })
  authorizedClaims?: ClaimTopic[];

  @ApiPropertyOptional({
    description: 'New issuer status',
    enum: IssuerStatus,
    example: IssuerStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(IssuerStatus)
  status?: IssuerStatus;

  @ApiPropertyOptional({
    description: 'Updated metadata for the trusted issuer',
    type: IssuerMetadataDto,
  })
  @IsOptional()
  metadata?: Partial<IssuerMetadataDto>;
}
