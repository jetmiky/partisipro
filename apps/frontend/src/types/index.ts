// Re-export shared types
export * from '@partisipro/shared';

// Frontend-specific types
export interface WalletConnection {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string | null;
}

export interface UIState {
  loading: boolean;
  error: string | null;
  success: string | null;
}

export interface NavigationItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  current: boolean;
}

export interface FormState<T = Record<string, unknown>> {
  data: T;
  errors: Record<string, string>;
  isDirty: boolean;
  isSubmitting: boolean;
}
