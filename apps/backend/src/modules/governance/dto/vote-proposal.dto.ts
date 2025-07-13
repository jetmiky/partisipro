import { IsEnum, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export enum VoteOption {
  FOR = 'for',
  AGAINST = 'against',
  ABSTAIN = 'abstain',
}

export class VoteProposalDto {
  @IsString()
  @IsNotEmpty()
  proposalId: string;

  @IsEnum(VoteOption)
  vote: VoteOption;

  @IsString()
  @IsOptional()
  reason?: string;
}
