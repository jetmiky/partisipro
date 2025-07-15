/**
 * Service Layer Index
 * Central export point for all API services
 */

// Import services for internal use
import { authService } from './auth.service';
import { isApiError } from '../lib/api-client';

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
