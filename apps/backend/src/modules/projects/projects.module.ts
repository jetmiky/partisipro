import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { IdentityModule } from '../identity/identity.module';
import { ClaimsModule } from '../claims/claims.module';

@Module({
  imports: [IdentityModule, ClaimsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
