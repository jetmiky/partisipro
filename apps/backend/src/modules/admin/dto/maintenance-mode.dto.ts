import { IsBoolean, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MaintenanceModeDto {
  @ApiProperty({ description: 'Enable or disable maintenance mode' })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({
    description: 'Maintenance message to display to users',
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({
    description: 'Estimated maintenance end time',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  estimatedEndTime?: string;

  @ApiProperty({ description: 'Reason for maintenance', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
