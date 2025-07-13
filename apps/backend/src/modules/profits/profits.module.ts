import { Module } from '@nestjs/common';
import { ProfitsService } from './profits.service';
import { ProfitsController } from './profits.controller';
import { ProjectsModule } from '../projects/projects.module';
import { InvestmentsModule } from '../investments/investments.module';
import { PaymentsModule } from '../payments/payments.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule, ProjectsModule, InvestmentsModule, PaymentsModule],
  controllers: [ProfitsController],
  providers: [ProfitsService],
  exports: [ProfitsService],
})
export class ProfitsModule {}
