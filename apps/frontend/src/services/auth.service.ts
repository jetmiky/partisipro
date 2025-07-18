/**
 * Authentication Service
 * Handles user authentication with Web3Auth and backend API
 */

import { apiClient } from '../lib/api-client';
import {
  initWeb3Auth,
  loginWithWeb3Auth,
  loginWithSocialProvider,
  loginWithEmailPassword,
  logoutFromWeb3Auth,
  getWalletAddress,
  isMockAuthEnabled,
  mockWeb3AuthLogin,
} from '../lib/web3auth';

export interface LoginRequest {
  idToken: string;
  walletAddress?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    walletAddress?: string;
    role: 'investor' | 'spv' | 'admin';
    identityVerified: boolean;
    kycStatus: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt: string;
  };
  firebaseToken?: string;
  customClaims?: any;
}

export interface Web3AuthLoginResult {
  provider: any;
  user: any;
  idToken: string;
  accessToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface MfaSetupResponse {
  qrCode: string;
  backupCodes: string[];
  secret: string;
}

export interface MfaVerificationRequest {
  token: string;
  secret?: string;
}

export interface MfaVerificationResponse {
  verified: boolean;
  backupCodes?: string[];
}

class AuthService {
  private readonly BASE_PATH = '/api/auth';
  private web3AuthInitialized = false;

  /**
   * Initialize Web3Auth (call once on app startup)
   */
  async initializeWeb3Auth(): Promise<void> {
    if (this.web3AuthInitialized) return;

    try {
      await initWeb3Auth();
      this.web3AuthInitialized = true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize Web3Auth:', error);
      // Continue without Web3Auth in development mode
      if (isMockAuthEnabled()) {
        this.web3AuthInitialized = true;
      } else {
        throw error;
      }
    }
  }

  /**
   * Login with Web3Auth ID token
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>(
        `${this.BASE_PATH}/web3auth/login`,
        request
      );

      // Store tokens
      if (response.accessToken) {
        this.setTokens(response.accessToken, response.refreshToken);
      }

      return response;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Login with Web3Auth (full flow)
   */
  async loginWithWeb3Auth(): Promise<LoginResponse> {
    try {
      // In development mode, use mock authentication
      if (isMockAuthEnabled()) {
        const mockResult = await mockWeb3AuthLogin('google');
        return await this.login({
          idToken: mockResult.idToken,
          walletAddress: undefined,
        });
      }

      // In production, use real Web3Auth
      await this.initializeWeb3Auth();
      const web3AuthResult = await loginWithWeb3Auth();
      // Get wallet address
      const walletAddress = await getWalletAddress();

      // Login with backend
      return await this.login({
        idToken: web3AuthResult.idToken,
        walletAddress: walletAddress || undefined,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Web3Auth login failed:', error);
      throw error;
    }
  }

  /**
   * Login with social provider
   */
  async loginWithSocialProvider(
    provider: 'google' | 'facebook' | 'apple'
  ): Promise<LoginResponse> {
    try {
      await this.initializeWeb3Auth();

      let web3AuthResult: Web3AuthLoginResult;

      if (isMockAuthEnabled()) {
        // Use mock authentication for development
        web3AuthResult = await mockWeb3AuthLogin(provider);
      } else {
        // Use real Web3Auth
        web3AuthResult = await loginWithSocialProvider(provider);
      }

      // Get wallet address
      const walletAddress = await getWalletAddress();

      // Login with backend
      const loginRequest: LoginRequest = {
        idToken: web3AuthResult.idToken,
        walletAddress: walletAddress || undefined,
      };

      return await this.login(loginRequest);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`${provider} login failed:`, error);
      throw error;
    }
  }

  /**
   * Login with email/password
   */
  async loginWithEmailPassword(
    email: string,
    password: string
  ): Promise<LoginResponse> {
    try {
      await this.initializeWeb3Auth();

      let web3AuthResult: Web3AuthLoginResult;

      if (isMockAuthEnabled()) {
        // Use mock authentication for development
        web3AuthResult = await mockWeb3AuthLogin('email');
      } else {
        // Use real Web3Auth
        web3AuthResult = await loginWithEmailPassword(email, password);
      }

      // Get wallet address
      const walletAddress = await getWalletAddress();

      // Login with backend
      const loginRequest: LoginRequest = {
        idToken: web3AuthResult.idToken,
        walletAddress: walletAddress || undefined,
      };

      return await this.login(loginRequest);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Email/password login failed:', error);
      throw error;
    }
  }

  /**
   * Login with Firebase Auth
   */
  async loginWithFirebase(idToken: string): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>(
        `${this.BASE_PATH}/firebase/login`,
        { idToken }
      );

      // Store tokens
      if (response.accessToken) {
        this.setTokens(response.accessToken, response.refreshToken);
      }

      return response;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Firebase login failed:', error);
      throw error;
    }
  }

