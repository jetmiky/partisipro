import { Module } from '@nestjs/common';
import { GovernanceController } from './governance.controller';
import { GovernanceService } from './governance.service';
import { CommonModule } from '../../common/common.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { ProjectsModule } from '../projects/projects.module';
import { InvestmentsModule } from '../investments/investments.module';

@Module({
  imports: [CommonModule, BlockchainModule, ProjectsModule, InvestmentsModule],
  controllers: [GovernanceController],
  providers: [GovernanceService],
  exports: [GovernanceService],
})
export class GovernanceModule {}
