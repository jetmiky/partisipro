import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { MFAService } from './mfa.service';
import { SessionService } from './session.service';
import { Web3AuthService } from './web3auth.service';
import { FirebaseAuthService } from './firebase-auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    CommonModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    MFAService,
    SessionService,
    Web3AuthService,
    FirebaseAuthService,
    JwtStrategy,
  ],
  exports: [
    AuthService,
    MFAService,
    SessionService,
    Web3AuthService,
    FirebaseAuthService,
    JwtStrategy,
  ],
})
export class AuthModule {}
