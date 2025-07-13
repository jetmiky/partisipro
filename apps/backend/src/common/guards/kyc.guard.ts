import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

export const REQUIRE_KYC = 'require_kyc';

@Injectable()
export class KYCGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requireKYC = this.reflector.getAllAndOverride<boolean>(REQUIRE_KYC, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requireKYC) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.kyc?.status !== 'approved') {
      throw new ForbiddenException('KYC verification required');
    }

    return true;
  }
}

// Decorator to require KYC for specific endpoints
export const RequireKYC = () => {
  return (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor
  ) => {
    if (descriptor) {
      Reflect.defineMetadata(REQUIRE_KYC, true, descriptor.value);
    } else {
      Reflect.defineMetadata(REQUIRE_KYC, true, target);
    }
  };
};
