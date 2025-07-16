import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, Logger } from '@nestjs/common';
import { AuthService, JwtPayload } from './auth.service';
import { UsersService } from '../users/users.service';
import { Web3AuthService } from './web3auth.service';
import { FirebaseAuthService } from '../../common/services/firebase-auth.service';
import { User, UserRole, KYCStatus } from '../../common/types';
import { LoginDto, RefreshTokenDto } from './dto';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let usersService: UsersService;
  let web3AuthService: Web3AuthService;
  // let firebaseAuthService: FirebaseAuthService;

  // Mock data
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    walletAddress: '0x1234567890123456789012345678901234567890',
    web3AuthId: 'web3auth-test-id',
    role: UserRole.INVESTOR,
    profile: {
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '+1234567890',
      dateOfBirth: new Date('1990-01-01'),
      nationality: 'Indonesia',
      address: {
        street: 'Test Street',
        city: 'Test City',
        province: 'Test Province',
        postalCode: '12345',
        country: 'Test Country',
      },
    },
    kyc: {
      status: KYCStatus.APPROVED,
      provider: 'verihubs',
      verificationId: 'kyc-test-id',
      submittedAt: new Date(),
      approvedAt: new Date(),
      documents: [],
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockJwtPayload: JwtPayload = {
    sub: 'test-user-id',
    email: 'test@example.com',
    walletAddress: '0x1234567890123456789012345678901234567890',
    role: UserRole.INVESTOR,
    kycStatus: 'approved',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const mockAccessToken = 'mock-access-token';
  const mockRefreshToken = 'mock-refresh-token';

  // Mock Web3Auth user data
  const mockWeb3AuthUser = {
    email: 'test@example.com',
    walletAddress: '0x1234567890123456789012345678901234567890',
    sub: 'test_user_001',
    aud: 'partisipro-app',
    iss: 'https://web3auth.io',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const mockAdminWeb3AuthUser = {
    email: 'admin@partisipro.com',
    walletAddress: '0xadmin123456789012345678901234567890',
    sub: 'admin_001',
    aud: 'partisipro-app',
    iss: 'https://web3auth.io',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const mockSPVWeb3AuthUser = {
    email: 'spv@example.com',
    walletAddress: '0xspv1234567890123456789012345678901234567890',
    sub: 'spv_001',
    aud: 'partisipro-app',
    iss: 'https://web3auth.io',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOrCreateUser: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: Web3AuthService,
          useValue: {
            verifyIdToken: jest.fn(),
          },
        },
        {
          provide: FirebaseAuthService,
          useValue: {
            authenticateWithWeb3Auth: jest.fn(),
            updateIdentityVerification: jest.fn(),
            updateCustomClaims: jest.fn(),
            healthCheck: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    usersService = module.get<UsersService>(UsersService);
    web3AuthService = module.get<Web3AuthService>(Web3AuthService);
    // firebaseAuthService = module.get<FirebaseAuthService>(FirebaseAuthService);

    // Mock environment
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateWithWeb3Auth', () => {
    const loginDto: LoginDto = {
      idToken: 'test-web3auth-token',
    };

    it('should authenticate user successfully with valid Web3Auth token', async () => {
      // Arrange
      jest
        .spyOn(web3AuthService, 'verifyIdToken')
        .mockResolvedValue(mockWeb3AuthUser);
      jest.spyOn(usersService, 'findOrCreateUser').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce(mockAccessToken);
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce(mockRefreshToken);

      // Act
      const result = await service.authenticateWithWeb3Auth(loginDto);

      // Assert
      expect(result).toEqual({
        user: mockUser,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        customClaims: expect.any(Object),
        firebaseToken: undefined,
      });

      expect(usersService.findOrCreateUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        walletAddress: '0x1234567890123456789012345678901234567890',
        web3AuthId: 'test_user_001',
      });
    });

    it('should handle admin user authentication', async () => {
      // Arrange
      const adminLoginDto: LoginDto = {
        idToken: 'admin-token',
      };

      const adminUser = { ...mockUser, role: UserRole.ADMIN };
      jest
        .spyOn(web3AuthService, 'verifyIdToken')
        .mockResolvedValue(mockAdminWeb3AuthUser);
      jest.spyOn(usersService, 'findOrCreateUser').mockResolvedValue(adminUser);
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce(mockAccessToken);
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce(mockRefreshToken);

      // Act
      const result = await service.authenticateWithWeb3Auth(adminLoginDto);

      // Assert
      expect(result.user.role).toBe(UserRole.ADMIN);
      expect(usersService.findOrCreateUser).toHaveBeenCalledWith({
        email: 'admin@partisipro.com',
        walletAddress: '0xadmin123456789012345678901234567890',
        web3AuthId: 'admin_001',
      });
    });

    it('should handle SPV user authentication', async () => {
      // Arrange
      const spvLoginDto: LoginDto = {
        idToken: 'spv-token',
      };

      const spvUser = { ...mockUser, role: UserRole.SPV };
      jest
        .spyOn(web3AuthService, 'verifyIdToken')
        .mockResolvedValue(mockSPVWeb3AuthUser);
      jest.spyOn(usersService, 'findOrCreateUser').mockResolvedValue(spvUser);
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce(mockAccessToken);
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce(mockRefreshToken);

      // Act
      const result = await service.authenticateWithWeb3Auth(spvLoginDto);

      // Assert
      expect(result.user.role).toBe(UserRole.SPV);
      expect(usersService.findOrCreateUser).toHaveBeenCalledWith({
        email: 'spv@example.com',
        walletAddress: '0xspv1234567890123456789012345678901234567890',
        web3AuthId: 'spv_001',
      });
    });

    it('should handle new user authentication', async () => {
      // Arrange
      const newUserLoginDto: LoginDto = {
        idToken: 'new-user-token',
      };

      const newUserWeb3AuthData = {
        email: 'new.user.123@example.com',
        walletAddress: '0xnew123456789012345678901234567890123',
        sub: 'new_user_123',
        aud: 'partisipro-app',
        iss: 'https://web3auth.io',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      jest
        .spyOn(web3AuthService, 'verifyIdToken')
        .mockResolvedValue(newUserWeb3AuthData);
      jest.spyOn(usersService, 'findOrCreateUser').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce(mockAccessToken);
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce(mockRefreshToken);

      // Act
      const result = await service.authenticateWithWeb3Auth(newUserLoginDto);

      // Assert
      expect(result).toEqual({
        user: mockUser,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        customClaims: expect.any(Object),
        firebaseToken: undefined,
      });

      // Verify that findOrCreateUser was called with dynamic values
      const call = (usersService.findOrCreateUser as jest.Mock).mock
        .calls[0][0];
      expect(call.email).toMatch(/^new\.user\..+@example\.com$/);
      expect(call.web3AuthId).toMatch(/^new_user_.+$/);
    });

    it('should throw UnauthorizedException when Web3Auth token verification fails', async () => {
      // Arrange
      const invalidLoginDto: LoginDto = {
        idToken: 'invalid-token',
      };

      // Mock production environment to trigger error
      process.env.NODE_ENV = 'production';

      // Act & Assert
      await expect(
        service.authenticateWithWeb3Auth(invalidLoginDto)
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user creation fails', async () => {
      // Arrange
      jest
        .spyOn(usersService, 'findOrCreateUser')
        .mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.authenticateWithWeb3Auth(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: mockRefreshToken,
    };

    it('should refresh token successfully with valid refresh token', async () => {
      // Arrange
      jest.spyOn(jwtService, 'verify').mockReturnValue(mockJwtPayload);
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce(mockAccessToken);
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce(mockRefreshToken);
      jest.spyOn(configService, 'get').mockReturnValue('refresh-secret');

      // Act
      const result = await service.refreshToken(refreshTokenDto);

      // Assert
      expect(result).toEqual({
        user: mockUser,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });

      expect(jwtService.verify).toHaveBeenCalledWith(mockRefreshToken, {
        secret: 'refresh-secret',
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      jest.spyOn(jwtService, 'verify').mockReturnValue(mockJwtPayload);
      jest.spyOn(usersService, 'findById').mockResolvedValue(null);
      jest.spyOn(configService, 'get').mockReturnValue('refresh-secret');

      // Act & Assert
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      // Arrange
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });
      jest.spyOn(configService, 'get').mockReturnValue('refresh-secret');

      // Act & Assert
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      // Arrange
      const userId = 'test-user-id';
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      // Act
      await service.logout(userId);

      // Assert
      expect(logSpy).toHaveBeenCalledWith(`User logged out: ${userId}`);
    });
  });

  describe('validateUser', () => {
    it('should validate user successfully', async () => {
      // Arrange
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);

      // Act
      const result = await service.validateUser(mockJwtPayload);

      // Assert
      expect(result).toEqual(mockUser);
      expect(usersService.findById).toHaveBeenCalledWith(mockJwtPayload.sub);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      jest.spyOn(usersService, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(service.validateUser(mockJwtPayload)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException when user is not active', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      jest.spyOn(usersService, 'findById').mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(service.validateUser(mockJwtPayload)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('private methods', () => {
    it('should generate access token with correct payload', async () => {
      // Arrange
      jest
        .spyOn(web3AuthService, 'verifyIdToken')
        .mockResolvedValue(mockWeb3AuthUser);
      jest.spyOn(usersService, 'findOrCreateUser').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockAccessToken);

      // Act
      await service.authenticateWithWeb3Auth({
        idToken: 'test-token',
      });

      // Assert
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          email: mockUser.email,
          walletAddress: mockUser.walletAddress,
          role: mockUser.role,
          kycStatus: mockUser.kyc.status,
          iat: expect.any(Number),
          exp: expect.any(Number),
        })
      );
    });

    it('should generate refresh token with correct payload', async () => {
      // Arrange
      jest
        .spyOn(web3AuthService, 'verifyIdToken')
        .mockResolvedValue(mockWeb3AuthUser);
      jest.spyOn(usersService, 'findOrCreateUser').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockRefreshToken);
      jest.spyOn(configService, 'get').mockImplementation(key => {
        switch (key) {
          case 'jwt.refreshSecret':
            return 'refresh-secret';
          case 'jwt.refreshExpiresIn':
            return '7d';
          default:
            return null;
        }
      });

      // Act
      await service.authenticateWithWeb3Auth({
        idToken: 'test-token',
      });

      // Assert
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: mockUser.id,
          type: 'refresh',
        },
        {
          secret: 'refresh-secret',
          expiresIn: '7d',
        }
      );
    });
  });

  describe('error handling', () => {
    it('should handle JWT service errors gracefully', async () => {
      // Arrange
      jest.spyOn(usersService, 'findOrCreateUser').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'sign').mockImplementation(() => {
        throw new Error('JWT service error');
      });

      // Act & Assert
      await expect(
        service.authenticateWithWeb3Auth({
          idToken: 'test-token',
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      jest
        .spyOn(usersService, 'findOrCreateUser')
        .mockRejectedValue(new Error('Database connection error'));

      // Act & Assert
      await expect(
        service.authenticateWithWeb3Auth({
          idToken: 'test-token',
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle config service errors gracefully', async () => {
      // Arrange
      jest.spyOn(configService, 'get').mockImplementation(() => {
        throw new Error('Config error');
      });

      // Act & Assert
      await expect(
        service.refreshToken({
          refreshToken: 'test-refresh-token',
        })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('environment-specific behavior', () => {
    it('should handle production environment correctly', async () => {
      // Arrange
      process.env.NODE_ENV = 'production';

      // Act & Assert
      await expect(
        service.authenticateWithWeb3Auth({
          idToken: 'test-token',
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle development environment correctly', async () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      jest
        .spyOn(web3AuthService, 'verifyIdToken')
        .mockResolvedValue(mockWeb3AuthUser);
      jest.spyOn(usersService, 'findOrCreateUser').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockAccessToken);

      // Act
      const result = await service.authenticateWithWeb3Auth({
        idToken: 'test-token',
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.user).toEqual(mockUser);
    });
  });
});
