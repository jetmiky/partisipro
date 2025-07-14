import {
  IsString,
  IsArray,
  IsObject,
  IsEnum,
  IsEmail,
  IsUrl,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClaimTopic } from '../../../common/types';

export class IssuerMetadataDto {
  @ApiPropertyOptional({
    description: 'Company name of the trusted issuer',
    example: 'Verihubs Indonesia',
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({
    description: 'Website URL',
    example: 'https://verihubs.com',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    description: 'Contact email address',
    example: 'support@verihubs.com',
  })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'API endpoint for integration',
    example: 'https://api.verihubs.com/v1',
  })
  @IsOptional()
  @IsUrl()
  apiEndpoint?: string;

  @ApiPropertyOptional({
    description: 'Webhook URL for notifications',
    example: 'https://partisipro.com/api/webhooks/verihubs',
  })
  @IsOptional()
  @IsUrl()
  webhookUrl?: string;

  @ApiPropertyOptional({
    description: 'Supported regions for verification',
    example: ['Indonesia', 'Malaysia', 'Singapore'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedRegions?: string[];

  @ApiPropertyOptional({
    description: 'Available verification methods',
    example: ['document_verification', 'facial_recognition', 'liveness_check'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  verificationMethods?: string[];
}

export class CreateTrustedIssuerDto {
  @ApiProperty({
    description: 'Unique issuer address/identifier',
    example: 'verihubs_issuer_001',
  })
  @IsString()
  issuerAddress: string;

  @ApiProperty({
    description: 'Human-readable name for the trusted issuer',
    example: 'Verihubs Indonesia',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Claim topics this issuer is authorized to issue',
    enum: ClaimTopic,
    isArray: true,
    example: [ClaimTopic.KYC_APPROVED, ClaimTopic.ACCREDITED_INVESTOR],
  })
  @IsArray()
  @IsEnum(ClaimTopic, { each: true })
  authorizedClaims: ClaimTopic[];

  @ApiProperty({
    description: 'Metadata for the trusted issuer',
    type: IssuerMetadataDto,
  })
  @IsObject()
  metadata: IssuerMetadataDto;
}
