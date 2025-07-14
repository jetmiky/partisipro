import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  Logger,
  // UseGuards
} from '@nestjs/common';
// import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
// import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RealtimeService } from './realtime.service';
// import { User } from '../../common/types';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Frontend URLs
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private readonly realtimeService: RealtimeService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket server initialized');
    this.realtimeService.setServer(server);
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    try {
      // Extract user from authentication token
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (token) {
        // In a real implementation, verify JWT token here
        // For now, we'll store the connection with a mock user
        await this.realtimeService.addConnection(client.id, null);
      }
    } catch (error) {
      this.logger.error(
        `Authentication failed for client ${client.id}:`,
        error
      );
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    await this.realtimeService.removeConnection(client.id);
  }

  @SubscribeMessage('subscribe_portfolio')
  async handlePortfolioSubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string }
  ) {
    this.logger.log(
      `Client ${client.id} subscribing to portfolio updates for user ${data.userId}`
    );

    try {
      await this.realtimeService.subscribeToPortfolio(client.id, data.userId);
      client.emit('subscription_confirmed', {
        type: 'portfolio',
        userId: data.userId,
        message: 'Successfully subscribed to portfolio updates',
      });
    } catch (error) {
      this.logger.error(
        `Portfolio subscription failed for client ${client.id}:`,
        error
      );
      client.emit('subscription_error', {
        type: 'portfolio',
        error: 'Failed to subscribe to portfolio updates',
      });
    }
  }

  @SubscribeMessage('subscribe_governance')
  async handleGovernanceSubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; projectId?: string }
  ) {
    this.logger.log(`Client ${client.id} subscribing to governance updates`);

    try {
      await this.realtimeService.subscribeToGovernance(
        client.id,
        data.userId,
        data.projectId
      );
      client.emit('subscription_confirmed', {
        type: 'governance',
        userId: data.userId,
        projectId: data.projectId,
        message: 'Successfully subscribed to governance updates',
      });
    } catch (error) {
      this.logger.error(
        `Governance subscription failed for client ${client.id}:`,
        error
      );
      client.emit('subscription_error', {
        type: 'governance',
        error: 'Failed to subscribe to governance updates',
      });
    }
  }

  @SubscribeMessage('subscribe_kyc_status')
  async handleKYCStatusSubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string }
  ) {
    this.logger.log(
      `Client ${client.id} subscribing to KYC status updates for user ${data.userId}`
    );

    try {
      await this.realtimeService.subscribeToKYCStatus(client.id, data.userId);
      client.emit('subscription_confirmed', {
        type: 'kyc_status',
        userId: data.userId,
        message: 'Successfully subscribed to KYC status updates',
      });
    } catch (error) {
      this.logger.error(
        `KYC status subscription failed for client ${client.id}:`,
        error
      );
      client.emit('subscription_error', {
        type: 'kyc_status',
        error: 'Failed to subscribe to KYC status updates',
      });
    }
  }

  @SubscribeMessage('subscribe_project_updates')
  async handleProjectUpdatesSubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string; userRole: string }
  ) {
    this.logger.log(
      `Client ${client.id} subscribing to project updates for project ${data.projectId}`
    );

    try {
      await this.realtimeService.subscribeToProjectUpdates(
        client.id,
        data.projectId,
        data.userRole
      );
      client.emit('subscription_confirmed', {
        type: 'project_updates',
        projectId: data.projectId,
        message: 'Successfully subscribed to project updates',
      });
    } catch (error) {
      this.logger.error(
        `Project updates subscription failed for client ${client.id}:`,
        error
      );
      client.emit('subscription_error', {
        type: 'project_updates',
        error: 'Failed to subscribe to project updates',
      });
    }
  }

  @SubscribeMessage('subscribe_profit_distribution')
  async handleProfitDistributionSubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; projectIds?: string[] }
  ) {
    this.logger.log(
      `Client ${client.id} subscribing to profit distribution updates`
    );

    try {
      await this.realtimeService.subscribeToProfitDistribution(
        client.id,
        data.userId,
        data.projectIds
      );
      client.emit('subscription_confirmed', {
        type: 'profit_distribution',
        userId: data.userId,
        message: 'Successfully subscribed to profit distribution updates',
      });
    } catch (error) {
      this.logger.error(
        `Profit distribution subscription failed for client ${client.id}:`,
        error
      );
      client.emit('subscription_error', {
        type: 'profit_distribution',
        error: 'Failed to subscribe to profit distribution updates',
      });
    }
  }

  @SubscribeMessage('unsubscribe')
  async handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { type: string; userId?: string; projectId?: string }
  ) {
    this.logger.log(`Client ${client.id} unsubscribing from ${data.type}`);

    try {
      await this.realtimeService.unsubscribe(
        client.id,
        data.type,
        data.userId,
        data.projectId
      );
      client.emit('unsubscribe_confirmed', {
        type: data.type,
        message: `Successfully unsubscribed from ${data.type}`,
      });
    } catch (error) {
      this.logger.error(`Unsubscribe failed for client ${client.id}:`, error);
      client.emit('unsubscribe_error', {
        type: data.type,
        error: `Failed to unsubscribe from ${data.type}`,
      });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }
}
