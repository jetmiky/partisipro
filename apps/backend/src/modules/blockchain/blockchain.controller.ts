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
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BlockchainService } from './blockchain.service';
import {
  DeployContractDto,
  GenerateSignatureDto,
  SubmitTransactionDto,
} from './dto';
import { UserRole, User } from '../../common/types';

@ApiTags('Blockchain')
@Controller('blockchain')
export class BlockchainController {
  private readonly logger = new Logger(BlockchainController.name);

  constructor(private readonly blockchainService: BlockchainService) {}

  @Post('deploy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deploy smart contract (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Contract deployment initiated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid deployment data',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async deployContract(
    @CurrentUser() user: User,
    @Body() deployContractDto: DeployContractDto
  ) {
    this.logger.log(
      `Deploying contract: ${deployContractDto.contractType} by admin: ${user.id}`
    );

    const deployment = await this.blockchainService.deployContract(
      deployContractDto,
      user.walletAddress
    );

    return {
      success: true,
      message: 'Contract deployment initiated successfully',
      data: deployment,
    };
  }

  @Post('signature')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate authorization signature (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Authorization signature generated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid signature data',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async generateSignature(
    @CurrentUser() user: User,
    @Body() generateSignatureDto: GenerateSignatureDto
  ) {
    this.logger.log(
      `Generating signature for investment: ${generateSignatureDto.projectId} by admin: ${user.id}`
    );

    const signature =
      await this.blockchainService.generateAuthorizationSignature(
        generateSignatureDto
      );

    return {
      success: true,
      message: 'Authorization signature generated successfully',
      data: {
        signature,
        projectId: generateSignatureDto.projectId,
        investorAddress: generateSignatureDto.investorAddress,
        amount: generateSignatureDto.amount,
        tokenAmount: generateSignatureDto.tokenAmount,
        nonce: generateSignatureDto.nonce,
      },
    };
  }

  @Post('transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SPV)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit blockchain transaction (Admin/SPV only)' })
  @ApiResponse({
    status: 201,
    description: 'Transaction submitted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid transaction data',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin/SPV access required',
  })
  async submitTransaction(
    @CurrentUser() user: User,
    @Body() submitTransactionDto: SubmitTransactionDto
  ) {
    this.logger.log(
      `Submitting transaction to: ${submitTransactionDto.contractAddress} by user: ${user.id}`
    );

    const transaction = await this.blockchainService.submitTransaction(
      submitTransactionDto,
      user.walletAddress
    );

    return {
      success: true,
      message: 'Transaction submitted successfully',
      data: transaction,
    };
  }

  @Get('transactions/:hash')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transaction by hash' })
  @ApiResponse({
    status: 200,
    description: 'Transaction retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTransactionByHash(@Param('hash') hash: string) {
    this.logger.log(`Fetching transaction: ${hash}`);

    const transaction = await this.blockchainService.getTransactionByHash(hash);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      success: true,
      data: transaction,
    };
  }

  @Get('contracts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all deployed contracts (Admin only)' })
  @ApiResponse({ status: 200, description: 'Contracts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getAllContracts(@CurrentUser() user: User) {
    this.logger.log(`Fetching all contracts by admin: ${user.id}`);

    const contracts = await this.blockchainService.getAllContracts();

    return {
      success: true,
      data: contracts,
    };
  }

  @Get('project/:projectId/contracts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SPV, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get contracts for a project (SPV/Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Project contracts retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - SPV/Admin access required',
  })
  async getProjectContracts(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User
  ) {
    this.logger.log(
      `Fetching contracts for project: ${projectId} by user: ${user.id}`
    );

    const contracts =
      await this.blockchainService.getProjectContracts(projectId);

    return {
      success: true,
      data: contracts,
    };
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transaction history (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Transaction history retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiQuery({
    name: 'address',
    required: false,
    type: String,
    description: 'Filter by address',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of transactions to return',
  })
  @ApiQuery({
    name: 'startAfter',
    required: false,
    type: String,
    description: 'Pagination cursor',
  })
  async getTransactionHistory(
    @CurrentUser() user: User,
    @Query('address') address?: string,
    @Query('limit') limit?: number,
    @Query('startAfter') startAfter?: string
  ) {
    this.logger.log(`Fetching transaction history by admin: ${user.id}`);

    const transactions = await this.blockchainService.getTransactionHistory(
      address,
      limit ? parseInt(limit.toString()) : 50,
      startAfter
    );

    return {
      success: true,
      data: transactions,
    };
  }
}
