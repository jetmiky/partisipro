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
  private eventHandlers: Map<string, Function[]> = new Map();
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
        console.log('✅ WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket disconnected:', reason);
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
      console.log('🔌 WebSocket disconnected');
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(userId: string, subscriptions: WebSocketSubscription[]): void {
    if (!this.isConnected || !this.socket) {
      console.warn('⚠️ Cannot subscribe - WebSocket not connected');
      return;
    }

    subscriptions.forEach(subscription => {
      const eventName = `subscribe_${subscription.type}`;
      console.log(`📡 Subscribing to ${eventName} for user ${userId}`);
      
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
      console.log(`📡 Unsubscribing from ${eventName} for user ${userId}`);
      
      this.socket!.emit(eventName, { userId });
    });
  }

  /**
   * Add event handler
   */
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Remove event handler
   */
  off(event: string, handler: Function): void {
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
      console.warn(`⚠️ Cannot emit ${event} - WebSocket not connected`);
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
    this.socket.on('portfolio_update', (data) => {
      console.log('📊 Portfolio update received:', data);
      this.triggerHandlers('portfolio_update', data);
    });

    // Governance updates
    this.socket.on('governance_update', (data) => {
      console.log('🗳️ Governance update received:', data);
      this.triggerHandlers('governance_update', data);
    });

    // KYC status updates
    this.socket.on('kyc_status_update', (data) => {
      console.log('🆔 KYC status update received:', data);
      this.triggerHandlers('kyc_status_update', data);
    });

    // Project updates
    this.socket.on('project_update', (data) => {
      console.log('🏗️ Project update received:', data);
      this.triggerHandlers('project_update', data);
    });

    // Profit distribution
    this.socket.on('profit_distribution', (data) => {
      console.log('💰 Profit distribution received:', data);
      this.triggerHandlers('profit_distribution', data);
    });

    // System notifications
    this.socket.on('system_notification', (data) => {
      console.log('🔔 System notification received:', data);
      this.triggerHandlers('system_notification', data);
    });

    // Investment updates
    this.socket.on('investment_update', (data) => {
      console.log('💳 Investment update received:', data);
      this.triggerHandlers('investment_update', data);
    });

    // Identity updates
    this.socket.on('identity_update', (data) => {
      console.log('👤 Identity update received:', data);
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
          console.error(`Error in ${event} handler:`, error);
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
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          this.socket.connect();
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();

// Export the class for potential custom instances
export { WebSocketService };