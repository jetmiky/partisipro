import { Module } from '@nestjs/common';
import { TrustedIssuersService } from './trusted-issuers.service';
import { TrustedIssuersController } from './trusted-issuers.controller';

@Module({
  controllers: [TrustedIssuersController],
  providers: [TrustedIssuersService],
  exports: [TrustedIssuersService],
})
export class TrustedIssuersModule {}
