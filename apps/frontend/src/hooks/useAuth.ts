/**
 * Authentication Hook
 * Comprehensive authentication management for Partisipro platform
 * Connects frontend Web3Auth to backend JWT authentication
 */

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from 'react';
import { useWeb3Auth } from '@web3auth/modal-react-hooks';
import { authService, type LoginResponse } from '../services/auth.service';
import { getWalletAddressFromProvider } from '../lib/web3auth-provider';
// import { apiClient } from '../lib/api-client';

export interface AuthState {
  user: LoginResponse['user'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (idToken: string) => Promise<LoginResponse | null>;
  loginWithWeb3Auth: () => Promise<LoginResponse | null>;
  loginWithSocialProvider: (
    provider: 'google' | 'facebook' | 'apple'
  ) => Promise<LoginResponse | null>;
  loginWithEmailPassword: (
    email: string,
    password: string
  ) => Promise<LoginResponse | null>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
  updateProfile: (
    updates: Partial<LoginResponse['user']>
  ) => Promise<LoginResponse['user'] | null>;
}

export interface UseAuthReturn extends AuthState, AuthActions {
  // Role-based helpers
  isAdmin: boolean;
  isSPV: boolean;
  isInvestor: boolean;
  // KYC status helpers
  isKYCApproved: boolean;
  isKYCPending: boolean;
  isKYCRejected: boolean;
  // Identity verification
  isIdentityVerified: boolean;
}

// Create Auth Context
export const AuthContext = createContext<UseAuthReturn | null>(null);

/**
 * Main authentication hook
 */
export function useAuth(): UseAuthReturn {
  const {
    connect,
    logout: web3AuthLogout,
    provider,
    isConnected,
    userInfo,
    status,
  } = useWeb3Auth();

  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Set loading state
   */
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  /**
   * Set error state
   */
  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  /**
   * Set authenticated user
   */
  const setUser = useCallback((user: LoginResponse['user'] | null) => {
    setState(prev => ({
      ...prev,
      user,
      isAuthenticated: !!user,
      isLoading: false,
      error: null,
    }));
  }, []);

  /**
   * Login with Web3Auth ID token
   */
  const login = useCallback(
    async (idToken: string): Promise<LoginResponse | null> => {
      try {
        setLoading(true);
        clearError();

        const response = await authService.login({ idToken });

        setUser(response.user);
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Login failed';
        setError(errorMessage);
        return null;
      }
    },
    [setLoading, clearError, setUser, setError]
  );

  /**
   * Login with Web3Auth (full flow)
   */
  const loginWithWeb3Auth =
    useCallback(async (): Promise<LoginResponse | null> => {
      try {
        setLoading(true);
        clearError();

        // Use Web3Auth React hooks for connection
        await connect();

        if (!provider || !userInfo) {
          throw new Error('Web3Auth connection failed');
        }

        // Get wallet address
        const walletAddress = await getWalletAddressFromProvider(provider);

        // Get ID token from userInfo
        const idToken = userInfo.idToken || '';
        if (!idToken) {
          throw new Error('No ID token received from Web3Auth');
        }

        // Login with backend
        const response = await authService.login({
          idToken,
          walletAddress: walletAddress || undefined,
        });

        setUser(response.user);
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Web3Auth login failed';
        setError(errorMessage);
        return null;
      }
    }, [
      connect,
      provider,
      userInfo,
      setLoading,
      clearError,
      setUser,
      setError,
    ]);

  /**
   * Login with social provider
   */
  const loginWithSocialProvider = useCallback(
    async (
      socialProvider: 'google' | 'facebook' | 'apple'
    ): Promise<LoginResponse | null> => {
      try {
        setLoading(true);
        clearError();

        // Use Web3Auth React hooks for social login
        await connect();

        if (!provider || !userInfo) {
          throw new Error(`${socialProvider} connection failed`);
        }

        // Get wallet address
        const walletAddress = await getWalletAddressFromProvider(provider);

        // Get ID token from userInfo
        const idToken = userInfo.idToken || '';
        if (!idToken) {
          throw new Error(`No ID token received from ${socialProvider}`);
        }

        // Login with backend
        const response = await authService.login({
          idToken,
          walletAddress: walletAddress || undefined,
        });

        setUser(response.user);
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : `${socialProvider} login failed`;
        setError(errorMessage);
        return null;
      }
    },
    [connect, provider, userInfo, setLoading, clearError, setUser, setError]
  );

  /**
   * Login with email/password
   */
  const loginWithEmailPassword = useCallback(
    async (
      _email: string,
      _password: string
    ): Promise<LoginResponse | null> => {
      try {
        setLoading(true);
        clearError();

        // Use Web3Auth React hooks for email/password login
        await connect();

        if (!provider || !userInfo) {
          throw new Error('Email/password connection failed');
        }

        // Get wallet address
        const walletAddress = await getWalletAddressFromProvider(provider);

        // Get ID token from userInfo
        const idToken = userInfo.idToken || '';
        if (!idToken) {
          throw new Error('No ID token received from email/password login');
        }

        // Login with backend
        const response = await authService.login({
          idToken,
          walletAddress: walletAddress || undefined,
        });

        setUser(response.user);
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Email/password login failed';
        setError(errorMessage);
        return null;
      }
    },
    [connect, provider, userInfo, setLoading, clearError, setUser, setError]
  );

  /**
   * Logout user
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);

      // Logout from Web3Auth
      if (isConnected) {
        await web3AuthLogout();
      }

      // Logout from backend
      await authService.logout();
    } catch (error) {
      // console.error('Logout error:', error);
      // Continue with local cleanup even if server request fails
    } finally {
      setUser(null);
    }
  }, [web3AuthLogout, isConnected, setLoading, setUser]);

  /**
   * Refresh authentication token
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshTokenValue = authService.getRefreshToken();

      if (!refreshTokenValue) {
        setUser(null);
        return false;
      }

      const response = await authService.refreshToken({
        refreshToken: refreshTokenValue,
      });

      return !!response.accessToken;
    } catch (error) {
      // console.error('Token refresh failed:', error);
      setUser(null);
      return false;
    }
  }, [setUser]);

  /**
   * Check current authentication status
   */
  const checkAuthStatus = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);

