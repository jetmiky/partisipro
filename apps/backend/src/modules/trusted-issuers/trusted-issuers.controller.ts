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
import { TrustedIssuersService } from './trusted-issuers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateTrustedIssuerDto,
  UpdateTrustedIssuerDto,
  TrustedIssuer,
  IssuerStatus,
  ClaimTopic,
  UserRole,
  User,
} from '../../common/types';

@ApiTags('Trusted Issuers Management')
@Controller('api/v2/trusted-issuers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TrustedIssuersController {
  private readonly logger = new Logger(TrustedIssuersController.name);

  constructor(private readonly trustedIssuersService: TrustedIssuersService) {}

  @Post('add')
  @ApiOperation({
    summary: 'Add trusted issuer',
    description: 'Register a new trusted issuer for claim verification',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Trusted issuer added successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        authorizedClaims: { type: 'array', items: { type: 'string' } },
        status: { type: 'string', enum: ['active', 'suspended', 'revoked'] },
        registeredAt: { type: 'string', format: 'date-time' },
        lastActivity: { type: 'string', format: 'date-time' },
        metadata: { type: 'object' },
        issuedClaimsCount: { type: 'number' },
        activeClaimsCount: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Trusted issuer already exists',
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async addTrustedIssuer(
    @Body() createDto: CreateTrustedIssuerDto,
    @CurrentUser() user: User
  ): Promise<TrustedIssuer> {
    this.logger.log(
      `Admin ${user.id} adding trusted issuer: ${createDto.issuerAddress}`
    );

    return await this.trustedIssuersService.addTrustedIssuer(
      createDto,
      user.id
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List all trusted issuers',
    description: 'Retrieve all registered trusted issuers',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trusted issuers retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          authorizedClaims: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['active', 'suspended', 'revoked'] },
          registeredAt: { type: 'string', format: 'date-time' },
          lastActivity: { type: 'string', format: 'date-time' },
          metadata: { type: 'object' },
          issuedClaimsCount: { type: 'number' },
          activeClaimsCount: { type: 'number' },
        },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllTrustedIssuers(): Promise<TrustedIssuer[]> {
    return await this.trustedIssuersService.getAllTrustedIssuers();
  }

  @Get(':issuerAddress')
  @ApiOperation({
    summary: 'Get trusted issuer details',
    description:
      'Retrieve detailed information about a specific trusted issuer',
  })
  @ApiParam({
    name: 'issuerAddress',
    description: 'Trusted issuer address/ID',
    example: 'verihubs_issuer_001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trusted issuer details retrieved',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        authorizedClaims: { type: 'array', items: { type: 'string' } },
        status: { type: 'string', enum: ['active', 'suspended', 'revoked'] },
        registeredAt: { type: 'string', format: 'date-time' },
        lastActivity: { type: 'string', format: 'date-time' },
        metadata: { type: 'object' },
        issuedClaimsCount: { type: 'number' },
        activeClaimsCount: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Trusted issuer not found',
  })
  async getTrustedIssuer(
    @Param('issuerAddress') issuerAddress: string
  ): Promise<TrustedIssuer | null> {
    return await this.trustedIssuersService.getTrustedIssuer(issuerAddress);
  }

  @Put(':issuerAddress')
  @ApiOperation({
    summary: 'Update trusted issuer',
    description: 'Update information for an existing trusted issuer',
  })
  @ApiParam({
    name: 'issuerAddress',
    description: 'Trusted issuer address/ID',
    example: 'verihubs_issuer_001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trusted issuer updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        authorizedClaims: { type: 'array', items: { type: 'string' } },
        status: { type: 'string', enum: ['active', 'suspended', 'revoked'] },
        registeredAt: { type: 'string', format: 'date-time' },
        lastActivity: { type: 'string', format: 'date-time' },
        metadata: { type: 'object' },
        issuedClaimsCount: { type: 'number' },
        activeClaimsCount: { type: 'number' },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateTrustedIssuer(
    @Param('issuerAddress') issuerAddress: string,
    @Body() updateDto: UpdateTrustedIssuerDto,
    @CurrentUser() user: User
  ): Promise<TrustedIssuer> {
    this.logger.log(
      `Admin ${user.id} updating trusted issuer: ${issuerAddress}`
    );

    return await this.trustedIssuersService.updateTrustedIssuer(
      issuerAddress,
      updateDto,
      user.id
    );
  }

  @Delete(':issuerAddress')
  @ApiOperation({
    summary: 'Remove trusted issuer',
    description: 'Remove (revoke) a trusted issuer from the system',
  })
  @ApiParam({
    name: 'issuerAddress',
    description: 'Trusted issuer address/ID',
    example: 'verihubs_issuer_001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trusted issuer removed successfully',
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async removeTrustedIssuer(
    @Param('issuerAddress') issuerAddress: string,
    @CurrentUser() user: User
  ): Promise<void> {
    this.logger.log(
      `Admin ${user.id} removing trusted issuer: ${issuerAddress}`
    );

    return await this.trustedIssuersService.removeTrustedIssuer(
      issuerAddress,
      user.id
    );
  }

  @Get('verify/:issuerAddress')
  @ApiOperation({
    summary: 'Verify trusted issuer',
    description:
      'Check if an issuer is trusted and optionally authorized for specific claim topic',
  })
  @ApiParam({
    name: 'issuerAddress',
    description: 'Trusted issuer address/ID',
    example: 'verihubs_issuer_001',
  })
  @ApiQuery({
    name: 'claimTopic',
    enum: ClaimTopic,
    required: false,
    description: 'Optional claim topic to check authorization',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Issuer verification result',
    type: Boolean,
  })
  async verifyTrustedIssuer(
    @Param('issuerAddress') issuerAddress: string,
    @Query('claimTopic') claimTopic?: ClaimTopic
  ): Promise<boolean> {
    return await this.trustedIssuersService.isTrustedIssuer(
      issuerAddress,
      claimTopic
    );
  }

  @Get('claims/:issuerAddress')
  @ApiOperation({
    summary: 'Get authorized claims',
    description: 'Retrieve claim topics that an issuer is authorized to issue',
  })
  @ApiParam({
    name: 'issuerAddress',
    description: 'Trusted issuer address/ID',
    example: 'verihubs_issuer_001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Authorized claims retrieved',
    type: [String],
  })
  async getAuthorizedClaims(
    @Param('issuerAddress') issuerAddress: string
  ): Promise<ClaimTopic[]> {
    return await this.trustedIssuersService.getAuthorizedClaims(issuerAddress);
  }

  @Get('by-status')
  @ApiOperation({
    summary: 'Get issuers by status',
    description: 'Retrieve trusted issuers filtered by status',
  })
  @ApiQuery({
    name: 'status',
    enum: IssuerStatus,
    description: 'Issuer status to filter by',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trusted issuers retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          authorizedClaims: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['active', 'suspended', 'revoked'] },
          registeredAt: { type: 'string', format: 'date-time' },
          lastActivity: { type: 'string', format: 'date-time' },
          metadata: { type: 'object' },
          issuedClaimsCount: { type: 'number' },
          activeClaimsCount: { type: 'number' },
        },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getTrustedIssuersByStatus(
    @Query('status') status: IssuerStatus
  ): Promise<TrustedIssuer[]> {
    return await this.trustedIssuersService.getTrustedIssuersByStatus(status);
  }

  @Get('by-claim-topic')
  @ApiOperation({
    summary: 'Get issuers by claim topic',
    description:
      'Retrieve trusted issuers authorized for a specific claim topic',
  })
  @ApiQuery({
    name: 'claimTopic',
    enum: ClaimTopic,
    description: 'Claim topic to filter by',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trusted issuers retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          authorizedClaims: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['active', 'suspended', 'revoked'] },
          registeredAt: { type: 'string', format: 'date-time' },
          lastActivity: { type: 'string', format: 'date-time' },
          metadata: { type: 'object' },
          issuedClaimsCount: { type: 'number' },
          activeClaimsCount: { type: 'number' },
        },
      },
    },
  })
  async getTrustedIssuersByClaimTopic(
    @Query('claimTopic') claimTopic: ClaimTopic
  ): Promise<TrustedIssuer[]> {
    return await this.trustedIssuersService.getTrustedIssuersByClaimTopic(
      claimTopic
    );
  }
}
