import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsEthereumAddress,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClaimTopic } from '../../../common/types';

export class VerifyIdentityDto {
  @ApiProperty({
    description: 'User wallet address to verify',
    example: '0x742d35Cc6634C0532925a3b8D404E9e937b1b5dE',
  })
  @IsString()
  @IsEthereumAddress()
  userAddress: string;

  @ApiPropertyOptional({
    description: 'Required claims for verification',
    enum: ClaimTopic,
    isArray: true,
    example: [ClaimTopic.KYC_APPROVED],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ClaimTopic, { each: true })
  requiredClaims?: ClaimTopic[];
}
