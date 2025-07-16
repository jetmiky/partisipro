/**
 * WebSocket Service
 * Handles real-time connections to backend Socket.IO gateway
 */

import { io, Socket } from 'socket.io-client';

export interface WebSocketEventHandlers {
  portfolio_update?: (data: any) => void;
  governance_update?: (data: any) => void;
  kyc_status_update?: (data: any) => void;
  project_update?: (data: any) => void;
  profit_distribution?: (data: any) => void;
  system_notification?: (data: any) => void;
  investment_update?: (data: any) => void;
  identity_update?: (data: any) => void;
}

export interface WebSocketSubscription {
  type: keyof WebSocketEventHandlers;
  data?: any;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private eventHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  /**
   * Initialize WebSocket connection
   */
  async connect(authToken: string): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

    this.socket = io(wsUrl, {
      auth: {
        token: authToken,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Failed to create socket'));
        return;
      }

      this.socket.on('connect', () => {
        // WebSocket connected successfully
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', error => {
        // WebSocket connection error - handled by UI
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('disconnect', (_reason: any) => {
        // WebSocket disconnected - handled by UI
        this.isConnected = false;
        this.handleDisconnect();
      });

      // Set up event listeners for all subscription types
      this.setupEventListeners();
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      // WebSocket disconnected
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(userId: string, subscriptions: WebSocketSubscription[]): void {
    if (!this.isConnected || !this.socket) {
      // Cannot subscribe - WebSocket not connected
      return;
    }

    subscriptions.forEach(subscription => {
      const eventName = `subscribe_${subscription.type}`;
      // Subscribing to event for user

      this.socket!.emit(eventName, {
        userId,
        ...subscription.data,
      });
    });
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(userId: string, subscriptions: string[]): void {
    if (!this.isConnected || !this.socket) {
      return;
    }

    subscriptions.forEach(subscription => {
      const eventName = `unsubscribe_${subscription}`;
      // Unsubscribing from event for user

      this.socket!.emit(eventName, { userId });
    });
  }

  /**
   * Add event handler
   */
  on(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Remove event handler
   */
  off(event: string, handler: (data: any) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Send message to server
   */
  emit(event: string, data: any): void {
    if (!this.isConnected || !this.socket) {
      // Cannot emit - WebSocket not connected
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Setup event listeners for all real-time events
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Portfolio updates
    this.socket.on('portfolio_update', data => {
      // Portfolio update received
      this.triggerHandlers('portfolio_update', data);
    });

    // Governance updates
    this.socket.on('governance_update', data => {
      // Governance update received
      this.triggerHandlers('governance_update', data);
    });

    // KYC status updates
    this.socket.on('kyc_status_update', data => {
      // KYC status update received
      this.triggerHandlers('kyc_status_update', data);
    });

    // Project updates
    this.socket.on('project_update', data => {
      // Project update received
      this.triggerHandlers('project_update', data);
    });

    // Profit distribution
    this.socket.on('profit_distribution', data => {
      // Profit distribution received
      this.triggerHandlers('profit_distribution', data);
    });

    // System notifications
    this.socket.on('system_notification', data => {
      // System notification received
      this.triggerHandlers('system_notification', data);
    });

    // Investment updates
    this.socket.on('investment_update', data => {
      // Investment update received
      this.triggerHandlers('investment_update', data);
    });

    // Identity updates
    this.socket.on('identity_update', data => {
      // Identity update received
      this.triggerHandlers('identity_update', data);
    });
  }

  /**
   * Trigger event handlers
   */
  private triggerHandlers(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          // Error in event handler - silently handled
        }
      });
    }
  }

  /**
   * Handle disconnection and reconnection
   */
  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      // Attempting to reconnect

      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          this.socket.connect();
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      // Max reconnection attempts reached
    }
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();

// Export the class for potential custom instances
export { WebSocketService };
