import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/types';

export class CreateUserDto {
  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User wallet address' })
  @IsString()
  walletAddress: string;

  @ApiProperty({ description: 'Web3Auth user ID' })
  @IsString()
  web3AuthId: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    default: UserRole.INVESTOR,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ description: 'User active status', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
