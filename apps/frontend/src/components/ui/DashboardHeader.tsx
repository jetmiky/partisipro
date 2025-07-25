'use client';

import { useState } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  User,
  Settings,
  LogOut,
} from 'lucide-react';

interface DashboardHeaderProps {
  onMenuToggle?: () => void;
  userName?: string;
  userRole?: string;
  notificationCount?: number;
}

const DashboardHeader = ({
  onMenuToggle,
  userName = 'Michael Nyoman',
  userRole = 'Admin',
  notificationCount = 3,
}: DashboardHeaderProps) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const userMenuItems = [
    { icon: User, label: 'Profile', href: '/profile' },
    { icon: Settings, label: 'Settings', href: '/settings' },
    { icon: LogOut, label: 'Sign Out', href: '/auth/logout' },
  ];

  const notifications = [
    {
      id: 1,
      message: 'New project investment received',
      time: '2 min ago',
      unread: true,
    },
    {
      id: 2,
      message: 'KYC verification completed',
      time: '1 hour ago',
      unread: true,
    },
    {
      id: 3,
      message: 'Monthly report generated',
      time: '3 hours ago',
      unread: false,
    },
  ];

  return (
    <header className="glass-modern shadow-none border-b border-primary-200/30 h-16 grid grid-cols-[1fr_auto] gap-x-4 lg:px-6">
      {/* Left Section - Menu Toggle & Search */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-primary-50/50 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5 text-primary-600" />
        </button>

        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400" />
          <input
            type="text"
            placeholder="Search..."
            className="shadow-none w-64 md:w-full pl-10 pr-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border border-primary-300"
          />
        </div>
      </div>

      {/* Right Section - Notifications & User Menu */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 rounded-lg hover:bg-primary-50/50 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-primary-600" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsNotificationsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 glass-dropdown rounded-xl shadow-2xl border border-primary-200/30 z-20">
                <div className="p-4 border-b border-primary-200/30">
                  <h3 className="font-semibold text-lg text-primary-900">
                    Notifications
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-primary-100/30 last:border-b-0 hover:bg-primary-50/30 transition-colors ${
                        notification.unread ? 'bg-primary-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-primary-900">
                            {notification.message}
                          </p>
                          <p className="text-xs text-primary-500">
                            {notification.time}
                          </p>
                        </div>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-primary-500 rounded-full mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-primary-200/30">
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary-50/50 transition-colors"
            aria-label="User menu"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-medium text-sm">
                {userName
                  .split(' ')
                  .map(n => n[0])
                  .join('')}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-primary-900">{userName}</p>
              <p className="text-xs text-primary-500">{userRole}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-primary-400" />
          </button>

          {/* User Menu Dropdown */}
          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 glass-dropdown rounded-xl shadow-2xl border border-primary-200/30 z-20">
                <div className="p-4 border-b border-primary-200/30">
                  <p className="font-semibold text-primary-900">{userName}</p>
                  <p className="text-sm text-primary-500">{userRole}</p>
                </div>
                <div className="py-2">
                  {userMenuItems.map(item => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-primary-700 hover:bg-primary-50/50 transition-colors"
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
