/**
 * Presentation Mode Configuration
 * Enables/disables presentation mode for demo purposes
 */

// Environment variable to enable presentation mode
export const PRESENTATION_MODE_ENABLED =
  process.env.NEXT_PUBLIC_PRESENTATION_MODE === 'true' ||
  (typeof window !== 'undefined' &&
    window.location.search.includes('presentation=true'));

// Configuration flags for presentation mode
export const presentationConfig = {
  // Authentication
  bypassAuth: true,
  alwaysAuthenticated: true,
  mockTokens: true,

  // API calls
  useMockApi: true,
  simulateNetworkDelay: true,
  defaultDelayMs: 800,

  // UI behavior
  hideAuthButtons: false, // Keep buttons visible for demo flow
  skipKYCValidation: true,
  allowAllNavigation: true,

  // Demo data
  useRealisticData: true,
  showMockIndicators: false, // Set to true to show "DEMO MODE" indicators

  // WebSocket
  simulateRealTimeUpdates: true,
  updateIntervalMs: 30000,
};

// Utility functions
export const isPresentationMode = (): boolean => PRESENTATION_MODE_ENABLED;

export const getPresentationDelay = (customDelay?: number): number => {
  if (!PRESENTATION_MODE_ENABLED) return 0;
  return customDelay || presentationConfig.defaultDelayMs;
};

export const shouldSimulateDelay = (): boolean => {
  return PRESENTATION_MODE_ENABLED && presentationConfig.simulateNetworkDelay;
};
