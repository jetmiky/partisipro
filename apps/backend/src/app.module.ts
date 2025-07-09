import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appConfig, firebaseConfig, jwtConfig, redisConfig } from './config';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [appConfig, firebaseConfig, jwtConfig, redisConfig],
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

    // Feature modules
    AuthModule,
    UsersModule,

    // TODO: Add remaining feature modules
    // ProjectsModule,
    // InvestmentsModule,
    // PaymentsModule,
    // KycModule,
    // ProfitsModule,
    // BlockchainModule,
    // AdminModule,
    // GovernanceModule,
    // NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
