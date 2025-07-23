'use client';

/**
 * Presentation Mode Indicator
 * Shows when the application is running in demo/presentation mode
 */

import { useEffect, useState } from 'react';
import { Monitor, Eye, Users } from 'lucide-react';

export function PresentationModeIndicator() {
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<'investor' | 'spv' | 'admin'>(
    'investor'
  );

  useEffect(() => {
    // Check if presentation mode is enabled
    const presentationMode =
      process.env.NEXT_PUBLIC_PRESENTATION_MODE === 'true' ||
      (typeof window !== 'undefined' &&
        window.location.search.includes('presentation=true'));

    setIsPresentationMode(presentationMode);

    // Extract user role from URL params if available
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const role = urlParams.get('role');
      if (role && ['investor', 'spv', 'admin'].includes(role)) {
        setCurrentUser(role as 'investor' | 'spv' | 'admin');
      }
    }
  }, []);

  const switchRole = (newRole: 'investor' | 'spv' | 'admin') => {
    setCurrentUser(newRole);

    // Update URL to reflect role change
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('role', newRole);
      url.searchParams.set('presentation', 'true');
      window.history.replaceState({}, '', url);

      // Reload to apply role change
      window.location.reload();
    }
  };

  if (!isPresentationMode) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4" />
          <span className="text-sm font-medium">DEMO MODE</span>
        </div>

        <div className="h-4 w-px bg-white/30"></div>

        <div className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          <span className="text-xs">{currentUser.toUpperCase()}</span>
        </div>

        <div className="relative group">
          <Users className="w-4 h-4 cursor-pointer hover:bg-white/20 rounded p-0.5 transition-colors" />

          {/* Role Switcher Dropdown */}
          <div className="absolute top-full right-0 mt-2 bg-white text-gray-800 rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all min-w-[120px]">
            <button
              onClick={() => switchRole('investor')}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded-t-lg ${
                currentUser === 'investor' ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              👤 Investor
            </button>
            <button
              onClick={() => switchRole('spv')}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                currentUser === 'spv' ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              🏢 SPV
            </button>
            <button
              onClick={() => switchRole('admin')}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded-b-lg ${
                currentUser === 'admin' ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              ⚙️ Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
