'use client';

/**
 * Presentation Mode Indicator
 * Shows when the application is running in demo/presentation mode
 */

import { useEffect, useState } from 'react';
import { Monitor } from 'lucide-react';

export function PresentationModeIndicator() {
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  useEffect(() => {
    // Check if presentation mode is enabled
    const presentationMode =
      process.env.NEXT_PUBLIC_PRESENTATION_MODE === 'true' ||
      (typeof window !== 'undefined' &&
        window.location.search.includes('presentation=true'));

    setIsPresentationMode(presentationMode);
  }, []);

  if (!isPresentationMode) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4" />
          <span className="text-sm font-medium">DEMO MODE</span>
        </div>
      </div>
    </div>
  );
}
