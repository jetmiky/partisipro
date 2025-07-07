export const SUPPORTED_NETWORKS = {
  ARBITRUM_SEPOLIA: {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    blockExplorer: 'https://sepolia.arbiscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    testnet: true,
  },
  ARBITRUM_ONE: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    testnet: false,
  },
  LOCALHOST: {
    chainId: 1337,
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: 'http://localhost:8545',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    testnet: true,
  },
} as const;

export const DEFAULT_NETWORK = SUPPORTED_NETWORKS.ARBITRUM_SEPOLIA;

export const NETWORK_NAMES = {
  [SUPPORTED_NETWORKS.ARBITRUM_SEPOLIA.chainId]: 'Arbitrum Sepolia',
  [SUPPORTED_NETWORKS.ARBITRUM_ONE.chainId]: 'Arbitrum One',
  [SUPPORTED_NETWORKS.LOCALHOST.chainId]: 'Localhost',
} as const;

export const isTestnet = (chainId: number): boolean => {
  return Object.values(SUPPORTED_NETWORKS).find(
    network => network.chainId === chainId
  )?.testnet ?? false;
};

export const getNetworkByChainId = (chainId: number) => {
  return Object.values(SUPPORTED_NETWORKS).find(
    network => network.chainId === chainId
  );
};