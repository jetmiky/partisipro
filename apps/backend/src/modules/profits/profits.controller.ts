import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Logger,
  Query,
  NotFoundException,
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
import { IdentityGuard } from '../../common/guards/identity.guard';
import { ClaimsGuard } from '../../common/guards/claims.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireKYC } from '../../common/decorators/claims.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProfitsService } from './profits.service';
import { DistributeProfitsDto, ClaimProfitsDto } from './dto';
import { UserRole, User, ProfitDistributionStatus } from '../../common/types';

@ApiTags('Profits')
@Controller('profits')
export class ProfitsController {
  private readonly logger = new Logger(ProfitsController.name);

  constructor(private readonly profitsService: ProfitsService) {}

  @Post('distribute')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Distribute profits to investors (Admin only)' })
  @ApiResponse({ status: 201, description: 'Profits distributed successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid distribution data',
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async distributeProfits(
    @CurrentUser() user: User,
    @Body() distributeProfitsDto: DistributeProfitsDto
  ) {
    this.logger.log(
      `Distributing profits for project: ${distributeProfitsDto.projectId} by admin: ${user.id}`
    );

    const distribution = await this.profitsService.distributeProfits(
      distributeProfitsDto,
      user.id
    );

    return {
      success: true,
      message: 'Profits distributed successfully',
      data: distribution,
    };
  }

  @Post('claim')
  @UseGuards(JwtAuthGuard, RolesGuard, IdentityGuard, ClaimsGuard)
  @Roles(UserRole.INVESTOR, UserRole.ADMIN)
  @RequireKYC()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Claim profit distribution (Verified investor only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Profit claim processed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid claim or already claimed',
  })
  @ApiResponse({ status: 404, description: 'Profit claim not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Verified investor access required',
  })
  async claimProfits(
    @CurrentUser() user: User,
    @Body() claimProfitsDto: ClaimProfitsDto
  ) {
    this.logger.log(
      `Processing profit claim for user: ${user.id}, distribution: ${claimProfitsDto.distributionId}`
    );

    const claim = await this.profitsService.claimProfits(
      claimProfitsDto,
      user.id
    );

    return {
      success: true,
      message: 'Profit claim processed successfully',
      data: claim,
    };
  }

  @Get('my-claims')
  @UseGuards(JwtAuthGuard, RolesGuard, IdentityGuard, ClaimsGuard)
  @Roles(UserRole.INVESTOR, UserRole.ADMIN)
  @RequireKYC()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profit claims (Verified investor only)' })
  @ApiResponse({
    status: 200,
    description: 'User profit claims retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserProfitClaims(@CurrentUser() user: User) {
    this.logger.log(`Fetching profit claims for user: ${user.id}`);

    const claims = await this.profitsService.getUserProfitClaims(user.id);

    return {
      success: true,
      data: claims,
    };
  }

  @Get('my-claimable')
  @UseGuards(JwtAuthGuard, RolesGuard, IdentityGuard, ClaimsGuard)
  @Roles(UserRole.INVESTOR, UserRole.ADMIN)
  @RequireKYC()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user claimable profits (Verified investor only)',
  })
  @ApiResponse({
    status: 200,
    description: 'User claimable profits retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserClaimableProfits(@CurrentUser() user: User) {
    this.logger.log(`Fetching claimable profits for user: ${user.id}`);

    const claimableProfits = await this.profitsService.getUserClaimableProfits(
      user.id
    );

    return {
      success: true,
      data: claimableProfits,
    };
  }

  @Get('distributions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get profit distribution by ID' })
  @ApiResponse({
    status: 200,
    description: 'Profit distribution retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Distribution not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDistributionById(@Param('id') id: string) {
    this.logger.log(`Fetching distribution: ${id}`);

    const distribution = await this.profitsService.getDistributionById(id);

    if (!distribution) {
      throw new NotFoundException('Distribution not found');
    }

    return {
      success: true,
      data: distribution,
    };
  }

  @Get('project/:projectId/distributions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SPV, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get profit distributions for a project (SPV/Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Project distributions retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - SPV/Admin access required',
  })
  async getProjectDistributions(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User
  ) {
    this.logger.log(
      `Fetching distributions for project: ${projectId} by user: ${user.id}`
    );

    const distributions =
      await this.profitsService.getProjectDistributions(projectId);

    return {
      success: true,
      data: distributions,
    };
  }

  @Get('admin/distributions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all profit distributions (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'All distributions retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ProfitDistributionStatus,
    description: 'Filter by distribution status',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of distributions to return',
  })
  @ApiQuery({
    name: 'startAfter',
    required: false,
    type: String,
    description: 'Pagination cursor',
  })
  async getAllDistributions(
    @CurrentUser() user: User,
    @Query('status') status?: ProfitDistributionStatus,
    @Query('limit') limit?: number,
    @Query('startAfter') startAfter?: string
  ) {
    this.logger.log(`Admin fetching all distributions by user: ${user.id}`);

    const distributions = await this.profitsService.getAllDistributions(
      status,
      limit ? parseInt(limit.toString()) : 50,
      startAfter
    );

    return {
      success: true,
      data: distributions,
    };
  }
}
