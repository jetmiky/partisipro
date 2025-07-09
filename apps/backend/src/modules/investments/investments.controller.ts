import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common';
import { InvestmentsService } from './investments.service';

@ApiTags('Investments')
@Controller('investments')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
@ApiBearerAuth()
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  // TODO: Implement investment endpoints
}
