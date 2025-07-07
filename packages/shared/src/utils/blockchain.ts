import { ethers } from 'ethers';

// Blockchain utility functions
export const parseEther = (value: string): bigint => {
  return ethers.parseEther(value);
};

export const formatEther = (value: bigint): string => {
  return ethers.formatEther(value);
};

export const parseUnits = (value: string, decimals: number): bigint => {
  return ethers.parseUnits(value, decimals);
};

export const formatUnits = (value: bigint, decimals: number): string => {
  return ethers.formatUnits(value, decimals);
};

export const getNetworkName = (chainId: number): string => {
  switch (chainId) {
    case 1337:
      return 'localhost';
    case 421614:
      return 'arbitrum-sepolia';
    case 42161:
      return 'arbitrum-one';
    default:
      return 'unknown';
  }
};
