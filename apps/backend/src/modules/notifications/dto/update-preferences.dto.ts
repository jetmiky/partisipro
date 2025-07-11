import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePreferencesDto {
  @ApiProperty({
    description: 'Enable investment notifications',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  investmentNotifications?: boolean;

  @ApiProperty({ description: 'Enable profit notifications', required: false })
  @IsOptional()
  @IsBoolean()
  profitNotifications?: boolean;

  @ApiProperty({
    description: 'Enable governance notifications',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  governanceNotifications?: boolean;

  @ApiProperty({ description: 'Enable system notifications', required: false })
  @IsOptional()
  @IsBoolean()
  systemNotifications?: boolean;

  @ApiProperty({ description: 'Enable KYC notifications', required: false })
  @IsOptional()
  @IsBoolean()
  kycNotifications?: boolean;

  @ApiProperty({ description: 'Enable push notifications', required: false })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @ApiProperty({ description: 'Enable email notifications', required: false })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;
}
