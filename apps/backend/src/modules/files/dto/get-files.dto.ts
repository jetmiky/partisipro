import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FileCategory } from './upload-file.dto';

export class GetFilesDto {
  @ApiProperty({
    description: 'Filter by file category',
    enum: FileCategory,
    required: false,
  })
  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;

  @ApiProperty({
    description: 'Filter by project ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiProperty({
    description: 'Filter by user ID (admin only)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;
}

export class GetUserFilesDto {
  @ApiProperty({
    description: 'Filter by file category',
    enum: FileCategory,
    required: false,
  })
  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;
}

export class GetProjectFilesDto {
  @ApiProperty({
    description: 'Filter by file category',
    enum: FileCategory,
    required: false,
  })
  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;
}
