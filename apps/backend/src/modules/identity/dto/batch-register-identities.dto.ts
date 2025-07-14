import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateIdentityDto } from './create-identity.dto';

export class BatchRegisterIdentitiesDto {
  @ApiProperty({
    description: 'Array of identity data to register',
    type: [CreateIdentityDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIdentityDto)
  identities: CreateIdentityDto[];
}
