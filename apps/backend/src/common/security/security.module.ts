import { Module, Global } from '@nestjs/common';
import { SecurityService } from '../services/security.service';
import { ComplianceService } from '../services/compliance.service';
import { SecurityInterceptor } from '../interceptors/security.interceptor';
import { MFAGuard } from '../guards/mfa.guard';
import { KYCGuard } from '../guards/kyc.guard';
import { DeviceGuard } from '../guards/device.guard';
import {
  ValidationPipe,
  SanitizationPipe,
  FileValidationPipe,
} from '../pipes/validation.pipe';
import {
  SecurityMiddleware,
  ApiKeyMiddleware,
} from '../middleware/security.middleware';
import {
  RateLimitMiddleware,
  StrictRateLimitMiddleware,
  AuthRateLimitMiddleware,
} from '../middleware/rate-limit.middleware';
import { AuditMiddleware } from '../middleware/audit.middleware';
import { CommonModule } from '../common.module';
import { AuthModule } from '../../modules/auth/auth.module';

@Global()
@Module({
  imports: [CommonModule, AuthModule],
  providers: [
    // Core Security Services
    SecurityService,
    ComplianceService,

    // Security Interceptors
    SecurityInterceptor,

    // Security Guards
    MFAGuard,
    KYCGuard,
    DeviceGuard,

    // Validation Pipes
    ValidationPipe,
    SanitizationPipe,
    FileValidationPipe,

    // Security Middleware
    SecurityMiddleware,
    ApiKeyMiddleware,
    RateLimitMiddleware,
    StrictRateLimitMiddleware,
    AuthRateLimitMiddleware,
    AuditMiddleware,
  ],
  exports: [
    // Export all security services and guards for use in other modules
    SecurityService,
    ComplianceService,
    SecurityInterceptor,
    MFAGuard,
    KYCGuard,
    DeviceGuard,
    ValidationPipe,
    SanitizationPipe,
    FileValidationPipe,
    SecurityMiddleware,
    ApiKeyMiddleware,
    RateLimitMiddleware,
    StrictRateLimitMiddleware,
    AuthRateLimitMiddleware,
    AuditMiddleware,
  ],
})
export class SecurityModule {}
