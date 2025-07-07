import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Partisipro Backend API is healthy',
    };
  }

  getStatus() {
    return {
      service: 'Partisipro Backend API',
      version: '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      network: process.env.BLOCKCHAIN_NETWORK || 'arbitrum-sepolia',
      features: {
        authentication: 'TODO: Not implemented',
        userManagement: 'TODO: Not implemented',
        projectManagement: 'TODO: Not implemented',
        tokenOperations: 'TODO: Not implemented',
        treasuryOperations: 'TODO: Not implemented',
        kycVerification: 'TODO: Not implemented',
        notifications: 'TODO: Not implemented',
      },
      timestamp: new Date().toISOString(),
    };
  }
}