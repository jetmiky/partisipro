/**
 * Conditional Services
 * Routes to either real services or presentation mode services
 */

import {
  presentationServices,
  isPresentationMode,
} from '../services/presentation-services';

// Import the original services (but conditionally use them)
import { authService as realAuthService } from '../services/auth.service';
import { projectsService as realProjectsService } from '../services/projects.service';
import { investmentsService as realInvestmentsService } from '../services/investments.service';
import { governanceService as realGovernanceService } from '../services/governance.service';
import { identityService as realIdentityService } from '../services/identity.service';
import { kycService as realKYCService } from '../services/kyc.service';
import { adminService as realAdminService } from '../services/admin.service';

// Create conditional exports that switch based on presentation mode
export const authService = isPresentationMode()
  ? presentationServices.authService
  : realAuthService;

export const projectsService = isPresentationMode()
  ? presentationServices.projectsService
  : realProjectsService;

export const investmentsService = isPresentationMode()
  ? presentationServices.investmentsService
  : realInvestmentsService;

export const portfolioService = isPresentationMode()
  ? presentationServices.portfolioService
  : undefined; // Fallback if real service doesn't exist

export const governanceService = isPresentationMode()
  ? presentationServices.governanceService
  : realGovernanceService;

export const identityService = isPresentationMode()
  ? presentationServices.identityService
  : realIdentityService;

export const kycService = isPresentationMode()
  ? presentationServices.kycService
  : realKYCService;

export const adminService = isPresentationMode()
  ? presentationServices.adminService
  : realAdminService;

// Re-export types that are commonly used
export type {
  MockUser as User,
  MockProject as Project,
  MockInvestment as Investment,
} from '../lib/mock-data';
