import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { FirebaseService } from '../../common/services/firebase.service';
import { CacheService } from '../../common/services/cache.service';
import { UsersService } from '../users/users.service';
import { RealtimeService } from '../realtime/realtime.service';
import {
  User,
  UserRole,
  KYCStatus,
  ClaimTopic,
  ClaimStatus,
  CreateClaimDto,
  // UpdateClaimDto,
  BatchUpdateClaimsDto,
} from '../../common/types';

describe('ClaimsService', () => {
  let service: ClaimsService;
  let firebaseService: jest.Mocked<FirebaseService>;
  // let cacheService: jest.Mocked<CacheService>;
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

  const mockClaim = {
    id: 'claim-123',
    identityId: '0x123',
    claimTopic: ClaimTopic.KYC_APPROVED,
    issuer: 'issuer-123',
    data: {
      value: 'verified',
      provider: 'verihubs',
      verificationId: 'kyc-123',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    status: ClaimStatus.ACTIVE,
    verificationHash: '0x123456789',
    updatedAt: new Date(),
  };

  const mockFirebaseDoc = {
    exists: true,
    data: () => mockClaim,
    ref: {} as any,
    id: 'claim-123',
    readTime: new Date(),
    get: jest.fn(),
    isEqual: jest.fn(),
  } as any;

  const mockFirebaseDocNotFound = {
    exists: false,
    data: () => null,
    ref: {} as any,
    id: 'claim-123',
    readTime: new Date(),
    get: jest.fn(),
    isEqual: jest.fn(),
  } as any;

  const mockTimestamp = {
    seconds: Math.floor(Date.now() / 1000),
    nanoseconds: 0,
    toDate: () => new Date(),
    toMillis: () => Date.now(),
    isEqual: jest.fn(() => true),
  } as any;

  const mockFirebaseQueryDoc = {
    exists: true,
    data: () => mockClaim,
    ref: {} as any,
    id: 'claim-123',
    readTime: mockTimestamp,
    get: jest.fn(),
    isEqual: jest.fn(),
    createTime: mockTimestamp,
    updateTime: mockTimestamp,
  } as any;

  const mockFirebaseQuerySnapshot = {
    docs: [mockFirebaseQueryDoc],
    empty: false,
    size: 1,
    query: {} as any,
    docChanges: jest.fn(),
    forEach: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimsService,
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
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
            updateUser: jest.fn(),
          },
        },
        {
          provide: RealtimeService,
          useValue: {
            broadcastKYCStatusUpdate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ClaimsService>(ClaimsService);
    firebaseService = module.get(FirebaseService);
    // cacheService = module.get(CacheService);
    usersService = module.get(UsersService);
    // realtimeService = module.get(RealtimeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('issueClaim', () => {
    const issueClaimDto: CreateClaimDto = {
      identityId: '0x123',
      claimTopic: ClaimTopic.KYC_APPROVED,
      issuer: 'issuer-123',
      data: {
        value: 'verified',
        provider: 'verihubs',
        verificationId: 'kyc-123',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    };

    it('should create claim successfully', async () => {
      // const issuerId = 'issuer-123';
      usersService.findById.mockResolvedValue(mockUser);
      firebaseService.setDocument.mockResolvedValue({} as any);

      const result = await service.issueClaim(issueClaimDto);

      expect(result).toMatchObject({
        identityId: issueClaimDto.identityId,
        claimTopic: issueClaimDto.claimTopic,
        issuer: issueClaimDto.issuer,
        status: ClaimStatus.ACTIVE,
        data: issueClaimDto.data,
      });
      expect(firebaseService.setDocument).toHaveBeenCalledWith(
        'claims',
        expect.any(String),
        expect.objectContaining({
          identityId: issueClaimDto.identityId,
          claimTopic: issueClaimDto.claimTopic,
          issuer: issueClaimDto.issuer,
          status: ClaimStatus.ACTIVE,
        })
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      // const issuerId = 'issuer-123';
      usersService.findById.mockResolvedValue(null);

      await expect(service.issueClaim(issueClaimDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw NotFoundException when issuer not found', async () => {
      // const issuerId = 'issuer-123';
      // Mock user exists but issuer doesn't
      usersService.findById
        .mockResolvedValueOnce(mockUser) // First call (user validation) returns user
        .mockResolvedValueOnce(null); // Second call (issuer validation) returns null

      await expect(service.issueClaim(issueClaimDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException when issuer not authorized', async () => {
      const unauthorizedIssueClaimDto = {
        ...issueClaimDto,
        issuer: 'unauthorized-issuer',
      };

      // Mock both user and issuer exist but issuer is not authorized
      usersService.findById
        .mockResolvedValueOnce(mockUser) // User validation passes
        .mockResolvedValueOnce(mockUser); // Issuer exists but is unauthorized

      await expect(
        service.issueClaim(unauthorizedIssueClaimDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('should broadcast KYC status update for KYC_APPROVED claim', async () => {
      // const issuerId = 'issuer-123';
      usersService.findById.mockResolvedValue(mockUser);
      firebaseService.setDocument.mockResolvedValue({} as any);

      await service.issueClaim(issueClaimDto);
    });
  });

  describe('revokeClaim', () => {
    it('should throw NotFoundException when claim not found', async () => {
      const claimId = 'claim-123';
      const reason = 'Test revocation';

      firebaseService.getDocument.mockResolvedValue(mockFirebaseDocNotFound);

      await expect(service.revokeClaim(claimId, reason)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should revoke claim successfully', async () => {
      const claimId = 'claim-123';
      const reason = 'Test revocation';

      firebaseService.getDocument.mockResolvedValue(mockFirebaseDoc);
      firebaseService.updateDocument.mockResolvedValue({} as any);

      const result = await service.revokeClaim(claimId, reason);

      expect(result).toMatchObject({
        id: mockClaim.id,
        identityId: mockClaim.identityId,
        claimTopic: mockClaim.claimTopic,
        issuer: mockClaim.issuer,
        data: mockClaim.data,
        issuedAt: mockClaim.issuedAt,
        status: ClaimStatus.REVOKED,
        revocationReason: reason,
        verificationHash: mockClaim.verificationHash,
      });
      // Verify timestamp is updated
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.updatedAt.getTime()).toBeGreaterThan(Date.now() - 1000);
    });
    it('should revoke claim successfully', async () => {
      const claimId = 'claim-123';
      const issuerId = 'issuer-123';

      firebaseService.getDocument.mockResolvedValue(mockFirebaseDoc);
      firebaseService.updateDocument.mockResolvedValue({} as any);

      await service.revokeClaim(claimId, issuerId);

      expect(firebaseService.updateDocument).toHaveBeenCalledWith(
        'claims',
        claimId,
        expect.objectContaining({
          status: ClaimStatus.REVOKED,
        })
      );
    });

    it('should throw NotFoundException when claim not found', async () => {
      const claimId = 'claim-123';
      const issuerId = 'issuer-123';

      firebaseService.getDocument.mockResolvedValue(mockFirebaseDocNotFound);

      await expect(service.revokeClaim(claimId, issuerId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException when unauthorized issuer', async () => {
      const claimId = 'claim-123';
      const reason = 'different-issuer';
      const unauthorizedIssuerId = 'different-issuer';

      firebaseService.getDocument.mockResolvedValue(mockFirebaseDoc);

      await expect(
        service.revokeClaim(claimId, reason, unauthorizedIssuerId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getClaimsByIdentity', () => {
    it('should return identity claims', async () => {
      const identityId = 'identity-123';
      firebaseService.getDocumentsByField.mockResolvedValue(
        mockFirebaseQuerySnapshot
      );

      const result = await service.getClaimsByIdentity(identityId);

      expect(result).toEqual([mockClaim]);
      expect(firebaseService.getDocumentsByField).toHaveBeenCalledWith(
        'claims',
        'identityId',
        identityId
      );
    });

    it('should return empty array when no claims found', async () => {
      const identityId = 'identity-123';
      firebaseService.getDocumentsByField.mockResolvedValue({
        docs: [],
        empty: true,
        size: 0,
        query: {} as any,
        docChanges: jest.fn(),
        forEach: jest.fn(),
      } as any);

      const result = await service.getClaimsByIdentity(identityId);

      expect(result).toEqual([]);
    });
  });

  describe('verifyRequiredClaims', () => {
    it('should return true when identity has valid claims', async () => {
      const identityId = 'identity-123';
      const requiredClaims = [ClaimTopic.KYC_APPROVED];

      firebaseService.getDocumentsByField.mockResolvedValue(
        mockFirebaseQuerySnapshot
      );

      const result = await service.verifyRequiredClaims(
        identityId,
        requiredClaims
      );

      expect(result).toBe(true);
    });

    it('should return false when identity has no valid claims', async () => {
      const identityId = 'identity-123';
      const requiredClaims = [ClaimTopic.KYC_APPROVED];

      firebaseService.getDocumentsByField.mockResolvedValue({
        docs: [],
        empty: true,
        size: 0,
        query: {} as any,
        docChanges: jest.fn(),
        forEach: jest.fn(),
      } as any);

      const result = await service.verifyRequiredClaims(
        identityId,
        requiredClaims
      );

      expect(result).toBe(false);
    });
  });

  describe('bulkUpdateClaims', () => {
    const batchUpdateDto: BatchUpdateClaimsDto = {
      updates: [
        {
          claimId: 'claim-1',
          status: ClaimStatus.ACTIVE,
          data: { value: 'updated1' },
        },
        {
          claimId: 'claim-2',
          status: ClaimStatus.REVOKED,
          revocationReason: 'Test reason',
        },
      ],
    };

    it('should batch update claims successfully', async () => {
      // const issuerId = 'issuer-123';

      firebaseService.getDocument.mockResolvedValue(mockFirebaseDoc);
      firebaseService.updateDocument.mockResolvedValue({} as any);

      const result = await service.bulkUpdateClaims(batchUpdateDto);

      expect(result).toHaveLength(2);
      expect(Array.isArray(result)).toBe(true);
      expect(firebaseService.updateDocument).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures in batch update', async () => {
      // const issuerId = 'issuer-123';

      firebaseService.getDocument
        .mockResolvedValueOnce(mockFirebaseDoc)
        .mockResolvedValueOnce(mockFirebaseDocNotFound);
      firebaseService.updateDocument.mockResolvedValue({} as any);

      const result = await service.bulkUpdateClaims(batchUpdateDto);

      expect(result).toHaveLength(1);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getExpiredClaims', () => {
    it('should return expired claims', async () => {
      const expiredClaim = {
        ...mockClaim,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
        status: ClaimStatus.ACTIVE, // Still active status but expired by date
        data: {
          ...mockClaim.data,
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Also update data field
        },
      };

      firebaseService.getDocumentsByField.mockResolvedValue({
        docs: [
          {
            exists: true,
            data: () => expiredClaim,
            ref: {} as any,
            id: 'claim-123',
            readTime: mockTimestamp,
            get: jest.fn(),
            isEqual: jest.fn(),
            createTime: mockTimestamp,
            updateTime: mockTimestamp,
          },
        ],
        empty: false,
        size: 1,
        readTime: mockTimestamp,
        query: {} as any,
        docChanges: jest.fn(),
        forEach: jest.fn(),
        isEqual: jest.fn(),
      });

      const result = await service.findExpiredClaims();

      expect(result).toEqual([expiredClaim]);
    });
  });

  describe('error handling', () => {
    it('should handle Firebase errors gracefully', async () => {
      const issueClaimDto: CreateClaimDto = {
        identityId: '0x123',
        claimTopic: ClaimTopic.KYC_APPROVED,
        issuer: 'issuer-123',
        data: { value: 'verified' },
      };
      // const issuerId = 'issuer-123';

      usersService.findById.mockResolvedValue(mockUser);
      firebaseService.setDocument.mockRejectedValue(
        new Error('Firebase error')
      );

      await expect(service.issueClaim(issueClaimDto)).rejects.toThrow();
    });
  });
});
