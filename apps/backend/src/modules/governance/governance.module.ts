import { Module, forwardRef } from '@nestjs/common';
import { GovernanceController } from './governance.controller';
import { GovernanceService } from './governance.service';
import { CommonModule } from '../../common/common.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { ProjectsModule } from '../projects/projects.module';
import { InvestmentsModule } from '../investments/investments.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { IdentityModule } from '../identity/identity.module';
import { ClaimsModule } from '../claims/claims.module';

@Module({
  imports: [
    CommonModule,
    BlockchainModule,
    ProjectsModule,
    InvestmentsModule,
    IdentityModule,
    ClaimsModule,
    forwardRef(() => RealtimeModule),
  ],
  controllers: [GovernanceController],
  providers: [GovernanceService],
  exports: [GovernanceService],
})
export class GovernanceModule {}
