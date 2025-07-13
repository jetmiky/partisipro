import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseService } from './services/firebase.service';
import { EmailService } from './services/email.service';
import { ConnectionPoolService } from './services/connection-pool.service';
import { MonitoringService } from './services/monitoring.service';
import { CacheService } from './services/cache.service';
import { HealthService } from './services/health.service';
import { ResourceManagerService } from './services/resource-manager.service';
import emailConfig from '../config/email.config';

@Global()
@Module({
  imports: [ConfigModule.forFeature(emailConfig)],
  providers: [
    FirebaseService,
    EmailService,
    ConnectionPoolService,
    MonitoringService,
    CacheService,
    HealthService,
    ResourceManagerService,
  ],
  exports: [
    FirebaseService,
    EmailService,
    ConnectionPoolService,
    MonitoringService,
    CacheService,
    HealthService,
    ResourceManagerService,
  ],
})
export class CommonModule {}
