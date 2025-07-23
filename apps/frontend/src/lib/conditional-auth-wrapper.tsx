'use client';

/**
 * Conditional Authentication Wrapper
 * Switches between Web3Auth and Presentation Mode based on environment
 */

import { ReactNode } from 'react';
import { Web3AuthWrapper } from './web3auth-provider';
import { PresentationAuthProvider } from './presentation-auth-provider';

interface ConditionalAuthWrapperProps {
  children: ReactNode;
}

// Check if presentation mode is enabled
const isPresentationMode = (): boolean => {
  // Check environment variable
  if (process.env.NEXT_PUBLIC_PRESENTATION_MODE === 'true') {
    return true;
  }

  // Force presentation mode during build to avoid SSR issues
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
    return true;
  }

  // Check URL parameter (client-side only)
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('presentation') === 'true';
  }

  return false;
};

export function ConditionalAuthWrapper({
  children,
}: ConditionalAuthWrapperProps) {
  const presentationMode = isPresentationMode();

  if (presentationMode) {
    return (
      <PresentationAuthProvider initialRole="investor">
        {children}
      </PresentationAuthProvider>
    );
  }

  return <Web3AuthWrapper>{children}</Web3AuthWrapper>;
}
