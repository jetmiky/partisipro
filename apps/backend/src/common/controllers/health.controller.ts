import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService, HealthCheck } from '../services/health.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../types';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Get basic health status' })
  @ApiResponse({
    status: 200,
    description: 'Health status retrieved successfully',
  })
  async getHealth(): Promise<{ status: string; timestamp: Date }> {
    const health = await this.healthService.getHealthStatus();
    return {
      status: health.status,
      timestamp: health.timestamp,
    };
  }

  @Get('detailed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get detailed health status (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Detailed health status retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getDetailedHealth(): Promise<HealthCheck> {
    return this.healthService.getHealthStatus();
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get system metrics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'System metrics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getMetrics(): Promise<HealthCheck['metrics']> {
    const health = await this.healthService.getHealthStatus();
    return health.metrics;
  }
}
