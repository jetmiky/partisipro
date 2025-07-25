'use client';

import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Package,
  FileText,
  BarChart3,
  Building,
  Wallet,
  TrendingUp,
  Shield,
  Settings,
  Layers,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  userType?: 'admin' | 'spv' | 'investor';
}

const Sidebar = ({
  isOpen = true,
  onClose,
  userType = 'admin',
}: SidebarProps) => {
  const pathname = usePathname();

  // Navigation items based on user type
  const getNavigationItems = () => {
    switch (userType) {
      case 'admin':
        return [
          {
            id: 'dashboard',
            icon: LayoutDashboard,
            label: 'Dashboard',
            href: '/admin/dashboard',
          },
          {
            id: 'projects',
            icon: FolderOpen,
            label: 'Projects',
            href: '/admin/projects',
          },
          {
            id: 'spv',
            icon: Building,
            label: 'SPV Management',
            href: '/admin/spv',
          },
          { id: 'users', icon: Users, label: 'Users', href: '/admin/users' },
          {
            id: 'transactions',
            icon: TrendingUp,
            label: 'Transactions',
            href: '/admin/transactions',
          },
          {
            id: 'fees',
            icon: Wallet,
            label: 'Fee Management',
            href: '/admin/fees',
          },
          {
            id: 'reports',
            icon: BarChart3,
            label: 'Reports',
            href: '/admin/reports',
          },
          {
            id: 'settings',
            icon: Settings,
            label: 'Settings',
            href: '/admin/settings',
          },
        ];
      case 'spv':
        return [
          {
            id: 'dashboard',
            icon: LayoutDashboard,
            label: 'Dashboard',
            href: '/spv/dashboard',
          },
          {
            id: 'create',
            icon: Package,
            label: 'Create Project',
            href: '/spv/create',
          },
          {
            id: 'projects',
            icon: FolderOpen,
            label: 'My Projects',
            href: '/spv/projects',
          },
          {
            id: 'financials',
            icon: Wallet,
            label: 'Financials',
            href: '/spv/financials',
          },
          {
            id: 'governance',
            icon: Shield,
            label: 'Governance',
            href: '/spv/governance',
          },
          {
            id: 'reports',
            icon: BarChart3,
            label: 'Reports',
            href: '/spv/reports',
          },
        ];
      case 'investor':
        return [
          {
            id: 'dashboard',
            icon: LayoutDashboard,
            label: 'Dashboard',
            href: '/dashboard',
          },
          {
            id: 'marketplace',
            icon: Package,
            label: 'Marketplace',
            href: '/marketplace',
          },
          {
            id: 'portfolio',
            icon: TrendingUp,
            label: 'Portfolio',
            href: '/portfolio',
          },
          { id: 'claim', icon: Wallet, label: 'Claim Rewards', href: '/claim' },
          {
            id: 'governance',
            icon: Shield,
            label: 'Governance',
            href: '/governance',
          },
          { id: 'history', icon: FileText, label: 'History', href: '/history' },
          { id: 'profile', icon: Users, label: 'Profile', href: '/profile' },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 z-50 h-full glass-sidebar transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        w-64 flex flex-col
      `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-200/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-900">Partisipro</h1>
              <p className="text-xs text-primary-600">PPP Platform</p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-50/50 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map(item => (
            <div key={item.id}>
              <a
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                      : 'text-primary-600 hover:bg-primary-50/50 hover:text-primary-800'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </a>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-primary-200/30">
          <div className="flex items-center gap-3 text-xs text-primary-600">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-success-500 rounded-full mr-1 animate-pulse"></div>
              <span>Online</span>
            </div>
            <span>•</span>
            <span>Arbitrum Network</span>
          </div>

          {/* Version info */}
          <div className="mt-2 text-primary-500">
            <p className="text-xs">Version 0.1.0</p>
            <p className="text-xs">©2025 Partisipro</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
