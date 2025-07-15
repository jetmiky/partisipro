import { registerAs } from '@nestjs/config';

export interface BlockchainConfig {
  network: string;
  rpcUrl: string;
  chainId: number;
  privateKey?: string;
  contracts: {
    // Core Infrastructure
    PlatformRegistry: string;
    PlatformTreasury: string;
    ProjectFactory: string;

    // ERC-3643 Compliance Infrastructure
    ClaimTopicsRegistry: string;
    TrustedIssuersRegistry: string;
    IdentityRegistry: string;

    // Project Templates (for cloning)
    ProjectToken: string;
    ProjectOffering: string;
    ProjectTreasury: string;
    ProjectGovernance: string;
  };
  gasSettings: {
    gasLimit: number;
    gasPrice: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
  };
}

export default registerAs('blockchain', (): BlockchainConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isTestnet = process.env.BLOCKCHAIN_NETWORK === 'arbitrum-sepolia';

  return {
    network: process.env.BLOCKCHAIN_NETWORK || 'arbitrum-sepolia',
    rpcUrl:
      process.env.ARBITRUM_SEPOLIA_RPC_URL ||
      'https://sepolia-rollup.arbitrum.io/rpc',
    chainId: isTestnet ? 421614 : 42161, // Arbitrum Sepolia : Arbitrum One
    privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY,

    contracts: {
      // Core Infrastructure - Deployed addresses from blockchain platform
      PlatformRegistry: '0xc27bDcdeA460de9A76f759e785521a5cb834B7a1',
      PlatformTreasury: '0x53ab91a863B79824c4243EB258Ce9F23a0fAB89A',
      ProjectFactory: '0xC3abeE18DCfE502b38d0657dAc04Af8a746913D1',

      // ERC-3643 Compliance Infrastructure
      ClaimTopicsRegistry: '0x2DbA5D6bdb79Aa318cB74300D62F54e7baB949f6',
      TrustedIssuersRegistry: '0x812aA860f141D48E6c294AFD7ad6437a17051235',
      IdentityRegistry: '0x7f7ae1E07EedfEeeDd7A96ECA67dce85fe2A84eA',

      // Project Templates (for cloning)
      ProjectToken: '0x1f8Fb3846541571a5E3ed05f311d4695f02dc8Cd',
      ProjectOffering: '0x445b8Aa90eA5d2E80916Bc0f8ACc150d9b91634F',
      ProjectTreasury: '0x6662D1f5103dB37Cb72dE44b016c240167c44c35',
      ProjectGovernance: '0x1abd0E1e64258450e8F74f43Bc1cC47bfE6Efa23',
    },

    gasSettings: {
      gasLimit: 500000,
      gasPrice: '100000000', // 0.1 Gwei for Arbitrum
      maxFeePerGas: '200000000', // 0.2 Gwei
      maxPriorityFeePerGas: '100000000', // 0.1 Gwei
    },
  };
});
