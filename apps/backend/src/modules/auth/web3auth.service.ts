import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';

export interface Web3AuthTokenPayload {
  sub: string;
  email: string;
  name?: string;
  walletAddress?: string;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
}

@Injectable()
export class Web3AuthService {
  private readonly logger = new Logger(Web3AuthService.name);
  private jwksClient: JwksClient;

  constructor(private configService: ConfigService) {
    // Initialize JWKS client for Web3Auth and Firebase
    const web3AuthDomain = this.configService.get(
      'web3auth.domain',
      'web3auth.io'
    );

    // Determine authentication mode: 'firebase', 'web3auth', or 'hybrid'
    const authMode = this.configService.get('auth.mode', 'hybrid');

    // For Firebase integration, we use Firebase's JWKS endpoint
    const useFirebaseJWKS = authMode === 'firebase' || authMode === 'hybrid';
    const jwksUri = useFirebaseJWKS
      ? 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
      : `https://${web3AuthDomain}/.well-known/jwks.json`;

    this.jwksClient = new JwksClient({
      jwksUri,
      cache: true,
      cacheMaxAge: 86400000, // 24 hours
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });

    this.logger.log(`Web3Auth service initialized with auth mode: ${authMode}`);
  }

  async verifyIdToken(idToken: string): Promise<Web3AuthTokenPayload> {
    try {
      this.logger.debug(`Verifying token: ${idToken.substring(0, 10)}...`);

      // Check if we're in development or test mode
      const isDevelopment =
        this.configService.get('NODE_ENV') === 'development';
      const isTest = this.configService.get('NODE_ENV') === 'test';
      const enableMockAuth = this.configService.get(
        'web3auth.enableMock',
        isDevelopment || isTest
      );

      if (enableMockAuth) {
        this.logger.debug('Using mock authentication for development/test');
        return this.mockTokenVerification(idToken);
      }

      // Detect token type and use appropriate verification method
      const authMode = this.configService.get('auth.mode', 'hybrid');

      if (authMode === 'firebase') {
        return await this.verifyFirebaseToken(idToken);
      } else if (authMode === 'web3auth') {
        return await this.verifyWeb3AuthToken(idToken);
      } else {
        // Hybrid mode - try to detect token type
        return await this.verifyHybridToken(idToken);
      }
    } catch (error) {
      this.logger.error('Token verification failed', error);
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private async verifyFirebaseToken(
    idToken: string
  ): Promise<Web3AuthTokenPayload> {
    try {
      this.logger.debug('Verifying Firebase token');

      // Decode token without verification to get header
      const decodedToken = jwt.decode(idToken, { complete: true });

      if (
        !decodedToken ||
        typeof decodedToken === 'string' ||
        !decodedToken.header
      ) {
        throw new Error('Invalid token format');
      }

      const { kid } = decodedToken.header;

      if (!kid) {
        throw new Error('Token missing key ID');
      }

      // Get signing key from Firebase JWKS
      const key = await this.getSigningKey(kid);

      // Verify token
      const payload = jwt.verify(idToken, key) as any;

      // Validate Firebase token claims
      await this.validateFirebaseTokenClaims(payload);

      // Convert Firebase payload to Web3Auth format
      const web3AuthPayload: Web3AuthTokenPayload = {
        sub: payload.sub,
        email: payload.email || payload.firebase?.identities?.email?.[0],
        name: payload.name || payload.firebase?.identities?.name?.[0],
        walletAddress:
          payload.walletAddress || this.deriveWalletFromSub(payload.sub),
        aud: payload.aud,
        iss: payload.iss,
        iat: payload.iat,
        exp: payload.exp,
      };

      return web3AuthPayload;
    } catch (error) {
      this.logger.error('Firebase token verification failed', error);
      throw new UnauthorizedException('Firebase token verification failed');
    }
  }

  private async verifyWeb3AuthToken(
    idToken: string
  ): Promise<Web3AuthTokenPayload> {
    try {
      this.logger.debug('Verifying Web3Auth token');

      // Decode token without verification to get header
      const decodedToken = jwt.decode(idToken, { complete: true });

      if (
        !decodedToken ||
        typeof decodedToken === 'string' ||
        !decodedToken.header
      ) {
        throw new Error('Invalid token format');
      }

      const { kid } = decodedToken.header;

      if (!kid) {
        throw new Error('Token missing key ID');
      }

      // Get signing key from Web3Auth JWKS
      const key = await this.getSigningKey(kid);

      // Verify token
      const payload = jwt.verify(idToken, key) as Web3AuthTokenPayload;

      // Validate Web3Auth token claims
      await this.validateWeb3AuthTokenClaims(payload);

      // Extract wallet address from payload or derive from sub
      const walletAddress =
        payload.walletAddress || this.deriveWalletFromSub(payload.sub);

      return {
        ...payload,
        walletAddress,
      };
    } catch (error) {
      this.logger.error('Web3Auth token verification failed', error);
      throw new UnauthorizedException('Web3Auth token verification failed');
    }
  }

  private async verifyHybridToken(
    idToken: string
  ): Promise<Web3AuthTokenPayload> {
    try {
      this.logger.debug('Verifying hybrid token - detecting token type');

      // Decode token to determine issuer
      const decodedToken = jwt.decode(idToken, { complete: true });

      if (
        !decodedToken ||
        typeof decodedToken === 'string' ||
        !decodedToken.payload
      ) {
        throw new Error('Invalid token format');
      }

      const payload = decodedToken.payload as any;
      const issuer = payload.iss;

      // Determine token type based on issuer
      if (issuer && issuer.includes('securetoken.google.com')) {
        this.logger.debug('Detected Firebase token');
        return await this.verifyFirebaseToken(idToken);
      } else if (issuer && issuer.includes('web3auth.io')) {
        this.logger.debug('Detected Web3Auth token');
        return await this.verifyWeb3AuthToken(idToken);
      } else {
        // Default to Web3Auth verification
        this.logger.debug(
          'Unknown issuer, defaulting to Web3Auth verification'
        );
        return await this.verifyWeb3AuthToken(idToken);
      }
    } catch (error) {
      this.logger.error('Hybrid token verification failed', error);
      throw new UnauthorizedException('Hybrid token verification failed');
    }
  }

  private async mockTokenVerification(
    idToken: string
  ): Promise<Web3AuthTokenPayload> {
    this.logger.debug(`Using mock Web3Auth verification for token: ${idToken}`);

    // Mock different scenarios based on token content (enhanced for business flow tests)
    let mockUser: Partial<Web3AuthTokenPayload>;

    // Handle specific business flow test tokens (order matters - most specific first)
    if (
      idToken === 'mock-retail-investor-token' ||
      idToken.includes('retail')
    ) {
      mockUser = {
        sub: 'retail_001',
        email: 'retail.investor@gmail.com',
        name: 'Retail Investor',
        walletAddress: '0xretail1234567890123456789012345678901234567890',
      };
    } else if (
      idToken === 'mock-accredited-investor-token' ||
      idToken.includes('accredited')
    ) {
      mockUser = {
        sub: 'accredited_001',
        email: 'accredited.investor@wealth.com',
        name: 'Accredited Investor',
        walletAddress: '0xaccredited123456789012345678901234567890',
      };
    } else if (
      idToken === 'mock-institutional-investor-token' ||
      idToken.includes('institutional')
    ) {
      mockUser = {
        sub: 'institutional_001',
        email: 'institutional@fund.com',
        name: 'Institutional Investor',
        walletAddress: '0xinstitutional123456789012345678901234567890',
      };
    } else if (
      idToken === 'mock-unverified-token' ||
      idToken.includes('unverified')
    ) {
      mockUser = {
        sub: 'unverified_001',
        email: 'unverified@example.com',
        name: 'Unverified User',
        walletAddress: '0xunverified123456789012345678901234567890',
      };
    } else if (idToken.includes('admin')) {
      mockUser = {
        sub: 'admin_001',
        email: 'admin@partisipro.com',
        name: 'Admin User',
        walletAddress: '0xadmin123456789012345678901234567890',
      };
    } else if (idToken.includes('spv')) {
      mockUser = {
        sub: 'spv_001',
        email: 'spv@infrastructure.com',
        name: 'SPV Company',
        walletAddress: '0xspv1234567890123456789012345678901234',
      };
    } else if (idToken.includes('investor')) {
      mockUser = {
        sub: 'investor_001',
        email: 'investor@example.com',
        name: 'John Investor',
        walletAddress: '0xinvestor123456789012345678901234567890',
      };
    } else if (idToken.includes('new')) {
      // New user scenario
      const randomId = Math.random().toString(36).substr(2, 9);
      mockUser = {
        sub: `new_user_${randomId}`,
        email: `new.user.${randomId}@example.com`,
        name: `New User ${randomId}`,
        walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      };
    } else {
      // Default test user
      mockUser = {
        sub: 'test_user_001',
        email: 'test@example.com',
        name: 'Test User',
        walletAddress: '0x1234567890123456789012345678901234567890',
      };
    }

    // Simulate real token structure
    const currentTime = Math.floor(Date.now() / 1000);

    return {
      sub: mockUser.sub!,
      email: mockUser.email!,
      name: mockUser.name,
      walletAddress: mockUser.walletAddress!,
      aud: this.configService.get('web3auth.clientId', 'partisipro-dev'),
      iss: 'web3auth.io',
      iat: currentTime,
      exp: currentTime + 3600, // 1 hour
    };
  }

  private async getSigningKey(kid: string): Promise<string> {
    try {
      const key = await this.jwksClient.getSigningKey(kid);
      return key.getPublicKey();
    } catch (error) {
      this.logger.error(`Failed to get signing key for kid: ${kid}`, error);
      throw new Error('Unable to find appropriate key');
    }
  }

  private async validateFirebaseTokenClaims(payload: any): Promise<void> {
    const firebaseProjectId = this.configService.get('firebase.projectId');
    const expectedFirebaseIssuer = `https://securetoken.google.com/${firebaseProjectId}`;

    // Validate Firebase-specific claims
    if (payload.aud !== firebaseProjectId) {
      throw new Error(
        `Invalid Firebase audience. Expected: ${firebaseProjectId}, Got: ${payload.aud}`
      );
    }

    if (payload.iss !== expectedFirebaseIssuer) {
      throw new Error(
        `Invalid Firebase issuer. Expected: ${expectedFirebaseIssuer}, Got: ${payload.iss}`
      );
    }

    // Common validations
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp < currentTime) {
      throw new Error('Token has expired');
    }

    if (payload.iat > currentTime + 300) {
      // Allow 5 minutes skew
      throw new Error('Token used before issued');
    }

    // Validate required fields
    if (!payload.sub) {
      throw new Error('Token missing required claims');
    }
  }

  private async validateWeb3AuthTokenClaims(
    payload: Web3AuthTokenPayload
  ): Promise<void> {
    const expectedAudience = this.configService.get('web3auth.clientId');
    const expectedIssuer = this.configService.get(
      'web3auth.issuer',
      'web3auth.io'
    );

    // Validate audience
    if (expectedAudience && payload.aud !== expectedAudience) {
      throw new Error(
        `Invalid audience. Expected: ${expectedAudience}, Got: ${payload.aud}`
      );
    }

    // Validate issuer
    if (payload.iss !== expectedIssuer) {
      throw new Error(
        `Invalid issuer. Expected: ${expectedIssuer}, Got: ${payload.iss}`
      );
    }

    // Common validations
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp < currentTime) {
      throw new Error('Token has expired');
    }

    if (payload.iat > currentTime + 300) {
      // Allow 5 minutes skew
      throw new Error('Token used before issued');
    }

    // Validate required fields
    if (!payload.sub || !payload.email) {
      throw new Error('Token missing required claims');
    }
  }

