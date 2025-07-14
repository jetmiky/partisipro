import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UpdateClaimDto } from './update-claim.dto';

export class BatchUpdateClaimsDto {
  @ApiProperty({
    description: 'Array of claim updates to process',
    type: [UpdateClaimDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateClaimDto)
  updates: UpdateClaimDto[];
}
