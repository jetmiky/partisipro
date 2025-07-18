export enum UserRole {
  INVESTOR = 'investor',
  SPV = 'spv',
  ADMIN = 'admin',
}

export enum KYCStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface Address {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface KYCDocument {
  id: string;
  type: 'identity_card' | 'passport' | 'driver_license' | 'bank_statement';
  url: string;
  uploadedAt: Date;
  verified: boolean;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: Date;
  nationality: string;
  address: Address;
}

export interface KYCData {
  status: KYCStatus;
  provider: string;
  verificationId: string;
  submittedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  documents: KYCDocument[];
}

export interface User {
  id: string;
  email: string;
  walletAddress: string;
  web3AuthId?: string;
  firebaseUid?: string;
  profile: UserProfile;
  kyc: KYCData;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
