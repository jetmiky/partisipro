import { formatEther, parseEther } from 'ethers';

/**
 * Format Wei to Ether string
 */
export const formatWei = (wei: bigint, decimals: number = 4): string => {
  return Number(formatEther(wei)).toFixed(decimals);
};

/**
 * Parse Ether string to Wei
 */
export const parseEth = (ether: string): bigint => {
  return parseEther(ether);
};

/**
 * Format number as currency (IDR)
 */
export const formatCurrency = (
  amount: number | bigint,
  currency: string = 'IDR',
  locale: string = 'id-ID'
): string => {
  const num = typeof amount === 'bigint' ? Number(amount) : amount;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Format percentage
 */
export const formatPercentage = (
  value: number,
  decimals: number = 2
): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format large numbers with K, M, B suffixes
 */
export const formatLargeNumber = (num: number): string => {
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(1)}B`;
  }
  if (num >= 1e6) {
    return `${(num / 1e6).toFixed(1)}M`;
  }
  if (num >= 1e3) {
    return `${(num / 1e3).toFixed(1)}K`;
  }
  return num.toString();
};

/**
 * Format address for display (show first 6 and last 4 characters)
 */
export const formatAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Format date for display
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

/**
 * Format date and time for display
 */
export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Format duration in days
 */
export const formatDuration = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days} hari`;
  }
  if (hours > 0) {
    return `${hours} jam`;
  }
  return `${minutes} menit`;
};