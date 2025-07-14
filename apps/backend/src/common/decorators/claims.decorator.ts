import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to specify required ERC-3643 claims for endpoint access
 * @param claims Array of required claim topics (e.g., ['KYC_APPROVED', 'ACCREDITED_INVESTOR'])
 */
export const Claims = (...claims: string[]) => SetMetadata('claims', claims);

// Common claim types for easy reference
export const CLAIM_TYPES = {
  KYC_APPROVED: 'KYC_APPROVED',
  ACCREDITED_INVESTOR: 'ACCREDITED_INVESTOR',
  AML_CLEARED: 'AML_CLEARED',
  INSTITUTIONAL_INVESTOR: 'INSTITUTIONAL_INVESTOR',
  RETAIL_QUALIFIED: 'RETAIL_QUALIFIED',
  AUTHORIZED_SPV: 'AUTHORIZED_SPV',
} as const;

// Convenience decorators for common claim combinations
export const RequireKYC = () => Claims(CLAIM_TYPES.KYC_APPROVED);
export const RequireAccredited = () =>
  Claims(CLAIM_TYPES.KYC_APPROVED, CLAIM_TYPES.ACCREDITED_INVESTOR);
export const RequireInstitutional = () =>
  Claims(CLAIM_TYPES.KYC_APPROVED, CLAIM_TYPES.INSTITUTIONAL_INVESTOR);
export const RequireRetailQualified = () =>
  Claims(CLAIM_TYPES.KYC_APPROVED, CLAIM_TYPES.RETAIL_QUALIFIED);
export const RequireAuthorizedSPV = () => Claims(CLAIM_TYPES.AUTHORIZED_SPV);
