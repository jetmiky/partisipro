import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MFAService } from './mfa.service';
import { LoginDto, RefreshTokenDto } from './dto';
import { UnauthorizedException } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { User, UserRole, KYCStatus } from '../../common/types';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    authenticateWithWeb3Auth: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  };

  const mockMFAService = {
    setupTOTP: jest.fn(),
    enableMFA: jest.fn(),
    verifyTOTP: jest.fn(),
    verifyBackupCode: jest.fn(),
    disableMFA: jest.fn(),
    regenerateBackupCodes: jest.fn(),
    getMFAStatus: jest.fn(),
  };

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
      nationality: 'ID',
      address: {
        street: 'Test Street',
        city: 'Test City',
        province: 'Test Province',
        postalCode: '12345',
        country: 'Indonesia',
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

  const mockAuthResponse = {
    user: mockUser,
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: MFAService,
          useValue: mockMFAService,
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should authenticate user successfully', async () => {
      // Arrange
      const loginDto: LoginDto = {
        idToken: 'test-web3auth-token',
      };

      jest
        .spyOn(authService, 'authenticateWithWeb3Auth')
        .mockResolvedValue(mockAuthResponse);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(result).toEqual(mockAuthResponse);
      expect(authService.authenticateWithWeb3Auth).toHaveBeenCalledWith(
        loginDto
      );
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      // Arrange
      const loginDto: LoginDto = {
        idToken: 'invalid-token',
      };

      jest
        .spyOn(authService, 'authenticateWithWeb3Auth')
        .mockRejectedValue(new UnauthorizedException('Invalid token'));

      // Act & Assert
      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Arrange
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'mock-refresh-token',
      };

      jest
        .spyOn(authService, 'refreshToken')
        .mockResolvedValue(mockAuthResponse);

      // Act
      const result = await controller.refresh(refreshTokenDto);

      // Assert
      expect(result).toEqual(mockAuthResponse);
      expect(authService.refreshToken).toHaveBeenCalledWith(refreshTokenDto);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      // Arrange
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'invalid-refresh-token',
      };

      jest
        .spyOn(authService, 'refreshToken')
        .mockRejectedValue(new UnauthorizedException('Invalid refresh token'));

      // Act & Assert
      await expect(controller.refresh(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      // Arrange
      jest.spyOn(authService, 'logout').mockResolvedValue(undefined);

      // Act
      const result = await controller.logout(mockUser);

      // Assert
      expect(result).toEqual({ message: 'Logout successful' });
      expect(authService.logout).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      // Arrange
      // const mockRequest = {
      //   user: mockUser,
      // };

      // Act
      const result = await controller.getProfile(mockUser);

      // Assert
      expect(result).toEqual(mockUser);
    });
  });
});
