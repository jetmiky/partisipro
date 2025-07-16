/**
 * WebSocket Hook
 * React hook for managing WebSocket connections and real-time updates
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { useAuth } from './useAuth';
import { webSocketService, WebSocketSubscription, WebSocketEventHandlers } from '../services/websocket.service';

export interface UseWebSocketOptions {
  subscriptions?: WebSocketSubscription[];
  autoConnect?: boolean;
  eventHandlers?: WebSocketEventHandlers;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribe: (subscriptions: WebSocketSubscription[]) => void;
  unsubscribe: (events: string[]) => void;
  emit: (event: string, data: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connectAttemptRef = useRef<boolean>(false);

  const {
    subscriptions = [],
    autoConnect = true,
    eventHandlers = {},
  } = options;

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(async () => {
    if (!isAuthenticated || !user || connectAttemptRef.current) {
      return;
    }

    connectAttemptRef.current = true;
    setIsConnecting(true);
    setError(null);

    try {
      // Get auth token from storage or auth service
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token available');
      }

      await webSocketService.connect(token);
      setIsConnected(true);

      // Subscribe to initial subscriptions
      if (subscriptions.length > 0) {
        webSocketService.subscribe(user.id, subscriptions);
      }

      console.log('✅ WebSocket connected and subscribed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMessage);
      console.error('❌ WebSocket connection failed:', err);
    } finally {
      setIsConnecting(false);
      connectAttemptRef.current = false;
    }
  }, [isAuthenticated, user, subscriptions]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
    connectAttemptRef.current = false;
  }, []);

  /**
   * Subscribe to new events
   */
  const subscribe = useCallback((newSubscriptions: WebSocketSubscription[]) => {
    if (!user || !isConnected) return;
    
    webSocketService.subscribe(user.id, newSubscriptions);
  }, [user, isConnected]);

  /**
   * Unsubscribe from events
   */
  const unsubscribe = useCallback((events: string[]) => {
    if (!user || !isConnected) return;
    
    webSocketService.unsubscribe(user.id, events);
  }, [user, isConnected]);

  /**
   * Emit event to server
   */
  const emit = useCallback((event: string, data: any) => {
    webSocketService.emit(event, data);
  }, []);

  /**
   * Setup event handlers
   */
  useEffect(() => {
    const cleanupHandlers: Array<() => void> = [];

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      if (handler) {
        webSocketService.on(event, handler);
        cleanupHandlers.push(() => webSocketService.off(event, handler));
      }
    });

    return () => {
      cleanupHandlers.forEach(cleanup => cleanup());
    };
  }, [eventHandlers]);

  /**
   * Auto-connect when authenticated
   */
  useEffect(() => {
    if (autoConnect && isAuthenticated && user && !isConnected && !isConnecting) {
      connect();
    }
  }, [autoConnect, isAuthenticated, user, isConnected, isConnecting, connect]);

  /**
   * Auto-disconnect when not authenticated
   */
  useEffect(() => {
    if (!isAuthenticated && isConnected) {
      disconnect();
    }
  }, [isAuthenticated, isConnected, disconnect]);

  /**
   * Monitor WebSocket connection status
   */
  useEffect(() => {
    const checkConnection = () => {
      const actualStatus = webSocketService.getConnectionStatus();
      if (actualStatus !== isConnected) {
        setIsConnected(actualStatus);
      }
    };

    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, [isConnected]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [isConnected, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    emit,
  };
}

/**
 * Specialized hook for portfolio real-time updates
 */
export function usePortfolioWebSocket() {
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { isConnected } = useWebSocket({
    subscriptions: [
      { type: 'portfolio_update' },
      { type: 'investment_update' },
      { type: 'profit_distribution' },
    ],
    eventHandlers: {
      portfolio_update: (data) => {
        setPortfolioData(data);
        setLastUpdate(new Date());
      },
      investment_update: (data) => {
        console.log('📈 Investment update:', data);
        setLastUpdate(new Date());
      },
      profit_distribution: (data) => {
        console.log('💰 Profit distribution:', data);
        setLastUpdate(new Date());
      },
    },
  });

  return {
    portfolioData,
    lastUpdate,
    isConnected,
  };
}

/**
 * Specialized hook for governance real-time updates
 */
export function useGovernanceWebSocket() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const { isConnected } = useWebSocket({
    subscriptions: [
      { type: 'governance_update' },
    ],
    eventHandlers: {
      governance_update: (data) => {
        if (data.type === 'proposal_created' || data.type === 'proposal_updated') {
          setProposals(prev => {
            const index = prev.findIndex(p => p.id === data.proposal.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = data.proposal;
              return updated;
            } else {
              return [...prev, data.proposal];
            }
          });
        }
        
        setNotifications(prev => [data, ...prev.slice(0, 9)]); // Keep last 10
      },
    },
  });

  return {
    proposals,
    notifications,
    isConnected,
  };
}

/**
 * Specialized hook for KYC real-time updates
 */
export function useKYCWebSocket() {
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [verificationProgress, setVerificationProgress] = useState<number>(0);

  const { isConnected } = useWebSocket({
    subscriptions: [
      { type: 'kyc_status_update' },
      { type: 'identity_update' },
    ],
    eventHandlers: {
      kyc_status_update: (data) => {
        setKycStatus(data);
        
        // Calculate progress based on status
        const progressMap: Record<string, number> = {
          'pending': 10,
          'processing': 50,
          'completed': 100,
          'failed': 0,
        };
        setVerificationProgress(progressMap[data.status] || 0);
      },
      identity_update: (data) => {
        console.log('🆔 Identity update:', data);
      },
    },
  });

  return {
    kycStatus,
    verificationProgress,
    isConnected,
  };
}