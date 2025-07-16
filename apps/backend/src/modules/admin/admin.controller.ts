import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Logger,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { UpdateFeesDto, WhitelistSpvDto, MaintenanceModeDto } from './dto';
import { UserRole, User } from '../../common/types';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getDashboardData(@CurrentUser() user: User) {
    this.logger.log(`Fetching dashboard data for admin: ${user.id}`);

    const analytics = await this.adminService.getPlatformAnalytics();
    const revenue = await this.adminService.getRevenueAnalytics();
    const maintenanceMode = await this.adminService.getMaintenanceMode();

    return {
      success: true,
      data: {
        analytics,
        revenue,
        maintenanceMode,
      },
    };
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get platform analytics' })
  @ApiResponse({
    status: 200,
    description: 'Platform analytics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getPlatformAnalytics(@CurrentUser() user: User) {
    this.logger.log(`Fetching platform analytics for admin: ${user.id}`);

    const analytics = await this.adminService.getPlatformAnalytics();

    return {
      success: true,
      data: analytics,
    };
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiResponse({
    status: 200,
    description: 'Revenue analytics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getRevenueAnalytics(@CurrentUser() user: User) {
    this.logger.log(`Fetching revenue analytics for admin: ${user.id}`);

    const revenue = await this.adminService.getRevenueAnalytics();

    return {
      success: true,
      data: revenue,
    };
  }

  @Put('fees')
  @ApiOperation({ summary: 'Update platform fees' })
  @ApiResponse({
    status: 200,
    description: 'Platform fees updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid fee data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async updateFees(
    @CurrentUser() user: User,
    @Body() updateFeesDto: UpdateFeesDto
  ) {
    this.logger.log(`Updating platform fees by admin: ${user.id}`);

    const updatedConfigs = await this.adminService.updatePlatformFees(
      updateFeesDto,
      user.id
    );

    return {
      success: true,
      message: 'Platform fees updated successfully',
      data: updatedConfigs,
    };
  }

  @Post('spv/whitelist')
  @ApiOperation({ summary: 'Whitelist SPV address' })
  @ApiResponse({ status: 201, description: 'SPV whitelisted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - SPV already whitelisted',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async whitelistSpv(
    @CurrentUser() user: User,
    @Body() whitelistSpvDto: WhitelistSpvDto
  ) {
    this.logger.log(
      `Whitelisting SPV: ${whitelistSpvDto.spvAddress} by admin: ${user.id}`
    );

    const whitelist = await this.adminService.whitelistSpv(
      whitelistSpvDto,
      user.id
    );

    return {
      success: true,
      message: 'SPV whitelisted successfully',
      data: whitelist,
    };
  }

  @Delete('spv/whitelist/:spvAddress')
  @ApiOperation({ summary: 'Remove SPV from whitelist' })
  @ApiResponse({
    status: 200,
    description: 'SPV removed from whitelist successfully',
  })
  @ApiResponse({ status: 404, description: 'SPV not found in whitelist' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async removeSpvFromWhitelist(
    @Param('spvAddress') spvAddress: string,
    @CurrentUser() user: User
  ) {
    this.logger.log(
      `Removing SPV from whitelist: ${spvAddress} by admin: ${user.id}`
    );

    await this.adminService.removeSpvFromWhitelist(spvAddress, user.id);

    return {
      success: true,
      message: 'SPV removed from whitelist successfully',
    };
  }

  @Get('spv/whitelist')
  @ApiOperation({ summary: 'Get all whitelisted SPVs' })
  @ApiResponse({
    status: 200,
    description: 'Whitelisted SPVs retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getWhitelistedSpvs(@CurrentUser() user: User) {
    this.logger.log(`Fetching whitelisted SPVs for admin: ${user.id}`);

    const whitelistedSpvs = await this.adminService.getWhitelistedSpvs();

    return {
      success: true,
      data: whitelistedSpvs,
    };
  }

  @Post('maintenance')
  @ApiOperation({ summary: 'Set maintenance mode' })
  @ApiResponse({
    status: 200,
    description: 'Maintenance mode updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid maintenance data',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async setMaintenanceMode(
    @CurrentUser() user: User,
    @Body() maintenanceModeDto: MaintenanceModeDto
  ) {
    this.logger.log(
      `Setting maintenance mode: ${maintenanceModeDto.enabled} by admin: ${user.id}`
    );

    const config = await this.adminService.setMaintenanceMode(
      maintenanceModeDto,
      user.id
    );

    return {
      success: true,
      message: `Maintenance mode ${maintenanceModeDto.enabled ? 'enabled' : 'disabled'} successfully`,
      data: config,
    };
  }

  @Get('maintenance')
  @ApiOperation({ summary: 'Get maintenance mode status' })
  @ApiResponse({
    status: 200,
    description: 'Maintenance mode status retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getMaintenanceMode(@CurrentUser() user: User) {
    this.logger.log(`Fetching maintenance mode status for admin: ${user.id}`);

    const maintenanceMode = await this.adminService.getMaintenanceMode();

    return {
      success: true,
      data: maintenanceMode,
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'Get user management data' })
  @ApiResponse({
    status: 200,
    description: 'User management data retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of users to return',
  })
  @ApiQuery({
    name: 'startAfter',
    required: false,
    type: String,
    description: 'Pagination cursor',
  })
  async getUserManagementData(
    @CurrentUser() user: User,
    @Query('limit') limit?: number,
    @Query('startAfter') startAfter?: string
  ) {
    this.logger.log(`Fetching user management data for admin: ${user.id}`);

    const users = await this.adminService.getUserManagementData(
      limit ? parseInt(limit.toString()) : 50,
      startAfter
    );

    return {
      success: true,
      data: users,
    };
  }

  @Get('system-config')
  @ApiOperation({ summary: 'Get all system configurations' })
  @ApiResponse({
    status: 200,
    description: 'System configurations retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getSystemConfigurations(@CurrentUser() user: User) {
    this.logger.log(`Fetching system configurations for admin: ${user.id}`);

    const configurations = await this.adminService.getSystemConfigurations();

    return {
      success: true,
      data: configurations,
    };
  }

  @Get('audit/logs')
  @ApiOperation({ summary: 'Get audit logs with filtering options' })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for filtering (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for filtering (ISO string)',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter by user ID',
  })
  @ApiQuery({
    name: 'actions',
    required: false,
    type: [String],
    description: 'Filter by action types',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of logs to return',
  })
  @ApiQuery({
    name: 'startAfter',
    required: false,
    type: String,
    description: 'Pagination cursor',
  })
  async getAuditLogs(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string,
    @Query('actions') actions?: string | string[],
    @Query('limit') limit?: number,
    @Query('startAfter') startAfter?: string
  ) {
    this.logger.log(`Fetching audit logs for admin: ${user.id}`);

    // Parse date strings
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;

    // Handle actions parameter (can be string or array)
    let actionsArray: string[] | undefined;
    if (actions) {
      actionsArray = Array.isArray(actions) ? actions : [actions];
    }

    const auditLogs = await this.adminService.getAuditLogs({
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      userId,
      actions: actionsArray,
      limit: limit ? parseInt(limit.toString()) : undefined,
      startAfter,
    });

    return {
      success: true,
      data: auditLogs,
    };
  }
}
