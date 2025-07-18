import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User, UserRole, KYCStatus } from '../../common/types';
import { LoginDto, RefreshTokenDto } from './dto';
import { Web3AuthService } from './web3auth.service';
import { FirebaseAuthService } from './firebase-auth.service';

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
  firebaseToken?: string;
  customClaims?: any;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
    private web3AuthService: Web3AuthService,
    private firebaseAuthService: FirebaseAuthService
  ) {}

  async authenticateWithWeb3Auth(loginDto: LoginDto): Promise<AuthResponse> {
    try {
      this.logger.log(
        `Starting Web3Auth + Firebase authentication flow for token: ${loginDto.idToken}`
      );

      // Step 1: Verify the token (could be Firebase ID token or Web3Auth token)
      const web3AuthUser = await this.web3AuthService.verifyIdToken(
        loginDto.idToken
      );

      if (!web3AuthUser || !web3AuthUser.email) {
        throw new UnauthorizedException('Invalid token: missing user email');
      }

      this.logger.log(
        `Token verified for user: ${web3AuthUser.email}, wallet: ${web3AuthUser.walletAddress}`
      );

      // Step 2: Get or create user in Firestore
      const user = await this.usersService.findOrCreateUser({
        email: web3AuthUser.email,
        walletAddress: web3AuthUser.walletAddress,
        web3AuthId: web3AuthUser.sub,
      });

      // Step 3: Generate JWT tokens for our application
      const accessToken = await this.generateAccessToken(user);
      const refreshToken = await this.generateRefreshToken(user.id);

      // Step 4: Create custom claims for the user
      const customClaims = {
        role: user.role || 'investor',
        identity_verified: user.kyc?.status === 'approved',
        kyc_approved: user.kyc?.status === 'approved',
        wallet_address: user.walletAddress,
        permissions: this.getUserPermissions(user.role),
      };

      this.logger.log(`User authenticated successfully: ${user.email}`);

      return {
        user,
        accessToken,
        refreshToken,
        firebaseToken: undefined, // Not needed in this simplified flow
        customClaims,
      };
    } catch (error) {
      this.logger.error('Authentication failed', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async authenticateWithFirebase(loginDto: LoginDto): Promise<AuthResponse> {
    try {
      this.logger.log(
        `Starting Firebase authentication flow for token: ${loginDto.idToken}`
      );

      // Step 1: Verify Firebase ID token
      const firebaseUser = await this.firebaseAuthService.verifyIdToken(
        loginDto.idToken
      );

      if (!firebaseUser || !firebaseUser.email) {
        throw new UnauthorizedException(
          'Invalid Firebase token: missing user email'
        );
      }

      this.logger.log(
        `Firebase token verified for user: ${firebaseUser.email}`
      );

      // Step 2: Get or create user in Firestore
      const user = await this.usersService.findOrCreateUser({
        email: firebaseUser.email,
        walletAddress: this.deriveWalletFromFirebaseUid(firebaseUser.uid),
        firebaseUid: firebaseUser.uid,
      });

      // Step 3: Generate JWT tokens for our application
      const accessToken = await this.generateAccessToken(user);
      const refreshToken = await this.generateRefreshToken(user.id);

      // Step 4: Create custom claims for the user
      const customClaims = {
        role: user.role || 'investor',
        identity_verified: user.kyc?.status === 'approved',
        kyc_approved: user.kyc?.status === 'approved',
        wallet_address: user.walletAddress,
        permissions: this.getUserPermissions(user.role),
      };

      // Step 5: Set custom claims in Firebase Auth
      await this.firebaseAuthService.setCustomClaims(
        firebaseUser.uid,
        customClaims
      );

      this.logger.log(`User authenticated successfully: ${user.email}`);

      return {
        user,
        accessToken,
        refreshToken,
        firebaseToken: loginDto.idToken,
        customClaims,
      };
    } catch (error) {
      this.logger.error('Firebase authentication failed', error);
      throw new UnauthorizedException('Firebase authentication failed');
    }
  }

  async authenticateHybrid(loginDto: LoginDto): Promise<AuthResponse> {
    try {
      this.logger.log(
        `Starting hybrid authentication flow for token: ${loginDto.idToken}`
      );

      // Determine token type based on issuer or use Web3Auth service hybrid mode
      const web3AuthUser = await this.web3AuthService.verifyIdToken(
        loginDto.idToken
      );

      if (!web3AuthUser || !web3AuthUser.email) {
        throw new UnauthorizedException('Invalid token: missing user email');
      }

      this.logger.log(
        `Hybrid token verified for user: ${web3AuthUser.email}, wallet: ${web3AuthUser.walletAddress}`
      );

      // Get or create user in Firestore
      const user = await this.usersService.findOrCreateUser({
        email: web3AuthUser.email,
        walletAddress: web3AuthUser.walletAddress,
        web3AuthId: web3AuthUser.sub,
      });

      // Generate JWT tokens for our application
      const accessToken = await this.generateAccessToken(user);
      const refreshToken = await this.generateRefreshToken(user.id);

      // Create custom claims for the user
      const customClaims = {
        role: user.role || 'investor',
        identity_verified: user.kyc?.status === 'approved',
        kyc_approved: user.kyc?.status === 'approved',
        wallet_address: user.walletAddress,
        permissions: this.getUserPermissions(user.role),
      };

      this.logger.log(`User authenticated successfully: ${user.email}`);

      return {
        user,
        accessToken,
        refreshToken,
        firebaseToken: loginDto.idToken,
        customClaims,
      };
    } catch (error) {
      this.logger.error('Hybrid authentication failed', error);
      throw new UnauthorizedException('Hybrid authentication failed');
    }
  }

  private getUserPermissions(role: string): string[] {
    switch (role) {
      case 'admin':
        return ['read', 'write', 'admin', 'manage_users', 'manage_projects'];
      case 'spv':
        return ['read', 'write', 'create_projects', 'manage_own_projects'];
      case 'investor':
        return ['read', 'invest', 'governance'];
      default:
        return ['read'];
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

  async updateIdentityVerification(
    userId: string,
    verified: boolean,
    kycApproved: boolean
  ): Promise<void> {
    try {
      // Update user KYC status in Firestore
      await this.usersService.updateKYCStatus(
        userId,
        kycApproved ? KYCStatus.APPROVED : KYCStatus.PENDING
      );

      this.logger.log(`Identity verification updated for user: ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to update identity verification for user: ${userId}`,
        error
      );
      throw error;
    }
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

  private deriveWalletFromFirebaseUid(uid: string): string {
    // In a real implementation, you might derive this from the Firebase UID
    // This is a simplified implementation for prototype purposes

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createHash } = require('crypto');
    const hash = createHash('sha256').update(uid).digest('hex');
    return `0x${hash.substring(0, 40)}`;
  }
}
