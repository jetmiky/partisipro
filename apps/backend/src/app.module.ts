import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appConfig, firebaseConfig, jwtConfig, web3authConfig } from './config';
import { CommonModule } from './common/common.module';
import { SecurityModule } from './common/security/security.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { InvestmentsModule } from './modules/investments/investments.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { KYCModule } from './modules/kyc/kyc.module';
import { ProfitsModule } from './modules/profits/profits.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { GovernanceModule } from './modules/governance/governance.module';
import { IdentityModule } from './modules/identity/identity.module';
import { ClaimsModule } from './modules/claims/claims.module';
import { TrustedIssuersModule } from './modules/trusted-issuers/trusted-issuers.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { FilesModule } from './modules/files/files.module';

// Security and monitoring middleware
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { AuditMiddleware } from './common/middleware/audit.middleware';
import {
  RateLimitMiddleware,
  AuthRateLimitMiddleware,
} from './common/middleware/rate-limit.middleware';
import { SecurityInterceptor } from './common/interceptors/security.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { HealthController } from './common/controllers/health.controller';
import { HealthService } from './common/services/health.service';
import { CacheService } from './common/services/cache.service';
import { MonitoringService } from './common/services/monitoring.service';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [appConfig, firebaseConfig, jwtConfig, web3authConfig],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60000', 10),
        limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      },
    ]),

    // Common module (Firebase, guards, etc.)
    CommonModule,
    SecurityModule,

    // Feature modules
    AuthModule,
    UsersModule,
    ProjectsModule,
    InvestmentsModule,
    PaymentsModule,
    KYCModule,
    ProfitsModule,
    BlockchainModule,
    AdminModule,
    NotificationsModule,
    GovernanceModule,

    // ERC-3643 Identity Infrastructure modules
    IdentityModule,
    ClaimsModule,
    TrustedIssuersModule,

    // Real-time WebSocket module
    RealtimeModule,

    // File management module
    FilesModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    HealthService,
    CacheService,
    MonitoringService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SecurityInterceptor,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply security middleware globally
    consumer
      .apply(SecurityMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });

    // Apply audit middleware globally
    consumer
      .apply(AuditMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });

    // Apply rate limiting middleware globally
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });

    // Apply stricter rate limiting for auth endpoints
    consumer
      .apply(AuthRateLimitMiddleware)
      .forRoutes(
        { path: '/auth/*', method: RequestMethod.ALL },
        { path: '/kyc/*', method: RequestMethod.ALL },
        { path: '/payments/*', method: RequestMethod.ALL }
      );
  }
}
