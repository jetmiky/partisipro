import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { ProjectsModule } from '../projects/projects.module';
import { InvestmentsModule } from '../investments/investments.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    CommonModule,
    UsersModule,
    ProjectsModule,
    InvestmentsModule,
    BlockchainModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
