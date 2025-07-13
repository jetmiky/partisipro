import {
  IsString,
  IsEmail,
  IsNotEmpty,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetupMFADto {
  @ApiProperty({
    description: 'User email for MFA setup',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

export class EnableMFADto {
  @ApiProperty({
    description: 'TOTP code from authenticator app',
    example: '123456',
  })
  @IsString({ message: 'TOTP code must be a string' })
  @IsNotEmpty({ message: 'TOTP code is required' })
  @Length(6, 6, { message: 'TOTP code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'TOTP code must contain only digits' })
  totpCode: string;
}

export class VerifyMFADto {
  @ApiProperty({
    description: 'TOTP code from authenticator app',
    example: '123456',
  })
  @IsString({ message: 'TOTP code must be a string' })
  @IsNotEmpty({ message: 'TOTP code is required' })
  @Length(6, 6, { message: 'TOTP code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'TOTP code must contain only digits' })
  totpCode: string;
}

export class VerifyBackupCodeDto {
  @ApiProperty({
    description: 'Backup code for MFA verification',
    example: 'A1B2C3D4',
  })
  @IsString({ message: 'Backup code must be a string' })
  @IsNotEmpty({ message: 'Backup code is required' })
  @Length(8, 8, { message: 'Backup code must be exactly 8 characters' })
  @Matches(/^[A-F0-9]{8}$/, {
    message: 'Backup code must be 8 hexadecimal characters',
  })
  backupCode: string;
}

export class DisableMFADto {
  @ApiProperty({
    description: 'TOTP code from authenticator app to confirm MFA disable',
    example: '123456',
  })
  @IsString({ message: 'TOTP code must be a string' })
  @IsNotEmpty({ message: 'TOTP code is required' })
  @Length(6, 6, { message: 'TOTP code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'TOTP code must contain only digits' })
  totpCode: string;
}

export class RegenerateBackupCodesDto {
  @ApiProperty({
    description:
      'TOTP code from authenticator app to confirm backup code regeneration',
    example: '123456',
  })
  @IsString({ message: 'TOTP code must be a string' })
  @IsNotEmpty({ message: 'TOTP code is required' })
  @Length(6, 6, { message: 'TOTP code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'TOTP code must contain only digits' })
  totpCode: string;
}
