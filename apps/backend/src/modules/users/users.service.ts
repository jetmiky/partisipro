import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../common/services/firebase.service';
import { User, UserRole, KYCStatus } from '../../common/types';
import { UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly COLLECTION_NAME = 'users';

  constructor(private firebaseService: FirebaseService) {}

  async findOrCreateUser(userData: {
    email: string;
    walletAddress: string;
    web3AuthId?: string;
    firebaseUid?: string;
  }): Promise<User> {
    // First, try to find user by email
    const existingUsers = await this.firebaseService.getDocumentsByField(
      this.COLLECTION_NAME,
      'email',
      userData.email
    );

    if (!existingUsers.empty) {
      const userDoc = existingUsers.docs[0];
      const user = { id: userDoc.id, ...userDoc.data() } as User;

      // Update wallet address if it has changed
      if (user.walletAddress !== userData.walletAddress) {
        await this.firebaseService.updateDocument(
          this.COLLECTION_NAME,
          user.id,
          {
            walletAddress: userData.walletAddress,
            updatedAt: this.firebaseService.getTimestamp(),
          }
        );
        user.walletAddress = userData.walletAddress;
      }

      return user;
    }

    // Create new user
    const newUser: Omit<User, 'id'> = {
      email: userData.email,
      walletAddress: userData.walletAddress,
      web3AuthId: userData.web3AuthId,
      firebaseUid: userData.firebaseUid,
      profile: {
        firstName: '',
        lastName: '',
        phoneNumber: '',
        dateOfBirth: new Date(),
        nationality: 'ID',
        address: {
          street: '',
          city: '',
          province: '',
          postalCode: '',
          country: 'Indonesia',
        },
      },
      kyc: {
        status: KYCStatus.PENDING,
        provider: '',
        verificationId: '',
        submittedAt: new Date(),
        documents: [],
      },
      role: UserRole.INVESTOR,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userId = await this.firebaseService.addDocument(
      this.COLLECTION_NAME,
      newUser
    );

    this.logger.log(`New user created: ${userData.email}`);
    return { id: userId, ...newUser };
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.firebaseService.getDocument(
      this.COLLECTION_NAME,
      id
    );

    if (!doc.exists) {
      return null;
    }

    return { id: doc.id, ...doc.data() } as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    const docs = await this.firebaseService.getDocumentsByField(
      this.COLLECTION_NAME,
      'email',
      email
    );

    if (docs.empty) {
      return null;
    }

    const userDoc = docs.docs[0];
    return { id: userDoc.id, ...userDoc.data() } as User;
  }

  async findByWalletAddress(walletAddress: string): Promise<User | null> {
    const docs = await this.firebaseService.getDocumentsByField(
      this.COLLECTION_NAME,
      'walletAddress',
      walletAddress
    );

    if (docs.empty) {
      return null;
    }

    const userDoc = docs.docs[0];
    return { id: userDoc.id, ...userDoc.data() } as User;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData = {
      ...updateUserDto,
      updatedAt: this.firebaseService.getTimestamp(),
    };

    await this.firebaseService.updateDocument(
      this.COLLECTION_NAME,
      id,
      updateData
    );

    return this.findById(id);
  }

  async updateKYCStatus(
    id: string,
    status: KYCStatus,
    additionalData?: Partial<User['kyc']>
  ): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const kycUpdateData = {
      ...user.kyc,
      status,
      ...additionalData,
      ...(status === KYCStatus.APPROVED && { approvedAt: new Date() }),
      ...(status === KYCStatus.REJECTED && { rejectedAt: new Date() }),
    };

    await this.firebaseService.updateDocument(this.COLLECTION_NAME, id, {
      kyc: kycUpdateData,
      updatedAt: this.firebaseService.getTimestamp(),
    });

    this.logger.log(`KYC status updated for user ${id}: ${status}`);
    return this.findById(id);
  }

  async deactivateUser(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.firebaseService.updateDocument(this.COLLECTION_NAME, id, {
      isActive: false,
      updatedAt: this.firebaseService.getTimestamp(),
    });

    this.logger.log(`User deactivated: ${id}`);
    return this.findById(id);
  }

  async getAllUsers(limit: number = 50, startAfter?: string): Promise<User[]> {
    const query = (ref: FirebaseFirestore.Query) => {
      let q = ref.orderBy('createdAt', 'desc').limit(limit);
      if (startAfter) {
        q = q.startAfter(startAfter);
      }
      return q;
    };

    const docs = await this.firebaseService.getDocuments(
      this.COLLECTION_NAME,
      query
    );

    return docs.docs.map(doc => ({ id: doc.id, ...doc.data() }) as User);
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    const docs = await this.firebaseService.getDocumentsByField(
      this.COLLECTION_NAME,
      'role',
      role
    );

    return docs.docs.map(doc => ({ id: doc.id, ...doc.data() }) as User);
  }

  async getUsersByKYCStatus(status: KYCStatus): Promise<User[]> {
    const docs = await this.firebaseService.getDocumentsByField(
      this.COLLECTION_NAME,
      'kyc.status',
      status
    );

    return docs.docs.map(doc => ({ id: doc.id, ...doc.data() }) as User);
  }
}
