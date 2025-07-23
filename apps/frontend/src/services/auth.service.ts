/**
 * Authentication Service
 * Handles user authentication with Web3Auth and backend API
 */

import { apiClient } from '../lib/api-client';
import { isMockAuthEnabled } from '../lib/web3auth-provider';

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

  /**
   * Login with Web3Auth ID token
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      let response: LoginResponse;

      if (isMockAuthEnabled()) {
        // Use mock authentication for development
        response = await this.mockLogin(request);
      } else {
        // Use real backend authentication
        response = await apiClient.post<LoginResponse>(
          `${this.BASE_PATH}/web3auth/login`,
          request
        );
      }

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
   * Mock login for development
   */
  private async mockLogin(request: LoginRequest): Promise<LoginResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockUser = {
      id: 'mock_user_' + Date.now(),
      email: 'mock@example.com',
      walletAddress:
        request.walletAddress || '0x1234567890123456789012345678901234567890',
      role: 'investor' as const,
      identityVerified: false,
      kycStatus: 'pending' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      accessToken: 'mock_access_token_' + Date.now(),
      refreshToken: 'mock_refresh_token_' + Date.now(),
      user: mockUser,
    };
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

    // Clear local tokens (Web3Auth logout is handled in useAuth hook)
    this.clearTokens();
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
