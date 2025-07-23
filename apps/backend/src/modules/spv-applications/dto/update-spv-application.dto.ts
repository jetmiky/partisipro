import { PartialType } from '@nestjs/swagger';
import { SubmitSpvApplicationDto } from './submit-spv-application.dto';

export class UpdateSpvApplicationDto extends PartialType(
  SubmitSpvApplicationDto
) {}
