import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { FirebaseService } from '../services/firebase.service';
import * as crypto from 'crypto';

export const REQUIRE_TRUSTED_DEVICE = 'require_trusted_device';

@Injectable()
export class DeviceGuard implements CanActivate {
  private readonly logger = new Logger(DeviceGuard.name);

  constructor(
    private reflector: Reflector,
    private firebaseService: FirebaseService
  ) {}

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    return this.validateDevice(context);
  }

  private async validateDevice(context: ExecutionContext): Promise<boolean> {
    const requireTrustedDevice = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_TRUSTED_DEVICE,
      [context.getHandler(), context.getClass()]
    );

    if (!requireTrustedDevice) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const deviceFingerprint = this.generateDeviceFingerprint(request);
    const trustedDevices = await this.getTrustedDevices(user.sub);

    // Check if device is trusted
    const isTrusted = trustedDevices.some(
      device => device.fingerprint === deviceFingerprint
    );

    if (!isTrusted) {
      // Log suspicious activity
      this.logger.warn(`Untrusted device access attempt for user: ${user.sub}`);

      // Store device information for potential approval
      await this.storeUnknownDevice(user.sub, deviceFingerprint, request);

      throw new ForbiddenException(
        'Device not trusted. Please verify your device.'
      );
    }

    return true;
  }

  private generateDeviceFingerprint(request: any): string {
    const userAgent = request.get('User-Agent') || '';
    const acceptLanguage = request.get('Accept-Language') || '';
    const acceptEncoding = request.get('Accept-Encoding') || '';

    // Create a device fingerprint based on headers
    const fingerprint = crypto
      .createHash('sha256')
      .update(userAgent + acceptLanguage + acceptEncoding)
      .digest('hex');

    return fingerprint;
  }

  private async getTrustedDevices(userId: string): Promise<any[]> {
    try {
      const devicesSnapshot = await this.firebaseService
        .getCollection(`users/${userId}/trusted_devices`)
        .get();

      return devicesSnapshot.docs.map((doc: any) => doc.data());
    } catch (error) {
      this.logger.error(
        `Failed to get trusted devices for user ${userId}:`,
        error
      );
      return [];
    }
  }

  private async storeUnknownDevice(
    userId: string,
    fingerprint: string,
    request: any
  ): Promise<void> {
    try {
      const deviceInfo = {
        fingerprint,
        userAgent: request.get('User-Agent') || '',
        ipAddress: request.ip || request.connection.remoteAddress || 'unknown',
        firstSeen: new Date(),
        trusted: false,
        approvalRequired: true,
      };

      await this.firebaseService.setDocument(
        `users/${userId}/unknown_devices`,
        fingerprint,
        deviceInfo
      );
    } catch (error) {
      this.logger.error(
        `Failed to store unknown device for user ${userId}:`,
        error
      );
    }
  }
}

// Decorator to require trusted device for specific endpoints
export const RequireTrustedDevice = () => {
  return (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor
  ) => {
    if (descriptor) {
      Reflect.defineMetadata(REQUIRE_TRUSTED_DEVICE, true, descriptor.value);
    } else {
      Reflect.defineMetadata(REQUIRE_TRUSTED_DEVICE, true, target);
    }
  };
};