  private deriveWalletFromSub(sub: string): string {
    // In real Web3Auth, wallet address might be derived from the sub
    // This is a simplified implementation
    const hash = createHash('sha256').update(sub).digest('hex');
    return `0x${hash.substring(0, 40)}`;
  }

  async getUserInfo(accessToken: string): Promise<any> {
    try {
      const isDevelopment =
        this.configService.get('NODE_ENV') === 'development';
      const enableMockAuth = this.configService.get(
        'web3auth.enableMock',
        isDevelopment
      );

      if (enableMockAuth) {
        this.logger.debug('Using mock user info for development');
        return {
          sub: 'mock_user',
          email: 'mock@example.com',
          name: 'Mock User',
          walletAddress: '0xmock1234567890123456789012345678901234',
        };
      }

      // Real Web3Auth user info endpoint
      const web3AuthDomain = this.configService.get(
        'web3auth.domain',
        'web3auth.io'
      );

      const response = await axios.get(`https://${web3AuthDomain}/userinfo`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get user info from Web3Auth', error);
      throw new UnauthorizedException('Failed to retrieve user information');
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    try {
      const isDevelopment =
        this.configService.get('NODE_ENV') === 'development';
      const enableMockAuth = this.configService.get(
        'web3auth.enableMock',
        isDevelopment
      );

      if (enableMockAuth) {
        this.logger.debug('Using mock token refresh for development');
        return {
          access_token: 'mock_access_token',
          id_token: 'mock_id_token',
          refresh_token: 'mock_refresh_token',
          expires_in: 3600,
        };
      }

      // Real Web3Auth token refresh
      const web3AuthDomain = this.configService.get(
        'web3auth.domain',
        'web3auth.io'
      );
      const clientId = this.configService.get('web3auth.clientId');
      const clientSecret = this.configService.get('web3auth.clientSecret');

      const response = await axios.post(
        `https://${web3AuthDomain}/oauth/token`,
        {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to refresh Web3Auth token', error);
      throw new UnauthorizedException('Token refresh failed');
    }
  }
}
