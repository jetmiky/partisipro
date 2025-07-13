import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../../common/types';
import { LoginDto, RefreshTokenDto } from './dto';
import { Web3AuthService } from './web3auth.service';

export interface JwtPayload {
  sub: string;
  email: string;
  walletAddress: string;
  role: UserRole;
  kycStatus: string;
  iat: number;
  exp: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
    private web3AuthService: Web3AuthService
  ) {}

  async authenticateWithWeb3Auth(loginDto: LoginDto): Promise<AuthResponse> {
    try {
      // Verify Web3Auth ID token using dedicated service
      const web3AuthUser = await this.web3AuthService.verifyIdToken(
        loginDto.idToken
      );

      // Get or create user in Firestore
      const user = await this.usersService.findOrCreateUser({
        email: web3AuthUser.email,
        walletAddress: web3AuthUser.walletAddress,
        web3AuthId: web3AuthUser.sub,
      });

      // Generate JWT tokens
      const accessToken = await this.generateAccessToken(user);
      const refreshToken = await this.generateRefreshToken(user.id);

      this.logger.log(`User authenticated successfully: ${user.email}`);

      return {
        user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      this.logger.error('Authentication failed', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    try {
      const payload = await this.verifyRefreshToken(
        refreshTokenDto.refreshToken
      );
      const user = await this.usersService.findById(payload.sub as string);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const accessToken = await this.generateAccessToken(user);
      const refreshToken = await this.generateRefreshToken(user.id);

      return {
        user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      this.logger.error('Token refresh failed', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    // In a production environment, you might want to blacklist the tokens
    // For now, we'll just log the logout
    this.logger.log(`User logged out: ${userId}`);
  }

  async validateUser(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return user;
  }

  private async generateAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
      role: user.role,
      kycStatus: user.kyc.status,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    };

    return this.jwtService.sign(payload);
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const payload = {
      sub: userId,
      type: 'refresh',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.refreshSecret'),
      expiresIn: this.configService.get('jwt.refreshExpiresIn'),
    });
  }

  private async verifyRefreshToken(
    token: string
  ): Promise<Record<string, unknown>> {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get('jwt.refreshSecret'),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
