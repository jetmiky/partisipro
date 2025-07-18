import {
  IsBoolean,
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminUserDto {
  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@partisipro.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Admin first name',
    example: 'System',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Admin last name',
    example: 'Administrator',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Admin wallet address',
    example: '0x23ff0dc338DD32aC07Ce6bEA73e83bf62F919367',
  })
  @IsString()
  walletAddress: string;

  @ApiPropertyOptional({
    description: 'Admin phone number',
    example: '+62812345678',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class InitializeDataDto {
  @ApiPropertyOptional({
    description:
      'Force re-initialization even if platform is already initialized',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  forceReinitialize?: boolean;

  @ApiPropertyOptional({
    description: 'Include sample data for testing/development',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeSampleData?: boolean;

  @ApiPropertyOptional({
    description: 'Include development/testing data',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeDevData?: boolean;

  @ApiPropertyOptional({
    description: 'Admin user configuration',
    type: AdminUserDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUserDto)
  adminUser?: AdminUserDto;

  @ApiPropertyOptional({
    description: 'Environment type',
    enum: ['development', 'staging', 'production'],
    default: 'development',
  })
  @IsOptional()
  @IsEnum(['development', 'staging', 'production'])
  environment?: 'development' | 'staging' | 'production';

  @ApiPropertyOptional({
    description: 'Initialize identity registry with default claim topics',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  initializeIdentityRegistry?: boolean;

  @ApiPropertyOptional({
    description: 'Initialize trusted issuers',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  initializeTrustedIssuers?: boolean;

  @ApiPropertyOptional({
    description: 'Initialize system configurations',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  initializeSystemConfigs?: boolean;

  @ApiPropertyOptional({
    description: 'Skip Firebase Auth user creation (for existing users)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  skipFirebaseAuth?: boolean;
}
