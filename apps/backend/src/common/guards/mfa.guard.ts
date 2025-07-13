import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { SessionService } from '../../modules/auth/session.service';

export const REQUIRE_MFA = 'require_mfa';

@Injectable()
export class MFAGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private sessionService: SessionService
  ) {}

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    return this.validateMFA(context);
  }

  private async validateMFA(context: ExecutionContext): Promise<boolean> {
    const requireMFA = this.reflector.getAllAndOverride<boolean>(REQUIRE_MFA, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requireMFA) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Check if user has MFA enabled
    if (!user.mfaEnabled) {
      throw new ForbiddenException(
        'MFA must be enabled to access this resource'
      );
    }

    // Check if session has MFA verified
    const sessionId = request.sessionId;
    if (!sessionId) {
      throw new UnauthorizedException('Session not found');
    }

    const sessionData = await this.sessionService.getSession(sessionId);
    if (!sessionData) {
      throw new UnauthorizedException('Invalid session');
    }

    if (!sessionData.mfaVerified) {
      throw new ForbiddenException('MFA verification required');
    }

    return true;
  }
}

// Decorator to require MFA for specific endpoints
export const RequireMFA = () => {
  return (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor
  ) => {
    if (descriptor) {
      Reflect.defineMetadata(REQUIRE_MFA, true, descriptor.value);
    } else {
      Reflect.defineMetadata(REQUIRE_MFA, true, target);
    }
  };
};
