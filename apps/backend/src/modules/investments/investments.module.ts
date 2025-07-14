import { Module, forwardRef } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { InvestmentsController } from './investments.controller';
import { ProjectsModule } from '../projects/projects.module';
import { PaymentsModule } from '../payments/payments.module';
import { CommonModule } from '../../common/common.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { IdentityModule } from '../identity/identity.module';
import { ClaimsModule } from '../claims/claims.module';

@Module({
  imports: [
    CommonModule,
    ProjectsModule,
    PaymentsModule,
    IdentityModule,
    ClaimsModule,
    forwardRef(() => RealtimeModule),
  ],
  controllers: [InvestmentsController],
  providers: [InvestmentsService],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}
