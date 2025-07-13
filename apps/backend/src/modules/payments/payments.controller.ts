import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
  NotFoundException,
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
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto, PaymentWebhookDto } from './dto';
import { UserRole, User } from '../../common/types';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INVESTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate payment process' })
  @ApiResponse({ status: 201, description: 'Payment initiated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async initiatePayment(
    @CurrentUser() user: User,
    @Body() initiatePaymentDto: InitiatePaymentDto
  ) {
    this.logger.log(`Payment initiation requested by user: ${user.id}`);

    // Ensure user can only initiate payments for themselves (unless admin)
    if (user.role !== UserRole.ADMIN && initiatePaymentDto.userId !== user.id) {
      throw new NotFoundException('Cannot initiate payment for another user');
    }

    const result =
      await this.paymentsService.initiatePayment(initiatePaymentDto);

    return {
      success: true,
      message: 'Payment initiated successfully',
      data: result,
    };
  }

  @Get('status/:paymentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment status' })
  @ApiResponse({
    status: 200,
    description: 'Payment status retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPaymentStatus(
    @CurrentUser() user: User,
    @Param('paymentId') paymentId: string
  ) {
    this.logger.log(
      `Payment status requested for payment: ${paymentId} by user: ${user.id}`
    );

    const payment = await this.paymentsService.getPaymentStatus(paymentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Ensure user can only view their own payments (unless admin)
    if (user.role !== UserRole.ADMIN && payment.userId !== user.id) {
      throw new NotFoundException('Payment not found');
    }

    return {
      success: true,
      data: payment,
    };
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment status by order ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment status retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPaymentStatusByOrderId(
    @CurrentUser() user: User,
    @Param('orderId') orderId: string
  ) {
    this.logger.log(
      `Payment status requested for order: ${orderId} by user: ${user.id}`
    );

    const payment =
      await this.paymentsService.getPaymentStatusByOrderId(orderId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Ensure user can only view their own payments (unless admin)
    if (user.role !== UserRole.ADMIN && payment.userId !== user.id) {
      throw new NotFoundException('Payment not found');
    }

    return {
      success: true,
      data: payment,
    };
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user payment history' })
  @ApiResponse({
    status: 200,
    description: 'Payment history retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of records to return',
  })
  async getUserPaymentHistory(
    @CurrentUser() user: User,
    @Query('limit') limit?: number
  ) {
    this.logger.log(`Payment history requested by user: ${user.id}`);

    const payments = await this.paymentsService.getUserPaymentHistory(
      user.id,
      limit ? parseInt(limit.toString()) : 10
    );

    return {
      success: true,
      data: payments,
    };
  }

  @Put('cancel/:paymentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel payment' })
  @ApiResponse({ status: 200, description: 'Payment cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Payment cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cancelPayment(
    @CurrentUser() user: User,
    @Param('paymentId') paymentId: string
  ) {
    this.logger.log(
      `Payment cancellation requested for payment: ${paymentId} by user: ${user.id}`
    );

    await this.paymentsService.cancelPayment(paymentId, user.id);

    return {
      success: true,
      message: 'Payment cancelled successfully',
    };
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Payment gateway webhook endpoint',
    description:
      'Endpoint for receiving payment status updates from the payment gateway',
  })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook data' })
  async handlePaymentWebhook(@Body() webhookDto: PaymentWebhookDto) {
    this.logger.log(
      `Payment webhook received for order: ${webhookDto.orderId}`
    );

    // TODO: In production, verify webhook signature from payment gateway
    // For now, we'll accept all webhook requests

    await this.paymentsService.handlePaymentWebhook(webhookDto);

    return {
      success: true,
      message: 'Webhook processed successfully',
    };
  }

  @Get('admin/payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all payments (Admin only)',
    description: 'Retrieve all payments for administrative purposes',
  })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getAllPayments(@CurrentUser() user: User) {
    this.logger.log(`Admin payments requested by user: ${user.id}`);

    // TODO: Implement pagination and filtering
    // For now, return a placeholder response

    return {
      success: true,
      message:
        'Admin payments endpoint - TODO: Implement pagination and filtering',
      data: [],
    };
  }

  @Get('methods')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available payment methods' })
  @ApiResponse({
    status: 200,
    description: 'Payment methods retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPaymentMethods() {
    // TODO: In production, this would return available payment methods from the gateway
    // For now, return mock payment methods

    return {
      success: true,
      data: [
        {
          id: 'bank_transfer',
          name: 'Bank Transfer',
          description: 'Transfer via Indonesian banks',
          fee: 0,
          minAmount: 100000,
          maxAmount: 100000000,
          enabled: true,
        },
        {
          id: 'credit_card',
          name: 'Credit Card',
          description: 'Visa, MasterCard, JCB',
          fee: 2.9,
          minAmount: 100000,
          maxAmount: 50000000,
          enabled: true,
        },
        {
          id: 'e_wallet',
          name: 'E-Wallet',
          description: 'GoPay, OVO, DANA',
          fee: 1.5,
          minAmount: 100000,
          maxAmount: 20000000,
          enabled: true,
        },
      ],
    };
  }
}
