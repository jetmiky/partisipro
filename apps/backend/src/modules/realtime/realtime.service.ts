import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { CacheService } from '../../common/services/cache.service';

interface ClientConnection {
  socketId: string;
  userId?: string;
  subscriptions: {
    portfolio?: boolean;
    governance?: { projectId?: string };
    kycStatus?: boolean;
    projectUpdates?: { projectId: string; userRole: string };
    profitDistribution?: { projectIds?: string[] };
  };
  connectedAt: Date;
}

@Injectable()
export class RealtimeService {
  private server: Server;
  private connections: Map<string, ClientConnection> = new Map();
  private readonly logger = new Logger(RealtimeService.name);

  constructor(private readonly cacheService: CacheService) {}

  setServer(server: Server) {
    this.server = server;
  }

  async addConnection(socketId: string, userId?: string) {
    const connection: ClientConnection = {
      socketId,
      userId,
      subscriptions: {},
      connectedAt: new Date(),
    };

    this.connections.set(socketId, connection);
    this.logger.log(
      `Added connection: ${socketId} for user: ${userId || 'anonymous'}`
    );

    // Cache connection info for persistence across server restarts
    await this.cacheConnection(socketId, connection);
  }

  async removeConnection(socketId: string) {
    const connection = this.connections.get(socketId);
    if (connection) {
      this.connections.delete(socketId);
      this.logger.log(
        `Removed connection: ${socketId} for user: ${connection.userId || 'anonymous'}`
      );

      // Remove from cache
      await this.cacheService.delete(`realtime:connection:${socketId}`);
    }
  }

