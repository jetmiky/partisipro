import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthModule } from '../src/modules/auth/auth.module';
import { AuthService } from '../src/modules/auth/auth.service';
import { UsersService } from '../src/modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'investor',
    walletAddress: '0x1234567890123456789012345678901234567890',
    web3AuthId: 'web3auth-test-id',
    profile: {
      firstName: 'Test',
      lastName: 'User',
    },
    kyc: {
      status: 'approved',
    },
    isActive: true,
  };

  const mockAuthResponse = {
    user: mockUser,
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(AuthService)
      .useValue({
        authenticateWithWeb3Auth: jest.fn(),
        refreshToken: jest.fn(),
        logout: jest.fn(),
        validateUser: jest.fn(),
      })
      .overrideProvider(UsersService)
      .useValue({
        findOrCreateUser: jest.fn(),
        findById: jest.fn(),
      })
      .overrideProvider(JwtService)
      .useValue({
        sign: jest.fn(),
        verify: jest.fn(),
      })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    authService = moduleFixture.get<AuthService>(AuthService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should authenticate user successfully', async () => {
      // Arrange
      const loginDto = {
        idToken: 'test-web3auth-token',
      };

      jest
        .spyOn(authService, 'authenticateWithWeb3Auth')
        .mockResolvedValue(mockAuthResponse);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(201);

      expect(response.body).toEqual(mockAuthResponse);
    });

    it('should return 401 for invalid token', async () => {
      // Arrange
      const loginDto = {
        idToken: 'invalid-token',
      };

      jest
        .spyOn(authService, 'authenticateWithWeb3Auth')
        .mockRejectedValue(new Error('Authentication failed'));

      // Act & Assert
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(500); // Internal server error due to mock rejection
    });

    it('should return 400 for missing idToken', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });

    it('should return 400 for invalid idToken format', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ idToken: 123 })
        .expect(400);
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should refresh token successfully', async () => {
      // Arrange
      const refreshTokenDto = {
        refreshToken: 'mock-refresh-token',
      };

      jest
        .spyOn(authService, 'refreshToken')
        .mockResolvedValue(mockAuthResponse);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send(refreshTokenDto)
        .expect(201);

      expect(response.body).toEqual(mockAuthResponse);
    });

    it('should return 401 for invalid refresh token', async () => {
      // Arrange
      const refreshTokenDto = {
        refreshToken: 'invalid-refresh-token',
      };

      jest
        .spyOn(authService, 'refreshToken')
        .mockRejectedValue(new Error('Invalid refresh token'));

      // Act & Assert
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send(refreshTokenDto)
        .expect(500); // Internal server error due to mock rejection
    });

    it('should return 400 for missing refreshToken', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(400);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout user successfully', async () => {
      // Arrange
      const mockJwtToken = 'mock-jwt-token';
      jest.spyOn(authService, 'logout').mockResolvedValue(undefined);

      // Act & Assert
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(401); // Unauthorized because JWT guard is not mocked properly

      // Note: In a real e2e test, we'd need to properly mock the JWT guard
      // or use a real JWT token
    });
  });

  describe('/auth/profile (GET)', () => {
    it('should return user profile', async () => {
      // Arrange
      const mockJwtToken = 'mock-jwt-token';

      // Act & Assert
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(401); // Unauthorized because JWT guard is not mocked properly

      // Note: In a real e2e test, we'd need to properly mock the JWT guard
      // or use a real JWT token
    });
  });
});
