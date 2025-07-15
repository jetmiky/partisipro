import { ApiProperty } from '@nestjs/swagger';

export class FileMetadataDto {
  @ApiProperty({
    description: 'Original file name',
    example: 'document.pdf',
  })
  originalName: string;

  @ApiProperty({
    description: 'Stored file name',
    example: 'uuid_2024-01-15_document.pdf',
  })
  fileName: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  fileSize: number;

  @ApiProperty({
    description: 'File content type',
    example: 'application/pdf',
  })
  contentType: string;

  @ApiProperty({
    description: 'User ID who uploaded the file',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  uploadedBy: string;

  @ApiProperty({
    description: 'Upload timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  uploadedAt: Date;

  @ApiProperty({
    description: 'File download URL',
    example: 'https://storage.googleapis.com/bucket/path/to/file',
    required: false,
  })
  downloadUrl?: string;

  @ApiProperty({
    description: 'File path in storage bucket',
    example: 'users/user-id/kyc-documents/filename',
  })
  bucketPath: string;
}

export class FileUploadResponseDto {
  @ApiProperty({
    description: 'Unique file identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  fileId: string;

  @ApiProperty({
    description: 'File download URL',
    example: 'https://storage.googleapis.com/bucket/path/to/file',
  })
  downloadUrl: string;

  @ApiProperty({
    description: 'File metadata',
    type: FileMetadataDto,
  })
  metadata: FileMetadataDto;
}

export class FileDownloadResponseDto {
  @ApiProperty({
    description: 'File metadata',
    type: FileMetadataDto,
  })
  metadata: FileMetadataDto;

  @ApiProperty({
    description: 'File download URL',
    example: 'https://storage.googleapis.com/bucket/path/to/file',
  })
  downloadUrl: string;
}

export class FileListResponseDto {
  @ApiProperty({
    description: 'List of files',
    type: [FileMetadataDto],
  })
  files: FileMetadataDto[];

  @ApiProperty({
    description: 'Total number of files',
    example: 10,
  })
  total: number;
}
