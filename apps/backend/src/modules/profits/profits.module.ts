import { Module, forwardRef } from '@nestjs/common';
import { ProfitsService } from './profits.service';
import { ProfitsController } from './profits.controller';
import { ProjectsModule } from '../projects/projects.module';
import { InvestmentsModule } from '../investments/investments.module';
import { PaymentsModule } from '../payments/payments.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { CommonModule } from '../../common/common.module';
import { IdentityModule } from '../identity/identity.module';
import { ClaimsModule } from '../claims/claims.module';

@Module({
  imports: [
    CommonModule,
    ProjectsModule,
    InvestmentsModule,
    PaymentsModule,
    IdentityModule,
    ClaimsModule,
    forwardRef(() => RealtimeModule),
  ],
  controllers: [ProfitsController],
  providers: [ProfitsService],
  exports: [ProfitsService],
})
export class ProfitsModule {}
