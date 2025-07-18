import {
  Controller,
  Post,
  Body,
  UseGuards,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InitializationService } from './initialization.service';
import { InitializeDataDto } from './dto/initialize-data.dto';
import { UserRole, User } from '../../common/types';

@ApiTags('Admin - Initialization')
@Controller('admin/initialization')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class InitializationController {
  private readonly logger = new Logger(InitializationController.name);

  constructor(private readonly initializationService: InitializationService) {}

  @Post('initialize')
  @ApiOperation({
    summary: 'Initialize platform with default data',
    description: `
      Initializes the platform with essential default data including:
      - Default admin user
      - System configurations
      - Default SPV applications
      - Identity registry data
      - Trusted issuers
      - Sample projects and investments
      - Default claim topics
      
      This endpoint should only be used during initial setup or for development/testing purposes.
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Platform initialized successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            adminUser: { type: 'object' },
            systemConfigs: { type: 'object' },
            identityRegistry: { type: 'object' },
            trustedIssuers: { type: 'array' },
            claimTopics: { type: 'array' },
            sampleProjects: { type: 'array' },
            sampleInvestments: { type: 'array' },
            sampleSPVs: { type: 'array' },
            summary: { type: 'object' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid initialization data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Platform already initialized',
  })
  @ApiBody({
    type: InitializeDataDto,
    description: 'Initialization configuration',
  })
  async initializePlatform(
    @CurrentUser() user: User,
    @Body() initializeDataDto: InitializeDataDto
  ) {
    this.logger.log(
      `Initializing platform data requested by admin: ${user.id}`
    );

    try {
      // Check if platform is already initialized
      const isInitialized =
        await this.initializationService.checkIfInitialized();
      if (isInitialized && !initializeDataDto.forceReinitialize) {
        throw new ConflictException(
          'Platform is already initialized. Use forceReinitialize=true to override.'
        );
      }

      // Initialize platform data
      const result = await this.initializationService.initializePlatform(
        initializeDataDto,
        user.id
      );

      this.logger.log(
        `Platform initialization completed successfully by admin: ${user.id}`
      );

      return {
        success: true,
        message: 'Platform initialized successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `Platform initialization failed for admin: ${user.id}`,
        error.stack
      );

      if (error instanceof ConflictException) {
        throw error;
      }

      throw new BadRequestException(
        `Failed to initialize platform: ${error.message}`
      );
    }
  }

  @Post('initialize/dev')
  @ApiOperation({
    summary: 'Initialize platform with development data',
    description: `
      Initializes the platform with comprehensive development/testing data including:
      - Multiple admin users
      - Test SPVs with various statuses
      - Sample projects across different sectors
      - Test investors with different profiles
      - Mock investment data
      - Complete identity registry with test claims
      - Governance proposals and voting data
      - Profit distribution history
      
      This endpoint is intended for development and testing environments only.
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Development platform initialized successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid initialization data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async initializeDevelopmentPlatform(@CurrentUser() user: User) {
    this.logger.log(
      `Development platform initialization requested by admin: ${user.id}`
    );

    try {
      // Initialize comprehensive development data
      const result = await this.initializationService.initializeDevelopmentData(
        user.id
      );

      this.logger.log(
        `Development platform initialization completed successfully by admin: ${user.id}`
      );

      return {
        success: true,
        message: 'Development platform initialized successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `Development platform initialization failed for admin: ${user.id}`,
        error.stack
      );

      throw new BadRequestException(
        `Failed to initialize development platform: ${error.message}`
      );
    }
  }

  @Post('reset')
  @ApiOperation({
    summary: 'Reset platform data',
    description: `
      Resets all platform data to initial state. This is a destructive operation that:
      - Removes all users (except the requesting admin)
      - Clears all projects and investments
      - Resets identity registry
      - Clears all claims and trusted issuers
      - Resets system configurations to defaults
      - Clears audit logs
      
      WARNING: This operation cannot be undone. Use with extreme caution.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Platform reset successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Reset failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async resetPlatform(@CurrentUser() user: User) {
    this.logger.warn(
      `Platform reset requested by admin: ${user.id} - This is a destructive operation`
    );

    try {
      const result = await this.initializationService.resetPlatform(user.id);

      this.logger.warn(
        `Platform reset completed successfully by admin: ${user.id}`
      );

      return {
        success: true,
        message: 'Platform reset successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `Platform reset failed for admin: ${user.id}`,
        error.stack
      );

      throw new BadRequestException(
        `Failed to reset platform: ${error.message}`
      );
    }
  }

  @Post('status')
  @ApiOperation({
    summary: 'Check platform initialization status',
    description: 'Returns the current initialization status of the platform',
  })
  @ApiResponse({
    status: 200,
    description: 'Platform status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            isInitialized: { type: 'boolean' },
            initializationDate: { type: 'string', format: 'date-time' },
            adminCount: { type: 'number' },
            userCount: { type: 'number' },
            projectCount: { type: 'number' },
            investmentCount: { type: 'number' },
            identityRegistryCount: { type: 'number' },
            trustedIssuerCount: { type: 'number' },
            claimTopicCount: { type: 'number' },
            lastUpdated: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getPlatformStatus(@CurrentUser() user: User) {
    this.logger.log(`Platform status check requested by admin: ${user.id}`);

    try {
      const status = await this.initializationService.getPlatformStatus();

      return {
        success: true,
        data: status,
      };
    } catch (error) {
      this.logger.error(
        `Platform status check failed for admin: ${user.id}`,
        error.stack
      );

      throw new BadRequestException(
        `Failed to get platform status: ${error.message}`
      );
    }
  }
}
