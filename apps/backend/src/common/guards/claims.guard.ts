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
import { ClaimsService } from '../../modules/claims/claims.service';
import { User, UserRole, ClaimTopic } from '../types';

@Injectable()
export class ClaimsGuard implements CanActivate {
  private readonly logger = new Logger(ClaimsGuard.name);

  constructor(
    private reflector: Reflector,
    @Inject(forwardRef(() => ClaimsService))
    private claimsService: ClaimsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required claims from decorator
    const requiredClaims =
      this.reflector.get<ClaimTopic[]>('claims', context.getHandler()) ||
      this.reflector.get<ClaimTopic[]>('claims', context.getClass());

    if (!requiredClaims || requiredClaims.length === 0) {
      return true; // No claims required
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;
    const identity = request.identity;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Skip claims verification for admin users
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    if (!identity) {
      throw new ForbiddenException('Identity verification required');
    }

    // Verify required claims
    const hasValidClaims = await this.claimsService.verifyRequiredClaims(
      identity.id,
      requiredClaims
    );

    if (!hasValidClaims) {
      this.logger.warn(
        `Required claims missing for user: ${user.id} - Required: ${requiredClaims.join(', ')}`
      );
      throw new ForbiddenException(
        `Required verification missing: ${requiredClaims.join(', ')}`
      );
    }

    this.logger.log(
      `Claims verified for user: ${user.id} - Claims: ${requiredClaims.join(', ')}`
    );
    return true;
  }
}
