import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, Logger } from '@nestjs/common';
import { UsersService } from './users.service';
import { FirebaseService } from '../../common/services/firebase.service';
import { User, UserRole, KYCStatus } from '../../common/types';
import { UpdateUserDto } from './dto';

describe('UsersService', () => {
  let service: UsersService;
  let firebaseService: FirebaseService;

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
      status: KYCStatus.PENDING,
      provider: 'verihubs',
      verificationId: 'kyc-test-id',
      submittedAt: new Date(),
      documents: [],
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFirebaseDocumentSnapshot = {
    exists: true,
    id: 'test-user-id',
    data: () => mockUser,
  } as any;

  const mockFirebaseQuerySnapshot = {
    empty: false,
    docs: [mockFirebaseDocumentSnapshot],
  } as any;

  const mockEmptyQuerySnapshot = {
    empty: true,
    docs: [],
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: FirebaseService,
          useValue: {
            getDocumentsByField: jest.fn(),
            updateDocument: jest.fn(),
            getTimestamp: jest.fn(),
            addDocument: jest.fn(),
            getDocument: jest.fn(),
            getDocuments: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    firebaseService = module.get<FirebaseService>(FirebaseService);

    // Default mock implementations
    jest
      .spyOn(firebaseService, 'getTimestamp')
      .mockReturnValue(new Date() as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOrCreateUser', () => {
    const userData = {
      email: 'test@example.com',
      walletAddress: '0x1234567890123456789012345678901234567890',
      web3AuthId: 'web3auth-test-id',
    };

    it('should return existing user when found by email', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocumentsByField')
        .mockResolvedValue(mockFirebaseQuerySnapshot);

      // Act
      const result = await service.findOrCreateUser(userData);

      // Assert
      expect(result).toEqual(mockUser);
      expect(firebaseService.getDocumentsByField).toHaveBeenCalledWith(
        'users',
        'email',
        userData.email
      );
    });

    it('should update wallet address when it has changed', async () => {
      // Arrange
      const userWithOldWallet = {
        ...mockUser,
        walletAddress: '0xoldaddress',
      };
      const mockQueryWithOldWallet = {
        empty: false,
        docs: [
          {
            id: 'test-user-id',
            data: () => userWithOldWallet,
          },
        ],
      } as any;

      jest
        .spyOn(firebaseService, 'getDocumentsByField')
        .mockResolvedValue(mockQueryWithOldWallet);
      jest
        .spyOn(firebaseService, 'updateDocument')
        .mockResolvedValue(undefined);

      // Act
      const result = await service.findOrCreateUser(userData);

      // Assert
      expect(firebaseService.updateDocument).toHaveBeenCalledWith(
        'users',
        'test-user-id',
        {
          walletAddress: userData.walletAddress,
          updatedAt: expect.any(Date),
        }
      );
      expect(result.walletAddress).toBe(userData.walletAddress);
    });

    it('should create new user when not found', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocumentsByField')
        .mockResolvedValue(mockEmptyQuerySnapshot);
      jest
        .spyOn(firebaseService, 'addDocument')
        .mockResolvedValue('new-user-id');

      // Act
      const result = await service.findOrCreateUser(userData);

      // Assert
      expect(firebaseService.addDocument).toHaveBeenCalledWith(
        'users',
        expect.objectContaining({
          email: userData.email,
          walletAddress: userData.walletAddress,
          web3AuthId: userData.web3AuthId,
          role: UserRole.INVESTOR,
          isActive: true,
          profile: expect.objectContaining({
            firstName: '',
            lastName: '',
            nationality: 'ID',
            address: expect.objectContaining({
              country: 'Indonesia',
            }),
          }),
          kyc: expect.objectContaining({
            status: KYCStatus.PENDING,
          }),
        })
      );
      expect(result.id).toBe('new-user-id');
    });

    it('should log when creating new user', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocumentsByField')
        .mockResolvedValue(mockEmptyQuerySnapshot);
      jest
        .spyOn(firebaseService, 'addDocument')
        .mockResolvedValue('new-user-id');
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      // Act
      await service.findOrCreateUser(userData);

      // Assert
      expect(logSpy).toHaveBeenCalledWith(
        `New user created: ${userData.email}`
      );
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocument')
        .mockResolvedValue(mockFirebaseDocumentSnapshot);

      // Act
      const result = await service.findById('test-user-id');

      // Assert
      expect(result).toEqual(mockUser);
      expect(firebaseService.getDocument).toHaveBeenCalledWith(
        'users',
        'test-user-id'
      );
    });

    it('should return null when user not found', async () => {
      // Arrange
      jest.spyOn(firebaseService, 'getDocument').mockResolvedValue({
        exists: false,
        id: 'test-user-id',
        data: () => null,
      } as any);

      // Act
      const result = await service.findById('test-user-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocumentsByField')
        .mockResolvedValue(mockFirebaseQuerySnapshot);

      // Act
      const result = await service.findByEmail('test@example.com');

      // Assert
      expect(result).toEqual(mockUser);
      expect(firebaseService.getDocumentsByField).toHaveBeenCalledWith(
        'users',
        'email',
        'test@example.com'
      );
    });

    it('should return null when user not found', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocumentsByField')
        .mockResolvedValue(mockEmptyQuerySnapshot);

      // Act
      const result = await service.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByWalletAddress', () => {
    it('should return user when found', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocumentsByField')
        .mockResolvedValue(mockFirebaseQuerySnapshot);

      // Act
      const result = await service.findByWalletAddress(
        '0x1234567890123456789012345678901234567890'
      );

      // Assert
      expect(result).toEqual(mockUser);
      expect(firebaseService.getDocumentsByField).toHaveBeenCalledWith(
        'users',
        'walletAddress',
        '0x1234567890123456789012345678901234567890'
      );
    });

    it('should return null when user not found', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocumentsByField')
        .mockResolvedValue(mockEmptyQuerySnapshot);

      // Act
      const result = await service.findByWalletAddress('0xnonexistent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    const updateUserDto: UpdateUserDto = {
      profile: {
        firstName: 'Updated',
        lastName: 'Name',
        phoneNumber: '+9876543210',
        dateOfBirth: '1985-01-01',
        nationality: 'ID',
        address: {
          street: 'Updated Street',
          city: 'Updated City',
          province: 'Updated Province',
          postalCode: '54321',
          country: 'Indonesia',
        },
      },
    };

    it('should update user successfully', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocument')
        .mockResolvedValue(mockFirebaseDocumentSnapshot);
      jest
        .spyOn(firebaseService, 'updateDocument')
        .mockResolvedValue(undefined);

      // Act
      const result = await service.updateUser('test-user-id', updateUserDto);

      // Assert
      expect(firebaseService.updateDocument).toHaveBeenCalledWith(
        'users',
        'test-user-id',
        {
          ...updateUserDto,
          updatedAt: expect.any(Date),
        }
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      jest.spyOn(firebaseService, 'getDocument').mockResolvedValue({
        exists: false,
        id: 'test-user-id',
        data: () => null,
      } as any);

      // Act & Assert
      await expect(
        service.updateUser('test-user-id', updateUserDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateKYCStatus', () => {
    it('should update KYC status to approved', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocument')
        .mockResolvedValue(mockFirebaseDocumentSnapshot);
      jest
        .spyOn(firebaseService, 'updateDocument')
        .mockResolvedValue(undefined);
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      // Act
      const result = await service.updateKYCStatus(
        'test-user-id',
        KYCStatus.APPROVED
      );

      // Assert
      expect(firebaseService.updateDocument).toHaveBeenCalledWith(
        'users',
        'test-user-id',
        {
          kyc: {
            ...mockUser.kyc,
            status: KYCStatus.APPROVED,
            approvedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        }
      );
      expect(logSpy).toHaveBeenCalledWith(
        `KYC status updated for user test-user-id: ${KYCStatus.APPROVED}`
      );
      expect(result).toEqual(mockUser);
    });

    it('should update KYC status to rejected', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocument')
        .mockResolvedValue(mockFirebaseDocumentSnapshot);
      jest
        .spyOn(firebaseService, 'updateDocument')
        .mockResolvedValue(undefined);

      // Act
      await service.updateKYCStatus('test-user-id', KYCStatus.REJECTED);

      // Assert
      expect(firebaseService.updateDocument).toHaveBeenCalledWith(
        'users',
        'test-user-id',
        {
          kyc: {
            ...mockUser.kyc,
            status: KYCStatus.REJECTED,
            rejectedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        }
      );
    });

    it('should update KYC status with additional data', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocument')
        .mockResolvedValue(mockFirebaseDocumentSnapshot);
      jest
        .spyOn(firebaseService, 'updateDocument')
        .mockResolvedValue(undefined);

      const additionalData = {
        provider: 'updated-provider',
        verificationId: 'updated-verification-id',
      };

      // Act
      await service.updateKYCStatus(
        'test-user-id',
        KYCStatus.APPROVED,
        additionalData
      );

      // Assert
      expect(firebaseService.updateDocument).toHaveBeenCalledWith(
        'users',
        'test-user-id',
        {
          kyc: {
            ...mockUser.kyc,
            status: KYCStatus.APPROVED,
            ...additionalData,
            approvedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        }
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      jest.spyOn(firebaseService, 'getDocument').mockResolvedValue({
        exists: false,
        id: 'test-user-id',
        data: () => null,
      } as any);

      // Act & Assert
      await expect(
        service.updateKYCStatus('test-user-id', KYCStatus.APPROVED)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocument')
        .mockResolvedValue(mockFirebaseDocumentSnapshot);
      jest
        .spyOn(firebaseService, 'updateDocument')
        .mockResolvedValue(undefined);
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      // Act
      const result = await service.deactivateUser('test-user-id');

      // Assert
      expect(firebaseService.updateDocument).toHaveBeenCalledWith(
        'users',
        'test-user-id',
        {
          isActive: false,
          updatedAt: expect.any(Date),
        }
      );
      expect(logSpy).toHaveBeenCalledWith('User deactivated: test-user-id');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      jest.spyOn(firebaseService, 'getDocument').mockResolvedValue({
        exists: false,
        id: 'test-user-id',
        data: () => null,
      } as any);

      // Act & Assert
      await expect(service.deactivateUser('test-user-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getAllUsers', () => {
    it('should return all users with default pagination', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocuments')
        .mockResolvedValue(mockFirebaseQuerySnapshot);

      // Act
      const result = await service.getAllUsers();

      // Assert
      expect(result).toEqual([mockUser]);
      expect(firebaseService.getDocuments).toHaveBeenCalledWith(
        'users',
        expect.any(Function)
      );
    });

    it('should return users with custom pagination', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocuments')
        .mockResolvedValue(mockFirebaseQuerySnapshot);

      // Act
      const result = await service.getAllUsers(10, 'start-after-id');

      // Assert
      expect(result).toEqual([mockUser]);
      expect(firebaseService.getDocuments).toHaveBeenCalledWith(
        'users',
        expect.any(Function)
      );
    });
  });

  describe('getUsersByRole', () => {
    it('should return users by role', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocumentsByField')
        .mockResolvedValue(mockFirebaseQuerySnapshot);

      // Act
      const result = await service.getUsersByRole(UserRole.INVESTOR);

      // Assert
      expect(result).toEqual([mockUser]);
      expect(firebaseService.getDocumentsByField).toHaveBeenCalledWith(
        'users',
        'role',
        UserRole.INVESTOR
      );
    });
  });

  describe('getUsersByKYCStatus', () => {
    it('should return users by KYC status', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocumentsByField')
        .mockResolvedValue(mockFirebaseQuerySnapshot);

      // Act
      const result = await service.getUsersByKYCStatus(KYCStatus.APPROVED);

      // Assert
      expect(result).toEqual([mockUser]);
      expect(firebaseService.getDocumentsByField).toHaveBeenCalledWith(
        'users',
        'kyc.status',
        KYCStatus.APPROVED
      );
    });
  });

  describe('error handling', () => {
    it('should handle Firebase errors gracefully', async () => {
      // Arrange
      jest
        .spyOn(firebaseService, 'getDocument')
        .mockRejectedValue(new Error('Firebase error'));

      // Act & Assert
      await expect(service.findById('test-user-id')).rejects.toThrow(
        'Firebase error'
      );
    });

    it('should handle null data from Firebase', async () => {
      // Arrange
      jest.spyOn(firebaseService, 'getDocument').mockResolvedValue({
        exists: true,
        id: 'test-user-id',
        data: () => null,
      } as any);

      // Act
      const result = await service.findById('test-user-id');

      // Assert
      expect(result).toEqual({ id: 'test-user-id' });
    });
  });
});