  async subscribeToPortfolio(socketId: string, userId: string) {
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.subscriptions.portfolio = true;
      connection.userId = userId;
      await this.cacheConnection(socketId, connection);
      this.logger.log(
        `Client ${socketId} subscribed to portfolio updates for user ${userId}`
      );
    }
  }

  async subscribeToGovernance(
    socketId: string,
    userId: string,
    projectId?: string
  ) {
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.subscriptions.governance = { projectId };
      connection.userId = userId;
      await this.cacheConnection(socketId, connection);
      this.logger.log(
        `Client ${socketId} subscribed to governance updates${projectId ? ` for project ${projectId}` : ''}`
      );
    }
  }

  async subscribeToKYCStatus(socketId: string, userId: string) {
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.subscriptions.kycStatus = true;
      connection.userId = userId;
      await this.cacheConnection(socketId, connection);
      this.logger.log(
        `Client ${socketId} subscribed to KYC status updates for user ${userId}`
      );
    }
  }

  async subscribeToProjectUpdates(
    socketId: string,
    projectId: string,
    userRole: string
  ) {
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.subscriptions.projectUpdates = { projectId, userRole };
      await this.cacheConnection(socketId, connection);
      this.logger.log(
        `Client ${socketId} subscribed to project updates for project ${projectId}`
      );
    }
  }

  async subscribeToProfitDistribution(
    socketId: string,
    userId: string,
    projectIds?: string[]
  ) {
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.subscriptions.profitDistribution = { projectIds };
      connection.userId = userId;
      await this.cacheConnection(socketId, connection);
      this.logger.log(
        `Client ${socketId} subscribed to profit distribution updates for user ${userId}`
      );
    }
  }

  async unsubscribe(
    socketId: string,
    type: string,
    userId?: string,
    projectId?: string
  ) {
    const connection = this.connections.get(socketId);
    if (connection) {
      switch (type) {
        case 'portfolio':
          delete connection.subscriptions.portfolio;
          break;
        case 'governance':
          delete connection.subscriptions.governance;
          break;
        case 'kyc_status':
          delete connection.subscriptions.kycStatus;
          break;
        case 'project_updates':
          delete connection.subscriptions.projectUpdates;
          break;
        case 'profit_distribution':
          delete connection.subscriptions.profitDistribution;
          break;
        default:
          this.logger.warn(`Unknown subscription type: ${type}`);
      }
      await this.cacheConnection(socketId, connection);
      this.logger.log(
        `Client ${socketId} unsubscribed from ${type} - User: ${userId} and Project: ${projectId}`
      );
    }
  }

  // Broadcast methods for business logic integration

  async broadcastPortfolioUpdate(userId: string, portfolioData: any) {
    const relevantConnections = Array.from(this.connections.values()).filter(
      conn => conn.userId === userId && conn.subscriptions.portfolio
    );

    for (const connection of relevantConnections) {
      this.server.to(connection.socketId).emit('portfolio_update', {
        type: 'portfolio_update',
        userId,
        data: portfolioData,
        timestamp: new Date().toISOString(),
      });
    }

    this.logger.log(
      `Broadcasted portfolio update to ${relevantConnections.length} clients for user ${userId}`
    );
  }

  async broadcastGovernanceUpdate(
    projectId: string,
    proposalData: any,
    userId?: string
  ) {
    const relevantConnections = Array.from(this.connections.values()).filter(
      conn => {
        const govSub = conn.subscriptions.governance;
        return govSub && (!govSub.projectId || govSub.projectId === projectId);
      }
    );

    for (const connection of relevantConnections) {
      this.server.to(connection.socketId).emit('governance_update', {
        type: 'governance_update',
        projectId,
        data: proposalData,
        timestamp: new Date().toISOString(),
      });
    }

    this.logger.log(
      `Broadcasted governance update to ${relevantConnections.length} clients for project ${projectId} - User: ${userId}`
    );
  }

  async broadcastKYCStatusUpdate(userId: string, kycStatus: any) {
    const relevantConnections = Array.from(this.connections.values()).filter(
      conn => conn.userId === userId && conn.subscriptions.kycStatus
    );

    for (const connection of relevantConnections) {
      this.server.to(connection.socketId).emit('kyc_status_update', {
        type: 'kyc_status_update',
        userId,
        data: kycStatus,
        timestamp: new Date().toISOString(),
      });
    }

    this.logger.log(
      `Broadcasted KYC status update to ${relevantConnections.length} clients for user ${userId}`
    );
  }

  async broadcastProjectUpdate(
    projectId: string,
    updateData: any,
    targetRole?: string
  ) {
    const relevantConnections = Array.from(this.connections.values()).filter(
      conn => {
        const projSub = conn.subscriptions.projectUpdates;
        return (
          projSub &&
          projSub.projectId === projectId &&
          (!targetRole || projSub.userRole === targetRole)
        );
      }
    );

    for (const connection of relevantConnections) {
      this.server.to(connection.socketId).emit('project_update', {
        type: 'project_update',
        projectId,
        data: updateData,
        timestamp: new Date().toISOString(),
      });
    }

    this.logger.log(
      `Broadcasted project update to ${relevantConnections.length} clients for project ${projectId}`
    );
  }

  async broadcastProfitDistribution(
    userId: string,
    distributionData: any,
    projectId?: string
  ) {
    const relevantConnections = Array.from(this.connections.values()).filter(
      conn => {
        const profitSub = conn.subscriptions.profitDistribution;
        return (
          conn.userId === userId &&
          profitSub &&
          (!projectId ||
            !profitSub.projectIds ||
            profitSub.projectIds.includes(projectId))
        );
      }
    );

    for (const connection of relevantConnections) {
      this.server.to(connection.socketId).emit('profit_distribution_update', {
        type: 'profit_distribution_update',
        userId,
        projectId,
        data: distributionData,
        timestamp: new Date().toISOString(),
      });
    }

    this.logger.log(
      `Broadcasted profit distribution to ${relevantConnections.length} clients for user ${userId}`
    );
  }

  async broadcastSystemNotification(
    message: string,
    targetRole?: string,
    targetUsers?: string[]
  ) {
    let relevantConnections = Array.from(this.connections.values());

    if (targetUsers) {
      relevantConnections = relevantConnections.filter(
        conn => conn.userId && targetUsers.includes(conn.userId)
      );
    }

    for (const connection of relevantConnections) {
      this.server.to(connection.socketId).emit('system_notification', {
        type: 'system_notification',
        message,
        timestamp: new Date().toISOString(),
      });
    }

    this.logger.log(
      `Broadcasted system notification to ${relevantConnections.length} clients`
    );
  }

  // Connection management

  getActiveConnections(): number {
    return this.connections.size;
  }

  getConnectionsByUserId(userId: string): ClientConnection[] {
    return Array.from(this.connections.values()).filter(
      conn => conn.userId === userId
    );
  }

  async getConnectionStats() {
    const totalConnections = this.connections.size;
    const authenticatedConnections = Array.from(
      this.connections.values()
    ).filter(conn => conn.userId).length;

    const subscriptionStats = {
      portfolio: 0,
      governance: 0,
      kycStatus: 0,
      projectUpdates: 0,
      profitDistribution: 0,
    };

    for (const connection of this.connections.values()) {
      if (connection.subscriptions.portfolio) subscriptionStats.portfolio++;
      if (connection.subscriptions.governance) subscriptionStats.governance++;
      if (connection.subscriptions.kycStatus) subscriptionStats.kycStatus++;
      if (connection.subscriptions.projectUpdates)
        subscriptionStats.projectUpdates++;
      if (connection.subscriptions.profitDistribution)
        subscriptionStats.profitDistribution++;
    }

    return {
      totalConnections,
      authenticatedConnections,
      anonymousConnections: totalConnections - authenticatedConnections,
      subscriptionStats,
    };
  }

  private async cacheConnection(
    socketId: string,
    connection: ClientConnection
  ) {
    try {
      await this.cacheService.set(
        `realtime:connection:${socketId}`,
        JSON.stringify(connection),
        { ttl: 300 } // 5 minutes TTL
      );
    } catch (error) {
      this.logger.error(`Failed to cache connection ${socketId}:`, error);
    }
  }
}
