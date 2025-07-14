import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { IdentityService } from './identity.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateIdentityDto,
  UpdateIdentityStatusDto,
  VerifyIdentityDto,
  BatchRegisterIdentitiesDto,
  IdentityRegistry,
  IdentityVerificationResult,
  UserRole,
  IdentityStatus,
  User,
} from '../../common/types';

@ApiTags('Identity Management')
@Controller('api/v2/identity')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IdentityController {
  private readonly logger = new Logger(IdentityController.name);

  constructor(private readonly identityService: IdentityService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register new identity',
    description: 'Register a new identity in the ERC-3643 identity registry',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Identity registered successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        identityKey: { type: 'string' },
        status: { type: 'string', enum: ['pending', 'verified', 'revoked'] },
        claims: { type: 'array', items: { type: 'object' } },
        trustedIssuers: { type: 'array', items: { type: 'string' } },
        createdAt: { type: 'string', format: 'date-time' },
        verifiedAt: { type: 'string', format: 'date-time' },
        lastUpdated: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Identity already exists',
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SPV)
  async registerIdentity(
    @Body() createIdentityDto: CreateIdentityDto,
    @CurrentUser() user: User
  ): Promise<IdentityRegistry> {
    this.logger.log(
      `User ${user.id} registering identity for address: ${createIdentityDto.userAddress}`
    );

    return await this.identityService.registerIdentity(
      createIdentityDto.userAddress,
      createIdentityDto,
      user.id
    );
  }

  @Get('status/:address')
  @ApiOperation({
    summary: 'Get identity status',
    description: 'Retrieve identity information by wallet address',
  })
  @ApiParam({
    name: 'address',
    description: 'Wallet address',
    example: '0x742d35Cc6634C0532925a3b8D404E9e937b1b5dE',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Identity information retrieved',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        identityKey: { type: 'string' },
        status: { type: 'string', enum: ['pending', 'verified', 'revoked'] },
        claims: { type: 'array', items: { type: 'object' } },
        trustedIssuers: { type: 'array', items: { type: 'string' } },
        createdAt: { type: 'string', format: 'date-time' },
        verifiedAt: { type: 'string', format: 'date-time' },
        lastUpdated: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Identity not found',
  })
  async getIdentityStatus(
    @Param('address') address: string
  ): Promise<IdentityRegistry | null> {
    return await this.identityService.getIdentity(address);
  }

  @Post('verify')
  @ApiOperation({
    summary: 'Verify identity',
    description: 'Verify identity and check required claims',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Identity verification result',
    schema: {
      type: 'object',
      properties: {
        isVerified: { type: 'boolean' },
        identity: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string' },
          },
        },
        missingClaims: { type: 'array', items: { type: 'string' } },
        expiredClaims: { type: 'array', items: { type: 'object' } },
        reason: { type: 'string' },
      },
    },
  })
  async verifyIdentity(
    @Body() verifyIdentityDto: VerifyIdentityDto
  ): Promise<IdentityVerificationResult> {
    return await this.identityService.verifyIdentity(
      verifyIdentityDto.userAddress,
      verifyIdentityDto.requiredClaims
    );
  }

  @Put('status/:address')
  @ApiOperation({
    summary: 'Update identity status',
    description: 'Update the verification status of an identity',
  })
  @ApiParam({
    name: 'address',
    description: 'Wallet address',
    example: '0x742d35Cc6634C0532925a3b8D404E9e937b1b5dE',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Identity status updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        identityKey: { type: 'string' },
        status: { type: 'string', enum: ['pending', 'verified', 'revoked'] },
        claims: { type: 'array', items: { type: 'object' } },
        trustedIssuers: { type: 'array', items: { type: 'string' } },
        createdAt: { type: 'string', format: 'date-time' },
        verifiedAt: { type: 'string', format: 'date-time' },
        lastUpdated: { type: 'string', format: 'date-time' },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateIdentityStatus(
    @Param('address') address: string,
    @Body() updateDto: UpdateIdentityStatusDto,
    @CurrentUser() user: User
  ): Promise<IdentityRegistry> {
    this.logger.log(
      `Admin ${user.id} updating identity status for ${address} to ${updateDto.status}`
    );

    return await this.identityService.updateIdentityStatus(
      address,
      updateDto,
      user.id
    );
  }

  @Delete(':address')
  @ApiOperation({
    summary: 'Revoke identity',
    description: 'Revoke an identity (sets status to revoked)',
  })
  @ApiParam({
    name: 'address',
    description: 'Wallet address',
    example: '0x742d35Cc6634C0532925a3b8D404E9e937b1b5dE',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Identity revoked successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        identityKey: { type: 'string' },
        status: { type: 'string', enum: ['pending', 'verified', 'revoked'] },
        claims: { type: 'array', items: { type: 'object' } },
        trustedIssuers: { type: 'array', items: { type: 'string' } },
        createdAt: { type: 'string', format: 'date-time' },
        verifiedAt: { type: 'string', format: 'date-time' },
        lastUpdated: { type: 'string', format: 'date-time' },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async revokeIdentity(
    @Param('address') address: string,
    @CurrentUser() user: User
  ): Promise<IdentityRegistry> {
    this.logger.log(
      `Admin ${user.id} revoking identity for address: ${address}`
    );

    return await this.identityService.updateIdentityStatus(
      address,
      { status: IdentityStatus.REVOKED, reason: 'Admin revocation' },
      user.id
    );
  }

  @Post('batch-register')
  @ApiOperation({
    summary: 'Batch register identities',
    description: 'Register multiple identities in a single operation',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Identities registered successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          identityKey: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'verified', 'revoked'] },
          claims: { type: 'array', items: { type: 'object' } },
          trustedIssuers: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async batchRegisterIdentities(
    @Body() batchDto: BatchRegisterIdentitiesDto,
    @CurrentUser() user: User
  ): Promise<IdentityRegistry[]> {
    this.logger.log(
      `Admin ${user.id} batch registering ${batchDto.identities.length} identities`
    );

    return await this.identityService.batchRegisterIdentities(
      batchDto,
      user.id
    );
  }

  @Get('by-status')
  @ApiOperation({
    summary: 'Get identities by status',
    description: 'Retrieve all identities with a specific status',
  })
  @ApiQuery({
    name: 'status',
    enum: IdentityStatus,
    description: 'Identity status to filter by',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Identities retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          identityKey: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'verified', 'revoked'] },
          claims: { type: 'array', items: { type: 'object' } },
          trustedIssuers: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getIdentitiesByStatus(
    @Query('status') status: IdentityStatus
  ): Promise<IdentityRegistry[]> {
    return await this.identityService.getIdentitiesByStatus(status);
  }

  @Get('by-user/:userId')
  @ApiOperation({
    summary: 'Get identities by user ID',
    description: 'Retrieve all identities associated with a user ID',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID from users collection',
    example: 'user_123abc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Identities retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          identityKey: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'verified', 'revoked'] },
          claims: { type: 'array', items: { type: 'object' } },
          trustedIssuers: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getIdentitiesByUserId(
    @Param('userId') userId: string
  ): Promise<IdentityRegistry[]> {
    return await this.identityService.findIdentitiesByUserId(userId);
  }

  @Get('my-identity')
  @ApiOperation({
    summary: 'Get current user identity',
    description:
      'Retrieve identity information for the current authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User identity retrieved',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        identityKey: { type: 'string' },
        status: { type: 'string', enum: ['pending', 'verified', 'revoked'] },
        claims: { type: 'array', items: { type: 'object' } },
        trustedIssuers: { type: 'array', items: { type: 'string' } },
        createdAt: { type: 'string', format: 'date-time' },
        verifiedAt: { type: 'string', format: 'date-time' },
        lastUpdated: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getMyIdentity(
    @CurrentUser() user: User
  ): Promise<IdentityRegistry | null> {
    return await this.identityService.getIdentity(user.walletAddress);
  }

  @Post('verify-my-identity')
  @ApiOperation({
    summary: 'Verify current user identity',
    description:
      'Verify the current user identity with optional required claims',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Identity verification result',
    schema: {
      type: 'object',
      properties: {
        isVerified: { type: 'boolean' },
        identity: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string' },
          },
        },
        missingClaims: { type: 'array', items: { type: 'string' } },
        expiredClaims: { type: 'array', items: { type: 'object' } },
        reason: { type: 'string' },
      },
    },
  })
  async verifyMyIdentity(
    @Body() verifyDto: Partial<VerifyIdentityDto>,
    @CurrentUser() user: User
  ): Promise<IdentityVerificationResult> {
    return await this.identityService.verifyIdentity(
      user.walletAddress,
      verifyDto.requiredClaims
    );
  }
}
