import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import { RealBlockchainService } from './real-blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { CommonModule } from '../../common/common.module';
import { FirebaseService } from '../../common/services/firebase.service';

@Module({
  imports: [CommonModule],
  controllers: [BlockchainController],
  providers: [
    {
      provide: 'BLOCKCHAIN_SERVICE',
      useFactory: (
        configService: ConfigService,
        firebaseService: FirebaseService
      ) => {
        const nodeEnv = configService.get<string>('NODE_ENV', 'development');
        const useRealBlockchain = configService.get<boolean>(
          'USE_REAL_BLOCKCHAIN',
          false
        );

        // Use real blockchain service if explicitly enabled or in production
        if (useRealBlockchain || nodeEnv === 'production') {
          return new RealBlockchainService(configService, firebaseService);
        } else {
          return new BlockchainService(configService, firebaseService);
        }
      },
      inject: [ConfigService, FirebaseService],
    },
    // Keep both services available for manual injection if needed
    BlockchainService,
    RealBlockchainService,
  ],
  exports: ['BLOCKCHAIN_SERVICE', BlockchainService, RealBlockchainService],
})
export class BlockchainModule {}
