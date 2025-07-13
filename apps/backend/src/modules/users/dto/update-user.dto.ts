import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import {
  IsOptional,
  IsString,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAddressDto {
  @ApiProperty({ description: 'Street address' })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ description: 'Province' })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiProperty({ description: 'Postal code' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ description: 'Country' })
  @IsString()
  @IsOptional()
  country?: string;
}

export class UpdateProfileDto {
  @ApiProperty({ description: 'First name' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ description: 'Phone number' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ description: 'Date of birth' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({ description: 'Nationality' })
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiProperty({ description: 'Address', type: UpdateAddressDto })
  @ValidateNested()
  @Type(() => UpdateAddressDto)
  @IsOptional()
  address?: UpdateAddressDto;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ description: 'User profile', type: UpdateProfileDto })
  @ValidateNested()
  @Type(() => UpdateProfileDto)
  @IsOptional()
  profile?: UpdateProfileDto;
}
