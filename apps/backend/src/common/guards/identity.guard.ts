import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IdentityService } from '../../modules/identity/identity.service';
import { ClaimsService } from '../../modules/claims/claims.service';
import { User, UserRole } from '../types';

@Injectable()
export class IdentityGuard implements CanActivate {
  private readonly logger = new Logger(IdentityGuard.name);

  constructor(
    private reflector: Reflector,
    @Inject(forwardRef(() => IdentityService))
    private identityService: IdentityService,
    @Inject(forwardRef(() => ClaimsService))
    private claimsService: ClaimsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Skip identity verification for admin users
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Check if user has identity registered
    const identity = await this.identityService.getIdentity(user.walletAddress);
    if (!identity) {
      this.logger.warn(
        `No identity found for user: ${user.id} (${user.walletAddress})`
      );
      throw new ForbiddenException(
        'Identity registration required. Please complete your identity verification.'
      );
    }

    // Check identity status
    if (identity.status !== 'verified') {
      this.logger.warn(
        `Identity not verified for user: ${user.id} - Status: ${identity.status}`
      );
      throw new ForbiddenException(
        `Identity verification required. Current status: ${identity.status}`
      );
    }

    // Attach identity to request for use by other guards/services
    request.identity = identity;

    return true;
  }
}
