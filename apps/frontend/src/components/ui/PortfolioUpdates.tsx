'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Clock,
  CheckCircle,
  Info,
  X,
} from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import type { PortfolioUpdate } from '@/types';

interface PortfolioUpdatesProps {
  onMarkAllRead?: () => void;
  onUpdateRead?: (updateId: string) => void;
}

export function PortfolioUpdates({
  onMarkAllRead,
  onUpdateRead,
}: PortfolioUpdatesProps) {
  const [updates, setUpdates] = useState<
    (PortfolioUpdate & { id: string; read: boolean })[]
  >([]);
  const [isLive, setIsLive] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'important'>('all');

  // Mock real-time updates
  useEffect(() => {
    if (!isLive) return;

    const mockUpdates: (PortfolioUpdate & { id: string; read: boolean })[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        type: 'return',
        projectId: '1',
        projectName: 'Jakarta-Bandung High-Speed Rail Extension',
        impact: {
          valueChange: 125000,
          percentageChange: 2.5,
          newROI: 15.3,
        },
        description: 'Monthly profit distribution received',
        read: false,
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        type: 'market_change',
        projectId: '2',
        projectName: 'Soekarno-Hatta Airport Terminal 4',
        impact: {
          valueChange: -45000,
          percentageChange: -1.2,
          newROI: 7.8,
        },
        description: 'Market valuation adjustment based on industry trends',
        read: false,
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        type: 'governance',
        projectId: '1',
        projectName: 'Jakarta-Bandung High-Speed Rail Extension',
        impact: {
          valueChange: 0,
          percentageChange: 0,
          newROI: 15.0,
        },
        description: 'New governance proposal available for voting',
        read: true,
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: 'investment',
        projectId: '4',
        projectName: 'Bali Renewable Energy Plant',
        impact: {
          valueChange: 280000,
          percentageChange: 14.0,
          newROI: 14.0,
        },
        description:
          'Investment milestone reached - project entering operational phase',
        read: true,
      },
    ];

    setUpdates(mockUpdates);

    // Simulate new updates every 30 seconds
    const interval = setInterval(() => {
      const newUpdate: PortfolioUpdate & { id: string; read: boolean } = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: Math.random() > 0.5 ? 'return' : 'market_change',
        projectId: Math.floor(Math.random() * 4 + 1).toString(),
        projectName: [
          'Jakarta-Bandung High-Speed Rail Extension',
          'Soekarno-Hatta Airport Terminal 4',
          'Bali Renewable Energy Plant',
          'Jakarta Smart Water Management',
        ][Math.floor(Math.random() * 4)],
        impact: {
          valueChange: (Math.random() - 0.5) * 100000,
          percentageChange: (Math.random() - 0.5) * 5,
          newROI: 8 + Math.random() * 10,
        },
        description: 'Real-time portfolio update',
        read: false,
      };

      setUpdates(prev => [newUpdate, ...prev.slice(0, 9)]);
    }, 30000);

    return () => clearInterval(interval);
  }, [isLive]);

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'investment':
        return <DollarSign className="w-4 h-4" />;
      case 'return':
        return <TrendingUp className="w-4 h-4" />;
      case 'governance':
        return <Activity className="w-4 h-4" />;
      case 'market_change':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getUpdateColor = (type: string, valueChange: number) => {
    switch (type) {
      case 'investment':
        return 'bg-blue-100 text-blue-600';
      case 'return':
        return 'bg-green-100 text-green-600';
      case 'governance':
        return 'bg-purple-100 text-purple-600';
      case 'market_change':
        return valueChange >= 0
          ? 'bg-green-100 text-green-600'
          : 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleMarkAsRead = (updateId: string) => {
    setUpdates(prev =>
      prev.map(update =>
        update.id === updateId ? { ...update, read: true } : update
      )
    );
    onUpdateRead?.(updateId);
  };

  const handleMarkAllRead = () => {
    setUpdates(prev => prev.map(update => ({ ...update, read: true })));
    onMarkAllRead?.();
  };

  const filteredUpdates = updates.filter(update => {
    switch (filter) {
      case 'unread':
        return !update.read;
      case 'important':
        return (
          update.type === 'investment' ||
          Math.abs(update.impact.valueChange) > 50000
        );
      default:
        return true;
    }
  });

  const unreadCount = updates.filter(update => !update.read).length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="relative">
            <Bell className="w-6 h-6 text-gray-600" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Portfolio Updates
            </h3>
            <p className="text-gray-600">
              Real-time changes to your investments
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}
            ></div>
            <span className="text-sm text-gray-600">
              {isLive ? 'Live' : 'Paused'}
            </span>
          </div>
          <Button
            variant="secondary"
            className="text-sm"
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex border border-gray-200 rounded-lg">
          {[
            { key: 'all', label: 'All' },
            { key: 'unread', label: `Unread (${unreadCount})` },
            { key: 'important', label: 'Important' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                filter === tab.key
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            className="text-sm"
            onClick={handleMarkAllRead}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Mark All Read
          </Button>
        )}
      </div>

      {/* Updates List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredUpdates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No updates found</p>
            <p className="text-sm">
              {filter === 'unread'
                ? 'All updates have been read'
                : 'Your portfolio updates will appear here'}
            </p>
          </div>
        ) : (
          filteredUpdates.map(update => (
            <div
              key={update.id}
              className={`p-4 border rounded-lg transition-all ${
                update.read
                  ? 'border-gray-200 bg-gray-50'
                  : 'border-blue-200 bg-blue-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  <div
                    className={`p-2 rounded-lg mr-3 ${getUpdateColor(
                      update.type,
                      update.impact.valueChange
                    )}`}
                  >
                    {getUpdateIcon(update.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900">
                        {update.projectName}
                      </h4>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTimeAgo(update.timestamp)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {update.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`text-sm font-medium ${
                            update.impact.valueChange >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {update.impact.valueChange >= 0 ? '+' : ''}
                          {formatCurrency(update.impact.valueChange)}
                        </div>
                        <div
                          className={`text-sm ${
                            update.impact.percentageChange >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {update.impact.percentageChange >= 0 ? '+' : ''}
                          {update.impact.percentageChange.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">
                          ROI: {update.impact.newROI.toFixed(1)}%
                        </div>
                      </div>
                      {!update.read && (
                        <Button
                          variant="secondary"
                          className="text-xs px-2 py-1"
                          onClick={() => handleMarkAsRead(update.id)}
                        >
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                {!update.read && (
                  <button
                    onClick={() => handleMarkAsRead(update.id)}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {updates.length}
            </div>
            <div className="text-sm text-gray-600">Total Updates</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">
              {updates.filter(u => u.impact.valueChange > 0).length}
            </div>
            <div className="text-sm text-gray-600">Positive Changes</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-600">
              {updates.filter(u => u.type === 'governance').length}
            </div>
            <div className="text-sm text-gray-600">Governance Updates</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
