'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  X,
  ArrowRight,
} from 'lucide-react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  persistent?: boolean;
  showProgress?: boolean;
}

const notificationIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const notificationStyles = {
  success: 'bg-success-50 border-success-200 text-success-800',
  error: 'bg-error-50 border-error-200 text-error-800',
  warning: 'bg-warning-50 border-warning-200 text-warning-800',
  info: 'bg-primary-50 border-primary-200 text-primary-800',
};

const iconStyles = {
  success: 'text-success-500',
  error: 'text-error-500',
  warning: 'text-warning-500',
  info: 'text-primary-500',
};

const Notification = ({
  type,
  title,
  message,
  duration = 5000,
  position = 'top-right',
  action,
  onClose,
  persistent = false,
  showProgress = true,
}: NotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const Icon = notificationIcons[type];

  // Entry animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // Auto-close functionality
  useEffect(() => {
    if (persistent) return;

    const startTime = Date.now();

    // Progress bar animation
    if (showProgress) {
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - elapsed);
        const progressPercent = (remaining / duration) * 100;

        setProgress(progressPercent);

        if (remaining > 0) {
          progressIntervalRef.current = setTimeout(updateProgress, 16);
        }
      };

      updateProgress();
    }

    // Auto-close timer
    timerRef.current = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (progressIntervalRef.current) {
        clearTimeout(progressIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, persistent, showProgress]);

  const handleClose = () => {
    setIsExiting(true);

    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 200);
  };

  // Position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  // Animation classes
  const getAnimationClasses = () => {
    const isTopPosition = position.includes('top');
    const isLeftPosition = position.includes('left');
    const isCenterPosition = position.includes('center');

    if (isCenterPosition) {
      return cn(
        'transition-all duration-300 ease-out',
        isVisible && !isExiting
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-4 scale-95'
      );
    }

    const slideDirection = isTopPosition
      ? isVisible && !isExiting
        ? 'translate-y-0'
        : '-translate-y-2'
      : isVisible && !isExiting
        ? 'translate-y-0'
        : 'translate-y-2';

    const slideX = isLeftPosition
      ? isVisible && !isExiting
        ? 'translate-x-0'
        : '-translate-x-2'
      : isVisible && !isExiting
        ? 'translate-x-0'
        : 'translate-x-2';

    return cn(
      'transition-all duration-300 ease-out',
      isVisible && !isExiting
        ? 'opacity-100 translate-y-0 translate-x-0'
        : `opacity-0 ${slideDirection} ${slideX}`
    );
  };

  return (
    <div className={cn('fixed z-50 w-full max-w-md', getPositionClasses())}>
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border shadow-lg backdrop-blur-sm',
          notificationStyles[type],
          getAnimationClasses()
        )}
      >
        {/* Progress bar */}
        {showProgress && !persistent && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-black/10">
            <div
              className="h-full bg-current transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              <Icon className={cn('w-5 h-5', iconStyles[type])} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{title}</h4>
                  {message && (
                    <p className="mt-1 text-sm opacity-90">{message}</p>
                  )}
                </div>

                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="flex-shrink-0 ml-2 text-current opacity-60 hover:opacity-100 transition-opacity duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action button */}
              {action && (
                <div className="mt-3">
                  <button
                    onClick={action.onClick}
                    className="inline-flex items-center gap-1 text-xs font-medium text-current opacity-80 hover:opacity-100 transition-opacity duration-200"
                  >
                    {action.label}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notification Manager
interface NotificationItem extends NotificationProps {
  id: string;
}

class NotificationManager {
  private notifications: NotificationItem[] = [];
  private listeners: Set<(notifications: NotificationItem[]) => void> =
    new Set();

  add(notification: Omit<NotificationProps, 'id' | 'onClose'>) {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newNotification: NotificationItem = {
      ...notification,
      id,
      onClose: () => this.remove(id),
    };

    this.notifications.push(newNotification);
    this.notifyListeners();

    return id;
  }

  remove(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  clear() {
    this.notifications = [];
    this.notifyListeners();
  }

  subscribe(listener: (notifications: NotificationItem[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }
}

export const notifications = new NotificationManager();

// Toast Provider Component
export const ToastProvider = () => {
  const [notificationList, setNotificationList] = useState<NotificationItem[]>(
    []
  );

  useEffect(() => {
    const unsubscribe = notifications.subscribe(setNotificationList);
    return () => {
      unsubscribe();
    };
  }, []);

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-50">
      {notificationList.map(notification => (
        <Notification key={notification.id} {...notification} />
      ))}
    </div>,
    document.body
  );
};

// Toast utility functions
export const toast = {
  success: (title: string, options?: Partial<NotificationProps>) =>
    notifications.add({ ...options, type: 'success', title }),

  error: (title: string, options?: Partial<NotificationProps>) =>
    notifications.add({ ...options, type: 'error', title }),

  warning: (title: string, options?: Partial<NotificationProps>) =>
    notifications.add({ ...options, type: 'warning', title }),

  info: (title: string, options?: Partial<NotificationProps>) =>
    notifications.add({ ...options, type: 'info', title }),
};

export { Notification };
