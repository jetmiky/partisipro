// Re-export shared constants
export * from '@partisipro/shared';

// Frontend-specific constants
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
export const BLOCKCHAIN_NETWORK = process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK || 'arbitrum-sepolia';

export const NAVIGATION_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', current: false },
  { name: 'Projects', href: '/projects', current: false },
  { name: 'Portfolio', href: '/portfolio', current: false },
  { name: 'Marketplace', href: '/marketplace', current: false },
];

export const WALLET_CONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

export const DEBOUNCE_DELAY = 300;
export const POLLING_INTERVAL = 30000; // 30 seconds
export const TOAST_DURATION = 5000; // 5 seconds