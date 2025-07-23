import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { SpvApplicationsService } from './spv-applications.service';
import {
  SubmitSpvApplicationDto,
  ReviewSpvApplicationDto,
  UpdateSpvApplicationDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/types';

@ApiTags('SPV Applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/spv-applications')
export class SpvApplicationsController {
  constructor(
    private readonly spvApplicationsService: SpvApplicationsService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Submit SPV application' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'SPV application submitted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid application data or existing application found',
  })
  async submitApplication(
    @CurrentUser('id') userId: string,
    @Body(ValidationPipe) submitDto: SubmitSpvApplicationDto
  ) {
    const application = await this.spvApplicationsService.submitApplication(
      userId,
      submitDto
    );

    return {
      success: true,
      message: 'SPV application submitted successfully',
      data: {
        application,
      },
    };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all SPV applications (Admin only)' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Number of applications to return (default: 50)',
  })
  @ApiQuery({
    name: 'startAfter',
    required: false,
    type: 'string',
    description: 'Pagination cursor',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SPV applications retrieved successfully',
  })
  async getApplications(
    @Query('status')
    status?: 'pending' | 'under_review' | 'approved' | 'rejected',
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('startAfter') startAfter?: string
  ) {
    const result = await this.spvApplicationsService.getApplications(
      status,
      limit || 50,
      startAfter
    );

    return {
      success: true,
      message: 'SPV applications retrieved successfully',
      data: result,
    };
  }

  @Get('my-application')
  @ApiOperation({ summary: "Get current user's SPV application" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User SPV application retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No SPV application found for user',
  })
  async getMyApplication(@CurrentUser('id') userId: string) {
    const application =
      await this.spvApplicationsService.getApplicationByUserId(userId);

    return {
      success: true,
      message: application
        ? 'SPV application retrieved successfully'
        : 'No SPV application found',
      data: {
        application,
      },
    };
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get SPV statistics (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SPV statistics retrieved successfully',
  })
  async getSPVStats() {
    const stats = await this.spvApplicationsService.getSPVStats();

    return {
      success: true,
      message: 'SPV statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('approved')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all approved SPVs (Admin only)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Number of SPVs to return (default: 50)',
  })
  @ApiQuery({
    name: 'startAfter',
    required: false,
    type: 'string',
    description: 'Pagination cursor',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Approved SPVs retrieved successfully',
  })
  async getApprovedSPVs(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('startAfter') startAfter?: string
  ) {
    const result = await this.spvApplicationsService.getApprovedSPVs(
      limit || 50,
      startAfter
    );

    return {
      success: true,
      message: 'Approved SPVs retrieved successfully',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get SPV application by ID' })
  @ApiParam({ name: 'id', description: 'SPV application ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SPV application retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'SPV application not found',
  })
  async getApplicationById(@Param('id') applicationId: string) {
    const application =
      await this.spvApplicationsService.getApplicationById(applicationId);

    return {
      success: true,
      message: 'SPV application retrieved successfully',
      data: {
        application,
      },
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update SPV application' })
  @ApiParam({ name: 'id', description: 'SPV application ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SPV application updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid update data or application cannot be updated',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User can only update their own application',
  })
  async updateApplication(
    @Param('id') applicationId: string,
    @CurrentUser('id') userId: string,
    @Body(ValidationPipe) updateDto: UpdateSpvApplicationDto
  ) {
    const application = await this.spvApplicationsService.updateApplication(
      applicationId,
      userId,
      updateDto
    );

    return {
      success: true,
      message: 'SPV application updated successfully',
      data: {
        application,
      },
    };
  }

  @Post('review')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Review SPV application (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SPV application reviewed successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Application has already been reviewed',
  })
  async reviewApplication(
    @CurrentUser('id') reviewerId: string,
    @Body(ValidationPipe) reviewDto: ReviewSpvApplicationDto
  ) {
    const application = await this.spvApplicationsService.reviewApplication(
      reviewDto,
      reviewerId
    );

    return {
      success: true,
      message: `SPV application ${reviewDto.action}d successfully`,
      data: {
        application,
      },
    };
  }

  @Post('approved/:id/suspend')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Suspend approved SPV (Admin only)' })
  @ApiParam({ name: 'id', description: 'Approved SPV ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SPV suspended successfully',
  })
  async suspendSPV(@Param('id') spvId: string, @Body('reason') reason: string) {
    await this.spvApplicationsService.suspendSPV(spvId, reason);

    return {
      success: true,
      message: 'SPV suspended successfully',
    };
  }

  @Post('approved/:id/activate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate suspended SPV (Admin only)' })
  @ApiParam({ name: 'id', description: 'Approved SPV ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SPV activated successfully',
  })
  async activateSPV(@Param('id') spvId: string) {
    await this.spvApplicationsService.activateSPV(spvId);

    return {
      success: true,
      message: 'SPV activated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete SPV application' })
  @ApiParam({ name: 'id', description: 'SPV application ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SPV application deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Approved applications cannot be deleted',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User can only delete their own application',
  })
  async deleteApplication(
    @Param('id') applicationId: string,
    @CurrentUser('id') userId: string
  ) {
    await this.spvApplicationsService.deleteApplication(applicationId, userId);

    return {
      success: true,
      message: 'SPV application deleted successfully',
    };
  }
}
