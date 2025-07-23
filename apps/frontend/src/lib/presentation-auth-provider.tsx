'use client';

/**
 * Presentation Mode Authentication Provider
 * Bypasses Web3Auth and provides always-authenticated state for demos
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { mockApiClient, type LoginResponse } from './mock-api-client';
import { type MockUser } from './mock-data';

// Reuse the same interfaces from the original useAuth hook
export interface AuthState {
  user: MockUser | null;
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
  updateProfile: (updates: Partial<MockUser>) => Promise<MockUser | null>;
  switchRole: (role: 'admin' | 'spv' | 'investor') => void;
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

const PresentationAuthContext = createContext<UseAuthReturn | null>(null);

interface PresentationAuthProviderProps {
  children: ReactNode;
  initialRole?: 'admin' | 'spv' | 'investor';
}

export function PresentationAuthProvider({
  children,
  initialRole = 'investor',
}: PresentationAuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  const setUser = useCallback((user: MockUser | null) => {
    setState(prev => ({
      ...prev,
      user,
      isAuthenticated: !!user,
      isLoading: false,
      error: null,
    }));
  }, []);

  // Switch between different demo user roles
  const switchRole = useCallback(
    (role: 'admin' | 'spv' | 'investor') => {
      const newUser = mockApiClient.switchUserRole(role);
      setUser(newUser);
    },
    [setUser]
  );

  // Mock authentication functions that always succeed
  const login = useCallback(
    async (_idToken: string): Promise<LoginResponse | null> => {
      try {
        setLoading(true);
        clearError();

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const response: LoginResponse = {
          user: mockApiClient.getCurrentUser(),
          accessToken: 'presentation-mode-token',
          refreshToken: 'presentation-mode-refresh',
        };

        setUser(response.user);
        return response;
      } catch (error) {
        setError('Login simulation failed');
        return null;
      }
    },
    [setLoading, clearError, setUser, setError]
  );

  const loginWithWeb3Auth =
    useCallback(async (): Promise<LoginResponse | null> => {
      return login('mock-web3auth-token');
    }, [login]);

  const loginWithSocialProvider = useCallback(
    async (
      provider: 'google' | 'facebook' | 'apple'
    ): Promise<LoginResponse | null> => {
      return login(`mock-${provider}-token`);
    },
    [login]
  );

  const loginWithEmailPassword = useCallback(
    async (
      _email: string,
      _password: string
    ): Promise<LoginResponse | null> => {
      return login('mock-email-password-token');
    },
    [login]
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      // Simulate logout delay
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      // Ignore logout errors in presentation mode
    } finally {
      setUser(null);
    }
  }, [setLoading, setUser]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    // Always succeed in presentation mode
    return true;
  }, []);

  const checkAuthStatus = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);

      // In presentation mode, initialize with the specified role
      const initialUser = mockApiClient.switchUserRole(initialRole);
      setUser(initialUser);
    } catch (error) {
      setError('Auth status check failed');
    }
  }, [initialRole, setLoading, setUser, setError]);

  const updateProfile = useCallback(
    async (updates: Partial<MockUser>): Promise<MockUser | null> => {
      try {
        setLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const currentUser = mockApiClient.getCurrentUser();
        const updatedUser = { ...currentUser, ...updates };

        mockApiClient.setCurrentUser(updatedUser);
        setUser(updatedUser);

        return updatedUser;
      } catch (error) {
        setError('Profile update failed');
        return null;
      }
    },
    [setLoading, setUser, setError]
  );

  // Initialize authentication on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Initialize WebSocket simulation
  useEffect(() => {
    if (state.isAuthenticated) {
      mockApiClient.simulateWebSocketConnection();
    }
  }, [state.isAuthenticated]);

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

  const contextValue: UseAuthReturn = {
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
    switchRole,

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

  return (
    <PresentationAuthContext.Provider value={contextValue}>
      {children}
    </PresentationAuthContext.Provider>
  );
}

/**
 * Hook to access presentation auth context
 */
export function usePresentationAuth(): UseAuthReturn {
  const context = useContext(PresentationAuthContext);

  if (!context) {
    throw new Error(
      'usePresentationAuth must be used within a PresentationAuthProvider'
    );
  }

  return context;
}

// Export presentation mode versions of all auth hooks
export function useAuth(): UseAuthReturn {
  return usePresentationAuth();
}

export function useAuthContext(): UseAuthReturn {
  return usePresentationAuth();
}

export function useMFA() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setupMFA = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Simulate MFA setup delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    setLoading(false);
    return {
      secret: 'PRESENTATION_MODE_MFA_SECRET',
      qrCode: 'data:image/png;base64,mock-qr-code',
      backupCodes: ['123456', '789012', '345678'],
    };
  }, []);

  const verifyMFA = useCallback(async (_token: string, _secret?: string) => {
    setLoading(true);
    setError(null);

    // Simulate MFA verification delay
    await new Promise(resolve => setTimeout(resolve, 800));

    setLoading(false);
    return { success: true };
  }, []);

  const disableMFA = useCallback(async (_token: string) => {
    setLoading(true);
    setError(null);

    // Simulate MFA disable delay
    await new Promise(resolve => setTimeout(resolve, 600));

    setLoading(false);
    return { success: true };
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

export function useRoleAccess() {
  const { user, isAdmin, isSPV, isInvestor } = usePresentationAuth();

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

export function useKYCStatus() {
  const {
    user,
    isKYCApproved,
    isKYCPending,
    isKYCRejected,
    isIdentityVerified,
  } = usePresentationAuth();

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
