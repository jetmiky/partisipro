// Re-export shared constants
export * from '@partisipro/shared';

// Frontend-specific constants
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const FRONTEND_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
export const BLOCKCHAIN_NETWORK =
  process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK || 'arbitrum-sepolia';

export const NAVIGATION_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', current: false },
  { name: 'Projects', href: '/projects', current: false },
  { name: 'Portfolio', href: '/portfolio', current: false },
  { name: 'Marketplace', href: '/marketplace', current: false },
  { name: 'Claim Rewards', href: '/claim', current: false },
];

export const SPV_NAVIGATION_ITEMS = [
  { name: 'Dashboard', href: '/spv/dashboard', current: false },
  { name: 'Create Project', href: '/spv/create', current: false },
  { name: 'My Projects', href: '/spv/projects', current: false },
  { name: 'Financials', href: '/spv/financials', current: false },
  { name: 'Governance', href: '/spv/governance', current: false },
];

export const ADMIN_NAVIGATION_ITEMS = [
  { name: 'Dashboard', href: '/admin/dashboard', current: false },
  { name: 'Projects', href: '/admin/projects', current: false },
  { name: 'SPV Management', href: '/admin/spv', current: false },
  { name: 'Users', href: '/admin/users', current: false },
  { name: 'Fee Management', href: '/admin/fees', current: false },
  { name: 'Settings', href: '/admin/settings', current: false },
];

export const WALLET_CONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

export const DEBOUNCE_DELAY = 300;
export const POLLING_INTERVAL = 30000; // 30 seconds
export const TOAST_DURATION = 5000; // 5 seconds
