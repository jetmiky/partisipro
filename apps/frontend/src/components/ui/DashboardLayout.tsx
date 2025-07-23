'use client';

import { useState } from 'react';
import DashboardHeader from './DashboardHeader';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType?: 'admin' | 'spv' | 'investor';
  userName?: string;
  userRole?: string;
  notificationCount?: number;
}

const DashboardLayout = ({
  children,
  userType = 'admin',
  userName = 'Rayya Danish',
  userRole = 'Admin',
  notificationCount = 3,
}: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen max-w-screen bg-gray-50 flex lg:grid lg:grid-cols-[auto_1fr]">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userType={userType}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <DashboardHeader
          onMenuToggle={toggleSidebar}
          userName={userName}
          userRole={userRole}
          notificationCount={notificationCount}
        />

        {/* Page Content */}
        <main className="flex-1 lg:px-6 lg:py-4">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
