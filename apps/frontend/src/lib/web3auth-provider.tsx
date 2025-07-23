'use client';

import { ReactNode, useEffect, useState } from 'react';
import {
  Web3AuthProvider,
  Web3AuthInnerProvider,
} from '@web3auth/modal-react-hooks';
import { Web3AuthOptions } from '@web3auth/modal';
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';

interface Web3AuthWrapperProps {
  children: ReactNode;
}

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

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

const web3AuthOptions: Web3AuthOptions = {
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider: privateKeyProvider as any,
};

export function Web3AuthWrapper({ children }: Web3AuthWrapperProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render Web3Auth on client-side to avoid SSR issues
  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <Web3AuthProvider config={{ web3AuthOptions: web3AuthOptions as any }}>
      <Web3AuthInnerProvider
        config={{ web3AuthOptions: web3AuthOptions as any }}
      >
        {children}
      </Web3AuthInnerProvider>
    </Web3AuthProvider>
  );
}

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
 * Check if mock authentication is enabled
 */
export const isMockAuthEnabled = (): boolean => {
  return (
    process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true' ||
    process.env.NODE_ENV === 'development'
  );
};
