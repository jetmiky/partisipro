import {
  IsString,
  IsOptional,
  IsObject,
  IsEthereumAddress,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIdentityDto {
  @ApiProperty({
    description: 'User wallet address (EVM compatible)',
    example: '0x742d35Cc6634C0532925a3b8D404E9e937b1b5dE',
  })
  @IsString()
  @IsEthereumAddress()
  userAddress: string;

  @ApiProperty({
    description: 'Reference to existing user ID in users collection',
    example: 'user_123abc',
  })
  @IsString()
  userId: string;

  @ApiPropertyOptional({
    description: 'On-chain identity key for ERC-3643 compliance',
    example: '0x123abc...',
  })
  @IsOptional()
  @IsString()
  identityKey?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the identity',
    example: { source: 'web3auth', migrated: true },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
