import { Test, TestingModule } from '@nestjs/testing';
import {
  // BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { IdentityService } from './identity.service';
import { FirebaseService } from '../../common/services/firebase.service';
import { CacheService } from '../../common/services/cache.service';
import { ClaimsService } from '../claims/claims.service';
import { UsersService } from '../users/users.service';
import { RealtimeService } from '../realtime/realtime.service';
import {
  User,
  UserRole,
  KYCStatus,
  ClaimTopic,
  ClaimStatus,
} from '../../common/types';
// import { BatchRegisterIdentitiesDto, VerifyIdentityDto } from './dto';

describe('IdentityService', () => {
  let service: IdentityService;
  let firebaseService: jest.Mocked<FirebaseService>;
  // let cacheService: jest.Mocked<CacheService>;
  // let claimsService: jest.Mocked<ClaimsService>;
  let usersService: jest.Mocked<UsersService>;
  // let realtimeService: jest.Mocked<RealtimeService>;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    walletAddress: '0x123',
    web3AuthId: 'web3auth-123',
    profile: {
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '+62123456789',
      dateOfBirth: new Date('1990-01-01'),
      nationality: 'ID',
      address: {
        street: 'Test Street',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '12345',
        country: 'Indonesia',
      },
    },
    role: UserRole.INVESTOR,
    kyc: {
      status: KYCStatus.APPROVED,
      provider: 'verihubs',
      verificationId: 'kyc-123',
      submittedAt: new Date(),
      approvedAt: new Date(),
      documents: [],
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTimestamp = {
    seconds: Math.floor(Date.now() / 1000),
    nanoseconds: 0,
    toDate: () => new Date(),
    toMillis: () => Date.now(),
    isEqual: jest.fn(() => true),
  } as any;

  const mockIdentity = {
    id: '0x123',
    userId: 'user-123',
    identityKey: 'identity_key_123',
    status: 'verified' as any,
    claims: [
      {
        claimId: 'claim-123',
        claimTopic: ClaimTopic.KYC_APPROVED,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: ClaimStatus.ACTIVE,
      },
    ],
    trustedIssuers: ['issuer-123'],
    createdAt: new Date(),
    verifiedAt: new Date(),
    lastUpdated: new Date(),
    metadata: {
      provider: 'verihubs',
      verificationId: 'kyc-123',
      completedAt: new Date(),
    },
  };

  const mockFirebaseDoc = {
    exists: true,
    data: () => mockIdentity,
    ref: {} as any,
    id: 'identity-123',
    readTime: mockTimestamp,
    get: jest.fn(),
    isEqual: jest.fn(),
  } as any;

  const mockFirebaseDocNotFound = {
    exists: false,
    data: () => null,
    ref: {} as any,
    id: 'identity-123',
    readTime: mockTimestamp,
    get: jest.fn(),
    isEqual: jest.fn(),
  } as any;

  // const mockFirebaseQueryDoc = {
  //   exists: true,
  //   data: () => mockIdentity,
  //   ref: {} as any,
  //   id: 'identity-123',
  //   readTime: mockTimestamp,
  //   get: jest.fn(),
  //   isEqual: jest.fn(),
  //   createTime: mockTimestamp,
  //   updateTime: mockTimestamp,
  // } as any;

  // const mockFirebaseQuerySnapshot = {
  //   docs: [mockFirebaseQueryDoc],
  //   empty: false,
  //   size: 1,
  //   readTime: mockTimestamp,
  //   query: {} as any,
  //   docChanges: jest.fn(),
  //   forEach: jest.fn(),
  // } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentityService,
        {
          provide: FirebaseService,
          useValue: {
            getDocument: jest.fn(),
            setDocument: jest.fn(),
            addDocument: jest.fn(),
            updateDocument: jest.fn(),
            deleteDocument: jest.fn(),
            getDocumentsByField: jest.fn(),
            getDocuments: jest.fn(),
            getTimestamp: jest.fn(() => new Date()),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            keys: jest.fn(),
            exists: jest.fn(),
            increment: jest.fn(),
            decrement: jest.fn(),
            expire: jest.fn(),
            getTtl: jest.fn(),
          },
        },
        {
          provide: ClaimsService,
          useValue: {
            createClaim: jest.fn(),
            getUserClaims: jest.fn(),
            hasValidClaim: jest.fn(),
            batchUpdateClaims: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
            findByWalletAddress: jest.fn(),
            updateUser: jest.fn(),
            updateKYCStatus: jest.fn(),
          },
        },
        {
          provide: RealtimeService,
          useValue: {
            broadcastKYCStatusUpdate: jest.fn(),
          },
        },
        {
          provide: 'BLOCKCHAIN_SERVICE',
          useValue: {
            deployContract: jest.fn(),
            isInvestorVerified: jest.fn(),
            getUserIdentity: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IdentityService>(IdentityService);
    firebaseService = module.get(FirebaseService);
    // cacheService = module.get(CacheService);
    // claimsService = module.get(ClaimsService);
    usersService = module.get(UsersService);
    // realtimeService = module.get(RealtimeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerIdentity', () => {
    const userAddress = '0x123';
    const registerDto = {
      userAddress: '0x123',
      userId: 'user-123',
      metadata: {
        provider: 'verihubs',
        verificationId: 'kyc-123',
      },
    };

    it('should register identity successfully', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      firebaseService.getDocument.mockResolvedValue(mockFirebaseDocNotFound);
      firebaseService.setDocument.mockResolvedValue({} as any);

      const result = await service.registerIdentity(userAddress, registerDto);

      expect(result).toMatchObject({
        id: registerDto.userAddress,
        userId: registerDto.userId,
        status: 'pending',
        metadata: registerDto.metadata,
      });
      expect(firebaseService.setDocument).toHaveBeenCalledWith(
        'identity_registry',
        userAddress,
        expect.objectContaining({
          userId: registerDto.userId,
          status: 'pending',
        })
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      usersService.findById.mockResolvedValue(null);
      firebaseService.getDocument.mockResolvedValue(mockFirebaseDocNotFound);

      await expect(
        service.registerIdentity(userAddress, registerDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when identity already exists', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      firebaseService.getDocument.mockResolvedValue(mockFirebaseDoc);

      await expect(
        service.registerIdentity(userAddress, registerDto)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('verifyIdentity', () => {
    const userAddress = '0x123456789';
    const requiredClaims = [ClaimTopic.KYC_APPROVED];

    it('should verify identity successfully', async () => {
      // const issuerId = 'issuer-123';

      firebaseService.getDocument.mockResolvedValue(mockFirebaseDoc);

      const result = await service.verifyIdentity(userAddress, requiredClaims);

      expect(result).toMatchObject({
        isVerified: true,
        identity: mockIdentity,
      });
      expect(firebaseService.getDocument).toHaveBeenCalledWith(
        'identity_registry',
        userAddress
      );
    });

    it('should return false when identity not found', async () => {
      firebaseService.getDocument.mockResolvedValue(mockFirebaseDocNotFound);

      const result = await service.verifyIdentity(userAddress, requiredClaims);

      expect(result).toMatchObject({
        isVerified: false,
        reason: 'Identity not found',
      });
    });

    it('should return false when required claims are missing', async () => {
      const identityWithoutClaims = {
        ...mockIdentity,
        claims: [],
      };
      const mockDocWithoutClaims = {
        ...mockFirebaseDoc,
        data: () => identityWithoutClaims,
      };

      firebaseService.getDocument.mockResolvedValue(mockDocWithoutClaims);

      const result = await service.verifyIdentity(userAddress, requiredClaims);

      expect(result).toMatchObject({
        isVerified: false,
        reason: 'Required claims missing or expired',
      });
    });
  });

  describe('updateIdentityStatus', () => {
    const userAddress = '0x123';
    const updateDto = {
      status: 'verified' as any,
    };

    it('should update identity status successfully', async () => {
      firebaseService.getDocument.mockResolvedValue(mockFirebaseDoc);
      firebaseService.updateDocument.mockResolvedValue({} as any);

      const result = await service.updateIdentityStatus(userAddress, updateDto);

      expect(result).toMatchObject({
        id: mockIdentity.id,
        userId: mockIdentity.userId,
        identityKey: mockIdentity.identityKey,
        status: updateDto.status,
        claims: mockIdentity.claims,
        trustedIssuers: mockIdentity.trustedIssuers,
        createdAt: mockIdentity.createdAt,
        metadata: mockIdentity.metadata,
      });
      // Verify timestamps are updated (should be recent dates)
      expect(result.lastUpdated).toBeInstanceOf(Date);
      expect(result.verifiedAt).toBeInstanceOf(Date);
      expect(result.lastUpdated.getTime()).toBeGreaterThan(Date.now() - 1000); // Within last second
      expect(result.verifiedAt.getTime()).toBeGreaterThan(Date.now() - 1000); // Within last second

      expect(firebaseService.updateDocument).toHaveBeenCalledWith(
        'identity_registry',
        userAddress,
        expect.objectContaining({
          status: updateDto.status,
          lastUpdated: expect.any(Date),
          verifiedAt: expect.any(Date),
        })
      );
    });

    it('should throw NotFoundException when identity not found', async () => {
      firebaseService.getDocument.mockResolvedValue(mockFirebaseDocNotFound);

      await expect(
        service.updateIdentityStatus(userAddress, updateDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getIdentity', () => {
    it('should return identity when found', async () => {
      const userAddress = '0x123';
      firebaseService.getDocument.mockResolvedValue(mockFirebaseDoc);

      const result = await service.getIdentity(userAddress);

      expect(result).toEqual(mockIdentity);
      expect(firebaseService.getDocument).toHaveBeenCalledWith(
        'identity_registry',
        userAddress
      );
    });

    it('should return null when identity not found', async () => {
      const userAddress = '0x123';
      firebaseService.getDocument.mockResolvedValue(mockFirebaseDocNotFound);

      const result = await service.getIdentity(userAddress);

      expect(result).toBeNull();
    });
  });
});
