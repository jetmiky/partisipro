import { Module } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { InvestmentsController } from './investments.controller';
import { ProjectsModule } from '../projects/projects.module';
import { PaymentsModule } from '../payments/payments.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule, ProjectsModule, PaymentsModule],
  controllers: [InvestmentsController],
  providers: [InvestmentsService],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}
