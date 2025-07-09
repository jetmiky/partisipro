import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { KYCService } from './kyc.service';
import { InitiateKYCDto, KYCWebhookDto } from './dto';
import { UserRole, User } from '../../common/types';

@ApiTags('KYC')
@Controller('kyc')
export class KYCController {
  private readonly logger = new Logger(KYCController.name);

  constructor(private readonly kycService: KYCService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INVESTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate KYC verification process' })
  @ApiResponse({
    status: 201,
    description: 'KYC verification initiated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - User already has pending KYC',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async initiateKYC(
    @CurrentUser() user: User,
    @Body() initiateKYCDto: InitiateKYCDto
  ) {
    this.logger.log(`KYC initiation requested by user: ${user.id}`);

    // Ensure user can only initiate KYC for themselves (unless admin)
    if (user.role !== UserRole.ADMIN && initiateKYCDto.userId !== user.id) {
      throw new NotFoundException('Cannot initiate KYC for another user');
    }

    const result = await this.kycService.initiateKYC(initiateKYCDto);

    return {
      success: true,
      message: 'KYC verification initiated successfully',
      data: result,
    };
  }

  @Get('status/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get KYC session status' })
  @ApiResponse({
    status: 200,
    description: 'KYC session status retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'KYC session not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getKYCStatus(
    @CurrentUser() user: User,
    @Param('sessionId') sessionId: string
  ) {
    this.logger.log(
      `KYC status requested for session: ${sessionId} by user: ${user.id}`
    );

    const session = await this.kycService.getKYCStatus(sessionId);

    if (!session) {
      throw new NotFoundException('KYC session not found');
    }

    // Ensure user can only view their own KYC status (unless admin)
    if (user.role !== UserRole.ADMIN && session.userId !== user.id) {
      throw new NotFoundException('KYC session not found');
    }

    return {
      success: true,
      data: session,
    };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user KYC status' })
  @ApiResponse({
    status: 200,
    description: 'User KYC status retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'No KYC session found for user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUserKYCStatus(@CurrentUser() user: User) {
    this.logger.log(`Current KYC status requested by user: ${user.id}`);

    const session = await this.kycService.getKYCStatusByUserId(user.id);

    if (!session) {
      throw new NotFoundException('No KYC session found for user');
    }

    return {
      success: true,
      data: session,
    };
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'KYC provider webhook endpoint',
    description:
      'Endpoint for receiving KYC verification results from the provider',
  })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook data' })
  async handleKYCWebhook(@Body() webhookDto: KYCWebhookDto) {
    this.logger.log(
      `KYC webhook received for session: ${webhookDto.sessionId}`
    );

    // TODO: In production, verify webhook signature from KYC provider
    // For now, we'll accept all webhook requests

    await this.kycService.handleKYCWebhook(webhookDto);

    return {
      success: true,
      message: 'Webhook processed successfully',
    };
  }

  @Get('admin/sessions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all KYC sessions (Admin only)',
    description: 'Retrieve all KYC sessions for administrative purposes',
  })
  @ApiResponse({
    status: 200,
    description: 'KYC sessions retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getAllKYCSessions(@CurrentUser() user: User) {
    this.logger.log(`Admin KYC sessions requested by user: ${user.id}`);

    // TODO: Implement pagination and filtering
    // For now, return a placeholder response

    return {
      success: true,
      message:
        'Admin KYC sessions endpoint - TODO: Implement pagination and filtering',
      data: [],
    };
  }
}
