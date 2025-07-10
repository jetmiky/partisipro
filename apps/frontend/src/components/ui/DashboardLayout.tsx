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
  userName = 'Michael Nyoman',
  userRole = 'Admin',
  notificationCount = 3,
}: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userType={userType}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <DashboardHeader
          onMenuToggle={toggleSidebar}
          userName={userName}
          userRole={userRole}
          notificationCount={notificationCount}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
