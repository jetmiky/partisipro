import { IsString, IsOptional, IsEthereumAddress } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WhitelistSpvDto {
  @ApiProperty({ description: 'SPV wallet address' })
  @IsString()
  @IsEthereumAddress()
  spvAddress: string;

  @ApiProperty({ description: 'SPV company name' })
  @IsString()
  companyName: string;

  @ApiProperty({ description: 'SPV company registration number' })
  @IsString()
  registrationNumber: string;

  @ApiProperty({ description: 'Contact email' })
  @IsString()
  contactEmail: string;

  @ApiProperty({ description: 'Contact phone number' })
  @IsString()
  contactPhone: string;

  @ApiProperty({
    description: 'Additional notes about the SPV',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