      // Initialize auth service with stored tokens
      authService.initializeAuth();

      const accessToken = authService.getAccessToken();

      if (!accessToken) {
        setUser(null);
        return;
      }

      // Try to get current user
      const { authenticated, user } = await authService.checkAuthStatus();

      if (authenticated && user) {
        setUser(user);
      } else {
        // Try refreshing token
        const refreshed = await refreshToken();

        if (refreshed) {
          // Retry getting user after refresh
          const retryStatus = await authService.checkAuthStatus();
          if (retryStatus.authenticated && retryStatus.user) {
            setUser(retryStatus.user);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      // console.error('Auth status check failed:', error);

      // Try refreshing token on auth check failure
      const refreshed = await refreshToken();
      if (!refreshed) {
        setUser(null);
      }
    }
  }, [setLoading, setUser, refreshToken]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(
    async (
      updates: Partial<LoginResponse['user']>
    ): Promise<LoginResponse['user'] | null> => {
      try {
        setLoading(true);
        const updatedUser = await authService.updateProfile(updates);
        setUser(updatedUser);
        return updatedUser;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Profile update failed';
        setError(errorMessage);
        return null;
      }
    },
    [setLoading, setUser, setError]
  );

  /**
   * Initialize authentication on mount and watch Web3Auth status
   */
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  /**
   * Update authentication state when Web3Auth connection changes
   */
  useEffect(() => {
    if (status === 'connected' && isConnected && userInfo) {
      // Update user state if Web3Auth is connected but we don't have backend auth
      if (!state.isAuthenticated) {
        // Attempt to sync with backend
        checkAuthStatus();
      }
    } else if (status === 'disconnected' && state.isAuthenticated) {
      // Web3Auth disconnected but we still have backend auth - logout completely
      logout();
    }
  }, [
    status,
    isConnected,
    userInfo,
    state.isAuthenticated,
    checkAuthStatus,
    logout,
  ]);

  /**
   * Setup automatic token refresh
   */
  useEffect(() => {
    if (!state.isAuthenticated) return;

    // Set up automatic token refresh
    const interval = setInterval(
      async () => {
        const refreshed = await refreshToken();
        if (!refreshed) {
          // console.warn('Failed to refresh token, user will be logged out');
        }
      },
      50 * 60 * 1000
    ); // Refresh every 50 minutes (tokens expire in 1 hour)

    return () => clearInterval(interval);
  }, [state.isAuthenticated, refreshToken]);

  /**
   * Setup automatic API error handling for 401 responses
   * TODO: Implement when ApiClient provides public method for request interception
   */
  // useEffect(() => {
  //   // This would need public method access or interceptor pattern
  //   const handleUnauthorized = (error: any) => {
  //     if (error?.statusCode === 401 && state.isAuthenticated) {
  //       refreshToken().then(refreshed => {
  //         if (!refreshed) {
  //           logout();
  //         }
  //       });
  //     }
  //   };
  // }, [state.isAuthenticated, refreshToken, logout]);

  // Role-based helpers
  const isAdmin = state.user?.role === 'admin';
  const isSPV = state.user?.role === 'spv';
  const isInvestor = state.user?.role === 'investor';

  // KYC status helpers
  const isKYCApproved = state.user?.kycStatus === 'approved';
  const isKYCPending = state.user?.kycStatus === 'pending';
  const isKYCRejected = state.user?.kycStatus === 'rejected';

  // Identity verification
  const isIdentityVerified = state.user?.identityVerified ?? false;

  return {
    // State
    ...state,

    // Actions
    login,
    loginWithWeb3Auth,
    loginWithSocialProvider,
    loginWithEmailPassword,
    logout,
    refreshToken,
    clearError,
    checkAuthStatus,
    updateProfile,

    // Role helpers
    isAdmin,
    isSPV,
    isInvestor,

    // KYC helpers
    isKYCApproved,
    isKYCPending,
    isKYCRejected,

    // Identity verification
    isIdentityVerified,
  };
}

/**
 * Hook to access auth context
 */
export function useAuthContext(): UseAuthReturn {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
}

/**
 * MFA (Multi-Factor Authentication) Hook
 */
export function useMFA() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setupMFA = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      return await authService.setupMfa();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'MFA setup failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyMFA = useCallback(async (token: string, secret?: string) => {
    try {
      setLoading(true);
      setError(null);
      return await authService.verifyMfa({ token, secret });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'MFA verification failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const disableMFA = useCallback(async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      return await authService.disableMfa(token);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'MFA disable failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    setupMFA,
    verifyMFA,
    disableMFA,
    loading,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Hook for role-based access control
 */
export function useRoleAccess() {
  const { user, isAdmin, isSPV, isInvestor } = useAuthContext();

  const hasRole = useCallback(
    (role: 'admin' | 'spv' | 'investor') => {
      return user?.role === role;
    },
    [user]
  );

  const hasAnyRole = useCallback(
    (roles: ('admin' | 'spv' | 'investor')[]) => {
      return roles.some(role => user?.role === role);
    },
    [user]
  );

  const requiresRole = useCallback(
    (role: 'admin' | 'spv' | 'investor') => {
      if (!user || user.role !== role) {
        throw new Error(`Access denied. Required role: ${role}`);
      }
    },
    [user]
  );

  return {
    hasRole,
    hasAnyRole,
    requiresRole,
    isAdmin,
    isSPV,
    isInvestor,
  };
}

/**
 * Hook for KYC status management
 */
export function useKYCStatus() {
  const {
    user,
    isKYCApproved,
    isKYCPending,
    isKYCRejected,
    isIdentityVerified,
  } = useAuthContext();

  const canInvest = isKYCApproved && isIdentityVerified;
  const needsKYC = !isKYCApproved && !isKYCPending;
  const kycInProgress = isKYCPending;

  return {
    kycStatus: user?.kycStatus,
    isKYCApproved,
    isKYCPending,
    isKYCRejected,
    isIdentityVerified,
    canInvest,
    needsKYC,
    kycInProgress,
  };
}
