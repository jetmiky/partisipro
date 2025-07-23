/**
 * Web3Auth Configuration and Service
 * Handles Web3Auth integration for Partisipro platform using React hooks
 */

import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';

// Web3Auth configuration
const clientId =
  process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || 'partisipro-dev-client-id';
const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: '0x66eee', // Arbitrum Sepolia
  rpcTarget: 'https://sepolia-rollup.arbitrum.io/rpc',
  displayName: 'Arbitrum Sepolia',
  blockExplorerUrl: 'https://sepolia.arbiscan.io',
  ticker: 'ETH',
  tickerName: 'Ethereum',
  logo: 'https://arbitrum.io/wp-content/uploads/2021/01/cropped-Arbitrum_Horizontal-Logo-Full-color-White-background-1.png',
};

// Private key provider
const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

// Web3Auth configuration for React hooks
export const web3AuthConfig = {
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  chainConfig,
  privateKeyProvider,
  uiConfig: {
    appName: 'Partisipro',
    appUrl: 'https://partisipro.id',
    theme: {
      primary: '#bade04',
      gray: '#9854f4',
      red: '#f55553',
      green: '#05b1d5',
      success: '#05b1d5',
      warning: '#f55553',
      error: '#f55553',
      info: '#9854f4',
      white: '#ffffff',
      black: '#000000',
    },
    mode: 'auto' as const,
    logoLight: 'https://partisipro.id/logo-light.png',
    logoDark: 'https://partisipro.id/logo-dark.png',
    defaultLanguage: 'en',
    loginGridCol: 3,
    primaryButton: 'socialLogin',
  },
  sessionTime: 3600, // 1 hour
};

/**
 * Login configuration for social providers
 */
export const loginConfig = {
  google: {
    verifier: 'google-partisipro',
    typeOfLogin: 'google',
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  },
  facebook: {
    verifier: 'facebook-partisipro',
    typeOfLogin: 'facebook',
    clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID || '',
  },
  apple: {
    verifier: 'apple-partisipro',
    typeOfLogin: 'apple',
    clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || '',
  },
  jwt: {
    verifier: 'partisipro-jwt',
    typeOfLogin: 'jwt',
    clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || '',
  },
};

/**
 * Utility function to get wallet address from provider
 */
export const getWalletAddressFromProvider = async (
  provider: IProvider
): Promise<string | null> => {
  try {
    const accounts = (await provider.request({
      method: 'eth_accounts',
    })) as string[];
    return accounts && accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to get wallet address:', error);
    return null;
  }
};

/**
 * Utility function to validate login result
 */
export const validateLoginResult = (result: {
  provider: IProvider | null;
  user: any;
}): {
  provider: IProvider;
  user: any;
  idToken: string;
  accessToken: string;
} => {
  if (!result.provider) {
    throw new Error('No provider received from Web3Auth');
  }

  if (!result.user) {
    throw new Error('Failed to get user info');
  }

  const idToken = result.user.idToken || '';
  if (!idToken) {
    throw new Error('No ID token received from Web3Auth');
  }

  const accessToken = result.user.accessToken || '';

  return {
    provider: result.provider,
    user: result.user,
    idToken,
    accessToken,
  };
};

/**
 * Get wallet address from Web3Auth (deprecated - use getWalletAddressFromProvider)
 */
export const getWalletAddress = async (): Promise<string | null> => {
  // This function is now deprecated with the React hooks approach
  // It will be used in mock mode or when no provider is available
  if (isMockAuthEnabled()) {
    return `0x${Math.random().toString(16).substr(2, 40)}`;
  }
  return null;
};

/**
 * Placeholder functions for backward compatibility
 * These will be replaced with React hooks in the consuming components
 */
export const initWeb3Auth = async (): Promise<any> => {
  // This is now handled by the React hooks
  return Promise.resolve(null);
};

export const loginWithWeb3Auth = async (): Promise<{
  provider: IProvider | null;
  user: any;
  idToken: string;
  accessToken: string;
}> => {
  // This will be replaced by React hooks
  if (isMockAuthEnabled()) {
    return await mockWeb3AuthLogin('google');
  }
  throw new Error('Web3Auth login should be handled by React hooks');
};

export const loginWithSocialProvider = async (
  provider: 'google' | 'facebook' | 'apple'
): Promise<{
  provider: IProvider | null;
  user: any;
  idToken: string;
  accessToken: string;
}> => {
  // This will be replaced by React hooks
  if (isMockAuthEnabled()) {
    return await mockWeb3AuthLogin(provider);
  }
  throw new Error(`${provider} login should be handled by React hooks`);
};

export const loginWithEmailPassword = async (
  _email: string,
  _password: string
): Promise<{
  provider: IProvider | null;
  user: any;
  idToken: string;
  accessToken: string;
}> => {
  // This will be replaced by React hooks
  if (isMockAuthEnabled()) {
    return await mockWeb3AuthLogin('email');
  }
  throw new Error('Email/password login should be handled by React hooks');
};

export const logoutFromWeb3Auth = async (): Promise<void> => {
  // This will be handled by React hooks
  return Promise.resolve();
};

/**
 * Mock authentication for development
 */
export const mockWeb3AuthLogin = async (
  provider: string = 'google'
): Promise<{
  provider: IProvider | null;
  user: any;
  idToken: string;
  accessToken: string;
}> => {
  const mockUser = {
    email: `mock.user@${provider.toLowerCase()}.com`,
    name: `Mock ${provider} User`,
    profileImage: `https://via.placeholder.com/150?text=${provider}`,
    aggregateVerifier: 'partisipro-mock',
    verifier: `${provider.toLowerCase()}-partisipro`,
    verifierId: `mock_${provider.toLowerCase()}_user_${Date.now()}`,
    typeOfLogin: provider.toLowerCase(),
    idToken: `mock_${provider.toLowerCase()}_token_${Date.now()}`,
    accessToken: `mock_${provider.toLowerCase()}_access_${Date.now()}`,
  };

  const mockIdToken = `mock_${provider.toLowerCase()}_token_${Date.now()}`;
  const mockAccessToken = `mock_${provider.toLowerCase()}_access_${Date.now()}`;

  // Simulate async delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    provider: null,
    user: mockUser,
    idToken: mockIdToken,
    accessToken: mockAccessToken,
  };
};

/**
 * Development mode check
 */
export const isDevelopmentMode = (): boolean => {
  return (
    process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
  );
};

/**
 * Check if mock authentication is enabled
 */
export const isMockAuthEnabled = (): boolean => {
  return (
    process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true' || isDevelopmentMode()
  );
};