  /**
   * Login with hybrid authentication (auto-detect token type)
   */
  async loginWithHybridAuth(idToken: string): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>(
        `${this.BASE_PATH}/hybrid/login`,
        { idToken }
      );

      // Store tokens
      if (response.accessToken) {
        this.setTokens(response.accessToken, response.refreshToken);
      }

      return response;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Hybrid auth login failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    request: RefreshTokenRequest
  ): Promise<RefreshTokenResponse> {
    try {
      const response = await apiClient.post<RefreshTokenResponse>(
        `${this.BASE_PATH}/refresh`,
        request
      );

      // Update stored tokens
      if (response.accessToken) {
        this.setTokens(response.accessToken, response.refreshToken);
      }

      return response;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Token refresh failed:', error);
      // Clear tokens on refresh failure
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Logout and clear tokens
   */
  async logout(): Promise<void> {
    try {
      // Logout from backend
      await apiClient.post(`${this.BASE_PATH}/logout`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Logout request failed:', error);
      // Continue with local cleanup even if server request fails
    }

    try {
      // Logout from Web3Auth if connected
      if (this.web3AuthInitialized && !isMockAuthEnabled()) {
        await logoutFromWeb3Auth();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Web3Auth logout failed:', error);
      // Continue with local cleanup even if Web3Auth logout fails
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<LoginResponse['user']> {
    return apiClient.get(`${this.BASE_PATH}/profile`);
  }

  /**
   * Update user profile
   */
  async updateProfile(
    updates: Partial<LoginResponse['user']>
  ): Promise<LoginResponse['user']> {
    return apiClient.patch(`${this.BASE_PATH}/profile`, updates);
  }

  /**
   * Setup MFA (Multi-Factor Authentication)
   */
  async setupMfa(): Promise<MfaSetupResponse> {
    return apiClient.post(`${this.BASE_PATH}/mfa/setup`);
  }

  /**
   * Verify MFA token
   */
  async verifyMfa(
    request: MfaVerificationRequest
  ): Promise<MfaVerificationResponse> {
    return apiClient.post(`${this.BASE_PATH}/mfa/verify`, request);
  }

  /**
   * Disable MFA
   */
  async disableMfa(token: string): Promise<{ success: boolean }> {
    return apiClient.post(`${this.BASE_PATH}/mfa/disable`, { token });
  }

  /**
   * Verify MFA for sensitive operations
   */
  async verifyMfaForOperation(token: string): Promise<{ verified: boolean }> {
    return apiClient.post(`${this.BASE_PATH}/mfa/verify-operation`, { token });
  }

  /**
   * Check authentication status
   */
  async checkAuthStatus(): Promise<{
    authenticated: boolean;
    user?: LoginResponse['user'];
  }> {
    try {
      const user = await this.getCurrentUser();
      return { authenticated: true, user };
    } catch (error) {
      return { authenticated: false };
    }
  }

  /**
   * Change password (for email/password auth)
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean }> {
    return apiClient.post(`${this.BASE_PATH}/change-password`, {
      currentPassword,
      newPassword,
    });
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean }> {
    return apiClient.post(`${this.BASE_PATH}/forgot-password`, { email });
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean }> {
    return apiClient.post(`${this.BASE_PATH}/reset-password`, {
      token,
      newPassword,
    });
  }

  // Token management methods

  /**
   * Set authentication tokens
   */
  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    apiClient.setAuthToken(accessToken);
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Clear stored tokens
   */
  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    apiClient.setAuthToken(null);
  }

  /**
   * Initialize auth state (call on app startup)
   */
  initializeAuth(): void {
    const accessToken = this.getAccessToken();
    if (accessToken) {
      apiClient.setAuthToken(accessToken);
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Auto-refresh token if needed
   */
  async autoRefreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return false;
    }

    try {
      await this.refreshToken({ refreshToken });
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Auto-refresh failed:', error);
      return false;
    }
  }
}

// Create singleton instance
export const authService = new AuthService();

// Export the class for potential custom instances
export { AuthService };
