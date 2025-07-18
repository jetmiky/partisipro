import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { InitializationController } from './initialization.controller';
import { InitializationService } from './initialization.service';
import { UsersModule } from '../users/users.module';
import { ProjectsModule } from '../projects/projects.module';
import { InvestmentsModule } from '../investments/investments.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { IdentityModule } from '../identity/identity.module';
import { ClaimsModule } from '../claims/claims.module';
import { TrustedIssuersModule } from '../trusted-issuers/trusted-issuers.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    CommonModule,
    UsersModule,
    ProjectsModule,
    InvestmentsModule,
    BlockchainModule,
    IdentityModule,
    ClaimsModule,
    TrustedIssuersModule,
  ],
  controllers: [AdminController, InitializationController],
  providers: [AdminService, InitializationService],
  exports: [AdminService, InitializationService],
})
export class AdminModule {}
