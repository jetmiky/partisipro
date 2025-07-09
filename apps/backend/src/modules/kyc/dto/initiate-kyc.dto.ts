import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum KYCDocumentType {
  NATIONAL_ID = 'national_id',
  PASSPORT = 'passport',
  DRIVING_LICENSE = 'driving_license',
  SELFIE = 'selfie',
}

export class InitiateKYCDto {
  @ApiProperty({ description: 'User ID for KYC verification' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Full name of the user' })
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'Phone number' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ description: 'Date of birth in YYYY-MM-DD format' })
  @IsString()
  dateOfBirth: string;

  @ApiProperty({ description: 'Nationality' })
  @IsString()
  nationality: string;

  @ApiProperty({ description: 'Address' })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Document type for verification',
    enum: KYCDocumentType,
  })
  @IsEnum(KYCDocumentType)
  documentType: KYCDocumentType;

  @ApiProperty({ description: 'Document number' })
  @IsString()
  documentNumber: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
