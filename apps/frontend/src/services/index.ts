/**
 * Service Layer Index
 * Central export point for all API services
 */

// Check if presentation mode is enabled
const isPresentationMode = (): boolean => {
  return (
    process.env.NEXT_PUBLIC_PRESENTATION_MODE === 'true' ||
    (typeof window !== 'undefined' &&
      window.location.search.includes('presentation=true'))
  );
};

// Import services for internal use
import { authService as realAuthService } from './auth.service';
import { presentationServices } from './presentation-services';
import { isApiError } from '../lib/api-client';

// Conditionally use presentation services
const authService = isPresentationMode()
  ? presentationServices.authService
  : realAuthService;

// Export API client
export {
  apiClient,
  ApiClient,
  isApiError,
  getErrorMessage,
} from '../lib/api-client';
export type { ApiResponse, ApiError } from '../lib/api-client';

// Export authentication service
export { authService, AuthService } from './auth.service';
export type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  MfaSetupResponse,
  MfaVerificationRequest,
  MfaVerificationResponse,
} from './auth.service';

// Export blockchain service
export { blockchainService, BlockchainService } from './blockchain.service';
export type {
  BlockchainTransaction,
  ContractDeployment,
  DeployContractRequest,
  GenerateSignatureRequest,
  SubmitTransactionRequest,
  PlatformConfiguration,
} from './blockchain.service';

// Export projects service
export { projectsService, ProjectsService } from './projects.service';
export type {
  Project,
  ProjectDocument,
  ProjectContracts,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectMetrics,
  ProjectInvestment,
  ProjectsListResponse,
} from './projects.service';

// Export investments service
export { investmentsService, InvestmentsService } from './investments.service';
export type {
  Investment,
  InvestmentRequest,
  InvestmentEligibility,
  PaymentDetails,
  InvestmentStatus,
  Portfolio,
  ProfitClaim,
} from './investments.service';

// Export governance service
export { governanceService, GovernanceService } from './governance.service';
export type {
  GovernanceProposal,
  CreateProposalRequest,
  VoteRequest,
  VotingPower,
  GovernanceStats,
  ProposalVoters,
  GovernanceActivity,
} from './governance.service';

// Export identity service
export { identityService, IdentityService } from './identity.service';
export type {
  IdentityClaim,
  IdentityVerificationStatus,
  IdentityRegistration,
  ClaimIssuanceRequest,
  TrustedIssuer,
  IdentityAnalytics,
} from './identity.service';

// Export KYC service
export { kycService, KYCService } from './kyc.service';
export type {
  KYCProvider,
  KYCSession,
  KYCResults,
  KYCDocument,
  KYCCheck,
  KYCInitiationRequest,
  AutomatedClaimsIssuance,
  KYCErrorHandling,
  KYCAnalytics,
} from './kyc.service';

// Export WebSocket service
export { webSocketService, WebSocketService } from './websocket.service';
export type {
  WebSocketEventHandlers,
  WebSocketSubscription,
} from './websocket.service';

// Export profiling service
export { profilingService } from './profiling.service';
export type {
  ProfileFormData,
  InvestorProfile,
  ProfileSubmissionResponse,
  ProfileAnalytics,
  RiskAssessmentResult,
  InvestmentRecommendation,
  AgeRange,
  IncomeRange,
  ExperienceLevel,
  InvestmentType,
  InvestmentGoal,
  RiskTolerance,
  MarketReaction,
  HoldingPeriod,
  ProjectDetailImportance,
  TokenType,
} from '../types/profiling';

// Service initialization function
export function initializeServices(): void {
  // Initialize auth state from localStorage
  authService.initializeAuth();

  // Set up automatic token refresh
  setupTokenRefresh();
}

// Automatic token refresh setup
function setupTokenRefresh(): void {
  // Check token validity every 5 minutes
  setInterval(
    async () => {
      if (authService.isAuthenticated()) {
        try {
          await authService.autoRefreshToken();
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Auto token refresh failed:', error);
          // Optionally redirect to login or show notification
        }
      }
    },
    5 * 60 * 1000
  ); // 5 minutes
}

// Global error handler for API errors
export function setupGlobalErrorHandler(): void {
  // This could be enhanced to show toast notifications, redirect on auth errors, etc.
  window.addEventListener('unhandledrejection', event => {
    if (isApiError(event.reason)) {
      // eslint-disable-next-line no-console
      console.error('Unhandled API error:', event.reason);

      // Handle authentication errors
      if (event.reason.statusCode === 401) {
        authService.clearTokens();
        // Optionally redirect to login
        if (
          typeof window !== 'undefined' &&
          window.location.pathname !== '/auth/signin'
        ) {
          window.location.href = '/auth/signin';
        }
      }
    }
  });
}
