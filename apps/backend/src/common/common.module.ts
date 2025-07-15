import {
  Global,
  Module,
  // forwardRef
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseService } from './services/firebase.service';
import { FirebaseStorageService } from './services/firebase-storage.service';
import { FirebaseAuthService } from './services/firebase-auth.service';
import { EmailService } from './services/email.service';
import { ConnectionPoolService } from './services/connection-pool.service';
import { MonitoringService } from './services/monitoring.service';
import { CacheService } from './services/cache.service';
import { HealthService } from './services/health.service';
import { ResourceManagerService } from './services/resource-manager.service';
import { FunctionWarmingService } from './services/function-warming.service';
import { ConnectionOptimizationService } from './services/connection-optimization.service';
import { FirebaseMonitoringService } from './services/firebase-monitoring.service';
import { Web3AuthService } from '../modules/auth/web3auth.service';
import emailConfig from '../config/email.config';

@Global()
@Module({
  imports: [ConfigModule.forFeature(emailConfig)],
  providers: [
    FirebaseService,
    FirebaseStorageService,
    Web3AuthService,
    FirebaseAuthService,
    EmailService,
    ConnectionPoolService,
    MonitoringService,
    CacheService,
    HealthService,
    ResourceManagerService,
    FunctionWarmingService,
    ConnectionOptimizationService,
    FirebaseMonitoringService,
  ],
  exports: [
    FirebaseService,
    FirebaseStorageService,
    Web3AuthService,
    FirebaseAuthService,
    EmailService,
    ConnectionPoolService,
    MonitoringService,
    CacheService,
    HealthService,
    ResourceManagerService,
    FunctionWarmingService,
    ConnectionOptimizationService,
    FirebaseMonitoringService,
  ],
})
export class CommonModule {}
