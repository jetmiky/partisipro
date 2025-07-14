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
import { ClaimsService } from './claims.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateClaimDto,
  BatchUpdateClaimsDto,
  Claim,
  ClaimVerificationResult,
  ClaimStatus,
  ClaimTopic,
  UserRole,
  User,
} from '../../common/types';
import { VerifyClaimDto } from './dto/verify-claim.dto';

@ApiTags('Claims Management')
@Controller('api/v2/claims')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClaimsController {
  private readonly logger = new Logger(ClaimsController.name);

  constructor(private readonly claimsService: ClaimsService) {}

  @Post('issue')
  @ApiOperation({
    summary: 'Issue new claim',
    description: 'Issue a new identity claim for a verified identity',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Claim issued successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        identityId: { type: 'string' },
        claimTopic: { type: 'string' },
        issuer: { type: 'string' },
        data: { type: 'object' },
        issuedAt: { type: 'string', format: 'date-time' },
        status: { type: 'string', enum: ['active', 'revoked', 'expired'] },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async issueClaim(
    @Body() createClaimDto: CreateClaimDto,
    @CurrentUser() user: User
  ): Promise<Claim> {
    this.logger.log(
      `Admin ${user.id} issuing claim ${createClaimDto.claimTopic} for identity: ${createClaimDto.identityId}`
    );

    return await this.claimsService.issueClaim(createClaimDto, user.id);
  }

  @Get(':claimId')
  @ApiOperation({
    summary: 'Get claim details',
    description: 'Retrieve detailed information about a specific claim',
  })
  @ApiParam({
    name: 'claimId',
    description: 'Unique claim identifier',
    example: 'claim_123abc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Claim details retrieved',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        identityId: { type: 'string' },
        claimTopic: { type: 'string' },
        issuer: { type: 'string' },
        data: { type: 'object' },
        issuedAt: { type: 'string', format: 'date-time' },
        status: { type: 'string', enum: ['active', 'revoked', 'expired'] },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Claim not found',
  })
  async getClaim(@Param('claimId') claimId: string): Promise<Claim | null> {
    return await this.claimsService.getClaim(claimId);
  }

  @Post('verify')
  @ApiOperation({
    summary: 'Verify claim validity',
    description: 'Verify if a claim is valid and active',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Claim verification result',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        claim: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            claimTopic: { type: 'string' },
            status: { type: 'string' },
          },
        },
        errors: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  async verifyClaim(
    @Body() verifyDto: VerifyClaimDto
  ): Promise<ClaimVerificationResult> {
    return await this.claimsService.verifyClaim(verifyDto.claimId);
  }

  @Put(':claimId/renew')
  @ApiOperation({
    summary: 'Renew claim',
    description: 'Renew an expired or active claim with new expiration date',
  })
  @ApiParam({
    name: 'claimId',
    description: 'Unique claim identifier',
    example: 'claim_123abc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Claim renewed successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        identityId: { type: 'string' },
        claimTopic: { type: 'string' },
        issuer: { type: 'string' },
        data: { type: 'object' },
        issuedAt: { type: 'string', format: 'date-time' },
        status: { type: 'string', enum: ['active', 'revoked', 'expired'] },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async renewClaim(
    @Param('claimId') claimId: string,
    @Body() renewDto: { expiresAt: string },
    @CurrentUser() user: User
  ): Promise<Claim> {
    this.logger.log(`Admin ${user.id} renewing claim: ${claimId}`);

    return await this.claimsService.renewClaim(
      claimId,
      new Date(renewDto.expiresAt),
      user.id
    );
  }

  @Delete(':claimId/revoke')
  @ApiOperation({
    summary: 'Revoke claim',
    description: 'Revoke a claim and mark it as invalid',
  })
  @ApiParam({
    name: 'claimId',
    description: 'Unique claim identifier',
    example: 'claim_123abc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Claim revoked successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        identityId: { type: 'string' },
        claimTopic: { type: 'string' },
        issuer: { type: 'string' },
        data: { type: 'object' },
        issuedAt: { type: 'string', format: 'date-time' },
        status: { type: 'string', enum: ['active', 'revoked', 'expired'] },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async revokeClaim(
    @Param('claimId') claimId: string,
    @Body() revokeDto: { reason: string },
    @CurrentUser() user: User
  ): Promise<Claim> {
    this.logger.log(`Admin ${user.id} revoking claim: ${claimId}`);

    return await this.claimsService.revokeClaim(
      claimId,
      revokeDto.reason,
      user.id
    );
  }

  @Get('identity/:identityId')
  @ApiOperation({
    summary: 'Get claims by identity',
    description: 'Retrieve all claims associated with a specific identity',
  })
  @ApiParam({
    name: 'identityId',
    description: 'Identity ID (wallet address)',
    example: '0x742d35Cc6634C0532925a3b8D404E9e937b1b5dE',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Claims retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          identityId: { type: 'string' },
          claimTopic: { type: 'string' },
          issuer: { type: 'string' },
          data: { type: 'object' },
          issuedAt: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['active', 'revoked', 'expired'] },
        },
      },
    },
  })
  async getClaimsByIdentity(
    @Param('identityId') identityId: string
  ): Promise<Claim[]> {
    return await this.claimsService.getClaimsByIdentity(identityId);
  }

  @Get('by-topic')
  @ApiOperation({
    summary: 'Get claims by topic',
    description: 'Retrieve all claims of a specific topic type',
  })
  @ApiQuery({
    name: 'topic',
    enum: ClaimTopic,
    description: 'Claim topic to filter by',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Claims retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          identityId: { type: 'string' },
          claimTopic: { type: 'string' },
          issuer: { type: 'string' },
          data: { type: 'object' },
          issuedAt: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['active', 'revoked', 'expired'] },
        },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getClaimsByTopic(@Query('topic') topic: ClaimTopic): Promise<Claim[]> {
    return await this.claimsService.getClaimsByTopic(topic);
  }

  @Get('by-issuer')
  @ApiOperation({
    summary: 'Get claims by issuer',
    description: 'Retrieve all claims issued by a specific trusted issuer',
  })
  @ApiQuery({
    name: 'issuer',
    description: 'Issuer ID to filter by',
    example: 'verihubs_issuer_001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Claims retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          identityId: { type: 'string' },
          claimTopic: { type: 'string' },
          issuer: { type: 'string' },
          data: { type: 'object' },
          issuedAt: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['active', 'revoked', 'expired'] },
        },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getClaimsByIssuer(@Query('issuer') issuer: string): Promise<Claim[]> {
    return await this.claimsService.getClaimsByIssuer(issuer);
  }

  @Get('by-status')
  @ApiOperation({
    summary: 'Get claims by status',
    description: 'Retrieve all claims with a specific status',
  })
  @ApiQuery({
    name: 'status',
    enum: ClaimStatus,
    description: 'Claim status to filter by',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Claims retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          identityId: { type: 'string' },
          claimTopic: { type: 'string' },
          issuer: { type: 'string' },
          data: { type: 'object' },
          issuedAt: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['active', 'revoked', 'expired'] },
        },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getClaimsByStatus(
    @Query('status') status: ClaimStatus
  ): Promise<Claim[]> {
    return await this.claimsService.getClaimsByStatus(status);
  }

  @Post('batch-update')
  @ApiOperation({
    summary: 'Batch update claims',
    description: 'Update multiple claims in a single operation',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Claims updated successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          identityId: { type: 'string' },
          claimTopic: { type: 'string' },
          issuer: { type: 'string' },
          data: { type: 'object' },
          issuedAt: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['active', 'revoked', 'expired'] },
        },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async batchUpdateClaims(
    @Body() batchDto: BatchUpdateClaimsDto,
    @CurrentUser() user: User
  ): Promise<Claim[]> {
    this.logger.log(
      `Admin ${user.id} batch updating ${batchDto.updates.length} claims`
    );

    return await this.claimsService.bulkUpdateClaims(batchDto, user.id);
  }

  @Get('my-claims')
  @ApiOperation({
    summary: 'Get current user claims',
    description: 'Retrieve all claims for the current authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User claims retrieved',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          identityId: { type: 'string' },
          claimTopic: { type: 'string' },
          issuer: { type: 'string' },
          data: { type: 'object' },
          issuedAt: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['active', 'revoked', 'expired'] },
        },
      },
    },
  })
  async getMyClaims(@CurrentUser() user: User): Promise<Claim[]> {
    return await this.claimsService.getClaimsByIdentity(user.walletAddress);
  }

  @Post('verify-required')
  @ApiOperation({
    summary: 'Verify required claims',
    description: 'Check if an identity has all required claims',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Required claims verification result',
    type: Boolean,
  })
  async verifyRequiredClaims(
    @Body() verifyDto: { identityId: string; requiredClaims: ClaimTopic[] }
  ): Promise<boolean> {
    return await this.claimsService.verifyRequiredClaims(
      verifyDto.identityId,
      verifyDto.requiredClaims
    );
  }

  @Get('expired/list')
  @ApiOperation({
    summary: 'Get expired claims',
    description: 'Retrieve all claims that have expired',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expired claims retrieved',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          identityId: { type: 'string' },
          claimTopic: { type: 'string' },
          issuer: { type: 'string' },
          data: { type: 'object' },
          issuedAt: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['active', 'revoked', 'expired'] },
        },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getExpiredClaims(): Promise<Claim[]> {
    return await this.claimsService.findExpiredClaims();
  }
}
