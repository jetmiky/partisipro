import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService, AuthResponse } from './auth.service';
import {
  MFAService,
  MFASetupResponse,
  MFAVerificationResult,
} from './mfa.service';
import { LoginDto, RefreshTokenDto } from './dto';
import {
  SetupMFADto,
  EnableMFADto,
  VerifyMFADto,
  VerifyBackupCodeDto,
  DisableMFADto,
  RegenerateBackupCodesDto,
} from './dto/mfa.dto';
import { JwtAuthGuard, CurrentUser } from '../../common';
import { User } from '../../common/types';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private authService: AuthService,
    private mfaService: MFAService
  ) {}

  @Post('web3auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Web3Auth' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.authenticateWithWeb3Auth(loginDto);
  }

  @Post('web3auth/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto
  ): Promise<AuthResponse> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@CurrentUser() user: User): Promise<{ message: string }> {
    await this.authService.logout(user.id);
    return { message: 'Logout successful' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  // MFA Endpoints
  @Post('mfa/setup')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Setup MFA (TOTP)' })
  @ApiResponse({ status: 200, description: 'MFA setup successful' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async setupMFA(
    @CurrentUser() user: User,
    @Body() setupMFADto: SetupMFADto
  ): Promise<MFASetupResponse> {
    return this.mfaService.setupTOTP(user.id, setupMFADto.email);
  }

  @Post('mfa/enable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable MFA' })
  @ApiResponse({ status: 200, description: 'MFA enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid TOTP code' })
  async enableMFA(
    @CurrentUser() user: User,
    @Body() enableMFADto: EnableMFADto
  ): Promise<{ success: boolean }> {
    const result = await this.mfaService.enableMFA(
      user.id,
      enableMFADto.totpCode
    );
    return { success: result };
  }

  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify MFA TOTP code' })
  @ApiResponse({ status: 200, description: 'MFA verification result' })
  @ApiResponse({ status: 400, description: 'Invalid TOTP code' })
  async verifyMFA(
    @CurrentUser() user: User,
    @Body() verifyMFADto: VerifyMFADto
  ): Promise<MFAVerificationResult> {
    return this.mfaService.verifyTOTP(user.id, verifyMFADto.totpCode);
  }

  @Post('mfa/verify-backup')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify MFA backup code' })
  @ApiResponse({ status: 200, description: 'Backup code verification result' })
  @ApiResponse({ status: 400, description: 'Invalid backup code' })
  async verifyBackupCode(
    @CurrentUser() user: User,
    @Body() verifyBackupCodeDto: VerifyBackupCodeDto
  ): Promise<MFAVerificationResult> {
    return this.mfaService.verifyBackupCode(
      user.id,
      verifyBackupCodeDto.backupCode
    );
  }

  @Post('mfa/disable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable MFA' })
  @ApiResponse({ status: 200, description: 'MFA disabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid TOTP code' })
  async disableMFA(
    @CurrentUser() user: User,
    @Body() disableMFADto: DisableMFADto
  ): Promise<{ success: boolean }> {
    const result = await this.mfaService.disableMFA(
      user.id,
      disableMFADto.totpCode
    );
    return { success: result };
  }

  @Post('mfa/regenerate-backup-codes')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate MFA backup codes' })
  @ApiResponse({
    status: 200,
    description: 'Backup codes regenerated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid TOTP code' })
  async regenerateBackupCodes(
    @CurrentUser() user: User,
    @Body() regenerateBackupCodesDto: RegenerateBackupCodesDto
  ): Promise<{ backupCodes: string[] }> {
    const backupCodes = await this.mfaService.regenerateBackupCodes(
      user.id,
      regenerateBackupCodesDto.totpCode
    );
    return { backupCodes };
  }

  @Get('mfa/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get MFA status' })
  @ApiResponse({
    status: 200,
    description: 'MFA status retrieved successfully',
  })
  async getMFAStatus(@CurrentUser() user: User): Promise<{
    enabled: boolean;
    backupCodesRemaining: number;
    lockedUntil?: Date;
  }> {
    return this.mfaService.getMFAStatus(user.id);
  }
}
