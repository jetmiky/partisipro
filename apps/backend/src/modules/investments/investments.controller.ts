import {
  Controller,
  Get,
  Post,
  Put,
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
import { InvestmentsService } from './investments.service';
import { CreateInvestmentDto } from './dto';
import { UserRole, User, InvestmentStatus } from '../../common/types';

@ApiTags('Investments')
@Controller('investments')
export class InvestmentsController {
  private readonly logger = new Logger(InvestmentsController.name);

  constructor(private readonly investmentsService: InvestmentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, IdentityGuard, ClaimsGuard)
  @Roles(UserRole.INVESTOR, UserRole.ADMIN)
  @RequireKYC()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create new investment (requires ERC-3643 KYC verification)',
  })
  @ApiResponse({ status: 201, description: 'Investment created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - KYC required or invalid investment',
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Investor access and KYC verification required',
  })
  async createInvestment(
    @CurrentUser() user: User,
    @Body() createInvestmentDto: CreateInvestmentDto
  ) {
    this.logger.log(
      `Creating investment for user: ${user.id}, project: ${createInvestmentDto.projectId}`
    );

    const result = await this.investmentsService.createInvestment(
      createInvestmentDto,
      user.id
    );

    return {
      success: true,
      message: 'Investment created successfully',
      data: {
        investment: result.investment,
        paymentUrl: result.paymentUrl,
      },
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user investments' })
  @ApiResponse({
    status: 200,
    description: 'User investments retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserInvestments(@CurrentUser() user: User) {
    this.logger.log(`Fetching investments for user: ${user.id}`);

    const investments = await this.investmentsService.getUserInvestments(
      user.id
    );

    return {
      success: true,
      data: investments,
    };
  }

  @Get('portfolio')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user investment portfolio with project details',
  })
  @ApiResponse({
    status: 200,
    description: 'User portfolio retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserPortfolio(@CurrentUser() user: User) {
    this.logger.log(`Fetching portfolio for user: ${user.id}`);

    const portfolio = await this.investmentsService.getUserPortfolio(user.id);

    return {
      success: true,
      data: portfolio,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get investment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Investment retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Investment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getInvestmentById(@Param('id') id: string, @CurrentUser() user: User) {
    this.logger.log(`Fetching investment: ${id} by user: ${user.id}`);

    const investment = await this.investmentsService.getInvestmentById(id);

    if (!investment) {
      throw new NotFoundException('Investment not found');
    }

    // Ensure user can only view their own investments (unless admin)
    if (user.role !== UserRole.ADMIN && investment.userId !== user.id) {
      throw new NotFoundException('Investment not found');
    }

    return {
      success: true,
      data: investment,
    };
  }

  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel investment (only if pending)' })
  @ApiResponse({
    status: 200,
    description: 'Investment cancelled successfully',
  })
  @ApiResponse({ status: 400, description: 'Investment cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Investment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cancelInvestment(@Param('id') id: string, @CurrentUser() user: User) {
    this.logger.log(`Cancelling investment: ${id} by user: ${user.id}`);

    await this.investmentsService.cancelInvestment(id, user.id);

    return {
      success: true,
      message: 'Investment cancelled successfully',
    };
  }

  @Get('project/:projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SPV, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get project investments (SPV/Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Project investments retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - SPV/Admin access required',
  })
  async getProjectInvestments(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User
  ) {
    this.logger.log(
      `Fetching investments for project: ${projectId} by user: ${user.id}`
    );

    const investments =
      await this.investmentsService.getProjectInvestments(projectId);

    return {
      success: true,
      data: investments,
    };
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all investments (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'All investments retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: InvestmentStatus,
    description: 'Filter by investment status',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of investments to return',
  })
  @ApiQuery({
    name: 'startAfter',
    required: false,
    type: String,
    description: 'Pagination cursor',
  })
  async getAllInvestments(
    @CurrentUser() user: User,
    @Query('status') status?: InvestmentStatus,
    @Query('limit') limit?: number,
    @Query('startAfter') startAfter?: string
  ) {
    this.logger.log(`Admin fetching all investments by user: ${user.id}`);

    const investments = await this.investmentsService.getAllInvestments(
      status,
      limit ? parseInt(limit.toString()) : 50,
      startAfter
    );

    return {
      success: true,
      data: investments,
    };
  }
}
