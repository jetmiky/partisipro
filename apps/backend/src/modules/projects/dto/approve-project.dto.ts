import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ApprovalAction {
  APPROVE = 'approve',
  REJECT = 'reject',
}

export class ApproveProjectDto {
  @ApiProperty({
    description: 'Approval action',
    enum: ApprovalAction,
  })
  @IsEnum(ApprovalAction)
  action: ApprovalAction;

  @ApiProperty({ description: 'Approval or rejection reason', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ description: 'Additional notes from admin', required: false })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
