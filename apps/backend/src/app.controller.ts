import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'API is healthy' })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('status')
  @ApiOperation({ summary: 'Get API status and version' })
  @ApiResponse({ status: 200, description: 'API status information' })
  getStatus() {
    return this.appService.getStatus();
  }
}