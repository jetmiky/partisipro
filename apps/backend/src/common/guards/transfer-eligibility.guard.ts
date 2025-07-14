import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ClaimsService } from '../../modules/claims/claims.service';
import { IdentityService } from '../../modules/identity/identity.service';
import { User, UserRole, ClaimTopic } from '../types';

/**
 * ERC-3643 compliant transfer eligibility guard
 * Verifies that both parties in a transaction have valid identity and claims
 */
@Injectable()
export class TransferEligibilityGuard implements CanActivate {
  private readonly logger = new Logger(TransferEligibilityGuard.name);

  constructor(
    @Inject(forwardRef(() => IdentityService))
    private identityService: IdentityService,
    @Inject(forwardRef(() => ClaimsService))
    private claimsService: ClaimsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;
    const { from, to, amount, tokenAddress } = request.body;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Skip for admin operations
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Verify both parties have valid identities and claims
    const isEligible = await this.verifyTransferEligibility(
      from,
      to,
      amount,
      tokenAddress
    );

    if (!isEligible) {
      this.logger.warn(
        `Transfer not eligible: from=${from}, to=${to}, amount=${amount}`
      );
      throw new ForbiddenException(
        'Transfer not permitted: compliance requirements not met'
      );
    }

    return true;
  }

  async verifyTransferEligibility(
    from: string,
    to: string,
    amount: number,
    _tokenAddress?: string
  ): Promise<boolean> {
    try {
      // Get identities for both parties
      const fromIdentity = await this.identityService.getIdentity(from);
      const toIdentity = await this.identityService.getIdentity(to);

      if (!fromIdentity || !toIdentity) {
        this.logger.warn(
          `Missing identity: from=${!fromIdentity}, to=${!toIdentity}`
        );
        return false;
      }

      // Verify both identities are verified
      if (
        fromIdentity.status !== 'verified' ||
        toIdentity.status !== 'verified'
      ) {
        this.logger.warn(
          `Unverified identity: fromStatus=${fromIdentity.status}, toStatus=${toIdentity.status}`
        );
        return false;
      }

      // Verify both parties have required claims
      const fromVerified = await this.claimsService.verifyRequiredClaims(
        fromIdentity.id,
        [ClaimTopic.KYC_APPROVED]
      );

      const toVerified = await this.claimsService.verifyRequiredClaims(
        toIdentity.id,
        [ClaimTopic.KYC_APPROVED]
      );

      if (!fromVerified || !toVerified) {
        this.logger.warn(
          `Invalid claims: from=${fromVerified}, to=${toVerified}`
        );
        return false;
      }

      // Additional transfer rules can be added here
      // e.g., transfer limits, holding periods, etc.

      this.logger.log(
        `Transfer eligible: from=${from}, to=${to}, amount=${amount}`
      );
      return true;
    } catch (error) {
      this.logger.error(`Transfer eligibility check failed:`, error);
      return false;
    }
  }
}
