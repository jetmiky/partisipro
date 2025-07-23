import { IsString, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewSpvApplicationDto {
  @ApiProperty({ description: 'SPV application ID' })
  @IsString()
  applicationId: string;

  @ApiProperty({
    description: 'Review action to take',
    enum: ['approve', 'reject'],
  })
  @IsString()
  @IsIn(['approve', 'reject'])
  action: 'approve' | 'reject';

  @ApiPropertyOptional({ description: 'Review notes from admin' })
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
