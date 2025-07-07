import { type Address, type Hash, type TransactionReceipt } from 'viem';

export interface TransactionResult {
  hash: Hash;
  receipt?: TransactionReceipt;
  blockNumber?: bigint;
  gasUsed?: bigint;
  status: TransactionStatus;
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed'
}

export interface ContractDeployment {
  contractName: string;
  address: Address;
  deploymentHash: Hash;
  blockNumber: bigint;
  deployer: Address;
  verified: boolean;
  networkId: number;
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  testnet: boolean;
}

export interface TokenInfo {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: bigint;
  logoUri?: string;
}

export interface WalletInfo {
  address: Address;
  isConnected: boolean;
  chainId?: number;
  balance?: bigint;
  ensName?: string;
}

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  totalCost: bigint;
}