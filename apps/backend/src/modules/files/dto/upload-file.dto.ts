import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum FileCategory {
  KYC = 'kyc',
  IDENTITY = 'identity',
  PROFILE = 'profile',
  PROJECT_LEGAL = 'project-legal',
  PROJECT_FINANCIAL = 'project-financial',
  PROJECT_MARKETING = 'project-marketing',
  PLATFORM = 'platform',
  TEMP = 'temp',
}

export class UploadFileDto {
  @ApiProperty({
    description: 'File category',
    enum: FileCategory,
    example: FileCategory.KYC,
  })
  @IsEnum(FileCategory)
  category: FileCategory;

  @ApiProperty({
    description: 'Project ID (required for project-related files)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiProperty({
    description: 'Custom path for file storage',
    example: 'custom/path/to/file',
    required: false,
  })
  @IsOptional()
  @IsString()
  customPath?: string;

  @ApiProperty({
    description: 'Make file publicly accessible',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  makePublic?: boolean;
}
