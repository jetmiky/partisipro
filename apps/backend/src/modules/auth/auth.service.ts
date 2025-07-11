import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../../common/types';
import { LoginDto, RefreshTokenDto } from './dto';

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
    private usersService: UsersService
  ) {}

  async authenticateWithWeb3Auth(loginDto: LoginDto): Promise<AuthResponse> {
    try {
      // Verify Web3Auth ID token
      const web3AuthUser = await this.verifyWeb3AuthToken(loginDto.idToken);

      // Get or create user in Firestore
      const user = await this.usersService.findOrCreateUser({
        email: web3AuthUser.email as string,
        walletAddress: web3AuthUser.walletAddress as string,
        web3AuthId: web3AuthUser.sub as string,
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

  private async verifyWeb3AuthToken(
    idToken: string
  ): Promise<Record<string, unknown>> {
    // Mock Web3Auth token verification for development
    // In production, this would verify the actual Web3Auth JWT token
    try {
      this.logger.debug(
        `Verifying Web3Auth token: ${idToken.substring(0, 10)}...`
      );

      // Mock different scenarios based on token content
      const isDevelopment = process.env.NODE_ENV === 'development';

      if (!isDevelopment) {
        // TODO: Implement actual Web3Auth verification for production
        // 1. Decode the JWT token
        // 2. Verify the signature using Web3Auth public key
        // 3. Validate the token claims
        throw new Error('Production Web3Auth verification not implemented');
      }

      // Development mock - parse different test scenarios
      let mockUser;

      if (idToken.includes('admin')) {
        mockUser = {
          sub: 'admin_001',
          email: 'admin@partisipro.com',
          walletAddress: '0xadmin123456789012345678901234567890',
          name: 'Admin User',
          role: 'admin',
        };
      } else if (idToken.includes('spv')) {
        mockUser = {
          sub: 'spv_001',
          email: 'spv@example.com',
          walletAddress: '0xspv1234567890123456789012345678901234',
          name: 'SPV Company',
          role: 'spv',
        };
      } else if (idToken.includes('investor')) {
        mockUser = {
          sub: 'investor_001',
          email: 'investor@example.com',
          walletAddress: '0xinvestor123456789012345678901234567890',
          name: 'John Investor',
          role: 'investor',
        };
      } else if (idToken.includes('new')) {
        // New user scenario
        const randomId = Math.random().toString(36).substr(2, 9);
        mockUser = {
          sub: `new_user_${randomId}`,
          email: `new.user.${randomId}@example.com`,
          walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
          name: `New User ${randomId}`,
          role: 'investor',
        };
      } else {
        // Default test user
        mockUser = {
          sub: 'test_user_001',
          email: 'test@example.com',
          walletAddress: '0x1234567890123456789012345678901234567890',
          name: 'Test User',
          role: 'investor',
        };
      }

      // Simulate token validation
      const currentTime = Math.floor(Date.now() / 1000);

      return {
        ...mockUser,
        iat: currentTime,
        exp: currentTime + 3600, // 1 hour
        aud: 'partisipro-dev',
        iss: 'web3auth.io',
      };
    } catch (error) {
      this.logger.error('Web3Auth token verification failed', error);
      throw new UnauthorizedException('Invalid Web3Auth token');
    }
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
